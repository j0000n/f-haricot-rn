import { getAuthUserId } from "@convex-dev/auth/server";
import { action, mutation } from "./_generated/server";
import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

import type { UserInventoryEntry } from "../types/food";

const modelName = "gpt-4o-mini";

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const uniqueStrings = (values: string[]): string[] => {
  const seen = new Set<string>();
  for (const entry of values) {
    const normalized = normalize(entry);
    if (!seen.has(normalized) && normalized.trim().length > 0) {
      seen.add(normalized);
    }
  }
  return Array.from(seen);
};

type LibraryDescriptor = {
  itemCode: string;
  names: string[];
  varieties: Array<{
    varietyCode: string;
    names: string[];
  }>;
};

type LibraryIndexEntry = {
  shelfLifeDays: number;
  storageLocation: Doc<"foodLibrary">["storageLocation"];
  varietyCodes: Set<string>;
};

const buildLibraryDescriptors = (library: Doc<"foodLibrary">[]): LibraryDescriptor[] => {
  return library.map((item) => {
    const baseNames = [
      item.name,
      item.translations.en?.singular ?? "",
      item.translations.en?.plural ?? "",
    ];

    // Add standardized name if available
    if (item.standardizedName) {
      baseNames.push(item.standardizedName);
    }

    // Add aliases if available
    if (item.aliases && item.aliases.length > 0) {
      baseNames.push(...item.aliases);
    }

    for (const translation of Object.values(item.translations)) {
      if (translation?.singular) {
        baseNames.push(translation.singular);
      }
      if (translation?.plural) {
        baseNames.push(translation.plural);
      }
    }

    const varieties = item.varieties.map((variety) => {
      const varietyNames: string[] = [variety.code];
      for (const value of Object.values(variety.translations)) {
        varietyNames.push(value);
      }
      return {
        varietyCode: variety.code,
        names: uniqueStrings(varietyNames),
      };
    });

    return {
      itemCode: item.code,
      names: uniqueStrings([...baseNames, item.code, item.namespace]),
      varieties,
    };
  });
};

const buildLibraryIndex = (library: Doc<"foodLibrary">[]): Map<string, LibraryIndexEntry> => {
  const index = new Map<string, LibraryIndexEntry>();
  for (const item of library) {
    index.set(item.code, {
      shelfLifeDays: item.shelfLifeDays,
      storageLocation: item.storageLocation,
      varietyCodes: new Set(item.varieties.map((variety) => variety.code)),
    });
  }
  return index;
};

const buildNameLookup = (
  descriptors: LibraryDescriptor[],
): {
  itemNameMap: Map<string, { itemCode: string; varietyCode?: string }>;
  varietyNameMap: Map<string, Map<string, string>>;
} => {
  const itemNameMap = new Map<string, { itemCode: string; varietyCode?: string }>();
  const varietyNameMap = new Map<string, Map<string, string>>();

  for (const item of descriptors) {
    for (const name of item.names) {
      itemNameMap.set(normalize(name), { itemCode: item.itemCode });
    }
    const varietyMap = new Map<string, string>();
    for (const variety of item.varieties) {
      for (const name of variety.names) {
        const normalizedName = normalize(name);
        itemNameMap.set(normalizedName, { itemCode: item.itemCode, varietyCode: variety.varietyCode });
        varietyMap.set(normalizedName, variety.varietyCode);
      }
    }
    varietyNameMap.set(item.itemCode, varietyMap);
  }

  return { itemNameMap, varietyNameMap };
};

type InventoryUpdate = {
  itemCode: string;
  varietyCode?: string;
  quantity: number;
  note?: string;
  operation?: "add" | "decrement" | "remove";
};

type MappingResponse = {
  transcript: string;
  items: InventoryUpdate[];
  warnings?: string[];
};

const buildPrompt = (transcript: string, descriptors: LibraryDescriptor[]) => {
  const catalog = descriptors.map((entry) => ({
    itemCode: entry.itemCode,
    names: entry.names,
    varieties: entry.varieties.map((variety) => ({
      varietyCode: variety.varietyCode,
      names: variety.names,
    })),
  }));

  return `You convert grocery-related speech transcripts into structured inventory updates. ` +
    `Use the provided catalog of inventory items and their codes. ` +
    `Only return items that clearly match the transcript. ` +
    `Prefer brand-specific items (for example, "oreo cookies") when the transcript includes a brand name. ` +
    `If quantity is not specified, assume quantity 1. ` +
    `Prefer whole numbers and round to the nearest integer when needed. ` +
    `When varieties are mentioned, map them to the corresponding variety code. ` +
    `If no variety is given, omit varietyCode. ` +
    `If the transcript indicates items are being removed or used up, set operation to "decrement" ` +
    `when a quantity is specified or "remove" when the item should be removed entirely. ` +
    `Otherwise, omit operation or set it to "add". ` +
    `Always use itemCode values exactly as listed in the catalog. Do not invent new codes. ` +
    `Always respond with valid JSON that follows the provided schema. ` +
    `Transcript: ${transcript}\n\nCatalog: ${JSON.stringify(catalog)}.`;
};

export const mapSpeechToInventory = action({
  args: { transcript: v.string() },
  handler: async (ctx, args): Promise<MappingResponse> => {
    const normalizedTranscript = args.transcript.trim();
    if (!normalizedTranscript) {
      return { transcript: "", items: [] };
    }

    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("User must be authenticated");
    }

    const [library] = await Promise.all([
      ctx.runQuery(api.foodLibrary.listAll, {}),
    ]);

    if (!library || library.length === 0) {
      return { transcript: normalizedTranscript, items: [], warnings: ["Food library is empty"] };
    }

    const descriptors = buildLibraryDescriptors(library);
    const libraryIndex = buildLibraryIndex(library);
    const { itemNameMap, varietyNameMap } = buildNameLookup(descriptors);

    const openAiKey = process.env.OPEN_AI_KEY;
    if (!openAiKey) {
      throw new Error("OPEN_AI_KEY is not configured on the server");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        temperature: 0.2,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "inventory_update",
            schema: {
              type: "object",
              properties: {
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      itemCode: { type: "string" },
                      varietyCode: { type: "string" },
                      quantity: { type: "number" },
                      note: { type: "string" },
                      operation: {
                        type: "string",
                        enum: ["add", "decrement", "remove"],
                      },
                    },
                    required: ["itemCode", "quantity"],
                    additionalProperties: false,
                  },
                },
                warnings: {
                  type: "array",
                  items: { type: "string" },
                },
              },
              required: ["items"],
              additionalProperties: false,
            },
          },
        },
        messages: [
          {
            role: "system",
            content:
              "You are an assistant that extracts pantry inventory updates from voice transcripts. " +
              "Match grocery names to the provided catalog codes.",
          },
          {
            role: "user",
            content: buildPrompt(normalizedTranscript, descriptors),
          },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenAI request failed: ${response.status} ${text}`);
    }

    const payload = await response.json();
    const message = payload?.choices?.[0]?.message?.content;
    if (!message) {
      throw new Error("OpenAI response missing content");
    }

    let parsed: { items?: InventoryUpdate[]; warnings?: string[] } = {};
    try {
      parsed = JSON.parse(message);
    } catch (error) {
      throw new Error("Unable to parse inventory mapping response");
    }

    const items: InventoryUpdate[] = [];
    const unmatchedItems: string[] = [];
    const libraryCodes = new Set(library.map((item) => item.code));
    const warnings = Array.isArray(parsed.warnings)
      ? parsed.warnings.filter((entry) => typeof entry === "string" && entry.trim().length > 0)
      : [];

    if (Array.isArray(parsed.items)) {
      for (const entry of parsed.items) {
        if (!entry || typeof entry !== "object") {
          continue;
        }
        let itemCode = typeof entry.itemCode === "string" ? entry.itemCode.trim() : "";
        const quantity = Number(entry.quantity);
        if (!itemCode || !Number.isFinite(quantity)) {
          continue;
        }
        if (quantity <= 0) {
          continue;
        }

        const operation =
          typeof entry.operation === "string" &&
          ["add", "decrement", "remove"].includes(entry.operation)
            ? (entry.operation as InventoryUpdate["operation"])
            : undefined;

        const normalizedItemCode = normalize(itemCode);
        if (!libraryCodes.has(itemCode) && itemNameMap.has(normalizedItemCode)) {
          const matched = itemNameMap.get(normalizedItemCode);
          if (matched) {
            itemCode = matched.itemCode;
            if (!entry.varietyCode && matched.varietyCode) {
              entry.varietyCode = matched.varietyCode;
            }
          }
        }

        // Check if item code exists in library
        const libraryEntry = libraryIndex.get(itemCode);
        if (!libraryCodes.has(itemCode)) {
          // Item doesn't exist - we'll create provisional entry
          unmatchedItems.push(itemCode);
          // Still add to items so it can be processed
        }

        const varietyCode =
          typeof entry.varietyCode === "string" && entry.varietyCode.trim().length > 0
            ? entry.varietyCode.trim()
            : undefined;
        let resolvedVariety = varietyCode;
        if (varietyCode && libraryEntry && !libraryEntry.varietyCodes.has(varietyCode)) {
          const varietyMap = varietyNameMap.get(itemCode);
          const mappedVariety = varietyMap?.get(normalize(varietyCode));
          resolvedVariety = mappedVariety ?? undefined;
        }
        const validatedVariety =
          resolvedVariety && libraryEntry && !libraryEntry.varietyCodes.has(resolvedVariety)
            ? undefined
            : resolvedVariety;
        if (varietyCode && !validatedVariety) {
          warnings.push(
            `Variety "${varietyCode}" is not defined for ${itemCode}. Saved without variety code.`,
          );
        }
        const note =
          typeof entry.note === "string" && entry.note.trim().length > 0
            ? entry.note.trim()
            : undefined;
        items.push({
          itemCode,
          varietyCode: validatedVariety,
          quantity: Math.max(1, Math.round(quantity)),
          note,
          operation,
        });
      }
    }

    // Create provisional entries for unmatched items
    if (unmatchedItems.length > 0) {
      // Try to extract names from transcript for unmatched items
      // For now, use the item code as the name
      for (const itemCode of unmatchedItems) {
        try {
          await ctx.runMutation(api.foodLibrary.ensureProvisional, {
            code: itemCode,
            name: itemCode.split(".").pop() || itemCode, // Use last part of code as name
          });
          warnings.push(
            `Created provisional entry for "${itemCode}". Please review and complete the entry.`
          );
        } catch (error) {
          console.error(`Failed to create provisional entry for ${itemCode}:`, error);
          warnings.push(`Could not create entry for "${itemCode}". Please add manually.`);
        }
      }
    }

    return {
      transcript: normalizedTranscript,
      items,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  },
});

export const applyInventoryUpdates = mutation({
  args: {
    updates: v.array(
      v.object({
        itemCode: v.string(),
        varietyCode: v.optional(v.string()),
        quantity: v.number(),
        note: v.optional(v.string()),
        operation: v.optional(v.union(v.literal("add"), v.literal("decrement"), v.literal("remove"))),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("User must be authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user?.householdId) {
      throw new Error("No household available for updates");
    }

    const household = await ctx.db.get(user.householdId as Id<"households">);
    if (!household) {
      throw new Error("Household not found");
    }

    if (!household.members.includes(userId)) {
      throw new Error("You must be a household member to update the inventory");
    }

    const existing = (household.inventory ?? []) as UserInventoryEntry[];
    const nextInventory: UserInventoryEntry[] = [...existing];

    // Ensure all item codes exist in food library
    const library = await ctx.runQuery(api.foodLibrary.listAll, {});
    const libraryCodes = new Set(library.map((item) => item.code));
    const libraryIndex = buildLibraryIndex(library);
    const warnings: string[] = [];

    for (const update of args.updates) {
      const itemCode = update.itemCode.trim();
      if (!itemCode) {
        continue;
      }

      const operation = update.operation ?? "add";
      const quantity = Math.max(1, Math.round(update.quantity));
      const note = update.note?.trim();

      const varietyCode = update.varietyCode?.trim();
      const libraryEntry = libraryIndex.get(itemCode);
      const validatedVariety =
        varietyCode && libraryEntry && !libraryEntry.varietyCodes.has(varietyCode)
          ? undefined
          : varietyCode;
      if (varietyCode && !validatedVariety) {
        warnings.push(
          `Variety "${varietyCode}" is not defined for ${itemCode}. Saved without variety code.`,
        );
      }

      if (operation === "add") {
        // Ensure item code exists in food library
        if (!libraryCodes.has(itemCode)) {
          // Create provisional entry
          try {
            await ctx.runMutation(api.foodLibrary.ensureProvisional, {
              code: itemCode,
              name: itemCode.split(".").pop() || itemCode,
            });
            // Refresh library codes
            libraryCodes.add(itemCode);
            libraryIndex.set(itemCode, {
              shelfLifeDays: 7,
              storageLocation: "pantry",
              varietyCodes: new Set(),
            });
            warnings.push(`Created provisional entry for "${itemCode}". Please review its details.`);
          } catch (error) {
            console.error(`Failed to ensure provisional entry for ${itemCode}:`, error);
            // Continue anyway - the code will be stored but may not have full food library data
          }
        }
      }

      const matchIndex = nextInventory.findIndex(
        (entry) =>
          entry.itemCode === itemCode &&
          (entry.varietyCode ?? null) === (validatedVariety ?? null),
      );

      if (operation === "remove") {
        if (matchIndex >= 0) {
          nextInventory.splice(matchIndex, 1);
        } else {
          warnings.push(`No existing inventory entry found to remove for "${itemCode}".`);
        }
        continue;
      }

      if (operation === "decrement") {
        if (matchIndex >= 0) {
          const current = nextInventory[matchIndex];
          const nextQuantity = current.quantity - quantity;
          if (nextQuantity > 0) {
            nextInventory[matchIndex] = {
              ...current,
              quantity: nextQuantity,
              purchaseDate: Date.now(),
            };
          } else {
            nextInventory.splice(matchIndex, 1);
          }
        } else {
          warnings.push(`No existing inventory entry found to decrement for "${itemCode}".`);
        }
        continue;
      }

      if (matchIndex >= 0) {
        const current = nextInventory[matchIndex];
        nextInventory[matchIndex] = {
          ...current,
          quantity: current.quantity + quantity,
          purchaseDate: Date.now(),
          note: note ?? current.note,
        };
      } else {
        nextInventory.push({
          itemCode,
          varietyCode: validatedVariety ?? undefined,
          quantity,
          purchaseDate: Date.now(),
          note: note ?? undefined,
        });
      }
    }

    await ctx.db.patch(household._id, { inventory: nextInventory });
    return { success: true, inventory: nextInventory, warnings: warnings.length ? warnings : undefined };
  },
});

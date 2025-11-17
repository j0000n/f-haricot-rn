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

const buildLibraryDescriptors = (library: Doc<"foodLibrary">[]): LibraryDescriptor[] => {
  return library.map((item) => {
    const baseNames = [
      item.name,
      item.translations.en?.singular ?? "",
      item.translations.en?.plural ?? "",
    ];

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

type InventoryUpdate = {
  itemCode: string;
  varietyCode?: string;
  quantity: number;
  note?: string;
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
    `If quantity is not specified, assume quantity 1. ` +
    `Prefer whole numbers and round to the nearest integer when needed. ` +
    `When varieties are mentioned, map them to the corresponding variety code. ` +
    `If no variety is given, omit varietyCode. ` +
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
    if (Array.isArray(parsed.items)) {
      for (const entry of parsed.items) {
        if (!entry || typeof entry !== "object") {
          continue;
        }
        const itemCode = typeof entry.itemCode === "string" ? entry.itemCode.trim() : "";
        const quantity = Number(entry.quantity);
        if (!itemCode || !Number.isFinite(quantity)) {
          continue;
        }
        if (quantity <= 0) {
          continue;
        }
        const varietyCode =
          typeof entry.varietyCode === "string" && entry.varietyCode.trim().length > 0
            ? entry.varietyCode.trim()
            : undefined;
        const note =
          typeof entry.note === "string" && entry.note.trim().length > 0
            ? entry.note.trim()
            : undefined;
        items.push({
          itemCode,
          varietyCode,
          quantity: Math.max(1, Math.round(quantity)),
          note,
        });
      }
    }

    const warnings = Array.isArray(parsed.warnings)
      ? parsed.warnings.filter((entry) => typeof entry === "string" && entry.trim().length > 0)
      : undefined;

    return {
      transcript: normalizedTranscript,
      items,
      warnings,
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

    for (const update of args.updates) {
      const quantity = Math.max(1, Math.round(update.quantity));
      const itemCode = update.itemCode.trim();
      if (!itemCode) {
        continue;
      }

      const varietyCode = update.varietyCode?.trim();
      const note = update.note?.trim();

      const matchIndex = nextInventory.findIndex(
        (entry) =>
          entry.itemCode === itemCode &&
          (entry.varietyCode ?? null) === (varietyCode ?? null),
      );

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
          varietyCode: varietyCode ?? undefined,
          quantity,
          purchaseDate: Date.now(),
          note: note ?? undefined,
        });
      }
    }

    await ctx.db.patch(household._id, { inventory: nextInventory });
    return { success: true, inventory: nextInventory };
  },
});

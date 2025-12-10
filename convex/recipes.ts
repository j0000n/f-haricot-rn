import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

import { recipesSeed } from "../data/recipesSeed";
import { foodLibrarySeed } from "../data/foodLibrarySeed";

type SourceType =
  | "website"
  | "audio"
  | "text"
  | "photograph"
  | "instagram"
  | "tiktok"
  | "pinterest"
  | "youtube"
  | "cookbook"
  | "magazine"
  | "newspaper"
  | "recipe_card"
  | "handwritten"
  | "voice_note"
  | "video"
  | "facebook"
  | "twitter"
  | "reddit"
  | "blog"
  | "podcast"
  | "other";

const REQUIRED_LANGUAGES = ["en", "es", "zh", "fr", "ar", "ja", "vi", "tl"] as const;

// Normalize multilingual object to ensure all required languages are present
const normalizeMultilingual = (
  obj: Record<string, string> | undefined,
  fallback: string = "",
): Record<typeof REQUIRED_LANGUAGES[number], string> => {
  const result: Record<string, string> = {};
  const source = obj || {};
  
  // Use English as primary fallback, then the provided fallback, then empty string
  const englishFallback = source.en || fallback || "";
  
  for (const lang of REQUIRED_LANGUAGES) {
    result[lang] = source[lang] || englishFallback;
  }
  
  return result as Record<typeof REQUIRED_LANGUAGES[number], string>;
};

const normalizeToGrams = (
  ingredient: {
    normalizedQuantity?: number;
    normalizedUnit?: "g" | "ml" | "count";
    quantity: number;
    unit: string;
  },
  densityHints?: {
    gramsPerMilliliter?: number;
    gramsPerPiece?: number;
  },
) => {
  const baseQuantity = ingredient.normalizedQuantity ?? ingredient.quantity;
  if (ingredient.normalizedUnit === "g" || ingredient.unit === "g") {
    return baseQuantity;
  }
  if (ingredient.normalizedUnit === "ml" || ingredient.unit === "ml") {
    const factor = densityHints?.gramsPerMilliliter ?? 1;
    return baseQuantity * factor;
  }
  if (ingredient.normalizedUnit === "count") {
    const factor = densityHints?.gramsPerPiece ?? 1;
    return baseQuantity * factor;
  }
  return baseQuantity;
};

const computeNutritionProfile = (
  ingredients: Array<{
    foodCode: string;
    normalizedQuantity?: number;
    normalizedUnit?: "g" | "ml" | "count";
    quantity: number;
    unit: string;
  }>,
  servings: number,
  library: Array<{
    code: string;
    nutritionPer100g?: {
      calories: number;
      macronutrients: {
        protein: number;
        carbohydrates: number;
        fat: number;
        fiber?: number;
        sugars?: number;
      };
    };
    densityHints?: { gramsPerMilliliter?: number; gramsPerPiece?: number };
  }>,
) => {
  const totals = {
    calories: 0,
    protein: 0,
    carbohydrates: 0,
    fat: 0,
    fiber: 0,
    sugars: 0,
  };

  for (const ingredient of ingredients) {
    const item = library.find((entry) => entry.code === ingredient.foodCode);
    if (!item?.nutritionPer100g) continue;

    const grams = normalizeToGrams(ingredient, item.densityHints);
    const factor = grams / 100;

    totals.calories += item.nutritionPer100g.calories * factor;
    totals.protein += item.nutritionPer100g.macronutrients.protein * factor;
    totals.carbohydrates += item.nutritionPer100g.macronutrients.carbohydrates * factor;
    totals.fat += item.nutritionPer100g.macronutrients.fat * factor;
    totals.fiber += (item.nutritionPer100g.macronutrients.fiber ?? 0) * factor;
    totals.sugars += (item.nutritionPer100g.macronutrients.sugars ?? 0) * factor;
  }

  const perServing = {
    calories: totals.calories / Math.max(servings, 1),
    macronutrients: {
      protein: totals.protein / Math.max(servings, 1),
      carbohydrates: totals.carbohydrates / Math.max(servings, 1),
      fat: totals.fat / Math.max(servings, 1),
      fiber: totals.fiber / Math.max(servings, 1),
      sugars: totals.sugars / Math.max(servings, 1),
    },
  };

  return perServing;
};

export const getById = query({
  args: {
    id: v.id("recipes"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getMany = query({
  args: {
    ids: v.array(v.id("recipes")),
  },
  handler: async (ctx, args) => {
    if (args.ids.length === 0) {
      return [] as const;
    }

    const recipes = await Promise.all(args.ids.map((recipeId) => ctx.db.get(recipeId)));
    return recipes.filter(Boolean);
  },
});

export const listFeatured = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 12;

    const recipes = await ctx.db
      .query("recipes")
      .withIndex("by_created_at")
      .collect();

    // Sort by createdAt descending and limit
    const sortedRecipes = recipes.sort((a, b) => b.createdAt - a.createdAt);
    return sortedRecipes.slice(0, limit);
  },
});

export const search = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const normalizedQuery = args.query.trim().toLowerCase();

    if (!normalizedQuery) {
      return [] as const;
    }

    const limit = args.limit ?? 25;

    const recipes = await ctx.db.query("recipes").collect();

    const matches = recipes
      .filter((recipe) =>
        Object.values(recipe.recipeName).some((name) =>
          name.toLowerCase().includes(normalizedQuery),
        ) ||
        Object.values(recipe.description).some((description) =>
          description.toLowerCase().includes(normalizedQuery),
        ),
      )
      .sort((a, b) => a.recipeName.en.localeCompare(b.recipeName.en));

    return matches.slice(0, limit);
  },
});

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    let inserted = 0;
    const existingRecipes = await ctx.db.query("recipes").collect();

    for (const recipe of recipesSeed) {
      const existing = existingRecipes.find(
        (entry) => entry.recipeName.en === recipe.recipeName.en,
      );

      const now = Date.now();
      const recipeData = {
        recipeName: recipe.recipeName,
        description: recipe.description,
        ingredients: recipe.ingredients,
        sourceSteps: recipe.sourceSteps,
        encodedSteps: recipe.encodedSteps,
        encodingVersion: recipe.encodingVersion,
        foodItemsAdded: recipe.foodItemsAdded,
        emojiTags: recipe.emojiTags,
        prepTimeMinutes: recipe.prepTimeMinutes,
        cookTimeMinutes: recipe.cookTimeMinutes,
        totalTimeMinutes: recipe.totalTimeMinutes,
        servings: recipe.servings,
        source: (recipe as any).source || "other",
        sourceUrl: (recipe as any).sourceUrl,
        attribution: recipe.attribution,
        imageUrls: recipe.imageUrls,
        createdAt: recipe.createdAt ?? now,
        updatedAt: now,
        isPublic: recipe.isPublic,
      };

      if (existing) {
        await ctx.db.patch(existing._id, {
          ...recipeData,
          createdAt: existing.createdAt,
        });
      } else {
        await ctx.db.insert("recipes", recipeData);
        inserted += 1;
      }
    }

    return { inserted, total: recipesSeed.length };
  },
});

export const ingestUniversal = action({
  args: {
    sourceType: v.union(
      v.literal("website"),
      v.literal("audio"),
      v.literal("text"),
      v.literal("photograph"),
      v.literal("instagram"),
      v.literal("tiktok"),
      v.literal("pinterest"),
      v.literal("youtube"),
      v.literal("cookbook"),
      v.literal("magazine"),
      v.literal("newspaper"),
      v.literal("recipe_card"),
      v.literal("handwritten"),
      v.literal("voice_note"),
      v.literal("video"),
      v.literal("facebook"),
      v.literal("twitter"),
      v.literal("reddit"),
      v.literal("blog"),
      v.literal("podcast"),
      v.literal("other"),
    ),
    sourceUrl: v.optional(v.string()),
    rawText: v.optional(v.string()),
    extractedText: v.optional(v.string()),
    oembedPayload: v.optional(v.any()),
    socialMetadata: v.optional(
      v.object({
        title: v.optional(v.string()),
        description: v.optional(v.string()),
      }),
    ),
  },
  returns: v.object({
    recipeId: v.id("recipes"),
    encodingVersion: v.string(),
    validationSummary: v.object({
      ambiguous: v.number(),
      missing: v.number(),
    }),
  }),
  handler: async (ctx, args): Promise<{
    recipeId: Id<"recipes">;
    encodingVersion: string;
    validationSummary: {
      ambiguous: number;
      missing: number;
    };
  }> => {
    const openAiKey = process.env.OPEN_AI_KEY;
    if (!openAiKey) {
      throw new Error("OPEN_AI_KEY is not configured on the server");
    }

    const foodLibrary = await ctx.runQuery(api.foodLibrary.listAll, {});
    const translationGuides = await ctx.runQuery(api.translationGuides.listAll, {});

    const sourceSummary =
      args.rawText ||
      args.extractedText ||
      args.socialMetadata?.description ||
      args.socialMetadata?.title ||
      "Provide a universal recipe representation for ingestion.";

    const prompt = `You are the Universal Recipe Encoding System (URES) ingestion agent. Produce strict JSON for Convex mutation.

CRITICAL REQUIREMENTS:
1. Extract ALL ingredients from the source - do not skip any, even if they seem optional or have notes
2. Extract ALL steps from the source - include every instruction, even if they seem minor
3. Extract complete attribution information including author name, website, and social media profiles
4. Preserve the exact original text for each ingredient in the originalText field

Use encoding guide from plan/encoding-guide.md and include encodedSteps plus encodingVersion.
Use decoding guide at plan/decoding-guide.md to ensure qualifier order and deterministic cues.
Preserve free-text steps for fallback while providing encodedSteps.

Available food library items (code: name):
${foodLibrary
      .slice(0, 100)
      .map((f: { code: string; name: string }) => `${f.code}: ${f.name}`)
      .join(", ")}

INGREDIENT EXTRACTION RULES:
- Extract EVERY ingredient listed, including optional ones (mark preparation field if optional)
- Include quantities exactly as written (e.g., "1/2 cup", "21 dates", "1.5 cups or 250g")
- Preserve preparation notes in the preparation field (e.g., "pitted", "crushed", "chopped")
- For ingredients with alternatives (e.g., "or 2 tsp cinnamon + ¾ tsp ginger"), include the primary option and note alternatives in originalText
- Use foodCode from library when possible, or generate provisional codes like "provisional.coconut_sugar"

STEP EXTRACTION RULES:
- Extract ALL steps in order - do not combine or skip steps
- Include sub-steps and detailed instructions
- Preserve timing information (e.g., "4-5 minutes", "1-2 hours")
- Preserve temperature information (e.g., "235–240°F")
- Each major instruction should be a separate step

ATTRIBUTION EXTRACTION:
- Extract author name from the page (look for "by [name]", author bio, or site name)
- Extract author website/social media (Instagram, Pinterest, YouTube, Facebook handles/links)
- Include the full source URL
- Extract date retrieved (use current date: ${new Date().toISOString().slice(0, 10)})

Return JSON with fields: 
- recipeName (8 languages: en, es, zh, fr, ar, ja, vi, tl) - translate the recipe title
- description (8 languages) - translate the recipe description
- ingredients (ARRAY - include ALL ingredients):
  * foodCode REQUIRED - library code or "provisional.ingredient_name"
  * originalText REQUIRED - exact text from source (e.g., "21 organic Medjool dates, pitted")
  * quantity REQUIRED - numeric quantity
  * unit REQUIRED - unit of measurement
  * preparation OPTIONAL - preparation notes (e.g., "pitted", "crushed", "chopped")
  * displayQuantity OPTIONAL - original display (e.g., "1/2" for 0.5)
  * displayUnit OPTIONAL - original unit display
  * normalizedQuantity OPTIONAL - converted to base unit
  * normalizedUnit OPTIONAL - MUST be "g", "ml", or "count" only
- steps (ARRAY - include ALL steps in order):
  * stepNumber REQUIRED - sequential number starting from 1
  * instructions REQUIRED - object with 8 languages (en, es, zh, fr, ar, ja, vi, tl)
  * timeInMinutes OPTIONAL - extract if mentioned
  * temperature OPTIONAL - {value: number, unit: "F" or "C"} if mentioned
- emojiTags - array of 3-5 relevant emojis
- prepTimeMinutes - extract from source or estimate
- cookTimeMinutes - extract from source or estimate (0 if no-bake)
- totalTimeMinutes - extract from source or calculate
- servings - extract from source or default to 4
- encodedSteps - as JSON string following URES encoding
- encodingVersion - default "URES-4.6"
- attribution:
  * source REQUIRED - sourceType value
  * sourceUrl REQUIRED - full URL
  * author OPTIONAL - author name if found
  * authorWebsite OPTIONAL - author website URL
  * authorSocial OPTIONAL - object with instagram, pinterest, youtube, facebook handles/links
  * dateRetrieved REQUIRED - current date
- imageUrls - array of image URLs if found

Source context: ${args.sourceType} ${args.sourceUrl ?? "(no url)"}
Captured text: ${sourceSummary}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: "You are a deterministic URES encoder. Always emit valid JSON only.",
          },
          { role: "user", content: prompt },
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

    let jsonText = message.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```json\n?/, "").replace(/```$/, "").trim();
    }

    const enhanced = JSON.parse(jsonText);

    // Validate that we extracted ingredients and steps
    const ingredientCount = (enhanced.ingredients || []).length;
    const stepCount = (enhanced.steps || []).length;
    
    console.log(`[ingestUniversal] Extracted ${ingredientCount} ingredients and ${stepCount} steps from source`);
    
    if (ingredientCount === 0) {
      console.warn(`[ingestUniversal] WARNING: No ingredients extracted from source`);
    }
    if (stepCount === 0) {
      console.warn(`[ingestUniversal] WARNING: No steps extracted from source`);
    }

    const validationSummary = { ambiguous: 0, missing: 0 };
    const foodItemsAdded: Id<"foodLibrary">[] = [];
    const normalizedIngredients = await Promise.all(
      (enhanced.ingredients || []).map(async (ingredient: any) => {
        // Ensure foodCode exists - generate a provisional one if missing
        let foodCode = ingredient.foodCode;
        if (!foodCode || typeof foodCode !== "string") {
          // Generate a provisional code from the ingredient name
          const ingredientName = ingredient.originalText || ingredient.displayText || "unknown";
          const sanitized = ingredientName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "")
            .slice(0, 30);
          foodCode = `provisional.${sanitized}`;
        }

        const match = foodLibrary.find(
          (entry: Doc<"foodLibrary">) => entry.code === foodCode,
        );
        let status: "matched" | "ambiguous" | "missing" = "matched";
        let suggestions: string[] | undefined;

        if (!match) {
          status = "missing";
          validationSummary.missing += 1;
          
          // Try to find similar items in the food library by name
          const ingredientNameLower = (ingredient.originalText || ingredient.displayText || "").toLowerCase();
          const similarItems = foodLibrary
            .filter((entry) => 
              entry.name.toLowerCase().includes(ingredientNameLower) ||
              ingredientNameLower.includes(entry.name.toLowerCase())
            )
            .slice(0, 3)
            .map((entry) => entry.code);
          
          const nearby = similarItems.length > 0 
            ? similarItems
            : foodLibrarySeed
                .filter((entry) => entry.namespace === foodCode?.split(".")[0])
                .slice(0, 3)
                .map((entry) => entry.code);
          suggestions = nearby;

          try {
            const createdId = await ctx.runMutation(api.foodLibrary.ensureProvisional, {
              code: foodCode,
              name: ingredient.originalText || ingredient.displayText || foodCode,
              namespace: foodCode.split(".")[0] || "provisional",
              category: ingredient.category || "Provisional",
            });
            foodItemsAdded.push(createdId);
          } catch (error) {
            // If creation fails, log but continue - the ingredient will still be marked as missing
            console.error(`Failed to create provisional food item for ${foodCode}:`, error);
          }
        }

        const ingredientValidation = ingredient.validation ?? {};
        
        // Normalize normalizedUnit to ensure it's one of the valid values or undefined
        let normalizedUnit: "g" | "ml" | "count" | undefined = ingredient.normalizedUnit;
        if (normalizedUnit && normalizedUnit !== "g" && normalizedUnit !== "ml" && normalizedUnit !== "count") {
          // Invalid normalizedUnit - set to undefined
          normalizedUnit = undefined;
        }
        
        // Normalize displayQuantity to ensure it's a string or undefined
        let displayQuantity: string | undefined;
        const rawDisplayQuantity = ingredient.displayQuantity;
        if (rawDisplayQuantity !== undefined && rawDisplayQuantity !== null) {
          // Convert to string if it's a number
          if (typeof rawDisplayQuantity === "number") {
            displayQuantity = String(rawDisplayQuantity);
          } else if (typeof rawDisplayQuantity === "string") {
            displayQuantity = rawDisplayQuantity;
          } else {
            // If it's some other type, convert to string
            displayQuantity = String(rawDisplayQuantity);
          }
        } else {
          displayQuantity = undefined;
        }
        
        // Normalize displayUnit to ensure it's a string or undefined
        let displayUnit: string | undefined = ingredient.displayUnit;
        if (displayUnit !== undefined && displayUnit !== null) {
          if (typeof displayUnit !== "string") {
            displayUnit = String(displayUnit);
          }
        } else {
          displayUnit = undefined;
        }
        
        // Normalize optional string fields - convert null to undefined
        const normalizeOptionalString = (value: any): string | undefined => {
          if (value === null || value === undefined) {
            return undefined;
          }
          if (typeof value === "string") {
            return value;
          }
          return String(value);
        };
        
        // Normalize optional string fields first
        const prep = normalizeOptionalString(ingredient.preparation);
        const origText = normalizeOptionalString(ingredient.originalText);
        
        // Build the normalized ingredient object, explicitly handling null values
        const normalizedIngredient: any = {
          foodCode, // Ensure foodCode is always set
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          normalizedUnit, // Ensure normalizedUnit is valid or undefined
          displayQuantity, // Ensure displayQuantity is a string or undefined
          displayUnit, // Ensure displayUnit is a string or undefined
          validation: {
            status,
            suggestions: ingredientValidation.suggestions || suggestions,
          },
        };
        
        // Only include optional fields if they have valid values (not null/undefined)
        if (prep !== undefined) {
          normalizedIngredient.preparation = prep;
        }
        if (origText !== undefined) {
          normalizedIngredient.originalText = origText;
        }
        if (ingredient.varietyCode !== undefined && ingredient.varietyCode !== null) {
          normalizedIngredient.varietyCode = ingredient.varietyCode;
        }
        if (ingredient.normalizedQuantity !== undefined && ingredient.normalizedQuantity !== null) {
          normalizedIngredient.normalizedQuantity = ingredient.normalizedQuantity;
        }
        
        return normalizedIngredient;
      }),
    );

    const now = Date.now();
    const encodingVersion = enhanced.encodingVersion || "URES-4.6";
    
    // Normalize multilingual fields to ensure all required languages are present
    const normalizedRecipeName = normalizeMultilingual(
      enhanced.recipeName,
      enhanced.recipeName?.en || "Recipe",
    );
    const normalizedDescription = normalizeMultilingual(
      enhanced.description,
      enhanced.description?.en || "",
    );
    
    const normalizedSourceSteps = (enhanced.steps || []).map((step: any, index: number) => ({
      stepNumber: step.stepNumber ?? index + 1,
      text:
        (typeof step.instructions === "string"
          ? step.instructions
          : step.instructions?.en) ?? "",
    }));
    
    // Normalize encodedSteps: if it's an array, convert to JSON string; if string, use as-is; otherwise undefined
    let normalizedEncodedSteps: string | undefined;
    if (enhanced.encodedSteps !== undefined && enhanced.encodedSteps !== null) {
      if (Array.isArray(enhanced.encodedSteps)) {
        normalizedEncodedSteps = JSON.stringify(enhanced.encodedSteps);
      } else if (typeof enhanced.encodedSteps === "string") {
        normalizedEncodedSteps = enhanced.encodedSteps;
      } else {
        // If it's some other type, try to stringify it
        normalizedEncodedSteps = JSON.stringify(enhanced.encodedSteps);
      }
    }
    
    const recipeData = {
      recipeName: normalizedRecipeName,
      description: normalizedDescription,
      ingredients: normalizedIngredients,
      sourceSteps: normalizedSourceSteps,
      encodedSteps: normalizedEncodedSteps ?? "",
      encodingVersion,
      emojiTags: enhanced.emojiTags || [],
      prepTimeMinutes: enhanced.prepTimeMinutes || 0,
      cookTimeMinutes: enhanced.cookTimeMinutes || 0,
      totalTimeMinutes: enhanced.totalTimeMinutes || 0,
      servings: enhanced.servings || 4,
      source: args.sourceType as SourceType,
      sourceUrl: args.sourceUrl,
      attribution: (() => {
        // Build attribution from enhanced data or fallback
        const rawAttribution = enhanced.attribution || {};
        const baseAttribution = {
          source: rawAttribution.source || args.sourceType,
          sourceUrl: rawAttribution.sourceUrl || args.sourceUrl || undefined,
          author: rawAttribution.author || enhanced.author || undefined,
          dateRetrieved: rawAttribution.dateRetrieved || new Date().toISOString().slice(0, 10),
        };
        
        // If enhanced.attribution has authorWebsite or authorSocial, include in author field
        // Format: "Author Name (website: url, instagram: @handle)"
        if (rawAttribution.authorWebsite || rawAttribution.authorSocial) {
          let authorInfo = baseAttribution.author || "";
          const parts: string[] = [];
          
          if (rawAttribution.authorWebsite) {
            parts.push(`website: ${rawAttribution.authorWebsite}`);
          }
          if (rawAttribution.authorSocial?.instagram) {
            parts.push(`instagram: ${rawAttribution.authorSocial.instagram}`);
          }
          if (rawAttribution.authorSocial?.pinterest) {
            parts.push(`pinterest: ${rawAttribution.authorSocial.pinterest}`);
          }
          if (rawAttribution.authorSocial?.youtube) {
            parts.push(`youtube: ${rawAttribution.authorSocial.youtube}`);
          }
          if (rawAttribution.authorSocial?.facebook) {
            parts.push(`facebook: ${rawAttribution.authorSocial.facebook}`);
          }
          
          if (parts.length > 0) {
            authorInfo = authorInfo 
              ? `${authorInfo} (${parts.join(", ")})`
              : parts.join(", ");
          }
          
          // Return only the fields allowed by the schema
          return {
            source: baseAttribution.source,
            sourceUrl: baseAttribution.sourceUrl,
            author: authorInfo || undefined,
            dateRetrieved: baseAttribution.dateRetrieved,
          };
        }
        
        // Return only the fields allowed by the schema (remove any extra fields)
        return {
          source: baseAttribution.source,
          sourceUrl: baseAttribution.sourceUrl,
          author: baseAttribution.author,
          dateRetrieved: baseAttribution.dateRetrieved,
        };
      })(),
      imageUrls: enhanced.imageUrls || [],
      createdAt: now,
      updatedAt: now,
      isPublic: false,
      foodItemsAdded: [...foodItemsAdded, ...(enhanced.foodItemsAdded ?? [])],
    } satisfies Omit<Doc<"recipes">, "_id" | "_creationTime">;

    const recipeId: Id<"recipes"> = await ctx.runMutation(api.recipes.insertFromIngestion, {
      recipeData,
    });

    const perServing = computeNutritionProfile(
      normalizedIngredients,
      recipeData.servings,
      foodLibrary,
    );

    await ctx.runMutation(api.nutritionProfiles.upsertForRecipe, {
      recipeId,
      servings: recipeData.servings,
      perServing,
      encodingVersion,
    });

    // Store translation guide overrides when the model provides better phrasing
    for (const guide of translationGuides) {
      await ctx.runMutation(api.translationGuides.overrideTranslation, {
        code: guide.code,
        language: guide.language,
        text: guide.text,
        context: guide.context,
        description: guide.description,
      });
    }

    return { recipeId, encodingVersion, validationSummary };
  },
});

export const enhanceRecipeWithAI = action({
  args: {
    recipeName: v.string(),
    description: v.optional(v.string()),
    ingredients: v.optional(v.array(v.string())),
    steps: v.optional(v.array(v.string())),
    sourceUrl: v.optional(v.string()),
  },
  returns: v.object({
    recipeName: v.object({
      en: v.string(),
      es: v.string(),
      zh: v.string(),
      fr: v.string(),
      ar: v.string(),
      ja: v.string(),
      vi: v.string(),
      tl: v.string(),
    }),
    description: v.object({
      en: v.string(),
      es: v.string(),
      zh: v.string(),
      fr: v.string(),
      ar: v.string(),
      ja: v.string(),
      vi: v.string(),
      tl: v.string(),
    }),
    ingredients: v.array(
      v.object({
        foodCode: v.string(),
        varietyCode: v.optional(v.string()),
        quantity: v.number(),
        unit: v.string(),
        preparation: v.optional(v.string()),
      })
    ),
    sourceSteps: v.optional(
      v.array(
        v.object({
          stepNumber: v.number(),
          text: v.string(),
        })
      )
    ),
    emojiTags: v.array(v.string()),
    prepTimeMinutes: v.number(),
    cookTimeMinutes: v.number(),
    totalTimeMinutes: v.number(),
    servings: v.number(),
    encodedSteps: v.string(),
    encodingVersion: v.string(),
  }),
  handler: async (ctx, args) => {
    const openAiKey = process.env.OPEN_AI_KEY;
    if (!openAiKey) {
      throw new Error("OPEN_AI_KEY is not configured on the server");
    }

    // Get food library for ingredient matching
    const foodLibrary = await ctx.runQuery(api.foodLibrary.listAll, {});

    const prompt = `You are a recipe translator and enhancer. Given a recipe name and optional details, generate a complete structured recipe in JSON format.

Recipe Name: ${args.recipeName}
${args.description ? `Description: ${args.description}` : ""}
${args.ingredients ? `Ingredients (as text): ${args.ingredients.join(", ")}` : ""}
${args.steps ? `Steps (as text): ${args.steps.join(" | ")}` : ""}

Available food codes from library: ${foodLibrary.slice(0, 50).map((f: { code: string }) => f.code).join(", ")}

Generate a complete recipe with:
1. Recipe name translated to: English (en), Spanish (es), Chinese (zh), French (fr), Arabic (ar), Japanese (ja), Vietnamese (vi), Tagalog (tl)
2. Description translated to all languages
3. Ingredients parsed into structured format with foodCode (match from library when possible), quantity, unit, preparation
4. Steps translated to all languages with step numbers
5. Emoji tags (3-5 relevant food/cuisine emojis)
6. Time estimates: prepTimeMinutes, cookTimeMinutes, totalTimeMinutes
7. Servings (default to 4 if not specified)

Return valid JSON matching this schema:
{
  "recipeName": { "en": "...", "es": "...", "zh": "...", "fr": "...", "ar": "...", "ja": "...", "vi": "...", "tl": "..." },
  "description": { "en": "...", "es": "...", "zh": "...", "fr": "...", "ar": "...", "ja": "...", "vi": "...", "tl": "..." },
  "ingredients": [{"foodCode": "...", "quantity": 1, "unit": "...", "preparation": "..."}],
  "steps": [{"stepNumber": 1, "instructions": {"en": "...", "es": "...", ...}}],
  "emojiTags": ["🍝", "🧀"],
  "prepTimeMinutes": 15,
  "cookTimeMinutes": 20,
  "totalTimeMinutes": 35,
  "servings": 4
}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content: "You are a recipe translator and enhancer. Always return valid JSON.",
          },
          {
            role: "user",
            content: prompt,
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

    // Parse JSON from response (may be wrapped in markdown code blocks)
    let jsonText = message.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```json\n?/, "").replace(/```$/, "").trim();
    }

    const enhancedRecipe = JSON.parse(jsonText);

    // Validate and return
    const sourceSteps = (enhancedRecipe.steps || []).map((step: any, index: number) => ({
      stepNumber: step.stepNumber ?? index + 1,
      text:
        (typeof step.instructions === "string"
          ? step.instructions
          : step.instructions?.en) ?? "",
    }));

    return {
      recipeName: enhancedRecipe.recipeName,
      description: enhancedRecipe.description,
      ingredients: enhancedRecipe.ingredients || [],
      sourceSteps,
      emojiTags: enhancedRecipe.emojiTags || [],
      prepTimeMinutes: enhancedRecipe.prepTimeMinutes || 0,
      cookTimeMinutes: enhancedRecipe.cookTimeMinutes || 0,
      totalTimeMinutes: enhancedRecipe.totalTimeMinutes || 0,
      servings: enhancedRecipe.servings || 4,
      encodedSteps: enhancedRecipe.encodedSteps || "",
      encodingVersion: enhancedRecipe.encodingVersion || "URES-4.6",
    };
  },
});

export const listIngredientValidationIssues = query({
  args: {},
  handler: async (ctx) => {
    const recipes = await ctx.db.query("recipes").collect();
    return recipes
      .map((recipe) => ({
        recipeId: recipe._id,
        recipeName: recipe.recipeName,
        issues: recipe.ingredients.filter(
          (ingredient) =>
            ingredient.validation?.status && ingredient.validation.status !== "matched",
        ),
      }))
      .filter((entry) => entry.issues.length > 0);
  },
});

export const overrideIngredientMatch = mutation({
  args: {
    recipeId: v.id("recipes"),
    ingredientIndex: v.number(),
    foodCode: v.string(),
    varietyCode: v.optional(v.string()),
    validationStatus: v.optional(
      v.union(v.literal("matched"), v.literal("ambiguous"), v.literal("missing")),
    ),
  },
  handler: async (ctx, args) => {
    const recipe = await ctx.db.get(args.recipeId);
    if (!recipe) {
      throw new Error("Recipe not found");
    }

    const ingredients = [...recipe.ingredients];
    const target = ingredients[args.ingredientIndex];
    if (!target) {
      throw new Error("Ingredient index out of range");
    }

    ingredients[args.ingredientIndex] = {
      ...target,
      foodCode: args.foodCode,
      varietyCode: args.varietyCode,
      validation: {
        status: args.validationStatus ?? "matched",
        suggestions: [],
      },
    } as any;

    await ctx.db.patch(args.recipeId, { ingredients, updatedAt: Date.now() });
    return args.recipeId;
  },
});

export const createRecipeWithImage = action({
  args: {
    recipeData: v.object({
      recipeName: v.object({
        en: v.string(),
        es: v.string(),
        zh: v.string(),
        fr: v.string(),
        ar: v.string(),
        ja: v.string(),
        vi: v.string(),
        tl: v.string(),
      }),
      description: v.object({
        en: v.string(),
        es: v.string(),
        zh: v.string(),
        fr: v.string(),
        ar: v.string(),
        ja: v.string(),
        vi: v.string(),
        tl: v.string(),
      }),
      ingredients: v.array(
        v.object({
          foodCode: v.string(),
          varietyCode: v.optional(v.string()),
          quantity: v.number(),
          unit: v.string(),
          preparation: v.optional(v.string()),
        })
      ),
      sourceSteps: v.optional(
        v.array(
          v.object({
            stepNumber: v.number(),
            text: v.string(),
          })
        )
      ),
      emojiTags: v.array(v.string()),
      prepTimeMinutes: v.number(),
      cookTimeMinutes: v.number(),
      totalTimeMinutes: v.number(),
      servings: v.number(),
      source: v.optional(v.union(
        v.literal("website"),
        v.literal("audio"),
        v.literal("text"),
        v.literal("photograph"),
        v.literal("instagram"),
        v.literal("tiktok"),
        v.literal("pinterest"),
        v.literal("youtube"),
        v.literal("cookbook"),
        v.literal("magazine"),
        v.literal("newspaper"),
        v.literal("recipe_card"),
        v.literal("handwritten"),
        v.literal("voice_note"),
        v.literal("video"),
        v.literal("facebook"),
        v.literal("twitter"),
        v.literal("reddit"),
        v.literal("blog"),
        v.literal("podcast"),
        v.literal("other")
      )),
      sourceUrl: v.optional(v.string()),
      attribution: v.object({
        source: v.string(),
        sourceUrl: v.optional(v.string()),
        author: v.optional(v.string()),
        dateRetrieved: v.string(),
      }),
      imageUrl: v.string(),
      imageUrls: v.optional(v.array(v.string())),
      transparentImageStorageId: v.optional(v.id("_storage")),
      encodedSteps: v.string(),
      encodingVersion: v.string(),
      isPublic: v.boolean(),
    }),
  },
  returns: v.id("recipes"),
  handler: async (ctx, args): Promise<Id<"recipes">> => {
    const now = Date.now();
    const recipeId: Id<"recipes"> = await ctx.runMutation(api.recipes.create, {
      ...args.recipeData,
      createdAt: now,
      updatedAt: now,
    });
    return recipeId;
  },
});

export const create = mutation({
  args: {
    recipeName: v.object({
      en: v.string(),
      es: v.string(),
      zh: v.string(),
      fr: v.string(),
      ar: v.string(),
      ja: v.string(),
      vi: v.string(),
      tl: v.string(),
    }),
    description: v.object({
      en: v.string(),
      es: v.string(),
      zh: v.string(),
      fr: v.string(),
      ar: v.string(),
      ja: v.string(),
      vi: v.string(),
      tl: v.string(),
    }),
    ingredients: v.array(
      v.object({
        foodCode: v.string(),
        varietyCode: v.optional(v.string()),
        quantity: v.number(),
        unit: v.string(),
        preparation: v.optional(v.string()),
      })
    ),
    sourceSteps: v.optional(
      v.array(
        v.object({
          stepNumber: v.number(),
          text: v.string(),
        })
      )
    ),
    emojiTags: v.array(v.string()),
    prepTimeMinutes: v.number(),
    cookTimeMinutes: v.number(),
    totalTimeMinutes: v.number(),
    servings: v.number(),
    source: v.optional(v.union(
      v.literal("website"),
      v.literal("audio"),
      v.literal("text"),
      v.literal("photograph"),
      v.literal("instagram"),
      v.literal("tiktok"),
      v.literal("pinterest"),
      v.literal("youtube"),
      v.literal("cookbook"),
      v.literal("magazine"),
      v.literal("newspaper"),
      v.literal("recipe_card"),
      v.literal("handwritten"),
      v.literal("voice_note"),
      v.literal("video"),
      v.literal("facebook"),
      v.literal("twitter"),
      v.literal("reddit"),
      v.literal("blog"),
      v.literal("podcast"),
      v.literal("other")
    )),
    sourceUrl: v.optional(v.string()),
    attribution: v.object({
      source: v.string(),
      sourceUrl: v.optional(v.string()),
      author: v.optional(v.string()),
      dateRetrieved: v.string(),
    }),
    imageUrl: v.string(),
    imageUrls: v.optional(v.array(v.string())),
    transparentImageStorageId: v.optional(v.id("_storage")),
    encodedSteps: v.string(),
    encodingVersion: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    isPublic: v.boolean(),
  },
  returns: v.id("recipes"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("recipes", args);
  },
});

export const insertFromIngestion = mutation({
  args: {
    recipeData: v.object({
      recipeName: v.object({
        en: v.string(),
        es: v.string(),
        zh: v.string(),
        fr: v.string(),
        ar: v.string(),
        ja: v.string(),
        vi: v.string(),
        tl: v.string(),
      }),
      description: v.object({
        en: v.string(),
        es: v.string(),
        zh: v.string(),
        fr: v.string(),
        ar: v.string(),
        ja: v.string(),
        vi: v.string(),
        tl: v.string(),
      }),
      ingredients: v.array(
        v.object({
          foodCode: v.string(),
          varietyCode: v.optional(v.string()),
          quantity: v.number(),
          unit: v.string(),
          preparation: v.optional(v.string()),
          displayQuantity: v.optional(v.string()),
          displayUnit: v.optional(v.string()),
          normalizedQuantity: v.optional(v.number()),
          normalizedUnit: v.optional(
            v.union(v.literal("g"), v.literal("ml"), v.literal("count"))
          ),
          originalText: v.optional(v.string()),
          validation: v.optional(
            v.object({
              status: v.union(
                v.literal("matched"),
                v.literal("ambiguous"),
                v.literal("missing"),
              ),
              suggestions: v.optional(v.array(v.string())),
            })
          ),
        })
      ),
      sourceSteps: v.optional(
        v.array(
          v.object({
            stepNumber: v.number(),
            text: v.string(),
          })
        )
      ),
      emojiTags: v.array(v.string()),
      prepTimeMinutes: v.number(),
      cookTimeMinutes: v.number(),
      totalTimeMinutes: v.number(),
      servings: v.number(),
      source: v.optional(
        v.union(
          v.literal("website"),
          v.literal("audio"),
          v.literal("text"),
          v.literal("photograph"),
          v.literal("instagram"),
          v.literal("tiktok"),
          v.literal("pinterest"),
          v.literal("youtube"),
          v.literal("cookbook"),
          v.literal("magazine"),
          v.literal("newspaper"),
          v.literal("recipe_card"),
          v.literal("handwritten"),
          v.literal("voice_note"),
          v.literal("video"),
          v.literal("facebook"),
          v.literal("twitter"),
          v.literal("reddit"),
          v.literal("blog"),
          v.literal("podcast"),
          v.literal("other")
        )
      ),
      sourceUrl: v.optional(v.string()),
      attribution: v.object({
        source: v.string(),
        sourceUrl: v.optional(v.string()),
        author: v.optional(v.string()),
        dateRetrieved: v.string(),
      }),
      imageUrls: v.optional(v.array(v.string())),
      originalImageLargeStorageId: v.optional(v.id("_storage")),
      originalImageSmallStorageId: v.optional(v.id("_storage")),
      transparentImageLargeStorageId: v.optional(v.id("_storage")),
      transparentImageSmallStorageId: v.optional(v.id("_storage")),
      encodedSteps: v.string(),
      encodingVersion: v.string(),
      foodItemsAdded: v.optional(v.array(v.id("foodLibrary"))),
      createdAt: v.number(),
      updatedAt: v.number(),
      createdBy: v.optional(v.id("users")),
      isPublic: v.boolean(),
    }),
  },
  returns: v.id("recipes"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("recipes", args.recipeData);
  },
});

/**
 * Migration: Remove imageUrl field from recipe documents
 * This is a one-time migration to clean up old data after removing imageUrl from schema.
 * Run this once to fix schema validation errors.
 * 
 * Usage: Call this mutation once from the Convex dashboard or via the API to clean up old data.
 */
export const migrateRemoveImageUrlFromRecipes = mutation({
  args: {},
  returns: v.object({
    updated: v.number(),
    total: v.number(),
  }),
  handler: async (ctx) => {
    // Get all recipes
    const recipes = await ctx.db.query("recipes").collect();
    
    let updated = 0;
    for (const recipe of recipes) {
      // Check if recipe has imageUrl field (using type assertion to check)
      const recipeDoc = recipe as any;
      if ("imageUrl" in recipeDoc && recipeDoc.imageUrl !== undefined) {
        // Create a new document without the imageUrl field
        const { imageUrl, ...recipeWithoutImageUrl } = recipeDoc;
        // Replace the document without the imageUrl field
        await ctx.db.replace(recipe._id, recipeWithoutImageUrl as any);
        updated += 1;
      }
    }

    return { updated, total: recipes.length };
  },
});

export const migrateCollapseStepsToSourceSteps = mutation({
  args: {},
  returns: v.object({
    updated: v.number(),
    total: v.number(),
    skipped: v.number(),
  }),
  handler: async (ctx) => {
    const recipes = await ctx.db.query("recipes").collect();

    let updated = 0;
    let skipped = 0;

    for (const recipe of recipes) {
      const legacySteps = (recipe as any).steps as any[] | undefined;
      const existingSourceSteps = (recipe as any).sourceSteps as any[] | undefined;

      if ((!legacySteps || legacySteps.length === 0) && existingSourceSteps) {
        skipped += 1;
        continue;
      }

      if (!legacySteps || legacySteps.length === 0) {
        skipped += 1;
        continue;
      }

      const sourceSteps = existingSourceSteps ??
        legacySteps.map((step, index) => ({
          stepNumber: step.stepNumber ?? index + 1,
          text:
            (typeof step.instructions === "string"
              ? step.instructions
              : step.instructions?.en) ??
            Object.values(step.instructions ?? {})[0] ??
            "",
        }));

      const { steps, ...rest } = recipe as any;
      const encodedSteps = (recipe as any).encodedSteps ?? "";

      await ctx.db.replace(recipe._id, {
        ...rest,
        sourceSteps,
        encodedSteps,
      });

      updated += 1;
    }

    return { updated, total: recipes.length, skipped };
  },
});

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
        steps: recipe.steps,
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
  handler: async (ctx, args) => {
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

Use encoding guide from plan/encoding-guide.md and include encodedSteps plus encodingVersion.
Use decoding guide at plan/decoding-guide.md to ensure qualifier order and deterministic cues.
Preserve free-text steps for fallback while providing encodedSteps.
The food library codes include: ${foodLibrary
      .slice(0, 50)
      .map((f: { code: string }) => f.code)
      .join(", ")}. Codes outside the library must be flagged via validation.status=\"missing\" and suggestions referencing nearby codes.

Return JSON with fields: recipeName (8 languages), description (8 languages), ingredients (foodCode, varietyCode?, quantity, unit, preparation?, displayQuantity?, displayUnit?, normalizedQuantity?, normalizedUnit?, originalText?, validation {status,suggestions}), steps (stepNumber, instructions 8 languages, timeInMinutes?, temperature {value, unit}), emojiTags, prepTimeMinutes, cookTimeMinutes, totalTimeMinutes, servings, encodedSteps, encodingVersion (default URES-4.6), attribution {source, sourceUrl?, author?, dateRetrieved}, imageUrls (optional array).

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

    const validationSummary = { ambiguous: 0, missing: 0 };
    const foodItemsAdded: Id<"foodLibrary">[] = [];
    const normalizedIngredients = await Promise.all(
      (enhanced.ingredients || []).map(async (ingredient: any) => {
        const match = foodLibrary.find(
          (entry) => entry.code === ingredient.foodCode,
        );
        let status: "matched" | "ambiguous" | "missing" = "matched";
        let suggestions: string[] | undefined;

        if (!match) {
          status = "missing";
          validationSummary.missing += 1;
          const nearby = foodLibrarySeed
            .filter((entry) => entry.namespace === ingredient.foodCode?.split(".")[0])
            .slice(0, 3)
            .map((entry) => entry.code);
          suggestions = nearby;

          const createdId = await ctx.runMutation(api.foodLibrary.ensureProvisional, {
            code: ingredient.foodCode,
            name: ingredient.originalText || ingredient.foodCode,
            namespace: ingredient.foodCode?.split(".")[0],
            category: ingredient.category || "Provisional",
          });
          foodItemsAdded.push(createdId);
        }

        const ingredientValidation = ingredient.validation ?? {};
        return {
          ...ingredient,
          validation: {
            status,
            suggestions: ingredientValidation.suggestions || suggestions,
          },
        };
      }),
    );

    const now = Date.now();
    const encodingVersion = enhanced.encodingVersion || "URES-4.6";
    const recipeData = {
      recipeName: enhanced.recipeName,
      description: enhanced.description,
      ingredients: normalizedIngredients,
      steps: enhanced.steps || [],
      encodedSteps: enhanced.encodedSteps,
      encodingVersion,
      emojiTags: enhanced.emojiTags || [],
      prepTimeMinutes: enhanced.prepTimeMinutes || 0,
      cookTimeMinutes: enhanced.cookTimeMinutes || 0,
      totalTimeMinutes: enhanced.totalTimeMinutes || 0,
      servings: enhanced.servings || 4,
      source: args.sourceType as SourceType,
      sourceUrl: args.sourceUrl,
      attribution:
        enhanced.attribution ||
        ({
          source: args.sourceType,
          sourceUrl: args.sourceUrl,
          author: enhanced.author,
          dateRetrieved: new Date().toISOString().slice(0, 10),
        } as any),
      imageUrls: enhanced.imageUrls || [],
      createdAt: now,
      updatedAt: now,
      isPublic: false,
      foodItemsAdded: [...foodItemsAdded, ...(enhanced.foodItemsAdded ?? [])],
    } satisfies Omit<Doc<"recipes">, "_id" | "_creationTime">;

    const recipeId = await ctx.runMutation(api.recipes.insertFromIngestion, {
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
    steps: v.array(
      v.object({
        stepNumber: v.number(),
        instructions: v.object({
          en: v.string(),
          es: v.string(),
          zh: v.string(),
          fr: v.string(),
          ar: v.string(),
          ja: v.string(),
          vi: v.string(),
          tl: v.string(),
        }),
        timeInMinutes: v.optional(v.number()),
        temperature: v.optional(
          v.object({
            value: v.number(),
            unit: v.union(v.literal("F"), v.literal("C")),
          })
        ),
      })
    ),
    emojiTags: v.array(v.string()),
    prepTimeMinutes: v.number(),
    cookTimeMinutes: v.number(),
    totalTimeMinutes: v.number(),
    servings: v.number(),
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
    return {
      recipeName: enhancedRecipe.recipeName,
      description: enhancedRecipe.description,
      ingredients: enhancedRecipe.ingredients || [],
      steps: enhancedRecipe.steps || [],
      emojiTags: enhancedRecipe.emojiTags || [],
      prepTimeMinutes: enhancedRecipe.prepTimeMinutes || 0,
      cookTimeMinutes: enhancedRecipe.cookTimeMinutes || 0,
      totalTimeMinutes: enhancedRecipe.totalTimeMinutes || 0,
      servings: enhancedRecipe.servings || 4,
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
      steps: v.array(
        v.object({
          stepNumber: v.number(),
          instructions: v.object({
            en: v.string(),
            es: v.string(),
            zh: v.string(),
            fr: v.string(),
            ar: v.string(),
            ja: v.string(),
            vi: v.string(),
            tl: v.string(),
          }),
          timeInMinutes: v.optional(v.number()),
          temperature: v.optional(
            v.object({
              value: v.number(),
              unit: v.union(v.literal("F"), v.literal("C")),
            })
          ),
        })
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
    steps: v.array(
      v.object({
        stepNumber: v.number(),
        instructions: v.object({
          en: v.string(),
          es: v.string(),
          zh: v.string(),
          fr: v.string(),
          ar: v.string(),
          ja: v.string(),
          vi: v.string(),
          tl: v.string(),
        }),
        timeInMinutes: v.optional(v.number()),
        temperature: v.optional(
          v.object({
            value: v.number(),
            unit: v.union(v.literal("F"), v.literal("C")),
          })
        ),
      })
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
      steps: v.array(
        v.object({
          stepNumber: v.number(),
          instructions: v.object({
            en: v.string(),
            es: v.string(),
            zh: v.string(),
            fr: v.string(),
            ar: v.string(),
            ja: v.string(),
            vi: v.string(),
            tl: v.string(),
          }),
          timeInMinutes: v.optional(v.number()),
          temperature: v.optional(
            v.object({
              value: v.number(),
              unit: v.union(v.literal("F"), v.literal("C")),
            })
          ),
        })
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
      encodedSteps: v.optional(v.string()),
      encodingVersion: v.optional(v.string()),
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

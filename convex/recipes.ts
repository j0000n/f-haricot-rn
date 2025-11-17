import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

import { recipesSeed } from "../data/recipesSeed";

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

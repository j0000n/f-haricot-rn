"use node";

import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { action, internalAction } from "./_generated/server";

const Replicate = require("replicate");

/**
 * Helper function to determine the appropriate vessel for a recipe based on its name and description.
 * Analyzes keywords to determine if the dish should be served in a bowl or on a plate.
 */
function determineVessel(recipeName: string, description: string): string {
  const text = `${recipeName} ${description}`.toLowerCase();
  
  // Keywords that indicate bowl usage
  const bowlKeywords = ["soup", "stew", "broth", "chili", "curry", "salad", "cereal", "porridge", "risotto", "pasta", "noodles"];
  
  // Keywords that indicate plate usage
  const plateKeywords = ["grilled", "roasted", "baked", "fried", "steak", "chicken breast", "fish fillet"];
  
  // Check for bowl keywords first
  for (const keyword of bowlKeywords) {
    if (text.includes(keyword)) {
      return "bowl";
    }
  }
  
  // Check for plate keywords
  for (const keyword of plateKeywords) {
    if (text.includes(keyword)) {
      return "serving plate";
    }
  }
  
  // Default to serving plate
  return "serving plate";
}

export const uploadFile = action({
  args: {
    file: v.union(v.bytes(), v.string()), // Accept ArrayBuffer or base64 string
    contentType: v.string(),
  },
  returns: v.id("_storage"),
  handler: async (ctx, args) => {
    // Convert bytes to Blob for Convex storage
    // If it's a string, it's base64 encoded
    let bytes: ArrayBuffer | Uint8Array;
    if (typeof args.file === "string") {
      // Decode base64 string to bytes using Buffer (Node.js API available in "use node")
      const buffer = Buffer.from(args.file, "base64");
      bytes = new Uint8Array(buffer);
    } else {
      bytes = args.file;
    }
    const blob = new Blob([bytes as BlobPart], { type: args.contentType });
    const storageId = await ctx.storage.store(blob);
    return storageId;
  },
});

export const storeFromUrl = action({
  args: {
    imageUrl: v.string(),
  },
  returns: v.id("_storage"),
  handler: async (ctx, args) => {
    // Fetch image from URL
    const response = await fetch(args.imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/png";
    const blob = new Blob([arrayBuffer], { type: contentType });
    const storageId = await ctx.storage.store(blob);
    return storageId;
  },
});

/**
 * Internal action to generate recipe images using Replicate and save to Convex storage.
 * This function:
 * 1. Generates a prompt using generateRecipeImagePrompt
 * 2. Calls Replicate to generate images
 * 3. Downloads and stores each image to Convex storage
 * 4. Returns an array of storage IDs
 */
export const generateRecipeImages = internalAction({
  args: {
    subject: v.string(),
    vessel: v.string(),
    fill: v.optional(v.number()),
    background: v.optional(v.string()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    aspectRatio: v.optional(v.string()),
  },
  returns: v.array(v.id("_storage")),
  handler: async (ctx, args) => {
    // Step 1: Generate the prompt using generateRecipeImagePrompt
    const promptResult = await ctx.runAction(
      api.promptGenerators.generateRecipeImagePrompt,
      {
        subject: args.subject,
        vessel: args.vessel,
        fill: args.fill,
        background: args.background,
        width: args.width,
        height: args.height,
        aspectRatio: args.aspectRatio,
      }
    );

    // Step 2: Initialize Replicate
    const replicateApiToken = process.env.REPLICATE_API_TOKEN;
    if (!replicateApiToken) {
      throw new Error("REPLICATE_API_TOKEN is not set in environment variables");
    }
    const replicate = new Replicate({
      auth: replicateApiToken,
    });

    // Step 3: Call Replicate to generate images
    const output = await replicate.run("bytedance/seedream-4", {
      input: promptResult.input,
    });

    // Step 4: Process each generated image
    const storageIds: Id<"_storage">[] = [];
    for (const item of output) {
      const imageUrl = item.url();
      const imageUrlString =
        typeof imageUrl === "string" ? imageUrl : imageUrl.href;

      // Step 5: Store the image to Convex storage using the existing storeFromUrl action
      const storageId = await ctx.runAction(api.images.storeFromUrl, {
        imageUrl: imageUrlString,
      });
      storageIds.push(storageId);
    }

    return storageIds;
  },
});

/**
 * Internal action to process an image through the external processing endpoint
 * and save the returned base64 encoded images to Convex storage.
 *
 * This function:
 * 1. Retrieves the image from Convex storage (if storageId provided) or uses provided bytes
 * 2. Sends a multipart form request to the processing endpoint with image and sizes
 * 3. Extracts base64 encoded images from the response
 * 4. Saves each bgRemovedResized image to Convex storage
 * 5. Returns a map of size names to storage IDs
 */
export const processImageVariants = internalAction({
  args: {
    imageStorageId: v.optional(v.id("_storage")),
    imageBytes: v.optional(v.bytes()),
    sizes: v.object({
      thumbnail: v.optional(v.object({
        width: v.number(),
        height: v.number(),
      })),
      medium: v.optional(v.object({
        width: v.number(),
        height: v.number(),
      })),
    }),
  },
  returns: v.object({
    thumbnail: v.optional(v.id("_storage")),
    medium: v.optional(v.id("_storage")),
  }),
  handler: async (ctx, args) => {
    // Step 1: Get image bytes from storage or use provided bytes
    let imageBytes: Uint8Array;
    if (args.imageStorageId) {
      const blob = await ctx.storage.get(args.imageStorageId);
      if (!blob) {
        throw new Error(`Image not found in storage: ${args.imageStorageId}`);
      }
      const arrayBuffer = await blob.arrayBuffer();
      imageBytes = new Uint8Array(arrayBuffer);
    } else if (args.imageBytes) {
      // Convert ArrayBuffer to Uint8Array if needed
      imageBytes = args.imageBytes instanceof Uint8Array
        ? args.imageBytes
        : new Uint8Array(args.imageBytes);
    } else {
      throw new Error("Either imageStorageId or imageBytes must be provided");
    }

    // Step 2: Create multipart form data using Node.js built-in FormData
    // Node.js 18+ has built-in FormData support (via undici)
    const formData = new FormData();

    // Create a Blob for the image file
    // Create a proper ArrayBuffer copy to ensure type compatibility
    const imageBuffer = imageBytes.buffer.slice(
      imageBytes.byteOffset,
      imageBytes.byteOffset + imageBytes.byteLength
    ) as ArrayBuffer;
    const imageBlob = new Blob([imageBuffer], { type: "image/jpeg" });
    formData.append("image", imageBlob, "image.jpg");

    // Add sizes as JSON string
    formData.append("sizes", JSON.stringify(args.sizes));

    // Step 3: Call the external processing endpoint
    // fetch will automatically set Content-Type with boundary for FormData
    const endpointUrl = "https://brief-veriee-haricot-2c03792a.koyeb.app/process";
    const response = await fetch(endpointUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to process image: ${response.status} ${response.statusText}. ${errorText}`
      );
    }

    // Step 4: Parse the response
    const result = await response.json();

    // Step 5: Extract and save base64 images from outputs
    const storageIds: {
      thumbnail?: Id<"_storage">;
      medium?: Id<"_storage">;
    } = {};

    if (result.outputs) {
      // Process thumbnail if available
      if (result.outputs.thumbnail?.bgRemovedResized?.base64) {
        const thumbnailData = result.outputs.thumbnail.bgRemovedResized;
        const thumbnailStorageId = await ctx.runAction(api.images.uploadFile, {
          file: thumbnailData.base64,
          contentType: thumbnailData.mime || "image/png",
        });
        storageIds.thumbnail = thumbnailStorageId;
      }

      // Process medium if available
      if (result.outputs.medium?.bgRemovedResized?.base64) {
        const mediumData = result.outputs.medium.bgRemovedResized;
        const mediumStorageId = await ctx.runAction(api.images.uploadFile, {
          file: mediumData.base64,
          contentType: mediumData.mime || "image/png",
        });
        storageIds.medium = mediumStorageId;
      }
    }

    return storageIds;
  },
});

/**
 * Internal action to generate an enhanced recipe subject for image generation.
 * Uses OpenAI to analyze recipe details and identify key substitutions, special
 * preparation methods, and distinctive visual characteristics.
 */
export const generateEnhancedRecipeSubject = internalAction({
  args: {
    recipeName: v.string(),
    description: v.string(),
    ingredients: v.array(
      v.object({
        foodCode: v.string(),
        originalText: v.optional(v.string()),
        preparation: v.optional(v.string()),
      })
    ),
    sourceSteps: v.optional(
      v.array(
        v.object({
          text: v.string(),
        })
      )
    ),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const openAiKey = process.env.OPEN_AI_KEY;
    if (!openAiKey) {
      console.warn("[generateEnhancedRecipeSubject] OPEN_AI_KEY not configured, falling back to recipe name");
      return args.recipeName;
    }

    // Build ingredient list for context
    const ingredientList = args.ingredients
      .map((ing) => {
        const text = ing.originalText || ing.foodCode;
        return ing.preparation ? `${text} (${ing.preparation})` : text;
      })
      .join(", ");

    // Build steps text for context
    const stepsText = args.sourceSteps
      ? args.sourceSteps.map((step) => step.text).join(". ")
      : "";

    const prompt = `Analyze this recipe and generate a concise, descriptive subject for image generation that captures key visual characteristics, substitutions, and special preparation methods.

Recipe Name: ${args.recipeName}
Description: ${args.description}
Ingredients: ${ingredientList}
${stepsText ? `Steps: ${stepsText}` : ""}

Focus on identifying:
1. Key substitutions (e.g., "zucchini replaces noodles", "cauliflower rice instead of rice")
2. Special preparation methods (e.g., "spiralized", "mashed", "sliced thin")
3. Distinctive visual characteristics that differ from traditional versions

Generate a concise subject (under 50 words) that would help an image generator create an accurate visual representation. The subject should be descriptive enough to distinguish this recipe from similar traditional dishes.

Examples:
- "Zucchini Ground Beef Lasagna with thin zucchini strips layered as noodles, no pasta noodles, ground beef and cheese layers"
- "Cauliflower Fried Rice with riced cauliflower instead of rice grains, mixed vegetables, scrambled eggs"

Return ONLY the enhanced subject text, no additional explanation.`;

    try {
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
              content: "You are a food photography assistant. Generate concise, descriptive subjects for recipe images that accurately capture substitutions and visual characteristics.",
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
        console.error(`[generateEnhancedRecipeSubject] OpenAI request failed: ${response.status} ${text}`);
        return args.recipeName;
      }

      const payload = await response.json();
      const content = payload.choices?.[0]?.message?.content;

      if (!content) {
        console.error("[generateEnhancedRecipeSubject] OpenAI response missing content");
        return args.recipeName;
      }

      // Extract the subject (remove any quotes or extra formatting)
      const enhancedSubject = content.trim().replace(/^["']|["']$/g, "");
      console.log(`[generateEnhancedRecipeSubject] Generated enhanced subject: "${enhancedSubject}"`);
      return enhancedSubject;
    } catch (error) {
      console.error("[generateEnhancedRecipeSubject] Error generating enhanced subject:", error);
      return args.recipeName;
    }
  },
});

/**
 * Internal action to generate recipe images, process them, and save to recipe record.
 * This function:
 * 1. Fetches the full recipe document to get ingredients and steps
 * 2. Generates an enhanced subject using LLM to capture substitutions and key characteristics
 * 3. Determines the appropriate vessel based on recipe name/description
 * 4. Generates recipe images using generateRecipeImages with the enhanced subject
 * 5. Uses the first generated image
 * 6. Updates the recipe record with the generated storage IDs
 */
export const generateAndSaveRecipeImages = internalAction({
  args: {
    recipeId: v.id("recipes"),
    recipeName: v.string(),
    description: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    console.log(`[generateAndSaveRecipeImages] Starting for recipe ${args.recipeId}: "${args.recipeName}"`);
    try {
      // Step 1: Fetch full recipe to get ingredients and steps
      const recipe = await ctx.runQuery(api.recipes.getById, { id: args.recipeId });
      if (!recipe) {
        console.error(`[generateAndSaveRecipeImages] Recipe ${args.recipeId} not found`);
        return;
      }

      // Step 2: Generate enhanced subject that captures substitutions and key characteristics
      console.log(`[generateAndSaveRecipeImages] Generating enhanced subject for recipe ${args.recipeId}`);
      
      // Map ingredients to only the fields needed by generateEnhancedRecipeSubject
      const ingredientsForPrompt = recipe.ingredients.map((ing) => ({
        foodCode: ing.foodCode,
        originalText: ing.originalText,
        preparation: ing.preparation,
      }));
      
      // Map sourceSteps to only the text field if they exist
      const stepsForPrompt = recipe.sourceSteps?.map((step) => ({
        text: step.text,
      }));
      
      const enhancedSubject = await ctx.runAction(
        internal.images.generateEnhancedRecipeSubject,
        {
          recipeName: args.recipeName,
          description: args.description,
          ingredients: ingredientsForPrompt,
          sourceSteps: stepsForPrompt,
        }
      );
      console.log(`[generateAndSaveRecipeImages] Enhanced subject: "${enhancedSubject}"`);

      // Step 3: Determine vessel based on recipe characteristics
      const vessel = determineVessel(args.recipeName, args.description);
      console.log(`[generateAndSaveRecipeImages] Determined vessel: "${vessel}" for recipe ${args.recipeId}`);
      
      // Step 4: Generate recipe images using enhanced subject
      console.log(`[generateAndSaveRecipeImages] Calling generateRecipeImages for recipe ${args.recipeId}`);
      const storageIds = await ctx.runAction(internal.images.generateRecipeImages, {
        subject: enhancedSubject,
        vessel,
        aspectRatio: "1:1",
      });
      
      console.log(`[generateAndSaveRecipeImages] Generated ${storageIds.length} images for recipe ${args.recipeId}`);
      
      if (storageIds.length === 0) {
        console.error(`[generateAndSaveRecipeImages] No images generated for recipe ${args.recipeId}`);
        return;
      }
      
      // Step 5: Use only the first generated image
      const originalImageStorageId = storageIds[0];
      console.log(`[generateAndSaveRecipeImages] Using first image with storage ID: ${originalImageStorageId} for recipe ${args.recipeId}`);
      
      // Step 6: Save the raw generated image directly (no external processing)
      // Use the same image for all sizes since we're not processing variants
      console.log(`[generateAndSaveRecipeImages] Saving raw image to recipe ${args.recipeId}`);
      
      await ctx.runMutation(api.recipes.updateRecipeImages, {
        recipeId: args.recipeId,
        originalImageLargeStorageId: originalImageStorageId,
        originalImageSmallStorageId: originalImageStorageId,
        transparentImageLargeStorageId: originalImageStorageId,
        transparentImageSmallStorageId: originalImageStorageId,
      });
      
      console.log(`[generateAndSaveRecipeImages] Successfully generated and saved images for recipe ${args.recipeId}`);
    } catch (error) {
      // Log error but don't throw - recipe creation should succeed even if image generation fails
      console.error(`[generateAndSaveRecipeImages] Failed to generate images for recipe ${args.recipeId}:`, error);
    }
  },
});

/**
 * Internal action to generate and process images using the external endpoint.
 * This function:
 * 1. Generates a prompt using generateIngredientImagePrompt
 * 2. Sends a request to the generate-and-process endpoint with image generation parameters
 * 3. Receives processed images in multiple sizes
 * 4. Saves each processed image to Convex storage
 * 5. Returns a map of size names to storage IDs
 */
export const generateAndProcessImages = internalAction({
  args: {
    subject: v.string(),
    vessel: v.string(),
    fill: v.optional(v.number()),
    background: v.optional(v.string()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    aspectRatio: v.optional(v.string()),
    sizes: v.optional(v.object({
      thumbnail: v.optional(v.object({
        width: v.optional(v.number()),
        height: v.optional(v.number()),
        sharpSettingsOverrides: v.optional(v.object({
          format: v.optional(v.string()),
          quality: v.optional(v.number()),
          fit: v.optional(v.string()),
          trimThreshold: v.optional(v.number()),
        })),
      })),
      medium: v.optional(v.object({
        width: v.optional(v.number()),
        height: v.optional(v.number()),
        sharpSettingsOverrides: v.optional(v.object({
          format: v.optional(v.string()),
          quality: v.optional(v.number()),
          fit: v.optional(v.string()),
          trimThreshold: v.optional(v.number()),
        })),
      })),
    })),
  },
  returns: v.object({
    thumbnail: v.optional(v.id("_storage")),
    medium: v.optional(v.id("_storage")),
  }),
  handler: async (ctx, args) => {
    // Step 1: Generate the prompt using generateIngredientImagePrompt
    const promptResult = await ctx.runAction(
      api.promptGenerators.generateIngredientImagePrompt,
      {
        subject: args.subject,
        vessel: args.vessel,
        fill: args.fill,
        background: args.background,
        width: args.width,
        height: args.height,
        aspectRatio: args.aspectRatio,
      }
    );

    // Step 2: Set default sizes and merge with provided overrides
    const defaultSizes = {
      thumbnail: {
        width: 200,
        height: 200,
        sharpSettingsOverrides: {
          format: "png",
          quality: 100,
          trimThreshold: 20,
        },
      },
      medium: {
        width: 800,
        height: 800,
        sharpSettingsOverrides: {
          format: "png",
          quality: 100,
          trimThreshold: 20,
        },
      },
    };

    // Merge defaults with provided sizes
    const sizes = {
      thumbnail: args.sizes?.thumbnail
        ? {
            width: args.sizes.thumbnail.width ?? defaultSizes.thumbnail.width,
            height: args.sizes.thumbnail.height ?? defaultSizes.thumbnail.height,
            sharpSettingsOverrides: args.sizes.thumbnail.sharpSettingsOverrides
              ? {
                  ...defaultSizes.thumbnail.sharpSettingsOverrides,
                  ...args.sizes.thumbnail.sharpSettingsOverrides,
                }
              : defaultSizes.thumbnail.sharpSettingsOverrides,
          }
        : defaultSizes.thumbnail,
      medium: args.sizes?.medium
        ? {
            width: args.sizes.medium.width ?? defaultSizes.medium.width,
            height: args.sizes.medium.height ?? defaultSizes.medium.height,
            sharpSettingsOverrides: args.sizes.medium.sharpSettingsOverrides
              ? {
                  ...defaultSizes.medium.sharpSettingsOverrides,
                  ...args.sizes.medium.sharpSettingsOverrides,
                }
              : defaultSizes.medium.sharpSettingsOverrides,
          }
        : defaultSizes.medium,
    };

    // Step 3: Call the external generate-and-process endpoint
    const endpointUrl = "https://brief-veriee-haricot-2c03792a.koyeb.app/generate-and-process";
    const response = await fetch(endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: promptResult.input,
        sizes,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to generate and process images: ${response}, DETAILS : ${response.status} ${response.statusText}. ${errorText}`
      );
    }

    // Step 4: Parse the response
    const result = await response.json();

    // Step 5: Extract and save base64 images from outputs
    const storageIds: {
      thumbnail?: Id<"_storage">;
      medium?: Id<"_storage">;
    } = {};

    if (result.outputs) {
      // Process thumbnail if available
      if (result.outputs.thumbnail?.bgRemovedResized?.base64) {
        const thumbnailData = result.outputs.thumbnail.bgRemovedResized;
        const thumbnailStorageId = await ctx.runAction(api.images.uploadFile, {
          file: thumbnailData.base64,
          contentType: thumbnailData.mime || "image/png",
        });
        storageIds.thumbnail = thumbnailStorageId;
      }

      // Process medium if available
      if (result.outputs.medium?.bgRemovedResized?.base64) {
        const mediumData = result.outputs.medium.bgRemovedResized;
        const mediumStorageId = await ctx.runAction(api.images.uploadFile, {
          file: mediumData.base64,
          contentType: mediumData.mime || "image/png",
        });
        storageIds.medium = mediumStorageId;
      }
    }

    return storageIds;
  },
});

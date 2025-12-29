"use node";

import { v } from "convex/values";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { action, internalAction } from "./_generated/server";

const Replicate = require("replicate");

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
    console.log('input', promptResult.input, 'sizes', sizes);
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

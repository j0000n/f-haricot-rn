import { v } from "convex/values";
import { action } from "./_generated/server";

export const generateRecipeImagePrompt = action({
  args: {
    subject: v.string(),
    vessel: v.string(),
    fill: v.optional(v.number()),
    background: v.optional(v.string()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    aspectRatio: v.optional(v.string()),
  },
  returns: v.object({
    prompt: v.string(),
    negativePrompt: v.string(),
    input: v.object({
      prompt: v.string(),
      negative_prompt: v.string(),
      width: v.number(),
      height: v.number(),
      aspect_ratio: v.string(),
      cfg_scale: v.number(),
      num_inference_steps: v.number(),
    }),
  }),
  handler: async (ctx, args) => {




    // Default values
    const fill = args.fill ?? 0.95; // 0.90–0.96 recommended
    const background = args.background ?? "white seamless background";
    const width = args.width ?? 2048;
    const height = args.height ?? 2048;
    const aspectRatio = args.aspectRatio ?? "1:1";

    // plain-language scale hints from fill
    const diameterPct = Math.round(fill * 100); // e.g. 95
    const borderPct = Math.round((100 - diameterPct) / 2 * 10) / 10; // e.g. 2.5

    const prompt =
      `(overhead top-down view), camera facing directly downward at 90°, flat-lay, ` +
      `${args.subject} served in a ${args.vessel}, perfectly centered, ${background}, ` +
      // scale locks
      `vessel outer rim occupies ~${diameterPct}% of image width and height, ` +
      `uniform margin ≈ ${borderPct}% on every side, entire rim visible unbroken, ` +
      // optics/lighting
      `no tilt, no perspective distortion, 50mm lens equivalent, f/8, ` +
      `uniform studio lighting, soft even shadows, high-resolution food photography, ` +
      `minimalist food styling, editorial magazine layout`;

    const negativePrompt =
      `cropped edges, out of frame, partial rim, cut-off vessel, macro, close-up, extreme close-up, zoomed-in, ` +
      `zoom variation, scale change, wide-angle distortion, oblique angle, tilt, perspective skew, busy background, clutter, reflections, glare`;

    return {
      prompt,
      negativePrompt,
      input: {
        prompt,
        negative_prompt: negativePrompt,
        width,
        height,
        aspect_ratio: aspectRatio,
        cfg_scale: 7,
        num_inference_steps: 30,
      },
    };
  },
});

export const generateIngredientImagePrompt = action({
  args: {
    subject: v.string(),
    vessel: v.string(),
    fill: v.optional(v.number()),
    background: v.optional(v.string()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    aspectRatio: v.optional(v.string()),
  },
  returns: v.object({
    prompt: v.string(),
    negativePrompt: v.string(),
    input: v.object({
      prompt: v.string(),
      negative_prompt: v.string(),
      width: v.number(),
      height: v.number(),
      aspect_ratio: v.string(),
      cfg_scale: v.number(),
      num_inference_steps: v.number(),
    }),
  }),
  handler: async (ctx, args) => {




    // Default values
    const fill = args.fill ?? 0.95; // 0.90–0.96 recommended
    const background = args.background ?? "white seamless background";
    const width = args.width ?? 2048;
    const height = args.height ?? 2048;
    const aspectRatio = args.aspectRatio ?? "1:1";

    // plain-language scale hints from fill
    const diameterPct = Math.round(fill * 100); // e.g. 95
    const borderPct = Math.round((100 - diameterPct) / 2 * 10) / 10; // e.g. 2.5

    const prompt =
      `(overhead top-down view), camera facing directly downward at 90°, flat-lay, ` +
      `${args.subject} in a ${args.vessel} on , ${background}, ` +
      // scale locks

      `uniform margin ≈ ${borderPct}% on every side, all subjects visible unbroken, ` +
      // optics/lighting
      `no tilt, no perspective distortion, 50mm lens equivalent, f/8, ` +
      `uniform studio lighting, no shadows, high-resolution food photography, ` +
      `minimalist food styling, editorial magazine layout`;

    const negativePrompt =
      `cropped edges, out of frame, partial rim, cut-off vessel, macro, close-up, extreme close-up, zoomed-in, ` +
      `zoom variation, scale change, wide-angle distortion, oblique angle, tilt, perspective skew, busy background, clutter, reflections, glare`;

    return {
      prompt,
      negativePrompt,
      input: {
        prompt,
        negative_prompt: negativePrompt,
        width,
        height,
        aspect_ratio: aspectRatio,
        cfg_scale: 7,
        num_inference_steps: 30,
      },
    };
  },
});

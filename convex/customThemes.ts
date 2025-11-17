import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Generate a random 8-character share code
function generateShareCode(): string {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Avoiding confusing characters
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

// Create a new custom theme
export const createCustomTheme = mutation({
  args: {
    name: v.string(),
    colors: v.object({
      background: v.string(),
      surface: v.string(),
      overlay: v.string(),
      textPrimary: v.string(),
      textSecondary: v.string(),
      textMuted: v.string(),
      border: v.string(),
      accent: v.string(),
      accentOnPrimary: v.string(),
      success: v.string(),
      danger: v.string(),
      info: v.string(),
      logoFill: v.string(),
    }),
    spacing: v.object({
      xxs: v.number(),
      xs: v.number(),
      sm: v.number(),
      md: v.number(),
      lg: v.number(),
      xl: v.number(),
      xxl: v.number(),
    }),
    padding: v.object({
      screen: v.number(),
      section: v.number(),
      card: v.number(),
      compact: v.number(),
    }),
    radii: v.object({
      sm: v.number(),
      md: v.number(),
      lg: v.number(),
    }),
    typography: v.object({
      title: v.number(),
      heading: v.number(),
      subheading: v.number(),
      body: v.number(),
      small: v.number(),
      tiny: v.number(),
    }),
    fontFamilies: v.object({
      display: v.string(),
      regular: v.string(),
      light: v.string(),
      lightItalic: v.string(),
      medium: v.string(),
      semiBold: v.string(),
      bold: v.string(),
    }),
    logoAsset: v.string(),
    isPublic: v.boolean(),
    tabBar: v.optional(v.object({
      containerBackground: v.string(),
      slotBackground: v.string(),
      list: v.object({
        paddingHorizontal: v.number(),
        paddingVertical: v.number(),
        marginHorizontal: v.number(),
        marginBottom: v.number(),
        borderRadius: v.number(),
        backgroundColor: v.string(),
        borderWidth: v.number(),
        borderColor: v.string(),
        shadow: v.union(v.literal("card"), v.literal("floating"), v.null()),
      }),
      trigger: v.object({
        paddingHorizontal: v.number(),
        paddingVertical: v.number(),
        borderRadius: v.number(),
        minHeight: v.number(),
        squareSize: v.optional(v.number()),
        shape: v.union(v.literal("pill"), v.literal("square")),
        inactiveBackgroundColor: v.string(),
        activeBackgroundColor: v.string(),
      }),
      label: v.object({
        show: v.boolean(),
        color: v.string(),
        activeColor: v.string(),
        uppercase: v.boolean(),
        letterSpacing: v.number(),
        marginLeftWithIcon: v.number(),
      }),
      icon: v.optional(v.object({
        show: v.boolean(),
        family: v.string(),
        size: v.number(),
        inactiveColor: v.string(),
        activeColor: v.string(),
        names: v.object({
          home: v.string(),
          kitchen: v.string(),
          lists: v.string(),
        }),
      })),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to create a theme");
    }

    // Generate a unique share code
    let shareCode = generateShareCode();
    let attempts = 0;
    const maxAttempts = 10;

    // Ensure the share code is unique
    while (attempts < maxAttempts) {
      const existing = await ctx.db
        .query("customThemes")
        .withIndex("by_share_code", (q) => q.eq("shareCode", shareCode))
        .first();

      if (!existing) {
        break;
      }

      shareCode = generateShareCode();
      attempts++;
    }

    if (attempts === maxAttempts) {
      throw new Error("Failed to generate a unique share code");
    }

    const themeId = await ctx.db.insert("customThemes", {
      name: args.name,
      shareCode,
      creatorId: userId,
      isPublic: args.isPublic,
      colors: args.colors,
      spacing: args.spacing,
      padding: args.padding,
      radii: args.radii,
      typography: args.typography,
      fontFamilies: args.fontFamilies,
      logoAsset: args.logoAsset,
      tabBar: args.tabBar,
    });

    return {
      themeId,
      shareCode,
    };
  },
});

// Get a custom theme by share code
export const getThemeByShareCode = query({
  args: {
    shareCode: v.string(),
  },
  handler: async (ctx, args) => {
    const theme = await ctx.db
      .query("customThemes")
      .withIndex("by_share_code", (q) => q.eq("shareCode", args.shareCode))
      .first();

    if (!theme) {
      return null;
    }

    return theme;
  },
});

// Get all themes created by the current user
export const getMyCustomThemes = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return [];
    }

    const themes = await ctx.db
      .query("customThemes")
      .withIndex("by_creator", (q) => q.eq("creatorId", userId))
      .collect();

    return themes;
  },
});

// Delete a custom theme
export const deleteCustomTheme = mutation({
  args: {
    themeId: v.id("customThemes"),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to delete a theme");
    }

    const theme = await ctx.db.get(args.themeId);
    if (!theme) {
      throw new Error("Theme not found");
    }

    if (theme.creatorId !== userId) {
      throw new Error("You can only delete your own themes");
    }

    await ctx.db.delete(args.themeId);
  },
});

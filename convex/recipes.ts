import { action, internalAction, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { api, internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

import { recipesSeed } from "../data/recipesSeed";
import { foodLibrarySeed } from "../data/foodLibrarySeed";
import type { Recipe } from "../types/recipe";
import type { UserInventoryEntry } from "../types/food";
import type { NutritionGoals } from "../utils/nutritionGoals";

// Recipe filtering types and functions (moved here to avoid Convex compilation issues)
interface RecipeFilterOptions {
  dietaryRestrictions?: string[];
  allergies?: string[];
  favoriteCuisines?: string[];
  cookingStylePreferences?: string[];
  mealPlanningPreferences?: string[];
  nutritionGoals?: NutritionGoals;
  maxPrepTime?: number;
  maxCookTime?: number;
  difficultyLevel?: "easy" | "medium" | "hard";
}

interface HouseholdMember {
  memberId: string;
  memberName: string;
  allergies?: string[];
  dietaryRestrictions?: string[];
}

interface RecipeCompatibility {
  compatibleMembers: Array<{ memberId: string; memberName: string }>;
  incompatibleMembers: Array<{ memberId: string; memberName: string; reasons: string[] }>;
  partialCompatibility: boolean;
}

const CRITICAL_DIETARY_RESTRICTIONS = ["Halal", "Kosher"];
type FoodLibraryIndexEntry = {
  shelfLifeDays: number;
  varietyCodes: Set<string>;
};

const buildFoodLibraryIndex = (
  foodLibrary: Doc<"foodLibrary">[],
): Map<string, FoodLibraryIndexEntry> => {
  const index = new Map<string, FoodLibraryIndexEntry>();
  for (const item of foodLibrary) {
    index.set(item.code, {
      shelfLifeDays: item.shelfLifeDays,
      varietyCodes: new Set(item.varieties.map((variety) => variety.code)),
    });
  }
  return index;
};

function matchesDietaryRestrictions(recipe: Doc<"recipes">, restrictions: string[]): boolean {
  if (!restrictions || restrictions.length === 0) return true;
  if (!recipe.dietaryTags || recipe.dietaryTags.length === 0) return false;

  const recipeTags = recipe.dietaryTags.map((tag: string) => tag.toLowerCase());
  const requiredTags = restrictions.map((r: string) => r.toLowerCase());
  const criticalRestrictions = restrictions.filter((r: string) =>
    CRITICAL_DIETARY_RESTRICTIONS.some((cdr: string) =>
      r.toLowerCase().includes(cdr.toLowerCase())
    )
  );

  if (criticalRestrictions.length > 0) {
    const hasCriticalTag = criticalRestrictions.some((cr: string) =>
      recipeTags.some((rt: string) => rt.includes(cr.toLowerCase()))
    );
    if (!hasCriticalTag) return false;
  }

  return requiredTags.some((rt: string) => recipeTags.includes(rt));
}

function matchesAllergies(recipe: Doc<"recipes">, allergies: string[]): boolean {
  if (!allergies || allergies.length === 0) return true;
  if (!recipe.allergenTags || recipe.allergenTags.length === 0) return true;

  const recipeAllergens = recipe.allergenTags.map((a: string) => a.toLowerCase());
  const userAllergies = allergies.map((a: string) => a.toLowerCase());
  return !recipeAllergens.some((ra: string) =>
    userAllergies.some((ua: string) => ra.includes(ua) || ua.includes(ra))
  );
}

function matchesCuisines(recipe: Doc<"recipes">, cuisines: string[]): boolean {
  if (!cuisines || cuisines.length === 0) return true;
  if (!recipe.cuisineTags || recipe.cuisineTags.length === 0) return false;

  const recipeCuisines = recipe.cuisineTags.map((c: string) => c.toLowerCase());
  const userCuisines = cuisines.map((c: string) => c.toLowerCase());
  return recipeCuisines.some((rc: string) => userCuisines.includes(rc));
}

function matchesCookingStyles(recipe: Doc<"recipes">, styles: string[]): boolean {
  if (!styles || styles.length === 0) return true;
  if (!recipe.cookingStyleTags || recipe.cookingStyleTags.length === 0) return false;

  const recipeStyles = recipe.cookingStyleTags.map((s: string) => s.toLowerCase());
  const userStyles = styles.map((s: string) => s.toLowerCase());
  return recipeStyles.some((rs: string) => userStyles.includes(rs));
}

function calculateRecipeScore(
  recipe: Doc<"recipes">,
  userPreferences: RecipeFilterOptions,
  userInventory: string[],
  inventoryExpirationData?: Map<string, number>
): number {
  let score = 0;

  if (userInventory && userInventory.length > 0 && recipe.ingredients) {
    const recipeIngredientCodes = recipe.ingredients.map((ing: any) => ing.foodCode);
    const matchingIngredients = recipeIngredientCodes.filter((code: string) =>
      userInventory.includes(code)
    );
    const matchRatio = matchingIngredients.length / recipeIngredientCodes.length;
    score += matchRatio * 500;
    if (matchRatio === 1) score += 300;

    if (inventoryExpirationData) {
      for (const code of matchingIngredients) {
        const daysUntilExpiration = inventoryExpirationData.get(code);
        if (daysUntilExpiration !== undefined) {
          if (daysUntilExpiration <= 3) score += 200;
          else if (daysUntilExpiration <= 7) score += 100;
        }
      }
    }
  }

  if (userPreferences.dietaryRestrictions && recipe.dietaryTags) {
    const recipeTags = recipe.dietaryTags.map((t: string) => t.toLowerCase());
    const userRestrictions = userPreferences.dietaryRestrictions.map((r: string) => r.toLowerCase());
    const matchingTags = recipeTags.filter((rt: string) =>
      userRestrictions.some((ur: string) => rt.includes(ur) || ur.includes(rt))
    );
    score += (matchingTags.length / userRestrictions.length) * 300;
  }

  if (userPreferences.favoriteCuisines && recipe.cuisineTags) {
    const recipeCuisines = recipe.cuisineTags.map((c: string) => c.toLowerCase());
    const userCuisines = userPreferences.favoriteCuisines.map((c: string) => c.toLowerCase());
    score += recipeCuisines.filter((rc: string) => userCuisines.includes(rc)).length * (200 / userCuisines.length);
  }

  if (userPreferences.cookingStylePreferences && recipe.cookingStyleTags) {
    const recipeStyles = recipe.cookingStyleTags.map((s: string) => s.toLowerCase());
    const userStyles = userPreferences.cookingStylePreferences.map((s: string) => s.toLowerCase());
    score += recipeStyles.filter((rs: string) => userStyles.includes(rs)).length * (150 / userStyles.length);
  }

  return score;
}

function getRecipeCompatibility(
  recipe: Doc<"recipes">,
  householdMembers: HouseholdMember[]
): RecipeCompatibility {
  const compatibleMembers: Array<{ memberId: string; memberName: string }> = [];
  const incompatibleMembers: Array<{ memberId: string; memberName: string; reasons: string[] }> = [];

  for (const member of householdMembers) {
    const reasons: string[] = [];
    if (member.allergies && !matchesAllergies(recipe, member.allergies)) {
      reasons.push(`Contains allergens: ${member.allergies.filter((a: string) =>
        recipe.allergenTags?.some((at: string) => at.toLowerCase().includes(a.toLowerCase()))
      ).join(", ")}`);
    }
    if (member.dietaryRestrictions && !matchesDietaryRestrictions(recipe, member.dietaryRestrictions)) {
      reasons.push(`Does not match dietary restrictions: ${member.dietaryRestrictions.join(", ")}`);
    }
    if (reasons.length === 0) {
      compatibleMembers.push({ memberId: member.memberId, memberName: member.memberName });
    } else {
      incompatibleMembers.push({ memberId: member.memberId, memberName: member.memberName, reasons });
    }
  }

  return {
    compatibleMembers,
    incompatibleMembers,
    partialCompatibility: compatibleMembers.length > 0 && incompatibleMembers.length > 0,
  };
}

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

const normalizeHost = (url?: string) => {
  if (!url) return undefined;

  try {
    return new URL(url).host;
  } catch (error) {
    console.warn("Failed to derive host from url", url, error);
    return undefined;
  }
};

const normalizeSocialHandles = (social?: any) => {
  if (!social || typeof social !== "object") return undefined;

  const normalized: {
    instagram?: string;
    pinterest?: string;
    youtube?: string;
    facebook?: string;
  } = {};

  const setHandle = (key: keyof typeof normalized, value: unknown) => {
    if (typeof value !== "string") return;
    const trimmed = value.trim();
    if (!trimmed) return;

    normalized[key] = trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;
  };

  setHandle("instagram", social.instagram);
  setHandle("pinterest", social.pinterest);
  setHandle("youtube", social.youtube);
  setHandle("facebook", social.facebook);

  return Object.keys(normalized).length > 0 ? normalized : undefined;
};

const URL_SOURCE_TYPES = new Set<SourceType>([
  "website",
  "blog",
  "pinterest",
  "youtube",
  "instagram",
  "tiktok",
  "facebook",
  "twitter",
  "reddit",
]);

/**
 * Detects media type from URL patterns
 */
function detectMediaTypeFromUrl(url: string): SourceType {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // TikTok detection
    if (hostname.includes('tiktok.com')) {
      return 'tiktok';
    }
    
    // YouTube detection
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return 'youtube';
    }
    
    // Instagram detection
    if (hostname.includes('instagram.com')) {
      return 'instagram';
    }
    
    // Pinterest detection
    if (hostname.includes('pinterest.com') || hostname.includes('pin.it')) {
      return 'pinterest';
    }
    
    // Facebook detection
    if (hostname.includes('facebook.com') || hostname.includes('fb.com')) {
      return 'facebook';
    }
    
    // Twitter/X detection
    if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
      return 'twitter';
    }
    
    // Reddit detection
    if (hostname.includes('reddit.com')) {
      return 'reddit';
    }
    
    // Blog detection (common blog platforms)
    if (hostname.includes('blogspot.com') || 
        hostname.includes('wordpress.com') ||
        hostname.includes('medium.com') ||
        hostname.includes('substack.com')) {
      return 'blog';
    }
    
    // Default to website for other URLs
    return 'website';
  } catch {
    return 'other';
  }
}

/**
 * Extracts text content from HTML by removing tags and decoding entities
 */
function extractTextFromHtml(html: string): string {
  // Remove script and style tags
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  // Extract text content from common tags
  text = text.replace(/<[^>]+>/g, ' ');
  
  // Decode HTML entities
  text = decodeHtmlEntities(text);
  
  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}

/**
 * Fetches oEmbed data for video platforms (TikTok, YouTube, Instagram)
 */
async function fetchOEmbedData(url: string, platform: 'tiktok' | 'youtube' | 'instagram'): Promise<any> {
  try {
    let oembedUrl: string;
    
    if (platform === 'tiktok') {
      // TikTok oEmbed endpoint
      oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    } else if (platform === 'youtube') {
      // YouTube oEmbed endpoint
      oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    } else if (platform === 'instagram') {
      // Instagram oEmbed endpoint
      oembedUrl = `https://api.instagram.com/oembed?url=${encodeURIComponent(url)}`;
    } else {
      return null;
    }
    
    const response = await fetch(oembedUrl, {
      headers: {
        'User-Agent': 'HaricotRecipeIngest/1.0',
      },
    });
    
    if (!response.ok) {
      console.warn(`[fetchOEmbedData] Failed to fetch oEmbed for ${platform}: ${response.status}`);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.warn(`[fetchOEmbedData] Error fetching oEmbed for ${platform}:`, error);
    return null;
  }
}

const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));

const stripHtmlTags = (value: string) => {
  const withoutScripts = value.replace(
    /<(script|style|noscript)[^>]*>[\s\S]*?<\/\1>/gi,
    "",
  );
  const withLineBreaks = withoutScripts
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/\s*p\s*>/gi, "\n")
    .replace(/<\/\s*li\s*>/gi, "\n");
  const withoutTags = withLineBreaks.replace(/<[^>]+>/g, " ");
  const decoded = decodeHtmlEntities(withoutTags);
  return decoded.replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/\s{2,}/g, " ").trim();
};

const extractMetaContent = (html: string, key: string) => {
  const regex = new RegExp(
    `<meta[^>]+(?:property|name)=[\\"']${key}[\\\"'][^>]+content=[\\"']([^\\\"']+)[\\\"'][^>]*>`,
    "i",
  );
  const match = html.match(regex);
  return match?.[1] ? decodeHtmlEntities(match[1].trim()) : undefined;
};

const extractTagText = (html: string, tag: string) => {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = html.match(regex);
  return match?.[1] ? stripHtmlTags(match[1]) : undefined;
};

const extractReadableText = (html: string) => {
  const article = extractTagText(html, "article");
  if (article) return article;
  const main = extractTagText(html, "main");
  if (main) return main;
  const body = extractTagText(html, "body");
  return body;
};

const parseJsonLd = (raw: string) => {
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn("[ingestUniversal] Failed to parse JSON-LD:", error);
    return undefined;
  }
};

const isRecipeType = (typeValue: unknown) => {
  if (!typeValue) return false;
  if (typeof typeValue === "string") {
    return typeValue.toLowerCase().includes("recipe");
  }
  if (Array.isArray(typeValue)) {
    return typeValue.some((entry) => typeof entry === "string" && entry.toLowerCase().includes("recipe"));
  }
  return false;
};

const collectRecipeNodes = (node: any): any[] => {
  if (!node) return [];
  if (Array.isArray(node)) {
    return node.flatMap((item) => collectRecipeNodes(item));
  }
  if (typeof node !== "object") return [];
  if (isRecipeType(node["@type"])) {
    return [node];
  }
  if (node["@graph"]) {
    return collectRecipeNodes(node["@graph"]);
  }
  return [];
};

const normalizeInstructionText = (value: unknown): string[] => {
  if (!value) return [];
  if (typeof value === "string") {
    return [value];
  }
  if (Array.isArray(value)) {
    return value.flatMap((entry) => normalizeInstructionText(entry));
  }
  if (typeof value === "object") {
    const textValue =
      (value as { text?: unknown }).text ??
      (value as { name?: unknown }).name ??
      (value as { itemListElement?: unknown }).itemListElement;
    return normalizeInstructionText(textValue);
  }
  return [];
};

const extractRecipeStructuredText = (html: string) => {
  const jsonLdMatches = Array.from(
    html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi),
  );

  const recipeNodes: any[] = [];
  for (const match of jsonLdMatches) {
    const parsed = parseJsonLd(match[1]);
    if (!parsed) continue;
    recipeNodes.push(...collectRecipeNodes(parsed));
  }

  const recipeNode = recipeNodes.find((node) => isRecipeType(node["@type"])) ?? recipeNodes[0];
  const jsonLdIngredients = Array.isArray(recipeNode?.recipeIngredient)
    ? recipeNode.recipeIngredient
    : Array.isArray(recipeNode?.ingredients)
      ? recipeNode.ingredients
      : [];
  const jsonLdInstructions = normalizeInstructionText(recipeNode?.recipeInstructions);

  const microdataIngredients = Array.from(
    html.matchAll(/itemprop=["']recipeIngredient["'][^>]*content=["']([^"']+)["'][^>]*>/gi),
  ).map((match) => decodeHtmlEntities(match[1].trim()));
  const microdataIngredientTags = Array.from(
    html.matchAll(/itemprop=["']recipeIngredient["'][^>]*>([\s\S]*?)<\/[^>]+>/gi),
  ).map((match) => stripHtmlTags(match[1]));

  const microdataInstructions = Array.from(
    html.matchAll(/itemprop=["']recipeInstructions["'][^>]*content=["']([^"']+)["'][^>]*>/gi),
  ).map((match) => decodeHtmlEntities(match[1].trim()));
  const microdataInstructionTags = Array.from(
    html.matchAll(/itemprop=["']recipeInstructions["'][^>]*>([\s\S]*?)<\/[^>]+>/gi),
  ).map((match) => stripHtmlTags(match[1]));

  const ingredients = [
    ...jsonLdIngredients,
    ...microdataIngredients,
    ...microdataIngredientTags,
  ].map((entry) => stripHtmlTags(String(entry))).filter(Boolean);
  const instructions = [
    ...jsonLdInstructions,
    ...microdataInstructions,
    ...microdataInstructionTags,
  ].map((entry) => stripHtmlTags(String(entry))).filter(Boolean);

  return { ingredients, instructions };
};

const formatStructuredRecipeText = (ingredients: string[], instructions: string[]) => {
  const sections: string[] = [];
  if (ingredients.length > 0) {
    sections.push(`Ingredients:\n${ingredients.map((item) => `- ${item}`).join("\n")}`);
  }
  if (instructions.length > 0) {
    sections.push(`Instructions:\n${instructions.map((step, index) => `${index + 1}. ${step}`).join("\n")}`);
  }
  return sections.join("\n\n").trim();
};

const fetchSourceHtml = async (url: string) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "HaricotRecipeIngest/1.0",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      console.warn(`[ingestUniversal] Failed to fetch HTML: ${response.status} ${response.statusText}`);
      return undefined;
    }
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      console.warn(`[ingestUniversal] Skipping non-HTML content type: ${contentType}`);
      return undefined;
    }
    return await response.text();
  } catch (error) {
    console.warn("[ingestUniversal] Failed to fetch HTML:", error);
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
};

const parseLegacyAuthorAttribution = (author?: string) => {
  if (!author) {
    return { authorName: undefined, authorWebsite: undefined, authorSocial: undefined };
  }

  let mainAuthor = author.trim();
  let metadata = "";
  const parenMatch = mainAuthor.match(/^(.*?)\((.*)\)$/);

  if (parenMatch) {
    mainAuthor = parenMatch[1].trim();
    metadata = parenMatch[2];
  }

  const socialCandidates: Record<string, string> = {};
  let authorWebsite: string | undefined;

  const processPart = (part: string) => {
    const cleaned = part.trim();
    if (!cleaned) return;

    const [rawLabel, rawValue] = cleaned.split(/:\s*/);
    const value = (rawValue ?? rawLabel).trim();
    const label = rawValue ? rawLabel.toLowerCase() : undefined;

    if (value.startsWith("http")) {
      authorWebsite = authorWebsite ?? value;
      return;
    }

    const lowerValue = value.toLowerCase();
    const target = label ?? lowerValue;

    if (target.includes("instagram")) {
      socialCandidates.instagram = socialCandidates.instagram || value;
      return;
    }
    if (target.includes("pinterest")) {
      socialCandidates.pinterest = socialCandidates.pinterest || value;
      return;
    }
    if (target.includes("youtube")) {
      socialCandidates.youtube = socialCandidates.youtube || value;
      return;
    }
    if (target.includes("facebook")) {
      socialCandidates.facebook = socialCandidates.facebook || value;
      return;
    }

    if (value.startsWith("@")) {
      socialCandidates.instagram = socialCandidates.instagram || value;
    }
  };

  if (metadata) {
    metadata.split(/[,;]+/).forEach(processPart);
  }

  // Process main author segment for embedded links or handles
  processPart(mainAuthor);

  return {
    authorName: mainAuthor || undefined,
    authorWebsite,
    authorSocial: normalizeSocialHandles(socialCandidates),
  };
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

export const listBySourceHost = query({
  args: {
    host: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const host = args.host.trim().toLowerCase();
    const limit = args.limit ?? 25;

    if (!host) {
      return [] as const;
    }

    const recipes = await ctx.db
      .query("recipes")
      .withIndex("by_source_host", (q) => q.eq("sourceHost", host))
      .collect();

    return recipes.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  },
});

export const listByAuthorName = query({
  args: {
    authorName: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const authorName = args.authorName.trim().toLowerCase();
    const limit = args.limit ?? 25;

    if (!authorName) {
      return [] as const;
    }

    const recipes = await ctx.db
      .query("recipes")
      .withIndex("by_author_name", (q) => q.eq("authorName", authorName))
      .collect();

    return recipes.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  },
});

export const listPersonalized = query({
  args: {
    limit: v.optional(v.number()),
    railType: v.optional(
      v.union(
        v.literal("forYou"),
        v.literal("readyToCook"),
        v.literal("quickEasy"),
        v.literal("cuisines"),
        v.literal("dietaryFriendly"),
        v.literal("householdCompatible")
      )
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [] as const;
    }

    const limit = args.limit ?? 10;
    const railType = args.railType ?? "forYou";
    const now = Date.now();

    // Check cache first
    const cached = await ctx.db
      .query("userPersonalizedRecipes")
      .withIndex("by_user_and_type", (q) =>
        q.eq("userId", userId).eq("railType", railType)
      )
      .first();

    if (cached && cached.expiresAt > now) {
      // Return cached results
      const recipes = await Promise.all(
        cached.recipeIds.map((id) => ctx.db.get(id))
      );
      return recipes.filter(Boolean) as Doc<"recipes">[];
    }

    // Cache expired or missing, compute fresh results
    const user = await ctx.db.get(userId);
    if (!user) {
      return [] as const;
    }

    // Get user preferences
    const dietaryRestrictions = (user.dietaryRestrictions ?? []) as string[];
    const allergies = (user.allergies ?? []) as string[];
    const favoriteCuisines = (user.favoriteCuisines ?? []) as string[];
    const cookingStylePreferences = (user.cookingStylePreferences ??
      []) as string[];
    const nutritionGoals = user.nutritionGoals;
    const foodLibrary = await ctx.runQuery(api.foodLibrary.listAll, {});
    const foodLibraryIndex = buildFoodLibraryIndex(foodLibrary);

    // Get user inventory
    let userInventory: string[] = [];
    let inventoryExpirationData = new Map<string, number>();
    if (user.householdId) {
      const household = await ctx.db.get(user.householdId);
      if (household?.inventory) {
        const inventory = household.inventory as UserInventoryEntry[];
        const codes = new Set<string>();
        for (const item of inventory) {
          const inventoryItem = item as UserInventoryEntry;
          codes.add(item.itemCode);
          const libraryEntry = foodLibraryIndex.get(item.itemCode);
          if (item.varietyCode && libraryEntry?.varietyCodes.has(item.varietyCode)) {
            codes.add(item.varietyCode);
          }
          // Calculate days until expiration
          const shelfLifeDays = libraryEntry?.shelfLifeDays ?? 7;
          const daysSincePurchase = Math.floor(
            (now - item.purchaseDate) / (1000 * 60 * 60 * 24)
          );
          const daysUntilExpiration = shelfLifeDays - daysSincePurchase;
          inventoryExpirationData.set(item.itemCode, daysUntilExpiration);
        }
        userInventory = Array.from(codes);
      }
    }

    // Get all recipes
    const allRecipes = await ctx.db.query("recipes").collect();

    // Filter recipes based on rail type
    let filteredRecipes = allRecipes;

    // Apply hard filters first (allergies and critical dietary restrictions)
    filteredRecipes = filteredRecipes.filter((recipe) => {
      // Check allergies - hard filter
      if (allergies.length > 0 && !matchesAllergies(recipe, allergies)) {
        return false;
      }

      // Check critical dietary restrictions - hard filter
      const criticalRestrictions = dietaryRestrictions.filter((r) =>
        ["Halal", "Kosher"].some((cdr) =>
          r.toLowerCase().includes(cdr.toLowerCase())
        )
      );
      if (
        criticalRestrictions.length > 0 &&
        !matchesDietaryRestrictions(recipe, criticalRestrictions)
      ) {
        return false;
      }

      return true;
    });

    // Apply rail-specific filters
    if (railType === "readyToCook") {
      // Only recipes where user has all ingredients
      filteredRecipes = filteredRecipes.filter((recipe) => {
        const recipeIngredientCodes = recipe.ingredients.map(
          (ing) => ing.foodCode
        );
        return recipeIngredientCodes.every((code) =>
          userInventory.includes(code)
        );
      });
    } else if (railType === "quickEasy") {
      // Quick meals: prep + cook time <= 30 minutes, or cooking style preference
      filteredRecipes = filteredRecipes.filter((recipe) => {
        const isQuick =
          recipe.totalTimeMinutes <= 30 ||
          recipe.cookingStyleTags?.some((tag) =>
            tag.toLowerCase().includes("quick")
          );
        return isQuick && matchesCookingStyles(recipe, cookingStylePreferences);
      });
    } else if (railType === "cuisines") {
      // Filter by favorite cuisines
      filteredRecipes = filteredRecipes.filter((recipe) =>
        matchesCuisines(recipe, favoriteCuisines)
      );
    } else if (railType === "dietaryFriendly") {
      // Filter by dietary restrictions
      filteredRecipes = filteredRecipes.filter((recipe) =>
        matchesDietaryRestrictions(recipe, dietaryRestrictions)
      );
    } else if (railType === "householdCompatible") {
      // Get household members
      if (user.householdId) {
        const household = await ctx.db.get(user.householdId);
        if (household) {
          const memberDocs = await Promise.all(
            household.members.map((id) => ctx.db.get(id))
          );
          const householdMembers = memberDocs
            .filter(Boolean)
            .map((member) => ({
              memberId: member!._id,
              memberName: member!.name ?? "Unknown",
              allergies: (member!.allergies ?? []) as string[],
              dietaryRestrictions: (member!.dietaryRestrictions ??
                []) as string[],
            }))
            .map((m) => ({
              ...m,
              memberId: m.memberId as unknown as string, // Convert Id to string for compatibility function
            }));

          // Filter recipes compatible with all household members
          filteredRecipes = filteredRecipes.filter((recipe) => {
            const compatibility = getRecipeCompatibility(
              recipe,
              householdMembers
            );
            return compatibility.incompatibleMembers.length === 0;
          });
        }
      }
    }

    // Score and sort recipes
    const scoredRecipes = filteredRecipes.map((recipe) => {
      const filterOptions: RecipeFilterOptions = {
        dietaryRestrictions,
        allergies,
        favoriteCuisines,
        cookingStylePreferences,
        nutritionGoals: nutritionGoals ?? undefined,
      };

      const score = calculateRecipeScore(
        recipe,
        filterOptions,
        userInventory,
        inventoryExpirationData
      );

      return { recipe, score };
    });

    // Sort by score (descending) and then by createdAt (descending)
    scoredRecipes.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return b.recipe.createdAt - a.recipe.createdAt;
    });

    // Take top N recipes
    const topRecipes = scoredRecipes
      .slice(0, limit)
      .map((entry) => entry.recipe);

    // Note: Caching is handled by scheduled action `precomputePersonalizedRecipes`
    // This query computes on-demand if cache is expired

    return topRecipes;
  },
});

export const listByPreferences = query({
  args: {
    dietaryRestrictions: v.optional(v.array(v.string())),
    allergies: v.optional(v.array(v.string())),
    favoriteCuisines: v.optional(v.array(v.string())),
    cookingStylePreferences: v.optional(v.array(v.string())),
    maxPrepTime: v.optional(v.number()),
    maxCookTime: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 25;

    // Get all recipes
    let recipes = await ctx.db.query("recipes").collect();

    // Apply filters
    if (args.allergies && args.allergies.length > 0) {
      recipes = recipes.filter((recipe) =>
        matchesAllergies(recipe, args.allergies!)
      );
    }

    if (
      args.dietaryRestrictions &&
      args.dietaryRestrictions.length > 0
    ) {
      recipes = recipes.filter((recipe) =>
        matchesDietaryRestrictions(recipe, args.dietaryRestrictions!)
      );
    }

    if (args.favoriteCuisines && args.favoriteCuisines.length > 0) {
      recipes = recipes.filter((recipe) =>
        matchesCuisines(recipe, args.favoriteCuisines!)
      );
    }

    if (
      args.cookingStylePreferences &&
      args.cookingStylePreferences.length > 0
    ) {
      recipes = recipes.filter((recipe) =>
        matchesCookingStyles(recipe, args.cookingStylePreferences!)
      );
    }

    if (args.maxPrepTime) {
      recipes = recipes.filter(
        (recipe) => recipe.prepTimeMinutes <= args.maxPrepTime!
      );
    }

    if (args.maxCookTime) {
      recipes = recipes.filter(
        (recipe) => recipe.cookTimeMinutes <= args.maxCookTime!
      );
    }

    // Sort by createdAt descending
    recipes.sort((a, b) => b.createdAt - a.createdAt);

    return recipes.slice(0, limit);
  },
});

export const getHouseholdCompatibility = query({
  args: {
    recipeId: v.id("recipes"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return {
        compatibleMembers: [],
        incompatibleMembers: [],
        partialCompatibility: false,
      };
    }

    const recipe = await ctx.db.get(args.recipeId);
    if (!recipe) {
      return {
        compatibleMembers: [],
        incompatibleMembers: [],
        partialCompatibility: false,
      };
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      return {
        compatibleMembers: [],
        incompatibleMembers: [],
        partialCompatibility: false,
      };
    }

    if (!user.householdId) {
      // No household, just check user
      const isCompatible =
        (!user.allergies ||
          matchesAllergies(recipe, user.allergies as string[])) &&
        (!user.dietaryRestrictions ||
          matchesDietaryRestrictions(
            recipe,
            user.dietaryRestrictions as string[]
          ));

      return {
        compatibleMembers: isCompatible
          ? [
              {
                memberId: userId as unknown as string,
                memberName: user.name ?? "You",
              },
            ]
          : [],
        incompatibleMembers: isCompatible
          ? []
          : [
              {
                memberId: userId as unknown as string,
                memberName: user.name ?? "You",
                reasons: [],
              },
            ],
        partialCompatibility: false,
      };
    }

    const householdDoc = await ctx.db.get(user.householdId);
    if (!householdDoc) {
      return {
        compatibleMembers: [],
        incompatibleMembers: [],
        partialCompatibility: false,
      };
    }

    // Get all household members
    const memberDocs = await Promise.all(
      householdDoc.members.map((id: Id<"users">) => ctx.db.get(id))
    );

    const householdMembers = memberDocs
      .filter((member): member is Doc<"users"> => member !== null)
      .map((member) => ({
        memberId: member._id,
        memberName: member.name ?? "Unknown",
        allergies: (member.allergies ?? []) as string[],
        dietaryRestrictions: (member.dietaryRestrictions ?? []) as string[],
      }));

    // Get children
    const children = (householdDoc.children ?? []).map(
      (child: { id: string; name: string; allergies: string[]; createdAt: number }) => ({
        memberId: child.id,
        memberName: child.name,
        allergies: child.allergies,
        dietaryRestrictions: [] as string[],
      })
    );

    const allMembers = [
      ...householdMembers.map((m: { memberId: Id<"users">; memberName: string; allergies: string[]; dietaryRestrictions: string[] }) => ({
        ...m,
        memberId: m.memberId as unknown as string,
      })),
      ...children.map((c: { memberId: string; memberName: string; allergies: string[]; dietaryRestrictions: string[] }) => ({
        memberId: c.memberId,
        memberName: c.memberName,
        allergies: c.allergies,
        dietaryRestrictions: c.dietaryRestrictions,
      })),
    ];

    const compatibility = getRecipeCompatibility(
      recipe,
      allMembers
    );

    return compatibility;
  },
});

/**
 * Extract recipe metadata using LLM
 * This analyzes the recipe and extracts dietary tags, cuisines, cooking styles, allergens, etc.
 */
export const extractRecipeMetadata = action({
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
          timeInMinutes: v.optional(v.number()),
          temperature: v.optional(
            v.object({
              unit: v.union(v.literal("F"), v.literal("C")),
              value: v.number(),
            })
          ),
        })
      )
    ),
    prepTimeMinutes: v.number(),
    cookTimeMinutes: v.number(),
    totalTimeMinutes: v.number(),
    servings: v.number(),
  },
  returns: v.object({
    dietaryTags: v.optional(v.array(v.string())),
    cuisineTags: v.optional(v.array(v.string())),
    cookingStyleTags: v.optional(v.array(v.string())),
    allergenTags: v.optional(v.array(v.string())),
    mealTypeTags: v.optional(v.array(v.string())),
    difficultyLevel: v.optional(
      v.union(v.literal("easy"), v.literal("medium"), v.literal("hard"))
    ),
  }),
  handler: async (ctx, args) => {
    const openAiKey = process.env.OPEN_AI_KEY;
    if (!openAiKey) {
      // If no API key, return empty metadata (graceful degradation)
      return {
        dietaryTags: undefined,
        cuisineTags: undefined,
        cookingStyleTags: undefined,
        allergenTags: undefined,
        mealTypeTags: undefined,
        difficultyLevel: undefined,
      };
    }

    // Get food library to understand ingredients better
    const foodLibrary = await ctx.runQuery(api.foodLibrary.listAll, {});

    // Build ingredient list with names
    const ingredientNames = args.ingredients
      .map((ing) => {
        const foodItem = foodLibrary.find((item) => item.code === ing.foodCode);
        return foodItem
          ? `${ing.quantity} ${ing.unit} ${foodItem.name}${ing.preparation ? ` (${ing.preparation})` : ""}`
          : `${ing.quantity} ${ing.unit} ${ing.foodCode}`;
      })
      .join(", ");

    // Build steps text
    const stepsText =
      args.sourceSteps
        ?.map((step) => `${step.stepNumber}. ${step.text}`)
        .join("\n") || "";

    const prompt = `Analyze this recipe and extract metadata tags. Return ONLY valid JSON.

Recipe Name (English): ${args.recipeName.en}
Description (English): ${args.description.en}
Ingredients: ${ingredientNames}
Steps: ${stepsText}
Prep Time: ${args.prepTimeMinutes} minutes
Cook Time: ${args.cookTimeMinutes} minutes
Total Time: ${args.totalTimeMinutes} minutes
Servings: ${args.servings}

Extract and return:
1. dietaryTags: Array of dietary restrictions/preferences (e.g., ["Vegetarian", "Vegan", "Gluten-free", "Dairy-free", "Keto", "Paleo", "Halal", "Kosher"])
2. cuisineTags: Array of cuisine types (e.g., ["Italian", "Mexican", "Mediterranean", "Asian", "American"])
3. cookingStyleTags: Array of cooking styles (e.g., ["Quick meals", "Slow cooking", "Baking", "Grilling", "One-pot meals"])
4. allergenTags: Array of allergens present (e.g., ["Dairy", "Nuts", "Shellfish", "Eggs", "Soy", "Gluten"])
5. mealTypeTags: Array of meal types (e.g., ["Breakfast", "Lunch", "Dinner", "Snack", "Dessert"])
6. difficultyLevel: "easy", "medium", or "hard" based on complexity, number of steps, and techniques required

Return JSON in this exact format:
{
  "dietaryTags": ["..."],
  "cuisineTags": ["..."],
  "cookingStyleTags": ["..."],
  "allergenTags": ["..."],
  "mealTypeTags": ["..."],
  "difficultyLevel": "easy" | "medium" | "hard"
}`;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.2,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "recipe_metadata",
              schema: {
                type: "object",
                properties: {
                  dietaryTags: {
                    type: "array",
                    items: { type: "string" },
                  },
                  cuisineTags: {
                    type: "array",
                    items: { type: "string" },
                  },
                  cookingStyleTags: {
                    type: "array",
                    items: { type: "string" },
                  },
                  allergenTags: {
                    type: "array",
                    items: { type: "string" },
                  },
                  mealTypeTags: {
                    type: "array",
                    items: { type: "string" },
                  },
                  difficultyLevel: {
                    type: "string",
                    enum: ["easy", "medium", "hard"],
                  },
                },
                required: [],
                additionalProperties: false,
              },
            },
          },
          messages: [
            {
              role: "system",
              content:
                "You are a recipe analyzer that extracts metadata tags from recipes. Always return valid JSON.",
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
        console.error(`OpenAI metadata extraction failed: ${response.status} ${text}`);
        return {
          dietaryTags: undefined,
          cuisineTags: undefined,
          cookingStyleTags: undefined,
          allergenTags: undefined,
          mealTypeTags: undefined,
          difficultyLevel: undefined,
        };
      }

      const payload = await response.json();
      const message = payload?.choices?.[0]?.message?.content;
      if (!message) {
        console.error("OpenAI response missing content for metadata extraction");
        return {
          dietaryTags: undefined,
          cuisineTags: undefined,
          cookingStyleTags: undefined,
          allergenTags: undefined,
          mealTypeTags: undefined,
          difficultyLevel: undefined,
        };
      }

      // Parse JSON from response
      let jsonText = message.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/^```json\n?/, "").replace(/```$/, "").trim();
      }

      const metadata = JSON.parse(jsonText);

      return {
        dietaryTags: metadata.dietaryTags && metadata.dietaryTags.length > 0 ? metadata.dietaryTags : undefined,
        cuisineTags: metadata.cuisineTags && metadata.cuisineTags.length > 0 ? metadata.cuisineTags : undefined,
        cookingStyleTags: metadata.cookingStyleTags && metadata.cookingStyleTags.length > 0 ? metadata.cookingStyleTags : undefined,
        allergenTags: metadata.allergenTags && metadata.allergenTags.length > 0 ? metadata.allergenTags : undefined,
        mealTypeTags: metadata.mealTypeTags && metadata.mealTypeTags.length > 0 ? metadata.mealTypeTags : undefined,
        difficultyLevel: metadata.difficultyLevel || undefined,
      };
    } catch (error) {
      console.error("Failed to extract recipe metadata:", error);
      // Return empty metadata on error (graceful degradation)
      return {
        dietaryTags: undefined,
        cuisineTags: undefined,
        cookingStyleTags: undefined,
        allergenTags: undefined,
        mealTypeTags: undefined,
        difficultyLevel: undefined,
      };
    }
  },
});

export const listBySocialHandle = query({
  args: {
    handle: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const handle = args.handle.trim().replace(/^@/, "").toLowerCase();
    const limit = args.limit ?? 25;

    if (!handle) {
      return [] as const;
    }

    const [instagram, pinterest, youtube, facebook] = await Promise.all([
      ctx.db
        .query("recipes")
        .withIndex("by_author_instagram", (q) => q.eq("authorSocialInstagram", handle))
        .collect(),
      ctx.db
        .query("recipes")
        .withIndex("by_author_pinterest", (q) => q.eq("authorSocialPinterest", handle))
        .collect(),
      ctx.db
        .query("recipes")
        .withIndex("by_author_youtube", (q) => q.eq("authorSocialYoutube", handle))
        .collect(),
      ctx.db
        .query("recipes")
        .withIndex("by_author_facebook", (q) => q.eq("authorSocialFacebook", handle))
        .collect(),
    ]);

    const seen = new Set<string>();
    const combined = [...instagram, ...pinterest, ...youtube, ...facebook].filter(
      (recipe) => {
        const key = String(recipe._id);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      },
    );

    return combined.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
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
      const sourceUrl = (recipe as any).sourceUrl || recipe.attribution?.sourceUrl;
      const seedSourceHost = normalizeHost(sourceUrl)?.toLowerCase();
      const seedAuthorName =
        (recipe as any).authorName || (recipe.attribution as any)?.authorName;
      const seedAuthorWebsite =
        (recipe as any).authorWebsite || (recipe.attribution as any)?.authorWebsite;
      const seedAuthorSocial =
        (recipe as any).authorSocial || (recipe.attribution as any)?.authorSocial;

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
        sourceHost: seedSourceHost,
        authorName: seedAuthorName?.toLowerCase(),
        authorWebsite: seedAuthorWebsite,
        authorSocial: seedAuthorSocial,
        authorSocialInstagram: (recipe as any).authorSocialInstagram,
        authorSocialPinterest: (recipe as any).authorSocialPinterest,
        authorSocialYoutube: (recipe as any).authorSocialYoutube,
        authorSocialFacebook: (recipe as any).authorSocialFacebook,
        source: (recipe as any).source || "other",
        sourceUrl: sourceUrl || "",
        attribution: {
          ...recipe.attribution,
          sourceUrl: recipe.attribution.sourceUrl ?? sourceUrl,
          authorName: seedAuthorName || (recipe.attribution as any)?.authorName,
          authorWebsite: seedAuthorWebsite,
          authorSocial: seedAuthorSocial,
          sourceHost:
            (recipe as any).sourceHost ||
            (recipe.attribution as any)?.sourceHost ||
            seedSourceHost,
        },
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
    sourceType: v.optional(
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
        v.literal("other"),
      )
    ),
    sourceUrl: v.string(),
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

    // Auto-detect source type if not provided
    let detectedSourceType: SourceType = args.sourceType || "other";
    if (!args.sourceType || args.sourceType === "other") {
      detectedSourceType = detectMediaTypeFromUrl(args.sourceUrl);
      console.log(`[ingestUniversal] Auto-detected source type: ${detectedSourceType} from URL: ${args.sourceUrl}`);
    }

    const foodLibrary = await ctx.runQuery(api.foodLibrary.listAll, {});
    const translationGuides = await ctx.runQuery(api.translationGuides.listAll, {});

    // For video platforms, try oEmbed extraction
    let oembedData: any = args.oembedPayload;
    if (!oembedData && ['tiktok', 'youtube', 'instagram'].includes(detectedSourceType)) {
      oembedData = await fetchOEmbedData(args.sourceUrl, detectedSourceType as 'tiktok' | 'youtube' | 'instagram');
      if (oembedData) {
        console.log(`[ingestUniversal] Fetched oEmbed data for ${detectedSourceType}`);
      }
    }

    let htmlStructuredSummary: string | undefined;
    let htmlFallbackSummary: string | undefined;
    let htmlIngredientCount = 0;
    let htmlInstructionCount = 0;

    if (args.sourceUrl && URL_SOURCE_TYPES.has(detectedSourceType)) {
      const html = await fetchSourceHtml(args.sourceUrl);
      if (html) {
        const { ingredients, instructions } = extractRecipeStructuredText(html);
        htmlIngredientCount = ingredients.length;
        htmlInstructionCount = instructions.length;
        const structuredText = formatStructuredRecipeText(ingredients, instructions);
        if (structuredText) {
          htmlStructuredSummary = structuredText;
        }

        if (!htmlStructuredSummary) {
          const ogTitle = extractMetaContent(html, "og:title") || extractTagText(html, "title");
          const ogDescription =
            extractMetaContent(html, "og:description") ||
            extractMetaContent(html, "description") ||
            args.socialMetadata?.description;
          const readableText = extractReadableText(html);
          htmlFallbackSummary = [ogTitle, ogDescription, readableText]
            .filter((value): value is string => Boolean(value && value.trim()))
            .join("\n\n")
            .trim();
        }
      }
    }

    // Enhance sourceSummary with oEmbed data if available
    let enhancedSourceSummary = htmlStructuredSummary ||
      htmlFallbackSummary ||
      args.rawText ||
      args.extractedText ||
      args.socialMetadata?.description ||
      args.socialMetadata?.title ||
      "";

    if (oembedData) {
      const oembedTitle = oembedData.title || '';
      const oembedDescription = oembedData.description || oembedData.author_name || '';
      const oembedHtml = oembedData.html || ''; // May contain video embed with captions
      
      // Combine oEmbed metadata with existing source summary
      enhancedSourceSummary = [
        oembedTitle,
        oembedDescription,
        enhancedSourceSummary,
        // Extract text from HTML if present (for video captions)
        oembedHtml ? extractTextFromHtml(oembedHtml) : '',
      ]
        .filter((text) => text && text.trim())
        .join('\n\n')
        .trim();
    }

    const sourceSummary = enhancedSourceSummary || "Provide a universal recipe representation for ingestion.";

    const sourceHostForLog = normalizeHost(args.sourceUrl);
    console.info(
      `[ingestUniversal] Source host: ${sourceHostForLog ?? "unknown"}, summary length: ${sourceSummary.length}, ` +
        `ingredients: ${htmlIngredientCount}, instructions: ${htmlInstructionCount}`,
    );

    // Add social media context for better recipe name extraction
    const socialMediaContext = ['tiktok', 'youtube', 'instagram', 'facebook', 'twitter'].includes(detectedSourceType)
      ? `\n\nIMPORTANT: This recipe is from ${detectedSourceType}. Social media recipes often have:
- Recipe name in the video title, caption, or first line of description
- Ingredients and steps may be in video captions, comments, or description text
- Look for hashtags or emojis that indicate the recipe name
- Extract the actual recipe name from the content, not generic placeholders
- If the recipe name is unclear, infer it from the main ingredients and dish type`
      : '';

    const prompt = `You are the Universal Recipe Encoding System (URES) ingestion agent. Produce strict JSON for Convex mutation.

CRITICAL REQUIREMENTS:
${socialMediaContext}
1. Extract ALL ingredients from the source - do not skip any, even if they seem optional or have notes
2. Extract ALL steps from the source - include every instruction, even if they seem minor
3. Extract complete attribution information in structured fields (authorName, authorWebsite, authorSocial, sourceHost) without merging them into the author string
4. Preserve the exact original text for each ingredient in the originalText field

Use encoding guide from plan/encoding-guide.md and return both encodedSteps and encodingVersion.
Use decoding guide at plan/decoding-guide.md to ensure qualifier order and deterministic cues.
Include a single-language fallback steps array for display resilience alongside encodedSteps.

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
- Extract author website/social media (Instagram, Pinterest, YouTube, Facebook handles/links) and place them in the structured fields
- Include the full source URL (required)
- Provide sourceHost as the hostname extracted from the URL
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
- steps (ARRAY - include ALL steps in order, single-language or raw text):
  * stepNumber REQUIRED - sequential number starting from 1
  * text REQUIRED - plain-text instruction (single language is acceptable)
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
  * sourceUrl REQUIRED - full URL (do not leave blank)
  * author OPTIONAL - legacy author string (do NOT append website or socials here)
  * authorName OPTIONAL - structured author name
  * authorWebsite OPTIONAL - author website URL
  * authorSocial OPTIONAL - object with instagram, pinterest, youtube, facebook handles/links (no commas, one per field)
  * sourceHost OPTIONAL - hostname derived from sourceUrl
  * dateRetrieved REQUIRED - current date
- imageUrls - array of image URLs if found

Source context: ${detectedSourceType} ${args.sourceUrl ?? "(no url)"}
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
        if (normalizedUnit === null || normalizedUnit === undefined) {
          normalizedUnit = undefined;
        } else if (normalizedUnit !== "g" && normalizedUnit !== "ml" && normalizedUnit !== "count") {
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

        const parseDisplayQuantity = (value?: string) => {
          if (!value) return undefined;
          const trimmed = value.trim();
          if (!trimmed) return undefined;
          const fractionMatch = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)$/);
          if (fractionMatch) {
            const whole = Number(fractionMatch[1]);
            const numerator = Number(fractionMatch[2]);
            const denominator = Number(fractionMatch[3]);
            if (denominator !== 0) return whole + numerator / denominator;
          }
          const simpleFraction = trimmed.match(/^(\d+)\/(\d+)$/);
          if (simpleFraction) {
            const numerator = Number(simpleFraction[1]);
            const denominator = Number(simpleFraction[2]);
            if (denominator !== 0) return numerator / denominator;
          }
          const parsed = Number.parseFloat(trimmed.replace(/[^\d.]+/g, ""));
          return Number.isFinite(parsed) ? parsed : undefined;
        };

        let quantity: number;
        if (typeof ingredient.quantity === "number" && Number.isFinite(ingredient.quantity)) {
          quantity = ingredient.quantity;
        } else {
          const parsedQuantity =
            parseDisplayQuantity(displayQuantity) ??
            (typeof ingredient.normalizedQuantity === "number" && Number.isFinite(ingredient.normalizedQuantity)
              ? ingredient.normalizedQuantity
              : undefined);
          if (parsedQuantity !== undefined) {
            quantity = parsedQuantity;
          } else {
            console.warn("[ingestUniversal] Invalid ingredient quantity, defaulting to 0", {
              originalText: origText,
              displayQuantity,
            });
            quantity = 0;
          }
        }

        let unit: string;
        if (typeof ingredient.unit === "string" && ingredient.unit.trim()) {
          unit = ingredient.unit.trim();
        } else if (displayUnit) {
          unit = displayUnit;
        } else {
          unit = "count";
        }

        // Build the normalized ingredient object, explicitly handling null values
        const normalizedIngredient: any = {
          foodCode, // Ensure foodCode is always set
          quantity,
          unit,
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

    // Parse steps if it's a JSON string, otherwise use as-is
    let stepsArray: any[] = [];
    if (enhanced.steps) {
      if (typeof enhanced.steps === "string") {
        try {
          stepsArray = JSON.parse(enhanced.steps);
          console.log(`[ingestUniversal] Parsed steps from JSON string, got ${stepsArray.length} steps`);
        } catch (e) {
          console.error("Failed to parse steps JSON string:", e);
          stepsArray = [];
        }
      } else if (Array.isArray(enhanced.steps)) {
        stepsArray = enhanced.steps;
      } else {
        console.warn(`[ingestUniversal] Unexpected steps type: ${typeof enhanced.steps}`);
        stepsArray = [];
      }
    }

    const normalizedSourceSteps = stepsArray
      .map((step: any, index: number) => {
        const text =
          typeof step === "string"
            ? step
            : step?.text ??
              (typeof step?.instructions === "string"
                ? step.instructions
                : step?.instructions?.en) ??
              "";

        const timeInMinutes =
          typeof step?.timeInMinutes === "number" ? step.timeInMinutes : undefined;

        const temperature:
          | { value: number; unit: "F" | "C" }
          | undefined =
          step?.temperature &&
          typeof step.temperature.value === "number" &&
          (step.temperature.unit === "F" || step.temperature.unit === "C")
            ? { value: step.temperature.value, unit: step.temperature.unit as "F" | "C" }
            : undefined;

        return {
          stepNumber: step?.stepNumber ?? index + 1,
          text,
          ...(timeInMinutes !== undefined ? { timeInMinutes } : {}),
          ...(temperature ? { temperature } : {}),
        };
      })
      .filter((step: { text: string }) => Boolean(step.text?.trim()));

    // Normalize encodedSteps: if it's an array, convert to JSON string; if string, use as-is; otherwise undefined
    // IMPORTANT: Ensure encodedSteps doesn't accidentally contain sourceSteps data
    let normalizedEncodedSteps: string | undefined;
    if (enhanced.encodedSteps !== undefined && enhanced.encodedSteps !== null) {
      if (Array.isArray(enhanced.encodedSteps)) {
        normalizedEncodedSteps = JSON.stringify(enhanced.encodedSteps);
      } else if (typeof enhanced.encodedSteps === "string") {
        // Validate that this doesn't look like sourceSteps JSON (which would start with [{"stepNumber":)
        const trimmed = enhanced.encodedSteps.trim();
        if (trimmed.startsWith('[{"stepNumber":') || trimmed.startsWith("[{\"stepNumber\":")) {
          console.warn("[ingestUniversal] encodedSteps appears to contain sourceSteps data, ignoring");
          normalizedEncodedSteps = undefined;
        } else {
          normalizedEncodedSteps = enhanced.encodedSteps;
        }
      } else {
        // If it's some other type, try to stringify it
        normalizedEncodedSteps = JSON.stringify(enhanced.encodedSteps);
      }
    }

    const rawAttribution = enhanced.attribution || {};
    const normalizeAuthorName = (value: unknown): string | undefined => {
      if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed ? trimmed : undefined;
      }
      if (value && typeof value === "object" && "name" in value) {
        const candidate = (value as { name?: unknown }).name;
        if (typeof candidate === "string") {
          const trimmed = candidate.trim();
          return trimmed ? trimmed : undefined;
        }
      }
      return undefined;
    };
    const authorSocial = normalizeSocialHandles(rawAttribution.authorSocial);
    const sourceUrl = rawAttribution.sourceUrl || args.sourceUrl;
    const sourceHost = rawAttribution.sourceHost || normalizeHost(sourceUrl);
    const normalizedSourceHost = sourceHost?.toLowerCase();
    const authorName = rawAttribution.authorName || rawAttribution.author || enhanced.author;
    const normalizedAuthorName = normalizeAuthorName(authorName);
    const authorNameLookup = normalizedAuthorName?.toLowerCase();
    const authorWebsite = rawAttribution.authorWebsite?.trim();

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
      sourceHost: normalizedSourceHost,
      authorName: authorNameLookup,
      authorWebsite: authorWebsite || undefined,
      authorSocial,
      authorSocialInstagram: authorSocial?.instagram?.toLowerCase(),
      authorSocialPinterest: authorSocial?.pinterest?.toLowerCase(),
      authorSocialYoutube: authorSocial?.youtube?.toLowerCase(),
      authorSocialFacebook: authorSocial?.facebook?.toLowerCase(),
      source: detectedSourceType,
      sourceUrl,
      attribution: {
        source: rawAttribution.source || detectedSourceType,
        sourceUrl,
        author: rawAttribution.author || enhanced.author || undefined,
        authorName: normalizedAuthorName || undefined,
        authorWebsite: authorWebsite || undefined,
        authorSocial,
        sourceHost: normalizedSourceHost,
        dateRetrieved:
          rawAttribution.dateRetrieved || new Date().toISOString().slice(0, 10),
      },
      imageUrls: enhanced.imageUrls || [],
      createdAt: now,
      updatedAt: now,
      isPublic: false,
      foodItemsAdded: [...foodItemsAdded, ...(enhanced.foodItemsAdded ?? [])],
    } satisfies Omit<Doc<"recipes">, "_id" | "_creationTime">;

    // Extract recipe metadata using LLM
    let metadata;
    try {
      metadata = await ctx.runAction(api.recipes.extractRecipeMetadata, {
        recipeName: normalizedRecipeName,
        description: normalizedDescription,
        ingredients: normalizedIngredients,
        sourceSteps: normalizedSourceSteps,
        prepTimeMinutes: recipeData.prepTimeMinutes,
        cookTimeMinutes: recipeData.cookTimeMinutes,
        totalTimeMinutes: recipeData.totalTimeMinutes,
        servings: recipeData.servings,
      });
    } catch (error) {
      console.error("Failed to extract recipe metadata:", error);
      metadata = {
        dietaryTags: undefined,
        cuisineTags: undefined,
        cookingStyleTags: undefined,
        allergenTags: undefined,
        mealTypeTags: undefined,
        difficultyLevel: undefined,
      };
    }

    // Calculate nutrition profile if possible
    const perServing = computeNutritionProfile(
      normalizedIngredients,
      recipeData.servings,
      foodLibrary,
    );

    const nutritionProfile =
      perServing.calories > 0
        ? {
            caloriesPerServing: Math.round(perServing.calories),
            proteinPerServing: Math.round(perServing.macronutrients.protein),
            carbsPerServing: Math.round(perServing.macronutrients.carbohydrates),
            fatPerServing: Math.round(perServing.macronutrients.fat),
            fiberPerServing: perServing.macronutrients.fiber
              ? Math.round(perServing.macronutrients.fiber)
              : undefined,
            sugarsPerServing: perServing.macronutrients.sugars
              ? Math.round(perServing.macronutrients.sugars)
              : undefined,
            sodiumPerServing: undefined, // Not calculated from food library currently
          }
        : undefined;

    // Add metadata to recipe data
    const recipeDataWithMetadata = {
      ...recipeData,
      dietaryTags: metadata.dietaryTags,
      cuisineTags: metadata.cuisineTags,
      cookingStyleTags: metadata.cookingStyleTags,
      allergenTags: metadata.allergenTags,
      mealTypeTags: metadata.mealTypeTags,
      difficultyLevel: metadata.difficultyLevel,
      nutritionProfile,
    };

    const recipeId: Id<"recipes"> = await ctx.runMutation(api.recipes.insertFromIngestion, {
      recipeData: recipeDataWithMetadata,
    });

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

    // Generate recipe images asynchronously using scheduler
    // Schedule it to run immediately after this action completes (non-blocking)
    console.log(`[ingestUniversal] Scheduling image generation for recipe ${recipeId}: "${normalizedRecipeName.en}"`);
    await ctx.scheduler.runAfter(0, internal.images.generateAndSaveRecipeImages, {
      recipeId,
      recipeName: normalizedRecipeName.en,
      description: normalizedDescription.en,
    });

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
    const sourceSteps = (enhancedRecipe.steps || [])
      .map((step: any, index: number) => {
        const text =
          typeof step === "string"
            ? step
            : step?.text ??
              (typeof step?.instructions === "string"
                ? step.instructions
                : step?.instructions?.en) ??
              "";

        const timeInMinutes =
          typeof step?.timeInMinutes === "number" ? step.timeInMinutes : undefined;

        const temperature =
          step?.temperature &&
          typeof step.temperature.value === "number" &&
          (step.temperature.unit === "F" || step.temperature.unit === "C")
            ? { value: step.temperature.value, unit: step.temperature.unit }
            : undefined;

        return {
          stepNumber: step?.stepNumber ?? index + 1,
          text,
          ...(timeInMinutes !== undefined ? { timeInMinutes } : {}),
          ...(temperature ? { temperature } : {}),
        };
      })
      .filter((step: { text: string }) => Boolean(step.text?.trim()));

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

/**
 * Backfill recipe metadata for existing recipes
 * This can be run as a one-time migration
 */
export const backfillRecipeMetadata = internalAction({
  args: {
    batchSize: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{
    processed: number;
    updated: number;
    errors: number;
    total: number;
  }> => {
    const batchSize = args.batchSize ?? 10;
    const limit = args.limit;

    // Get all recipes without metadata
    const recipes = (await ctx.runQuery(api.recipes.listAllWithoutMetadata, {
      limit,
    })) as Doc<"recipes">[];

    let processed = 0;
    let updated = 0;
    let errors = 0;

    for (let i = 0; i < recipes.length; i += batchSize) {
      const batch = recipes.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (recipe: Doc<"recipes">) => {
          try {
            // Extract metadata
            const metadata = await ctx.runAction(api.recipes.extractRecipeMetadata, {
              recipeName: recipe.recipeName,
              description: recipe.description,
              ingredients: recipe.ingredients,
              sourceSteps: recipe.sourceSteps,
              prepTimeMinutes: recipe.prepTimeMinutes,
              cookTimeMinutes: recipe.cookTimeMinutes,
              totalTimeMinutes: recipe.totalTimeMinutes,
              servings: recipe.servings,
            });

            // Calculate nutrition profile if possible
            const foodLibrary = await ctx.runQuery(api.foodLibrary.listAll, {});
            const perServing = computeNutritionProfile(
              recipe.ingredients,
              recipe.servings,
              foodLibrary,
            );

            const nutritionProfile =
              perServing.calories > 0
                ? {
                    caloriesPerServing: Math.round(perServing.calories),
                    proteinPerServing: Math.round(perServing.macronutrients.protein),
                    carbsPerServing: Math.round(perServing.macronutrients.carbohydrates),
                    fatPerServing: Math.round(perServing.macronutrients.fat),
                    fiberPerServing: perServing.macronutrients.fiber
                      ? Math.round(perServing.macronutrients.fiber)
                      : undefined,
                    sugarsPerServing: perServing.macronutrients.sugars
                      ? Math.round(perServing.macronutrients.sugars)
                      : undefined,
                    sodiumPerServing: undefined,
                  }
                : undefined;

            // Update recipe with metadata
            await ctx.runMutation(api.recipes.updateMetadata, {
              recipeId: recipe._id,
              dietaryTags: metadata.dietaryTags,
              cuisineTags: metadata.cuisineTags,
              cookingStyleTags: metadata.cookingStyleTags,
              allergenTags: metadata.allergenTags,
              mealTypeTags: metadata.mealTypeTags,
              difficultyLevel: metadata.difficultyLevel,
              nutritionProfile,
            });

            updated++;
            processed++;
          } catch (error) {
            console.error(`Failed to backfill metadata for recipe ${recipe._id}:`, error);
            errors++;
            processed++;
          }
        })
      );
    }

    return {
      processed,
      updated,
      errors,
      total: recipes.length,
    } as {
      processed: number;
      updated: number;
      errors: number;
      total: number;
    };
  },
});

/**
 * List recipes without metadata (for backfilling)
 */
export const listAllWithoutMetadata = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const allRecipes = await ctx.db.query("recipes").collect();

    // Filter recipes that are missing metadata
    const recipesWithoutMetadata = allRecipes.filter(
      (recipe) =>
        !recipe.dietaryTags ||
        !recipe.cuisineTags ||
        !recipe.cookingStyleTags ||
        !recipe.allergenTags
    );

    const sorted = recipesWithoutMetadata.sort(
      (a, b) => b.createdAt - a.createdAt
    );

    if (args.limit) {
      return sorted.slice(0, args.limit);
    }

    return sorted;
  },
});

/**
 * Update recipe metadata
 */
export const updateMetadata = mutation({
  args: {
    recipeId: v.id("recipes"),
    dietaryTags: v.optional(v.array(v.string())),
    cuisineTags: v.optional(v.array(v.string())),
    cookingStyleTags: v.optional(v.array(v.string())),
    allergenTags: v.optional(v.array(v.string())),
    mealTypeTags: v.optional(v.array(v.string())),
    difficultyLevel: v.optional(
      v.union(v.literal("easy"), v.literal("medium"), v.literal("hard"))
    ),
    nutritionProfile: v.optional(
      v.object({
        caloriesPerServing: v.number(),
        proteinPerServing: v.number(),
        carbsPerServing: v.number(),
        fatPerServing: v.number(),
        fiberPerServing: v.optional(v.number()),
        sugarsPerServing: v.optional(v.number()),
        sodiumPerServing: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const recipe = await ctx.db.get(args.recipeId);
    if (!recipe) {
      throw new Error("Recipe not found");
    }

    const updates: Partial<Doc<"recipes">> = {};

    if (args.dietaryTags !== undefined) {
      updates.dietaryTags = args.dietaryTags;
    }
    if (args.cuisineTags !== undefined) {
      updates.cuisineTags = args.cuisineTags;
    }
    if (args.cookingStyleTags !== undefined) {
      updates.cookingStyleTags = args.cookingStyleTags;
    }
    if (args.allergenTags !== undefined) {
      updates.allergenTags = args.allergenTags;
    }
    if (args.mealTypeTags !== undefined) {
      updates.mealTypeTags = args.mealTypeTags;
    }
    if (args.difficultyLevel !== undefined) {
      updates.difficultyLevel = args.difficultyLevel;
    }
    if (args.nutritionProfile !== undefined) {
      updates.nutritionProfile = args.nutritionProfile;
    }

    await ctx.db.patch(args.recipeId, updates);
    return args.recipeId;
  },
});

/**
 * Pre-compute personalized recipe lists for all users
 * This should be called by a scheduled action periodically
 */
export const precomputePersonalizedRecipes = internalAction({
  args: {
    userId: v.optional(v.id("users")), // If provided, only compute for this user
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const expiresAt = now + 60 * 60 * 1000; // 1 hour from now

    // Get users to process
    let userIds: Id<"users">[];
    if (args.userId) {
      userIds = [args.userId];
    } else {
      // Get all user IDs from database
      const allUsers = await ctx.runQuery(api.recipes.getAllUserIds, {});
      userIds = allUsers;
    }

    let computed = 0;
    let errors = 0;

    const railTypes = [
      "forYou",
      "readyToCook",
      "quickEasy",
      "cuisines",
      "dietaryFriendly",
      "householdCompatible",
    ] as const;

    for (const userId of userIds) {
      try {
        // Get user data
        const user = await ctx.runQuery(api.users.getUserById, { userId });
        if (!user) continue;

        // Compute personalized lists for each rail type
        for (const railType of railTypes) {
          const recipes = (await ctx.runQuery(api.recipes.listPersonalizedForUser, {
            userId,
            railType,
            limit: 20,
          })) as Doc<"recipes">[];

          // Store in cache
          const existing = await ctx.runQuery(api.recipes.getPersonalizedCache, {
            userId,
            railType,
          });

          const cacheData = {
            userId,
            railType,
            recipeIds: recipes.map((r: Doc<"recipes">) => r._id),
            computedAt: now,
            expiresAt,
          };

          if (existing) {
            await ctx.runMutation(api.recipes.updatePersonalizedCache, {
              cacheId: existing._id,
              ...cacheData,
            });
          } else {
            await ctx.runMutation(api.recipes.createPersonalizedCache, cacheData);
          }
        }

        computed++;
      } catch (error) {
        console.error(`Failed to precompute for user ${userId}:`, error);
        errors++;
      }
    }

    // Clean up expired cache entries
    const expiredCutoff = now - 24 * 60 * 60 * 1000; // 24 hours ago
    await ctx.runMutation(api.recipes.cleanupExpiredCache, {
      expiredBefore: expiredCutoff,
    });

    return {
      computed,
      errors,
      total: userIds.length,
    } as {
      computed: number;
      errors: number;
      total: number;
    };
  },
});

/**
 * Get personalized cache entry
 */
export const getPersonalizedCache = query({
  args: {
    userId: v.id("users"),
    railType: v.union(
      v.literal("forYou"),
      v.literal("readyToCook"),
      v.literal("quickEasy"),
      v.literal("cuisines"),
      v.literal("dietaryFriendly"),
      v.literal("householdCompatible")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userPersonalizedRecipes")
      .withIndex("by_user_and_type", (q) =>
        q.eq("userId", args.userId).eq("railType", args.railType)
      )
      .first();
  },
});

/**
 * Create personalized cache entry
 */
export const createPersonalizedCache = mutation({
  args: {
    userId: v.id("users"),
    railType: v.union(
      v.literal("forYou"),
      v.literal("readyToCook"),
      v.literal("quickEasy"),
      v.literal("cuisines"),
      v.literal("dietaryFriendly"),
      v.literal("householdCompatible")
    ),
    recipeIds: v.array(v.id("recipes")),
    computedAt: v.number(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("userPersonalizedRecipes", args);
  },
});

/**
 * Update personalized cache entry
 */
export const updatePersonalizedCache = mutation({
  args: {
    cacheId: v.id("userPersonalizedRecipes"),
    userId: v.id("users"),
    railType: v.union(
      v.literal("forYou"),
      v.literal("readyToCook"),
      v.literal("quickEasy"),
      v.literal("cuisines"),
      v.literal("dietaryFriendly"),
      v.literal("householdCompatible")
    ),
    recipeIds: v.array(v.id("recipes")),
    computedAt: v.number(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const { cacheId, ...updates } = args;
    await ctx.db.patch(cacheId, updates);
    return cacheId;
  },
});

/**
 * Cleanup expired cache entries
 */
export const cleanupExpiredCache = mutation({
  args: {
    expiredBefore: v.number(),
  },
  handler: async (ctx, args) => {
    const expired = await ctx.db
      .query("userPersonalizedRecipes")
      .withIndex("by_expires_at", (q) => q.lt("expiresAt", args.expiredBefore))
      .collect();

    for (const entry of expired) {
      await ctx.db.delete(entry._id);
    }

    return { deleted: expired.length };
  },
});

/**
 * Invalidate cache for a user (call when preferences/inventory change)
 */
export const invalidateUserCache = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const cacheEntries = await ctx.db
      .query("userPersonalizedRecipes")
      .withIndex("by_user_and_type", (q) => q.eq("userId", args.userId))
      .collect();

    // Delete all cache entries for this user
    for (const entry of cacheEntries) {
      await ctx.db.delete(entry._id);
    }

    return { deleted: cacheEntries.length };
  },
});

/**
 * Get all user IDs (for pre-computation)
 */
export const getAllUserIds = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.map((u) => u._id);
  },
});

/**
 * List personalized recipes for a specific user (internal version for pre-computation)
 */
export const listPersonalizedForUser = query({
  args: {
    userId: v.id("users"),
    railType: v.union(
      v.literal("forYou"),
      v.literal("readyToCook"),
      v.literal("quickEasy"),
      v.literal("cuisines"),
      v.literal("dietaryFriendly"),
      v.literal("householdCompatible")
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    const now = Date.now();

    // Check cache first
    const cached = await ctx.db
      .query("userPersonalizedRecipes")
      .withIndex("by_user_and_type", (q) =>
        q.eq("userId", args.userId).eq("railType", args.railType)
      )
      .first();

    if (cached && cached.expiresAt > now) {
      const recipes = await Promise.all(
        cached.recipeIds.map((id) => ctx.db.get(id))
      );
      return recipes.filter(Boolean) as Doc<"recipes">[];
    }

    // Compute fresh (same logic as listPersonalized but for specific user)
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return [];
    }

    // Get user preferences and inventory (same as listPersonalized)
    const dietaryRestrictions = (user.dietaryRestrictions ?? []) as string[];
    const allergies = (user.allergies ?? []) as string[];
    const favoriteCuisines = (user.favoriteCuisines ?? []) as string[];
    const cookingStylePreferences = (user.cookingStylePreferences ??
      []) as string[];
    const nutritionGoals = user.nutritionGoals;
    const foodLibrary = await ctx.runQuery(api.foodLibrary.listAll, {});
    const foodLibraryIndex = buildFoodLibraryIndex(foodLibrary);

    let userInventory: string[] = [];
    let inventoryExpirationData = new Map<string, number>();
    if (user.householdId) {
      const household = await ctx.db.get(user.householdId);
      if (household?.inventory) {
        const inventory = household.inventory as UserInventoryEntry[];
        const codes = new Set<string>();
        for (const item of inventory) {
          codes.add(item.itemCode);
          const libraryEntry = foodLibraryIndex.get(item.itemCode);
          if (item.varietyCode && libraryEntry?.varietyCodes.has(item.varietyCode)) {
            codes.add(item.varietyCode);
          }
          const shelfLifeDays = libraryEntry?.shelfLifeDays ?? 7;
          const daysSincePurchase = Math.floor(
            (now - item.purchaseDate) / (1000 * 60 * 60 * 24)
          );
          const daysUntilExpiration = shelfLifeDays - daysSincePurchase;
          inventoryExpirationData.set(item.itemCode, daysUntilExpiration);
        }
        userInventory = Array.from(codes);
      }
    }

    // Get all recipes
    let filteredRecipes = await ctx.db.query("recipes").collect();

    // Apply hard filters
    filteredRecipes = filteredRecipes.filter((recipe) => {
      if (allergies.length > 0 && !matchesAllergies(recipe, allergies)) {
        return false;
      }
      const criticalRestrictions = dietaryRestrictions.filter((r) =>
        ["Halal", "Kosher"].some((cdr) =>
          r.toLowerCase().includes(cdr.toLowerCase())
        )
      );
      if (
        criticalRestrictions.length > 0 &&
        !matchesDietaryRestrictions(recipe, criticalRestrictions)
      ) {
        return false;
      }
      return true;
    });

    // Apply rail-specific filters (same as listPersonalized)
    if (args.railType === "readyToCook") {
      filteredRecipes = filteredRecipes.filter((recipe) => {
        const recipeIngredientCodes = recipe.ingredients.map(
          (ing) => ing.foodCode
        );
        return recipeIngredientCodes.every((code) =>
          userInventory.includes(code)
        );
      });
    } else if (args.railType === "quickEasy") {
      filteredRecipes = filteredRecipes.filter((recipe) => {
        const isQuick =
          recipe.totalTimeMinutes <= 30 ||
          recipe.cookingStyleTags?.some((tag) =>
            tag.toLowerCase().includes("quick")
          );
        return isQuick && matchesCookingStyles(recipe, cookingStylePreferences);
      });
    } else if (args.railType === "cuisines") {
      filteredRecipes = filteredRecipes.filter((recipe) =>
        matchesCuisines(recipe, favoriteCuisines)
      );
    } else if (args.railType === "dietaryFriendly") {
      filteredRecipes = filteredRecipes.filter((recipe) =>
        matchesDietaryRestrictions(recipe, dietaryRestrictions)
      );
    } else if (args.railType === "householdCompatible") {
      if (user.householdId) {
        const household = await ctx.db.get(user.householdId);
        if (household) {
          const memberDocs = await Promise.all(
            household.members.map((id: Id<"users">) => ctx.db.get(id))
          );
          const householdMembers = memberDocs
            .filter((member): member is Doc<"users"> => member !== null)
            .map((member) => ({
              memberId: member._id,
              memberName: member.name ?? "Unknown",
              allergies: (member.allergies ?? []) as string[],
              dietaryRestrictions: (member.dietaryRestrictions ??
                []) as string[],
            }))
            .map((m) => ({
              ...m,
              memberId: m.memberId as unknown as string,
            }));

          filteredRecipes = filteredRecipes.filter((recipe) => {
            const compatibility = getRecipeCompatibility(
              recipe,
              householdMembers
            );
            return compatibility.incompatibleMembers.length === 0;
          });
        }
      }
    }

    // Score and sort
    const scoredRecipes = filteredRecipes.map((recipe) => {
      const filterOptions: RecipeFilterOptions = {
        dietaryRestrictions,
        allergies,
        favoriteCuisines,
        cookingStylePreferences,
        nutritionGoals: nutritionGoals ?? undefined,
      };

      const score = calculateRecipeScore(
        recipe,
        filterOptions,
        userInventory,
        inventoryExpirationData
      );

      return { recipe, score };
    });

    scoredRecipes.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return b.recipe.createdAt - a.recipe.createdAt;
    });

    return scoredRecipes
      .slice(0, limit)
      .map((entry) => entry.recipe);
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
            temperature: v.optional(
              v.object({
                unit: v.string(),
                value: v.number(),
              })
            ),
          })
        )
      ),
      emojiTags: v.array(v.string()),
      prepTimeMinutes: v.number(),
      cookTimeMinutes: v.number(),
      totalTimeMinutes: v.number(),
      servings: v.number(),
      sourceHost: v.optional(v.string()),
      authorName: v.optional(v.string()),
      authorWebsite: v.optional(v.string()),
      authorSocial: v.optional(
        v.object({
          instagram: v.optional(v.string()),
          pinterest: v.optional(v.string()),
          youtube: v.optional(v.string()),
          facebook: v.optional(v.string()),
        }),
      ),
      authorSocialInstagram: v.optional(v.string()),
      authorSocialPinterest: v.optional(v.string()),
      authorSocialYoutube: v.optional(v.string()),
      authorSocialFacebook: v.optional(v.string()),
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
      sourceUrl: v.string(),
      attribution: v.object({
        source: v.string(),
        sourceUrl: v.string(),
        author: v.optional(v.string()),
        authorName: v.optional(v.string()),
        authorWebsite: v.optional(v.string()),
        authorSocial: v.optional(
          v.object({
            instagram: v.optional(v.string()),
            pinterest: v.optional(v.string()),
            youtube: v.optional(v.string()),
            facebook: v.optional(v.string()),
          }),
        ),
        sourceHost: v.optional(v.string()),
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
    sourceHost: v.optional(v.string()),
    authorName: v.optional(v.string()),
    authorWebsite: v.optional(v.string()),
    authorSocial: v.optional(
      v.object({
        instagram: v.optional(v.string()),
        pinterest: v.optional(v.string()),
        youtube: v.optional(v.string()),
        facebook: v.optional(v.string()),
      }),
    ),
    authorSocialInstagram: v.optional(v.string()),
    authorSocialPinterest: v.optional(v.string()),
    authorSocialYoutube: v.optional(v.string()),
    authorSocialFacebook: v.optional(v.string()),
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
    sourceUrl: v.string(),
    attribution: v.object({
      source: v.string(),
      sourceUrl: v.string(),
      author: v.optional(v.string()),
      authorName: v.optional(v.string()),
      authorWebsite: v.optional(v.string()),
      authorSocial: v.optional(
        v.object({
          instagram: v.optional(v.string()),
          pinterest: v.optional(v.string()),
          youtube: v.optional(v.string()),
          facebook: v.optional(v.string()),
        }),
      ),
      sourceHost: v.optional(v.string()),
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

/**
 * Mutation to update recipe image storage IDs after image generation completes.
 */
export const updateRecipeImages = mutation({
  args: {
    recipeId: v.id("recipes"),
    originalImageLargeStorageId: v.optional(v.id("_storage")),
    originalImageSmallStorageId: v.optional(v.id("_storage")),
    transparentImageLargeStorageId: v.optional(v.id("_storage")),
    transparentImageSmallStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    console.log(`[updateRecipeImages] Updating recipe ${args.recipeId} with:`, {
      originalImageLargeStorageId: args.originalImageLargeStorageId,
      originalImageSmallStorageId: args.originalImageSmallStorageId,
      transparentImageLargeStorageId: args.transparentImageLargeStorageId,
      transparentImageSmallStorageId: args.transparentImageSmallStorageId,
    });
    
    const updateData: {
      originalImageLargeStorageId?: Id<"_storage">;
      originalImageSmallStorageId?: Id<"_storage">;
      transparentImageLargeStorageId?: Id<"_storage">;
      transparentImageSmallStorageId?: Id<"_storage">;
      updatedAt: number;
    } = {
      updatedAt: Date.now(),
    };
    
    if (args.originalImageLargeStorageId) {
      updateData.originalImageLargeStorageId = args.originalImageLargeStorageId;
    }
    if (args.originalImageSmallStorageId) {
      updateData.originalImageSmallStorageId = args.originalImageSmallStorageId;
    }
    if (args.transparentImageLargeStorageId) {
      updateData.transparentImageLargeStorageId = args.transparentImageLargeStorageId;
    }
    if (args.transparentImageSmallStorageId) {
      updateData.transparentImageSmallStorageId = args.transparentImageSmallStorageId;
    }
    
    await ctx.db.patch(args.recipeId, updateData);
    console.log(`[updateRecipeImages] Successfully updated recipe ${args.recipeId}`);
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
            timeInMinutes: v.optional(v.number()),
            temperature: v.optional(
              v.object({
                unit: v.union(v.literal("F"), v.literal("C")),
                value: v.number(),
              })
            ),
          })
        )
      ),
      emojiTags: v.array(v.string()),
      prepTimeMinutes: v.number(),
      cookTimeMinutes: v.number(),
      totalTimeMinutes: v.number(),
      servings: v.number(),
      sourceHost: v.optional(v.string()),
      authorName: v.optional(v.string()),
      authorWebsite: v.optional(v.string()),
      authorSocial: v.optional(
        v.object({
          instagram: v.optional(v.string()),
          pinterest: v.optional(v.string()),
          youtube: v.optional(v.string()),
          facebook: v.optional(v.string()),
        }),
      ),
      authorSocialInstagram: v.optional(v.string()),
      authorSocialPinterest: v.optional(v.string()),
      authorSocialYoutube: v.optional(v.string()),
      authorSocialFacebook: v.optional(v.string()),
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
      sourceUrl: v.string(),
      attribution: v.object({
        source: v.string(),
        sourceUrl: v.string(),
        author: v.optional(v.string()),
        authorName: v.optional(v.string()),
        authorWebsite: v.optional(v.string()),
        authorSocial: v.optional(
          v.object({
            instagram: v.optional(v.string()),
            pinterest: v.optional(v.string()),
            youtube: v.optional(v.string()),
            facebook: v.optional(v.string()),
          }),
        ),
        sourceHost: v.optional(v.string()),
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
      dietaryTags: v.optional(v.array(v.string())),
      cuisineTags: v.optional(v.array(v.string())),
      cookingStyleTags: v.optional(v.array(v.string())),
      allergenTags: v.optional(v.array(v.string())),
      mealTypeTags: v.optional(v.array(v.string())),
      difficultyLevel: v.optional(
        v.union(v.literal("easy"), v.literal("medium"), v.literal("hard"))
      ),
      nutritionProfile: v.optional(
        v.object({
          caloriesPerServing: v.number(),
          proteinPerServing: v.number(),
          carbsPerServing: v.number(),
          fatPerServing: v.number(),
          fiberPerServing: v.optional(v.number()),
          sugarsPerServing: v.optional(v.number()),
          sodiumPerServing: v.optional(v.number()),
        })
      ),
    }),
  },
  returns: v.id("recipes"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("recipes", args.recipeData);
  },
});

export const migrateStructuredAttributionFields = mutation({
  args: {},
  returns: v.object({
    updated: v.number(),
    total: v.number(),
  }),
  handler: async (ctx) => {
    const recipes = await ctx.db.query("recipes").collect();

    let updated = 0;

    for (const recipe of recipes) {
      const doc = recipe as any;
      const attribution = doc.attribution || {};
      const sourceUrl: string = doc.sourceUrl || attribution.sourceUrl || "";
      const normalizedSourceHost =
        doc.sourceHost || attribution.sourceHost || normalizeHost(sourceUrl)?.toLowerCase();

      const legacyParsed = parseLegacyAuthorAttribution(attribution.author);
      const structuredAuthorName =
        attribution.authorName || legacyParsed.authorName || doc.authorName;
      const authorNameLookup = structuredAuthorName?.trim().toLowerCase();
      const structuredAuthorWebsite =
        doc.authorWebsite || attribution.authorWebsite || legacyParsed.authorWebsite;
      const structuredAuthorSocial = normalizeSocialHandles(
        doc.authorSocial || attribution.authorSocial || legacyParsed.authorSocial,
      );

      const newDoc = {
        ...doc,
        sourceUrl,
        sourceHost: normalizedSourceHost,
        authorName: authorNameLookup || undefined,
        authorWebsite: structuredAuthorWebsite?.trim() || undefined,
        authorSocial: structuredAuthorSocial,
        authorSocialInstagram:
          structuredAuthorSocial?.instagram?.toLowerCase() || doc.authorSocialInstagram,
        authorSocialPinterest:
          structuredAuthorSocial?.pinterest?.toLowerCase() || doc.authorSocialPinterest,
        authorSocialYoutube:
          structuredAuthorSocial?.youtube?.toLowerCase() || doc.authorSocialYoutube,
        authorSocialFacebook:
          structuredAuthorSocial?.facebook?.toLowerCase() || doc.authorSocialFacebook,
        attribution: {
          ...attribution,
          sourceUrl,
          sourceHost: normalizedSourceHost,
          authorName: structuredAuthorName,
          authorWebsite: structuredAuthorWebsite?.trim(),
          authorSocial: structuredAuthorSocial,
        },
      };

      const hasChange =
        doc.sourceUrl !== newDoc.sourceUrl ||
        doc.sourceHost !== newDoc.sourceHost ||
        doc.authorName !== newDoc.authorName ||
        doc.authorWebsite !== newDoc.authorWebsite ||
        doc.authorSocialInstagram !== newDoc.authorSocialInstagram ||
        doc.authorSocialPinterest !== newDoc.authorSocialPinterest ||
        doc.authorSocialYoutube !== newDoc.authorSocialYoutube ||
        doc.authorSocialFacebook !== newDoc.authorSocialFacebook ||
        JSON.stringify(doc.authorSocial) !== JSON.stringify(newDoc.authorSocial) ||
        JSON.stringify(attribution) !== JSON.stringify(newDoc.attribution);

      if (hasChange) {
        await ctx.db.replace(recipe._id, newDoc);
        updated += 1;
      }
    }

    return { updated, total: recipes.length };
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

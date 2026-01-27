import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { FoodLibrarySeedItem, LocalizedText } from "../../types/food";
import type { NutritionFacts } from "../../types/nutrition";
import Replicate from "replicate";

type IngredientInput = {
  query: string;
  code?: string;
  namespace?: string;
};

type UsdaFoodNutrient = {
  nutrientId?: number;
  nutrientName?: string;
  unitName?: string;
  value?: number;
};

type UsdaFood = {
  fdcId: number;
  description: string;
  dataType?: string;
  foodNutrients?: UsdaFoodNutrient[];
};

type OpenFoodFactsProduct = {
  product_name?: string;
  product_name_en?: string;
  image_url?: string;
  brands?: string;
};

type SpoonacularIngredient = {
  name: string;
  aisle?: string;
  image?: string;
};

type SeedMetadata = {
  generatedAt: string;
  sources: string[];
  ingredientCount: number;
};

const DEFAULT_INGREDIENTS: IngredientInput[] = [
  { query: "apple" },
  { query: "banana" },
  { query: "carrot" },
];

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=600&q=80";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

class RateLimiter {
  private lastRunAt = 0;

  constructor(private minDelayMs: number) {}

  async schedule<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const delay = Math.max(0, this.minDelayMs - (now - this.lastRunAt));
    if (delay > 0) {
      await sleep(delay);
    }
    const result = await fn();
    this.lastRunAt = Date.now();
    return result;
  }
}

const limiter = new RateLimiter(400);

async function loadEnvLocal() {
  const envPath = path.join(repoRoot, ".env.local");
  try {
    const envContents = await fs.readFile(envPath, "utf8");
    for (const line of envContents.split(/\r?\n/)) {
      if (!line || line.startsWith("#")) continue;
      const [rawKey, ...rest] = line.split("=");
      if (!rawKey) continue;
      const key = rawKey.trim();
      if (key.length === 0 || process.env[key]) continue;
      const value = rest.join("=").trim().replace(/^"(.+)"$/, "$1");
      process.env[key] = value;
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}

async function fetchJson<T>(
  url: string,
  options?: RequestInit,
  retries = 3,
  backoffMs = 600,
): Promise<T> {
  return limiter.schedule(async () => {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        const response = await fetch(url, options);
        if (response.ok) {
          return (await response.json()) as T;
        }

        if (response.status === 429 || response.status >= 500) {
          const retryAfter =
            Number(response.headers.get("retry-after")) * 1000 || backoffMs;
          await sleep(retryAfter * Math.pow(2, attempt));
          continue;
        }

        throw new Error(`Request failed ${response.status} for ${url}`);
      } catch (error) {
        lastError = error as Error;
        await sleep(backoffMs * Math.pow(2, attempt));
      }
    }

    throw lastError ?? new Error(`Request failed for ${url}`);
  });
}

function normalizeForMatch(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function isLikelyMatch(query: string, candidate: string) {
  const normalizedQuery = normalizeForMatch(query);
  const normalizedCandidate = normalizeForMatch(candidate);
  if (!normalizedQuery || !normalizedCandidate) return false;
  return (
    normalizedCandidate === normalizedQuery ||
    normalizedCandidate.includes(normalizedQuery) ||
    normalizedQuery.includes(normalizedCandidate)
  );
}

function sanitizeSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function makeLocalizedText(base: string): LocalizedText {
  return { en: base };
}

function inferStorageLocation(category: string): FoodLibrarySeedItem["storageLocation"] {
  const value = category.toLowerCase();
  if (value.includes("frozen") || value.includes("freezer")) {
    return "freezer";
  }
  if (value.includes("refrigerat") || value.includes("dairy") || value.includes("produce")) {
    return "fridge";
  }
  if (value.includes("spice") || value.includes("herb")) {
    return "spicecabinet";
  }
  return "pantry";
}

function inferShelfLifeDays(storageLocation: FoodLibrarySeedItem["storageLocation"]) {
  switch (storageLocation) {
    case "fridge":
      return 10;
    case "freezer":
      return 180;
    case "spicecabinet":
      return 365;
    default:
      return 60;
  }
}

function inferStorageTips(storageLocation: FoodLibrarySeedItem["storageLocation"]) {
  switch (storageLocation) {
    case "fridge":
      return "Keep refrigerated in a breathable container; avoid excess moisture.";
    case "freezer":
      return "Store in airtight packaging and freeze promptly for best texture.";
    case "spicecabinet":
      return "Keep sealed in a cool, dark place away from heat or humidity.";
    default:
      return "Store in a cool, dry place away from direct sunlight.";
  }
}

// Known good nutrition values for common ingredients (per 100g)
const KNOWN_GOOD_VALUES: Record<string, Partial<NutritionFacts>> = {
  apple: {
    calories: 52,
    macronutrients: {
      protein: 0.3,
      carbohydrates: 14,
      fat: 0.2,
      fiber: 2.4,
      sugars: 10.4,
    },
  },
  banana: {
    calories: 89,
    macronutrients: {
      protein: 1.1,
      carbohydrates: 23,
      fat: 0.3,
      fiber: 2.6,
      sugars: 12.2,
    },
  },
  carrot: {
    calories: 41,
    macronutrients: {
      protein: 0.9,
      carbohydrates: 10,
      fat: 0.2,
      fiber: 2.8,
      sugars: 4.7,
    },
  },
};

type ValidationResult = {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  hasSignificantDeviation?: boolean;
};

function validateNutrition(
  nutrition: NutritionFacts,
  ingredientName: string,
): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Range checks
  if (nutrition.calories < 0 || nutrition.calories > 1000) {
    errors.push(`Calories out of range: ${nutrition.calories} (expected 0-1000)`);
  }
  if (nutrition.macronutrients.protein < 0 || nutrition.macronutrients.protein > 100) {
    warnings.push(`Protein out of expected range: ${nutrition.macronutrients.protein}g (expected 0-100g)`);
  }
  if (nutrition.macronutrients.carbohydrates < 0 || nutrition.macronutrients.carbohydrates > 100) {
    warnings.push(`Carbohydrates out of expected range: ${nutrition.macronutrients.carbohydrates}g (expected 0-100g)`);
  }
  if (nutrition.macronutrients.fat < 0 || nutrition.macronutrients.fat > 100) {
    warnings.push(`Fat out of expected range: ${nutrition.macronutrients.fat}g (expected 0-100g)`);
  }

  // Cross-reference with known good values
  const normalizedName = ingredientName.toLowerCase().trim();
  const knownValues = KNOWN_GOOD_VALUES[normalizedName];
  let hasSignificantDeviation = false;

  if (knownValues) {
    const tolerance = 0.2; // 20% tolerance
    if (knownValues.calories) {
      const diff = Math.abs(nutrition.calories - knownValues.calories) / knownValues.calories;
      if (diff > tolerance) {
        hasSignificantDeviation = true;
        warnings.push(
          `Calories (${nutrition.calories}) differs significantly from known value (${knownValues.calories}) - ${(diff * 100).toFixed(0)}% difference`,
        );
      }
    }
    if (knownValues.macronutrients) {
      const known = knownValues.macronutrients;
      if (known.protein !== undefined) {
        const diff = Math.abs(nutrition.macronutrients.protein - known.protein) / Math.max(known.protein, 0.1);
        if (diff > tolerance) {
          warnings.push(
            `Protein (${nutrition.macronutrients.protein}g) differs significantly from known value (${known.protein}g)`,
          );
        }
      }
      if (known.carbohydrates !== undefined) {
        const diff = Math.abs(nutrition.macronutrients.carbohydrates - known.carbohydrates) / Math.max(known.carbohydrates, 0.1);
        if (diff > tolerance) {
          warnings.push(
            `Carbohydrates (${nutrition.macronutrients.carbohydrates}g) differs significantly from known value (${known.carbohydrates}g)`,
          );
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
    hasSignificantDeviation, // Flag for fallback logic
  };
}

function validateImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function validateCompleteness(item: FoodLibrarySeedItem): string[] {
  const missing: string[] = [];

  if (!item.code) missing.push("code");
  if (!item.name) missing.push("name");
  if (!item.translations?.en) missing.push("translations.en");
  if (!item.category) missing.push("category");
  if (!item.categoryTranslations?.en) missing.push("categoryTranslations.en");
  if (!item.defaultImageUrl) missing.push("defaultImageUrl");
  if (item.nutritionPer100g.calories === 0 &&
      item.nutritionPer100g.macronutrients.protein === 0 &&
      item.nutritionPer100g.macronutrients.carbohydrates === 0) {
    missing.push("nutritionPer100g (all zeros)");
  }

  return missing;
}

function mapUsdaNutrition(food?: UsdaFood, debug = false): NutritionFacts {
  const nutrients = food?.foodNutrients ?? [];
  const byId = new Map<number, UsdaFoodNutrient>();
  const byName = new Map<string, UsdaFoodNutrient>();

  for (const nutrient of nutrients) {
    if (nutrient.nutrientId) {
      byId.set(nutrient.nutrientId, nutrient);
    }
    if (nutrient.nutrientName) {
      byName.set(nutrient.nutrientName.toLowerCase(), nutrient);
    }
  }

  const getValue = (id: number) => byId.get(id)?.value ?? 0;
  const getValueByName = (name: string) => {
    const nutrient = byName.get(name.toLowerCase());
    return nutrient?.value ?? 0;
  };

  // Debug logging
  if (debug && food) {
    console.log(`\n[DEBUG] USDA Food: ${food.description} (FDC ID: ${food.fdcId}, Type: ${food.dataType || "unknown"})`);
    console.log(`[DEBUG] Total nutrients: ${nutrients.length}`);

    // Find all energy-related nutrients
    const energyNutrients: Array<{ id?: number; name: string; value: number; unit: string }> = [];
    for (const nutrient of nutrients) {
      const nameLower = (nutrient.nutrientName || "").toLowerCase();
      if (nameLower.includes("energy") || nameLower.includes("calorie")) {
        energyNutrients.push({
          id: nutrient.nutrientId,
          name: nutrient.nutrientName || "unknown",
          value: nutrient.value || 0,
          unit: nutrient.unitName || "",
        });
      }
    }

    if (energyNutrients.length > 0) {
      console.log(`[DEBUG] Energy-related nutrients found:`);
      for (const en of energyNutrients) {
        console.log(`  - ${en.name} (ID ${en.id || "N/A"}): ${en.value} ${en.unit}`);
      }
    }

    console.log(`[DEBUG] Key macronutrients:`);
    const keyNutrients = [
      { id: 1003, name: "Protein" },
      { id: 1004, name: "Total lipid (fat)" },
      { id: 1005, name: "Carbohydrate, by difference" },
      { id: 1079, name: "Fiber, total dietary" },
      { id: 2000, name: "Sugars, total" },
    ];
    for (const key of keyNutrients) {
      const nutrient = byId.get(key.id);
      if (nutrient) {
        console.log(`  - ${key.name} (ID ${key.id}): ${nutrient.value} ${nutrient.unitName || ""}`);
      }
    }
  }

  // Try to get energy - handle multiple formats and units
  let calories = 0;
  let caloriesSource = "";

  // Priority order for energy extraction:
  // 1. "Energy (Atwater General Factors)" in kcal
  const energyAtwater = getValueByName("Energy (Atwater General Factors)");
  if (energyAtwater > 0) {
    const nutrient = byName.get("Energy (Atwater General Factors)".toLowerCase());
    const unit = nutrient?.unitName?.toLowerCase() || "";
    if (unit === "kcal" || unit === "") {
      calories = energyAtwater;
      caloriesSource = "Energy (Atwater General Factors)";
    } else if (unit === "kj" || unit === "kilojoule") {
      // Convert kJ to kcal: 1 kcal = 4.184 kJ
      calories = energyAtwater / 4.184;
      caloriesSource = "Energy (Atwater General Factors) [converted from kJ]";
    }
  }

  // 2. Nutrient ID 1008 (Energy in kcal)
  if (calories === 0) {
    const nutrient1008 = byId.get(1008);
    if (nutrient1008 && nutrient1008.value) {
      const unit = (nutrient1008.unitName || "").toLowerCase();
      if (unit === "kcal" || unit === "") {
        calories = nutrient1008.value;
        caloriesSource = "Energy (ID 1008)";
      } else if (unit === "kj" || unit === "kilojoule") {
        calories = nutrient1008.value / 4.184;
        caloriesSource = "Energy (ID 1008) [converted from kJ]";
      }
    }
  }

  // 3. "Energy (kcal)" by name
  if (calories === 0) {
    const energyKcal = getValueByName("Energy (kcal)");
    if (energyKcal > 0) {
      calories = energyKcal;
      caloriesSource = "Energy (kcal)";
    }
  }

  // 4. "Energy" by name (check unit)
  if (calories === 0) {
    const energyNutrient = byName.get("Energy".toLowerCase());
    if (energyNutrient && energyNutrient.value) {
      const unit = (energyNutrient.unitName || "").toLowerCase();
      if (unit === "kcal" || unit === "") {
        calories = energyNutrient.value;
        caloriesSource = "Energy";
      } else if (unit === "kj" || unit === "kilojoule") {
        calories = energyNutrient.value / 4.184;
        caloriesSource = "Energy [converted from kJ]";
      }
    }
  }

  // 5. Try nutrient ID 1062 (Energy in kJ) as last resort
  if (calories === 0) {
    const nutrient1062 = byId.get(1062);
    if (nutrient1062 && nutrient1062.value) {
      calories = nutrient1062.value / 4.184;
      caloriesSource = "Energy (ID 1062) [converted from kJ]";
    }
  }

  if (debug && calories > 0) {
    console.log(`[DEBUG] Selected calories: ${calories.toFixed(1)} kcal from ${caloriesSource}`);
  }

  // Get macronutrients
  const protein = getValue(1003) || getValueByName("Protein");
  const fat = getValue(1004) || getValueByName("Total lipid (fat)");
  const carbohydrates = getValue(1005) || getValueByName("Carbohydrate, by difference");
  const fiber = getValue(1079) || getValueByName("Fiber, total dietary") || undefined;
  const sugars = getValue(2000) || getValueByName("Sugars, Total") || getValueByName("Sugars, total") || undefined;

  if (debug) {
    console.log(`[DEBUG] Mapped nutrition values:`);
    console.log(`  - Calories: ${calories}`);
    console.log(`  - Protein: ${protein}g`);
    console.log(`  - Fat: ${fat}g`);
    console.log(`  - Carbohydrates: ${carbohydrates}g`);
    console.log(`  - Fiber: ${fiber ?? "N/A"}`);
    console.log(`  - Sugars: ${sugars ?? "N/A"}\n`);
  }

  return {
    calories,
    macronutrients: {
      protein,
      carbohydrates,
      fat,
      fiber,
      sugars,
    },
  };
}

function calculateFoodMatchScore(query: string, foodDescription: string): number {
  const queryLower = query.toLowerCase().trim();
  const descLower = foodDescription.toLowerCase();

  // Exact match gets highest score
  if (descLower === queryLower || descLower === `${queryLower}, raw`) {
    return 1.0;
  }

  // Check if description contains query
  if (!descLower.includes(queryLower)) {
    return 0.0;
  }

  let score = 0.5; // Base score for containing query

  // Prefer "raw" in description
  if (descLower.includes("raw") && !descLower.includes("dried") && !descLower.includes("juice")) {
    score += 0.3;
  }

  // Penalize processed foods
  const processedKeywords = ["dried", "juice", "concentrate", "canned", "frozen", "powder", "dehydrated"];
  for (const keyword of processedKeywords) {
    if (descLower.includes(keyword)) {
      score -= 0.2;
    }
  }

  // Prefer Foundation dataType
  // (This will be checked separately)

  return Math.max(0, Math.min(1, score));
}

function isProcessedFood(description: string, query: string): boolean {
  const descLower = description.toLowerCase();
  const queryLower = query.toLowerCase();

  // If query specifically asks for processed, allow it
  if (queryLower.includes("dried") || queryLower.includes("juice") || queryLower.includes("canned")) {
    return false;
  }

  // Check for processed keywords
  const processedKeywords = ["dried", "juice", "concentrate", "canned", "frozen", "powder", "dehydrated", "cooked"];
  return processedKeywords.some(keyword => descLower.includes(keyword));
}

async function fetchUsdaFood(query: string, debug = false): Promise<UsdaFood | undefined> {
  const apiKey = process.env.USDA_FDC_API_KEY;
  if (!apiKey) return undefined;

  // Try with "raw" appended first to prioritize raw ingredients
  const searchQueries = [
    `${query} raw`,
    query, // Fallback to original query
  ];

  for (const searchQuery of searchQueries) {
    const url = new URL("https://api.nal.usda.gov/fdc/v1/foods/search");
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("query", searchQuery);
    url.searchParams.set("pageSize", "10"); // Get more results to filter
    url.searchParams.set("requireAllWords", "false"); // More flexible matching
    url.searchParams.set("dataType", "Foundation,SR Legacy");

    const response = await fetchJson<{ foods?: UsdaFood[] }>(url.toString());
    const foods = response.foods || [];

    if (foods.length === 0) continue;

    // Score and filter foods
    const scoredFoods = foods
      .map(food => ({
        food,
        score: calculateFoodMatchScore(query, food.description),
        isProcessed: isProcessedFood(food.description, query),
        isFoundation: food.dataType === "Foundation",
      }))
      .filter(item => {
        // Reject processed foods unless query asks for them
        if (item.isProcessed && !query.toLowerCase().includes("dried") && !query.toLowerCase().includes("juice")) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Sort by: Foundation first, then score, then reject processed
        if (a.isFoundation !== b.isFoundation) {
          return a.isFoundation ? -1 : 1;
        }
        if (Math.abs(a.score - b.score) > 0.1) {
          return b.score - a.score;
        }
        return a.isProcessed ? 1 : -1;
      });

    if (scoredFoods.length > 0) {
      const selected = scoredFoods[0].food;
      if (debug) {
        console.log(`[DEBUG] USDA Search for "${query}":`);
        console.log(`  - Tried query: "${searchQuery}"`);
        console.log(`  - Found ${foods.length} results, filtered to ${scoredFoods.length}`);
        console.log(`  - Selected: "${selected.description}" (score: ${scoredFoods[0].score.toFixed(2)}, Foundation: ${scoredFoods[0].isFoundation})`);
        if (scoredFoods[0].isProcessed) {
          console.warn(`  - WARNING: Selected food appears to be processed!`);
        }
      }
      return selected;
    }
  }

  // Fallback: return first result if no good match found
  const fallbackUrl = new URL("https://api.nal.usda.gov/fdc/v1/foods/search");
  fallbackUrl.searchParams.set("api_key", apiKey);
  fallbackUrl.searchParams.set("query", query);
  fallbackUrl.searchParams.set("pageSize", "1");
  fallbackUrl.searchParams.set("dataType", "Foundation,SR Legacy");

  const fallbackResponse = await fetchJson<{ foods?: UsdaFood[] }>(fallbackUrl.toString());
  const fallbackFood = fallbackResponse.foods?.[0];

  if (debug && fallbackFood) {
    console.warn(`[WARN] Using fallback food for "${query}": "${fallbackFood.description}"`);
  }

  return fallbackFood;
}

async function fetchOpenFoodFacts(
  query: string,
): Promise<OpenFoodFactsProduct | undefined> {
  const url = new URL("https://world.openfoodfacts.org/api/v2/search");
  url.searchParams.set("search_terms", query);
  url.searchParams.set("page_size", "1");
  url.searchParams.set(
    "fields",
    "product_name,product_name_en,image_url,brands",
  );
  const response = await fetchJson<{ products?: OpenFoodFactsProduct[] }>(
    url.toString(),
  );
  return response.products?.[0];
}

async function fetchSpoonacularIngredient(
  query: string,
): Promise<SpoonacularIngredient | undefined> {
  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) return undefined;
  const url = new URL("https://api.spoonacular.com/food/ingredients/search");
  url.searchParams.set("query", query);
  url.searchParams.set("number", "1");
  url.searchParams.set("apiKey", apiKey);
  const response = await fetchJson<{ results?: SpoonacularIngredient[] }>(
    url.toString(),
  );
  return response.results?.[0];
}

function buildImageUrl(spoonacularImage?: string, openFoodImage?: string) {
  if (spoonacularImage) {
    return `https://spoonacular.com/cdn/ingredients_500x500/${spoonacularImage}`;
  }
  if (openFoodImage) return openFoodImage;
  return DEFAULT_IMAGE;
}

function buildAliases(openFood?: OpenFoodFactsProduct) {
  const aliases = new Set<string>();
  if (openFood?.product_name) aliases.add(openFood.product_name);
  if (openFood?.product_name_en) aliases.add(openFood.product_name_en);
  if (openFood?.brands) aliases.add(openFood.brands);
  return Array.from(aliases).filter(Boolean);
}

function buildCategory(spoonacular?: SpoonacularIngredient) {
  return spoonacular?.aisle?.trim() || "Ingredients";
}

async function enrichWithOpenAi(query: string) {
  const openAiKey = process.env.OPEN_AI_KEY;
  if (!openAiKey) return null;

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
          name: "ingredient_enrichment",
          schema: {
            type: "object",
            properties: {
              canonicalName: { type: "string" },
              standardizedName: { type: "string" },
              emoji: { type: "string" },
              category: { type: "string" },
              storageLocation: {
                type: "string",
                enum: ["pantry", "fridge", "freezer", "spicecabinet"],
              },
              shelfLifeDays: { type: "number" },
              storageTips: { type: "string" },
              translations: {
                type: "object",
                properties: {
                  en: { type: "string" },
                  es: { type: "string" },
                  zh: { type: "string" },
                  fr: { type: "string" },
                  ar: { type: "string" },
                  ja: { type: "string" },
                  vi: { type: "string" },
                  tl: { type: "string" },
                },
                required: ["en"],
                additionalProperties: false,
              },
              categoryTranslations: {
                type: "object",
                properties: {
                  en: { type: "string" },
                  es: { type: "string" },
                  zh: { type: "string" },
                  fr: { type: "string" },
                  ar: { type: "string" },
                  ja: { type: "string" },
                  vi: { type: "string" },
                  tl: { type: "string" },
                },
                required: ["en"],
                additionalProperties: false,
              },
              aliases: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["canonicalName", "category", "storageLocation", "shelfLifeDays", "storageTips"],
            additionalProperties: false,
          },
        },
      },
      messages: [
        {
          role: "system",
          content:
            "You are a food data assistant. Provide clean, ingredient-focused metadata. " +
            "Avoid brand names; use generic ingredient names. Keep translations short.",
        },
        {
          role: "user",
          content:
            `Ingredient query: "${query}". Provide canonical ingredient metadata with translations ` +
            `for en/es/zh/fr/ar/ja/vi/tl. Ensure category is a broad grocery category.`,
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
    return null;
  }

  return JSON.parse(message) as {
    canonicalName: string;
    standardizedName?: string;
    emoji?: string;
    category: string;
    storageLocation: FoodLibrarySeedItem["storageLocation"];
    shelfLifeDays: number;
    storageTips: string;
    translations?: LocalizedText;
    categoryTranslations?: LocalizedText;
    aliases?: string[];
  };
}

async function uploadImageToConvex(
  imageUrl: string,
  debug = false,
): Promise<import("../../convex/_generated/dataModel").Id<"_storage"> | undefined> {
  const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;

  if (!convexUrl) {
    if (debug) {
      console.warn("[WARN] CONVEX_URL not set, skipping image upload to Convex storage");
    }
    return undefined;
  }

  try {
    if (debug) {
      console.log(`[DEBUG] Uploading image to Convex: ${imageUrl.substring(0, 60)}...`);
    }

    // Call Convex HTTP API to invoke the storeFromUrl action
    // Format: POST https://<deployment>.convex.cloud/api/action
    const apiUrl = `${convexUrl}/api/action`;
    const requestBody = {
      path: "images:storeFromUrl",
      args: { imageUrl },
      format: "json" as const,
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Convex API error: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    const storageId = result.value as import("../../convex/_generated/dataModel").Id<"_storage">;

    if (debug) {
      console.log(`[DEBUG] Successfully uploaded image, storage ID: ${storageId}`);
    }

    return storageId;
  } catch (error) {
    console.warn(`[WARN] Failed to upload image to Convex: ${imageUrl.substring(0, 50)}...`, error);
    if (debug && error instanceof Error) {
      console.warn(`[WARN] Error details:`, error.message);
    }
    return undefined;
  }
}

async function generateReplicateImage(
  query: string,
  debug = false,
): Promise<{ url?: string; storageId?: string }> {
  const replicateApiToken = process.env.REPLICATE_API_TOKEN;
  if (!replicateApiToken) {
    if (debug) {
      console.log(`[DEBUG] Replicate API token not set, skipping image generation for "${query}"`);
    }
    return {};
  }

  try {
    const replicate = new Replicate({
      auth: replicateApiToken,
    });

    const prompt =
      `A single ${query} ingredient centered on a seamless white background, ` +
      `clean studio lighting, photorealistic, no labels, no brand packaging.`;

    if (debug) {
      console.log(`[DEBUG] Generating Replicate image for "${query}"...`);
    }

    const output = await replicate.run("bytedance/seedream-4", {
      input: {
        prompt,
        num_outputs: 1,
        aspect_ratio: "1:1",
      },
    });

    if (Array.isArray(output) && output.length > 0) {
      const url = output[0]?.url?.() ?? output[0];
      const imageUrl = typeof url === "string" ? url : url?.href;

      if (imageUrl) {
        if (debug) {
          console.log(`[DEBUG] Replicate generated image URL: ${imageUrl.substring(0, 60)}...`);
        }

        // Upload to Convex storage
        const storageId = await uploadImageToConvex(imageUrl, debug);
        return { url: imageUrl, storageId };
      }
    }
  } catch (error) {
    console.warn(`[WARN] Failed to generate Replicate image for "${query}":`, error);
  }

  return {};
}

async function normalizeIngredient(
  input: IngredientInput,
  debug = false,
): Promise<FoodLibrarySeedItem> {
  const query = input.query.trim();

  // Fetch data from all sources with error handling
  let usdaFood: UsdaFood | undefined;
  let openFood: OpenFoodFactsProduct | undefined;
  let spoonacularIngredient: SpoonacularIngredient | undefined;
  let openAiEnrichment: Awaited<ReturnType<typeof enrichWithOpenAi>> = null;

  try {
    const results = await Promise.allSettled([
      fetchUsdaFood(query, debug),
      fetchOpenFoodFacts(query),
      fetchSpoonacularIngredient(query),
      enrichWithOpenAi(query),
    ]);

    const sources = ["USDA", "OpenFoodFacts", "Spoonacular", "OpenAI"];
    const values = results.map((result, index) => {
      if (result.status === "rejected") {
        console.warn(`[WARN] Failed to fetch from ${sources[index]} for "${query}":`, result.reason);
        return index === 3 ? null : undefined; // OpenAI returns null, others return undefined
      }
      return result.value;
    });

    usdaFood = (values[0] ?? undefined) as UsdaFood | undefined;
    openFood = (values[1] ?? undefined) as OpenFoodFactsProduct | undefined;
    spoonacularIngredient = (values[2] ?? undefined) as SpoonacularIngredient | undefined;
    openAiEnrichment = (values[3] ?? null) as Awaited<ReturnType<typeof enrichWithOpenAi>>;

    // Verify USDA food matches query
    if (usdaFood && debug) {
      const matchScore = calculateFoodMatchScore(query, usdaFood.description);
      if (matchScore < 0.5) {
        console.warn(`[WARN] Low match score (${matchScore.toFixed(2)}) for "${query}" -> "${usdaFood.description}"`);
      }
      if (isProcessedFood(usdaFood.description, query)) {
        console.warn(`[WARN] USDA returned processed food for raw ingredient query: "${usdaFood.description}"`);
      }
    }
  } catch (error) {
    console.warn(`[WARN] Error fetching data for "${query}":`, error);
  }

  const openFoodName =
    openFood?.product_name_en || openFood?.product_name || "";
  const isOpenFoodMatch = openFoodName && isLikelyMatch(query, openFoodName);
  const fallbackName = usdaFood?.description || query;
  const baseName = openAiEnrichment?.canonicalName || fallbackName;
  const name = baseName.toLowerCase().trim();
  const category =
    openAiEnrichment?.category ||
    buildCategory(spoonacularIngredient);
  const storageLocation =
    openAiEnrichment?.storageLocation || inferStorageLocation(category);
  const shelfLifeDays =
    openAiEnrichment?.shelfLifeDays || inferShelfLifeDays(storageLocation);
  const storageTips =
    openAiEnrichment?.storageTips || inferStorageTips(storageLocation);
  const code =
    input.code || `external.${sanitizeSlug(query || name || "ingredient")}`;
  const namespace = input.namespace || "external";
  const aiTranslations = openAiEnrichment?.translations;
  const categoryTranslations =
    openAiEnrichment?.categoryTranslations || makeLocalizedText(category);
  const aliases = [
    ...(openAiEnrichment?.aliases ?? []),
    ...(isOpenFoodMatch ? buildAliases(openFood) : []),
  ].filter(Boolean);

  // Generate image with error handling
  let generatedImageResult: { url?: string; storageId?: string } = {};
  try {
    generatedImageResult = await generateReplicateImage(name, debug);
  } catch (error) {
    console.warn(`[WARN] Failed to generate image for "${name}":`, error);
  }

  const nutrition = mapUsdaNutrition(usdaFood, debug);

  // Try to upload images to Convex
  let imageStorageId: import("../../convex/_generated/dataModel").Id<"_storage"> | undefined = undefined;
  let imageUrl = generatedImageResult.url;

  if (!imageUrl) {
    const spoonacularUrl = spoonacularIngredient?.image
      ? `https://spoonacular.com/cdn/ingredients_500x500/${spoonacularIngredient.image}`
      : undefined;
    const openFoodUrl = isOpenFoodMatch ? openFood?.image_url : undefined;
    imageUrl = buildImageUrl(spoonacularIngredient?.image, openFoodUrl);
  }

  // Upload to Convex if we have a valid URL (not default placeholder)
  if (imageUrl && imageUrl !== DEFAULT_IMAGE) {
    try {
      const uploadedStorageId = await uploadImageToConvex(imageUrl, debug);
      if (uploadedStorageId) {
        imageStorageId = uploadedStorageId;
        if (debug) {
          console.log(`[DEBUG] ${name}: Image uploaded to Convex storage: ${imageStorageId}`);
        }
      } else if (debug) {
        console.log(`[DEBUG] ${name}: Image upload skipped or failed, using URL: ${imageUrl.substring(0, 50)}...`);
      }
    } catch (error) {
      console.warn(`[WARN] Failed to upload image to Convex for "${name}":`, error);
    }
  } else if (debug) {
    console.log(`[DEBUG] ${name}: Using default placeholder image`);
  }

  // Validate nutrition data
  const nutritionValidation = validateNutrition(nutrition, name);
  if (nutritionValidation.errors.length > 0) {
    console.warn(`[WARN] ${name}: Nutrition validation errors:`, nutritionValidation.errors);
  }
  if (nutritionValidation.warnings.length > 0) {
    if (debug) {
      console.warn(`[WARN] ${name}: Nutrition validation warnings:`, nutritionValidation.warnings);
    } else {
      // Always log significant deviations even without debug
      const significantWarnings = nutritionValidation.warnings.filter(w =>
        w.includes("differs significantly") || w.includes("out of expected range")
      );
      if (significantWarnings.length > 0) {
        console.warn(`[WARN] ${name}:`, significantWarnings.join("; "));
      }
    }
  }

  // Use known good values as fallback if validation fails OR has significant deviation
  const normalizedName = name.toLowerCase().trim();
  const knownValues = KNOWN_GOOD_VALUES[normalizedName];
  const shouldUseFallback =
    (!nutritionValidation.isValid || nutritionValidation.hasSignificantDeviation) &&
    knownValues;

  const finalNutrition = shouldUseFallback
    ? (() => {
        console.warn(`[INFO] ${name}: Using known-good nutrition values due to ${nutritionValidation.hasSignificantDeviation ? "significant deviation" : "validation errors"}`);
        return {
          calories: knownValues.calories ?? nutrition.calories,
          macronutrients: {
            protein: knownValues.macronutrients?.protein ?? nutrition.macronutrients.protein,
            carbohydrates: knownValues.macronutrients?.carbohydrates ?? nutrition.macronutrients.carbohydrates,
            fat: knownValues.macronutrients?.fat ?? nutrition.macronutrients.fat,
            fiber: knownValues.macronutrients?.fiber ?? nutrition.macronutrients.fiber,
            sugars: knownValues.macronutrients?.sugars ?? nutrition.macronutrients.sugars,
          },
        };
      })()
    : nutrition;

  // Validate image URL
  if (!imageUrl || !validateImageUrl(imageUrl)) {
    console.warn(`[WARN] ${name}: Invalid image URL: ${imageUrl}`);
    imageUrl = DEFAULT_IMAGE;
  }

  const result: FoodLibrarySeedItem = {
    code,
    namespace,
    name,
    standardizedName: openAiEnrichment?.standardizedName || name,
    aliases: aliases.length > 0 ? Array.from(new Set(aliases)) : undefined,
    translations: aiTranslations || makeLocalizedText(name),
    category,
    categoryTranslations,
    defaultImageUrl: imageUrl,
    defaultImageStorageId: imageStorageId,
    emoji: openAiEnrichment?.emoji,
    shelfLifeDays,
    storageLocation,
    storageTips,
    varieties: [],
    nutritionPer100g: finalNutrition,
  };

  // Validate completeness
  const missingFields = validateCompleteness(result);
  if (missingFields.length > 0) {
    console.warn(`[WARN] ${name}: Missing fields: ${missingFields.join(", ")}`);
  }

  return result;
}

function parseInputFromFile(raw: string): IngredientInput[] {
  const data = JSON.parse(raw) as unknown;
  if (Array.isArray(data)) {
    return data.map((entry) => {
      if (typeof entry === "string") {
        return { query: entry };
      }
      return entry as IngredientInput;
    });
  }
  throw new Error("Input file must be a JSON array of ingredient queries.");
}

async function resolveInputs(args: string[]) {
  const inputIndex = args.indexOf("--input");
  if (inputIndex !== -1 && args[inputIndex + 1]) {
    const inputPath = path.resolve(process.cwd(), args[inputIndex + 1]);
    const raw = await fs.readFile(inputPath, "utf8");
    return parseInputFromFile(raw);
  }
  return DEFAULT_INGREDIENTS;
}

async function main() {
  await loadEnvLocal();
  const args = process.argv.slice(2);
  const debug = args.includes("--debug");
  const outputIndex = args.indexOf("--output");
  const outputPath =
    outputIndex !== -1 && args[outputIndex + 1]
      ? path.resolve(process.cwd(), args[outputIndex + 1])
      : path.join(repoRoot, "data", "foodLibrarySeed.generated.ts");
  const limitIndex = args.indexOf("--limit");
  const limit =
    limitIndex !== -1 && args[limitIndex + 1]
      ? Number(args[limitIndex + 1])
      : undefined;

  const inputs = await resolveInputs(args);
  const selectedInputs = limit ? inputs.slice(0, limit) : inputs;
  const results: FoodLibrarySeedItem[] = [];

  if (debug) {
    console.log(`[DEBUG] Processing ${selectedInputs.length} ingredients with debug logging enabled\n`);
  }

  for (const input of selectedInputs) {
    try {
      const result = await normalizeIngredient(input, debug);
      results.push(result);
    } catch (error) {
      console.error(`[ERROR] Failed to process ingredient "${input.query}":`, error);
      // Continue processing other ingredients
    }
  }

  if (results.length === 0) {
    console.error("[ERROR] No ingredients were successfully processed");
    process.exit(1);
  }

  // Generate versioned filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
  const baseOutputPath = outputPath.replace(/\.generated\.ts$/, "");
  const versionedOutputPath = `${baseOutputPath}.${timestamp}.ts`;
  const latestOutputPath = outputPath; // Keep latest version at original path

  const metadata: SeedMetadata = {
    generatedAt: new Date().toISOString(),
    sources: [
      "USDA FoodData Central",
      "Open Food Facts",
      "Spoonacular",
      ...(process.env.OPEN_AI_KEY ? ["OpenAI"] : []),
      ...(process.env.REPLICATE_API_TOKEN ? ["Replicate"] : []),
    ],
    ingredientCount: results.length,
  };

  const fileContents = `import { FoodLibrarySeedItem } from "../types/food";

export const foodLibrarySeedGenerated: FoodLibrarySeedItem[] = ${JSON.stringify(
    results,
    null,
    2,
  )};

export const foodLibrarySeedGeneratedMeta = ${JSON.stringify(metadata, null, 2)};
`;

  // Write versioned file
  await fs.mkdir(path.dirname(versionedOutputPath), { recursive: true });
  await fs.writeFile(versionedOutputPath, fileContents, "utf8");
  console.log(`Wrote versioned file: ${versionedOutputPath}`);

  // Also write latest version
  await fs.mkdir(path.dirname(latestOutputPath), { recursive: true });
  await fs.writeFile(latestOutputPath, fileContents, "utf8");
  console.log(`Wrote latest version: ${latestOutputPath}`);

  console.log(`\nGenerated ${results.length} ingredients`);
  console.log(`Version: ${timestamp}`);

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, fileContents, "utf8");
  console.log(`Wrote ${results.length} ingredients to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

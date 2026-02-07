import type { TFunction } from "i18next";

import type { Doc } from "@haricot/convex-client";
import { EMOJI_TAGS } from "@/types/emojiTags";
import type { Recipe, RecipeIngredient } from "@haricot/convex-client";

const DIFFICULTY_EMOJIS = ["👶", "👨‍🍳", "👨‍🍳👨‍🍳", "⭐"] as const;

type DifficultyEmoji = (typeof DIFFICULTY_EMOJIS)[number];

type DifficultyInfo = {
  emoji: DifficultyEmoji;
  label: string;
};

const GENERIC_RECIPE_TITLES = new Set([
  "recipe",
  "recette",
  "untitled",
  "dish",
  "meal",
]);

const normalizeTitle = (value?: string | null): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed || undefined;
};

const isGenericRecipeTitle = (value?: string | null): boolean => {
  const normalized = normalizeTitle(value)?.toLowerCase();
  if (!normalized) return true;
  if (GENERIC_RECIPE_TITLES.has(normalized)) return true;
  if (/^recipe(\s+\d+)?$/.test(normalized)) return true;
  if (/^recette(\s+\d+)?$/.test(normalized)) return true;
  return false;
};

const titleCase = (value: string) =>
  value
    .split(" ")
    .map((word) => {
      if (!word) return word;
      return word[0].toUpperCase() + word.slice(1);
    })
    .join(" ");

const inferTitleFromSourceUrl = (sourceUrl?: string): string | undefined => {
  if (!sourceUrl) return undefined;

  try {
    const pathname = new URL(sourceUrl).pathname;
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return undefined;

    for (let index = segments.length - 1; index >= 0; index -= 1) {
      const rawSegment = decodeURIComponent(segments[index] || "")
        .replace(/\.(html?|php|aspx?)$/i, "")
        .replace(/[-_]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      if (!rawSegment) continue;

      const candidate = titleCase(rawSegment);
      if (!isGenericRecipeTitle(candidate)) {
        return candidate;
      }
    }
  } catch {
    return undefined;
  }

  return undefined;
};

export function getRecipeDisplayTitle(
  recipe: Recipe,
  language: keyof Recipe["recipeName"],
): string {
  const candidates = [
    recipe.recipeName[language],
    recipe.recipeName.en,
    ...Object.values(recipe.recipeName),
  ];

  for (const candidate of candidates) {
    const normalized = normalizeTitle(candidate);
    if (normalized && !isGenericRecipeTitle(normalized)) {
      return normalized;
    }
  }

  const inferredTitle = inferTitleFromSourceUrl(
    recipe.sourceUrl || recipe.attribution?.sourceUrl,
  );
  if (inferredTitle) {
    return inferredTitle;
  }

  return normalizeTitle(recipe.recipeName[language]) || normalizeTitle(recipe.recipeName.en) || "Recipe";
}

export function getRecipeDifficulty(recipe: Recipe): DifficultyInfo | null {
  const emoji = recipe.emojiTags.find((tag): tag is DifficultyEmoji =>
    DIFFICULTY_EMOJIS.includes(tag as DifficultyEmoji),
  );

  if (!emoji) {
    return null;
  }

  const label = EMOJI_TAGS[emoji] ?? "";
  return { emoji, label };
}

export function formatRecipeTime(totalMinutes: number, t: TFunction): string {
  if (totalMinutes < 60) {
    return `${totalMinutes}${t("recipe.minutesLabel", { defaultValue: "min" })}`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes > 0) {
    return `${hours}${t("recipe.hoursLabel", { defaultValue: "h" })} ${minutes}${t(
      "recipe.minutesLabel",
      { defaultValue: "min" },
    )}`;
  }

  return `${hours}${t("recipe.hoursLabel", { defaultValue: "h" })}`;
}

export type IngredientDisplayOptions = {
  foodLibrary: Map<string, Pick<Doc<"foodLibrary">, "translations" | "name">>;
  language: keyof Recipe["recipeName"];
};

export function getIngredientDisplayName(
  ingredient: RecipeIngredient,
  { foodLibrary, language }: IngredientDisplayOptions,
): string {
  const libraryItem = foodLibrary.get(ingredient.foodCode);

  if (!libraryItem) {
    return ingredient.preparation
      ? `${ingredient.foodCode} (${ingredient.preparation})`
      : ingredient.foodCode;
  }

  const translation =
    (libraryItem.translations as Record<string, { singular?: string; plural?: string }>)[
      language
    ] ??
    (libraryItem.translations as Record<string, { singular?: string; plural?: string }>)["en"];

  const baseName =
    translation?.singular ??
    translation?.plural ??
    (libraryItem as { name?: string }).name ??
    ingredient.foodCode;

  const detail = ingredient.preparation
    ? ingredient.preparation
    : ingredient.varietyCode
    ? ingredient.varietyCode.split(".").pop()?.replace(/_/g, " ")
    : undefined;

  return detail ? `${baseName} (${detail})` : baseName;
}

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

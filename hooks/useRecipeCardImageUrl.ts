import { useMemo } from "react";
import { useQuery } from "convex/react";

import {
  api,
  getDirectRecipeCardImageUrl,
  getRecipeCardStorageQueryArgs,
  shouldFetchRecipeCardStorageUrl,
  type Recipe,
} from "@haricot/convex-client";

type RecipeCardImageShape = Pick<
  Recipe,
  "imageUrls" | "transparentImageSmallStorageId" | "originalImageSmallStorageId"
>;

export const useRecipeCardImageUrl = (recipe: RecipeCardImageShape): string | null => {
  const directUrl = useMemo(() => getDirectRecipeCardImageUrl(recipe), [recipe]);
  const shouldFetchStorageUrl = useMemo(
    () => shouldFetchRecipeCardStorageUrl(recipe),
    [recipe],
  );

  const storageUrl = useQuery(
    api.fileUrls.getRecipeCardImageUrl,
    shouldFetchStorageUrl ? getRecipeCardStorageQueryArgs(recipe) : "skip",
  );

  return directUrl ?? storageUrl ?? null;
};

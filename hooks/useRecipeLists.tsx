import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

import type { Id } from "@/convex/_generated/dataModel";

export const COOK_ASAP_LIST_ID = "cook-asap";

export type RecipeListType = "cook-asap" | "standard";

type RecipeListBase = {
  id: string;
  name: string;
  emoji?: string;
};

type CookAsapListEntry = {
  recipeId: Id<"recipes">;
  addedAt: number;
};

export type CookAsapRecipeList = RecipeListBase & {
  type: "cook-asap";
  entries: CookAsapListEntry[];
  updatedAt: number;
};

export type StandardRecipeList = RecipeListBase & {
  type: "standard";
  recipeIds: Id<"recipes">[];
  createdAt: number;
  updatedAt: number;
  lastUsedAt: number;
};

export type RecipeList = CookAsapRecipeList | StandardRecipeList;

type RecipeListsContextValue = {
  cookAsapList: CookAsapRecipeList;
  standardLists: StandardRecipeList[];
  allLists: RecipeList[];
  recentLists: StandardRecipeList[];
  addRecipeToList: (listId: string, recipeId: Id<"recipes">) => void;
  removeRecipeFromList: (listId: string, recipeId: Id<"recipes">) => void;
  createList: (name: string, emoji?: string) => StandardRecipeList;
  seedLists: () => void;
  getListById: (listId: string) => RecipeList | undefined;
  isRecipeInList: (listId: string, recipeId: Id<"recipes">) => boolean;
  getListsForRecipe: (recipeId: Id<"recipes">) => RecipeList[];
};

const RecipeListsContext = createContext<RecipeListsContextValue | undefined>(undefined);

const buildInitialLists = (): RecipeList[] => {
  const timestamp = Date.now();
  return [
    {
      id: COOK_ASAP_LIST_ID,
      name: "COOK$ASAP",
      type: "cook-asap",
      entries: [],
      updatedAt: timestamp,
    },
    {
      id: "weeknight-favorites",
      name: "Weeknight Favorites",
      emoji: "🌙",
      type: "standard",
      recipeIds: [],
      createdAt: timestamp,
      updatedAt: timestamp,
      lastUsedAt: 0,
    },
    {
      id: "dessert-party",
      name: "Dessert Party",
      emoji: "🍰",
      type: "standard",
      recipeIds: [],
      createdAt: timestamp,
      updatedAt: timestamp,
      lastUsedAt: 0,
    },
  ];
};

export const RecipeListsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lists, setLists] = useState<RecipeList[]>(() => buildInitialLists());
  const [recentListIds, setRecentListIds] = useState<string[]>([]);

  const cookAsapList = useMemo(
    () => lists.find((list): list is CookAsapRecipeList => list.type === "cook-asap")!,
    [lists],
  );

  const standardLists = useMemo(
    () => lists.filter((list): list is StandardRecipeList => list.type === "standard"),
    [lists],
  );

  const allLists = useMemo(() => {
    const cookAsap = lists.find((list) => list.type === "cook-asap");
    const others = lists.filter((list): list is StandardRecipeList => list.type === "standard");
    const sortedOthers = [...others].sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      if (nameA === nameB) {
        return a.createdAt - b.createdAt;
      }
      return nameA.localeCompare(nameB);
    });
    return cookAsap ? [cookAsap, ...sortedOthers] : sortedOthers;
  }, [lists]);

  const recordRecentList = useCallback((listId: string) => {
    if (listId === COOK_ASAP_LIST_ID) {
      return;
    }

    setRecentListIds((current) => {
      const next = [listId, ...current.filter((id) => id !== listId)];
      return next.slice(0, 10);
    });
  }, []);

  const addRecipeToList = useCallback(
    (listId: string, recipeId: Id<"recipes">) => {
      setLists((current) =>
        current.map((list) => {
          if (list.id !== listId) {
            return list;
          }

          const timestamp = Date.now();

          if (list.type === "cook-asap") {
            if (list.entries.some((entry) => entry.recipeId === recipeId)) {
              return list;
            }

            return {
              ...list,
              entries: [...list.entries, { recipeId, addedAt: timestamp }],
              updatedAt: timestamp,
            } satisfies CookAsapRecipeList;
          }

          if (list.recipeIds.includes(recipeId)) {
            return list;
          }

          return {
            ...list,
            recipeIds: [...list.recipeIds, recipeId],
            updatedAt: timestamp,
            lastUsedAt: timestamp,
          } satisfies StandardRecipeList;
        }),
      );

      recordRecentList(listId);
    },
    [recordRecentList],
  );

  const removeRecipeFromList = useCallback((listId: string, recipeId: Id<"recipes">) => {
    setLists((current) =>
      current.map((list) => {
        if (list.id !== listId) {
          return list;
        }

        const timestamp = Date.now();

        if (list.type === "cook-asap") {
          return {
            ...list,
            entries: list.entries.filter((entry) => entry.recipeId !== recipeId),
            updatedAt: timestamp,
          } satisfies CookAsapRecipeList;
        }

        return {
          ...list,
          recipeIds: list.recipeIds.filter((entry) => entry !== recipeId),
          updatedAt: timestamp,
          lastUsedAt: list.lastUsedAt,
        } satisfies StandardRecipeList;
      }),
    );
  }, []);

  const createList = useCallback(
    (name: string, emoji?: string) => {
      const timestamp = Date.now();
      const newList: StandardRecipeList = {
        id: `list-${timestamp.toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        name,
        emoji,
        type: "standard",
        recipeIds: [],
        createdAt: timestamp,
        updatedAt: timestamp,
        lastUsedAt: timestamp,
      };

      setLists((current) => [...current, newList]);
      setRecentListIds((current) => [newList.id, ...current].slice(0, 10));

      return newList;
    },
    [],
  );

  const seedLists = useCallback(() => {
    setLists(buildInitialLists());
    setRecentListIds([]);
  }, []);

  const getListById = useCallback(
    (listId: string) => lists.find((list) => list.id === listId),
    [lists],
  );

  const isRecipeInList = useCallback(
    (listId: string, recipeId: Id<"recipes">) => {
      const list = getListById(listId);
      if (!list) {
        return false;
      }

      if (list.type === "cook-asap") {
        return list.entries.some((entry) => entry.recipeId === recipeId);
      }

      return list.recipeIds.includes(recipeId);
    },
    [getListById],
  );

  const getListsForRecipe = useCallback(
    (recipeId: Id<"recipes">) =>
      lists.filter((list) => {
        if (list.type === "cook-asap") {
          return list.entries.some((entry) => entry.recipeId === recipeId);
        }

        return list.recipeIds.includes(recipeId);
      }),
    [lists],
  );

  const recentLists = useMemo(() => {
    const recent = recentListIds
      .map((id) => standardLists.find((list) => list.id === id))
      .filter((list): list is StandardRecipeList => Boolean(list));

    if (recent.length >= 3) {
      return recent.slice(0, 3);
    }

    const remaining = standardLists
      .filter((list) => !recentListIds.includes(list.id))
      .sort((a, b) => b.updatedAt - a.updatedAt);

    return [...recent, ...remaining].slice(0, 3);
  }, [recentListIds, standardLists]);

  const value = useMemo<RecipeListsContextValue>(
    () => ({
      cookAsapList,
      standardLists,
      allLists,
      recentLists,
      addRecipeToList,
      removeRecipeFromList,
      createList,
      seedLists,
      getListById,
      isRecipeInList,
      getListsForRecipe,
    }),
    [
      addRecipeToList,
      allLists,
      cookAsapList,
      createList,
      getListById,
      getListsForRecipe,
      isRecipeInList,
      recentLists,
      removeRecipeFromList,
      seedLists,
      standardLists,
    ],
  );

  return <RecipeListsContext.Provider value={value}>{children}</RecipeListsContext.Provider>;
};

export const useRecipeLists = () => {
  const context = useContext(RecipeListsContext);

  if (!context) {
    throw new Error("useRecipeLists must be used within a RecipeListsProvider");
  }

  return context;
};

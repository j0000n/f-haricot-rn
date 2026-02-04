import React, { createContext, useCallback, useContext, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@haricot/convex-client";
import type { Id, Doc } from "@haricot/convex-client";

export const COOK_ASAP_LIST_ID = "cook-asap";

export type RecipeListType = "cook-asap" | "standard";

type RecipeListBase = {
  id: Id<"lists">;
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
  cookAsapList: CookAsapRecipeList | undefined;
  standardLists: StandardRecipeList[];
  allLists: RecipeList[];
  recentLists: StandardRecipeList[];
  isLoading: boolean;
  addRecipeToList: (listId: Id<"lists"> | string, recipeId: Id<"recipes">) => Promise<void>;
  removeRecipeFromList: (listId: Id<"lists"> | string, recipeId: Id<"recipes">) => Promise<void>;
  createList: (name: string) => Promise<Id<"lists">>;
  updateList: (listId: Id<"lists">, updates: { name?: string }) => Promise<void>;
  deleteList: (listId: Id<"lists">) => Promise<void>;
  seedLists: () => void;
  getListById: (listId: Id<"lists"> | string) => RecipeList | undefined;
  isRecipeInList: (listId: Id<"lists"> | string, recipeId: Id<"recipes">) => boolean;
  getListsForRecipe: (recipeId: Id<"recipes">) => RecipeList[];
};

const RecipeListsContext = createContext<RecipeListsContextValue | undefined>(undefined);

/**
 * Converts a Convex list document to RecipeList format
 */
function convertConvexListToList(list: Doc<"lists">): RecipeList {
  const base = {
    id: list._id,
    name: list.name,
    emoji: list.emoji,
  };

  if (list.type === "cook-asap") {
    return {
      ...base,
      type: "cook-asap",
      entries: list.entries || [],
      updatedAt: list.updatedAt,
    } satisfies CookAsapRecipeList;
  } else {
    return {
      ...base,
      type: "standard",
      recipeIds: list.recipeIds || [],
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
      lastUsedAt: list.lastUsedAt || 0,
    } satisfies StandardRecipeList;
  }
}

export const RecipeListsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Fetch lists from Convex
  const convexLists = useQuery(api.lists.getAll);

  // Track loading state
  const isLoading = convexLists === undefined;

  // Convert Convex documents to RecipeList format
  const lists = useMemo<RecipeList[]>(() => {
    if (convexLists === undefined) {
      return []; // Still loading
    }
    return convexLists.map(convertConvexListToList);
  }, [convexLists]);

  const cookAsapList = useMemo(
    () => lists.find((list): list is CookAsapRecipeList => list.type === "cook-asap"),
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

  // Convex mutations
  const addRecipeMutation = useMutation(api.lists.addRecipe);
  const removeRecipeMutation = useMutation(api.lists.removeRecipe);
  const createListMutation = useMutation(api.lists.create);
  const updateListMutation = useMutation(api.lists.update);
  const deleteListMutation = useMutation(api.lists.deleteList);

  const addRecipeToList = useCallback(
    async (listId: Id<"lists"> | string, recipeId: Id<"recipes">) => {
      // Handle cook-asap list special case - check if listId is the cook-asap constant
      if (listId === COOK_ASAP_LIST_ID) {
        const cookAsap = cookAsapList;
        if (!cookAsap) {
          // Create cook-asap list if it doesn't exist
          const newCookAsapId = await createListMutation({
            name: "COOK$ASAP",
            type: "cook-asap",
          });
          await addRecipeMutation({
            listId: newCookAsapId,
            recipeId,
          });
          return;
        }
        listId = cookAsap.id;
      }

      // Now listId should be a Convex ID
      await addRecipeMutation({
        listId: listId as Id<"lists">,
        recipeId,
      });
    },
    [cookAsapList, addRecipeMutation, createListMutation],
  );

  const removeRecipeFromList = useCallback(
    async (listId: Id<"lists"> | string, recipeId: Id<"recipes">) => {
      // Handle cook-asap list special case
      if (listId === COOK_ASAP_LIST_ID) {
        const cookAsap = cookAsapList;
        if (!cookAsap) {
          return; // Can't remove from non-existent list
        }
        listId = cookAsap.id;
      }

      await removeRecipeMutation({
        listId: listId as Id<"lists">,
        recipeId,
      });
    },
    [cookAsapList, removeRecipeMutation],
  );

  const createList = useCallback(
    async (name: string): Promise<Id<"lists">> => {
      const listId = await createListMutation({
        name,
        type: "standard",
      });

      // Return the ID - the query will update automatically
      return listId;
    },
    [createListMutation],
  );

  const updateList = useCallback(
    async (listId: Id<"lists">, updates: { name?: string }) => {
      await updateListMutation({
        listId,
        name: updates.name,
      });
    },
    [updateListMutation],
  );

  const deleteList = useCallback(
    async (listId: Id<"lists">) => {
      // Check if it's cook-asap list
      const list = lists.find((l) => l.id === listId);
      if (list?.type === "cook-asap") {
        return; // Don't allow deleting cook-asap list
      }

      await deleteListMutation({ listId });
    },
    [lists, deleteListMutation],
  );

  const seedLists = useCallback(() => {
    // No-op: lists are now managed by Convex
    // This function is kept for API compatibility but does nothing
  }, []);

  const getListById = useCallback(
    (listId: Id<"lists"> | string) => {
      // Handle cook-asap special case
      if (listId === COOK_ASAP_LIST_ID) {
        return cookAsapList;
      }
      return lists.find((list) => list.id === listId);
    },
    [lists, cookAsapList],
  );

  const isRecipeInList = useCallback(
    (listId: Id<"lists"> | string, recipeId: Id<"recipes">) => {
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
    // Derive recent lists from lastUsedAt field
    const sorted = [...standardLists].sort((a, b) => {
      // Sort by lastUsedAt descending, then by updatedAt descending
      const aLastUsed = a.lastUsedAt || 0;
      const bLastUsed = b.lastUsedAt || 0;
      if (aLastUsed !== bLastUsed) {
        return bLastUsed - aLastUsed;
      }
      return b.updatedAt - a.updatedAt;
    });
    return sorted.slice(0, 3);
  }, [standardLists]);

  const value = useMemo<RecipeListsContextValue>(
    () => ({
      cookAsapList,
      standardLists,
      allLists,
      recentLists,
      isLoading,
      addRecipeToList,
      removeRecipeFromList,
      createList,
      updateList,
      deleteList,
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
      deleteList,
      getListById,
      getListsForRecipe,
      isRecipeInList,
      isLoading,
      recentLists,
      removeRecipeFromList,
      seedLists,
      standardLists,
      updateList,
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

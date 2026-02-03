import { Swipe } from "@/components/Swipe";
import { useInventoryDisplay } from "@/hooks/useInventoryDisplay";
import createHomeStyles from "@/styles/homeStyles";
import { useThemedStyles } from "@/styles/tokens";
import type { Recipe } from "@haricot/convex-client";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { View } from "react-native";
import { api } from "@haricot/convex-client";
import { useQuery } from "convex/react";

export default function SwipeScreen() {
  const styles = useThemedStyles(createHomeStyles);
  const router = useRouter();
  const { user, inventoryEntries } = useInventoryDisplay();
  const personalizedRails = useQuery(api.recipes.listPersonalizedRails, {
    limit: 25,
    railTypes: ["forYou"],
  });
  const personalizedRecipes = personalizedRails?.forYou ?? [];
  const featuredRecipes = useQuery(api.recipes.listFeatured, { limit: 25 });
  const recipeList = useMemo(
    () =>
      ((personalizedRecipes && personalizedRecipes.length > 0
        ? personalizedRecipes
        : featuredRecipes) ?? []) as Recipe[],
    [featuredRecipes, personalizedRecipes],
  );

  const userInventoryCodes = useMemo(() => {
    const codes = new Set<string>();

    for (const entry of inventoryEntries) {
      codes.add(entry.itemCode);
      if (entry.varietyCode) {
        codes.add(entry.varietyCode);
      }
    }

    return Array.from(codes);
  }, [inventoryEntries]);

  const handleCookNow = (recipe: Recipe) => {
    router.push(`/recipe/${recipe._id}`);
  };

  return (
    <View style={styles.container}>
      <Swipe
        recipes={recipeList}
        userPreferences={{
          dietaryRestrictions: (user?.dietaryRestrictions ?? []) as string[],
          favoriteCuisines: (user?.favoriteCuisines ?? []) as string[],
          cookingStylePreferences: (user?.cookingStylePreferences ?? []) as string[],
          allergies: (user?.allergies ?? []) as string[],
        }}
        inventoryCodes={userInventoryCodes}
        onCookNow={handleCookNow}
      />
    </View>
  );
}

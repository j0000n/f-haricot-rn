import { useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { Recipe } from "@/types/recipe";

const SWIPE_THRESHOLD = 120;
const SWIPE_OUT_DURATION = 200;

type UserPreferences = {
  dietaryRestrictions?: string[];
  favoriteCuisines?: string[];
  cookingStylePreferences?: string[];
  allergies?: string[];
};

export type SwipeProps = {
  recipes: Recipe[];
  userPreferences?: UserPreferences;
  inventoryCodes?: string[];
  onCookNow?: (recipe: Recipe) => void;
  showTutorial?: boolean;
  showDescription?: boolean;
  showPreferences?: boolean;
  showNutrition?: boolean;
  showTags?: boolean;
  showIngredients?: boolean;
  showTimes?: boolean;
  showServings?: boolean;
  showAttribution?: boolean;
  showInventoryMatch?: boolean;
  showCookNowButton?: boolean;
};

const normalizeTags = (values?: string[]) =>
  (values ?? []).map((value) => value.toLowerCase());

const matchesAny = (recipeValues?: string[], userValues?: string[]) => {
  const normalizedRecipe = normalizeTags(recipeValues);
  const normalizedUser = normalizeTags(userValues);
  if (normalizedUser.length === 0) {
    return true;
  }
  if (normalizedRecipe.length === 0) {
    return false;
  }
  return normalizedUser.some((value) =>
    normalizedRecipe.some((tag) => tag.includes(value))
  );
};

const matchesPreferences = (recipe: Recipe, preferences?: UserPreferences) => {
  if (!preferences) {
    return true;
  }

  return (
    matchesAny(recipe.dietaryTags, preferences.dietaryRestrictions) &&
    matchesAny(recipe.cuisineTags, preferences.favoriteCuisines) &&
    matchesAny(recipe.cookingStyleTags, preferences.cookingStylePreferences)
  );
};

const matchesInventory = (recipe: Recipe, inventoryCodes?: string[]) => {
  if (!inventoryCodes || inventoryCodes.length === 0) {
    return true;
  }

  const codes = new Set(inventoryCodes);
  return recipe.ingredients.some((ingredient) => codes.has(ingredient.foodCode));
};

const buildInventoryMatch = (recipe: Recipe, inventoryCodes?: string[]) => {
  const codes = new Set(inventoryCodes ?? []);
  const ingredients = recipe.ingredients.map((ingredient) => ingredient.foodCode);
  const matched = ingredients.filter((code) => codes.has(code));
  const missing = ingredients.filter((code) => !codes.has(code));

  return {
    matched,
    missing,
    total: ingredients.length,
  };
};

export const Swipe = ({
  recipes,
  userPreferences,
  inventoryCodes,
  onCookNow,
  showTutorial = true,
  showDescription = true,
  showPreferences = true,
  showNutrition = true,
  showTags = true,
  showIngredients = true,
  showTimes = true,
  showServings = true,
  showAttribution = true,
  showInventoryMatch = true,
  showCookNowButton = true,
}: SwipeProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTutorialOverlay, setShowTutorialOverlay] = useState(showTutorial);
  const pan = useRef(new Animated.ValueXY()).current;
  const screenWidth = Dimensions.get("window").width;

  const filteredRecipes = useMemo(
    () =>
      recipes.filter(
        (recipe) =>
          matchesPreferences(recipe, userPreferences) &&
          matchesInventory(recipe, inventoryCodes)
      ),
    [recipes, userPreferences, inventoryCodes]
  );

  const resetPosition = () => {
    Animated.spring(pan, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: true,
    }).start();
  };

  const advanceCard = () => {
    pan.setValue({ x: 0, y: 0 });
    setCurrentIndex((index) => index + 1);
  };

  const forceSwipe = (direction: "left" | "right") => {
    const toValue = direction === "right" ? screenWidth * 1.2 : -screenWidth * 1.2;
    Animated.timing(pan, {
      toValue: { x: toValue, y: 0 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: true,
    }).start(() => advanceCard());
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => {
        const horizontalSwipe = Math.abs(gesture.dx) > Math.abs(gesture.dy);
        return horizontalSwipe && Math.abs(gesture.dx) > 6;
      },
      onPanResponderGrant: () => {
        if (showTutorialOverlay) {
          setShowTutorialOverlay(false);
        }
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          forceSwipe("right");
          return;
        }
        if (gesture.dx < -SWIPE_THRESHOLD) {
          forceSwipe("left");
          return;
        }
        resetPosition();
      },
    })
  ).current;

  const rotate = pan.x.interpolate({
    inputRange: [-screenWidth, 0, screenWidth],
    outputRange: ["-8deg", "0deg", "8deg"],
  });

  const likeOpacity = pan.x.interpolate({
    inputRange: [-screenWidth / 4, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const nopeOpacity = pan.x.interpolate({
    inputRange: [0, screenWidth / 4],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const renderCardContent = (recipe: Recipe) => {
    const recipeName = recipe.recipeName.en ?? Object.values(recipe.recipeName)[0] ?? "Recipe";
    const recipeDescription =
      recipe.description.en ?? Object.values(recipe.description)[0] ?? "";
    const inventoryMatch = buildInventoryMatch(recipe, inventoryCodes);
    const tags = [
      ...(recipe.dietaryTags ?? []),
      ...(recipe.cuisineTags ?? []),
      ...(recipe.cookingStyleTags ?? []),
      ...(recipe.allergenTags ?? []),
      ...(recipe.mealTypeTags ?? []),
    ];

    return (
      <View style={styles.cardBody}>
        <View style={styles.imageWrapper}>
          {recipe.imageUrls?.[0] ? (
            <Image source={{ uri: recipe.imageUrls[0] }} style={styles.image} />
          ) : (
            <View style={styles.imageFallback}>
              <Text style={styles.imageFallbackText}>{recipeName}</Text>
            </View>
          )}
        </View>
        <ScrollView
          style={styles.cardDetails}
          contentContainerStyle={styles.cardDetailsContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.recipeTitle}>{recipeName}</Text>
          {showDescription && recipeDescription ? (
            <Text style={styles.recipeDescription}>{recipeDescription}</Text>
          ) : null}
          {showTimes ? (
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>Prep: {recipe.prepTimeMinutes}m</Text>
              <Text style={styles.metaText}>Cook: {recipe.cookTimeMinutes}m</Text>
              <Text style={styles.metaText}>Total: {recipe.totalTimeMinutes}m</Text>
            </View>
          ) : null}
          {showServings ? (
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>Servings: {recipe.servings}</Text>
              {recipe.difficultyLevel ? (
                <Text style={styles.metaText}>Difficulty: {recipe.difficultyLevel}</Text>
              ) : null}
            </View>
          ) : null}
          {showPreferences && userPreferences ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your preferences</Text>
              <Text style={styles.sectionBody}>
                Dietary: {userPreferences.dietaryRestrictions?.join(", ") || "None"}
              </Text>
              <Text style={styles.sectionBody}>
                Cuisines: {userPreferences.favoriteCuisines?.join(", ") || "None"}
              </Text>
              <Text style={styles.sectionBody}>
                Cooking styles: {userPreferences.cookingStylePreferences?.join(", ") || "None"}
              </Text>
            </View>
          ) : null}
          {showInventoryMatch ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Inventory match</Text>
              <Text style={styles.sectionBody}>
                You have {inventoryMatch.matched.length} of {inventoryMatch.total} ingredients.
              </Text>
              {inventoryMatch.missing.length > 0 ? (
                <Text style={styles.sectionBody}>
                  Missing: {inventoryMatch.missing.join(", ")}
                </Text>
              ) : (
                <Text style={styles.sectionBody}>You have everything needed.</Text>
              )}
            </View>
          ) : null}
          {showNutrition && recipe.nutritionProfile ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nutrition per serving</Text>
              <Text style={styles.sectionBody}>
                Calories: {recipe.nutritionProfile.caloriesPerServing} kcal
              </Text>
              <Text style={styles.sectionBody}>
                Protein: {recipe.nutritionProfile.proteinPerServing} g
              </Text>
              <Text style={styles.sectionBody}>
                Carbs: {recipe.nutritionProfile.carbsPerServing} g
              </Text>
              <Text style={styles.sectionBody}>
                Fat: {recipe.nutritionProfile.fatPerServing} g
              </Text>
              {recipe.nutritionProfile.fiberPerServing !== undefined ? (
                <Text style={styles.sectionBody}>
                  Fiber: {recipe.nutritionProfile.fiberPerServing} g
                </Text>
              ) : null}
              {recipe.nutritionProfile.sugarsPerServing !== undefined ? (
                <Text style={styles.sectionBody}>
                  Sugar: {recipe.nutritionProfile.sugarsPerServing} g
                </Text>
              ) : null}
              {recipe.nutritionProfile.sodiumPerServing !== undefined ? (
                <Text style={styles.sectionBody}>
                  Sodium: {recipe.nutritionProfile.sodiumPerServing} mg
                </Text>
              ) : null}
            </View>
          ) : null}
          {showTags && tags.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tags</Text>
              <Text style={styles.sectionBody}>{tags.join(", ")}</Text>
            </View>
          ) : null}
          {showIngredients ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ingredients</Text>
              {recipe.ingredients.map((ingredient, index) => (
                <Text key={`${ingredient.foodCode}-${index}`} style={styles.sectionBody}>
                  • {ingredient.displayQuantity ?? ingredient.quantity} {ingredient.displayUnit ?? ingredient.unit} {ingredient.originalText ?? ingredient.foodCode}
                </Text>
              ))}
            </View>
          ) : null}
          {showAttribution ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Source</Text>
              <Text style={styles.sectionBody}>{recipe.sourceUrl}</Text>
              {recipe.authorName ? (
                <Text style={styles.sectionBody}>Author: {recipe.authorName}</Text>
              ) : null}
            </View>
          ) : null}
        </ScrollView>
        {showCookNowButton ? (
          <Pressable
            style={styles.cookButton}
            accessibilityRole="button"
            onPress={() => onCookNow?.(recipe)}
          >
            <Text style={styles.cookButtonText}>Cook now</Text>
          </Pressable>
        ) : null}
      </View>
    );
  };

  const renderCards = () => {
    if (filteredRecipes.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No recipes ready to swipe</Text>
          <Text style={styles.emptyBody}>
            Update your preferences or inventory to see personalized matches.
          </Text>
        </View>
      );
    }

    return filteredRecipes
      .map((recipe, index) => {
        if (index < currentIndex) {
          return null;
        }

        if (index === currentIndex) {
          return (
            <Animated.View
              key={recipe._id}
              style={[styles.card, { transform: [{ rotate }, ...pan.getTranslateTransform()] }]}
              {...panResponder.panHandlers}
            >
              <Animated.Text style={[styles.likeLabel, { opacity: likeOpacity }]}>LIKE</Animated.Text>
              <Animated.Text style={[styles.nopeLabel, { opacity: nopeOpacity }]}>NOPE</Animated.Text>
              {renderCardContent(recipe)}
            </Animated.View>
          );
        }

        return (
          <Animated.View
            key={recipe._id}
            style={[styles.card, styles.nextCard]}
          >
            {renderCardContent(recipe)}
          </Animated.View>
        );
      })
      .reverse();
  };

  return (
    <View style={styles.container}>
      {renderCards()}
      {showTutorialOverlay ? (
        <Pressable
          style={styles.tutorialOverlay}
          onPress={() => setShowTutorialOverlay(false)}
        >
          <View style={styles.tutorialCard}>
            <Text style={styles.tutorialTitle}>Swipe tutorial</Text>
            <Text style={styles.tutorialBody}>
              Swipe left if you like it, swipe right if you don’t.
            </Text>
            <Text style={styles.tutorialHint}>Tap anywhere to begin.</Text>
          </View>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 32,
    backgroundColor: "#0f1115",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    position: "absolute",
    width: "100%",
    maxWidth: 420,
    height: "100%",
    borderRadius: 24,
    backgroundColor: "#1a1f27",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  nextCard: {
    top: 8,
    opacity: 0.95,
  },
  cardBody: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 24,
  },
  imageWrapper: {
    height: 220,
    backgroundColor: "#222",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2b3038",
    paddingHorizontal: 16,
  },
  imageFallbackText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
  },
  cardDetails: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  cardDetailsContent: {
    paddingBottom: 16,
    rowGap: 12,
  },
  recipeTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  recipeDescription: {
    fontSize: 15,
    lineHeight: 20,
    color: "#c7c9d1",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metaText: {
    fontSize: 13,
    color: "#a7adbb",
  },
  section: {
    backgroundColor: "#202631",
    borderRadius: 16,
    padding: 12,
    gap: 6,
  },
  sectionTitle: {
    color: "#f5f5f7",
    fontWeight: "600",
    fontSize: 14,
  },
  sectionBody: {
    color: "#d0d4db",
    fontSize: 13,
  },
  cookButton: {
    backgroundColor: "#ff7a49",
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cookButtonText: {
    color: "#1a1f27",
    fontSize: 16,
    fontWeight: "700",
  },
  likeLabel: {
    position: "absolute",
    top: 24,
    left: 20,
    zIndex: 2,
    fontSize: 36,
    fontWeight: "800",
    color: "#3af8a5",
    transform: [{ rotate: "-18deg" }],
  },
  nopeLabel: {
    position: "absolute",
    top: 24,
    right: 20,
    zIndex: 2,
    fontSize: 36,
    fontWeight: "800",
    color: "#ff5c91",
    transform: [{ rotate: "18deg" }],
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptyBody: {
    color: "#a7adbb",
    textAlign: "center",
    paddingHorizontal: 24,
  },
  tutorialOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  tutorialCard: {
    backgroundColor: "#1a1f27",
    borderRadius: 20,
    padding: 20,
    gap: 8,
    alignItems: "center",
  },
  tutorialTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  tutorialBody: {
    color: "#d0d4db",
    textAlign: "center",
  },
  tutorialHint: {
    color: "#7d8493",
    fontSize: 12,
  },
});

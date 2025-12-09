import { BrandLogo } from "@/components/BrandLogo";
import { PageHeader } from "@/components/PageHeader";
import { Rail } from "@/components/Rail";
import { RecipeRail } from "@/components/RecipeRail";
import { RecipeRailCompact } from "@/components/RecipeRailCompact";
import { NutrientRail } from "@/components/NutrientRail";

import { api } from "@/convex/_generated/api";
import { useInventoryDisplay } from "@/hooks/useInventoryDisplay";
import { useRecipeLists } from "@/hooks/useRecipeLists";
import { useWidgetSync } from "@/hooks/useWidgetSync";
import { useTranslation } from "@/i18n/useTranslation";
import createHomeStyles from "@/styles/homeStyles";
import { useThemedStyles, useTokens } from "@/styles/tokens";
import type { InventoryDisplayItem } from "@/types/food";
import type { NutrientDish } from "@/types/nutrition";
import type { Recipe } from "@/types/recipe";
import { useAction, useMutation, useQuery } from "convex/react";
import { Link, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { LinkPreviewRail } from "@/components/LinkPreviewRail";
import { useLinkPreviews, createFallbackImage } from "@/hooks/useLinkPreviews";
import type { LinkPreviewData } from "@/utils/linkPreview";
import { nutrientDishes } from "@/data/nutrientDishes";
import {
  getFreshProduceItems,
  getPantryItems,
  getProteinItems,
} from "@/utils/inventoryCategories";

const SEARCH_PREVIEW_LIMIT = 5;
const LINK_PREVIEW_URLS = [
  "https://intentionalhospitality.com/cranberry-chutney/",
  "https://wellnesstrickle.com/chocolate-chip-baked-oats/",
  "https://www.foodtasticmom.com/tortellini-pasta-salad/",
  "https://projectmealplan.com/white-bean-lemon-chicken-soup/",
  "https://simplesidedishes.com/candied-orange-pecans/",
  "https://shakanranch.com/2024/03/16/roasted-garlic-rosemary-and-kalamata-olive-sourdough-bread/",
];

const LINK_PREVIEW_FALLBACKS: Record<string, Omit<LinkPreviewData, "url">> = {
  "https://intentionalhospitality.com/cranberry-chutney/": {
    title: "Cranberry Chutney",
    description: "A bright and tangy cranberry chutney perfect for the holidays.",
    image: createFallbackImage("Cranberry Chutney"),
  },
  "https://wellnesstrickle.com/chocolate-chip-baked-oats/": {
    title: "Chocolate Chip Baked Oats",
    description: "Soft, cake-like baked oats dotted with rich chocolate chips.",
    image: createFallbackImage("Baked Oats"),
  },
  "https://www.foodtasticmom.com/tortellini-pasta-salad/": {
    title: "Tortellini Pasta Salad",
    description: "Cheesy tortellini tossed with veggies for an easy pasta salad.",
    image: createFallbackImage("Tortellini Salad"),
  },
  "https://projectmealplan.com/white-bean-lemon-chicken-soup/": {
    title: "White Bean Lemon Chicken Soup",
    description: "Comforting chicken soup with creamy white beans and lemon.",
    image: createFallbackImage("Chicken Soup"),
  },
  "https://simplesidedishes.com/candied-orange-pecans/": {
    title: "Candied Orange Pecans",
    description: "Sweet citrusy candied pecans for snacking or gifting.",
    image: createFallbackImage("Orange Pecans"),
  },
  "https://shakanranch.com/2024/03/16/roasted-garlic-rosemary-and-kalamata-olive-sourdough-bread/": {
    title: "Garlic Rosemary Olive Sourdough",
    description: "Artisan sourdough with roasted garlic, rosemary, and olives.",
    image: createFallbackImage("Sourdough"),
  },
};

export default function HomeScreen() {
  const tasks = useQuery(api.tasks.get);
  const updateProfile = useMutation(api.users.updateProfile);
  const doSomething = useAction(api.testFunction.doSomething);
  const generateRecipeImagePrompt = useAction(api.promptGenerators.generateRecipeImagePrompt);
  const doSomethingNode = useAction(api.testFunctionNode.doSomethingNode);
  const ensureHousehold = useMutation(api.households.ensureHousehold);
  const seedInventory = useMutation(api.users.seedInventory);
  const seedRecipes = useMutation(api.recipes.seed);
  const { seedLists } = useRecipeLists();
  const router = useRouter();
  const [isResettingOnboarding, setIsResettingOnboarding] = useState(false);
  const [isSeedingInventory, setIsSeedingInventory] = useState(false);
  const [isSeedingLists, setIsSeedingLists] = useState(false);
  const styles = useThemedStyles(createHomeStyles);
  const { t, i18n } = useTranslation();
  const tokens = useTokens();
  const { user, inventoryItems, inventoryEntries, isLoading: isInventoryLoading } =
    useInventoryDisplay();
  const recipes = useQuery(api.recipes.listFeatured, { limit: 10 });
  const [searchTerm, setSearchTerm] = useState("");
  const trimmedSearchTerm = searchTerm.trim();
  const { previews: linkPreviews, isLoading: isLoadingLinkPreviews } = useLinkPreviews(
    LINK_PREVIEW_URLS,
    LINK_PREVIEW_FALLBACKS,
  );
  const searchPreview = useQuery(
    api.recipes.search,
    trimmedSearchTerm.length > 0
      ? { query: trimmedSearchTerm, limit: SEARCH_PREVIEW_LIMIT }
      : "skip",
  );

  const onboardingCompleted = Boolean(
    (user as { onboardingCompleted?: boolean } | null)?.onboardingCompleted
  );
  const userType = (user as { userType?: string } | null)?.userType ?? "";

  const handleRelaunchOnboarding = async () => {
    if (isResettingOnboarding) {
      return;
    }

    try {
      setIsResettingOnboarding(true);
      await updateProfile({ onboardingCompleted: false });
      const onboardingStart =
        userType === "creator"
          ? "/onboarding/creator"
          : userType === "vendor"
          ? "/onboarding/vendor"
          : "/onboarding/accessibility";
      router.push(onboardingStart);
    } catch (error) {
      console.error("Failed to relaunch onboarding", error);
    } finally {
      setIsResettingOnboarding(false);
    }
  };

  const decoratedInventoryItems = useMemo(
    () =>
      inventoryItems.map((item, index) => ({
        id: `${item.itemCode}-${index}`,
        data: item,
      })),
    [inventoryItems],
  );

  const freshProduceItems = useMemo(
    () =>
      decoratedInventoryItems.filter(({ data }) =>
        getFreshProduceItems([data]).length > 0,
      ),
    [decoratedInventoryItems],
  );
  const pantryItems = useMemo(
    () =>
      decoratedInventoryItems.filter(({ data }) => getPantryItems([data]).length > 0),
    [decoratedInventoryItems],
  );
  const proteinItems = useMemo(
    () =>
      decoratedInventoryItems.filter(({ data }) => getProteinItems([data]).length > 0),
    [decoratedInventoryItems],
  );

  const handleItemPress = (itemId: string, item: InventoryDisplayItem) => {
    console.log("Item pressed:", itemId, item.displayName);
    router.push(`/ingredient/${encodeURIComponent(itemId)}`);
    console.log("Navigating to:", `/ingredient/${encodeURIComponent(itemId)}`);
    // Navigate to item detail screen when implemented
  };

  const handleSeeAll = (category: string) => {
    console.log("See all pressed for:", category);
    // Navigate to category list screen when implemented
  };

  const handleRecipePress = (recipe: Recipe) => {
    router.push(`/recipe/${recipe._id}`);
  };

  const handleDishPress = (dish: NutrientDish) => {
    console.log("Nutrient dish pressed:", dish.name);
  };

  const handleSearchResultPress = (recipeId: string) => {
    setSearchTerm("");
    router.push(`/recipe/${recipeId}`);
  };

  const handleViewAllResults = () => {
    if (!trimmedSearchTerm) {
      return;
    }

    router.push(`/search/${encodeURIComponent(trimmedSearchTerm)}`);
  };

  const handleRecipeSeeAll = () => {
    console.log("See all pressed for: recipes");
    // Navigate to recipe collection when implemented
  };

  const handleLinkPreviewPress = (url: string) => {
    router.push(`/webview/${encodeURIComponent(url)}`);
  };

  const handleSeedInventory = async () => {
    if (isSeedingInventory) {
      return;
    }

    try {
      setIsSeedingInventory(true);
      await ensureHousehold({});
      await seedInventory({});
      await seedRecipes({});
    } catch (error) {
      console.error("Failed to seed inventory", error);
    } finally {
      setIsSeedingInventory(false);
    }
  };

  const handleSeedLists = async () => {
    if (isSeedingLists) {
      return;
    }

    try {
      setIsSeedingLists(true);
      await Promise.resolve(seedLists());
    } catch (error) {
      console.error("Failed to seed lists", error);
    } finally {
      setIsSeedingLists(false);
    }
  };

  const recipeList = useMemo(() => (recipes ?? []) as Recipe[], [recipes]);
  const previewRecipes = useMemo(
    () => (searchPreview ?? []) as Recipe[],
    [searchPreview],
  );
  const isSearching = searchPreview === undefined && trimmedSearchTerm.length > 0;
  const language = (i18n.language || "en") as keyof Recipe["recipeName"];

  const userInventoryCodes = useMemo(() => {
    const entries = inventoryEntries;
    const codes = new Set<string>();

    for (const entry of entries) {
      codes.add(entry.itemCode);
      if (entry.varietyCode) {
        codes.add(entry.varietyCode);
      }
    }

    return Array.from(codes);
  }, [inventoryEntries]);

  useWidgetSync({
    inventoryItems,
    recipes: recipeList,
    inventoryCodes: userInventoryCodes,
    language,
    enabled: !isInventoryLoading && recipes !== undefined,
  });


  return (
    <View style={styles.container}>
      <PageHeader
        leftElement={
          <BrandLogo
            width={150}
            height={40}
            accessibilityLabel={t("home.logoAccessibility")}
          />
        }
        showProfileButton={true}
      />

      <ScrollView
        style={styles.tasksContainer}
        contentContainerStyle={styles.scrollContent}
      >
        {userType ? (
          <View style={styles.userTypeBanner}>
            <Text style={styles.userTypeLabel}>
              {t("home.userTypeLabel", {
                type:
                  userType === "creator"
                    ? t("home.userTypeCreator")
                    : userType === "vendor"
                    ? t("home.userTypeVendor")
                    : userType,
              })}
            </Text>
          </View>
        ) : null}
        <View style={styles.worldEntry}>
          <Link href="/globe" asChild>
            <Pressable style={styles.worldButton} accessibilityRole="button">
              <Text style={styles.worldButtonTitle}>View Globe</Text>
              <Text style={styles.worldButtonSubtitle}>
                See cities as interactive markers on a 3D globe.
              </Text>
            </Pressable>
          </Link>
        </View>
        <View style={styles.worldEntry}>
          <Link href="/world" asChild>
            <Pressable style={styles.worldButton} accessibilityRole="button">
              <Text style={styles.worldButtonTitle}>Explore World Map</Text>
              <Text style={styles.worldButtonSubtitle}>
                Navigate continents, regions, and cities to find new culinary inspiration.
              </Text>
            </Pressable>
          </Link>
        </View>
        <View style={styles.worldEntry}>
          <Link href="/animations" asChild>
            <Pressable style={styles.worldButton} accessibilityRole="button">
              <Text style={styles.worldButtonTitle}>Built-in animations walkthrough</Text>
              <Text style={styles.worldButtonSubtitle}>
                Developer-only preview that documents Animated and LayoutAnimation with live samples.
              </Text>
            </Pressable>
          </Link>
        </View>
        <View style={styles.searchSection}>

          {generateRecipeImagePrompt && (
            <Pressable
              style={styles.searchViewAllButton}
              onPress={async () => {
                const result = await generateRecipeImagePrompt({ subject: "Pad Thai", vessel: "Ceramic Plate" });
                alert(JSON.stringify(result));
              }}
            >
              <Text>show prompt result</Text>
            </Pressable>
          )}

          {doSomething && (
            <Pressable
              style={styles.searchViewAllButton}
              onPress={async () => {
                const result = await doSomething();
                alert(JSON.stringify(result));
              }}
            >
              <Text>Show doSomething result</Text>
            </Pressable>
          )}
          <Text style={styles.searchLabel}>{t("home.searchAllRecipes")}</Text>
          <TextInput
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder={t("home.searchPlaceholder")}
            placeholderTextColor={tokens.colors.textMuted}
            style={styles.searchInput}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel={t("home.searchAllRecipes")}
          />
          {trimmedSearchTerm.length > 0 ? (
            <View style={styles.searchResultsContainer}>
              {isSearching ? (
                <Text style={styles.searchStatusText}>{t("home.searchLoading")}</Text>
              ) : previewRecipes.length > 0 ? (
                <>
                  {previewRecipes.map((recipe) => (
                    <Pressable
                      key={recipe._id}
                      onPress={() => handleSearchResultPress(recipe._id)}
                      style={styles.searchResultItem}
                      accessibilityRole="button"
                    >
                      <Text style={styles.searchResultTitle}>
                        {recipe.recipeName[language] || recipe.recipeName.en}
                      </Text>
                      <Text style={styles.searchResultDescription} numberOfLines={2}>
                        {recipe.description[language] || recipe.description.en}
                      </Text>
                    </Pressable>
                  ))}
                  <Pressable
                    onPress={handleViewAllResults}
                    style={styles.searchViewAllButton}
                    accessibilityRole="button"
                  >
                    <Text style={styles.searchViewAllText}>{t("home.searchViewAll")}</Text>
                  </Pressable>
                </>
              ) : (
                <Text style={styles.searchStatusText}>{t("home.searchNoResults")}</Text>
              )}
            </View>
          ) : null}
        </View>

        <View style={styles.seedButtonsRow}>
          <Pressable
            onPress={handleSeedInventory}
            style={[
              styles.seedButton,
              (isSeedingInventory || isInventoryLoading) && styles.seedButtonDisabled,
            ]}
            disabled={isSeedingInventory || isInventoryLoading}
          >
            <Text style={styles.seedButtonText}>
              {isSeedingInventory ? t("home.seedingInventory") : t("home.seedInventory")}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleSeedLists}
            style={[styles.seedButton, isSeedingLists && styles.seedButtonDisabled]}
            disabled={isSeedingLists}
          >
            <Text style={styles.seedButtonText}>
              {isSeedingLists ? t("home.seedingLists") : t("home.seedLists")}
            </Text>
          </Pressable>
        </View>
        <LinkPreviewRail
          header={t("home.webPreviewHeader")}
          subheader={t("home.webPreviewSubheader")}
          links={linkPreviews}
          isLoading={isLoadingLinkPreviews}
          onLinkPress={handleLinkPreviewPress}
        />
        {recipeList.length > 0 ? (
          <RecipeRail
            header={t("home.featuredRecipes")}
            subheader={t("home.featuredRecipesDesc")}
            recipes={recipeList}
            variant="detailed"
            onSeeAll={handleRecipeSeeAll}
            onRecipePress={handleRecipePress}
            userInventory={userInventoryCodes}
          />
        ) : null}

        {recipeList.length > 0 ? (
          <RecipeRailCompact
            header="Compact Recipes"
            subheader="A more compact view of recipes"
            recipes={recipeList}
            onSeeAll={handleRecipeSeeAll}
            onRecipePress={handleRecipePress}
            userInventory={userInventoryCodes}
          />
        ) : null}
        <NutrientRail
          header="Nutrition spotlights"
          subheader="Calories forward with detailed macros and quick micro highlights"
          dishes={nutrientDishes}
          onDishPress={handleDishPress}
        />
        {/* THE THREE RAILS GO HERE */}
        {freshProduceItems.length > 0 ? (
          <Rail
            header={t("home.freshProduce")}
            subheader={t("home.freshProduceDesc")}
            items={freshProduceItems}
            variant="compact"
            onSeeAll={() => handleSeeAll(t("home.freshProduce"))}
            onItemPress={handleItemPress}
          />
        ) : null}

        {pantryItems.length > 0 ? (
          <Rail
            header={t("home.pantryStaples")}
            subheader={t("home.pantryStaplesDesc")}
            items={pantryItems}
            variant="standard"
            onSeeAll={() => handleSeeAll(t("home.pantryStaples"))}
            onItemPress={handleItemPress}
          />
        ) : null}

        {proteinItems.length > 0 ? (
          <Rail
            header={t("home.proteins")}
            subheader={t("home.proteinsDesc")}
            items={proteinItems}
            variant="detailed"
            onSeeAll={() => handleSeeAll(t("home.proteins"))}
            onItemPress={handleItemPress}
          />
        ) : null}



        <View style={styles.section}>
          <Text style={styles.taskTitle}>{t("home.onboardingButtonPlaceholder")}</Text>
          <Text style={styles.sectionTitle}>{t("home.myTasks")}</Text>
          {onboardingCompleted ? (
            <View style={styles.onboardingCard}>
              <Text style={styles.onboardingCardTitle}>{t("home.revisitOnboarding")}</Text>
              <Text style={styles.onboardingCardDescription}>
                {t("home.revisitOnboardingDesc")}
              </Text>
              <Pressable
                onPress={handleRelaunchOnboarding}
                style={[
                  styles.onboardingButton,
                  isResettingOnboarding && styles.onboardingButtonDisabled,
                ]}
                disabled={isResettingOnboarding}
              >
                <Text style={styles.onboardingButtonText}>
                  {isResettingOnboarding ? t("home.launching") : t("home.relaunchOnboarding")}
                </Text>
              </Pressable>
            </View>
          ) : null}
          {tasks && tasks.length === 0 ? (
            <Text style={styles.sectionEmptyText}>
              {t("home.noTasks")}
            </Text>
          ) : (
            tasks?.map((task) => (
              <Link key={task._id} href={`/tasks/${task._id}`} asChild>
                <Pressable style={styles.taskCard}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  {task.isCompleted && (
                    <Text style={styles.completedBadge}>{t("home.completed")}</Text>
                  )}
                </Pressable>
              </Link>
            ))
          )}
        </View>
      </ScrollView>

      <Link href="/add-task" asChild>
        <Pressable style={styles.fab}>
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      </Link>
    </View>
  );
}

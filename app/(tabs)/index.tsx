import { StaticBrandLogo } from "@/components/StaticBrandLogo";
import { Header } from "@/components/Header";
import { PageHeader } from "@/components/PageHeader";
import { Rail } from "@/components/Rail";
import { RecipeRail } from "@/components/RecipeRail";
import { RecipeRailCompact } from "@/components/RecipeRailCompact";
import { NutrientRail } from "@/components/NutrientRail";

import { api } from "@haricot/convex-client";
import { useInventoryDisplay } from "@/hooks/useInventoryDisplay";
import { useRecipeLists } from "@/hooks/useRecipeLists";
import { useWidgetSync } from "@/hooks/useWidgetSync";
import { useTranslation } from "@/i18n/useTranslation";
import createHomeStyles from "@/styles/homeStyles";
import { useThemedStyles, useTokens } from "@/styles/tokens";
import { getRecipeLanguage } from "@/utils/translation";
import type { InventoryDisplayItem } from "@haricot/convex-client";
import type { NutrientDish } from "@haricot/convex-client";
import type { Recipe } from "@haricot/convex-client";
import type { Id } from "@haricot/convex-client";
import { decodeEncodedSteps } from "@/utils/decodeEncodedSteps";
import { useAction, useMutation, useQuery } from "convex/react";
import { Link, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinkPreviewRail } from "@/components/LinkPreviewRail";
import { useLinkPreviews, createFallbackImage } from "@/hooks/useLinkPreviews";
import type { LinkPreviewData } from "@/utils/linkPreview";
import { TooltipContainer } from "@/components/TooltipContainer";
import type { Tooltip } from "@/components/Tooltip";
import { nutrientDishes } from "@/data/nutrientDishes";
import {
  getFreshProduceItems,
  getPantryItems,
  getProteinItems,
} from "@/utils/inventoryCategories";

const SEARCH_PREVIEW_LIMIT = 3;
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
  const ensureHousehold = useMutation(api.households.ensureHousehold);
  const seedInventory = useMutation(api.users.seedInventory);
  const seedRecipes = useMutation(api.recipes.seed);
  const seedFoodLibrary = useMutation(api.foodLibrary.seed);
  const ingestUniversal = useAction(api.recipes.ingestUniversal);
  const { seedLists } = useRecipeLists();
  const router = useRouter();
  const [isResettingOnboarding, setIsResettingOnboarding] = useState(false);
  const [isSeedingInventory, setIsSeedingInventory] = useState(false);
  const [isSeedingLists, setIsSeedingLists] = useState(false);
  const [isSeedingFoodLibrary, setIsSeedingFoodLibrary] = useState(false);
  const [isIngestingRecipe, setIsIngestingRecipe] = useState(false);
  const [showDevSection, setShowDevSection] = useState(false);
  // Client-side function to detect media type from URL
  const detectMediaTypeFromUrl = (url: string): typeof sourceType => {
    if (!url) return "website";
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      if (hostname.includes('tiktok.com')) return 'tiktok';
      if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) return 'youtube';
      if (hostname.includes('instagram.com')) return 'instagram';
      if (hostname.includes('pinterest.com') || hostname.includes('pin.it')) return 'pinterest';
      if (hostname.includes('facebook.com') || hostname.includes('fb.com')) return 'facebook';
      if (hostname.includes('twitter.com') || hostname.includes('x.com')) return 'twitter';
      if (hostname.includes('reddit.com')) return 'reddit';
      if (hostname.includes('blogspot.com') || hostname.includes('wordpress.com') ||
          hostname.includes('medium.com') || hostname.includes('substack.com')) return 'blog';
      return 'website';
    } catch {
      return 'website';
    }
  };

  const [sourceType, setSourceType] = useState<
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
    | "other"
  >("website");
  const [sourceUrl, setSourceUrl] = useState("");
  const [rawText, setRawText] = useState("");
  const [ingestError, setIngestError] = useState<string | null>(null);

  // Auto-detect source type when URL changes
  useEffect(() => {
    if (sourceUrl.trim()) {
      const detected = detectMediaTypeFromUrl(sourceUrl.trim());
      setSourceType(detected);
    }
  }, [sourceUrl]);
  const [ingestResult, setIngestResult] = useState<
    | {
        recipeId: Id<"recipes">;
        encodingVersion: string;
        validationSummary: { ambiguous: number; missing: number };
      }
    | null
  >(null);
  const [createdRecipeId, setCreatedRecipeId] = useState<Id<"recipes"> | null>(null);
  const styles = useThemedStyles(createHomeStyles);
  const { t, i18n } = useTranslation();
  const tokens = useTokens();
  const { user, inventoryItems, inventoryEntries, isLoading: isInventoryLoading } =
    useInventoryDisplay();
  const personalizedRails = useQuery(api.recipes.listPersonalizedRails, {
    limit: 10,
    railTypes: [
      "forYou",
      "readyToCook",
      "quickEasy",
      "cuisines",
      "householdCompatible",
    ],
  });
  const personalizedRecipes = personalizedRails?.forYou ?? [];
  const quickMeals = personalizedRails?.quickEasy ?? [];
  const cuisineRecipes = personalizedRails?.cuisines ?? [];
  const readyToCook = personalizedRails?.readyToCook ?? [];
  const householdCompatible = personalizedRails?.householdCompatible ?? [];

  // Fallback to featured recipes if no personalized recipes available
  const featuredRecipes = useQuery(api.recipes.listFeatured, { limit: 10 });
  const recipes =
    personalizedRecipes.length > 0 ? personalizedRecipes : featuredRecipes ?? [];
  const [searchTerm, setSearchTerm] = useState("");
  const trimmedSearchTerm = searchTerm.trim();
  const scrollY = useRef(new Animated.Value(0)).current;
  const searchSectionRef = useRef<View>(null);
  const headerRef = useRef<View>(null);
  const [searchSectionY, setSearchSectionY] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [isSearchSticky, setIsSearchSticky] = useState(false);
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
    router.push(`/ingredient/${encodeURIComponent(itemId)}`);
  };

  const handleSeeAll = (category: string) => {
    // Navigate to kitchen screen which shows all inventory items
    router.push("/kitchen");
  };

  const handleRecipePress = (recipe: Recipe) => {
    router.push(`/recipe/${recipe._id}`);
  };


  const handleDishPress = (dish: NutrientDish) => {
    // Navigate to search for recipes related to this nutrient dish
    router.push(`/search/${encodeURIComponent(dish.name)}`);
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

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  const handleRecipeSeeAll = (railType?: string) => {
    // Navigate to view all recipes page for the specific rail type
    if (railType) {
      router.push(`/recipes/${railType}`);
    } else {
      // Fallback to search screen if no rail type provided
      router.push("/search/");
    }
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

  const handleSeedFoodLibrary = async () => {
    if (isSeedingFoodLibrary) {
      return;
    }

    try {
      setIsSeedingFoodLibrary(true);
      await seedFoodLibrary({});
    } catch (error) {
      console.error("Failed to seed food library", error);
    } finally {
      setIsSeedingFoodLibrary(false);
    }
  };

  const handleIngestRecipe = async () => {
    if (!ingestUniversal) {
      setIngestError("Ingestion action is unavailable in this build.");
      return;
    }

    if (!sourceUrl.trim()) {
      setIngestError("Please provide a source URL so we can ingest attribution correctly.");
      return;
    }

    try {
      setIsIngestingRecipe(true);
      setIngestError(null);
      // sourceType is now optional - backend will auto-detect if not provided
      const response = await ingestUniversal({
        sourceUrl: sourceUrl.trim(),
        rawText: rawText.trim() || undefined,
        // Optionally pass sourceType if user wants to override auto-detection
        ...(sourceType && sourceType !== "website" ? { sourceType } : {}),
      });

      setIngestResult(response);
      setCreatedRecipeId(response.recipeId);
    } catch (error) {
      console.error("Failed to ingest recipe", error);
      setIngestError((error as Error)?.message ?? "Unable to ingest recipe right now.");
    } finally {
      setIsIngestingRecipe(false);
    }
  };

  const recipeList = useMemo(() => (recipes ?? []) as Recipe[], [recipes]);
  const previewRecipes = useMemo(
    () => (searchPreview ?? []) as Recipe[],
    [searchPreview],
  );
  const isSearching = searchPreview === undefined && trimmedSearchTerm.length > 0;
  const hasSearchResults = trimmedSearchTerm.length > 0 && previewRecipes.length > 0;
  // Map i18n language code (e.g., "fr-FR") to recipe language code (e.g., "fr")
  const language = getRecipeLanguage(i18n.language || "en") as keyof Recipe["recipeName"];
  const createdRecipe = useQuery(
    api.recipes.getById,
    createdRecipeId ? { id: createdRecipeId } : "skip",
  );
  const translationGuides = useQuery(api.translationGuides.listAll, {});
  const createdRecipeSteps = useMemo(
    () =>
      createdRecipe
        ? decodeEncodedSteps(
            createdRecipe.encodedSteps,
            language,
            "cards",
            createdRecipe.sourceSteps,
            translationGuides ?? undefined,
            createdRecipe.sourceStepsLocalized,
          )
        : [],
    [createdRecipe, language, translationGuides],
  );

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

  // Handle scroll to track when search section should be sticky
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        // Check if we've scrolled past the search section position
        const shouldBeSticky = offsetY + headerHeight >= searchSectionY && searchSectionY > 0 && headerHeight > 0;
        setIsSearchSticky(shouldBeSticky);
      },
    },
  );

  const handleSearchSectionLayout = (event: any) => {
    const { y } = event.nativeEvent.layout;
    setSearchSectionY(y);
  };

  const handleHeaderLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    setHeaderHeight(height);
  };


  return (
    <View
      style={[
        styles.container,
        Platform.OS === "web" && {
          height: "100vh",
        },
      ]}
    >
      <View ref={headerRef} onLayout={handleHeaderLayout}>
        <PageHeader
          leftElement={
            <StaticBrandLogo
              width={40}
              height={40}
              accessibilityLabel={t("home.logoAccessibility")}
            />
          }
          showProfileButton={true}
        />
      </View>

      {/* Sticky search section - appears when scrolled */}
      {isSearchSticky && (
        <View style={[styles.stickySearchContainer, { top: headerHeight }]}>
          <View style={styles.stickySearchInputWrapper}>
            <Feather
              name="search"
              size={18}
              color={tokens.colors.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder={t("home.searchPlaceholder")}
              placeholderTextColor={tokens.colors.textMuted}
              style={styles.stickySearchInput}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel={t("home.searchAllRecipes")}
            />
            {hasSearchResults && (
              <Pressable
                onPress={handleClearSearch}
                style={styles.clearButton}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
              >
                <Feather
                  name="x"
                  size={18}
                  color={tokens.colors.textSecondary}
                />
              </Pressable>
            )}
          </View>
          {trimmedSearchTerm.length > 0 ? (
            <ScrollView
              style={[styles.searchResultsContainer, { maxHeight: 300 }]}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
            >
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
            </ScrollView>
          ) : null}
        </View>
      )}

      <Animated.ScrollView
        style={[
          styles.tasksContainer,
          Platform.OS === "web" && {
            overflow: "auto",
            height: "100%",
          },
        ]}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >

        <Pressable
          onPress={() => setShowDevSection(!showDevSection)}
          style={styles.toggleButton}
          accessibilityRole="button"
        >
          <Text style={styles.toggleButtonText}>
            {showDevSection ? "Hide Developer Section" : "Show Developer Section"}
          </Text>
        </Pressable>
        {showDevSection && (
          <>
        <View style={styles.swipeSection}>
          <Link href="/swipe" asChild>
            <Pressable style={styles.swipeLink} accessibilityRole="button">
              <Text style={styles.swipeTitle}>Swipe recipes</Text>
              <Text style={styles.swipeSubtitle}>
                Discover personalized recipes with a Tinder-style swipe.
              </Text>
            </Pressable>
          </Link>
        </View>
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
        <Header text="HELLO WORLD" textAlign="spread" color="pink" fontSize={25} />
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
          <Link href="/qr-scanner" asChild>
            <Pressable style={styles.worldButton} accessibilityRole="button">
              <Text style={styles.worldButtonTitle}>QR pairing</Text>
              <Text style={styles.worldButtonSubtitle}>
                Launch the QR scanner to validate two nearby devices on the server.
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
        <View style={styles.ingestionSection}>
          <Text style={styles.ingestionEyebrow}>Universal recipe ingestion</Text>
          <Text style={styles.ingestionHeadline}>
            Drop in a link, photo transcription, or raw steps and watch the app build a fully localized recipe with encoded steps.
          </Text>
          <Text style={styles.ingestionBody}>
            The UI below calls the same Convex action used by the ingestion pipeline. Use it to try URLs, paste OCR text, or validate social posts. Missing ingredients are auto-added to the food library so nothing blocks testing.
          </Text>

          {sourceUrl && (
            <View style={styles.sourceTypeRow}>
              <Text style={styles.ingestionLabel}>
                Detected source type: <Text style={{ fontWeight: "bold" }}>{sourceType}</Text>
              </Text>
            </View>
          )}

          <Text style={styles.ingestionLabel}>Link or source URL</Text>
          <TextInput
            value={sourceUrl}
            onChangeText={setSourceUrl}
            placeholder="https://example.com/your-recipe"
            placeholderTextColor={tokens.colors.textMuted}
            style={styles.ingestionInput}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.ingestionLabel}>Pasted text, OCR, or social caption</Text>
          <TextInput
            value={rawText}
            onChangeText={setRawText}
            placeholder="Paste ingredients or steps here so we can normalize them"
            placeholderTextColor={tokens.colors.textMuted}
            style={styles.ingestionTextArea}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          <Pressable
            onPress={handleIngestRecipe}
            disabled={isIngestingRecipe}
            style={[styles.ingestButton, isIngestingRecipe && styles.ingestButtonDisabled]}
            accessibilityRole="button"
          >
            <Text style={styles.ingestButtonText}>
              {isIngestingRecipe ? "Ingesting…" : "Convert into a structured recipe"}
            </Text>
          </Pressable>

          {ingestError ? (
            <Text style={styles.ingestErrorText}>{ingestError}</Text>
          ) : null}

          {ingestResult ? (
            <View style={styles.ingestResultCard}>
              <Text style={styles.ingestionLabel}>Ingestion summary</Text>
              <Text style={styles.ingestionBody}>
                Encoding version {ingestResult.encodingVersion} · {" "}
                {ingestResult.validationSummary.missing} missing items · {" "}
                {ingestResult.validationSummary.ambiguous} ambiguous items
              </Text>
              <Link href={`/recipe/${ingestResult.recipeId}`} asChild>
                <Pressable style={styles.ingestLinkButton} accessibilityRole="button">
                  <Text style={styles.ingestLinkButtonText}>
                    View the structured recipe page
                  </Text>
                </Pressable>
              </Link>
              {createdRecipe ? (
                <View style={styles.ingestionDetailsBox}>
                  <Text style={styles.ingestionLabel}>Recipe preview</Text>
                  <Text style={styles.ingestionBody}>
                    {createdRecipe.recipeName?.[language] || createdRecipe.recipeName?.en}
                  </Text>
                  <Text style={styles.ingestionBody}>
                    {createdRecipe.description?.[language] || createdRecipe.description?.en}
                  </Text>
                  <Text style={styles.ingestionCaption}>
                    {createdRecipe.ingredients?.length ?? 0} ingredients · {" "}
                    {createdRecipeSteps.length} steps · {" "}
                    {createdRecipe.foodItemsAdded?.length ?? 0} new library entries
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
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
          <Pressable
            onPress={handleSeedFoodLibrary}
            style={[styles.seedButton, isSeedingFoodLibrary && styles.seedButtonDisabled]}
            disabled={isSeedingFoodLibrary}
          >
            <Text style={styles.seedButtonText}>
              {isSeedingFoodLibrary ? "Seeding foods…" : "Seed food library"}
            </Text>
          </Pressable>
        </View>
          </>
        )}
        {/* <LinkPreviewRail
          header={t("home.webPreviewHeader")}
          subheader={t("home.webPreviewSubheader")}
          links={linkPreviews}
          isLoading={isLoadingLinkPreviews}
          onLinkPress={handleLinkPreviewPress}
        /> */}
        {/* Full Image Rail Example */}

        {/* Tooltip Container */}
        {(() => {
          // Mock tooltip data for now
          const mockTooltips: Tooltip[] = [
            {
              _id: "mock-tooltip-1" as any,
              title: "Welcome to Haricot!",
              content: "This is a sample tooltip to help you get started. You can dismiss it by clicking the X button in the top right corner.",
              isDismissed: false,
              createdAt: Date.now(),
            },
          ];
          return <TooltipContainer tooltips={mockTooltips} />;
        })()}

        {/* Original search section - measured for sticky positioning */}
        <View ref={searchSectionRef} onLayout={handleSearchSectionLayout}>
          <Text style={styles.searchLabel}>{t("home.searchAllRecipes")}</Text>
          <View style={styles.searchInputWrapper}>
            <Feather
              name="search"
              size={18}
              color={tokens.colors.textSecondary}
              style={styles.searchIcon}
            />
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
            {hasSearchResults && (
              <Pressable
                onPress={handleClearSearch}
                style={styles.clearButton}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
              >
                <Feather
                  name="x"
                  size={18}
                  color={tokens.colors.textSecondary}
                />
              </Pressable>
            )}
          </View>
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

        {((personalizedRecipes && personalizedRecipes.length > 0) || recipeList.length > 0) && (
          <RecipeRail
          header={t("home.featuredRecipes")}
          recipes={
              (personalizedRecipes && personalizedRecipes.length > 0
                ? [...personalizedRecipes]
                : recipeList
              ).slice(0, 5) as Recipe[]
            }
            variant="fullImage"
            onSeeAll={() => handleRecipeSeeAll("forYou")}
            onRecipePress={handleRecipePress}
            userInventory={userInventoryCodes}
          />
        )}

        {/* Personalized "For You" Rail */}
        {personalizedRecipes && personalizedRecipes.length > 0 ? (
          <RecipeRail
            header={t("home.featuredRecipes")}
            subheader={t("home.featuredRecipesDesc")}
            recipes={[...personalizedRecipes] as Recipe[]}
            variant="detailed"
            onSeeAll={() => handleRecipeSeeAll("forYou")}
            onRecipePress={handleRecipePress}
            userInventory={userInventoryCodes}
          />
        ) : recipeList.length > 0 ? (
          <RecipeRail
            header={t("home.featuredRecipes")}
            subheader={t("home.featuredRecipesDesc")}
            recipes={recipeList}
            variant="detailed"
            onSeeAll={() => handleRecipeSeeAll("forYou")}
            onRecipePress={handleRecipePress}
            userInventory={userInventoryCodes}
          />
        ) : null}

        {/* Ready to Cook Rail */}
        {readyToCook && readyToCook.length > 0 ? (
          <RecipeRail
            header="Ready to Cook"
            subheader="Recipes you can make with ingredients you have"
            recipes={readyToCook as Recipe[]}
            variant="detailed"
            onSeeAll={() => handleRecipeSeeAll("readyToCook")}
            onRecipePress={handleRecipePress}
            userInventory={userInventoryCodes}
          />
        ) : null}

        {/* Quick Meals Rail */}
        {quickMeals && quickMeals.length > 0 ? (
          <RecipeRail
            header="Quick & Easy"
            subheader="Fast recipes that match your preferences"
            recipes={quickMeals as Recipe[]}
            variant="detailed"
            onSeeAll={() => handleRecipeSeeAll("quickEasy")}
            onRecipePress={handleRecipePress}
            userInventory={userInventoryCodes}
          />
        ) : null}

        {/* Cuisine Rail */}
        {cuisineRecipes && cuisineRecipes.length > 0 ? (
          <RecipeRail
            header="Your Favorite Cuisines"
            subheader="Recipes from cuisines you love"
            recipes={cuisineRecipes as Recipe[]}
            variant="detailed"
            onSeeAll={() => handleRecipeSeeAll("cuisines")}
            onRecipePress={handleRecipePress}
            userInventory={userInventoryCodes}
          />
        ) : null}

        {/* Household Compatible Rail */}
        {householdCompatible && householdCompatible.length > 0 ? (
          <RecipeRail
            header="For Your Household"
            subheader="Recipes compatible with all household members"
            recipes={householdCompatible as Recipe[]}
            variant="detailed"
            onSeeAll={() => handleRecipeSeeAll("householdCompatible")}
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
      </Animated.ScrollView>

      <Link href="/add-task" asChild>
        <Pressable style={styles.fab}>
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      </Link>
    </View>
  );
}

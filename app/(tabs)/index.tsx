import { BrandLogo } from "@/components/BrandLogo";
import { PageHeader } from "@/components/PageHeader";
import { Rail } from "@/components/Rail";
import { RecipeRail } from "@/components/RecipeRail";

import { api } from "@/convex/_generated/api";
import { useInventoryDisplay } from "@/hooks/useInventoryDisplay";
import { useRecipeLists } from "@/hooks/useRecipeLists";
import { useWidgetSync } from "@/hooks/useWidgetSync";
import { useTranslation } from "@/i18n/useTranslation";
import createHomeStyles from "@/styles/homeStyles";
import { useThemedStyles, useTokens } from "@/styles/tokens";
import type { InventoryDisplayItem } from "@/types/food";
import type { Recipe } from "@/types/recipe";
import { useAction, useMutation, useQuery } from "convex/react";
import { Link, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { LinkPreviewRail } from "@/components/LinkPreviewRail";
import type { LinkPreviewData } from "@/components/cards/LinkPreviewCard";

const SEARCH_PREVIEW_LIMIT = 5;
const LINK_PREVIEW_URLS = [
  "https://intentionalhospitality.com/cranberry-chutney/",
  "https://wellnesstrickle.com/chocolate-chip-baked-oats/",
  "https://www.foodtasticmom.com/tortellini-pasta-salad/",
  "https://projectmealplan.com/white-bean-lemon-chicken-soup/",
  "https://simplesidedishes.com/candied-orange-pecans/",
  "https://shakanranch.com/2024/03/16/roasted-garlic-rosemary-and-kalamata-olive-sourdough-bread/",
];

const createFallbackImage = (label: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 420'><defs><linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23f6d365'/><stop offset='100%' stop-color='%23fda085'/></linearGradient></defs><rect width='800' height='420' rx='32' fill='url(#g)'/><text x='400' y='210' font-family='Arial, Helvetica, sans-serif' font-size='42' text-anchor='middle' fill='%23ffffff' font-weight='700'>${label}</text></svg>`,
  )}`;

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
  const generateRecipeImagePrompt = useAction(api.generateRecipeImagePrompt.generateRecipeImagePrompt);
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
  const [linkPreviews, setLinkPreviews] = useState<LinkPreviewData[]>([]);
  const [isLoadingLinkPreviews, setIsLoadingLinkPreviews] = useState(false);
  const trimmedSearchTerm = searchTerm.trim();
  const searchPreview = useQuery(
    api.recipes.search,
    trimmedSearchTerm.length > 0
      ? { query: trimmedSearchTerm, limit: SEARCH_PREVIEW_LIMIT }
      : "skip",
  );

  const onboardingCompleted = Boolean(
    (user as { onboardingCompleted?: boolean } | null)?.onboardingCompleted
  );

  const handleRelaunchOnboarding = async () => {
    if (isResettingOnboarding) {
      return;
    }

    try {
      setIsResettingOnboarding(true);
      await updateProfile({ onboardingCompleted: false });
      router.push("/onboarding/accessibility");
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

  const freshProduceItems = decoratedInventoryItems.filter(({ data }) =>
    ["Tree Fruits", "Berries"].includes(data.category),
  );
  const pantryItems = decoratedInventoryItems.filter(({ data }) =>
    ["Rice", "Pasta", "Bread", "Oils"].includes(data.category),
  );
  const proteinItems = decoratedInventoryItems.filter(({ data }) =>
    ["Poultry", "Beef", "Pork"].includes(data.category),
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

  useEffect(() => {
    let isCancelled = false;

    const normalizeImageUrl = (imageUrl?: string | null, baseUrl?: string) => {
      if (!imageUrl) {
        return null;
      }

      try {
        return new URL(imageUrl, baseUrl).href;
      } catch (error) {
        return imageUrl;
      }
    };

    const extractMetaContent = (html: string, key: string) => {
      const propertyMatch = new RegExp(
        `<meta[^>]*property=["']${key}["'][^>]*content=["']([^"']+)["'][^>]*>`,
        "i",
      ).exec(html);

      if (propertyMatch?.[1]) {
        return propertyMatch[1];
      }

      const nameMatch = new RegExp(
        `<meta[^>]*name=["']${key}["'][^>]*content=["']([^"']+)["'][^>]*>`,
        "i",
      ).exec(html);

      return nameMatch?.[1];
    };

    const getTitleFromHtml = (html: string) => {
      const titleMatch = /<title>([^<]*)<\/title>/i.exec(html);
      return titleMatch?.[1]?.trim();
    };

    const fetchPreviewForUrl = async (url: string): Promise<LinkPreviewData> => {
      const fallback = LINK_PREVIEW_FALLBACKS[url] || {
        title: url,
        description: "",
        image: createFallbackImage(new URL(url).hostname.replace(/^www\\./, "")),
      };

      try {
        // Try fetching on all platforms, including web
        // On web, browsers handle CORS automatically
        const response = await fetch(url, {
          mode: "cors",
          credentials: "omit",
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const html = await response.text();

        const title =
          extractMetaContent(html, "og:title") || extractMetaContent(html, "twitter:title") || getTitleFromHtml(html);
        const description =
          extractMetaContent(html, "og:description") ||
          extractMetaContent(html, "description") ||
          extractMetaContent(html, "twitter:description") ||
          fallback.description;
        const image = normalizeImageUrl(extractMetaContent(html, "og:image"), url) || fallback.image;

        return {
          url,
          title: title || fallback.title,
          description,
          image,
        };
      } catch (error) {
        // If fetch fails (CORS or network error), return fallback
        console.warn(`Failed to fetch preview for ${url}:`, error);
        return { url, ...fallback };
      }
    };

    const loadPreviews = async () => {
      setIsLoadingLinkPreviews(true);
      try {
        const results = await Promise.all(LINK_PREVIEW_URLS.map((url) => fetchPreviewForUrl(url)));
        if (!isCancelled) {
          setLinkPreviews(results);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingLinkPreviews(false);
        }
      }
    };

    loadPreviews();

    return () => {
      isCancelled = true;
    };
  }, []);

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

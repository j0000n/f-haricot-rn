import type {
  Doc,
  LocalizedRecipeText,
  RecipeIngredient,
  RecipeSourceStep,
} from "@haricot/convex-client";

const SUPPORTED_LANGUAGES: Array<keyof LocalizedRecipeText> = [
  "en",
  "es",
  "zh",
  "fr",
  "ar",
  "ja",
  "vi",
  "tl",
];

const localize = (text: string): LocalizedRecipeText => {
  return SUPPORTED_LANGUAGES.reduce((acc, language) => {
    acc[language] = text;
    return acc;
  }, {} as LocalizedRecipeText);
};

export type RecipeSeed = Omit<Doc<"recipes">, "_id" | "_creationTime">;

const baseCreatedAt = new Date("2024-10-15T12:00:00Z").getTime();

const pilafIngredients: RecipeIngredient[] = [
  {
    foodCode: "1.11.003",
    varietyCode: "yellow",
    quantity: 2,
    unit: "piece",
    displayQuantity: "2 medium",
    displayUnit: "onions",
    normalizedQuantity: 300,
    normalizedUnit: "g",
    preparation: "diced",
    originalText: "2 medium yellow onions, diced",
    validation: { status: "matched" },
  },
  {
    foodCode: "1.11.007",
    quantity: 4,
    unit: "clove",
    displayQuantity: "4 cloves",
    displayUnit: "garlic",
    normalizedQuantity: 20,
    normalizedUnit: "g",
    preparation: "minced",
    originalText: "4 garlic cloves, minced",
    validation: { status: "matched" },
  },
  {
    foodCode: "5.70.001",
    varietyCode: "extra_virgin",
    quantity: 45,
    unit: "ml",
    displayQuantity: "3 tbsp",
    displayUnit: "olive oil",
    normalizedQuantity: 41,
    normalizedUnit: "g",
    originalText: "3 tbsp extra-virgin olive oil",
    validation: { status: "matched" },
  },
  {
    foodCode: "4.60.003",
    varietyCode: "basmati",
    quantity: 360,
    unit: "g",
    displayQuantity: "2 cups",
    displayUnit: "basmati rice",
    normalizedQuantity: 360,
    normalizedUnit: "g",
    originalText: "2 cups basmati rice, rinsed",
    validation: { status: "matched" },
  },
  {
    foodCode: "2.20.001",
    varietyCode: "boneless_skinless",
    quantity: 450,
    unit: "g",
    displayQuantity: "1 lb",
    displayUnit: "chicken thighs",
    normalizedQuantity: 450,
    normalizedUnit: "g",
    preparation: "seared",
    originalText: "1 lb boneless skinless chicken thighs, seared",
    validation: { status: "matched" },
  },
];

const pilafSteps: RecipeSourceStep[] = [
  {
    stepNumber: 1,
    text: "Sweat diced onions in olive oil over medium heat until golden.",
  },
  {
    stepNumber: 2,
    text: "Stir in minced garlic until fragrant, about 2 minutes.",
  },
  {
    stepNumber: 3,
    text: "Toast rinsed basmati rice in the pot to coat every grain.",
  },
  {
    stepNumber: 4,
    text: "Add hot broth (ratio 1:1.8), nestle seared chicken, cover, and cook until rice is tender.",
  },
];

const marinadeIngredients: RecipeIngredient[] = [
  {
    foodCode: "2.20.001",
    varietyCode: "boneless_skinless",
    quantity: 680,
    unit: "g",
    displayQuantity: "1.5 lb",
    displayUnit: "chicken thighs",
    normalizedQuantity: 680,
    normalizedUnit: "g",
    preparation: "butterflied",
    originalText: "1.5 lb chicken thighs, butterflied",
    validation: { status: "matched" },
  },
  {
    foodCode: "1.11.007",
    quantity: 6,
    unit: "clove",
    displayQuantity: "6 cloves",
    displayUnit: "garlic",
    normalizedQuantity: 30,
    normalizedUnit: "g",
    preparation: "smashed",
    originalText: "6 cloves garlic, smashed",
    validation: { status: "matched" },
  },
  {
    foodCode: "5.70.001",
    varietyCode: "extra_virgin",
    quantity: 60,
    unit: "ml",
    displayQuantity: "4 tbsp",
    displayUnit: "olive oil",
    normalizedQuantity: 55,
    normalizedUnit: "g",
    originalText: "4 tbsp olive oil",
    validation: { status: "matched" },
  },
  {
    foodCode: "1.11.003",
    quantity: 1,
    unit: "piece",
    displayQuantity: "1 onion",
    displayUnit: "yellow onion",
    normalizedQuantity: 150,
    normalizedUnit: "g",
    preparation: "sliced",
    originalText: "1 onion, thinly sliced",
    validation: { status: "matched" },
  },
];

const marinadeSteps: RecipeSourceStep[] = [
  {
    stepNumber: 1,
    text: "Blend garlic, olive oil, salt, and lemon for a pourable marinade.",
  },
  {
    stepNumber: 2,
    text: "Massage marinade into chicken thighs and rest at least 30 minutes.",
  },
  {
    stepNumber: 3,
    text: "Sear chicken with sliced onions until browned and cooked through.",
  },
];

export const recipesSeed: RecipeSeed[] = [
  {
    recipeName: localize("Saffron Allium Pilaf"),
    description: localize(
      "One-pot chicken and rice built from the URES pantry: alliums, olive oil, and controlled hydration for fluffy grains.",
    ),
    ingredients: pilafIngredients,
    sourceSteps: pilafSteps,
    encodedSteps:
      "1.11.003.form.diced@quantity:2pc@with:5.70.001.extra_virgin@heat:medium@until:cue.golden -> 1.11.007.form.minced@quantity:4clv@with:5.70.001@time:2m -> 4.60.003.basmati@quantity:360g@rinse:true@coat:oil -> A.01.combine@with:stock@ratio:1:1.8@time:16m@cover:true@add:2.20.001.boneless_skinless",
    encodingVersion: "URES-4.6",
    emojiTags: ["🍚", "🧅", "🫒"],
    prepTimeMinutes: 15,
    cookTimeMinutes: 32,
    totalTimeMinutes: 47,
    servings: 4,
    source: "text",
    sourceUrl: "https://example.com/ures/pilaf",
    attribution: {
      source: "Universal Recipe Lab",
      author: "URES Team",
      dateRetrieved: "2024-10-10",
      sourceUrl: "https://example.com/ures/pilaf",
    },
    imageUrls: ["https://placehold.co/1200x800?text=URES+Pilaf"],
    originalImageLargeStorageId: undefined,
    originalImageSmallStorageId: undefined,
    transparentImageLargeStorageId: undefined,
    transparentImageSmallStorageId: undefined,
    createdAt: baseCreatedAt,
    updatedAt: baseCreatedAt,
    createdBy: undefined,
    isPublic: true,
    foodItemsAdded: [],
  },
  {
    recipeName: localize("Fire-and-Allium Marinade"),
    description: localize(
      "A high-impact marinade built from garlic, onions, and olive oil that translates cleanly across languages.",
    ),
    ingredients: marinadeIngredients,
    sourceSteps: marinadeSteps,
    encodedSteps:
      "1.11.007.form.crushed@quantity:6clv -> A.02.emulsify@with:5.70.001.extra_virgin@until:cue.glossy -> A.03.coat@target:2.20.001.boneless_skinless@time:30m@temp:cold -> T.04.002.sear@with:1.11.003.form.sliced@until:cue.deep_brown",
    encodingVersion: "URES-4.6",
    emojiTags: ["🧄", "🍗", "🔥"],
    prepTimeMinutes: 20,
    cookTimeMinutes: 16,
    totalTimeMinutes: 36,
    servings: 4,
    source: "recipe_card",
    sourceUrl: "https://example.com/ures/marinade",
    attribution: {
      source: "Universal Recipe Lab",
      author: "URES Team",
      dateRetrieved: "2024-10-10",
      sourceUrl: "https://example.com/ures/marinade",
    },
    imageUrls: ["https://placehold.co/1200x800?text=URES+Marinade"],
    originalImageLargeStorageId: undefined,
    originalImageSmallStorageId: undefined,
    transparentImageLargeStorageId: undefined,
    transparentImageSmallStorageId: undefined,
    createdAt: baseCreatedAt + 3600000,
    updatedAt: baseCreatedAt + 3600000,
    createdBy: undefined,
    isPublic: true,
    foodItemsAdded: [],
  },
];

export default recipesSeed;

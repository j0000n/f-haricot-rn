export type NutritionMetric =
  | "fiber"
  | "addedSugar"
  | "saturatedFat"
  | "sodium";

export type NutritionTargets = {
  calories?: number | null;
  protein?: number | null;
  fat?: number | null;
  carbohydrates?: number | null;
  fiber?: number | null;
  addedSugar?: number | null;
  saturatedFat?: number | null;
  sodium?: number | null;
};

export type NutritionDisplayPreferences = {
  showPerMealTargets: boolean;
  showProteinOnly: boolean;
  hideCalories: boolean;
  showWarnings: boolean;
  mealCount: number;
};

export type NutritionGoals = {
  preset?: string | null;
  categories: string[];
  targets: NutritionTargets;
  trackedMetrics: NutritionMetric[];
  displayPreferences: NutritionDisplayPreferences;
};

export const CATEGORY_BUCKETS: { title: string; options: string[] }[] = [
  {
    title: "Weight management",
    options: ["Fat loss", "Weight maintenance", "Weight gain / bulking"],
  },
  {
    title: "Body composition",
    options: ["Muscle gain", "Body recomposition", "Fat loss with muscle retention"],
  },
  {
    title: "Performance & training",
    options: ["Strength training", "Endurance training", "Mixed / general fitness"],
  },
  {
    title: "Health-driven",
    options: [
      "Heart health",
      "Blood sugar control",
      "Anti-inflammatory",
      "Digestive health",
    ],
  },
  {
    title: "Lifestyle / preference",
    options: [
      "High-protein",
      "Low-carb / keto-leaning",
      "Plant-forward",
      "Time-restricted eating",
      "We eat it all",
      "Healthier choices, flavor first",
      "Subtle changes only",
    ],
  },
];

export const SECONDARY_METRICS: {
  key: NutritionMetric;
  label: string;
  helper: string;
}[] = [
  { key: "fiber", label: "Fiber (g)", helper: "Great for satiety and gut health." },
  {
    key: "addedSugar",
    label: "Added sugar (g)",
    helper: "Keep this low for blood sugar control.",
  },
  {
    key: "saturatedFat",
    label: "Saturated fat (g)",
    helper: "Helps with heart-forward goals.",
  },
  { key: "sodium", label: "Sodium (mg)", helper: "Stay mindful of salty packaged items." },
];

export const GOAL_PRESETS: {
  id: string;
  title: string;
  description: string;
  defaults: NutritionGoals;
}[] = [
  {
    id: "fatLoss",
    title: "Fat loss (calorie deficit)",
    description: "Prioritize lean meals that keep you full while trimming calories.",
    defaults: {
      preset: "fatLoss",
      categories: ["Fat loss", "High-protein", "Fat loss with muscle retention"],
      targets: {
        calories: 1800,
        protein: 140,
        fat: 60,
        carbohydrates: 160,
        fiber: 28,
        saturatedFat: 20,
        sodium: 2200,
      },
      trackedMetrics: ["fiber", "saturatedFat", "sodium"],
      displayPreferences: {
        showPerMealTargets: true,
        showProteinOnly: false,
        hideCalories: false,
        showWarnings: true,
        mealCount: 3,
      },
    },
  },
  {
    id: "maintenance",
    title: "Weight maintenance",
    description: "Even-keeled eating without restrictive rules.",
    defaults: {
      preset: "maintenance",
      categories: ["Weight maintenance", "Flexible / intuitive"],
      targets: {
        calories: 2200,
        protein: 120,
        fat: 70,
        carbohydrates: 240,
        fiber: 28,
      },
      trackedMetrics: ["fiber"],
      displayPreferences: {
        showPerMealTargets: true,
        showProteinOnly: false,
        hideCalories: false,
        showWarnings: false,
        mealCount: 3,
      },
    },
  },
  {
    id: "muscleGain",
    title: "Muscle gain / bulking",
    description: "Fuel training days with enough calories and protein to grow.",
    defaults: {
      preset: "muscleGain",
      categories: ["Muscle gain", "Strength training", "Weight gain / bulking"],
      targets: {
        calories: 2600,
        protein: 165,
        fat: 80,
        carbohydrates: 300,
        fiber: 30,
      },
      trackedMetrics: ["fiber"],
      displayPreferences: {
        showPerMealTargets: true,
        showProteinOnly: false,
        hideCalories: false,
        showWarnings: true,
        mealCount: 4,
      },
    },
  },
  {
    id: "recomposition",
    title: "Body recomposition",
    description: "Lose fat slowly while keeping muscles fed.",
    defaults: {
      preset: "recomposition",
      categories: ["Body recomposition", "Strength training", "High-protein"],
      targets: {
        calories: 2100,
        protein: 170,
        fat: 70,
        carbohydrates: 200,
        fiber: 30,
      },
      trackedMetrics: ["fiber"],
      displayPreferences: {
        showPerMealTargets: true,
        showProteinOnly: false,
        hideCalories: false,
        showWarnings: true,
        mealCount: 3,
      },
    },
  },
  {
    id: "highProtein",
    title: "High-protein lifestyle",
    description: "Energy and satiety without obsessive calorie tracking.",
    defaults: {
      preset: "highProtein",
      categories: ["High-protein", "Flexible / intuitive"],
      targets: {
        calories: null,
        protein: 150,
        fat: 70,
        carbohydrates: 180,
      },
      trackedMetrics: [],
      displayPreferences: {
        showPerMealTargets: true,
        showProteinOnly: true,
        hideCalories: true,
        showWarnings: false,
        mealCount: 3,
      },
    },
  },
  {
    id: "lowCarb",
    title: "Low-carb / carb-controlled",
    description: "Tighter carb caps with protein-forward meals.",
    defaults: {
      preset: "lowCarb",
      categories: ["Low-carb / keto-leaning", "Blood sugar control"],
      targets: {
        calories: 2000,
        protein: 150,
        fat: 90,
        carbohydrates: 120,
        fiber: 26,
        addedSugar: 15,
      },
      trackedMetrics: ["fiber", "addedSugar"],
      displayPreferences: {
        showPerMealTargets: true,
        showProteinOnly: false,
        hideCalories: false,
        showWarnings: true,
        mealCount: 3,
      },
    },
  },
  {
    id: "endurance",
    title: "Endurance / cardio performance",
    description: "Carb-forward fueling around sessions.",
    defaults: {
      preset: "endurance",
      categories: ["Endurance training", "Mixed / general fitness"],
      targets: {
        calories: 2600,
        protein: 125,
        fat: 60,
        carbohydrates: 320,
        fiber: 30,
        sodium: 2400,
      },
      trackedMetrics: ["fiber", "sodium"],
      displayPreferences: {
        showPerMealTargets: true,
        showProteinOnly: false,
        hideCalories: false,
        showWarnings: false,
        mealCount: 4,
      },
    },
  },
  {
    id: "healthFirst",
    title: "Health-first (heart, metabolic, inflammation)",
    description: "Favor fiber and fat quality while keeping sodium and sugar in check.",
    defaults: {
      preset: "healthFirst",
      categories: ["Heart health", "Anti-inflammatory", "Plant-forward"],
      targets: {
        calories: 2200,
        protein: 120,
        fat: 70,
        carbohydrates: 240,
        fiber: 32,
        saturatedFat: 20,
        addedSugar: 25,
        sodium: 2000,
      },
      trackedMetrics: ["fiber", "saturatedFat", "addedSugar", "sodium"],
      displayPreferences: {
        showPerMealTargets: true,
        showProteinOnly: false,
        hideCalories: false,
        showWarnings: true,
        mealCount: 3,
      },
    },
  },
];

export const createEmptyNutritionGoals = (): NutritionGoals => ({
  preset: null,
  categories: [],
  targets: {},
  trackedMetrics: [],
  displayPreferences: {
    showPerMealTargets: true,
    showProteinOnly: false,
    hideCalories: false,
    showWarnings: true,
    mealCount: 3,
  },
});

export const derivePerMealTargets = (
  targets: NutritionTargets,
  mealCount: number
): { calories?: number; protein?: number } => {
  if (!mealCount || mealCount <= 0) {
    return {};
  }

  const calories =
    typeof targets.calories === "number" && Number.isFinite(targets.calories)
      ? Math.round(targets.calories / mealCount)
      : undefined;
  const protein =
    typeof targets.protein === "number" && Number.isFinite(targets.protein)
      ? Math.round(targets.protein / mealCount)
      : undefined;

  return { calories, protein };
};

export const sanitizeNumber = (value: string | number | null | undefined) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const parsed = Number.parseFloat(value.replace(/[^0-9.]/g, ""));
  if (Number.isNaN(parsed)) {
    return undefined;
  }

  return parsed;
};

export const mergePresetDefaults = (
  presetId: string,
  existing: NutritionGoals
): NutritionGoals => {
  const preset = GOAL_PRESETS.find((entry) => entry.id === presetId);
  if (!preset) {
    return existing;
  }

  return {
    ...preset.defaults,
    categories: Array.from(
      new Set([...(preset.defaults.categories ?? []), ...(existing.categories ?? [])])
    ),
    targets: { ...preset.defaults.targets, ...existing.targets },
    trackedMetrics: Array.from(
      new Set([...(preset.defaults.trackedMetrics ?? []), ...(existing.trackedMetrics ?? [])])
    ) as NutritionMetric[],
    displayPreferences: {
      ...preset.defaults.displayPreferences,
      ...existing.displayPreferences,
    },
  };
};

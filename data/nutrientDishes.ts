import type { NutrientDish } from "@haricot/convex-client";

export const nutrientDishes: NutrientDish[] = [
  {
    id: "saffron-onion-rice",
    name: "Saffron Onion Rice",
    description: "Fragrant basmati rice bloomed with olive oil, onions, and saffron threads.",
    calories: 410,
    macronutrients: { protein: 8, carbohydrates: 72, fat: 10, fiber: 2, sugars: 3 },
    micronutrients: [
      { label: "Vitamin B1", amount: 0.35, unit: "mg", dailyValuePercent: 29 },
      { label: "Iron", amount: 2.2, unit: "mg", dailyValuePercent: 12 },
      { label: "Vitamin E", amount: 2.1, unit: "mg", dailyValuePercent: 14 },
    ],
    imageUrl: "https://placehold.co/600x400?text=Saffron+Rice",
  },
  {
    id: "garlic-herb-chicken",
    name: "Garlic Herb Chicken",
    description: "Roasted boneless chicken thighs with garlic-olive oil baste and bright herbs.",
    calories: 520,
    macronutrients: { protein: 44, carbohydrates: 2, fat: 36, fiber: 0, sugars: 1 },
    micronutrients: [
      { label: "Vitamin B6", amount: 0.7, unit: "mg", dailyValuePercent: 41 },
      { label: "Selenium", amount: 32, unit: "mcg", dailyValuePercent: 58 },
      { label: "Vitamin K", amount: 14, unit: "mcg", dailyValuePercent: 12 },
    ],
    imageUrl: "https://placehold.co/600x400?text=Garlic+Chicken",
  },
  {
    id: "pantry-allium-broth",
    name: "Pantry Allium Broth",
    description: "Quick broth built from onions, garlic, and olive oil to jumpstart soups or grains.",
    calories: 120,
    macronutrients: { protein: 2, carbohydrates: 10, fat: 8, fiber: 1, sugars: 5 },
    micronutrients: [
      { label: "Manganese", amount: 0.5, unit: "mg", dailyValuePercent: 22 },
      { label: "Vitamin C", amount: 5, unit: "mg", dailyValuePercent: 6 },
    ],
    imageUrl: "https://placehold.co/600x400?text=Allium+Broth",
  },
];

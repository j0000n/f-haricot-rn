export interface MacronutrientProfile {
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber?: number;
  sugars?: number;
}

export interface MicronutrientDetail {
  label: string;
  amount: number;
  unit: string;
  dailyValuePercent?: number;
}

export interface NutrientDish {
  id: string;
  name: string;
  description: string;
  calories: number;
  macronutrients: MacronutrientProfile;
  micronutrients: MicronutrientDetail[];
  imageUrl: string;
}

export interface NutritionFacts {
  calories: number;
  macronutrients: MacronutrientProfile;
  micronutrients?: MicronutrientDetail[];
}

export interface DensityHints {
  gramsPerMilliliter?: number;
  gramsPerPiece?: number;
  defaultUnit?: "g" | "ml" | "piece";
}

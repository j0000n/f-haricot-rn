import { LocalizedRecipeText } from "../types/recipe";

export interface TranslationGuideRow {
  code: string;
  language: keyof LocalizedRecipeText;
  text: string;
  context?: string;
  description?: string;
}

const localized = (
  code: string,
  text: string,
  context?: string,
  description?: string,
): TranslationGuideRow[] => {
  const languages: Array<keyof LocalizedRecipeText> = [
    "en",
    "es",
    "zh",
    "fr",
    "ar",
    "ja",
    "vi",
    "tl",
  ];

  return languages.map((language) => ({
    code,
    language,
    text,
    context,
    description,
  }));
};

export const translationGuideSeed: TranslationGuideRow[] = [
  ...localized("1.11.003", "yellow onion", "ingredient", "Base allium used for sweetness."),
  ...localized("1.11.007", "garlic", "ingredient", "Aromatic used to build depth."),
  ...localized("5.70.001", "olive oil", "ingredient", "Primary fat for bloom and emulsions."),
  ...localized("4.60.003", "long-grain rice", "ingredient", "Baseline grain for pilafs."),
  ...localized("2.20.001", "chicken thigh", "protein", "Default poultry cut for tests."),
  ...localized("A.01.combine", "combine and simmer", "action", "Blend hydrated ingredients together."),
  ...localized("A.02.emulsify", "emulsify", "action", "Force fat and liquid into a glossy suspension."),
  ...localized("A.03.coat", "coat evenly", "action", "Cover the target ingredient completely."),
  ...localized("T.04.002", "sear", "technique", "High-heat browning of surfaces."),
  ...localized("cue.golden", "until golden", "cue", "Stop when onions reach golden edges."),
  ...localized("cue.deep_brown", "until deep brown", "cue", "Stop when surface browns deeply."),
];

export default translationGuideSeed;

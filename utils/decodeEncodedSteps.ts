import { translationGuideSeed } from "../data/translationGuideSeed";
import type { LocalizedRecipeText, RecipeSourceStep } from "../types/recipe";

export type DecodingMode = "runner" | "cards" | "voice" | "shopping";

interface DecodedSegment {
  code: string;
  qualifiers: string[];
  parameters: Record<string, string>;
}

export interface DecodedStepCard {
  stepNumber: number;
  title: string;
  detail: string;
  cues?: string[];
  mode: DecodingMode;
}

const translationLookup = translationGuideSeed.reduce<Record<string, Record<string, string>>>(
  (acc, row) => {
    acc[row.code] ??= {};
    acc[row.code][row.language] = row.text;
    return acc;
  },
  {},
);

const translate = (code: string, language: keyof LocalizedRecipeText): string => {
  const bucket = translationLookup[code];
  if (!bucket) return code;
  return bucket[language] ?? bucket.en ?? code;
};

const parseSegment = (segment: string): DecodedSegment => {
  const [codePart, ...rest] = segment.split("@");
  const [code, ...qualifiers] = codePart.split(".");
  const parameters = rest.reduce<Record<string, string>>((acc, raw) => {
    const [key, value] = raw.split(":");
    if (key && value) {
      acc[key] = value;
    }
    return acc;
  }, {});

  return { code: [code, ...qualifiers.slice(0, 2)].join("."), qualifiers, parameters };
};

const describeParameters = (
  parameters: Record<string, string>,
  language: keyof LocalizedRecipeText,
): string => {
  const entries = Object.entries(parameters);
  if (!entries.length) return "";

  return entries
    .map(([key, value]) => {
      if (key === "quantity") {
        return `${translate("quantity", language)}: ${value}`;
      }
      if (key === "until" || key === "cue") {
        return translate(value, language);
      }
      return `${key}: ${value}`;
    })
    .join(" · ");
};

export const decodeEncodedSteps = (
  encodedSteps: string | undefined,
  language: keyof LocalizedRecipeText,
  mode: DecodingMode = "cards",
  fallbackSteps?: RecipeSourceStep[],
): DecodedStepCard[] => {
  if (!encodedSteps || !encodedSteps.trim()) {
    return (
      fallbackSteps?.map((step, index) => ({
        stepNumber: step.stepNumber ?? index + 1,
        title: step.text,
        detail: step.text,
        cues: [],
        mode,
      })) ?? []
    );
  }

  const segments = encodedSteps
    .split("->")
    .map((part) => part.trim())
    .filter(Boolean)
    .map(parseSegment);

  return segments.map((segment, index) => {
    const summary = translate(segment.code, language);
    const details = describeParameters(segment.parameters, language);
    const cues = Object.keys(segment.parameters)
      .filter((key) => key === "until" || key === "cue")
      .map((key) => translate(segment.parameters[key], language));

    return {
      stepNumber: index + 1,
      title: summary,
      detail: details || summary,
      cues,
      mode,
    };
  });
};

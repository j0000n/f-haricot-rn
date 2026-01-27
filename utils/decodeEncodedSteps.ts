import {
  translationGuideSeed,
  type TranslationGuideRow,
} from "../data/translationGuideSeed";
import type { LocalizedRecipeText, RecipeSourceStep, Recipe } from "../types/recipe";

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

type TranslationLookup = Record<string, Record<string, string>>;

const translationLookupCache = new Map<string, TranslationLookup>();
const warnedUnknownCodes = new Set<string>();
let warnedMissingEncodedSteps = false;
const warningIgnoreList = new Set(["quantity"]);

const buildLookup = (guides: TranslationGuideRow[]): TranslationLookup => {
  return guides.reduce<Record<string, Record<string, string>>>((acc, row) => {
    acc[row.code] ??= {};
    acc[row.code][row.language] = row.text;
    return acc;
  }, {});
};

const getCacheKey = (guides: TranslationGuideRow[]): string => {
  const sorted = [...guides].sort((a, b) => {
    const keyA = `${a.code}|${a.language}`;
    const keyB = `${b.code}|${b.language}`;
    return keyA.localeCompare(keyB);
  });

  return sorted.map((row) => `${row.code}|${row.language}|${row.text}`).join("||");
};

const getLookup = (guides?: TranslationGuideRow[]): TranslationLookup => {
  const effectiveGuides = guides?.length ? guides : translationGuideSeed;
  const cacheKey = guides?.length ? getCacheKey(effectiveGuides) : "seed";

  const cached = translationLookupCache.get(cacheKey);
  if (cached) return cached;

  const built = buildLookup(effectiveGuides);
  translationLookupCache.set(cacheKey, built);
  return built;
};

const warnMissingEncodedSteps = () => {
  if (warnedMissingEncodedSteps) return;
  console.warn(
    "[decodeEncodedSteps] Missing encodedSteps; falling back to source steps. Provide encodedSteps during ingestion for deterministic decoding.",
  );
  warnedMissingEncodedSteps = true;
};

const warnUnknownCode = (code: string) => {
  if (warningIgnoreList.has(code)) return;
  if (warnedUnknownCodes.has(code)) return;
  console.warn(
    `[decodeEncodedSteps] Unknown translation code "${code}". Add a translation guide to support this instruction.`,
  );
  warnedUnknownCodes.add(code);
};

const translate = (lookup: TranslationLookup, code: string, language: string): string => {
  const bucket = lookup[code];
  if (!bucket) {
    warnUnknownCode(code);
    return code;
  }

  return bucket[language] ?? bucket.en ?? Object.values(bucket)[0] ?? code;
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
  language: keyof LocalizedRecipeText | string,
  lookup: TranslationLookup,
): string => {
  const entries = Object.entries(parameters);
  if (!entries.length) return "";

  return entries
    .map(([key, value]) => {
      if (key === "quantity") {
        return `${translate(lookup, "quantity", language)}: ${value}`;
      }
      if (key === "until" || key === "cue") {
        return translate(lookup, value, language);
      }
      return `${key}: ${value}`;
    })
    .join(" · ");
};

/**
 * Validates that decoded steps are readable and not just raw codes/parameters.
 * Returns false if decoding appears to have failed (e.g., missing translations).
 */
const isDecodingValid = (decodedSteps: DecodedStepCard[]): boolean => {
  if (decodedSteps.length === 0) return false;

  // Check if most steps have readable titles (not just codes)
  const readableCount = decodedSteps.filter(step => {
    const titleIsCode = /^(T|A|KT)\.\d+\.\d+/.test(step.title);
    const detailIsJustParams = /^(quantity|temp|time|unit|to):/.test(step.detail.trim());
    const hasReadableText = step.title.length > 3 && !titleIsCode && !detailIsJustParams;
    return hasReadableText;
  }).length;

  // If less than 50% are readable, consider decoding failed
  return readableCount >= decodedSteps.length * 0.5;
};

export const decodeEncodedSteps = (
  encodedSteps: string | undefined,
  language: keyof LocalizedRecipeText | string,
  mode: DecodingMode = "cards",
  fallbackSteps?: RecipeSourceStep[],
  translationGuides?: TranslationGuideRow[],
  sourceStepsLocalized?: {
    en?: RecipeSourceStep[];
    es?: RecipeSourceStep[];
    zh?: RecipeSourceStep[];
    fr?: RecipeSourceStep[];
    ar?: RecipeSourceStep[];
    ja?: RecipeSourceStep[];
    vi?: RecipeSourceStep[];
    tl?: RecipeSourceStep[];
  },
): DecodedStepCard[] => {
  if (!encodedSteps || !encodedSteps.trim()) {
    warnMissingEncodedSteps();

    // Try to use translated steps first
    const translatedSteps = sourceStepsLocalized?.[language as keyof typeof sourceStepsLocalized];
    const stepsToUse = translatedSteps || fallbackSteps;

    return (
      stepsToUse?.map((step, index) => ({
        stepNumber: step.stepNumber ?? index + 1,
        title: step.text,
        detail: [
          step.text,
          step.timeInMinutes !== undefined ? `${step.timeInMinutes} min` : undefined,
          step.temperature
            ? `${step.temperature.value}°${step.temperature.unit}`
            : undefined,
        ]
          .filter(Boolean)
          .join(" • ") || step.text,
        cues: [],
        mode,
      })) ?? []
    );
  }

  const translationLookup = getLookup(translationGuides);
  const segments = encodedSteps
    .split("->")
    .map((part) => part.trim())
    .filter(Boolean)
    .map(parseSegment);

  const decodedSteps = segments.map((segment, index) => {
    const summary = translate(translationLookup, segment.code, language);
    const details = describeParameters(segment.parameters, language, translationLookup);
    const cues = Object.keys(segment.parameters)
      .filter((key) => key === "until" || key === "cue")
      .map((key) => translate(translationLookup, segment.parameters[key], language));

    return {
      stepNumber: index + 1,
      title: summary,
      detail: details || summary,
      cues,
      mode,
    };
  });

  // Validate decoding quality and fall back to sourceSteps if decoding failed
  if (!isDecodingValid(decodedSteps) && fallbackSteps && fallbackSteps.length > 0) {
    console.warn(
      "[decodeEncodedSteps] Decoding validation failed; falling back to sourceSteps. This may indicate missing translations.",
    );
    return fallbackSteps.map((step, index) => ({
      stepNumber: step.stepNumber ?? index + 1,
      title: step.text,
      detail: [
        step.text,
        step.timeInMinutes !== undefined ? `${step.timeInMinutes} min` : undefined,
        step.temperature
          ? `${step.temperature.value}°${step.temperature.unit}`
          : undefined,
      ]
        .filter(Boolean)
        .join(" • ") || step.text,
      cues: [],
      mode,
    }));
  }

  return decodedSteps;
};

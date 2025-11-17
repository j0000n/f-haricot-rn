import { blackMetalTheme } from "./blackMetal";
import { classicTheme } from "./classic";
import { midnightTheme } from "./midnight";
import { sunriseTheme } from "./sunrise";
import { fifitiesTheme } from "./1950s";
import { sixtiesTheme } from "./1960s";
import { ninetiesTheme } from "./1990s";
import { springfieldTheme } from "./springfield";
import { highContrastDarkTheme, highContrastLightTheme } from "./highContrast";
import { ThemeDefinition, defineThemes } from "./types";

export * from "./types";

export const themeDefinitions = defineThemes({
  sunrise: sunriseTheme,
  midnight: midnightTheme,
  blackMetal: blackMetalTheme,
  classic: classicTheme,
  fifties: fifitiesTheme,
  sixties: sixtiesTheme,
  nineties: ninetiesTheme,
  springfield: springfieldTheme,
  highContrastDark: highContrastDarkTheme,
  highContrastLight: highContrastLightTheme,
});

type ThemeMap = typeof themeDefinitions;

export type ThemeName = keyof ThemeMap;

export const themeOptions = (
  Object.entries(themeDefinitions) as [ThemeName, ThemeDefinition][]
).map(([name, definition]) => ({
  name,
  label: definition.label,
  description: definition.description,
}));

export const defaultThemeName: ThemeName = "sunrise";

export function isThemeName(value: unknown): value is ThemeName {
  return typeof value === "string" && value in themeDefinitions;
}

export function getThemeDefinition(themeName: ThemeName): ThemeDefinition {
  return themeDefinitions[themeName];
}

export {
  sunriseTheme,
  midnightTheme,
  blackMetalTheme,
  classicTheme,
  fifitiesTheme,
  sixtiesTheme,
  ninetiesTheme,
  springfieldTheme,
  highContrastDarkTheme,
  highContrastLightTheme,
};

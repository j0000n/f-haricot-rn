import { generatedContinents } from "./generatedWorldData";

export const continents = generatedContinents;

export const getContinents = () => continents;

export const getContinentBySlug = (slug: string) => continents.find((continent) => continent.slug === slug);

export const getRegionsForContinent = (continentSlug: string) =>
  getContinentBySlug(continentSlug)?.regions ?? [];

export const getRegionBySlugs = (continentSlug: string, regionSlug: string) =>
  getRegionsForContinent(continentSlug).find((region) => region.slug === regionSlug);

export const getCountriesForRegion = (continentSlug: string, regionSlug: string) =>
  getRegionBySlugs(continentSlug, regionSlug)?.countries ?? [];

export const getCountryBySlugs = (continentSlug: string, regionSlug: string, countrySlug: string) =>
  getCountriesForRegion(continentSlug, regionSlug).find((country) => country.slug === countrySlug);

export const getSubregionsForCountry = (
  continentSlug: string,
  regionSlug: string,
  countrySlug: string,
) => getCountryBySlugs(continentSlug, regionSlug, countrySlug)?.subregions ?? [];

export const getSubregionBySlugs = (
  continentSlug: string,
  regionSlug: string,
  countrySlug: string,
  subregionSlug: string,
) => getSubregionsForCountry(continentSlug, regionSlug, countrySlug).find((subregion) => subregion.slug === subregionSlug);

export const getCitiesForSubregion = (
  continentSlug: string,
  regionSlug: string,
  countrySlug: string,
  subregionSlug: string,
) => getSubregionBySlugs(continentSlug, regionSlug, countrySlug, subregionSlug)?.cities ?? [];

// TODO: Replace in-memory helpers with Convex queries once data is stored remotely.

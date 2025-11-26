import { query } from "./_generated/server";
import { v } from "convex/values";

export const getContinents = query({
  args: {},
  handler: async () => {
    // TODO: Implement with Convex data
    return [];
  },
});

export const getContinentBySlug = query({
  args: { slug: v.string() },
  handler: async () => {
    // TODO: Implement with Convex data
    return null;
  },
});

export const getRegionsForContinent = query({
  args: { continentSlug: v.string() },
  handler: async () => {
    // TODO: Implement with Convex data
    return [];
  },
});

export const getRegionBySlugs = query({
  args: { continentSlug: v.string(), regionSlug: v.string() },
  handler: async () => {
    // TODO: Implement with Convex data
    return null;
  },
});

export const getCountriesForRegion = query({
  args: { continentSlug: v.string(), regionSlug: v.string() },
  handler: async () => {
    // TODO: Implement with Convex data
    return [];
  },
});

export const getCountryBySlugs = query({
  args: { continentSlug: v.string(), regionSlug: v.string(), countrySlug: v.string() },
  handler: async () => {
    // TODO: Implement with Convex data
    return null;
  },
});

export const getSubregionsForCountry = query({
  args: { continentSlug: v.string(), regionSlug: v.string(), countrySlug: v.string() },
  handler: async () => {
    // TODO: Implement with Convex data
    return [];
  },
});

export const getSubregionBySlugs = query({
  args: {
    continentSlug: v.string(),
    regionSlug: v.string(),
    countrySlug: v.string(),
    subregionSlug: v.string(),
  },
  handler: async () => {
    // TODO: Implement with Convex data
    return null;
  },
});

export const getCitiesForSubregion = query({
  args: {
    continentSlug: v.string(),
    regionSlug: v.string(),
    countrySlug: v.string(),
    subregionSlug: v.string(),
  },
  handler: async () => {
    // TODO: Implement with Convex data
    return [];
  },
});

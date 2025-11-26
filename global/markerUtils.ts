import { getAllCitiesWithContext } from "@/data/world";
import type { City } from "@/types/geo";

export interface GlobeMarker {
  id: string;
  label: string;
  lat: number;
  lng: number;
  altitude?: number;
  continentSlug?: string;
  regionSlug?: string;
  countrySlug?: string;
  subregionSlug?: string;
  citySlug?: string;
  meta?: Record<string, unknown>;
}

const hasCoordinates = (city: City) => typeof city.lat === "number" && typeof city.lng === "number";

export function buildCityMarkers(): GlobeMarker[] {
  const cities = getAllCitiesWithContext();

  return cities
    .filter((entry) => hasCoordinates(entry.city))
    .map((entry) => ({
      id: entry.city.id,
      label: `${entry.city.name}, ${entry.country.name}`,
      lat: entry.city.lat!,
      lng: entry.city.lng!,
      altitude: 0.02,
      continentSlug: entry.continent.slug,
      regionSlug: entry.region.slug,
      countrySlug: entry.country.slug,
      subregionSlug: entry.subregion?.slug,
      citySlug: entry.city.slug,
    }));
}

// TODO: Integrate Convex-backed geographic data once available.

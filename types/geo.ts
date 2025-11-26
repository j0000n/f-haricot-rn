export interface City {
  id: string;
  slug: string;
  name: string;
  subregionId?: string;
  countryId: string;
  lat?: number;
  lng?: number;
}

export interface CountrySubregion {
  id: string;
  slug: string;
  name: string;
  countryId: string;
  cities?: City[];
}

export interface Country {
  id: string;
  slug: string;
  name: string;
  regionId: string;
  subregions?: CountrySubregion[];
}

export interface Region {
  id: string;
  slug: string;
  name: string;
  continentId: string;
  countries: Country[];
}

export interface Continent {
  id: string;
  slug: string;
  name: string;
  regions: Region[];
}

const fs = require("fs");
const path = require("path");

const slugify = (value) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const sourcePath = path.join(__dirname, "..", "docs", "countriesFinal.md");
const content = fs.readFileSync(sourcePath, "utf8");

const lines = content.split(/\r?\n/);

const continents = [];
let currentContinent = null;
let currentRegion = null;
let currentCountry = null;
let collectingSubregions = false;

const createId = (...parts) => parts.filter(Boolean).join("-");

const startContinent = (name) => {
  const slug = slugify(name);
  const continent = {
    id: createId("continent", slug),
    slug,
    name,
    regions: [],
  };
  continents.push(continent);
  currentContinent = continent;
  currentRegion = null;
  currentCountry = null;
};

const startRegion = (name) => {
  if (!currentContinent) return;
  const slug = slugify(name);
  const region = {
    id: createId(currentContinent.id, "region", slug),
    slug,
    name,
    continentId: currentContinent.id,
    countries: [],
  };
  currentContinent.regions.push(region);
  currentRegion = region;
  currentCountry = null;
};

const startCountry = (name) => {
  if (!currentRegion) return;
  const slug = slugify(name);
  const country = {
    id: createId(currentRegion.id, "country", slug),
    slug,
    name,
    regionId: currentRegion.id,
    subregions: [],
  };
  currentRegion.countries.push(country);
  currentCountry = country;
};

const addSubregion = (name) => {
  if (!currentCountry) return;
  const slug = slugify(name);
  const subregion = {
    id: createId(currentCountry.id, "subregion", slug),
    slug,
    name,
    countryId: currentCountry.id,
    cities: [],
  };
  const existing = currentCountry.subregions?.find((entry) => entry.slug === slug);
  if (!existing) {
    currentCountry.subregions?.push(subregion);
  }
};

for (const rawLine of lines) {
  const line = rawLine.trimEnd();
  if (line.startsWith("## ")) {
    startContinent(line.replace(/^## /, ""));
    collectingSubregions = false;
    continue;
  }
  if (line.startsWith("### ")) {
    startRegion(line.replace(/^### /, ""));
    collectingSubregions = false;
    continue;
  }
  if (line.startsWith("#### ")) {
    startCountry(line.replace(/^#### /, ""));
    collectingSubregions = false;
    continue;
  }

  const trimmed = line.trim();
  if (trimmed.startsWith("- **Culinary Regions:**")) {
    collectingSubregions = true;
    continue;
  }
  if (trimmed.startsWith("- **Recipe Creators:**")) {
    collectingSubregions = false;
    continue;
  }

  if (collectingSubregions) {
    if (trimmed.startsWith("- **")) {
      const match = trimmed.match(/- \*\*(.+?)\*\*/);
      if (match) {
        addSubregion(match[1].replace(/:$/, ""));
      }
      continue;
    }
    if (trimmed === "" || trimmed.startsWith("## ") || trimmed.startsWith("### ") || trimmed.startsWith("#### ")) {
      collectingSubregions = false;
    }
  }
}

const outputPath = path.join(__dirname, "..", "data", "generatedWorldData.ts");
const header = "import { Continent } from \"@/types/geo\";\n\n";
const body = `export const generatedContinents: Continent[] = ${JSON.stringify(continents, null, 2)};\n`;
fs.writeFileSync(outputPath, `${header}${body}`);

console.log(`Generated ${continents.length} continents to ${outputPath}`);

import { Breadcrumbs } from "@/components/Breadcrumbs";
import {
  getCitiesForSubregion,
  getContinentBySlug,
  getCountryBySlugs,
  getRegionBySlugs,
  getSubregionBySlugs,
} from "@/data/world";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function CityScreen() {
  const params = useLocalSearchParams<{
    continent?: string;
    region?: string;
    country?: string;
    subregion?: string;
    city?: string;
  }>();

  const continentSlug = typeof params.continent === "string" ? params.continent : "";
  const regionSlug = typeof params.region === "string" ? params.region : "";
  const countrySlug = typeof params.country === "string" ? params.country : "";
  const subregionSlug = typeof params.subregion === "string" ? params.subregion : "";
  const citySlug = typeof params.city === "string" ? params.city : "";

  const continent = getContinentBySlug(continentSlug);
  const region = getRegionBySlugs(continentSlug, regionSlug);
  const country = getCountryBySlugs(continentSlug, regionSlug, countrySlug);
  const subregion = getSubregionBySlugs(continentSlug, regionSlug, countrySlug, subregionSlug);
  const cities = getCitiesForSubregion(continentSlug, regionSlug, countrySlug, subregionSlug);
  const city = cities.find((entry) => entry.slug === citySlug);

  return (
    <SafeAreaView style={styles.container}>
      <Breadcrumbs
        items={[
          { label: "World", href: "/world" },
          continent ? { label: continent.name, href: `/world/${continent.slug}` } : { label: "Unknown Continent" },
          region
            ? { label: region.name, href: `/world/${continentSlug}/${regionSlug}` }
            : { label: "Unknown Region" },
          country
            ? { label: country.name, href: `/world/${continentSlug}/${regionSlug}/${countrySlug}` }
            : { label: "Unknown Country" },
          subregion
            ? { label: subregion.name, href: `/world/${continentSlug}/${regionSlug}/${countrySlug}/${subregionSlug}` }
            : { label: "Unknown Subregion" },
          city ? { label: city.name } : { label: "Unknown City" },
        ]}
      />
      {continent && region && country && subregion && city ? (
        <View style={styles.card}>
          <Text style={styles.title}>{city.name}</Text>
          <Text style={styles.subtitle}>Future city-level content will appear here.</Text>
        </View>
      ) : (
        <Text style={styles.error}>City not found.</Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  card: {
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
  },
  error: {
    fontSize: 16,
    color: "#a00",
  },
});

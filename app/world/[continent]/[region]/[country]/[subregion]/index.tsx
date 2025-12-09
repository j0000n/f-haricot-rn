import { Breadcrumbs } from "@/components/Breadcrumbs";
import {
  getCitiesForSubregion,
  getContinentBySlug,
  getCountryBySlugs,
  getRegionBySlugs,
  getSubregionBySlugs,
} from "@/data/world";
import { Link, useLocalSearchParams } from "expo-router";
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function CountrySubregionScreen() {
  const params = useLocalSearchParams<{
    continent?: string;
    region?: string;
    country?: string;
    subregion?: string;
  }>();

  const continentSlug = typeof params.continent === "string" ? params.continent : "";
  const regionSlug = typeof params.region === "string" ? params.region : "";
  const countrySlug = typeof params.country === "string" ? params.country : "";
  const subregionSlug = typeof params.subregion === "string" ? params.subregion : "";

  const continent = getContinentBySlug(continentSlug);
  const region = getRegionBySlugs(continentSlug, regionSlug);
  const country = getCountryBySlugs(continentSlug, regionSlug, countrySlug);
  const subregion = getSubregionBySlugs(continentSlug, regionSlug, countrySlug, subregionSlug);
  const cities = getCitiesForSubregion(continentSlug, regionSlug, countrySlug, subregionSlug);

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
          subregion ? { label: subregion.name } : { label: "Unknown Subregion" },
        ]}
      />
      {continent && region && country && subregion ? (
        <FlatList<typeof cities[number]>
          data={cities}
          keyExtractor={(item: (typeof cities)[number]) => item.id}
          renderItem={({ item }: { item: (typeof cities)[number] }) => (
            <Link
              href={`/world/${continent.slug}/${region.slug}/${country.slug}/${subregion.slug}/${item.slug}`}
              asChild
            >
              <Pressable style={styles.item}>
                <Text style={styles.title}>{item.name}</Text>
              </Pressable>
            </Link>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={<Text style={styles.subtitle}>No cities yet.</Text>}
        />
      ) : (
        <Text style={styles.error}>Subregion not found.</Text>
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
  item: {
    paddingVertical: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 14,
    color: "#555",
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: "#eee",
  },
  error: {
    fontSize: 16,
    color: "#a00",
  },
});

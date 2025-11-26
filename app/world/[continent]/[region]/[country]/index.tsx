import { Breadcrumbs } from "@/components/Breadcrumbs";
import {
  getContinentBySlug,
  getCountryBySlugs,
  getRegionBySlugs,
  getSubregionsForCountry,
} from "@/data/world";
import { Link, useLocalSearchParams } from "expo-router";
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function CountryScreen() {
  const params = useLocalSearchParams<{ continent?: string; region?: string; country?: string }>();
  const continentSlug = typeof params.continent === "string" ? params.continent : "";
  const regionSlug = typeof params.region === "string" ? params.region : "";
  const countrySlug = typeof params.country === "string" ? params.country : "";

  const continent = getContinentBySlug(continentSlug);
  const region = getRegionBySlugs(continentSlug, regionSlug);
  const country = getCountryBySlugs(continentSlug, regionSlug, countrySlug);
  const subregions = getSubregionsForCountry(continentSlug, regionSlug, countrySlug);

  return (
    <SafeAreaView style={styles.container}>
      <Breadcrumbs
        items={[
          { label: "World", href: "/world" },
          continent ? { label: continent.name, href: `/world/${continent.slug}` } : { label: "Unknown Continent" },
          region ? { label: region.name, href: `/world/${continentSlug}/${regionSlug}` } : { label: "Unknown Region" },
          country ? { label: country.name } : { label: "Unknown Country" },
        ]}
      />
      {continent && region && country ? (
        <FlatList
          data={subregions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Link href={`/world/${continent.slug}/${region.slug}/${country.slug}/${item.slug}`} asChild>
              <Pressable style={styles.item}>
                <Text style={styles.title}>{item.name}</Text>
                <Text style={styles.subtitle}>{item.cities?.length ?? 0} cities</Text>
              </Pressable>
            </Link>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={<Text style={styles.subtitle}>No subregions yet.</Text>}
        />
      ) : (
        <Text style={styles.error}>Country not found.</Text>
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

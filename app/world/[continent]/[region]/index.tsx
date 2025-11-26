import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getContinentBySlug, getCountriesForRegion, getRegionBySlugs } from "@/data/world";
import { Link, useLocalSearchParams } from "expo-router";
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function RegionScreen() {
  const params = useLocalSearchParams<{ continent?: string; region?: string }>();
  const continentSlug = typeof params.continent === "string" ? params.continent : "";
  const regionSlug = typeof params.region === "string" ? params.region : "";

  const continent = getContinentBySlug(continentSlug);
  const region = getRegionBySlugs(continentSlug, regionSlug);
  const countries = getCountriesForRegion(continentSlug, regionSlug);

  return (
    <SafeAreaView style={styles.container}>
      <Breadcrumbs
        items={[
          { label: "World", href: "/world" },
          continent ? { label: continent.name, href: `/world/${continent.slug}` } : { label: "Unknown Continent" },
          region ? { label: region.name } : { label: "Unknown Region" },
        ]}
      />
      {continent && region ? (
        <FlatList
          data={countries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Link href={`/world/${continent.slug}/${region.slug}/${item.slug}`} asChild>
              <Pressable style={styles.item}>
                <Text style={styles.title}>{item.name}</Text>
                <Text style={styles.subtitle}>{item.subregions?.length ?? 0} subregions</Text>
              </Pressable>
            </Link>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      ) : (
        <Text style={styles.error}>Region not found.</Text>
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

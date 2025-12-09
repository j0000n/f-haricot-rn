import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getContinentBySlug, getRegionsForContinent } from "@/data/world";
import { Link, useLocalSearchParams } from "expo-router";
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function ContinentScreen() {
  const params = useLocalSearchParams<{ continent?: string }>();
  const continentSlug = typeof params.continent === "string" ? params.continent : "";
  const continent = getContinentBySlug(continentSlug);
  const regions = getRegionsForContinent(continentSlug);

  return (
    <SafeAreaView style={styles.container}>
      <Breadcrumbs
        items={[
          { label: "World", href: "/world" },
          continent ? { label: continent.name } : { label: "Unknown Continent" },
        ]}
      />
      {continent ? (
        <FlatList<typeof regions[number]>
          data={regions}
          keyExtractor={(item: (typeof regions)[number]) => item.id}
          renderItem={({ item }: { item: (typeof regions)[number] }) => (
            <Link href={`/world/${continent.slug}/${item.slug}`} asChild>
              <Pressable style={styles.item}>
                <Text style={styles.title}>{item.name}</Text>
                <Text style={styles.subtitle}>{item.countries.length} countries</Text>
              </Pressable>
            </Link>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      ) : (
        <Text style={styles.error}>Continent not found.</Text>
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

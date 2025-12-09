import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getContinents } from "@/data/world";
import { Link } from "expo-router";
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function WorldScreen() {
  const continents = getContinents();

  return (
    <SafeAreaView style={styles.container}>
      <Breadcrumbs items={[{ label: "World" }]} />
      <FlatList<typeof continents[number]>
        data={continents}
        keyExtractor={(item: (typeof continents)[number]) => item.id}
        renderItem={({ item }: { item: (typeof continents)[number] }) => (
          <Link href={`/world/${item.slug}`} asChild>
            <Pressable style={styles.item}>
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.subtitle}>{item.regions.length} regions</Text>
            </Pressable>
          </Link>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
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
});

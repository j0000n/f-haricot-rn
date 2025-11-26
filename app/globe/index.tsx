import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { GlobeView } from "@/global/GlobeView";

export default function GlobeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>World Globe</Text>
      </View>
      <View style={styles.globeContainer}>
        <GlobeView />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  header: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: "black",
  },
  title: { color: "white", fontSize: 20, fontWeight: "600" },
  globeContainer: { flex: 1 },
});

import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <View style={styles.container} accessibilityLabel="Breadcrumbs">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const content = (
          <Text style={[styles.text, isLast ? styles.activeText : styles.linkText]}>{item.label}</Text>
        );

        return (
          <View key={`${item.label}-${index}`} style={styles.item}>
            {item.href && !isLast ? (
              <Link href={item.href} asChild>
                <Pressable accessibilityRole="link">{content}</Pressable>
              </Link>
            ) : (
              content
            )}
            {!isLast && <Text style={styles.separator}>/</Text>}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginBottom: 12,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
    marginBottom: 4,
  },
  separator: {
    color: "#888",
    marginHorizontal: 2,
  },
  text: {
    fontSize: 16,
  },
  linkText: {
    color: "#1b73e8",
  },
  activeText: {
    fontWeight: "700",
  },
});

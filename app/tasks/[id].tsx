import { api } from "@haricot/convex-client";
import { Id } from "@haricot/convex-client";
import createTaskDetailStyles from "@/styles/taskDetailStyles";
import { useMutation, useQuery } from "convex/react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useEffect } from "react";
import { useThemedStyles } from "@/styles/tokens";
import { useTranslation } from "@/i18n/useTranslation";

export default function TaskDetail() {
  const { id } = useLocalSearchParams<{ id: Id<"tasks"> }>();
  const router = useRouter();
  const task = useQuery(api.tasks.getById, { id });
  const toggleTask = useMutation(api.tasks.toggle);
  const deleteTask = useMutation(api.tasks.remove);
  const styles = useThemedStyles(createTaskDetailStyles);
  const { t } = useTranslation();

  // Redirect if task is deleted or not found
  useEffect(() => {
    if (task === null) {
      router.back();
    }
  }, [task, router]);

  const handleToggle = async () => {
    try {
      await toggleTask({ id });
    } catch (error) {
      console.error("Error toggling task:", error);
      Alert.alert(t("tasks.error"), t("tasks.errorUpdate"));
    }
  };

  const handleDelete = async () => {
    // Use native confirm dialog on web, Alert.alert on mobile
    if (Platform.OS === "web") {
      const confirmed = confirm(t("tasks.deleteConfirmMessage"));
      if (!confirmed) return;

      try {
        await deleteTask({ id });
        // Navigation happens automatically via useEffect when task becomes null
      } catch (error) {
        console.error("Error deleting task:", error);
        alert(t("tasks.errorDeleteMessage"));
      }
    } else {
      Alert.alert(
        t("tasks.deleteConfirmTitle"),
        t("tasks.deleteConfirmMessage"),
        [
          { text: t("tasks.cancel"), style: "cancel" },
          {
            text: t("common.delete"),
            style: "destructive",
            onPress: async () => {
              try {
                await deleteTask({ id });
                // Navigation happens automatically via useEffect when task becomes null
              } catch (error) {
                console.error("Error deleting task:", error);
                Alert.alert(t("tasks.error"), t("tasks.errorDelete"));
              }
            },
          },
        ]
      );
    }
  };

  // Show loading state while task is being fetched
  // (undefined means loading, null means not found and will redirect)
  if (task === undefined) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: t("tasks.loading") }} />
        <Text style={styles.loadingText}>{t("tasks.loadingTask")}</Text>
      </View>
    );
  }

  // Task is null (not found), will redirect via useEffect
  if (task === null) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: t("tasks.notFoundTitle") }} />
        <Text style={styles.loadingText}>{t("tasks.notFoundMessage")}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: t("tasks.taskDetails"),
          headerBackTitle: t("tasks.back"),
        }}
      />

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.label}>{t("tasks.titleLabel")}</Text>
          <Text style={styles.title}>{task.title}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{t("tasks.descriptionLabel")}</Text>
          <Text style={styles.description}>{task.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{t("tasks.status")}</Text>
          <Pressable style={styles.statusButton} onPress={handleToggle}>
            <Text style={styles.statusText}>
              {task.isCompleted ? t("tasks.completed") : t("tasks.notCompleted")}
            </Text>
            <Text style={styles.statusHint}>{t("tasks.tapToToggle")}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <Pressable style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>{t("tasks.deleteTask")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

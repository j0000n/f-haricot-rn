import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import createTaskDetailStyles from "@/styles/taskDetailStyles";
import { useMutation, useQuery } from "convex/react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useEffect } from "react";
import { useThemedStyles } from "@/styles/tokens";

export default function TaskDetail() {
  const { id } = useLocalSearchParams<{ id: Id<"tasks"> }>();
  const router = useRouter();
  const task = useQuery(api.tasks.getById, { id });
  const toggleTask = useMutation(api.tasks.toggle);
  const deleteTask = useMutation(api.tasks.remove);
  const styles = useThemedStyles(createTaskDetailStyles);

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
      Alert.alert("Error", "Could not update task");
    }
  };

  const handleDelete = async () => {
    // Use native confirm dialog on web, Alert.alert on mobile
    if (Platform.OS === "web") {
      const confirmed = confirm("Are you sure you want to delete this task?");
      if (!confirmed) return;

      try {
        await deleteTask({ id });
        // Navigation happens automatically via useEffect when task becomes null
      } catch (error) {
        console.error("Error deleting task:", error);
        alert("Error: Could not delete task");
      }
    } else {
      Alert.alert(
        "Delete Task",
        "Are you sure you want to delete this task?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                await deleteTask({ id });
                // Navigation happens automatically via useEffect when task becomes null
              } catch (error) {
                console.error("Error deleting task:", error);
                Alert.alert("Error", "Could not delete task");
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
        <Stack.Screen options={{ title: "Loading..." }} />
        <Text style={styles.loadingText}>Loading task...</Text>
      </View>
    );
  }

  // Task is null (not found), will redirect via useEffect
  if (task === null) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: "Task Not Found" }} />
        <Text style={styles.loadingText}>Task not found...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Task Details",
          headerBackTitle: "Back",
        }}
      />

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.label}>Title</Text>
          <Text style={styles.title}>{task.title}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <Text style={styles.description}>{task.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Status</Text>
          <Pressable style={styles.statusButton} onPress={handleToggle}>
            <Text style={styles.statusText}>
              {task.isCompleted ? "✓ Completed" : "○ Not Completed"}
            </Text>
            <Text style={styles.statusHint}>Tap to toggle</Text>
          </Pressable>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <Pressable style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Delete Task</Text>
        </Pressable>
      </View>
    </View>
  );
}


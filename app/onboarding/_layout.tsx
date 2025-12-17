import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="accessibility" />
      <Stack.Screen name="theme" />
      <Stack.Screen name="dietary" />
      <Stack.Screen name="allergies" />
      <Stack.Screen name="creator/index" />
      <Stack.Screen name="creator/profile" />
      <Stack.Screen name="creator/finish" />
      <Stack.Screen name="household-code" />
      <Stack.Screen name="household" />
      <Stack.Screen name="cuisines" />
      <Stack.Screen name="cooking-styles" />
      <Stack.Screen name="nutrition-goals" />
      <Stack.Screen name="meal-preferences" />
      <Stack.Screen name="vendor/index" />
      <Stack.Screen name="vendor/profile" />
      <Stack.Screen name="vendor/finish" />
      <Stack.Screen name="index" />
    </Stack>
  );
}

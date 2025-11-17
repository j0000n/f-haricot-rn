import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="accessibility" />
      <Stack.Screen name="theme" />
      <Stack.Screen name="dietary" />
      <Stack.Screen name="allergies" />
      <Stack.Screen name="household-code" />
      <Stack.Screen name="household" />
      <Stack.Screen name="cuisines" />
      <Stack.Screen name="cooking-styles" />
      <Stack.Screen name="meal-preferences" />
      <Stack.Screen name="index" />
    </Stack>
  );
}

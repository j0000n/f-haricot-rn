import { POSTHOG_API_KEY, POSTHOG_OPTIONS } from "@/utils/posthog";
import { PropsWithChildren } from "react";
import { Platform } from "react-native";
import { PostHogProvider } from "posthog-react-native";

function NoopProvider({ children }: PropsWithChildren) {
  return <>{children}</>;
}

export function AnalyticsProvider({ children }: PropsWithChildren) {
  if (Platform.OS === "web") {
    return <NoopProvider>{children}</NoopProvider>;
  }

  return (
    <PostHogProvider apiKey={POSTHOG_API_KEY} options={POSTHOG_OPTIONS} autocapture>
      {children}
    </PostHogProvider>
  );
}

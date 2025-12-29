import { api } from "@/convex/_generated/api";
import { POSTHOG_API_KEY, POSTHOG_BASE_OPTIONS } from "@/utils/posthog";
import { PropsWithChildren } from "react";
import { Platform } from "react-native";
import { PostHogProvider } from "posthog-react-native";
import { useQuery } from "convex/react";

function NoopProvider({ children }: PropsWithChildren) {
  return <>{children}</>;
}

export function AnalyticsProvider({ children }: PropsWithChildren) {
  const user = useQuery(api.users.getCurrentUser);
  const analyticsOptIn = Boolean(
    (user as { analyticsOptIn?: boolean | null } | null)?.analyticsOptIn
  );
  const sessionReplayOptIn = Boolean(
    (user as { sessionReplayOptIn?: boolean | null } | null)?.sessionReplayOptIn
  );

  if (Platform.OS === "web" || !analyticsOptIn) {
    return <NoopProvider>{children}</NoopProvider>;
  }

  const options = {
    ...POSTHOG_BASE_OPTIONS,
    enableSessionReplay: analyticsOptIn && sessionReplayOptIn,
  };

  return (
    <PostHogProvider apiKey={POSTHOG_API_KEY} options={options} autocapture>
      {children}
    </PostHogProvider>
  );
}

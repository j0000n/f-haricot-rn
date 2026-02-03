import { api } from "@haricot/convex-client";
import { useQuery } from "convex/react";
import { Redirect } from "expo-router";

export default function OnboardingIndex() {
  const user = useQuery(api.users.getCurrentUser);

  if (user === undefined) {
    return null;
  }

  const userType = (user as { userType?: string } | null)?.userType ?? "";

  const destination =
    userType === "creator"
      ? "/onboarding/creator"
      : userType === "vendor"
      ? "/onboarding/vendor"
      : "/onboarding/accessibility";

  return <Redirect href={destination} />;
}

import { PageHeader } from "@/components/PageHeader";
import { api } from "@/convex/_generated/api";
import { useTranslation } from "@/i18n/useTranslation";
import createRoleDashboardStyles from "@/styles/roleDashboardStyles";
import { useThemedStyles } from "@/styles/tokens";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useQuery } from "convex/react";

type Profile = {
  name?: string | null;
  email?: string | null;
  userType?: string | null;
};

type ProfileRow = {
  label: string;
  value: string;
};

export default function VendorScreen() {
  const styles = useThemedStyles(createRoleDashboardStyles);
  const { t } = useTranslation();
  const router = useRouter();
  const user = useQuery(api.users.getCurrentUser) as Profile | null | undefined;
  const userType = user?.userType ?? "";

  useEffect(() => {
    if (user === undefined) {
      return;
    }

    if (userType !== "vendor") {
      router.replace("/");
    }
  }, [router, user, userType]);

  if (user === undefined) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (userType !== "vendor" || !user) {
    return null;
  }

  const profileRows: ProfileRow[] = [
    {
      label: t("vendor.nameLabel"),
      value: user.name ? String(user.name) : t("vendor.missingField"),
    },
    {
      label: t("vendor.emailLabel"),
      value: user.email ? String(user.email) : t("vendor.missingField"),
    },
    {
      label: t("vendor.userTypeLabel"),
      value: userType || t("vendor.missingField"),
    },
  ];

  return (
    <View style={styles.container}>
      <PageHeader title={t("vendor.title")} showProfileButton />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{t("vendor.badge")}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>{t("vendor.profileHeading")}</Text>
          <Text style={styles.description}>{t("vendor.description")}</Text>

          <View style={styles.profileGroup}>
            {profileRows.map((row) => (
              <View key={row.label} style={styles.profileRow}>
                <Text style={styles.profileLabel}>{row.label}</Text>
                <Text style={styles.profileValue}>{row.value}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

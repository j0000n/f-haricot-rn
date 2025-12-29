import { Text, View } from "react-native";
import { BrandLogo } from "@/components/BrandLogo";
import createProfileStyles from "@/styles/profileStyles";
import { useThemedStyles } from "@/styles/tokens";

type ProfileHeaderProps = {
  user: Record<string, unknown> | null | undefined;
};

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const styles = useThemedStyles(createProfileStyles);

  return (
    <View style={styles.headerProfile}>
      <View style={styles.headerTop}>
        <View style={styles.headerLeft}>
          {user && typeof user === "object" && "email" in user && user.email ? (
            <Text style={styles.email}>{String(user.email)}</Text>
          ) : null}
        </View>
        <BrandLogo size={48} />
      </View>
    </View>
  );
}

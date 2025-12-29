import { Pressable, Text, TextInput, View } from "react-native";
import createProfileStyles from "@/styles/profileStyles";
import { useTheme, useThemedStyles } from "@/styles/tokens";

type HouseholdMessage = {
  tone: "info" | "success" | "error";
  text: string;
};

type HouseholdAllergiesSectionProps = {
  allergies: string[];
  pendingAllergy: string;
  onPendingAllergyChange: (value: string) => void;
  onAddAllergy: () => void;
  onRemoveAllergy: (value: string) => void;
  onSaveAllergies: () => void;
  isSavingAllergies: boolean;
  allergyMessage: HouseholdMessage | null;
};

export function HouseholdAllergiesSection({
  allergies,
  pendingAllergy,
  onPendingAllergyChange,
  onAddAllergy,
  onRemoveAllergy,
  onSaveAllergies,
  isSavingAllergies,
  allergyMessage,
}: HouseholdAllergiesSectionProps) {
  const styles = useThemedStyles(createProfileStyles);
  const { tokens } = useTheme();

  return (
    <View style={styles.allergySection}>
      <Text style={styles.memberSectionTitle}>Household allergies</Text>
      <Text style={styles.allergyDescription}>
        Keep this list current so everyone can avoid risky ingredients.
      </Text>
      <View style={styles.allergyGroup}>
        <Text style={styles.memberSubheading}>Your allergies</Text>
        {allergies.length > 0 ? (
          <View style={styles.chipList}>
            {allergies.map((item) => (
              <View key={item} style={styles.chip}>
                <Text style={styles.chipText}>{item}</Text>
                <Pressable
                  onPress={() => onRemoveAllergy(item)}
                  accessibilityLabel={`Remove ${item}`}
                  style={styles.chipRemove}
                >
                  <Text style={styles.chipRemoveText}>×</Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.allergyEmptyText}>No allergies listed yet.</Text>
        )}
        <View style={styles.inlineInputRow}>
          <TextInput
            value={pendingAllergy}
            onChangeText={onPendingAllergyChange}
            placeholder="Add an allergy"
            placeholderTextColor={tokens.colors.textMuted}
            style={[styles.manageInput, styles.inlineInput]}
            autoCapitalize="words"
            autoCorrect
          />
          <Pressable
            onPress={onAddAllergy}
            style={[
              styles.inlinePrimaryButton,
              !pendingAllergy.trim() ? styles.disabledControl : null,
            ]}
            disabled={!pendingAllergy.trim()}
          >
            <Text style={styles.inlinePrimaryButtonText}>Add</Text>
          </Pressable>
        </View>
        <Pressable
          onPress={onSaveAllergies}
          style={[
            styles.managePrimaryButton,
            isSavingAllergies ? styles.disabledControl : null,
          ]}
          disabled={isSavingAllergies}
        >
          <Text style={styles.managePrimaryText}>
            {isSavingAllergies ? "Saving…" : "Save allergies"}
          </Text>
        </Pressable>
      </View>
      {allergyMessage ? (
        <Text
          style={[
            styles.householdMessage,
            allergyMessage.tone === "info" ? styles.householdMessageInfo : null,
            allergyMessage.tone === "success" ? styles.householdMessageSuccess : null,
            allergyMessage.tone === "error" ? styles.householdMessageError : null,
          ]}
        >
          {allergyMessage.text}
        </Text>
      ) : null}
    </View>
  );
}

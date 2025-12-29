import { Pressable, Text, TextInput, View } from "react-native";
import createProfileStyles from "@/styles/profileStyles";
import { useTheme, useThemedStyles } from "@/styles/tokens";
import type { HouseholdChild } from "@/components/profile/types";

type HouseholdMessage = {
  tone: "info" | "success" | "error";
  text: string;
};

type HouseholdChildrenSectionProps = {
  householdChildren: HouseholdChild[];
  childActionBusy: boolean;
  editingChildId: string | null;
  editingChildName: string;
  editingChildAllergies: string[];
  editingChildAllergyInput: string;
  newChildName: string;
  newChildAllergyInput: string;
  newChildAllergies: string[];
  childMessage: HouseholdMessage | null;
  onStartEditingChild: (childId: string) => void;
  onEditingChildNameChange: (value: string) => void;
  onEditingChildAllergyInputChange: (value: string) => void;
  onAddEditingChildAllergy: () => void;
  onRemoveEditingChildAllergy: (value: string) => void;
  onSaveChild: () => void;
  onDeleteChild: (childId: string, childName: string) => void;
  onNewChildNameChange: (value: string) => void;
  onNewChildAllergyInputChange: (value: string) => void;
  onAddNewChildAllergy: () => void;
  onRemoveNewChildAllergy: (value: string) => void;
  onCreateChild: () => void;
};

export function HouseholdChildrenSection({
  householdChildren,
  childActionBusy,
  editingChildId,
  editingChildName,
  editingChildAllergies,
  editingChildAllergyInput,
  newChildName,
  newChildAllergyInput,
  newChildAllergies,
  childMessage,
  onStartEditingChild,
  onEditingChildNameChange,
  onEditingChildAllergyInputChange,
  onAddEditingChildAllergy,
  onRemoveEditingChildAllergy,
  onSaveChild,
  onDeleteChild,
  onNewChildNameChange,
  onNewChildAllergyInputChange,
  onAddNewChildAllergy,
  onRemoveNewChildAllergy,
  onCreateChild,
}: HouseholdChildrenSectionProps) {
  const styles = useThemedStyles(createProfileStyles);
  const { tokens } = useTheme();

  return (
    <View style={styles.childSection}>
      <Text style={styles.memberSectionTitle}>Children</Text>
      {householdChildren.length === 0 ? (
        <Text style={styles.allergyEmptyText}>No children on this household yet.</Text>
      ) : (
        householdChildren.map((child) => {
          const isEditing = editingChildId === child.id;
          return (
            <View key={child.id} style={styles.childCard}>
              <View style={styles.childHeader}>
                <Text style={styles.childName}>{child.name}</Text>
                <Pressable
                  onPress={() => onStartEditingChild(child.id)}
                  style={styles.childEditButton}
                  disabled={childActionBusy}
                >
                  <Text style={styles.childEditButtonText}>
                    {isEditing ? "Close" : "Manage"}
                  </Text>
                </Pressable>
              </View>
              {child.allergies.length > 0 ? (
                <View style={styles.chipList}>
                  {child.allergies.map((item) => (
                    <View key={item} style={styles.chip}>
                      <Text style={styles.chipText}>{item}</Text>
                      {isEditing ? (
                        <Pressable
                          onPress={() => onRemoveEditingChildAllergy(item)}
                          accessibilityLabel={`Remove ${item}`}
                          style={styles.chipRemove}
                        >
                          <Text style={styles.chipRemoveText}>×</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.allergyEmptyText}>No allergies recorded.</Text>
              )}
              {isEditing ? (
                <View style={styles.childEditor}>
                  <Text style={styles.manageLabel}>Child name</Text>
                  <TextInput
                    value={editingChildName}
                    onChangeText={onEditingChildNameChange}
                    style={styles.manageInput}
                    placeholder="Enter name"
                    placeholderTextColor={tokens.colors.textMuted}
                    editable={!childActionBusy}
                  />
                  <Text style={styles.manageLabel}>Allergies</Text>
                  <View style={styles.inlineInputRow}>
                    <TextInput
                      value={editingChildAllergyInput}
                      onChangeText={onEditingChildAllergyInputChange}
                      style={[styles.manageInput, styles.inlineInput]}
                      placeholder="Add an allergy"
                      placeholderTextColor={tokens.colors.textMuted}
                      autoCapitalize="words"
                      autoCorrect
                      editable={!childActionBusy}
                    />
                    <Pressable
                      onPress={onAddEditingChildAllergy}
                      style={[
                        styles.inlinePrimaryButton,
                        !editingChildAllergyInput.trim() || childActionBusy
                          ? styles.disabledControl
                          : null,
                      ]}
                      disabled={!editingChildAllergyInput.trim() || childActionBusy}
                    >
                      <Text style={styles.inlinePrimaryButtonText}>Add</Text>
                    </Pressable>
                  </View>
                  <View style={styles.childEditorActions}>
                    <Pressable
                      onPress={onSaveChild}
                      style={[
                        styles.managePrimaryButton,
                        childActionBusy ? styles.disabledControl : null,
                      ]}
                      disabled={childActionBusy}
                    >
                      <Text style={styles.managePrimaryText}>
                        {childActionBusy ? "Saving…" : "Save changes"}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => onDeleteChild(child.id, child.name)}
                      style={[
                        styles.dangerOutlineButton,
                        childActionBusy ? styles.disabledControl : null,
                      ]}
                      disabled={childActionBusy}
                    >
                      <Text style={styles.dangerOutlineButtonText}>Remove child</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}
            </View>
          );
        })
      )}
      <View style={styles.newChildForm}>
        <Text style={styles.memberSubheading}>Add a child</Text>
        <TextInput
          value={newChildName}
          onChangeText={onNewChildNameChange}
          placeholder="Child name"
          placeholderTextColor={tokens.colors.textMuted}
          style={styles.manageInput}
          editable={!childActionBusy}
        />
        {newChildAllergies.length > 0 ? (
          <View style={styles.chipList}>
            {newChildAllergies.map((item) => (
              <View key={item} style={styles.chip}>
                <Text style={styles.chipText}>{item}</Text>
                <Pressable
                  onPress={() => onRemoveNewChildAllergy(item)}
                  accessibilityLabel={`Remove ${item}`}
                  style={styles.chipRemove}
                >
                  <Text style={styles.chipRemoveText}>×</Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.allergyEmptyText}>Add any allergies this child has.</Text>
        )}
        <View style={styles.inlineInputRow}>
          <TextInput
            value={newChildAllergyInput}
            onChangeText={onNewChildAllergyInputChange}
            placeholder="Add an allergy"
            placeholderTextColor={tokens.colors.textMuted}
            style={[styles.manageInput, styles.inlineInput]}
            autoCapitalize="words"
            autoCorrect
            editable={!childActionBusy}
          />
          <Pressable
            onPress={onAddNewChildAllergy}
            style={[
              styles.inlinePrimaryButton,
              !newChildAllergyInput.trim() || childActionBusy
                ? styles.disabledControl
                : null,
            ]}
            disabled={!newChildAllergyInput.trim() || childActionBusy}
          >
            <Text style={styles.inlinePrimaryButtonText}>Add</Text>
          </Pressable>
        </View>
        <Pressable
          onPress={onCreateChild}
          style={[
            styles.managePrimaryButton,
            childActionBusy ? styles.disabledControl : null,
          ]}
          disabled={childActionBusy}
        >
          <Text style={styles.managePrimaryText}>
            {childActionBusy ? "Saving…" : "Add child"}
          </Text>
        </Pressable>
      </View>
      {childMessage ? (
        <Text
          style={[
            styles.householdMessage,
            childMessage.tone === "info" ? styles.householdMessageInfo : null,
            childMessage.tone === "success" ? styles.householdMessageSuccess : null,
            childMessage.tone === "error" ? styles.householdMessageError : null,
          ]}
        >
          {childMessage.text}
        </Text>
      ) : null}
    </View>
  );
}

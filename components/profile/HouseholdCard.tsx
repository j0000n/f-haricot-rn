import { Pressable, Text, TextInput, View } from "react-native";
import createProfileStyles from "@/styles/profileStyles";
import { useTheme, useThemedStyles } from "@/styles/tokens";
import type { Id } from "@haricot/convex-client";
import type {
  HouseholdChild,
  HouseholdDetails,
  HouseholdMember,
  PendingMember,
} from "@/components/profile/types";
import { HouseholdAllergiesSection } from "@/components/profile/HouseholdAllergiesSection";
import { HouseholdChildrenSection } from "@/components/profile/HouseholdChildrenSection";

type HouseholdMessage = {
  tone: "info" | "success" | "error";
  text: string;
};

type HouseholdCardProps = {
  isHouseholdLoading: boolean;
  household: unknown;
  householdDetails: HouseholdDetails | null;
  isHouseholdMember: boolean;
  isHouseholdPending: boolean;
  confirmedMembers: HouseholdMember[];
  pendingMembers: PendingMember[];
  copyFeedback: "idle" | "copied" | "error";
  householdMessage: HouseholdMessage | null;
  confirmingMember: Id<"users"> | null;
  isManagingHousehold: boolean;
  manageBusy: boolean;
  desiredCode: string;
  allergies: string[];
  pendingAllergy: string;
  isSavingAllergies: boolean;
  allergyMessage: HouseholdMessage | null;
  householdChildren: HouseholdChild[];
  newChildName: string;
  newChildAllergyInput: string;
  newChildAllergies: string[];
  childMessage: HouseholdMessage | null;
  childActionBusy: boolean;
  editingChildId: string | null;
  editingChildName: string;
  editingChildAllergies: string[];
  editingChildAllergyInput: string;
  onCopyCode: () => void;
  onConfirmMember: (memberId: Id<"users">) => void;
  onToggleManage: () => void;
  onDesiredCodeChange: (value: string) => void;
  onChangeCode: () => void;
  onLeaveHousehold: () => void;
  onPendingAllergyChange: (value: string) => void;
  onAddAllergy: () => void;
  onRemoveAllergy: (value: string) => void;
  onSaveAllergies: () => void;
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

export function HouseholdCard({
  isHouseholdLoading,
  household,
  householdDetails,
  isHouseholdMember,
  isHouseholdPending,
  confirmedMembers,
  pendingMembers,
  copyFeedback,
  householdMessage,
  confirmingMember,
  isManagingHousehold,
  manageBusy,
  desiredCode,
  allergies,
  pendingAllergy,
  isSavingAllergies,
  allergyMessage,
  householdChildren,
  newChildName,
  newChildAllergyInput,
  newChildAllergies,
  childMessage,
  childActionBusy,
  editingChildId,
  editingChildName,
  editingChildAllergies,
  editingChildAllergyInput,
  onCopyCode,
  onConfirmMember,
  onToggleManage,
  onDesiredCodeChange,
  onChangeCode,
  onLeaveHousehold,
  onPendingAllergyChange,
  onAddAllergy,
  onRemoveAllergy,
  onSaveAllergies,
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
}: HouseholdCardProps) {
  const styles = useThemedStyles(createProfileStyles);
  const { tokens } = useTheme();

  return (
    <View style={styles.householdCard}>
      <Text style={styles.householdOverline}>INVITE YOUR HOUSEHOLD TO HARICOT</Text>
      {isHouseholdLoading ? (
        <Text style={styles.householdStatusText}>Loading household details…</Text>
      ) : household === null ? (
        <Text style={styles.householdStatusText}>
          Sign in to see your household information.
        </Text>
      ) : isHouseholdMember && householdDetails ? (
        <>
          <Text style={styles.householdDescription}>
            Share this invite code with everyone you cook with to keep tasks in sync.
          </Text>
          <View style={styles.householdCodeRow}>
            <View style={styles.codeBadge}>
              <Text style={styles.codeText}>{householdDetails.code}</Text>
            </View>
            <Pressable
              onPress={onCopyCode}
              style={[
                styles.copyButton,
                copyFeedback === "copied" ? styles.copyButtonCopied : null,
                copyFeedback === "error" ? styles.copyButtonError : null,
              ]}
              accessibilityLabel="Copy household code"
            >
              <Text
                style={[
                  styles.copyButtonText,
                  copyFeedback === "error" ? styles.copyButtonErrorText : null,
                ]}
              >
                {copyFeedback === "copied" ? "Copied!" : "Copy code"}
              </Text>
            </Pressable>
          </View>
          {householdMessage ? (
            <Text
              style={[
                styles.householdMessage,
                householdMessage.tone === "info" ? styles.householdMessageInfo : null,
                householdMessage.tone === "success"
                  ? styles.householdMessageSuccess
                  : null,
                householdMessage.tone === "error" ? styles.householdMessageError : null,
              ]}
            >
              {householdMessage.text}
            </Text>
          ) : null}
          <View style={styles.memberSection}>
            <Text style={styles.memberSectionTitle}>Members</Text>
            {confirmedMembers.length === 0 ? (
              <Text style={styles.householdStatusText}>No confirmed members yet.</Text>
            ) : (
              confirmedMembers.map((member) => (
                <View key={member.id} style={styles.memberRow}>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>
                      {member.name ?? member.email ?? "Household member"}
                    </Text>
                    {member.email ? (
                      <Text style={styles.memberEmail}>{member.email}</Text>
                    ) : null}
                  </View>
                </View>
              ))
            )}
          </View>
          {pendingMembers.length > 0 ? (
            <View style={styles.memberSection}>
              <Text style={styles.memberSectionTitle}>Pending requests</Text>
              {pendingMembers.map((member) => (
                <View key={member.id} style={styles.memberRow}>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>
                      {member.name ?? member.email ?? "New household member"}
                    </Text>
                    {member.email ? (
                      <Text style={styles.memberEmail}>{member.email}</Text>
                    ) : null}
                    <Text style={styles.pendingHint}>Awaiting approval</Text>
                  </View>
                  <Pressable
                    onPress={() => onConfirmMember(member.id)}
                    style={[
                      styles.confirmButton,
                      confirmingMember !== null ? styles.disabledControl : null,
                    ]}
                    disabled={confirmingMember !== null}
                  >
                    <Text style={styles.confirmButtonText}>
                      {confirmingMember === member.id ? "Confirming…" : "Confirm"}
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}
          <HouseholdAllergiesSection
            allergies={allergies}
            pendingAllergy={pendingAllergy}
            onPendingAllergyChange={onPendingAllergyChange}
            onAddAllergy={onAddAllergy}
            onRemoveAllergy={onRemoveAllergy}
            onSaveAllergies={onSaveAllergies}
            isSavingAllergies={isSavingAllergies}
            allergyMessage={allergyMessage}
          />
          <HouseholdChildrenSection
            householdChildren={householdChildren}
            childActionBusy={childActionBusy}
            editingChildId={editingChildId}
            editingChildName={editingChildName}
            editingChildAllergies={editingChildAllergies}
            editingChildAllergyInput={editingChildAllergyInput}
            newChildName={newChildName}
            newChildAllergyInput={newChildAllergyInput}
            newChildAllergies={newChildAllergies}
            childMessage={childMessage}
            onStartEditingChild={onStartEditingChild}
            onEditingChildNameChange={onEditingChildNameChange}
            onEditingChildAllergyInputChange={onEditingChildAllergyInputChange}
            onAddEditingChildAllergy={onAddEditingChildAllergy}
            onRemoveEditingChildAllergy={onRemoveEditingChildAllergy}
            onSaveChild={onSaveChild}
            onDeleteChild={onDeleteChild}
            onNewChildNameChange={onNewChildNameChange}
            onNewChildAllergyInputChange={onNewChildAllergyInputChange}
            onAddNewChildAllergy={onAddNewChildAllergy}
            onRemoveNewChildAllergy={onRemoveNewChildAllergy}
            onCreateChild={onCreateChild}
          />
          <Pressable
            onPress={onToggleManage}
            style={[
              styles.manageButton,
              isManagingHousehold ? styles.manageButtonActive : null,
              !isHouseholdMember || manageBusy ? styles.disabledControl : null,
            ]}
            disabled={!isHouseholdMember || manageBusy}
          >
            <Text style={styles.manageButtonText}>
              {isManagingHousehold ? "Hide management" : "Manage household"}
            </Text>
          </Pressable>
          {isManagingHousehold ? (
            <View style={styles.manageSection}>
              <Text style={styles.manageDescription}>
                Change your invite code or leave this household.
              </Text>
              <Text style={styles.manageLabel}>New code (optional)</Text>
              <TextInput
                value={desiredCode}
                onChangeText={onDesiredCodeChange}
                placeholder={householdDetails.code}
                placeholderTextColor={tokens.colors.textMuted}
                style={styles.manageInput}
                autoCapitalize="characters"
                autoCorrect={false}
                autoComplete="off"
                maxLength={12}
                editable={!manageBusy}
              />
              <Text style={styles.manageHelper}>
                Leave this blank and we’ll generate a new random code.
              </Text>
              <View style={styles.manageActions}>
                <Pressable
                  onPress={onChangeCode}
                  style={[
                    styles.managePrimaryButton,
                    manageBusy ? styles.disabledControl : null,
                  ]}
                  disabled={manageBusy}
                >
                  <Text style={styles.managePrimaryText}>
                    {manageBusy ? "Saving…" : "Update code"}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={onLeaveHousehold}
                  style={[
                    styles.manageSecondaryButton,
                    manageBusy ? styles.disabledControl : null,
                  ]}
                  disabled={manageBusy}
                >
                  <Text style={styles.manageSecondaryText}>Leave household</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </>
      ) : isHouseholdPending && householdDetails ? (
        <>
          <Text style={styles.householdDescription}>
            Your request to join this household is waiting for someone to approve it.
          </Text>
          <View style={styles.memberSection}>
            <Text style={styles.memberSectionTitle}>Current members</Text>
            {confirmedMembers.length === 0 ? (
              <Text style={styles.householdStatusText}>
                We’ll add you as soon as a member approves the request.
              </Text>
            ) : (
              confirmedMembers.map((member) => (
                <View key={member.id} style={styles.memberRow}>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>
                      {member.name ?? member.email ?? "Household member"}
                    </Text>
                    {member.email ? (
                      <Text style={styles.memberEmail}>{member.email}</Text>
                    ) : null}
                  </View>
                </View>
              ))
            )}
          </View>
          {householdMessage ? (
            <Text
              style={[
                styles.householdMessage,
                householdMessage.tone === "info" ? styles.householdMessageInfo : null,
                householdMessage.tone === "success"
                  ? styles.householdMessageSuccess
                  : null,
                householdMessage.tone === "error" ? styles.householdMessageError : null,
              ]}
            >
              {householdMessage.text}
            </Text>
          ) : null}
        </>
      ) : (
        <>
          <Text style={styles.householdDescription}>
            We’re setting up your household. Pull to refresh if this takes longer than a moment.
          </Text>
          {householdMessage ? (
            <Text
              style={[
                styles.householdMessage,
                householdMessage.tone === "info" ? styles.householdMessageInfo : null,
                householdMessage.tone === "success"
                  ? styles.householdMessageSuccess
                  : null,
                householdMessage.tone === "error" ? styles.householdMessageError : null,
              ]}
            >
              {householdMessage.text}
            </Text>
          ) : null}
        </>
      )}
    </View>
  );
}

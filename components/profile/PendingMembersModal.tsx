import { Modal, Pressable, Text, View } from "react-native";
import createProfileStyles from "@/styles/profileStyles";
import { useThemedStyles } from "@/styles/tokens";
import type { PendingMember } from "@/components/profile/types";
import type { Id } from "@/convex/_generated/dataModel";

type PendingMembersModalProps = {
  visible: boolean;
  pendingMembers: PendingMember[];
  confirmingMember: Id<"users"> | null;
  pendingAcknowledgeBusy: boolean;
  onConfirmMember: (memberId: Id<"users">) => void;
  onAcknowledge: () => void;
  onDismiss: () => void;
};

export function PendingMembersModal({
  visible,
  pendingMembers,
  confirmingMember,
  pendingAcknowledgeBusy,
  onConfirmMember,
  onAcknowledge,
  onDismiss,
}: PendingMembersModalProps) {
  const styles = useThemedStyles(createProfileStyles);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Approve new household members</Text>
          <Text style={styles.modalDescription}>
            Confirm anyone you recognize so they can start cooking with you.
          </Text>
          <View style={styles.modalMemberList}>
            {pendingMembers.map((member) => (
              <View key={member.id} style={styles.modalMemberRow}>
                <View style={styles.modalMemberInfo}>
                  <Text style={styles.modalMemberName}>
                    {member.name ?? member.email ?? "New household member"}
                  </Text>
                  {member.email ? (
                    <Text style={styles.modalMemberEmail}>{member.email}</Text>
                  ) : null}
                  <Text style={styles.modalMemberHint}>Awaiting approval</Text>
                </View>
                <Pressable
                  onPress={() => onConfirmMember(member.id)}
                  style={[
                    styles.modalConfirmButton,
                    confirmingMember !== null ? styles.disabledControl : null,
                  ]}
                  disabled={confirmingMember !== null}
                >
                  <Text style={styles.modalConfirmButtonText}>
                    {confirmingMember === member.id ? "Confirming…" : "Confirm"}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
          <View style={styles.modalActions}>
            <Pressable
              onPress={onAcknowledge}
              style={[
                styles.modalPrimaryButton,
                pendingAcknowledgeBusy ? styles.disabledControl : null,
              ]}
              disabled={pendingAcknowledgeBusy}
            >
              <Text style={styles.modalPrimaryButtonText}>
                {pendingAcknowledgeBusy ? "Saving…" : "Done reviewing"}
              </Text>
            </Pressable>
            <Pressable
              onPress={onDismiss}
              style={styles.modalSecondaryButton}
              disabled={pendingAcknowledgeBusy}
            >
              <Text style={styles.modalSecondaryButtonText}>Remind me later</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

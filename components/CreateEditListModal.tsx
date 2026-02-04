import React, { useEffect, useState } from "react";
import { Alert, Modal, Pressable, Text, TextInput, View } from "react-native";
import { useTranslation } from "@/i18n/useTranslation";
import { useThemedStyles, useTokens } from "@/styles/tokens";
import type { ThemeTokens } from "@/styles/themes/types";
import { StyleSheet } from "react-native";

interface CreateEditListModalProps {
  visible: boolean;
  mode: "create" | "edit";
  initialName?: string;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
  isLoading?: boolean;
}

type Styles = ReturnType<typeof createStyles>;

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: tokens.spacing.lg,
    },
    modalContent: {
      backgroundColor: tokens.colors.surface,
      borderRadius: tokens.radii.lg,
      padding: tokens.spacing.lg,
      width: "100%",
      maxWidth: 400,
      gap: tokens.spacing.md,
    },
    modalTitle: {
      fontSize: tokens.typography.heading,
      fontFamily: tokens.fontFamilies.bold,
      color: tokens.colors.textPrimary,
      marginBottom: tokens.spacing.xs,
    },
    modalLabel: {
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.medium,
      color: tokens.colors.textSecondary,
      marginBottom: tokens.spacing.xxs,
    },
    modalInput: {
      borderWidth: tokens.borderWidths.thin,
      borderColor: tokens.colors.border,
      borderRadius: tokens.radii.md,
      backgroundColor: tokens.colors.background,
      paddingHorizontal: tokens.spacing.md,
      paddingVertical: tokens.spacing.sm,
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textPrimary,
    },
    modalButtons: {
      flexDirection: "row",
      gap: tokens.spacing.sm,
      marginTop: tokens.spacing.xs,
    },
    modalButton: {
      flex: 1,
      paddingVertical: tokens.spacing.md,
      paddingHorizontal: tokens.spacing.lg,
      borderRadius: tokens.radii.md,
      alignItems: "center",
      justifyContent: "center",
    },
    modalButtonCancel: {
      backgroundColor: tokens.colors.surface,
      borderWidth: tokens.borderWidths.thin,
      borderColor: tokens.colors.border,
    },
    modalButtonPrimary: {
      backgroundColor: tokens.colors.accent,
    },
    modalButtonCancelText: {
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.semiBold,
      color: tokens.colors.textSecondary,
    },
    modalButtonPrimaryText: {
      fontSize: tokens.typography.body,
      fontFamily: tokens.fontFamilies.semiBold,
      color: tokens.colors.accentOnPrimary,
    },
  });

export const CreateEditListModal: React.FC<CreateEditListModalProps> = ({
  visible,
  mode,
  initialName = "",
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const styles = useThemedStyles<Styles>(createStyles);
  const tokens = useTokens();
  const { t } = useTranslation();
  const [listName, setListName] = useState(initialName);

  // Update name when initialName changes (for edit mode)
  useEffect(() => {
    if (visible) {
      setListName(initialName);
    }
  }, [visible, initialName]);

  const handleSubmit = async () => {
    const trimmedName = listName.trim();
    if (!trimmedName) {
      const errorTitle =
        mode === "create"
          ? t("lists.createListErrorTitle")
          : t("lists.editListErrorTitle");
      const errorMessage =
        mode === "create"
          ? t("lists.createListErrorNameRequired")
          : t("lists.editListErrorNameRequired");
      Alert.alert(errorTitle, errorMessage);
      return;
    }

    try {
      await onSubmit(trimmedName);
      // Reset form on success
      setListName("");
    } catch (error) {
      // Error handling is done by parent component
      console.error("Error in CreateEditListModal:", error);
    }
  };

  const handleCancel = () => {
    setListName(initialName); // Reset to initial value
    onClose();
  };

  const submitButtonLabel = mode === "create" ? t("common.create") : t("common.save");
  const titleLabel = mode === "create" ? t("lists.createList") : t("lists.editList");

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <Pressable style={styles.modalOverlay} onPress={handleCancel}>
        <Pressable
          style={styles.modalContent}
          onPress={(e: any) => {
            // Prevent the overlay press from firing when clicking inside modal content
            e.stopPropagation();
          }}
        >
          <Text style={styles.modalTitle}>{titleLabel}</Text>

          <Text style={styles.modalLabel}>{t("lists.listName")}</Text>
          <TextInput
            value={listName}
            onChangeText={setListName}
            placeholder={t("lists.listNamePlaceholder")}
            placeholderTextColor={tokens.colors.textMuted}
            style={styles.modalInput}
            autoFocus
            returnKeyType="done"
            editable={!isLoading}
            onSubmitEditing={handleSubmit}
          />

          <View style={styles.modalButtons}>
            <Pressable
              onPress={handleCancel}
              style={[styles.modalButton, styles.modalButtonCancel]}
              disabled={isLoading}
            >
              <Text style={styles.modalButtonCancelText}>{t("common.cancel")}</Text>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              style={[styles.modalButton, styles.modalButtonPrimary]}
              disabled={!listName.trim() || isLoading}
            >
              <Text style={styles.modalButtonPrimaryText}>{submitButtonLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useTheme, useThemedStyles } from "@/styles/tokens";
import type { ThemeTokens } from "@/styles/tokens";
import { useAction, useQuery } from "convex/react";
import { Image } from "expo-image";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

type ImageUploadProps = {
  value?: Id<"_storage"> | null;
  onChange: (storageId: Id<"_storage"> | null) => void;
  label?: string;
};

export function ImageUpload({ value, onChange, label }: ImageUploadProps) {
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const storeFromUrl = useAction(api.images.storeFromUrl);
  const styles = useThemedStyles(createStyles);
  const { tokens } = useTheme();

  const attachFromUrl = async () => {
    const trimmedUrl = imageUrl.trim();

    if (!trimmedUrl) {
      setErrorMessage("Enter an image URL to attach to this task.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const storageId = await storeFromUrl({ imageUrl: trimmedUrl });
      onChange(storageId);
      setImageUrl("");
    } catch (error) {
      console.error("Failed to store image from URL", error);
      setErrorMessage(
        "We couldn't fetch that image. Confirm the link is valid and publicly accessible."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const clearImage = () => {
    onChange(null);
    setErrorMessage(null);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.previewShell}>
        {value ? (
          <TaskImagePreview storageId={value} />
        ) : (
          <View style={styles.previewPlaceholder}>
            <Text style={styles.previewPlaceholderText}>
              Paste an image URL to attach a visual reference
            </Text>
          </View>
        )}
      </View>
      <View style={styles.formRow}>
        <TextInput
          style={styles.input}
          placeholder="https://example.com/image.jpg"
          value={imageUrl}
          onChangeText={setImageUrl}
          autoCapitalize="none"
          keyboardType="url"
          editable={!submitting}
          placeholderTextColor={tokens.colors.textMuted}
        />
      </View>
      <View style={styles.actions}>
        <Pressable
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={attachFromUrl}
          disabled={submitting}
        >
          <Text style={styles.buttonText}>
            {submitting
              ? "Attaching..."
              : value
                ? "Replace with URL"
                : "Attach from URL"}
          </Text>
        </Pressable>
        {value && (
          <Pressable
            style={[styles.button, styles.secondaryButton]}
            onPress={clearImage}
            disabled={submitting}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>Remove</Text>
          </Pressable>
        )}
      </View>
      <Text style={styles.helperText}>
        Provide a direct link to a publicly accessible JPG or PNG. The image will be
        cached securely with your task.
      </Text>
      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
    </View>
  );
}

type TaskImagePreviewProps = {
  storageId: Id<"_storage">;
};

function TaskImagePreview({ storageId }: TaskImagePreviewProps) {
  const styles = useThemedStyles(createStyles);
  const imageUrl = useQuery(
    api.fileUrls.getFileUrl,
    storageId ? { storageId } : "skip"
  );

  if (imageUrl === undefined) {
    return (
      <View style={styles.previewPlaceholder}>
        <Text style={styles.previewPlaceholderText}>Loading image...</Text>
      </View>
    );
  }

  if (imageUrl === null) {
    return (
      <View style={styles.previewPlaceholder}>
        <Text style={styles.previewPlaceholderText}>Image unavailable</Text>
      </View>
    );
  }

  return <Image source={{ uri: imageUrl }} style={styles.previewImage} contentFit="cover" />;
}

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      gap: tokens.spacing.sm,
    },
    label: {
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.medium,
      color: tokens.colors.textSecondary,
    },
    previewShell: {
      width: "100%",
      height: 200,
      borderRadius: tokens.radii.md,
      borderWidth: 0.5,
      borderColor: tokens.colors.border,
      overflow: "hidden",
      backgroundColor: tokens.colors.overlay,
      justifyContent: "center",
      alignItems: "center",
    },
    previewPlaceholder: {
      flex: 1,
      width: "100%",
      paddingHorizontal: tokens.spacing.lg,
      justifyContent: "center",
      alignItems: "center",
    },
    previewPlaceholderText: {
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textMuted,
      textAlign: "center",
    },
    previewImage: {
      width: "100%",
      height: "100%",
    },
    formRow: {
      flexDirection: "row",
      gap: tokens.spacing.sm,
    },
    input: {
      flex: 1,
      backgroundColor: tokens.colors.surface,
      borderWidth: 0.5,
      borderColor: tokens.colors.border,
      borderRadius: tokens.radii.sm,
      paddingHorizontal: tokens.spacing.md,
      paddingVertical: tokens.spacing.sm,
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textPrimary,
    },
    actions: {
      flexDirection: "row",
      gap: tokens.spacing.sm,
    },
    button: {
      flex: 1,
      paddingVertical: tokens.spacing.md,
      borderRadius: tokens.radii.sm,
      backgroundColor: tokens.colors.accent,
      alignItems: "center",
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      fontSize: tokens.typography.small,
      fontFamily: tokens.fontFamilies.semiBold,
      color: tokens.colors.accentOnPrimary,
    },
    secondaryButton: {
      backgroundColor: tokens.colors.surface,
      borderWidth: 0.5,
      borderColor: tokens.colors.border,
    },
    secondaryButtonText: {
      color: tokens.colors.textPrimary,
    },
    helperText: {
      fontSize: tokens.typography.tiny,
      fontFamily: tokens.fontFamilies.regular,
      color: tokens.colors.textMuted,
    },
    errorText: {
      marginTop: tokens.spacing.xs,
      fontSize: tokens.typography.tiny,
      fontFamily: tokens.fontFamilies.medium,
      color: tokens.colors.danger,
    },
  });

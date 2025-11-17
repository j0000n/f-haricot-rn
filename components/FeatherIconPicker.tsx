import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import type { ThemeTokens } from "@/styles/tokens";

// Comprehensive list of Feather icons
const FEATHER_ICONS = [
  "activity", "airplay", "alert-circle", "alert-octagon", "alert-triangle",
  "align-center", "align-justify", "align-left", "align-right", "anchor",
  "aperture", "archive", "arrow-down", "arrow-down-circle", "arrow-down-left",
  "arrow-down-right", "arrow-left", "arrow-left-circle", "arrow-right",
  "arrow-right-circle", "arrow-up", "arrow-up-circle", "arrow-up-left",
  "arrow-up-right", "at-sign", "award", "bar-chart", "bar-chart-2", "battery",
  "battery-charging", "bell", "bell-off", "bluetooth", "bold", "book",
  "book-open", "bookmark", "box", "briefcase", "calendar", "camera",
  "camera-off", "cast", "check", "check-circle", "check-square", "chevron-down",
  "chevron-left", "chevron-right", "chevron-up", "chevrons-down", "chevrons-left",
  "chevrons-right", "chevrons-up", "chrome", "circle", "clipboard", "clock",
  "cloud", "cloud-drizzle", "cloud-lightning", "cloud-off", "cloud-rain",
  "cloud-snow", "code", "codepen", "codesandbox", "coffee", "command",
  "compass", "copy", "corner-down-left", "corner-down-right", "corner-left-down",
  "corner-left-up", "corner-right-down", "corner-right-up", "corner-up-left",
  "corner-up-right", "cpu", "credit-card", "crop", "crosshair", "database",
  "delete", "disc", "dollar-sign", "download", "download-cloud", "droplet",
  "edit", "edit-2", "edit-3", "external-link", "eye", "eye-off", "facebook",
  "fast-forward", "feather", "figma", "file", "file-minus", "file-plus",
  "file-text", "film", "filter", "flag", "folder", "folder-minus", "folder-plus",
  "framer", "frown", "gift", "git-branch", "git-commit", "git-merge",
  "git-pull-request", "github", "gitlab", "globe", "grid", "hard-drive",
  "hash", "headphones", "heart", "help-circle", "hexagon", "home", "image",
  "inbox", "info", "instagram", "italic", "key", "layers", "layout", "life-buoy",
  "link", "link-2", "linkedin", "list", "loader", "lock", "log-in", "log-out",
  "mail", "map", "map-pin", "maximize", "maximize-2", "meh", "menu", "message-circle",
  "message-square", "mic", "mic-off", "minimize", "minimize-2", "minus",
  "minus-circle", "minus-square", "monitor", "moon", "more-horizontal",
  "more-vertical", "mouse-pointer", "move", "music", "navigation", "navigation-2",
  "octagon", "package", "paperclip", "pause", "pause-circle", "pen-tool",
  "percent", "phone", "phone-call", "phone-forwarded", "phone-incoming",
  "phone-missed", "phone-off", "phone-outgoing", "pie-chart", "play",
  "play-circle", "plus", "plus-circle", "plus-square", "pocket", "power",
  "printer", "radio", "refresh-ccw", "refresh-cw", "repeat", "rewind",
  "rotate-ccw", "rotate-cw", "rss", "save", "scissors", "search", "send",
  "server", "settings", "share", "share-2", "shield", "shield-off", "shopping-bag",
  "shopping-cart", "shuffle", "sidebar", "skip-back", "skip-forward", "slack",
  "slash", "sliders", "smartphone", "smile", "speaker", "square", "star",
  "stop-circle", "sun", "sunrise", "sunset", "tablet", "tag", "target",
  "terminal", "thermometer", "thumbs-down", "thumbs-up", "toggle-left",
  "toggle-right", "tool", "trash", "trash-2", "trending-down", "trending-up",
  "triangle", "truck", "tv", "twitch", "twitter", "type", "umbrella",
  "underline", "unlock", "upload", "upload-cloud", "user", "user-check",
  "user-minus", "user-plus", "user-x", "users", "video", "video-off",
  "voicemail", "volume", "volume-1", "volume-2", "volume-x", "watch",
  "wifi", "wifi-off", "wind", "x", "x-circle", "x-square", "youtube", "zap",
  "zap-off", "zoom-in", "zoom-out",
];

type FeatherIconPickerProps = {
  value: string;
  onChange: (iconName: string) => void;
  colors: {
    textPrimary: string;
    textSecondary: string;
    border: string;
    overlay: string;
    accent: string;
    accentOnPrimary: string;
    textMuted: string;
    surface: string;
  };
  tokens: ThemeTokens;
};

export function FeatherIconPicker({
  value,
  onChange,
  colors,
  tokens,
}: FeatherIconPickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredIcons = FEATHER_ICONS.filter((icon) =>
    icon.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Pressable
        onPress={() => setShowPicker(true)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: tokens.spacing.sm,
          padding: tokens.spacing.sm,
          borderRadius: tokens.radii.sm,
          borderWidth: tokens.borderWidths.regular,
          borderColor: colors.border,
          backgroundColor: colors.overlay,
        }}
      >
        <Feather name={value as any} size={20} color={colors.textPrimary} />
        <Text
          style={{
            color: colors.textPrimary,
            fontSize: tokens.typography.small,
            fontFamily: tokens.fontFamilies.regular,
            flex: 1,
          }}
        >
          {value}
        </Text>
        <Feather name="chevron-down" size={16} color={colors.textSecondary} />
      </Pressable>

      {showPicker && (
        <Modal
          visible={showPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPicker(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "flex-end",
            }}
          >
            <View
              style={{
                backgroundColor: colors.surface,
                borderTopLeftRadius: tokens.radii.lg,
                borderTopRightRadius: tokens.radii.lg,
                maxHeight: "80%",
                padding: tokens.padding.card,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: tokens.spacing.md,
                }}
              >
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: tokens.typography.heading,
                    fontFamily: tokens.fontFamilies.bold,
                  }}
                >
                  Select Icon
                </Text>
                <Pressable
                  onPress={() => setShowPicker(false)}
                  style={{
                    padding: tokens.spacing.xs,
                  }}
                >
                  <Feather name="x" size={24} color={colors.textPrimary} />
                </Pressable>
              </View>

              {/* Search Bar */}
              <View
                style={{
                  marginBottom: tokens.spacing.md,
                }}
              >
                <TextInput
                  style={{
                    backgroundColor: colors.overlay,
                    color: colors.textPrimary,
                    borderWidth: tokens.borderWidths.regular,
                    borderColor: colors.border,
                    borderRadius: tokens.radii.sm,
                    padding: tokens.spacing.sm,
                    fontSize: tokens.typography.body,
                    fontFamily: tokens.fontFamilies.regular,
                  }}
                  placeholder="Search icons..."
                  placeholderTextColor={colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                />
              </View>

              {/* Icon Grid */}
              <ScrollView
                style={{
                  maxHeight: 400,
                }}
                contentContainerStyle={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: tokens.spacing.sm,
                }}
              >
                {filteredIcons.map((iconName) => {
                  const isSelected = iconName === value;
                  return (
                    <Pressable
                      key={iconName}
                      onPress={() => {
                        onChange(iconName);
                        setShowPicker(false);
                      }}
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: tokens.radii.sm,
                        borderWidth: 2,
                        borderColor: isSelected ? colors.accent : colors.border,
                        backgroundColor: isSelected
                          ? colors.accent
                          : colors.overlay,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Feather
                        name={iconName as any}
                        size={24}
                        color={
                          isSelected
                            ? colors.accentOnPrimary
                            : colors.textPrimary
                        }
                      />
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}


import { useEffect, useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import createProfileStyles from "@/styles/profileStyles";
import type { AccessibilityPreferences, BaseTextSize } from "@/styles/tokens";
import { useTheme, useThemedStyles } from "@/styles/tokens";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import {
  Alert,
  Clipboard,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { BrandLogo } from "@/components/BrandLogo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useTranslation } from "@/i18n/useTranslation";

const TEXT_SIZE_OPTIONS: {
  value: BaseTextSize;
  label: string;
  description: string;
}[] = [
  {
    value: "extraSmall",
    label: "Extra small",
    description: "Compact text for fitting more content on screen.",
  },
  {
    value: "base",
    label: "Standard",
    description: "Balanced sizes for most readers.",
  },
  {
    value: "large",
    label: "Large",
    description: "A little extra breathing room for text-heavy screens.",
  },
  {
    value: "extraLarge",
    label: "Extra large",
    description: "Maximum legibility when you need the biggest type.",
  },
];

const MOTION_OPTIONS: {
  value: AccessibilityPreferences["motionPreference"];
  labelKey: string;
  descriptionKey: string;
}[] = [
  {
    value: "system",
    labelKey: "profile.motionSystem",
    descriptionKey: "profile.motionSystemDesc",
  },
  {
    value: "reduce",
    labelKey: "profile.motionReduce",
    descriptionKey: "profile.motionReduceDesc",
  },
  {
    value: "standard",
    labelKey: "profile.motionStandard",
    descriptionKey: "profile.motionStandardDesc",
  },
];

type DisplayEntry = {
  label: string;
  value: string;
};

type HouseholdMessage = {
  tone: "info" | "success" | "error";
  text: string;
};

const HIDDEN_USER_FIELDS = new Set(["householdId", "pendingHouseholdId"]);

const sanitizeAllergy = (value: string) => value.trim();

const formatLabel = (key: string) =>
  key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return "—";
  }

  if (typeof value === "number" && Number.isFinite(value) && value > 1e10) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString();
    }
  }

  if (Array.isArray(value) || typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  return String(value);
};

const createEntries = (user: Record<string, unknown> | null | undefined) => {
  if (!user) {
    return [] as DisplayEntry[];
  }

  return Object.entries(user)
    .filter(([key]) => !HIDDEN_USER_FIELDS.has(key))
    .map(([key, value]) => ({
      label: formatLabel(key),
      value: formatValue(value),
    }));
};

export default function ProfileScreen() {
  const user = useQuery(api.users.getCurrentUser);
  const household = useQuery(api.households.getHousehold);
  const ensureHousehold = useMutation(api.households.ensureHousehold);
  const leaveHousehold = useMutation(api.households.leaveHousehold);
  const changeHouseholdCode = useMutation(api.households.changeHouseholdCode);
  const confirmHouseholdMember = useMutation(api.households.confirmHouseholdMember);
  const acknowledgePendingMembers = useMutation(
    api.households.acknowledgePendingMembers
  );
  const addHouseholdChild = useMutation(api.households.addHouseholdChild);
  const updateHouseholdChildMutation = useMutation(
    api.households.updateHouseholdChild
  );
  const removeHouseholdChildMutation = useMutation(
    api.households.removeHouseholdChild
  );
  const updateProfile = useMutation(api.users.updateProfile);
  const { signOut } = useAuthActions();
  const entries = createEntries(user as Record<string, unknown> | null | undefined);
  const styles = useThemedStyles(createProfileStyles);
  const { t } = useTranslation();
  const {
    tokens,
    accessibilityPreferences,
    setAccessibilityPreferences,
    isUpdatingAccessibility,
  } = useTheme();

  const [isEnsuringHousehold, setIsEnsuringHousehold] = useState(false);
  const [isManagingHousehold, setIsManagingHousehold] = useState(false);
  const [desiredCode, setDesiredCode] = useState("");
  const [manageBusy, setManageBusy] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<"idle" | "copied" | "error">("idle");
  const [householdMessage, setHouseholdMessage] = useState<HouseholdMessage | null>(null);
  const [confirmingMember, setConfirmingMember] = useState<Id<"users"> | null>(null);
  const [isPendingModalVisible, setIsPendingModalVisible] = useState(false);
  const [pendingAcknowledgeBusy, setPendingAcknowledgeBusy] = useState(false);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [pendingAllergy, setPendingAllergy] = useState("");
  const [isSavingAllergies, setIsSavingAllergies] = useState(false);
  const [allergyMessage, setAllergyMessage] = useState<HouseholdMessage | null>(null);
  const [newChildName, setNewChildName] = useState("");
  const [newChildAllergyInput, setNewChildAllergyInput] = useState("");
  const [newChildAllergies, setNewChildAllergies] = useState<string[]>([]);
  const [childMessage, setChildMessage] = useState<HouseholdMessage | null>(null);
  const [childActionBusy, setChildActionBusy] = useState(false);
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [editingChildName, setEditingChildName] = useState("");
  const [editingChildAllergies, setEditingChildAllergies] = useState<string[]>([]);
  const [editingChildAllergyInput, setEditingChildAllergyInput] = useState("");

  useEffect(() => {
    if (
      household === undefined ||
      household === null ||
      isEnsuringHousehold ||
      household.status !== "none"
    ) {
      return;
    }

    setIsEnsuringHousehold(true);
    void ensureHousehold()
      .catch((error) => {
        console.error("Failed to ensure household", error);
        setHouseholdMessage({
          tone: "error",
          text: "We couldn’t create your household code. Pull to refresh and try again.",
        });
      })
      .finally(() => {
        setIsEnsuringHousehold(false);
      });
  }, [ensureHousehold, household, isEnsuringHousehold]);

  useEffect(() => {
    if (copyFeedback === "idle") {
      return;
    }
    const timeout = setTimeout(() => {
      setCopyFeedback("idle");
    }, 2000);
    return () => clearTimeout(timeout);
  }, [copyFeedback]);

  useEffect(() => {
    if (user === undefined) {
      return;
    }

    if (user && typeof user === "object" && Array.isArray((user as any).allergies)) {
      const nextAllergies = ((user as any).allergies as string[]).map((entry) =>
        sanitizeAllergy(entry)
      );
      setAllergies(nextAllergies);
    } else {
      setAllergies([]);
    }
  }, [user]);

  useEffect(() => {
    if (household?.status !== "member") {
      setIsManagingHousehold(false);
    }
  }, [household?.status]);

  const householdDetails = household?.household ?? null;
  const isHouseholdMember = household?.status === "member" && householdDetails !== null;
  const isHouseholdPending = household?.status === "pending" && householdDetails !== null;
  const confirmedMembers = householdDetails?.members ?? [];
  const pendingMembers = useMemo(
    () => householdDetails?.pendingMembers ?? [],
    [householdDetails]
  );
  const householdChildren = useMemo(
    () => householdDetails?.children ?? [],
    [householdDetails]
  );
  const isHouseholdLoading = household === undefined || isEnsuringHousehold;
  const latestPendingRequestAt =
    pendingMembers.length > 0
      ? Math.max(...pendingMembers.map((member) => member.requestedAt))
      : null;

  useEffect(() => {
    if (!isHouseholdMember || pendingMembers.length === 0) {
      setIsPendingModalVisible(false);
      return;
    }

    const lastSeen =
      user &&
      typeof user === "object" &&
      typeof (user as any).lastPendingApprovalSeenAt === "number"
        ? (user as any).lastPendingApprovalSeenAt
        : 0;

    if (!isPendingModalVisible && latestPendingRequestAt !== null) {
      if (latestPendingRequestAt > lastSeen) {
        setIsPendingModalVisible(true);
      }
    }
  }, [
    isHouseholdMember,
    isPendingModalVisible,
    latestPendingRequestAt,
    pendingMembers,
    user,
  ]);

  useEffect(() => {
    if (!allergyMessage) {
      return;
    }
    const timeout = setTimeout(() => {
      setAllergyMessage(null);
    }, 3000);
    return () => clearTimeout(timeout);
  }, [allergyMessage]);

  useEffect(() => {
    if (!childMessage) {
      return;
    }
    const timeout = setTimeout(() => {
      setChildMessage(null);
    }, 3000);
    return () => clearTimeout(timeout);
  }, [childMessage]);

  useEffect(() => {
    if (!editingChildId) {
      return;
    }

    const currentChild = householdChildren.find((child) => child.id === editingChildId);
    if (!currentChild) {
      setEditingChildId(null);
      setEditingChildName("");
      setEditingChildAllergies([]);
      setEditingChildAllergyInput("");
      return;
    }

    setEditingChildName(currentChild.name);
    setEditingChildAllergies(currentChild.allergies ?? []);
  }, [editingChildId, householdChildren]);

  const handleSelectTextSize = async (value: BaseTextSize) => {
    if (value === accessibilityPreferences.baseTextSize || isUpdatingAccessibility) {
      return;
    }

    try {
      await setAccessibilityPreferences({ baseTextSize: value });
    } catch (error) {
      console.error("Failed to update base text size", error);
      Alert.alert(
        t("profile.somethingWrong"),
        t("profile.errorSaveTextSize")
      );
    }
  };

  const handleToggleDyslexia = async (value: boolean) => {
    if (value === accessibilityPreferences.dyslexiaEnabled || isUpdatingAccessibility) {
      return;
    }

    try {
      await setAccessibilityPreferences({ dyslexiaEnabled: value });
    } catch (error) {
      console.error("Failed to update dyslexia preference", error);
      Alert.alert(
        t("profile.somethingWrong"),
        t("profile.errorSaveFont")
      );
    }
  };

  const handleToggleHighContrast = async (value: boolean) => {
    const isCurrentlyEnabled = accessibilityPreferences.highContrastMode !== "off";

    if (value === isCurrentlyEnabled || isUpdatingAccessibility) {
      return;
    }

    try {
      await setAccessibilityPreferences({
        highContrastMode: value
          ? accessibilityPreferences.highContrastMode === "off"
            ? "dark"
            : accessibilityPreferences.highContrastMode
          : "off",
      });
    } catch (error) {
      console.error("Failed to update high contrast preference", error);
      Alert.alert(
        t("profile.somethingWrong"),
        t("profile.errorSaveHighContrast")
      );
    }
  };

  const handleSelectMotionPreference = async (
    value: AccessibilityPreferences["motionPreference"]
  ) => {
    if (value === accessibilityPreferences.motionPreference || isUpdatingAccessibility) {
      return;
    }

    try {
      await setAccessibilityPreferences({ motionPreference: value });
    } catch (error) {
      console.error("Failed to update motion preference", error);
      Alert.alert(
        t("profile.somethingWrong"),
        t("profile.errorSaveMotion")
      );
    }
  };

  const handleCopyCode = () => {
    if (!householdDetails) {
      return;
    }

    try {
      Clipboard.setString(householdDetails.code);
      setCopyFeedback("copied");
      setHouseholdMessage({
        tone: "success",
        text: "Household code copied to your clipboard.",
      });
    } catch (error) {
      console.error("Failed to copy household code", error);
      setCopyFeedback("error");
      setHouseholdMessage({
        tone: "error",
        text: "We couldn’t copy the code. Please try again.",
      });
    }
  };

  const handleToggleManage = () => {
    if (!isHouseholdMember) {
      return;
    }

    setIsManagingHousehold((current) => !current);
    setHouseholdMessage(null);
    setDesiredCode("");
  };

  const handleDesiredCodeChange = (value: string) => {
    setDesiredCode(value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase());
    setHouseholdMessage(null);
  };

  const handleChangeCode = async () => {
    if (manageBusy || !isHouseholdMember) {
      return;
    }

    try {
      setManageBusy(true);
      const normalized = desiredCode.trim();
      const nextCode = normalized ? normalized.toUpperCase() : undefined;
      await changeHouseholdCode({ desiredCode: nextCode });
      setDesiredCode("");
      setHouseholdMessage({
        tone: nextCode ? "success" : "info",
        text: nextCode
          ? "Your household code has been updated."
          : "We generated a fresh code for your household.",
      });
    } catch (error) {
      console.error("Failed to update household code", error);
      setHouseholdMessage({
        tone: "error",
        text:
          error instanceof Error
            ? error.message
            : "We couldn’t update the code. Please try again.",
      });
    } finally {
      setManageBusy(false);
    }
  };

  const handleLeaveHousehold = () => {
    if (manageBusy || !isHouseholdMember) {
      return;
    }

    Alert.alert(
      "Leave household",
      "We’ll move you into a brand-new household with a fresh code. Are you sure you want to leave?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: () => {
            setManageBusy(true);
            void leaveHousehold()
              .then(() => {
                setHouseholdMessage({
                  tone: "info",
                  text: "You’ve left the old household. We created a new code just for you.",
                });
                setIsManagingHousehold(false);
                setDesiredCode("");
              })
              .catch((error) => {
                console.error("Failed to leave household", error);
                Alert.alert(
                  "Couldn’t leave household",
                  "We ran into an issue creating your new code. Please try again."
                );
              })
              .finally(() => {
                setManageBusy(false);
              });
          },
        },
      ]
    );
  };

  const handleConfirmMember = (memberId: Id<"users">) => {
    if (!isHouseholdMember || confirmingMember !== null) {
      return;
    }

    setConfirmingMember(memberId);
    void confirmHouseholdMember({ userId: memberId })
      .then(() => {
        setHouseholdMessage({
          tone: "success",
          text: "Household member confirmed.",
        });
      })
      .catch((error) => {
        console.error("Failed to confirm household member", error);
        Alert.alert(
          "Couldn’t confirm member",
          "We couldn’t approve this person right now. Please try again."
        );
      })
      .finally(() => {
        setConfirmingMember(null);
      });
  };

  const handleAddAllergy = () => {
    const sanitized = sanitizeAllergy(pendingAllergy);
    if (!sanitized) {
      return;
    }

    setAllergies((current) => {
      if (current.includes(sanitized)) {
        return current;
      }
      return [...current, sanitized];
    });
    setPendingAllergy("");
    setAllergyMessage(null);
  };

  const handleRemoveAllergy = (value: string) => {
    setAllergies((current) => current.filter((item) => item !== value));
    setAllergyMessage(null);
  };

  const handleSaveAllergies = async () => {
    if (isSavingAllergies) {
      return;
    }

    try {
      setIsSavingAllergies(true);
      await updateProfile({ allergies });
      setAllergyMessage({
        tone: "success",
        text: "Allergy list updated for your profile.",
      });
    } catch (error) {
      console.error("Failed to update allergies", error);
      setAllergyMessage({
        tone: "error",
        text: "We couldn’t save your allergies. Please try again.",
      });
    } finally {
      setIsSavingAllergies(false);
    }
  };

  const handleAddNewChildAllergy = () => {
    const sanitized = sanitizeAllergy(newChildAllergyInput);
    if (!sanitized) {
      return;
    }

    setNewChildAllergies((current) => {
      if (current.includes(sanitized)) {
        return current;
      }
      return [...current, sanitized];
    });
    setNewChildAllergyInput("");
    setChildMessage(null);
  };

  const handleRemoveNewChildAllergy = (value: string) => {
    setNewChildAllergies((current) => current.filter((item) => item !== value));
    setChildMessage(null);
  };

  const handleCreateChild = async () => {
    if (!isHouseholdMember || childActionBusy) {
      return;
    }

    const name = newChildName.trim();
    if (!name) {
      setChildMessage({
        tone: "error",
        text: "Enter a name before adding a child.",
      });
      return;
    }

    try {
      setChildActionBusy(true);
      await addHouseholdChild({ name, allergies: newChildAllergies });
      setChildMessage({
        tone: "success",
        text: `${name} has been added to your household.`,
      });
      setNewChildName("");
      setNewChildAllergyInput("");
      setNewChildAllergies([]);
    } catch (error) {
      console.error("Failed to add household child", error);
      setChildMessage({
        tone: "error",
        text: "We couldn’t add that child right now. Please try again.",
      });
    } finally {
      setChildActionBusy(false);
    }
  };

  const handleStartEditingChild = (childId: string) => {
    if (childActionBusy) {
      return;
    }

    if (editingChildId === childId) {
      setEditingChildId(null);
      setEditingChildName("");
      setEditingChildAllergies([]);
      setEditingChildAllergyInput("");
      return;
    }

    const child = householdChildren.find((entry) => entry.id === childId);
    if (!child) {
      return;
    }

    setEditingChildId(childId);
    setEditingChildName(child.name);
    setEditingChildAllergies(child.allergies ?? []);
    setEditingChildAllergyInput("");
    setChildMessage(null);
  };

  const handleAddEditingChildAllergy = () => {
    if (!editingChildId) {
      return;
    }

    const sanitized = sanitizeAllergy(editingChildAllergyInput);
    if (!sanitized) {
      return;
    }

    setEditingChildAllergies((current) => {
      if (current.includes(sanitized)) {
        return current;
      }
      return [...current, sanitized];
    });
    setEditingChildAllergyInput("");
  };

  const handleRemoveEditingChildAllergy = (value: string) => {
    if (!editingChildId) {
      return;
    }

    setEditingChildAllergies((current) => current.filter((item) => item !== value));
  };

  const handleSaveChild = async () => {
    if (!editingChildId || childActionBusy) {
      return;
    }

    const trimmedName = editingChildName.trim();
    if (!trimmedName) {
      setChildMessage({
        tone: "error",
        text: "Enter a name before saving changes.",
      });
      return;
    }

    try {
      setChildActionBusy(true);
      await updateHouseholdChildMutation({
        childId: editingChildId,
        name: trimmedName,
        allergies: editingChildAllergies,
      });
      setChildMessage({
        tone: "success",
        text: `${trimmedName}'s details have been updated.`,
      });
      setEditingChildId(null);
      setEditingChildName("");
      setEditingChildAllergies([]);
      setEditingChildAllergyInput("");
    } catch (error) {
      console.error("Failed to update household child", error);
      setChildMessage({
        tone: "error",
        text: "We couldn’t update those details. Please try again.",
      });
    } finally {
      setChildActionBusy(false);
    }
  };

  const handleDeleteChild = (childId: string, childName: string) => {
    if (childActionBusy) {
      return;
    }

    Alert.alert(
      "Remove child",
      `Remove ${childName} from your household?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            setChildActionBusy(true);
            void removeHouseholdChildMutation({ childId })
              .then(() => {
                setChildMessage({
                  tone: "info",
                  text: `${childName} has been removed from your household.`,
                });
                if (editingChildId === childId) {
                  setEditingChildId(null);
                  setEditingChildName("");
                  setEditingChildAllergies([]);
                  setEditingChildAllergyInput("");
                }
              })
              .catch((error) => {
                console.error("Failed to remove household child", error);
                Alert.alert(
                  "Couldn’t remove child",
                  "We ran into an issue removing this child. Please try again."
                );
              })
              .finally(() => {
                setChildActionBusy(false);
              });
          },
        },
      ]
    );
  };

  const handleAcknowledgePending = async () => {
    if (!isHouseholdMember || latestPendingRequestAt === null || pendingAcknowledgeBusy) {
      setIsPendingModalVisible(false);
      return;
    }

    try {
      setPendingAcknowledgeBusy(true);
      await acknowledgePendingMembers({
        latestSeenRequestAt: latestPendingRequestAt,
      });
    } catch (error) {
      console.error("Failed to acknowledge pending members", error);
      Alert.alert(
        "Couldn’t dismiss requests",
        "We couldn’t mark these requests as reviewed. Please try again."
      );
    } finally {
      setPendingAcknowledgeBusy(false);
      setIsPendingModalVisible(false);
    }
  };

  const handleDismissPendingModal = () => {
    setIsPendingModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Modal
        visible={isPendingModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleDismissPendingModal}
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
                    onPress={() => handleConfirmMember(member.id)}
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
                onPress={handleAcknowledgePending}
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
                onPress={handleDismissPendingModal}
                style={styles.modalSecondaryButton}
                disabled={pendingAcknowledgeBusy}
              >
                <Text style={styles.modalSecondaryButtonText}>Remind me later</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
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
                  onPress={handleCopyCode}
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
                        onPress={() => handleConfirmMember(member.id)}
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
                            onPress={() => handleRemoveAllergy(item)}
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
                      onChangeText={setPendingAllergy}
                      placeholder="Add an allergy"
                      placeholderTextColor={tokens.colors.textMuted}
                      style={[styles.manageInput, styles.inlineInput]}
                      autoCapitalize="words"
                      autoCorrect
                    />
                    <Pressable
                      onPress={handleAddAllergy}
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
                    onPress={handleSaveAllergies}
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
                      allergyMessage.tone === "success"
                        ? styles.householdMessageSuccess
                        : null,
                      allergyMessage.tone === "error" ? styles.householdMessageError : null,
                    ]}
                  >
                    {allergyMessage.text}
                  </Text>
                ) : null}
              </View>
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
                            onPress={() => handleStartEditingChild(child.id)}
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
                                    onPress={() => handleRemoveEditingChildAllergy(item)}
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
                              onChangeText={setEditingChildName}
                              style={styles.manageInput}
                              placeholder="Enter name"
                              placeholderTextColor={tokens.colors.textMuted}
                              editable={!childActionBusy}
                            />
                            <Text style={styles.manageLabel}>Allergies</Text>
                            <View style={styles.inlineInputRow}>
                              <TextInput
                                value={editingChildAllergyInput}
                                onChangeText={setEditingChildAllergyInput}
                                style={[styles.manageInput, styles.inlineInput]}
                                placeholder="Add an allergy"
                                placeholderTextColor={tokens.colors.textMuted}
                                autoCapitalize="words"
                                autoCorrect
                                editable={!childActionBusy}
                              />
                              <Pressable
                                onPress={handleAddEditingChildAllergy}
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
                                onPress={handleSaveChild}
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
                                onPress={() => handleDeleteChild(child.id, child.name)}
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
                    onChangeText={setNewChildName}
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
                            onPress={() => handleRemoveNewChildAllergy(item)}
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
                      onChangeText={setNewChildAllergyInput}
                      placeholder="Add an allergy"
                      placeholderTextColor={tokens.colors.textMuted}
                      style={[styles.manageInput, styles.inlineInput]}
                      autoCapitalize="words"
                      autoCorrect
                      editable={!childActionBusy}
                    />
                    <Pressable
                      onPress={handleAddNewChildAllergy}
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
                    onPress={handleCreateChild}
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
              <Pressable
                onPress={handleToggleManage}
                style={[
                  styles.manageButton,
                  isManagingHousehold ? styles.manageButtonActive : null,
                  (!isHouseholdMember || manageBusy) ? styles.disabledControl : null,
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
                    onChangeText={handleDesiredCodeChange}
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
                      onPress={handleChangeCode}
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
                      onPress={handleLeaveHousehold}
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

        <View style={styles.appearanceCard}>
          <Text style={styles.appearanceTitle}>{t('profile.appearance')}</Text>
          <Text style={styles.appearanceDescription}>
            {t('profile.appearanceDesc')}
          </Text>
          <ThemeSwitcher />
        </View>

        <View style={styles.appearanceCard}>
          <Text style={styles.appearanceTitle}>{t("profile.language")}</Text>
          <Text style={styles.appearanceDescription}>{t("profile.languageDesc")}</Text>
          <LanguageSwitcher />
        </View>

        <View style={styles.accessibilityCard}>
          <Text style={styles.appearanceTitle}>{t('profile.accessibility')}</Text>
          <Text style={styles.accessibilityDescription}>
            {t('profile.accessibilityDesc')}
          </Text>

          <View style={styles.textSizeGroup}>
            <Text style={styles.appearanceDescription}>{t('profile.baseTextSize')}</Text>
            {TEXT_SIZE_OPTIONS.map((option) => {
              const isActive = accessibilityPreferences.baseTextSize === option.value;
              const labelKey = `profile.${option.value}` as const;
              const descKey = `profile.${option.value}Desc` as const;
              return (
                <Pressable
                  key={option.value}
                  style={[
                    styles.textSizeOption,
                    isActive ? styles.textSizeOptionActive : null,
                  ]}
                  onPress={() => void handleSelectTextSize(option.value)}
                  disabled={isUpdatingAccessibility}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isActive }}
                >
                  <Text style={styles.textSizeOptionTitle}>{t(labelKey)}</Text>
                  <Text style={styles.textSizeOptionDescription}>{t(descKey)}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.accessibilityToggle}>
            <View style={styles.accessibilityToggleRow}>
              <Text style={styles.accessibilityToggleText}>{t('profile.highContrast')}</Text>
              <Switch
                value={accessibilityPreferences.highContrastMode !== "off"}
                onValueChange={(value: boolean) => void handleToggleHighContrast(value)}
                disabled={isUpdatingAccessibility}
                thumbColor={
                  accessibilityPreferences.highContrastMode !== "off"
                    ? tokens.colors.accentOnPrimary
                    : tokens.colors.surface
                }
                trackColor={{
                  false: tokens.colors.border,
                  true: tokens.colors.accent,
                }}
              />
            </View>
            <Text style={styles.accessibilityToggleDescription}>
              {t('profile.highContrastDesc')}
            </Text>
          </View>

          <View style={styles.accessibilityToggle}>
            <View style={styles.accessibilityToggleRow}>
              <Text style={styles.accessibilityToggleText}>{t('profile.dyslexiaFont')}</Text>
              <Switch
                value={accessibilityPreferences.dyslexiaEnabled}
                onValueChange={(value: boolean) => void handleToggleDyslexia(value)}
                disabled={isUpdatingAccessibility}
                thumbColor={
                  accessibilityPreferences.dyslexiaEnabled
                    ? tokens.colors.accentOnPrimary
                    : tokens.colors.surface
                }
                trackColor={{
                  false: tokens.colors.border,
                  true: tokens.colors.accent,
                }}
              />
            </View>
            <Text style={styles.accessibilityToggleDescription}>
              {t('profile.dyslexiaFontDesc')}
            </Text>
          </View>

          <View style={styles.textSizeGroup}>
            <Text style={styles.appearanceDescription}>{t('profile.motionPreference')}</Text>
            {MOTION_OPTIONS.map((option) => {
              const isActive = accessibilityPreferences.motionPreference === option.value;
              return (
                <Pressable
                  key={option.value}
                  style={[
                    styles.textSizeOption,
                    isActive ? styles.textSizeOptionActive : null,
                  ]}
                  onPress={() => void handleSelectMotionPreference(option.value)}
                  disabled={isUpdatingAccessibility}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isActive }}
                >
                  <Text style={styles.textSizeOptionTitle}>{t(option.labelKey)}</Text>
                  <Text style={styles.textSizeOptionDescription}>
                    {t(option.descriptionKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {isUpdatingAccessibility ? (
            <Text style={styles.accessibilityStatus}>{t('profile.savingPreferences')}</Text>
          ) : null}
        </View>

        {user ? (
          <View style={styles.infoCard}>
            {entries.map(({ label, value }) => (
              <View key={label} style={styles.infoRow}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyStateText}>
            {t('profile.errorLoadProfile')}
          </Text>
        )}

        <Pressable style={styles.logoutButton} onPress={() => void signOut()}>
          <Text style={styles.logoutText}>{t('profile.logOut')}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import createProfileStyles from "@/styles/profileStyles";
import type { AccessibilityPreferences, BaseTextSize } from "@/styles/tokens";
import { useTheme, useThemedStyles } from "@/styles/tokens";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { Alert, Clipboard, Pressable, ScrollView, Text, View, Platform } from "react-native";
import { useTranslation } from "@/i18n/useTranslation";
import { useRouter } from "expo-router";
import { createDisplayEntries } from "@/utils/formatting";
import {
  createEmptyNutritionGoals,
  derivePerMealTargets,
  GOAL_PRESETS,
  mergePresetDefaults,
  sanitizeNumber,
  type NutritionGoals,
  type NutritionMetric,
} from "@/utils/nutritionGoals";
import { AccessibilityCard } from "@/components/profile/AccessibilityCard";
import { AppearanceCard } from "@/components/profile/AppearanceCard";
import { HouseholdCard } from "@/components/profile/HouseholdCard";
import { LanguageCard } from "@/components/profile/LanguageCard";
import { NutritionGoalsCard } from "@/components/profile/NutritionGoalsCard";
import { PendingMembersModal } from "@/components/profile/PendingMembersModal";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileInfoCard } from "@/components/profile/ProfileInfoCard";
import { PrivacyCard } from "@/components/profile/PrivacyCard";
import { DsarCard } from "@/components/profile/DsarCard";
import { LegalCard } from "@/components/profile/LegalCard";
import type {
  HouseholdChild,
  HouseholdDetails,
  HouseholdMember,
  PendingMember,
} from "@/components/profile/types";

type HouseholdMessage = {
  tone: "info" | "success" | "error";
  text: string;
};

const HIDDEN_USER_FIELDS = new Set(["householdId", "pendingHouseholdId"]);

const sanitizeAllergy = (value: string) => value.trim();
const formatNumber = (value: number | null | undefined) =>
  typeof value === "number" && Number.isFinite(value) ? String(value) : "";

type ProfileSectionId =
  | "household"
  | "dietary"
  | "appearance"
  | "privacy"
  | "account";

type ProfileAccordionProps = {
  title: string;
  description?: string;
  expanded: boolean;
  onToggle: () => void;
  styles: ReturnType<typeof createProfileStyles>;
  children: ReactNode;
  accessibilityHint: string;
};

const ProfileAccordion = ({
  title,
  description,
  expanded,
  onToggle,
  styles,
  children,
  accessibilityHint,
}: ProfileAccordionProps) => (
  <View style={styles.accordion}>
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      onPress={onToggle}
    >
      <View style={styles.accordionHeader}>
        <View style={styles.accordionHeaderText}>
          <Text style={styles.accordionTitle}>{title}</Text>
          {description ? (
            <Text style={styles.accordionDescription}>{description}</Text>
          ) : null}
        </View>
        <Text style={styles.accordionIndicator}>{expanded ? "–" : "+"}</Text>
      </View>
    </Pressable>
    {expanded ? <View style={styles.accordionContent}>{children}</View> : null}
  </View>
);

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
  const exportMyData = useMutation(api.dsar.exportMyData);
  const deleteMyAccount = useMutation(api.dsar.deleteMyAccount);
  const router = useRouter();
  const { signOut } = useAuthActions();
  const entries = createDisplayEntries(
    user as Record<string, unknown> | null | undefined,
    HIDDEN_USER_FIELDS,
  );
  const styles = useThemedStyles(createProfileStyles);
  const { t } = useTranslation();
  const {
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
  const [nutritionGoals, setNutritionGoals] = useState<NutritionGoals>(
    createEmptyNutritionGoals()
  );
  const [nutritionTargetsInput, setNutritionTargetsInput] = useState<Record<string, string>>({});
  const [nutritionMessage, setNutritionMessage] = useState<HouseholdMessage | null>(null);
  const [isSavingNutritionGoals, setIsSavingNutritionGoals] = useState(false);
  const [newChildName, setNewChildName] = useState("");
  const [newChildAllergyInput, setNewChildAllergyInput] = useState("");
  const [newChildAllergies, setNewChildAllergies] = useState<string[]>([]);
  const [childMessage, setChildMessage] = useState<HouseholdMessage | null>(null);
  const [childActionBusy, setChildActionBusy] = useState(false);
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [editingChildName, setEditingChildName] = useState("");
  const [editingChildAllergies, setEditingChildAllergies] = useState<string[]>([]);
  const [editingChildAllergyInput, setEditingChildAllergyInput] = useState("");
  const [analyticsOptIn, setAnalyticsOptIn] = useState(false);
  const [sessionReplayOptIn, setSessionReplayOptIn] = useState(false);
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [expandedSections, setExpandedSections] = useState<ProfileSectionId[]>([]);

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

    const storedGoals = (user as { nutritionGoals?: NutritionGoals | null })
      .nutritionGoals;
    if (storedGoals) {
      const mergedGoals = {
        ...createEmptyNutritionGoals(),
        ...storedGoals,
        displayPreferences:
          storedGoals.displayPreferences ?? createEmptyNutritionGoals().displayPreferences,
      };
      setNutritionGoals(mergedGoals);
      setNutritionTargetsInput({
        calories: formatNumber(mergedGoals.targets?.calories),
        protein: formatNumber(mergedGoals.targets?.protein),
        fat: formatNumber(mergedGoals.targets?.fat),
        carbohydrates: formatNumber(mergedGoals.targets?.carbohydrates),
        fiber: formatNumber(mergedGoals.targets?.fiber),
        addedSugar: formatNumber(mergedGoals.targets?.addedSugar),
        saturatedFat: formatNumber(mergedGoals.targets?.saturatedFat),
        sodium: formatNumber(mergedGoals.targets?.sodium),
      });
    } else {
      const defaultGoals = GOAL_PRESETS[0]?.defaults ?? createEmptyNutritionGoals();
      setNutritionGoals(defaultGoals);
      setNutritionTargetsInput({
        calories: formatNumber(defaultGoals.targets?.calories),
        protein: formatNumber(defaultGoals.targets?.protein),
        fat: formatNumber(defaultGoals.targets?.fat),
        carbohydrates: formatNumber(defaultGoals.targets?.carbohydrates),
        fiber: formatNumber(defaultGoals.targets?.fiber),
        addedSugar: formatNumber(defaultGoals.targets?.addedSugar),
        saturatedFat: formatNumber(defaultGoals.targets?.saturatedFat),
        sodium: formatNumber(defaultGoals.targets?.sodium),
      });
    }

    const privacySettings = user as {
      analyticsOptIn?: boolean | null;
      sessionReplayOptIn?: boolean | null;
    } | null;
    setAnalyticsOptIn(Boolean(privacySettings?.analyticsOptIn));
    setSessionReplayOptIn(Boolean(privacySettings?.sessionReplayOptIn));
  }, [user]);

  useEffect(() => {
    if (household?.status !== "member") {
      setIsManagingHousehold(false);
    }
  }, [household?.status]);

  const householdDetails = (household?.household as HouseholdDetails | null) ?? null;
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

  const normalizedNutritionGoals = useMemo((): NutritionGoals => {
    const displayPreferences =
      nutritionGoals.displayPreferences ?? createEmptyNutritionGoals().displayPreferences;
    const trackedMetrics = Array.from(
      new Set(nutritionGoals.trackedMetrics ?? [])
    ) as NutritionMetric[];

    return {
      ...nutritionGoals,
      preset: nutritionGoals.preset ?? null,
      categories: Array.from(new Set(nutritionGoals.categories ?? [])),
      trackedMetrics,
      displayPreferences,
      targets: {
        ...nutritionGoals.targets,
        calories: sanitizeNumber(nutritionTargetsInput.calories),
        protein: sanitizeNumber(nutritionTargetsInput.protein),
        fat: sanitizeNumber(nutritionTargetsInput.fat),
        carbohydrates: sanitizeNumber(nutritionTargetsInput.carbohydrates),
        fiber: trackedMetrics.includes("fiber")
          ? sanitizeNumber(nutritionTargetsInput.fiber)
          : undefined,
        addedSugar: trackedMetrics.includes("addedSugar")
          ? sanitizeNumber(nutritionTargetsInput.addedSugar)
          : undefined,
        saturatedFat: trackedMetrics.includes("saturatedFat")
          ? sanitizeNumber(nutritionTargetsInput.saturatedFat)
          : undefined,
        sodium: trackedMetrics.includes("sodium")
          ? sanitizeNumber(nutritionTargetsInput.sodium)
          : undefined,
      },
    };
  }, [nutritionGoals, nutritionTargetsInput]);

  const perMealNutritionPreview = useMemo(
    () =>
      derivePerMealTargets(
        normalizedNutritionGoals.targets,
        normalizedNutritionGoals.displayPreferences.mealCount
      ),
    [normalizedNutritionGoals]
  );

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
    if (!nutritionMessage) {
      return;
    }

    const timeout = setTimeout(() => {
      setNutritionMessage(null);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [nutritionMessage]);

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
        text: t("profile.householdCodeCopied"),
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
          ? t("profile.householdCodeUpdated")
          : t("profile.householdCodeGenerated"),
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
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("profile.householdLeaveButton"),
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
          text: t("profile.householdMemberConfirmed"),
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
        text: t("profile.allergiesUpdated"),
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

  const updateNutritionTargetsFromGoals = (goals: NutritionGoals) => {
    setNutritionTargetsInput({
      calories: formatNumber(goals.targets?.calories),
      protein: formatNumber(goals.targets?.protein),
      fat: formatNumber(goals.targets?.fat),
      carbohydrates: formatNumber(goals.targets?.carbohydrates),
      fiber: formatNumber(goals.targets?.fiber),
      addedSugar: formatNumber(goals.targets?.addedSugar),
      saturatedFat: formatNumber(goals.targets?.saturatedFat),
      sodium: formatNumber(goals.targets?.sodium),
    });
  };

  const handleSelectNutritionPreset = (presetId: string) => {
    const merged = mergePresetDefaults(presetId, normalizedNutritionGoals);
    setNutritionGoals(merged);
    updateNutritionTargetsFromGoals(merged);
  };

  const handleToggleNutritionCategory = (value: string) => {
    setNutritionGoals((current) => ({
      ...current,
      categories: current.categories.includes(value)
        ? current.categories.filter((entry) => entry !== value)
        : [...current.categories, value],
    }));
  };

  const handleToggleNutritionMetric = (metric: NutritionMetric) => {
    setNutritionGoals((current) => ({
      ...current,
      trackedMetrics: current.trackedMetrics.includes(metric)
        ? current.trackedMetrics.filter((entry) => entry !== metric)
        : [...current.trackedMetrics, metric],
    }));
  };

  const handleNutritionTargetChange = (key: string, value: string) => {
    setNutritionTargetsInput((current) => ({ ...current, [key]: value }));
  };

  const handleNutritionPreferenceToggle = (
    key: keyof NutritionGoals["displayPreferences"],
    value: boolean
  ) => {
    setNutritionGoals((current) => ({
      ...current,
      displayPreferences: {
        ...(current.displayPreferences ?? createEmptyNutritionGoals().displayPreferences),
        [key]: value,
      },
    }));
  };

  const handleNutritionMealCountChange = (value: string) => {
    const parsed = Number.parseInt(value || "0", 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return;
    }

    setNutritionGoals((current) => ({
      ...current,
      displayPreferences: {
        ...(current.displayPreferences ?? createEmptyNutritionGoals().displayPreferences),
        mealCount: parsed,
      },
    }));
  };

  const handleSaveNutritionGoals = async () => {
    if (isSavingNutritionGoals) {
      return;
    }

    try {
      setIsSavingNutritionGoals(true);
      await updateProfile({ nutritionGoals: normalizedNutritionGoals });
      setNutritionMessage({
        tone: "success",
        text: t("profile.nutritionSaveSuccess"),
      });
    } catch (error) {
      console.error("Failed to save nutrition goals", error);
      setNutritionMessage({
        tone: "error",
        text: t("profile.nutritionSaveError"),
      });
    } finally {
      setIsSavingNutritionGoals(false);
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
        text: t("profile.childErrorNameRequired"),
      });
      return;
    }

    try {
      setChildActionBusy(true);
      await addHouseholdChild({ name, allergies: newChildAllergies });
      setChildMessage({
        tone: "success",
        text: t("profile.childAddedSuccess", { name }),
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
        text: t("profile.childErrorNameRequiredSave"),
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
        text: t("profile.childUpdatedSuccess", { name: trimmedName }),
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
      t("profile.childRemoveTitle"),
      t("profile.childRemoveMessage", { name: childName }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("profile.childRemoveButton"),
          style: "destructive",
          onPress: () => {
            setChildActionBusy(true);
            void removeHouseholdChildMutation({ childId })
              .then(() => {
                setChildMessage({
                  tone: "info",
                  text: t("profile.childRemovedSuccess", { name: childName }),
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

  const handlePrivacyUpdate = async (
    nextAnalyticsOptIn: boolean,
    nextSessionReplayOptIn: boolean
  ) => {
    setAnalyticsOptIn(nextAnalyticsOptIn);
    setSessionReplayOptIn(nextSessionReplayOptIn);

    try {
      setIsSavingPrivacy(true);
      await updateProfile({
        analyticsOptIn: nextAnalyticsOptIn,
        sessionReplayOptIn: nextSessionReplayOptIn,
      });
    } catch (error) {
      console.error("Failed to update privacy preferences", error);
      Alert.alert(t("profile.somethingWrong"), t("profile.errorSavePrivacy"));
      setAnalyticsOptIn(Boolean((user as any)?.analyticsOptIn));
      setSessionReplayOptIn(Boolean((user as any)?.sessionReplayOptIn));
    } finally {
      setIsSavingPrivacy(false);
    }
  };

  const handleToggleAnalytics = async (value: boolean) => {
    const nextSessionReplay = value ? sessionReplayOptIn : false;
    await handlePrivacyUpdate(value, nextSessionReplay);
  };

  const handleToggleSessionReplay = async (value: boolean) => {
    const nextAnalytics = value ? true : analyticsOptIn;
    await handlePrivacyUpdate(nextAnalytics, value);
  };

  const handleOpenLegal = (doc: "privacy" | "terms" | "consent") => {
    router.push(`/legal/${doc}`);
  };

  const handleExportData = async () => {
    if (isExporting || isDeletingAccount) {
      return;
    }

    try {
      setIsExporting(true);
      const payload = await exportMyData({});
      const serialized = JSON.stringify(payload, null, 2);

      if (Platform.OS === "web") {
        try {
          const clipboard = typeof navigator !== "undefined" ? navigator.clipboard : undefined;
          if (clipboard?.writeText) {
            await clipboard.writeText(serialized);
          } else {
            Clipboard.setString(serialized);
          }
        } catch {
          Clipboard.setString(serialized);
        }

        try {
          if (typeof document !== "undefined" && typeof URL !== "undefined") {
            const blob = new Blob([serialized], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `haricot-export-${Date.now()}.json`;
            link.click();
            URL.revokeObjectURL(url);
          }
        } catch {
          // Clipboard fallback already handled above.
        }
      } else {
        Clipboard.setString(serialized);
      }

      Alert.alert(t("profile.dsarExportSuccessTitle"), t("profile.dsarExportSuccessMessage"));
    } catch (error) {
      console.error("Failed to export data", error);
      Alert.alert(t("profile.dsarExportErrorTitle"), t("profile.dsarExportErrorMessage"));
    } finally {
      setIsExporting(false);
    }
  };

  const confirmDeleteAccount = async () => {
    if (isDeletingAccount || isExporting) {
      return;
    }

    if (Platform.OS === "web") {
      const confirmed = confirm(t("profile.dsarDeleteConfirmMessage"));
      if (!confirmed) {
        return;
      }
      await handleDeleteAccount();
      return;
    }

    Alert.alert(
      t("profile.dsarDeleteConfirmTitle"),
      t("profile.dsarDeleteConfirmMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () => void handleDeleteAccount(),
        },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeletingAccount(true);
      await deleteMyAccount({});
      Alert.alert(t("profile.dsarDeleteSuccessTitle"), t("profile.dsarDeleteSuccessMessage"));
      await signOut();
    } catch (error) {
      console.error("Failed to delete account", error);
      Alert.alert(t("profile.dsarDeleteErrorTitle"), t("profile.dsarDeleteErrorMessage"));
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleDismissPendingModal = () => {
    setIsPendingModalVisible(false);
  };

  const handleToggleSection = (section: ProfileSectionId) => {
    setExpandedSections((current) =>
      current.includes(section)
        ? current.filter((entry) => entry !== section)
        : [...current, section]
    );
  };

  return (
    <View style={styles.container}>
      <PendingMembersModal
        visible={isPendingModalVisible}
        pendingMembers={pendingMembers as PendingMember[]}
        confirmingMember={confirmingMember}
        pendingAcknowledgeBusy={pendingAcknowledgeBusy}
        onConfirmMember={handleConfirmMember}
        onAcknowledge={handleAcknowledgePending}
        onDismiss={handleDismissPendingModal}
      />
      <ProfileHeader user={user as Record<string, unknown> | null | undefined} />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <ProfileAccordion
          title={t("profile.householdSectionTitle")}
          description={t("profile.householdSectionDesc")}
          expanded={expandedSections.includes("household")}
          onToggle={() => handleToggleSection("household")}
          styles={styles}
          accessibilityHint={expandedSections.includes("household") ? t("profile.accordionCollapseHint") : t("profile.accordionExpandHint")}
        >
          <HouseholdCard
            isHouseholdLoading={isHouseholdLoading}
            household={household}
            householdDetails={householdDetails}
            isHouseholdMember={isHouseholdMember}
            isHouseholdPending={isHouseholdPending}
            confirmedMembers={confirmedMembers as HouseholdMember[]}
            pendingMembers={pendingMembers as PendingMember[]}
            copyFeedback={copyFeedback}
            householdMessage={householdMessage}
            confirmingMember={confirmingMember}
            isManagingHousehold={isManagingHousehold}
            manageBusy={manageBusy}
            desiredCode={desiredCode}
            allergies={allergies}
            pendingAllergy={pendingAllergy}
            isSavingAllergies={isSavingAllergies}
            allergyMessage={allergyMessage}
            householdChildren={householdChildren as HouseholdChild[]}
            newChildName={newChildName}
            newChildAllergyInput={newChildAllergyInput}
            newChildAllergies={newChildAllergies}
            childMessage={childMessage}
            childActionBusy={childActionBusy}
            editingChildId={editingChildId}
            editingChildName={editingChildName}
            editingChildAllergies={editingChildAllergies}
            editingChildAllergyInput={editingChildAllergyInput}
            onCopyCode={handleCopyCode}
            onConfirmMember={handleConfirmMember}
            onToggleManage={handleToggleManage}
            onDesiredCodeChange={handleDesiredCodeChange}
            onChangeCode={handleChangeCode}
            onLeaveHousehold={handleLeaveHousehold}
            onPendingAllergyChange={setPendingAllergy}
            onAddAllergy={handleAddAllergy}
            onRemoveAllergy={handleRemoveAllergy}
            onSaveAllergies={handleSaveAllergies}
            onStartEditingChild={handleStartEditingChild}
            onEditingChildNameChange={setEditingChildName}
            onEditingChildAllergyInputChange={setEditingChildAllergyInput}
            onAddEditingChildAllergy={handleAddEditingChildAllergy}
            onRemoveEditingChildAllergy={handleRemoveEditingChildAllergy}
            onSaveChild={handleSaveChild}
            onDeleteChild={handleDeleteChild}
            onNewChildNameChange={setNewChildName}
            onNewChildAllergyInputChange={setNewChildAllergyInput}
            onAddNewChildAllergy={handleAddNewChildAllergy}
            onRemoveNewChildAllergy={handleRemoveNewChildAllergy}
            onCreateChild={handleCreateChild}
          />
        </ProfileAccordion>

        <ProfileAccordion
          title={t("profile.dietarySectionTitle")}
          description={t("profile.dietarySectionDesc")}
          expanded={expandedSections.includes("dietary")}
          onToggle={() => handleToggleSection("dietary")}
          styles={styles}
          accessibilityHint={expandedSections.includes("dietary") ? t("profile.accordionCollapseHint") : t("profile.accordionExpandHint")}
        >
          <NutritionGoalsCard
            normalizedNutritionGoals={normalizedNutritionGoals}
            nutritionTargetsInput={nutritionTargetsInput}
            perMealNutritionPreview={perMealNutritionPreview}
            isSavingNutritionGoals={isSavingNutritionGoals}
            nutritionMessage={nutritionMessage}
            onSelectPreset={handleSelectNutritionPreset}
            onToggleCategory={handleToggleNutritionCategory}
            onToggleMetric={handleToggleNutritionMetric}
            onTargetChange={handleNutritionTargetChange}
            onPreferenceToggle={handleNutritionPreferenceToggle}
            onMealCountChange={handleNutritionMealCountChange}
            onSaveNutritionGoals={handleSaveNutritionGoals}
          />
        </ProfileAccordion>

        <ProfileAccordion
          title={t("profile.appearanceSectionTitle")}
          description={t("profile.appearanceSectionDesc")}
          expanded={expandedSections.includes("appearance")}
          onToggle={() => handleToggleSection("appearance")}
          styles={styles}
          accessibilityHint={expandedSections.includes("appearance") ? t("profile.accordionCollapseHint") : t("profile.accordionExpandHint")}
        >
          <AppearanceCard />
          <LanguageCard />
          <AccessibilityCard
            accessibilityPreferences={accessibilityPreferences}
            isUpdatingAccessibility={isUpdatingAccessibility}
            onSelectTextSize={handleSelectTextSize}
            onToggleHighContrast={handleToggleHighContrast}
            onToggleDyslexia={handleToggleDyslexia}
            onSelectMotionPreference={handleSelectMotionPreference}
          />
        </ProfileAccordion>

        <ProfileAccordion
          title={t("profile.privacySectionTitle")}
          description={t("profile.privacySectionDesc")}
          expanded={expandedSections.includes("privacy")}
          onToggle={() => handleToggleSection("privacy")}
          styles={styles}
          accessibilityHint={expandedSections.includes("privacy") ? t("profile.accordionCollapseHint") : t("profile.accordionExpandHint")}
        >
          <PrivacyCard
            analyticsOptIn={analyticsOptIn}
            sessionReplayOptIn={sessionReplayOptIn}
            isSaving={isSavingPrivacy}
            onToggleAnalytics={handleToggleAnalytics}
            onToggleSessionReplay={handleToggleSessionReplay}
          />
          <LegalCard onOpenDoc={handleOpenLegal} />
          <DsarCard
            isExporting={isExporting}
            isDeleting={isDeletingAccount}
            onExport={handleExportData}
            onDelete={confirmDeleteAccount}
          />
        </ProfileAccordion>

        <ProfileAccordion
          title={t("profile.accountSectionTitle")}
          description={t("profile.accountSectionDesc")}
          expanded={expandedSections.includes("account")}
          onToggle={() => handleToggleSection("account")}
          styles={styles}
          accessibilityHint={expandedSections.includes("account") ? t("profile.accordionCollapseHint") : t("profile.accordionExpandHint")}
        >
          <ProfileInfoCard entries={entries} hasUser={Boolean(user)} />

        </ProfileAccordion>
        <Pressable style={styles.logoutButton} onPress={() => void signOut()}>
            <Text style={styles.logoutText}>{t("profile.logOut")}</Text>
          </Pressable>
      </ScrollView>
    </View>
  );
}

import { BrandLogo } from "@/components/BrandLogo";
import { useTranslation } from "@/i18n/useTranslation";
import createSignInStyles from "@/styles/signInStyles";
import { useTheme, useThemedStyles } from "@/styles/tokens";
import { clearPendingUserType, savePendingUserType, getPendingUserType } from "@/utils/pendingUserType";
import { useAuthActions } from "@convex-dev/auth/react";
import { useEffect, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import type { UserTypeSelection } from "@/utils/pendingUserType";

export default function SignIn() {
  const [step, setStep] = useState<"signIn" | "codeSent">("signIn");
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [userTypeSelection, setUserTypeSelection] = useState<UserTypeSelection | null>(
    null
  );
  const styles = useThemedStyles(createSignInStyles);
  const { tokens } = useTheme();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const loadPendingUserType = async () => {
      const pendingType = await getPendingUserType();

      if (pendingType) {
        setUserTypeSelection(pendingType);
      }
    };

    void loadPendingUserType();
  }, []);

  const handleUserTypeSelection = async (value: UserTypeSelection) => {
    setUserTypeSelection(value);
    await savePendingUserType(value);
  };

  const handleResetUserTypeSelection = async () => {
    setUserTypeSelection(null);
    await clearPendingUserType();
  };

  const handleSendCode = async () => {
    setSubmitting(true);
    setCode(""); // Clear any existing code
    const formData = new FormData();
    formData.append("email", email.trim().toLowerCase());

    if (userTypeSelection) {
      await savePendingUserType(userTypeSelection);
    } else {
      await clearPendingUserType();
    }

    try {
      await signIn("resend", formData);
      setStep("codeSent");
      setSubmitting(false);
      // Show success feedback for resend
      if (step === "codeSent") {
        Alert.alert(t('auth.codeSentTitle'), t('auth.codeSentMessage'));
      }
    } catch (error) {
      console.error(error);
      Alert.alert(t('auth.errorTitle'), t('auth.errorSendCode'));
      setSubmitting(false);
    }
  };

  const handleVerifyCode = async () => {
    setSubmitting(true);
    const formData = new FormData();
    formData.append("email", email.trim());
    formData.append("code", code.trim());

    try {
      await signIn("resend", formData);
      // If successful, auth state will update and user will be redirected
    } catch (error) {
      console.error("Verification error:", error);
      setSubmitting(false);
      setCode(""); // Clear the code input
      Alert.alert(
        t("auth.invalidCodeTitle"),
        t("auth.invalidCodeMessage"),
        [{ text: t("common.ok") }]
      );
    }
  };

  const languageKey = i18n.language ?? "default";
  const isCreatorMode = userTypeSelection === "creator";
  const isVendorMode = userTypeSelection === "vendor";
  const isSpecialSignUp = isCreatorMode || isVendorMode;

  const content = (
    <View style={styles.wrapper}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoiding}
        keyboardVerticalOffset={tokens.spacing.xl}
      >
        <View style={styles.container}>
          <BrandLogo size={96} />
          {step === "signIn" ? (
            <>
              <Text style={styles.title}>
                {isCreatorMode
                  ? t("auth.signUpCreatorTitle")
                  : isVendorMode
                  ? t("auth.signUpVendorTitle")
                  : t("auth.signInTitle")}
              </Text>
              {isSpecialSignUp && (
                <Text style={styles.subtitle}>
                  {isCreatorMode
                    ? t("auth.signUpCreatorSubtitle")
                    : t("auth.signUpVendorSubtitle")}
                </Text>
              )}
              <TextInput
                key={`email-${languageKey}`}
                style={styles.input}
                placeholder={t('auth.email')}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                placeholderTextColor={tokens.colors.textMuted}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
              <Pressable
                style={[styles.button, submitting && styles.buttonDisabled]}
                onPress={handleSendCode}
                disabled={submitting}
              >
                <Text style={styles.buttonText}>
                  {submitting ? t('auth.sending') : t('auth.sendCode')}
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.title}>{t('auth.enterCode')}</Text>
              <Text style={styles.description}>
                {t('auth.codeSentTo', { email })}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={t('auth.codePlaceholder')}
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
                placeholderTextColor={tokens.colors.textMuted}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
              <Pressable
                style={[styles.button, submitting && styles.buttonDisabled]}
                onPress={handleVerifyCode}
                disabled={submitting || code.length !== 6}
              >
                <Text style={styles.buttonText}>
                  {submitting ? t('auth.verifying') : t('auth.verifyCode')}
                </Text>
              </Pressable>
              <View style={styles.linkContainer}>
                <Pressable onPress={handleSendCode} disabled={submitting}>
                  <Text style={styles.link}>{t('auth.resendCode')}</Text>
                </Pressable>
                <Text style={styles.linkSeparator}>•</Text>
                <Pressable
                  onPress={() => {
                    setStep("signIn");
                    setCode("");
                  }}
                  disabled={submitting}
                >
                  <Text style={styles.link}>{t('auth.changeEmail')}</Text>
                </Pressable>
              </View>
            </>
          )}
          <View style={styles.footerLinks}>
            {isSpecialSignUp ? (
              <Pressable onPress={handleResetUserTypeSelection} disabled={submitting}>
                <Text style={styles.link}>{t('auth.returnToSignIn')}</Text>
              </Pressable>
            ) : (
              <View style={styles.signUpLinks}>
                <Text style={styles.helperText}>{t('auth.partnerSignUpPrompt')}</Text>
                <View style={styles.userTypeLinks}>
                  <Pressable
                    onPress={() => handleUserTypeSelection("creator")}
                    disabled={submitting}
                  >
                    <Text style={styles.link}>{t('auth.signUpCreatorLink')}</Text>
                  </Pressable>
                  <Text style={styles.linkSeparator}>•</Text>
                  <Pressable
                    onPress={() => handleUserTypeSelection("vendor")}
                    disabled={submitting}
                  >
                    <Text style={styles.link}>{t('auth.signUpVendorLink')}</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );

  if (Platform.OS === "web") {
    return content;
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      {content}
    </TouchableWithoutFeedback>
  );
}

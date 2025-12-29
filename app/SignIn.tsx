import { BrandLogo } from "@/components/BrandLogo";
import { useTranslation } from "@/i18n/useTranslation";
import createSignInStyles from "@/styles/signInStyles";
import { useTheme, useThemedStyles } from "@/styles/tokens";
import { clearPendingUserType, savePendingUserType, getPendingUserType } from "@/utils/pendingUserType";
import { useAuthActions } from "@convex-dev/auth/react";
import { useEffect, useRef, useState } from "react";
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
  const CODE_LENGTH = 6;
  const [step, setStep] = useState<"signIn" | "codeSent">("signIn");
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeDigits, setCodeDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const codeInputRefs = useRef<Array<TextInput | null>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [userTypeSelection, setUserTypeSelection] = useState<UserTypeSelection | null>(
    null
  );
  const styles = useThemedStyles(createSignInStyles);
  const { tokens } = useTheme();
  const { t, i18n } = useTranslation();

  const focusInput = (index: number) => {
    const ref = codeInputRefs.current[index];
    if (ref) {
      ref.focus();
    }
  };

  const resetCodeInputs = () => {
    setCodeDigits(Array(CODE_LENGTH).fill(""));
    setCode("");
    focusInput(0);
  };

  useEffect(() => {
    setCode(codeDigits.join(""));
  }, [codeDigits]);

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
    resetCodeInputs();
    const formData = new FormData();
    const cleanEmail = email.trim().toLowerCase();
    formData.append("email", cleanEmail);

    const languageToSend = i18n.language;
    if (languageToSend) {
      formData.append("preferredLanguage", languageToSend);
      // Use a relative URL to avoid SITE_URL validation issues
      // Convex Auth will resolve this relative URL against the configured SITE_URL
      const redirectTo = `/?preferredLanguage=${languageToSend}`;
      formData.append("redirectTo", redirectTo);
    }

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
      console.error("[SignIn] Error during signIn:", error);
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
      resetCodeInputs();
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

  const handleCodeChange = (value: string, index: number) => {
    const sanitized = value.replace(/\D/g, "");

    setCodeDigits((prev) => {
      const next = [...prev];

      if (!sanitized) {
        next[index] = "";
        return next;
      }

      const chars = sanitized.split("").slice(0, CODE_LENGTH - index);
      chars.forEach((char, offset) => {
        next[index + offset] = char;
      });

      return next;
    });

    const nextIndex = index + sanitized.length;
    if (nextIndex < CODE_LENGTH) {
      setTimeout(() => focusInput(nextIndex), 50);
    }
  };

  const handleCodeKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !codeDigits[index] && index > 0) {
      setCodeDigits((prev) => {
        const next = [...prev];
        next[index - 1] = "";
        return next;
      });
      focusInput(index - 1);
    }
  };

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
              <View style={styles.codeInputsRow}>
                {codeDigits.map((digit, index) => (
                  <TextInput
                    key={`code-${languageKey}-${index}`}
                    ref={(ref: any) => {
                      codeInputRefs.current[index] = ref;
                    }}
                    style={styles.codeInput}
                    value={digit}
                    onChangeText={(value: string) => handleCodeChange(value, index)}
                    keyboardType="number-pad"
                    autoFocus={index === 0}
                    inputMode="numeric"
                    placeholderTextColor={tokens.colors.textMuted}
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                    textAlign="center"
                    onKeyPress={({ nativeEvent }: { nativeEvent: { key: string } }) =>
                      handleCodeKeyPress(index, nativeEvent.key)
                    }
                  />
                ))}
              </View>
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
                    resetCodeInputs();
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

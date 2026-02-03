import { api } from "@haricot/convex-client";
import createQrScannerStyles from "@/styles/qrScannerStyles";
import { useThemedStyles, useTokens } from "@/styles/tokens";
import { useMutation } from "convex/react";
import { Stack } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import {
  BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import * as Location from "expo-location";
import { useTranslation } from "@/i18n/useTranslation";

const ROUNDING_FACTOR = 100;

export default function QrScanner() {
  const styles = useThemedStyles(createQrScannerStyles);
  const tokens = useTokens();
  const isFocused = useIsFocused();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [locationPermission, setLocationPermission] =
    useState<Location.PermissionStatus | null>(null);
  const recordScan = useMutation(api.qrEvents.recordScan);
  type RecordScanResponse = Awaited<ReturnType<typeof recordScan>>;
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [lastPayload, setLastPayload] = useState<string | null>(null);
  const [serverResult, setServerResult] = useState<RecordScanResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasCaptured, setHasCaptured] = useState(false);

  const requestPermissions = useCallback(async () => {
    setError(null);
    const cameraResponse = await requestCameraPermission();
    const locationResponse = await Location.requestForegroundPermissionsAsync();
    setLocationPermission(locationResponse.status);

    if (!cameraResponse.granted || locationResponse.status !== "granted") {
      setError(t("qrScanner.permissionsRequired"));
    }
  }, [requestCameraPermission, t]);

  useEffect(() => {
    void requestPermissions();
  }, [requestPermissions]);

  const handleBarcodeScanned = useCallback(
    async (scan: BarcodeScanningResult) => {
      if (isProcessing || hasCaptured) {
        return;
      }
      if (!cameraPermission?.granted) {
        setError(t("qrScanner.cameraRequired"));
        return;
      }
      setIsProcessing(true);
      setHasCaptured(true);
      setError(null);

      try {
        const payload = scan.data;
        setLastPayload(payload);
        await Clipboard.setStringAsync(payload);

        const locationStatus =
          locationPermission === "granted"
            ? locationPermission
            : (await Location.requestForegroundPermissionsAsync()).status;

        setLocationPermission(locationStatus);

        if (locationStatus !== "granted") {
          setError(t("qrScanner.locationRequired"));
          setHasCaptured(false);
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const response = await recordScan({
          payload,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy ?? undefined,
        });

        setServerResult(response);
      } catch (err) {
        setError((err as Error).message ?? t("qrScanner.errorProcessing"));
        setHasCaptured(false);
      } finally {
        setIsProcessing(false);
      }
    },
    [
      cameraPermission?.granted,
      hasCaptured,
      isProcessing,
      locationPermission,
      recordScan,
      t,
    ],
  );

  const resetScanner = () => {
    setHasCaptured(false);
    setServerResult(null);
    setLastPayload(null);
    setError(null);
  };

  const statusMessage = useMemo(() => {
    if (serverResult?.paired) {
      return t("qrScanner.statusPaired");
    }
    if (serverResult) {
      return t("qrScanner.statusWaiting");
    }
    if (hasCaptured) {
      return t("qrScanner.statusProcessing");
    }
    return t("qrScanner.statusIdle");
  }, [hasCaptured, serverResult, t]);

  const cameraActive =
    Boolean(cameraPermission?.granted) && isFocused && locationPermission === "granted";

  return (
    <>
      <Stack.Screen options={{ title: t("qrScanner.title") }} />
      <View style={styles.container}>
        <View style={styles.cameraContainer}>
          {cameraActive ? (
            <CameraView
              style={styles.cameraView}
              facing="back"
              active={cameraActive}
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={hasCaptured ? undefined : handleBarcodeScanned}
            />
          ) : (
            <View style={styles.permissionCard}>
              <Text style={styles.permissionTitle}>{t("qrScanner.permissionTitle")}</Text>
              <Text style={styles.permissionCopy}>
                {t("qrScanner.permissionCopy")}
              </Text>
              <Pressable
                onPress={requestPermissions}
                style={styles.actionButton}
                accessibilityRole="button"
              >
                <Text style={styles.actionButtonText}>{t("qrScanner.permissionButton")}</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <Text style={styles.headline}>{t("qrScanner.headline")}</Text>
          <Text style={styles.body}>{statusMessage}</Text>

          <View style={styles.qrFrame}>
            <View style={styles.qrInner}>
              {isProcessing ? (
                <ActivityIndicator color={tokens.colors.accent} />
              ) : (
                <Text style={styles.body}>{t("qrScanner.framePrompt")}</Text>
              )}
            </View>
          </View>

          <View style={styles.metadata}>
            <Text style={styles.metadataLabel}>{t("qrScanner.lastScannedLabel")}</Text>
            <Text style={styles.metadataValue}>
              {lastPayload ? lastPayload : t("qrScanner.noScansYet")}
            </Text>
          </View>

          {serverResult ? (
            <View style={styles.metadata}>
              <View style={styles.statusPill}>
                <Text style={styles.statusText}>
                  {serverResult.paired
                    ? t("qrScanner.pairedStatus")
                    : t("qrScanner.awaitingMatch")}
                </Text>
              </View>
              {serverResult.proximityMeters ? (
                <Text style={styles.metadataValue}>
                  {t("qrScanner.proximityMeters", {
                    distance:
                      Math.round(serverResult.proximityMeters * ROUNDING_FACTOR) /
                      ROUNDING_FACTOR,
                  })}
                </Text>
              ) : null}
            </View>
          ) : null}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            onPress={resetScanner}
            style={styles.actionButton}
            accessibilityRole="button"
            disabled={isProcessing}
          >
            <Text style={styles.actionButtonText}>
              {isProcessing ? t("qrScanner.resetting") : t("qrScanner.scanAnother")}
            </Text>
          </Pressable>
        </View>
      </View>
    </>
  );
}

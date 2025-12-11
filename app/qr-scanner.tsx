import { api } from "@/convex/_generated/api";
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
      setError("Camera and location access are required to start scanning.");
    }
  }, [requestCameraPermission]);

  useEffect(() => {
    void requestPermissions();
  }, [requestPermissions]);

  const handleBarcodeScanned = useCallback(
    async (scan: BarcodeScanningResult) => {
      if (isProcessing || hasCaptured) {
        return;
      }
      if (!cameraPermission?.granted) {
        setError("Enable camera access to scan codes.");
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
          setError("Location access is needed to validate proximity.");
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
        setError((err as Error).message ?? "Unable to process scan.");
        setHasCaptured(false);
      } finally {
        setIsProcessing(false);
      }
    },
    [cameraPermission?.granted, hasCaptured, isProcessing, locationPermission, recordScan],
  );

  const resetScanner = () => {
    setHasCaptured(false);
    setServerResult(null);
    setLastPayload(null);
    setError(null);
  };

  const statusMessage = useMemo(() => {
    if (serverResult?.paired) {
      return "Both devices confirmed at the same place.";
    }
    if (serverResult) {
      return "Waiting for another phone to scan this QR nearby.";
    }
    if (hasCaptured) {
      return "Processing scan…";
    }
    return "Hold the QR code inside the frame to start.";
  }, [hasCaptured, serverResult]);

  const cameraActive =
    Boolean(cameraPermission?.granted) && isFocused && locationPermission === "granted";

  return (
    <>
      <Stack.Screen options={{ title: "QR scanner" }} />
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
              <Text style={styles.permissionTitle}>Enable camera & location</Text>
              <Text style={styles.permissionCopy}>
                We need both permissions to keep the camera running and confirm that
                devices are in the same place when scanning.
              </Text>
              <Pressable
                onPress={requestPermissions}
                style={styles.actionButton}
                accessibilityRole="button"
              >
                <Text style={styles.actionButtonText}>Grant permissions</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <Text style={styles.headline}>Scan to verify together</Text>
          <Text style={styles.body}>{statusMessage}</Text>

          <View style={styles.qrFrame}>
            <View style={styles.qrInner}>
              {isProcessing ? (
                <ActivityIndicator color={tokens.colors.accent} />
              ) : (
                <Text style={styles.body}>Place the QR in view</Text>
              )}
            </View>
          </View>

          <View style={styles.metadata}>
            <Text style={styles.metadataLabel}>Last scanned</Text>
            <Text style={styles.metadataValue}>
              {lastPayload ? lastPayload : "No scans yet"}
            </Text>
          </View>

          {serverResult ? (
            <View style={styles.metadata}>
              <View style={styles.statusPill}>
                <Text style={styles.statusText}>
                  {serverResult.paired
                    ? "Paired with a nearby device"
                    : "Awaiting a matching scan"}
                </Text>
              </View>
              {serverResult.proximityMeters ? (
                <Text style={styles.metadataValue}>
                  ~
                  {Math.round(serverResult.proximityMeters * ROUNDING_FACTOR) /
                    ROUNDING_FACTOR} m apart
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
              {isProcessing ? "Resetting…" : "Scan another code"}
            </Text>
          </Pressable>
        </View>
      </View>
    </>
  );
}

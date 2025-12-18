import { useAction, useMutation, useQuery } from "convex/react";
import { Stack, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";

import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import createAddTaskStyles from "@/styles/addTaskStyles";
import { useThemedStyles, useTokens } from "@/styles/tokens";
import {
  getSpeechRecognitionModule,
  isSpeechRecognitionAvailable,
  useSpeechRecognitionEvent,
} from "@/utils/nativeSpeechRecognition";

type InventorySuggestion = {
  itemCode: string;
  varietyCode?: string;
  quantity: number;
  note?: string;
};

type CaptureMode = "camera" | "voice" | "text";

const captureModes: {
  key: CaptureMode;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  description: string;
}[] = [
  {
    key: "camera",
    icon: "camera",
    label: "Camera",
    description: "Scan receipts or product labels",
  },
  {
    key: "voice",
    icon: "mic",
    label: "Voice",
    description: "Speak your updates naturally",
  },
  {
    key: "text",
    icon: "edit-3",
    label: "Text",
    description: "Type your updates manually",
  },
];

export default function AddInventoryModal() {
  const router = useRouter();
  const styles = useThemedStyles(createAddTaskStyles);
  const tokens = useTokens();

  const mapSpeechToInventory = useAction(api.inventory.mapSpeechToInventory);
  const applyInventoryUpdates = useMutation(api.inventory.applyInventoryUpdates);
  const foodLibrary = useQuery(api.foodLibrary.listAll, {});

  const [mode, setMode] = useState<CaptureMode>("voice");
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<InventorySuggestion[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [speechReady, setSpeechReady] = useState(isSpeechRecognitionAvailable());
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [manualText, setManualText] = useState("");
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);

  const transcriptRef = useRef<string>("");
  const interimTextRef = useRef<string>("");

  useSpeechRecognitionEvent("result", (event) => {
    if (__DEV__) {
      console.debug("Speech recognition result event:", JSON.stringify(event, null, 2));
    }
    const { results, isFinal } = event;
    
    // Handle different possible event structures
    // results is Array<Array<SpeechResult>> where SpeechResult has transcript
    let text = "";
    if (results && Array.isArray(results) && results.length > 0) {
      const firstResultArray = results[0];
      if (Array.isArray(firstResultArray) && firstResultArray.length > 0) {
        const firstAlternative = firstResultArray[0];
        if (firstAlternative && typeof firstAlternative === "object" && "transcript" in firstAlternative) {
          text = firstAlternative.transcript ?? "";
        } else if (typeof firstAlternative === "string") {
          text = firstAlternative;
        }
      }
    }
    
    if (!text) {
      return; // No text to process
    }
    
    if (isFinal) {
      transcriptRef.current = `${transcriptRef.current}${transcriptRef.current ? " " : ""}${text}`.trim();
      setTranscript(transcriptRef.current);
      interimTextRef.current = "";
      setInterimText("");
    } else {
      // Show interim results
      interimTextRef.current = text;
      setInterimText(text);
    }
  });

  useSpeechRecognitionEvent("error", (event) => {
    console.error("Speech recognition error:", event);
    
    // Handle different error structures
    const errorCode = (event as { code?: number })?.code;
    const errorType = (event as { error?: string })?.error;
    const errorMessage = (event as { message?: string })?.message;
    
    // "no-speech" (code 7) is a normal case - user didn't speak or mic didn't pick up sound
    // Don't show this as an error to the user
    if (errorCode === 7 || errorType === "no-speech") {
      if (__DEV__) {
        console.debug("No speech detected - this is normal");
      }
      setListening(false);
      return;
    }
    
    // For other errors, show a user-friendly message
    if (errorMessage) {
      setError(errorMessage);
    } else if (errorType) {
      setError(`Speech recognition error: ${errorType}`);
    } else {
      setError("Speech recognition encountered an error. Please try again.");
    }
    setListening(false);
  });

  useSpeechRecognitionEvent("end", () => {
    if (__DEV__) {
      console.debug("Speech recognition ended");
    }
    setListening(false);
    // Ensure any final interim text is captured
    if (interimTextRef.current) {
      transcriptRef.current = `${transcriptRef.current}${transcriptRef.current ? " " : ""}${interimTextRef.current}`.trim();
      setTranscript(transcriptRef.current);
      interimTextRef.current = "";
      setInterimText("");
    }
  });

  useEffect(() => {
    const available = isSpeechRecognitionAvailable();
    setSpeechReady(available);

    if (!available) {
      setError("Speech recognition is not configured in this build.");
      return;
    }

    (async () => {
      const module = getSpeechRecognitionModule();
      if (!module) {
        setError("Speech recognition is not configured in this build.");
        setSpeechReady(false);
        return;
      }

      try {
        const permissions = await module.requestPermissionsAsync();
        if (!permissions.granted) {
          setError("Speech permissions are required to capture inventory updates.");
          setSpeechReady(false);
        }
      } catch (requestError) {
        console.warn("Speech permission request failed", requestError);
      }
    })();
  }, []);

  const libraryByCode = useMemo<Map<string, Doc<"foodLibrary">>>(() => {
    if (!foodLibrary) {
      return new Map();
    }
    return new Map<string, Doc<"foodLibrary">>(foodLibrary.map((item) => [item.code, item]));
  }, [foodLibrary]);

  const getDisplayName = (itemCode: string, varietyCode?: string) => {
    const item = libraryByCode.get(itemCode);
    if (!item) {
      return itemCode;
    }

    const itemName =
      item.translations.en?.singular ??
      item.translations.en?.plural ??
      item.name ??
      itemCode;

    if (!varietyCode) {
      return itemName;
    }

    const variety = item.varieties.find((entry) => entry.code === varietyCode);
    if (!variety) {
      return itemName;
    }

    const varietyName = variety.translations.en ?? varietyCode;
    return `${itemName} (${varietyName})`;
  };

  const resetCapture = () => {
    transcriptRef.current = "";
    interimTextRef.current = "";
    setTranscript("");
    setInterimText("");
    setSuggestions([]);
    setWarnings([]);
    setCapturedImages([]);
    setManualText("");
    setError(null);
  };

  const handleStartListening = async () => {
    if (mode !== "voice") {
      setMode("voice");
    }
    if (!speechReady) {
      setError("Speech recognition is not available on this device.");
      return;
    }

    setError(null);
    setSuggestions([]);
    setWarnings([]);
    transcriptRef.current = "";
    interimTextRef.current = "";
    setTranscript("");
    setInterimText("");
    const module = getSpeechRecognitionModule();
    if (!module) {
      setError("Speech recognition is not available on this device.");
      setSpeechReady(false);
      return;
    }

    try {
      await module.start({
        lang: "en-US",
        interimResults: true,
        continuous: true,
        requiresOnDeviceRecognition: Platform.OS === "ios",
      });
      setListening(true);
    } catch (startError) {
      console.error("Failed to start speech recognition", startError);
      setError("Unable to start speech recognition. Please try again.");
    }
  };

  const handleStopListening = async () => {
    const module = getSpeechRecognitionModule();
    if (!module) {
      setListening(false);
      return;
    }

    try {
      await module.stop();
    } catch (stopError) {
      console.warn("Failed to stop speech recognition", stopError);
    }
    setListening(false);
  };

  const handleModeChange = (nextMode: CaptureMode) => {
    setMode(nextMode);
    setError(null);
    if (nextMode !== "voice" && listening) {
      handleStopListening();
    }
  };

  const handleCaptureImage = async () => {
    setError(null);
    setCameraPermissionDenied(false);
    try {
      // Dynamically import ImagePicker to avoid crash if native module isn't available
      const ImagePickerModule = await import("expo-image-picker");
      const ImagePicker = ImagePickerModule.default || ImagePickerModule;
      
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setCameraPermissionDenied(true);
        setError("Camera permission is required to scan receipts or products.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.4,
      });

      if (!result.canceled) {
        const newImages = result.assets.map((asset) => asset.uri);
        setCapturedImages((prev) => [...prev, ...newImages]);
      }
    } catch (cameraError) {
      console.warn("Camera capture failed", cameraError);
      if (cameraError instanceof Error && cameraError.message.includes("native module")) {
        setError("Camera feature requires rebuilding the app. Please rebuild with: npx expo run:ios");
      } else {
        setError("We couldn't open the camera. Please try again.");
      }
    }
  };

  const mockOpenAIProcessing = async ({
    text,
    images,
    activeMode,
  }: {
    text: string;
    images: string[];
    activeMode: CaptureMode;
  }) => {
    await new Promise((resolve) => setTimeout(resolve, 700));
    const sanitizedText = text || (images.length ? `Scanned ${images.length} receipt photo(s).` : "");
    const notes = activeMode === "camera" && !images.length
      ? "Try snapping a clear photo of your receipt or product label."
      : activeMode === "text" && !sanitizedText
        ? "Add a quick note about what you bought."
        : null;

    return {
      transcript: sanitizedText || "No transcript available",
      warnings: notes ? [notes] : [],
    };
  };

  const handleProcessData = async () => {
    const fullTranscript = `${transcriptRef.current}${interimText ? ` ${interimText}` : ""}`.trim();
    const textPayload = [fullTranscript, manualText.trim()].filter(Boolean).join("\n\n");
    const synthesizedTranscript = textPayload || (capturedImages.length ? "Scanned grocery images." : "");

    if (!synthesizedTranscript) {
      setError("Add a recording, a note, or a photo before processing your update.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const aiResult = await mockOpenAIProcessing({
        text: synthesizedTranscript,
        images: capturedImages,
        activeMode: mode,
      });

      const transcriptToProcess = aiResult.transcript || synthesizedTranscript;
      const result = await mapSpeechToInventory({ transcript: transcriptToProcess });
      setSuggestions(result.items);
      setWarnings([...(aiResult.warnings ?? []), ...(result.warnings ?? [])]);
      transcriptRef.current = transcriptToProcess;
      setTranscript(transcriptToProcess);
      setInterimText("");
      if (result.items.length === 0) {
        setError("We couldn’t match any inventory items. Try adding more detail to your capture.");
      }
    } catch (processingError) {
      console.error("Inventory mapping failed", processingError);
      setError("We ran into a problem understanding that update. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleApplyUpdates = async () => {
    if (suggestions.length === 0) {
      setError("Generate inventory suggestions before applying updates.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await applyInventoryUpdates({ updates: suggestions });
      router.back();
    } catch (applyError) {
      console.error("Failed to apply inventory updates", applyError);
      setError("We couldn’t update your inventory. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Stack.Screen
        options={{
          title: "Update Inventory",
          headerBackTitle: "Cancel",
        }}
      />

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.section}>
      
          <Text style={styles.heading}>Capture an update</Text>
          <Text style={styles.helperText}>
            Pick how you want to log your groceries. Toggle between camera, voice, or text to
            capture receipts, talk through your haul, or jot down what you picked up.
          </Text>

          <View style={styles.modeSwitcher}>
            {captureModes.map((option) => {
              const isActive = mode === option.key;
              const iconColor = isActive ? tokens.colors.accent : tokens.colors.textSecondary;
              return (
                <Pressable
                  key={option.key}
                  onPress={() => handleModeChange(option.key)}
                  style={[styles.modeOption, isActive && styles.modeOptionActive]}
                >
                  <View style={styles.modeHeader}>
                    <View style={styles.modeIconBadge}>
                      <Feather
                        name={option.icon}
                        size={18}
                        color={iconColor}
                      />
                    </View>
                    <Text style={[styles.modeLabel, isActive && styles.modeLabelActive]}>
                      {option.label}
                    </Text>
                  </View>
                  <Text style={styles.modeDescription}>{option.description}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {mode === "camera" ? (
          <View style={styles.sectionCard}>
            <Text style={styles.label}>Scan receipts or products</Text>
            <Text style={styles.helperText}>
              Snap receipts or product labels and we’ll prepare the data for inventory updates.
            </Text>

            <Pressable style={styles.micButton} onPress={handleCaptureImage}>
              <Text style={styles.micButtonText}>Open camera</Text>
            </Pressable>

            {cameraPermissionDenied ? (
              <Text style={styles.warningText}>
                We need access to your camera to scan receipts or groceries.
              </Text>
            ) : null}

            {capturedImages.length > 0 ? (
              <View style={styles.gallery}>
                <Text style={styles.label}>Captured images ({capturedImages.length})</Text>
                <ScrollView
                  horizontal
                  contentContainerStyle={styles.galleryRow}
                  showsHorizontalScrollIndicator={false}
                >
                  {capturedImages.map((uri) => (
                    <View key={uri} style={styles.imageFrame}>
                      <Image source={{ uri }} style={styles.capturedImage} />
                    </View>
                  ))}
                </ScrollView>
              </View>
            ) : (
              <Text style={styles.helperText}>
                You haven’t added any photos yet. Take a picture of your receipt or the front of the
                package to capture details.
              </Text>
            )}
          </View>
        ) : null}

        {mode === "voice" ? (
          <View style={styles.sectionCard}>
            <Text style={styles.label}>Capture by voice</Text>
            <Text style={styles.helperText}>
              Speak naturally about what you bought or used up. You’ll see the transcript update
              live as we listen.
            </Text>

            <Pressable
              onPress={listening ? handleStopListening : handleStartListening}
              style={[
                styles.micButton,
                !speechReady && styles.micButtonDisabled,
                listening && styles.micButtonActive,
              ]}
              disabled={!speechReady}
            >
              <Text style={[styles.micButtonText, listening && styles.micButtonTextActive]}>
                {listening ? "Stop Recording" : "Start Recording"}
              </Text>
            </Pressable>

            <Pressable onPress={resetCapture} style={styles.resetButton}>
              <Text style={styles.resetButtonText}>Clear recording</Text>
            </Pressable>
          </View>
        ) : null}

        {mode === "text" ? (
          <View style={styles.sectionCard}>
            <Text style={styles.label}>Write down what you bought</Text>
            <Text style={styles.helperText}>
              Add quick notes about items or quantities. We’ll merge these with anything you say or
              scan.
            </Text>
            <TextInput
              placeholder="Example: 2 cartons of eggs, 1 bag of rice"
              value={manualText}
              onChangeText={setManualText}
              multiline
              style={styles.textArea}
              textAlignVertical="top"
              placeholderTextColor={tokens.colors.textMuted}
            />
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.label}>Transcript & notes</Text>
          <View style={styles.transcriptBox}>
            <Text style={styles.transcriptTitle}>Live transcript</Text>
            <Text style={styles.transcriptText}>{transcript || "Your words will appear here."}</Text>
            {interimText ? <Text style={styles.interimText}>{interimText}</Text> : null}

            {manualText ? (
              <>
                <Text style={styles.transcriptTitle}>Typed notes</Text>
                <Text style={styles.transcriptText}>{manualText}</Text>
              </>
            ) : null}
          </View>
        </View>

        {warnings.length > 0 ? (
          <View style={styles.section}>
            {warnings.map((warning) => (
              <Text key={warning} style={styles.warningText}>
                {warning}
              </Text>
            ))}
          </View>
        ) : null}

        <View style={styles.section}>
          <Pressable
            style={[styles.actionButton, (processing || listening) && styles.actionButtonDisabled]}
            onPress={handleProcessData}
            disabled={processing || listening}
          >
            <Text style={styles.actionButtonText}>
              {processing ? "Processing..." : "[PROCESS DATA]"}
            </Text>
          </Pressable>
        </View>

        {suggestions.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.label}>Suggested updates</Text>
            <View style={styles.suggestionList}>
              {suggestions.map((suggestion) => (
                <View
                  key={`${suggestion.itemCode}-${suggestion.varietyCode ?? "default"}`}
                  style={styles.suggestionCard}
                >
                  <Text style={styles.suggestionTitle}>
                    {getDisplayName(suggestion.itemCode, suggestion.varietyCode)}
                  </Text>
                  <Text style={styles.suggestionMeta}>
                    Code: {suggestion.itemCode}
                    {suggestion.varietyCode ? ` · Variety: ${suggestion.varietyCode}` : ""}
                  </Text>
                  <Text style={styles.suggestionMeta}>Quantity: {suggestion.quantity}</Text>
                  {suggestion.note ? (
                    <Text style={styles.suggestionMeta}>Note: {suggestion.note}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {error ? (
          <View style={styles.section}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.actions}>
        <Pressable
          style={[styles.primaryButton, (submitting || suggestions.length === 0) && styles.primaryButtonDisabled]}
          onPress={handleApplyUpdates}
          disabled={submitting || suggestions.length === 0}
        >
          <Text style={styles.primaryButtonText}>
            {submitting ? "Saving..." : "Apply inventory updates"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

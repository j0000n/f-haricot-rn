import { useAction, useMutation, useQuery } from "convex/react";
import { Stack, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import createAddTaskStyles from "@/styles/addTaskStyles";
import { useThemedStyles } from "@/styles/tokens";
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

export default function AddInventoryModal() {
  const router = useRouter();
  const styles = useThemedStyles(createAddTaskStyles);

  const mapSpeechToInventory = useAction(api.inventory.mapSpeechToInventory);
  const applyInventoryUpdates = useMutation(api.inventory.applyInventoryUpdates);
  const foodLibrary = useQuery(api.foodLibrary.listAll, {});

  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<InventorySuggestion[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [speechReady, setSpeechReady] = useState(isSpeechRecognitionAvailable());

  const transcriptRef = useRef<string>("");

  useSpeechRecognitionEvent("result", (event) => {
    const { results, isFinal } = event;
    const text = results?.[0]?.[0]?.transcript ?? "";
    if (isFinal) {
      transcriptRef.current = `${transcriptRef.current}${transcriptRef.current ? " " : ""}${text}`.trim();
      setTranscript(transcriptRef.current);
      setInterimText("");
    } else {
      setInterimText(text);
    }
  });

  useSpeechRecognitionEvent("error", (event) => {
    if (event && "message" in event && event.message) {
      setError(event.message);
    } else {
      setError("Speech recognition encountered an error.");
    }
    setListening(false);
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
    setTranscript("");
    setInterimText("");
    setSuggestions([]);
    setWarnings([]);
  };

  const handleStartListening = async () => {
    if (!speechReady) {
      setError("Speech recognition is not available on this device.");
      return;
    }

    setError(null);
    setSuggestions([]);
    setWarnings([]);
    transcriptRef.current = "";
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

  const handleProcessTranscript = async () => {
    const fullTranscript = `${transcriptRef.current}${interimText ? ` ${interimText}` : ""}`.trim();
    if (!fullTranscript) {
      setError("Record an update before generating suggestions.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const result = await mapSpeechToInventory({ transcript: fullTranscript });
      setSuggestions(result.items);
      setWarnings(result.warnings ?? []);
      transcriptRef.current = result.transcript;
      setTranscript(result.transcript);
      setInterimText("");
      if (result.items.length === 0) {
        setError("We couldn’t match any inventory items. Try speaking more clearly or include item names.");
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

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.heading}>Capture an update</Text>
          <Text style={styles.helperText}>
            Use your voice to log groceries you brought home or used up. We’ll convert your
            words into inventory updates using Haricot’s food codes.
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
            <Text
              style={[styles.micButtonText, listening && styles.micButtonTextActive]}
            >
              {listening ? "Stop Recording" : "Start Recording"}
            </Text>
          </Pressable>

          <Pressable onPress={resetCapture} style={styles.resetButton}>
            <Text style={styles.resetButtonText}>Clear recording</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Transcript</Text>
          <View style={styles.transcriptBox}>
            <Text style={styles.transcriptText}>{transcript || "Your words will appear here."}</Text>
            {interimText ? (
              <Text style={styles.interimText}>{interimText}</Text>
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
            onPress={handleProcessTranscript}
            disabled={processing || listening}
          >
            <Text style={styles.actionButtonText}>
              {processing ? "Analyzing..." : "Generate suggestions"}
            </Text>
          </Pressable>
        </View>

        {suggestions.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.label}>Suggested updates</Text>
            <View style={styles.suggestionList}>
              {suggestions.map((suggestion) => (
                <View key={`${suggestion.itemCode}-${suggestion.varietyCode ?? "default"}`} style={styles.suggestionCard}>
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


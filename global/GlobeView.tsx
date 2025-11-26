import React, { useCallback, useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { GLOBE_HTML } from "./globeHtml";
import { buildCityMarkers } from "./markerUtils";

export const GlobeView: React.FC = () => {
  const webviewRef = useRef<WebView | null>(null);

  const sendMarkersToGlobe = useCallback(() => {
    const markers = buildCityMarkers();
    const message = JSON.stringify({
      type: "setMarkers",
      payload: markers,
    });

    webviewRef.current?.postMessage(message);
  }, []);

  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "markerClick") {
        // TODO: integrate with navigation or Convex later
        console.log("Marker clicked:", data.payload);
      }
    } catch (e) {
      console.warn("Failed to parse message from WebView", e);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(sendMarkersToGlobe, 800);
    return () => clearTimeout(timeout);
  }, [sendMarkersToGlobe]);

  return (
    <View style={styles.container}>
      <WebView
        ref={(ref) => {
          webviewRef.current = ref;
        }}
        originWhitelist={["*"]}
        source={{ html: GLOBE_HTML }}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        allowUniversalAccessFromFileURLs
        style={styles.webview}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  webview: { flex: 1 },
});

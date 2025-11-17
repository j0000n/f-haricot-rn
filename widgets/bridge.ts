// @ts-expect-error - NativeModules and Platform are runtime values in react-native
import { NativeModules, Platform } from "react-native";

import type { WidgetPayload } from "./types";

interface NativeWidgetBridge {
  setWidgetData(payload: string): Promise<void>;
  reloadAllTimelines?(): Promise<void>;
}

const MODULE_NAMES = ["HaricotWidgetBridge", "HaricotWidgetUpdater"] as const;

type ModuleName = (typeof MODULE_NAMES)[number];

const resolveNativeModule = (): NativeWidgetBridge | undefined => {
  for (const name of MODULE_NAMES) {
    const module = (NativeModules as Record<ModuleName, NativeWidgetBridge | undefined>)[
      name
    ];

    if (module && typeof module.setWidgetData === "function") {
      return module;
    }
  }

  return undefined;
};

const nativeModule = resolveNativeModule();

export const hasNativeWidgetSupport = Boolean(nativeModule);

export const setWidgetData = async (data: WidgetPayload): Promise<void> => {
  const payload = JSON.stringify(data);

  if (!nativeModule) {
    if (__DEV__) {
      console.info(
        "Haricot widgets: native bridge unavailable on",
        Platform.OS,
        "- payload",
        payload,
      );
    }
    return;
  }

  await nativeModule.setWidgetData(payload);

  if (Platform.OS === "ios" && nativeModule.reloadAllTimelines) {
    try {
      await nativeModule.reloadAllTimelines();
    } catch (error) {
      if (__DEV__) {
        console.warn("Haricot widgets: failed to reload timelines", error);
      }
    }
  }
};

import { api } from "@haricot/convex-client";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { useMutation } from "convex/react";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

type CrashContext = {
  isFatal?: boolean;
  source: string;
};

type NormalizedError = {
  name?: string;
  message: string;
  stack?: string;
  cause?: string;
};

const REPORT_DEBOUNCE_MS = 5000;

const normalizeError = (error: unknown): NormalizedError => {
  if (error instanceof Error) {
    const cause =
      typeof error.cause === "string"
        ? error.cause
        : error.cause instanceof Error
        ? error.cause.message
        : undefined;

    return {
      name: error.name,
      message: error.message || "Unknown error",
      stack: error.stack,
      cause,
    };
  }

  if (typeof error === "string") {
    return { message: error };
  }

  if (error && typeof error === "object" && "message" in error) {
    const message =
      typeof (error as { message?: unknown }).message === "string"
        ? (error as { message?: string }).message ?? "Unknown error"
        : "Unknown error";
    return { message };
  }

  return { message: "Unknown error" };
};

const getReleaseChannel = () => {
  const extra = Constants.expoConfig?.extra as
    | {
        releaseChannel?: string;
        eas?: { channel?: string };
      }
    | undefined;

  if (extra?.releaseChannel) {
    return String(extra.releaseChannel);
  }

  if (extra?.eas?.channel) {
    return String(extra.eas.channel);
  }

  return undefined;
};

const getBuildVersion = () => {
  if (Constants.nativeBuildVersion) {
    return String(Constants.nativeBuildVersion);
  }

  const iosBuild = Constants.expoConfig?.ios?.buildNumber;
  if (iosBuild) {
    return String(iosBuild);
  }

  const androidBuild = Constants.expoConfig?.android?.versionCode;
  if (androidBuild) {
    return String(androidBuild);
  }

  return undefined;
};

export const useCrashReporter = () => {
  const recordCrash = useMutation(api.crashReports.record);
  const lastReportAtRef = useRef(0);

  useEffect(() => {
    const reportCrash = (error: unknown, context: CrashContext) => {
      const now = Date.now();
      if (now - lastReportAtRef.current < REPORT_DEBOUNCE_MS) {
        return;
      }
      lastReportAtRef.current = now;

      const normalized = normalizeError(error);
      const appVersion =
        Constants.expoConfig?.version ??
        Constants.nativeAppVersion ??
        undefined;

      void recordCrash({
        ...normalized,
        isFatal: context.isFatal,
        source: context.source,
        platform: Platform.OS,
        platformVersion: String(Platform.Version),
        appVersion,
        buildVersion: getBuildVersion(),
        releaseChannel: getReleaseChannel(),
        deviceName: Device.deviceName ?? undefined,
        deviceModel: Device.modelName ?? undefined,
        deviceManufacturer: Device.manufacturer ?? undefined,
        occurredAt: now,
      }).catch((reportError) => {
        console.warn("Failed to report crash", reportError);
      });
    };

    const errorUtils = (
      globalThis as typeof globalThis & {
        ErrorUtils?: {
          setGlobalHandler: (handler: (error: Error, isFatal?: boolean) => void) => void;
          getGlobalHandler?: () => (error: Error, isFatal?: boolean) => void;
        };
      }
    ).ErrorUtils;

    let previousHandler: ((error: Error, isFatal?: boolean) => void) | undefined;

    if (errorUtils?.setGlobalHandler) {
      previousHandler = errorUtils.getGlobalHandler?.();
      errorUtils.setGlobalHandler((error, isFatal) => {
        reportCrash(error, { isFatal, source: "global" });
        previousHandler?.(error, isFatal);
      });
    }

    if (Platform.OS === "web" && typeof window !== "undefined") {
      const onError = (event: ErrorEvent) => {
        reportCrash(event.error ?? event.message, { source: "window.error" });
      };
      const onRejection = (event: PromiseRejectionEvent) => {
        reportCrash(event.reason, { source: "window.unhandledrejection" });
      };

      window.addEventListener("error", onError);
      window.addEventListener("unhandledrejection", onRejection);

      return () => {
        window.removeEventListener("error", onError);
        window.removeEventListener("unhandledrejection", onRejection);
        if (errorUtils?.setGlobalHandler && previousHandler) {
          errorUtils.setGlobalHandler(previousHandler);
        }
      };
    }

    return () => {
      if (errorUtils?.setGlobalHandler && previousHandler) {
        errorUtils.setGlobalHandler(previousHandler);
      }
    };
  }, [recordCrash]);
};

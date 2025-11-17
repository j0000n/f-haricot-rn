declare module "react-native" {
  interface NativeModulesStatic {
    HaricotWidgetBridge?: {
      setWidgetData(payload: string): Promise<void>;
      reloadAllTimelines?(): Promise<void>;
    };
    HaricotWidgetUpdater?: {
      setWidgetData(payload: string): Promise<void>;
      reloadAllTimelines?(): Promise<void>;
    };
  }
}

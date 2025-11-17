declare module "expo-speech-recognition" {
  import type { EventEmitter } from "expo-modules-core";
  import type { PlatformOSType } from "react-native";

  export type SpeechRecognitionResult = {
    isFinal: boolean;
    results: Array<Array<{ transcript: string; confidence: number }>>;
  };

  export type SpeechRecognitionError = {
    code: string;
    message: string;
  };

  export type SpeechRecognitionEventName =
    | "result"
    | "soundstart"
    | "soundend"
    | "end"
    | "error";

  export type SpeechRecognitionOptions = {
    lang?: string;
    interimResults?: boolean;
    continuous?: boolean;
    maxAlternatives?: number;
    requiresOnDeviceRecognition?: boolean;
  };

  export interface ExpoSpeechRecognitionModuleType {
    start(options?: SpeechRecognitionOptions): Promise<void>;
    stop(): Promise<void>;
    abort(): Promise<void>;
    requestPermissionsAsync(): Promise<{ granted: boolean }>;
    getPermissionsAsync(): Promise<{ granted: boolean }>;
    readonly emitter: EventEmitter;
    readonly platform?: PlatformOSType;
  }

  export const ExpoSpeechRecognitionModule: ExpoSpeechRecognitionModuleType;

  export function useSpeechRecognitionEvent(
    eventName: SpeechRecognitionEventName,
    listener: (event: SpeechRecognitionResult & { error?: SpeechRecognitionError }) => void
  ): void;
}

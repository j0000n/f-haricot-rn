// PlatformOSType is not available in strict mode, using compatible type
type PlatformOSType = "ios" | "android" | "windows" | "macos" | "web";

type SpeechResult = {
  transcript: string;
  confidence?: number;
};

type SpeechRecognitionEvent = {
  results?: Array<Array<SpeechResult>>;
  isFinal?: boolean;
  message?: string;
};

type SpeechRecognitionModule = {
  start(options?: {
    lang?: string;
    interimResults?: boolean;
    continuous?: boolean;
    maxAlternatives?: number;
    requiresOnDeviceRecognition?: boolean;
  }): Promise<void>;
  stop(): Promise<void>;
  abort(): Promise<void>;
  requestPermissionsAsync(): Promise<{ granted: boolean }>;
  getPermissionsAsync(): Promise<{ granted: boolean }>;
  readonly platform?: PlatformOSType;
};

type EventName = "result" | "error" | "end" | "soundstart" | "soundend";

type EventListener = (event: SpeechRecognitionEvent) => void;

type EventHook = (event: EventName, listener: EventListener) => void;

let cachedModule: SpeechRecognitionModule | null = null;
let eventHook: EventHook | null = null;
let attemptedLoad = false;

const loadModule = () => {
  if (attemptedLoad) {
    return;
  }
  attemptedLoad = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const recognition = require("expo-speech-recognition");
    cachedModule = recognition.ExpoSpeechRecognitionModule;
    eventHook = recognition.useSpeechRecognitionEvent;
  } catch (error) {
    cachedModule = null;
    eventHook = null;
  }
};

export const getSpeechRecognitionModule = (): SpeechRecognitionModule | null => {
  loadModule();
  return cachedModule;
};

export const isSpeechRecognitionAvailable = (): boolean => {
  loadModule();
  return cachedModule !== null;
};

export const useSpeechRecognitionEvent = (event: EventName, listener: EventListener) => {
  loadModule();
  if (eventHook) {
    eventHook(event, listener);
  }
};

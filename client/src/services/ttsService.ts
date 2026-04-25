import type { LanguageStyle } from '@/features/assistant/assistantLanguageDetection';

export type ExpoSpeechModule = {
  speak: (
    text: string,
    options?: {
      language?: string;
      rate?: number;
      pitch?: number;
      onDone?: () => void;
      onStopped?: () => void;
      onError?: (error: unknown) => void;
    },
  ) => void;
  stop: () => Promise<void> | void;
  isSpeakingAsync?: () => Promise<boolean>;
  getAvailableVoicesAsync?: () => Promise<Array<{ language?: string }>>;
};

let speechRuntimeOverride: ExpoSpeechModule | null | undefined;

function getSpeechRuntime(): ExpoSpeechModule | null {
  if (speechRuntimeOverride !== undefined) {
    return speechRuntimeOverride;
  }

  try {
    return require('expo-speech') as ExpoSpeechModule;
  } catch {
    return null;
  }
}

export function setSpeechRuntimeForTests(runtime: ExpoSpeechModule | null) {
  speechRuntimeOverride = runtime;
}

export type TTSOptions = {
  language?: string;
  rate?: number;
  pitch?: number;
};

export type SpeakTextResult = {
  spoken: boolean;
  fallbackUsed: boolean;
};

export function getLanguageCode(languageStyle: LanguageStyle): string {
  const map: Record<LanguageStyle, string> = {
    english: 'en-US',
    filipino: 'fil-PH',
    taglish: 'fil-PH',
    bisaya: 'fil-PH',
  };

  return map[languageStyle];
}

function speakOnce(text: string, options: TTSOptions) {
  const speechRuntime = getSpeechRuntime();

  return new Promise<void>((resolve, reject) => {
    speechRuntime?.speak(text, {
      language: options.language,
      rate: options.rate ?? 0.9,
      pitch: options.pitch ?? 1,
      onDone: () => resolve(),
      onStopped: () => resolve(),
      onError: (error) => reject(error),
    });
  });
}

export async function speakText(text: string, options?: TTSOptions): Promise<SpeakTextResult> {
  const speechRuntime = getSpeechRuntime();

  if (!speechRuntime || !text.trim()) {
    return {
      spoken: false,
      fallbackUsed: false,
    };
  }

  const requestedLanguage = options?.language ?? 'en-US';

  try {
    await speakOnce(text, {
      language: requestedLanguage,
      rate: options?.rate,
      pitch: options?.pitch,
    });
    return {
      spoken: true,
      fallbackUsed: false,
    };
  } catch (error) {
    if (requestedLanguage === 'en-US') {
      console.warn('Failed to speak text:', error);
      return {
        spoken: false,
        fallbackUsed: false,
      };
    }

    try {
      await speakOnce(text, {
        language: 'en-US',
        rate: options?.rate,
        pitch: options?.pitch,
      });
      return {
        spoken: true,
        fallbackUsed: true,
      };
    } catch (fallbackError) {
      console.warn('Failed to speak text:', fallbackError);
      return {
        spoken: false,
        fallbackUsed: false,
      };
    }
  }
}

export async function stopSpeaking(): Promise<void> {
  const speechRuntime = getSpeechRuntime();

  try {
    await speechRuntime?.stop?.();
  } catch (error) {
    console.warn('Failed to stop speech:', error);
  }
}

export async function primeTextToSpeech(): Promise<boolean> {
  const speechRuntime = getSpeechRuntime();

  if (!speechRuntime?.getAvailableVoicesAsync) {
    return false;
  }

  try {
    const voices = await speechRuntime.getAvailableVoicesAsync();
    return voices.length > 0;
  } catch (error) {
    console.warn('TTS not available on this device:', error);
    return false;
  }
}

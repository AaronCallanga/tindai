import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getLanguageCode,
  primeTextToSpeech,
  setSpeechRuntimeForTests,
  speakText,
  stopSpeaking,
} from './ttsService';

const speak = vi.fn();
const stop = vi.fn().mockResolvedValue(undefined);
const getAvailableVoicesAsync = vi.fn().mockResolvedValue([{ language: 'en-US' }]);

describe('ttsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setSpeechRuntimeForTests({
      speak,
      stop,
      getAvailableVoicesAsync,
    });
    stop.mockResolvedValue(undefined);
    getAvailableVoicesAsync.mockResolvedValue([{ language: 'en-US' }]);
    speak.mockImplementation((_text: string, options?: { onDone?: () => void }) => {
      options?.onDone?.();
    });
  });

  it('maps supported language styles to speech language codes', () => {
    expect(getLanguageCode('english')).toBe('en-US');
    expect(getLanguageCode('filipino')).toBe('fil-PH');
    expect(getLanguageCode('taglish')).toBe('fil-PH');
    expect(getLanguageCode('bisaya')).toBe('fil-PH');
  });

  it('falls back to english when the requested language fails', async () => {
    speak
      .mockImplementationOnce((_text: string, options?: { onError?: (error: unknown) => void }) => {
        options?.onError?.(new Error('unsupported language'));
      })
      .mockImplementationOnce((_text: string, options?: { onDone?: () => void }) => {
        options?.onDone?.();
      });

    const result = await speakText('Ito ang low stock ngayon.', { language: 'fil-PH' });

    expect(result).toEqual({
      spoken: true,
      fallbackUsed: true,
    });
    expect(speak).toHaveBeenNthCalledWith(
      2,
      'Ito ang low stock ngayon.',
      expect.objectContaining({
        language: 'en-US',
      }),
    );
  });

  it('stops speech safely', async () => {
    await stopSpeaking();

    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('checks whether tts voices are available', async () => {
    await expect(primeTextToSpeech()).resolves.toBe(true);
    expect(getAvailableVoicesAsync).toHaveBeenCalledTimes(1);
  });
});

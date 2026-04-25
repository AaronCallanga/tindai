import { describe, expect, it } from 'vitest';

import { getEnv } from '../config/env';
import { buildTransactionVerificationPrompt } from '../services/gemini-transaction-prompt';
import {
  generateGeminiText,
  validateGeminiTransactionResponse,
} from '../services/gemini.service';

const mockInventory = [
  { name: 'Coke Mismo', aliases: ['coke', 'coke mismo', 'coca cola'] },
  { name: 'Safeguard', aliases: ['safeguard', 'soap'] },
  { name: 'Eggs', aliases: ['itlog', 'eggs'] },
  { name: 'Rice', aliases: ['rice', 'bigas'] },
];

const testCommands = [
  {
    rawText: 'Nakabenta ako ng dalawang Coke Mismo at isang Safeguard.',
    expectedIntent: 'sale',
    expectedItems: 2,
    minConfidence: 0.7,
  },
  {
    rawText: 'Tatlong itlog nabenta.',
    expectedIntent: 'sale',
    expectedItems: 1,
    minConfidence: 0.7,
  },
  {
    rawText: 'Kumuha si Mang Juan ng dalawang Coke Mismo, ilista mo muna.',
    expectedIntent: 'utang',
    expectedItems: 1,
    minConfidence: 0.7,
  },
  {
    rawText: 'Dagdag ng sampung Rice.',
    expectedIntent: 'restock',
    expectedItems: 1,
    minConfidence: 0.7,
  },
  {
    rawText: 'Ano ang low stock ngayon?',
    expectedIntent: 'unknown',
    expectedItems: 0,
    minConfidence: 0,
  },
] as const;

describe('buildTransactionVerificationPrompt', () => {
  it('includes inventory context, local parse, and strict json instructions', () => {
    const prompt = buildTransactionVerificationPrompt({
      rawText: 'Nakabenta ako ng dalawang Coke Mismo.',
      storeInventoryContext: mockInventory,
      localParse: {
        intent: 'sale',
        items: [{ item_name: 'Coke Mismo', quantity_delta: -2 }],
      },
    });

    expect(prompt).toContain('Return ONLY valid JSON');
    expect(prompt).toContain('"Nakabenta ako ng dalawang Coke Mismo."');
    expect(prompt).toContain('"Coke Mismo"');
    expect(prompt).toContain('"quantity_delta": -2');
  });
});

const maybeDescribeLive = process.env.GEMINI_LIVE_TESTS === '1' ? describe : describe.skip;

maybeDescribeLive('Gemini transaction verification prompt (live)', () => {
  it('parses the rehearsed command set with valid json responses', async () => {
    getEnv();

    for (const testCase of testCommands) {
      const prompt = buildTransactionVerificationPrompt({
        rawText: testCase.rawText,
        storeInventoryContext: mockInventory,
        localParse: null,
      });

      const response = await generateGeminiText(prompt);
      expect(response).toBeTruthy();

      const result = validateGeminiTransactionResponse(response!);
      expect(result.intent).toBe(testCase.expectedIntent);
      expect(result.items).toHaveLength(testCase.expectedItems);
      expect(result.confidence).toBeGreaterThanOrEqual(testCase.minConfidence);
    }
  });
});

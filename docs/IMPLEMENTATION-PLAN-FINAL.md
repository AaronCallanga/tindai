# Tindai AI Voice Features - Final Implementation Plan

**Status:** ✅ Grill-me approved with all decisions locked  
**Date:** April 25, 2026  
**Target:** Demo-ready by Hour 16  
**Owner:** Codex (implementation)

---

## Executive Summary

Three interconnected AI voice features to implement:

1. **Gemini Verification for Sync Transactions** — Backend AI verification during cloud sync
2. **Native Text-to-Speech for Assistant Answers** — Client-side TTS playback for business questions
3. **Gemini Prompt for Transaction Verification** — Structured prompt for sales/restock/utang parsing

**All decisions locked. Ready to build.**

---

## Locked Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Gemini confidence threshold | 0.7 | High enough to prevent low-confidence overrides; low enough to catch improvements |
| Correction movement strategy | Apply Gemini + log correction | Transparent audit trail; trusts AI with fallback |
| Prompt complexity | Full context (accuracy over speed) | Enables fuzzy matching; acceptable for demo batch sizes |
| TTS language fallback | Show warning, fall back to English | Transparency; keeps demo flowing |
| Sync error handling | Fall back silently to local parser | Prioritize demo reliability |
| Prompt iteration limit | Max 5 iterations by Hour 8; pivot to rule-based if needed | Protects demo timeline |
| TTS permissions | Request on app launch (onboarding) | Proactive; keeps main flow clean |
| Gemini quota management | Skip health check, rely on fallback | Keep startup fast |
| Demo TTS strategy | Manual "Speak" button; rehearse all 3 questions | User control; showcase versatility |
| Correction movement UI | Log to Supabase only, no UI feedback | Keep app simple for MVP |
| Backup plan | Trust implementation, no feature flags | Show confidence; requires thorough testing |
| Testing priority | End-to-end first | Catch integration issues early |
| Prompt versioning | Keep only latest prompt | Simpler, less technical debt |
| Language detection | Reuse backend logic on client | DRY; consistent behavior |

---

## Feature 1: Gemini Verification for Sync Transactions

### Overview
Backend sends raw text + store inventory context to Gemini for verification during cloud sync. Gemini returns strict JSON with parsed items, confidence, utang detection. Backend validates JSON before applying changes. If Gemini disagrees with local parse, apply Gemini result + log correction movement.

### Implementation Steps

#### Step 1.1: Define Gemini Response Schema
**File:** `server/src/types/gemini.ts` (new)

```typescript
export type GeminiTransactionVerification = {
  intent: 'sale' | 'restock' | 'utang' | 'unknown';
  confidence: number; // 0.0 to 1.0
  items: Array<{
    spoken_name: string;
    matched_item_name: string;
    quantity_delta: number;
  }>;
  credit: {
    is_utang: boolean;
    customer_name?: string;
  };
  notes: string[];
};
```

#### Step 1.2: Build Gemini Prompt Builder
**File:** `server/src/services/gemini-transaction-prompt.ts` (new)

```typescript
import type { GeminiTransactionVerification } from '../types/gemini';

export type InventoryContextItem = {
  name: string;
  aliases: string[];
};

export function buildTransactionVerificationPrompt(params: {
  rawText: string;
  storeInventoryContext: InventoryContextItem[];
  localParse: Record<string, unknown> | null;
}): string {
  const inventoryJson = JSON.stringify(params.storeInventoryContext, null, 2);
  const localParseJson = params.localParse ? JSON.stringify(params.localParse, null, 2) : 'null';

  return `You are a Taglish inventory assistant for sari-sari stores.
Parse the raw spoken command into strict JSON.

Rules:
- Detect quantity from Tagalog, English, or numeric forms
- Match item names against the provided inventory aliases
- Detect sale/restock/utang intent
- Return confidence 0.0–1.0
- If uncertain, use lower confidence and add notes

Inventory context (canonical items and aliases):
${inventoryJson}

Raw text from user:
"${params.rawText}"

Local parser result (for reference, not authoritative):
${localParseJson}

Return ONLY valid JSON matching this exact schema:
{
  "intent": "sale|restock|utang|unknown",
  "confidence": 0.0-1.0,
  "items": [
    {
      "spoken_name": "what user said",
      "matched_item_name": "canonical item name from inventory",
      "quantity_delta": -2
    }
  ],
  "credit": {
    "is_utang": false,
    "customer_name": null
  },
  "notes": []
}`;
}
```

#### Step 1.3: Add JSON Validation
**File:** `server/src/services/gemini.service.ts` (extend existing)

```typescript
import type { GeminiTransactionVerification } from '../types/gemini';

export function validateGeminiTransactionResponse(
  rawResponse: string,
): GeminiTransactionVerification {
  try {
    const parsed = JSON.parse(rawResponse);

    // Validate required fields
    if (!['sale', 'restock', 'utang', 'unknown'].includes(parsed.intent)) {
      throw new Error(`Invalid intent: ${parsed.intent}`);
    }

    if (
      typeof parsed.confidence !== 'number' ||
      parsed.confidence < 0 ||
      parsed.confidence > 1
    ) {
      throw new Error(`Invalid confidence: ${parsed.confidence}`);
    }

    if (!Array.isArray(parsed.items)) {
      throw new Error('Items must be an array');
    }

    if (!parsed.credit || typeof parsed.credit.is_utang !== 'boolean') {
      throw new Error('Invalid credit object');
    }

    // Validate each item
    for (const item of parsed.items) {
      if (typeof item.spoken_name !== 'string' || !item.spoken_name.trim()) {
        throw new Error('Invalid spoken_name');
      }
      if (typeof item.matched_item_name !== 'string' || !item.matched_item_name.trim()) {
        throw new Error('Invalid matched_item_name');
      }
      if (typeof item.quantity_delta !== 'number' || item.quantity_delta === 0) {
        throw new Error('Invalid quantity_delta');
      }
    }

    return parsed as GeminiTransactionVerification;
  } catch (error) {
    throw new Error(
      `Gemini response validation failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
```

#### Step 1.4: Integrate Gemini Call into Sync Model
**File:** `server/src/models/sync.model.ts` (modify `verifyTransactionsForOwner`)

Add imports:
```typescript
import { buildTransactionVerificationPrompt } from '../services/gemini-transaction-prompt';
import { generateGeminiText, validateGeminiTransactionResponse } from '../services/gemini.service';
import { getEnv } from '../config/env';
```

Modify the transaction processing loop:
```typescript
for (const transaction of transactions) {
  try {
    // ... existing idempotency check ...

    // NEW: Call Gemini for verification if API key available
    let geminiResult: GeminiTransactionVerification | null = null;
    let geminiConfidence: number | undefined;
    let geminiVerified = false;

    const env = getEnv();
    if (env.GEMINI_API_KEY && transaction.items.length > 0) {
      try {
        const prompt = buildTransactionVerificationPrompt({
          rawText: transaction.rawText,
          storeInventoryContext: (initialItems ?? []).map((item) => ({
            name: item.name,
            aliases: item.aliases || [item.name],
          })),
          localParse: transaction.localParse,
        });

        const geminiResponse = await generateGeminiText(prompt);
        if (geminiResponse) {
          geminiResult = validateGeminiTransactionResponse(geminiResponse);
          geminiConfidence = geminiResult.confidence;

          // Use Gemini result if confidence >= 0.7
          if (geminiResult.confidence >= 0.7) {
            geminiVerified = true;
            // Replace items with Gemini-verified items
            transaction.items = geminiResult.items.map((item) => ({
              itemName: item.matched_item_name,
              quantityDelta: item.quantity_delta,
              unitPrice: transaction.items[0]?.unitPrice || 0, // Preserve price from local parse
              unit: transaction.items[0]?.unit,
            }));
          }
        }
      } catch (error) {
        console.warn('Gemini verification failed:', error);
        // Fall back to local parse silently
      }
    }

    // ... rest of existing cloud write logic ...

    results.push({
      clientMutationId: transaction.clientMutationId,
      status: 'synced',
      geminiConfidence,
      geminiVerified,
    });
  } catch (error) {
    // ... existing error handling ...
  }
}
```

#### Step 1.5: Update Transaction Response Schema
**File:** `server/src/models/sync.model.ts` (extend `VerifyTransactionResult`)

```typescript
export type VerifyTransactionResult = {
  clientMutationId: string;
  status: 'synced' | 'needs_review' | 'failed';
  reason?: string;
  geminiConfidence?: number;  // NEW: Gemini confidence score (0.0-1.0)
  geminiVerified?: boolean;   // NEW: Whether Gemini result was applied
};
```

### Testing

**Unit tests** (`server/src/tests/sync.test.ts`):
- Test Gemini response validation with valid JSON
- Test validation with malformed JSON (should throw)
- Test confidence threshold (≥0.7 applies Gemini, <0.7 falls back)
- Test fallback when Gemini API fails

**Integration tests**:
- End-to-end sync with mocked Gemini
- Verify response includes `geminiConfidence` and `geminiVerified`

**Demo rehearsal**:
- Test with 5 scripted commands
- Verify Gemini normalizes fuzzy item names
- Verify utang detection works

---

## Feature 2: Native Text-to-Speech for Assistant Answers

### Overview
Client-side TTS playback for business questions. Supports `output_mode: "speech"` or `"text_and_speech"`. Manual "Speak" button for user control. Language detected from question. Works offline (native TTS, not cloud-based).

### Implementation Steps

#### Step 2.1: Add TTS Library to Client
**File:** `client/package.json` (modify dependencies)

```json
{
  "expo-speech": "^14.1.0"
}
```

Run: `npm install` or `pnpm install`

#### Step 2.2: Create TTS Service
**File:** `client/src/services/ttsService.ts` (new)

```typescript
import * as Speech from 'expo-speech';

export type TTSOptions = {
  language?: string;
  rate?: number;
  pitch?: number;
};

export async function speakText(text: string, options?: TTSOptions): Promise<void> {
  try {
    await Speech.speak(text, {
      language: options?.language || 'en-US',
      rate: options?.rate || 0.9,
      pitch: options?.pitch || 1.0,
      onError: (error) => {
        console.warn('TTS error:', error);
      },
    });
  } catch (error) {
    console.warn('Failed to speak text:', error);
    // Silently fail; don't disrupt UI
  }
}

export async function stopSpeaking(): Promise<void> {
  try {
    await Speech.stop();
  } catch (error) {
    console.warn('Failed to stop speech:', error);
  }
}

export function getLanguageCode(
  languageStyle: 'english' | 'filipino' | 'taglish' | 'bisaya',
): string {
  const map = {
    english: 'en-US',
    filipino: 'fil-PH',
    taglish: 'fil-PH',
    bisaya: 'fil-PH',
  };
  return map[languageStyle] || 'en-US';
}
```

#### Step 2.3: Reuse Backend Language Detection on Client
**File:** `client/src/features/assistant/assistantLanguageDetection.ts` (new)

Copy the language detection logic from `server/src/models/assistant.model.ts` (lines 112–135):

```typescript
export type LanguageStyle = 'english' | 'filipino' | 'taglish' | 'bisaya';

export function detectLanguageStyle(question: string): LanguageStyle {
  const normalized = question.toLowerCase();
  const bisayaSignals = ['unsa', 'kinsa', 'pila', 'karon', 'baligya', 'ug ', 'kana'];
  const filipinoSignals = ['ano', 'sino', 'ilan', 'magkano', 'ngayon', 'pinakamabenta', 'dapat', 'restock'];
  const englishSignals = ['what', 'who', 'how much', 'today', 'fast moving', 'top selling', 'restock'];

  const hasBisaya = bisayaSignals.some((term) => normalized.includes(term));
  const hasFilipino = filipinoSignals.some((term) => normalized.includes(term));
  const hasEnglish = englishSignals.some((term) => normalized.includes(term));

  if (hasBisaya) {
    return hasEnglish ? 'taglish' : 'bisaya';
  }

  if (hasFilipino && hasEnglish) {
    return 'taglish';
  }

  if (hasFilipino) {
    return 'filipino';
  }

  return 'english';
}
```

#### Step 2.4: Update Backend to Return Spoken Text
**File:** `server/src/models/assistant.model.ts` (modify `answerAssistantQueryForOwner`)

Find line ~562:
```typescript
spokenText: null,
```

Change to:
```typescript
spokenText: answerText, // Use answer text for TTS playback
```

#### Step 2.5: Wire TTS into Dashboard Screen
**File:** `client/src/screens/tabs/DashboardScreen.tsx` (modify assistant answer handling)

Add imports:
```typescript
import { speakText, stopSpeaking, getLanguageCode } from '@/services/ttsService';
import { detectLanguageStyle } from '@/features/assistant/assistantLanguageDetection';
```

Add handler:
```typescript
const handleAssistantAnswer = async (answer: AssistantQueryResult) => {
  setAssistantAnswer(answer);

  // Determine if TTS should play
  const shouldSpeak =
    answer.outputMode === 'speech' || answer.outputMode === 'text_and_speech';

  if (shouldSpeak && answer.spokenText) {
    const languageStyle = detectLanguageStyle(answer.questionText);
    const languageCode = getLanguageCode(languageStyle);

    try {
      await speakText(answer.spokenText, { language: languageCode });
    } catch (error) {
      console.warn('TTS playback failed:', error);
      // Continue; text is still displayed
    }
  }
};
```

#### Step 2.6: Add TTS Controls to Assistant Answer Card
**File:** `client/src/components/AssistantAnswerCard.tsx` (extend)

Add buttons:
```typescript
<TouchableOpacity onPress={() => speakText(answer.spokenText)}>
  <Text>🔊 Speak Again</Text>
</TouchableOpacity>

<TouchableOpacity onPress={() => stopSpeaking()}>
  <Text>⏹ Stop</Text>
</TouchableOpacity>
```

#### Step 2.7: Request TTS Permissions on Onboarding
**File:** `client/src/screens/onboarding/OnboardingOverlay.tsx` (modify)

Add to onboarding flow:
```typescript
import * as Speech from 'expo-speech';

// In onboarding sequence:
try {
  // Test TTS availability
  await Speech.speak('Tindai is ready', { language: 'en-US' });
  await Speech.stop();
} catch (error) {
  console.warn('TTS not available on this device');
  // Continue; TTS is optional
}
```

### Testing

**Unit tests** (`client/src/services/ttsService.test.ts`):
- Mock `expo-speech`
- Test language code mapping
- Test error handling

**Integration tests**:
- Test TTS on low-end Android device
- Test language detection accuracy
- Test playback stops on new question

**Demo rehearsal**:
- Ask "Ano ang low stock ngayon?" → verify Filipino TTS plays
- Ask "What are top selling items?" → verify English TTS plays
- Ask "Magkano benta ko today?" → verify Filipino TTS plays
- Test "Speak Again" button

---

## Feature 3: Gemini Prompt for Transaction Verification

### Overview
Structured Gemini prompt for Taglish sales commands. Handles multiple items in one sentence. Returns strict JSON with parsed items, confidence, utang detection. Matches spoken names to known inventory aliases. Validates JSON before applying.

**Note:** This feature is largely addressed by Feature 1 (Gemini Verification). The prompt builder in Step 1.2 fulfills PRD section 12 requirements.

### Implementation Steps

#### Step 3.1: Document Prompt Design Decisions
**File:** `docs/ai-prompts/transaction-verification-prompt.md` (new)

```markdown
# Transaction Verification Prompt Design

## Overview
Structured prompt for parsing Taglish sari-sari store inventory commands into strict JSON.

## Design Decisions

### Why Structured Prompt?
- Ensures consistent JSON output
- Prevents Gemini from returning narrative text
- Enables strict validation before cloud writes

### Why Full Inventory Context?
- Enables fuzzy matching (e.g., "Coke" → "Coke Mismo")
- Provides canonical item names
- Improves accuracy for similar-sounding items

### Why Include Local Parse?
- Transparency: Gemini can see what the app already parsed
- Fallback: If Gemini fails, we have local parse as backup
- Debugging: Helps understand disagreements

### Confidence Threshold: 0.7
- ≥0.7: Apply Gemini result (high confidence)
- <0.7: Fall back to local parse (low confidence)
- Balances AI trust vs. user intent preservation

## Example Inputs & Outputs

### Example 1: Simple Sale
**Input:** "Nakabenta ako ng dalawang Coke Mismo at isang Safeguard."
**Expected Output:**
```json
{
  "intent": "sale",
  "confidence": 0.95,
  "items": [
    { "spoken_name": "Coke Mismo", "matched_item_name": "Coke Mismo", "quantity_delta": -2 },
    { "spoken_name": "Safeguard", "matched_item_name": "Safeguard", "quantity_delta": -1 }
  ],
  "credit": { "is_utang": false, "customer_name": null },
  "notes": []
}
```

### Example 2: Utang with Customer Name
**Input:** "Kumuha si Mang Juan ng dalawang Coke Mismo, ilista mo muna."
**Expected Output:**
```json
{
  "intent": "utang",
  "confidence": 0.88,
  "items": [
    { "spoken_name": "Coke Mismo", "matched_item_name": "Coke Mismo", "quantity_delta": -2 }
  ],
  "credit": { "is_utang": true, "customer_name": "Mang Juan" },
  "notes": []
}
```

### Example 3: Fuzzy Item Match
**Input:** "Tatlong itlog nabenta."
**Expected Output:**
```json
{
  "intent": "sale",
  "confidence": 0.92,
  "items": [
    { "spoken_name": "itlog", "matched_item_name": "Eggs", "quantity_delta": -3 }
  ],
  "credit": { "is_utang": false, "customer_name": null },
  "notes": []
}
```

## Edge Cases

### Case 1: Uncertain Item Match
If user says "Coke" but inventory has "Coke Mismo", "Coca-Cola", and "Coke Zero":
- Gemini should pick the most likely match
- Lower confidence (0.75) if ambiguous
- Include note: "Multiple similar items; matched to most common"

### Case 2: No Quantity Specified
If user says "Nabenta ng Coke Mismo" (no quantity):
- Assume 1 unit
- Confidence: 0.70 (lower due to ambiguity)

### Case 3: Question Intent
If user says "Ano ang low stock ngayon?" (question):
- Return intent: "unknown"
- Confidence: 0.0
- Notes: ["This is a question, not an inventory mutation"]

## Iteration Process

1. Test prompt with 5 scripted commands
2. For each failure:
   - Analyze Gemini output
   - Identify issue (e.g., "confidence too low", "wrong item matched")
   - Refine prompt
   - Re-test
3. Max 5 iterations by Hour 8
4. If still failing, pivot to rule-based fallback

## Success Criteria

- ✅ All 5 scripted commands pass with ≥0.7 confidence
- ✅ Fuzzy item matching works (e.g., "Coke" → "Coke Mismo")
- ✅ Utang detection works (customer name extracted)
- ✅ JSON validation never fails
- ✅ Fallback to local parse if Gemini fails
```

#### Step 3.2: Test Prompt with Rehearsed Commands
**File:** `docs/demo/gemini-prompt-test-results.md` (new)

Create a test harness to validate the prompt:

```typescript
// server/src/tests/gemini-prompt.test.ts
import { buildTransactionVerificationPrompt } from '../services/gemini-transaction-prompt';
import { generateGeminiText, validateGeminiTransactionResponse } from '../services/gemini.service';

const testCommands = [
  {
    rawText: 'Nakabenta ako ng dalawang Coke Mismo at isang Safeguard.',
    expectedIntent: 'sale',
    expectedItems: 2,
    expectedConfidence: 0.85, // Minimum acceptable
  },
  {
    rawText: 'Tatlong itlog nabenta.',
    expectedIntent: 'sale',
    expectedItems: 1,
    expectedConfidence: 0.80,
  },
  {
    rawText: 'Kumuha si Mang Juan ng dalawang Coke Mismo, ilista mo muna.',
    expectedIntent: 'utang',
    expectedItems: 1,
    expectedConfidence: 0.80,
  },
  {
    rawText: 'Dagdag ng sampung Rice.',
    expectedIntent: 'restock',
    expectedItems: 1,
    expectedConfidence: 0.80,
  },
  {
    rawText: 'Ano ang low stock ngayon?',
    expectedIntent: 'unknown',
    expectedItems: 0,
    expectedConfidence: 0.0,
  },
];

const mockInventory = [
  { name: 'Coke Mismo', aliases: ['coke', 'coca cola', 'coke mismo'] },
  { name: 'Safeguard', aliases: ['safeguard', 'soap'] },
  { name: 'Eggs', aliases: ['itlog', 'eggs'] },
  { name: 'Rice', aliases: ['rice', 'bigas'] },
];

describe('Gemini Transaction Verification Prompt', () => {
  for (const testCase of testCommands) {
    it(`should parse: "${testCase.rawText}"`, async () => {
      const prompt = buildTransactionVerificationPrompt({
        rawText: testCase.rawText,
        storeInventoryContext: mockInventory,
        localParse: null,
      });

      const response = await generateGeminiText(prompt);
      expect(response).toBeTruthy();

      const result = validateGeminiTransactionResponse(response!);
      expect(result.intent).toBe(testCase.expectedIntent);
      expect(result.items.length).toBe(testCase.expectedItems);
      expect(result.confidence).toBeGreaterThanOrEqual(testCase.expectedConfidence);
    });
  }
});
```

Run tests and document results in `docs/demo/gemini-prompt-test-results.md`:

```markdown
# Gemini Prompt Test Results

## Test Date: [Date]
## Gemini Model: gemini-2.5-flash
## Status: ✅ PASSING / ⚠️ NEEDS WORK

### Test Case 1: Simple Sale
- **Input:** "Nakabenta ako ng dalawang Coke Mismo at isang Safeguard."
- **Expected:** intent=sale, 2 items, confidence≥0.85
- **Actual:** intent=sale, 2 items, confidence=0.95
- **Status:** ✅ PASS

### Test Case 2: Fuzzy Item Match
- **Input:** "Tatlong itlog nabenta."
- **Expected:** intent=sale, 1 item (Eggs), confidence≥0.80
- **Actual:** intent=sale, 1 item (Eggs), confidence=0.92
- **Status:** ✅ PASS

### Test Case 3: Utang with Customer Name
- **Input:** "Kumuha si Mang Juan ng dalawang Coke Mismo, ilista mo muna."
- **Expected:** intent=utang, 1 item, customer_name=Mang Juan, confidence≥0.80
- **Actual:** intent=utang, 1 item, customer_name=Mang Juan, confidence=0.88
- **Status:** ✅ PASS

### Test Case 4: Restock
- **Input:** "Dagdag ng sampung Rice."
- **Expected:** intent=restock, 1 item, confidence≥0.80
- **Actual:** intent=restock, 1 item, confidence=0.85
- **Status:** ✅ PASS

### Test Case 5: Question Intent
- **Input:** "Ano ang low stock ngayon?"
- **Expected:** intent=unknown, 0 items, confidence=0.0
- **Actual:** intent=unknown, 0 items, confidence=0.0
- **Status:** ✅ PASS

## Summary
- **Total Tests:** 5
- **Passed:** 5
- **Failed:** 0
- **Iterations:** 2
- **Ready for Demo:** ✅ YES
```

---

## Demo Script Integration

### Step 7: Online Question (with TTS)

**Current PRD script:**
> "Ano ang low stock ngayon?"

**Enhanced script with TTS:**
1. User asks: "Ano ang low stock ngayon?" (voice or text)
2. App routes as question intent (online required)
3. Backend answers: "Ito ang low stock ngayon: Safeguard (2 pcs)."
4. App displays answer
5. **NEW:** Manual "Speak" button appears
6. User taps "Speak" button
7. Device plays TTS: "Ito ang low stock ngayon. Safeguard, two pieces."
8. User can tap "Speak Again" or "Stop"

**Rehearse all 3 questions:**
1. "Ano ang low stock ngayon?" (Filipino)
2. "Ano ang pinakamabenta today?" (Taglish)
3. "Magkano benta ko today?" (Filipino)

---

## Implementation Timeline

### Phase 1: Foundation (Hours 0–3)
- [ ] Add Gemini response schema (Step 1.1)
- [ ] Build prompt builder (Step 1.2)
- [ ] Add JSON validation (Step 1.3)
- [ ] Add `expo-speech` to client (Step 2.1)

### Phase 2: Backend Integration (Hours 3–6)
- [ ] Integrate Gemini into sync model (Step 1.4)
- [ ] Update response schema (Step 1.5)
- [ ] Create TTS service (Step 2.2)
- [ ] Create language detection (Step 2.3)

### Phase 3: Client Integration (Hours 6–9)
- [ ] Update backend to return spoken text (Step 2.4)
- [ ] Wire TTS into dashboard (Step 2.5)
- [ ] Add TTS controls (Step 2.6)
- [ ] Request TTS permissions on onboarding (Step 2.7)

### Phase 4: Testing & Validation (Hours 9–12)
- [ ] Test Gemini prompt with 5 commands (Step 3.2)
- [ ] Document test results (Step 3.1)
- [ ] Unit tests for all new functions
- [ ] Integration tests end-to-end
- [ ] Fix any bugs

### Phase 5: Demo Rehearsal (Hours 12–16)
- [ ] Test all 5 scripted commands with Gemini verification
- [ ] Test all 3 assistant questions with TTS
- [ ] Test fallbacks (Gemini failure, TTS unavailable)
- [ ] Record backup demo video
- [ ] Polish UI/UX

---

## Success Criteria

### Feature 1: Gemini Verification
- ✅ Gemini called during sync for all transactions
- ✅ JSON validation prevents malformed responses
- ✅ Fallback to local parse if Gemini fails (silent)
- ✅ Correction movements logged for audit trail
- ✅ 5 scripted commands verified with ≥0.7 confidence
- ✅ Response includes `geminiConfidence` and `geminiVerified` fields

### Feature 2: TTS
- ✅ `expo-speech` installed and working
- ✅ TTS plays when `output_mode` includes "speech"
- ✅ Language detected from question (reuses backend logic)
- ✅ TTS works on low-end Android device
- ✅ Graceful fallback if TTS unavailable (show warning, fall back to English)
- ✅ "Speak Again" and "Stop" buttons functional
- ✅ TTS permissions requested on onboarding

### Feature 3: Prompt Design
- ✅ Prompt documented with design rationale
- ✅ 5 scripted commands tested and passing
- ✅ Edge cases identified and handled
- ✅ Prompt can be iterated quickly

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Gemini API timeout during sync | Fall back silently to local parse; log warning |
| Malformed JSON response | Strict validation; fall back to local parse |
| Gemini disagrees with user intent | Preserve original transaction; create correction movement; log for audit trail |
| API quota exceeded | Fall back to local parse; retry on next sync |
| TTS not available on device | Graceful fallback; show warning; continue with text |
| TTS language mismatch | Show warning; fall back to English |
| Prompt needs >5 iterations | Pivot to rule-based fallback by Hour 8 |
| End-to-end integration fails | Disable features individually; revert to current state |

---

## Rollback Plan

If any feature fails during integration:

**Feature 1 (Gemini Verification):**
- Revert `sync.model.ts` changes
- Fall back to direct cloud writes (current behavior)
- Mark as P1 for future iteration

**Feature 2 (TTS):**
- Remove TTS call from dashboard
- Keep text-only display (current behavior)
- Mark as P1 for future iteration

**Feature 3 (Prompt Design):**
- Use simpler rule-based prompt or skip Gemini
- Mark as P1 for future iteration

---

## Code Quality Checklist

Before committing:
- [ ] TypeScript types are strict (no `any`)
- [ ] Error handling is comprehensive
- [ ] Tests cover happy path + edge cases
- [ ] No hardcoded values (use env vars)
- [ ] Comments explain non-obvious logic
- [ ] Follows existing code style
- [ ] No console.log in production code (use console.warn/error)

---

## Sign-Off

**Plan Status:** ✅ APPROVED & LOCKED  
**Grill-me Session:** Complete (15 questions)  
**Ready for Implementation:** YES  
**Owner:** Codex  
**Date:** April 25, 2026

---

## Appendix: File Checklist

### New Files to Create
- [ ] `server/src/types/gemini.ts`
- [ ] `server/src/services/gemini-transaction-prompt.ts`
- [ ] `client/src/services/ttsService.ts`
- [ ] `client/src/features/assistant/assistantLanguageDetection.ts`
- [ ] `docs/ai-prompts/transaction-verification-prompt.md`
- [ ] `docs/demo/gemini-prompt-test-results.md`

### Files to Modify
- [ ] `server/src/services/gemini.service.ts` (add validation function)
- [ ] `server/src/models/sync.model.ts` (integrate Gemini, update response schema)
- [ ] `server/src/models/assistant.model.ts` (return spoken text instead of null)
- [ ] `client/package.json` (add expo-speech)
- [ ] `client/src/screens/tabs/DashboardScreen.tsx` (wire TTS)
- [ ] `client/src/components/AssistantAnswerCard.tsx` (add TTS controls)
- [ ] `client/src/screens/onboarding/OnboardingOverlay.tsx` (request TTS permissions)

### Tests to Create/Update
- [ ] `server/src/tests/sync.test.ts` (Gemini verification tests)
- [ ] `server/src/tests/gemini-prompt.test.ts` (prompt validation tests)
- [ ] `client/src/services/ttsService.test.ts` (TTS service tests)

---

**END OF PLAN**

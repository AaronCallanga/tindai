# Tindai AI Voice Features Implementation Plan

**Date:** April 25, 2026  
**Scope:** Three critical AI voice features for hackathon MVP  
**Target:** Demo-ready by Hour 16 checkpoint

---

## Overview

This plan addresses three interconnected AI voice features that close the gap between the current implementation and the PRD's core promise: **voice-first, AI-verified inventory management with conversational business insights**.

### Features to Implement

1. **Gemini Verification for Sync Transactions (6.8)** — Backend AI verification during cloud sync
2. **Native Text-to-Speech for Assistant Answers (6.13)** — Client-side TTS playback for business questions
3. **Gemini Prompt for Transaction Verification (12)** — Structured prompt design for sales/restock/utang parsing

---

## Feature 1: Gemini Verification for Sync Transactions (6.8)

### Current State
- `/api/v1/verify-transactions` endpoint exists but performs **direct cloud writes** without AI verification
- Transactions marked as `sync_status: 'verified'` but are not actually verified by Gemini
- Local parser output is trusted implicitly; no normalization or fuzzy matching

### Desired State (PRD 6.8)
- Backend sends raw text + store inventory context to Gemini
- Gemini returns strict JSON with:
  - Parsed items with matched names and quantities
  - Confidence score
  - Utang/credit detection
  - Notes on parsing uncertainty
- Backend validates JSON before applying changes
- If Gemini disagrees with local parse, preserve original and create correction movement
- Fallback to local parse if Gemini fails

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

**Rationale:** Matches PRD section 6.8 JSON shape exactly. Enables strict validation before cloud writes.

#### Step 1.2: Build Gemini Prompt Builder
**File:** `server/src/services/gemini-transaction-prompt.ts` (new)

Function signature:
```typescript
export function buildTransactionVerificationPrompt(params: {
  rawText: string;
  storeInventoryContext: Array<{ name: string; aliases: string[] }>;
  localParse: ParserResult | null;
}): string
```

Prompt structure:
```
You are a Taglish inventory assistant for sari-sari stores.
Parse the raw spoken command into strict JSON.

Rules:
- Detect quantity from Tagalog, English, or numeric forms
- Match item names against the provided inventory aliases
- Detect sale/restock/utang intent
- Return confidence 0.0–1.0
- If uncertain, use lower confidence and add notes

Inventory context:
[JSON list of items with aliases]

Raw text: "[user command]"

Local parser result (for reference, not authoritative):
[local parse JSON]

Return ONLY valid JSON matching this schema:
{
  "intent": "sale|restock|utang|unknown",
  "confidence": 0.0-1.0,
  "items": [
    {
      "spoken_name": "what user said",
      "matched_item_name": "canonical item name",
      "quantity_delta": -2
    }
  ],
  "credit": {
    "is_utang": false,
    "customer_name": null
  },
  "notes": []
}
```

**Rationale:** Structured prompt ensures consistent JSON output. Provides inventory context so Gemini can normalize names. References local parse for transparency but doesn't trust it blindly.

#### Step 1.3: Add JSON Validation
**File:** `server/src/services/gemini.service.ts` (extend existing)

Add function:
```typescript
export function validateGeminiTransactionResponse(
  rawResponse: string
): GeminiTransactionVerification {
  try {
    const parsed = JSON.parse(rawResponse);
    
    // Validate required fields
    if (!['sale', 'restock', 'utang', 'unknown'].includes(parsed.intent)) {
      throw new Error('Invalid intent');
    }
    if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 1) {
      throw new Error('Invalid confidence');
    }
    if (!Array.isArray(parsed.items)) {
      throw new Error('Items must be array');
    }
    if (!parsed.credit || typeof parsed.credit.is_utang !== 'boolean') {
      throw new Error('Invalid credit object');
    }
    
    return parsed as GeminiTransactionVerification;
  } catch (error) {
    throw new Error(`Gemini response validation failed: ${error.message}`);
  }
}
```

**Rationale:** Prevents malformed AI responses from corrupting cloud state. Provides clear error messages for debugging.

#### Step 1.4: Integrate Gemini Call into Sync Model
**File:** `server/src/models/sync.model.ts` (modify `verifyTransactionsForOwner`)

Pseudocode:
```typescript
for (const transaction of transactions) {
  // ... existing idempotency check ...
  
  // NEW: Call Gemini for verification
  let geminiResult: GeminiTransactionVerification | null = null;
  try {
    const prompt = buildTransactionVerificationPrompt({
      rawText: transaction.rawText,
      storeInventoryContext: inventoryItems.map(item => ({
        name: item.name,
        aliases: item.aliases || [item.name]
      })),
      localParse: transaction.localParse
    });
    
    const geminiResponse = await generateGeminiText(prompt);
    if (geminiResponse) {
      geminiResult = validateGeminiTransactionResponse(geminiResponse);
    }
  } catch (error) {
    // Log error but don't fail; fall back to local parse
    console.warn('Gemini verification failed:', error);
  }
  
  // Use Gemini result if available and confident, else use local parse
  const itemsToApply = geminiResult && geminiResult.confidence >= 0.7
    ? geminiResult.items
    : transaction.items;
  
  // ... existing cloud write logic using itemsToApply ...
  
  // NEW: If Gemini disagreed, create correction movement
  if (geminiResult && geminiResult.confidence >= 0.7 && hasDisagreement(transaction.items, geminiResult.items)) {
    // Log correction for audit trail
    await logCorrectionMovement(store.id, transaction, geminiResult);
  }
}
```

**Rationale:** Graceful fallback to local parse if Gemini fails. Preserves audit trail of corrections. Confidence threshold (0.7) prevents low-confidence AI from overriding user intent.

#### Step 1.5: Update Transaction Response Schema
**File:** `server/src/models/sync.model.ts` (extend `VerifyTransactionResult`)

Add fields:
```typescript
export type VerifyTransactionResult = {
  clientMutationId: string;
  status: 'synced' | 'needs_review' | 'failed';
  reason?: string;
  geminiConfidence?: number;  // NEW
  geminiVerified?: boolean;   // NEW
  correctionNotes?: string;   // NEW
};
```

**Rationale:** Allows client to display verification confidence and any corrections made.

### Testing Strategy

**Unit tests** (`server/src/tests/sync.test.ts`):
- Mock Gemini response with valid JSON
- Mock Gemini response with malformed JSON (should fall back)
- Mock Gemini timeout (should fall back)
- Test confidence threshold logic (0.7 cutoff)
- Test correction movement creation

**Integration tests**:
- End-to-end sync with real Gemini API (if key available)
- Verify correction movements appear in Supabase

**Demo rehearsal**:
- Test with 5 scripted commands
- Verify Gemini normalizes fuzzy item names
- Verify utang detection works

### Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Gemini API timeout during sync | Fallback to local parse; log warning; retry on next sync |
| Malformed JSON response | Strict validation; fallback to local parse |
| Gemini disagrees with user intent | Preserve original transaction; create correction movement; log for review |
| API quota exceeded | Use deterministic fallback; cache responses; batch requests |

---

## Feature 2: Native Text-to-Speech for Assistant Answers (6.13)

### Current State
- Backend returns `answerText` and `spokenText: null`
- Mobile app displays text only
- No native TTS invocation on client

### Desired State (PRD 6.13)
- App optionally speaks the answer using native device TTS
- Supports `output_mode: "speech"` or `"text_and_speech"`
- Answer is spoken in the same language as the question
- Works offline (native TTS, not cloud-based)

### Implementation Steps

#### Step 2.1: Add TTS Library to Client
**File:** `client/package.json` (modify dependencies)

```json
{
  "expo-speech": "^14.1.0"
}
```

**Rationale:** Native React Native TTS library. Works offline. Supports multiple languages including Filipino.

#### Step 2.2: Create TTS Service
**File:** `client/src/services/ttsService.ts` (new)

```typescript
import * as Speech from 'expo-speech';

export type TTSOptions = {
  language?: string;
  rate?: number;
  pitch?: number;
};

export async function speakText(
  text: string,
  options?: TTSOptions
): Promise<void> {
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

export function getLanguageCode(languageStyle: 'english' | 'filipino' | 'taglish' | 'bisaya'): string {
  const map = {
    english: 'en-US',
    filipino: 'fil-PH',
    taglish: 'fil-PH', // Use Filipino for Taglish
    bisaya: 'fil-PH',  // Use Filipino as fallback for Bisaya
  };
  return map[languageStyle] || 'en-US';
}
```

**Rationale:** Encapsulates TTS logic. Handles errors gracefully. Maps language styles to device TTS codes.

#### Step 2.3: Detect Language from Question
**File:** `client/src/features/assistant/assistantLanguageDetection.ts` (new)

```typescript
export function detectLanguageStyleFromQuestion(
  questionText: string
): 'english' | 'filipino' | 'taglish' | 'bisaya' {
  const normalized = questionText.toLowerCase();
  
  const bisayaSignals = ['unsa', 'kinsa', 'pila', 'karon', 'ug '];
  const filipinoSignals = ['ano', 'sino', 'ilan', 'ngayon', 'pinakamabenta'];
  const englishSignals = ['what', 'who', 'how', 'today', 'fast moving'];
  
  const hasBisaya = bisayaSignals.some(term => normalized.includes(term));
  const hasFilipino = filipinoSignals.some(term => normalized.includes(term));
  const hasEnglish = englishSignals.some(term => normalized.includes(term));
  
  if (hasBisaya) return hasEnglish ? 'taglish' : 'bisaya';
  if (hasFilipino && hasEnglish) return 'taglish';
  if (hasFilipino) return 'filipino';
  return 'english';
}
```

**Rationale:** Ensures TTS language matches user's question language. Improves UX for multilingual users.

#### Step 2.4: Update Backend to Return Spoken Text
**File:** `server/src/models/assistant.model.ts` (modify `answerAssistantQueryForOwner`)

Currently:
```typescript
spokenText: null,
```

Change to:
```typescript
// Generate spoken text from answer text
// For now, use answer text as spoken text
// Could add text normalization (e.g., "PHP 100" → "one hundred pesos") later
spokenText: answerText,
```

**Rationale:** Provides TTS-friendly text. Can be enhanced later with text normalization.

#### Step 2.5: Wire TTS into Dashboard Screen
**File:** `client/src/screens/tabs/DashboardScreen.tsx` (modify assistant answer display)

Pseudocode:
```typescript
const handleAssistantAnswer = async (answer: AssistantQueryResult) => {
  setAssistantAnswer(answer);
  
  // Determine if TTS should play
  const shouldSpeak = answer.outputMode === 'speech' || answer.outputMode === 'text_and_speech';
  
  if (shouldSpeak && answer.spokenText) {
    const languageStyle = detectLanguageStyleFromQuestion(answer.questionText);
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

**Rationale:** Plays TTS based on `output_mode`. Handles failures gracefully. Text remains visible as fallback.

#### Step 2.6: Add TTS Controls (Optional)
**File:** `client/src/components/AssistantAnswerCard.tsx` (extend)

Add buttons:
- **Speak Again** — Replay the answer
- **Stop** — Stop playback

```typescript
<TouchableOpacity onPress={() => speakText(answer.spokenText)}>
  <Text>🔊 Speak Again</Text>
</TouchableOpacity>

<TouchableOpacity onPress={() => stopSpeaking()}>
  <Text>⏹ Stop</Text>
</TouchableOpacity>
```

**Rationale:** Gives users control over playback. Improves accessibility.

### Testing Strategy

**Unit tests** (`client/src/services/ttsService.test.ts`):
- Mock `expo-speech`
- Test language code mapping
- Test error handling

**Integration tests**:
- Test TTS on low-end Android device
- Test language detection accuracy
- Test playback stops on new question

**Demo rehearsal**:
- Ask "Ano ang low stock ngayon?" and verify Filipino TTS plays
- Ask "What are top selling items?" and verify English TTS plays
- Test "Speak Again" button

### Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| TTS not available on device | Graceful fallback to text-only display |
| TTS playback too slow for demo | Pre-test on target device; adjust rate parameter |
| Language detection incorrect | Manual language selection UI (P1 feature) |
| Device audio muted | Display visual indicator; suggest unmute |

---

## Feature 3: Gemini Prompt for Transaction Verification (12)

### Current State
- `gemini.service.ts` exists but only used by assistant endpoint
- No Gemini prompt for transaction parsing/verification
- Sync endpoint has no AI involvement

### Desired State (PRD 12)
- Structured Gemini prompt for Taglish sales commands
- Handles multiple items in one sentence
- Returns strict JSON with parsed items, confidence, utang detection
- Matches spoken names to known inventory aliases
- Validates JSON response before applying

### Implementation Steps

**Note:** This feature is largely addressed by Feature 1 (Gemini Verification). The prompt builder created in Step 1.2 fulfills PRD section 12 requirements.

#### Step 3.1: Document Prompt Design Decisions
**File:** `docs/ai-prompts/transaction-verification-prompt.md` (new)

Document:
- Why structured prompt (ensures JSON output)
- Why inventory context is provided (enables fuzzy matching)
- Why confidence threshold is 0.7 (balances AI trust vs. user intent)
- Example inputs and expected outputs
- Edge cases (e.g., "tatlong itlog" → 3 eggs, even if spelled differently)

**Rationale:** Helps team understand and iterate on prompt design. Enables quick A/B testing.

#### Step 3.2: Test Prompt with Rehearsed Commands
**File:** `docs/demo/gemini-prompt-test-results.md` (new)

Test 5 scripted commands:
1. "Nakabenta ako ng dalawang Coke Mismo at isang Safeguard."
2. "Tatlong itlog nabenta."
3. "Kumuha si Mang Juan ng dalawang Coke Mismo, ilista mo muna."
4. "Dagdag ng sampung Rice."
5. "Ano ang low stock ngayon?" (should return `intent: 'unknown'` or be rejected)

Document results:
- Confidence scores
- Item matching accuracy
- Utang detection accuracy
- Any corrections needed

**Rationale:** Validates prompt effectiveness before demo. Identifies edge cases early.

---

## Integration & Dependencies

### Cross-Feature Dependencies

```
Feature 1 (Gemini Verification)
  ├─ Depends on: gemini.service.ts (existing)
  ├─ Depends on: Supabase schema (existing)
  └─ Enables: Feature 3 (Prompt design)

Feature 2 (TTS)
  ├─ Depends on: expo-speech library
  ├─ Depends on: Assistant endpoint (existing)
  └─ Independent of Features 1 & 3

Feature 3 (Prompt Design)
  ├─ Depends on: Feature 1 (Gemini Verification)
  └─ Enables: Better transaction accuracy
```

### Environment Variables Required

```bash
# Already set (verify in .env):
GEMINI_API_KEY=<your-api-key>
GEMINI_MODEL=gemini-2.5-flash

# New (if needed):
# None required; uses existing setup
```

### Package Dependencies

**Backend:**
- Existing: `@supabase/supabase-js`, `express`, `dotenv`
- New: None (Gemini API called via fetch)

**Client:**
- Existing: `expo`, `react-native`, `@supabase/supabase-js`
- New: `expo-speech` (for TTS)

---

## Implementation Timeline

### Phase 1: Foundation (Hours 0–4)
- [ ] Add Gemini response schema (Step 1.1)
- [ ] Build prompt builder (Step 1.2)
- [ ] Add JSON validation (Step 1.3)
- [ ] Add `expo-speech` to client (Step 2.1)

### Phase 2: Backend Integration (Hours 4–8)
- [ ] Integrate Gemini into sync model (Step 1.4)
- [ ] Update response schema (Step 1.5)
- [ ] Test Gemini prompt with 5 commands (Step 3.2)
- [ ] Fix any prompt issues

### Phase 3: Client Integration (Hours 8–12)
- [ ] Create TTS service (Step 2.2)
- [ ] Create language detection (Step 2.3)
- [ ] Update backend to return spoken text (Step 2.4)
- [ ] Wire TTS into dashboard (Step 2.5)

### Phase 4: Testing & Refinement (Hours 12–16)
- [ ] Unit tests for all new functions
- [ ] Integration tests end-to-end
- [ ] Demo rehearsal with 5 commands
- [ ] Fix any bugs or UX issues
- [ ] Add TTS controls (Step 2.6, optional)

### Phase 5: Documentation & Handoff (Hours 16–18)
- [ ] Document prompt design decisions (Step 3.1)
- [ ] Document test results (Step 3.2)
- [ ] Update PRD with implementation notes
- [ ] Code freeze

---

## Success Criteria

### Feature 1: Gemini Verification
- ✅ Gemini called during sync for all transactions
- ✅ JSON validation prevents malformed responses
- ✅ Fallback to local parse if Gemini fails
- ✅ Correction movements logged for audit trail
- ✅ 5 scripted commands verified with ≥0.7 confidence
- ✅ Response includes `geminiConfidence` and `geminiVerified` fields

### Feature 2: TTS
- ✅ `expo-speech` installed and working
- ✅ TTS plays when `output_mode` includes "speech"
- ✅ Language detected from question
- ✅ TTS works on low-end Android device
- ✅ Graceful fallback if TTS unavailable
- ✅ "Speak Again" button functional (optional)

### Feature 3: Prompt Design
- ✅ Prompt documented with design rationale
- ✅ 5 scripted commands tested and passing
- ✅ Edge cases identified and handled
- ✅ Prompt can be iterated quickly

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
- Use simpler prompt or rule-based fallback
- Mark as P1 for future iteration

---

## Open Questions for Grill-Me

1. **Gemini Verification Confidence Threshold:**
   - Is 0.7 the right cutoff, or should it be higher (e.g., 0.85) to preserve user intent?
   - What happens if Gemini returns 0.6 confidence? Fall back or ask for confirmation?

2. **Correction Movement Handling:**
   - When Gemini disagrees with local parse, should we:
     a) Apply Gemini result + log correction?
     b) Apply local parse + log Gemini suggestion for review?
     c) Ask user for confirmation?

3. **TTS Language Mapping:**
   - Is `fil-PH` the right locale for Taglish and Bisaya, or should we use separate locales?
   - What if device doesn't support Filipino TTS? Graceful fallback to English?

4. **Prompt Iteration:**
   - How many iterations of prompt testing are acceptable before demo rehearsal?
   - Should we prepare alternative prompts as backup?

5. **Error Handling:**
   - If Gemini times out during sync, should we retry immediately or queue for next sync?
   - How long should we wait before falling back to local parse?

6. **Demo Reliability:**
   - Should we prepare a "demo mode" that uses cached Gemini responses instead of live API?
   - What's the fallback if Gemini API quota is exceeded mid-demo?

---

## Appendix: Code Snippets

### Example Gemini Prompt Output

**Input:**
```
Raw text: "Nakabenta ako ng dalawang Coke Mismo at isang Safeguard."
Inventory: [
  { name: "Coke Mismo", aliases: ["coke", "coca cola"] },
  { name: "Safeguard", aliases: ["safeguard", "soap"] }
]
```

**Expected Output:**
```json
{
  "intent": "sale",
  "confidence": 0.95,
  "items": [
    {
      "spoken_name": "Coke Mismo",
      "matched_item_name": "Coke Mismo",
      "quantity_delta": -2
    },
    {
      "spoken_name": "Safeguard",
      "matched_item_name": "Safeguard",
      "quantity_delta": -1
    }
  ],
  "credit": {
    "is_utang": false,
    "customer_name": null
  },
  "notes": []
}
```

### Example TTS Invocation

```typescript
const answer = {
  questionText: "Ano ang pinakamabenta today?",
  answerText: "Coke Mismo ang pinakamabenta today: 8 units sold.",
  spokenText: "Coke Mismo ang pinakamabenta today. Eight units sold.",
  outputMode: "text_and_speech"
};

const languageStyle = detectLanguageStyleFromQuestion(answer.questionText); // 'filipino'
const languageCode = getLanguageCode(languageStyle); // 'fil-PH'

await speakText(answer.spokenText, { language: languageCode });
// Device plays: "Coke Mismo ang pinakamabenta today. Eight units sold."
```

---

## Sign-Off

**Plan created by:** Manus AI Agent  
**Date:** April 25, 2026  
**Status:** Ready for grill-me review  
**Next step:** Stress-test with grill-me skill to identify risks and gaps

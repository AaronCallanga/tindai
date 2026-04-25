# Gemini Prompt Test Results

## Status
Prompt harness implemented. Live execution is opt-in and currently blocked by Gemini quota on this machine.

## Environment status on April 25, 2026
- `GEMINI_LIVE_TESTS`: not enabled by default
- Live prompt rehearsal attempt: returned `429 RESOURCE_EXHAUSTED` from Gemini for the configured project billing

## What is implemented
- Prompt builder: [`server/src/services/gemini-transaction-prompt.ts`](/d:/sean/tindai/server/src/services/gemini-transaction-prompt.ts)
- Strict response validation: [`server/src/services/gemini.service.ts`](/d:/sean/tindai/server/src/services/gemini.service.ts)
- Sync integration with confidence threshold and correction ledger rows: [`server/src/models/sync.model.ts`](/d:/sean/tindai/server/src/models/sync.model.ts)
- Rehearsal harness: [`server/src/tests/gemini-prompt.test.ts`](/d:/sean/tindai/server/src/tests/gemini-prompt.test.ts)

## Rehearsed command set ready for live run
1. `Nakabenta ako ng dalawang Coke Mismo at isang Safeguard.`
2. `Tatlong itlog nabenta.`
3. `Kumuha si Mang Juan ng dalawang Coke Mismo, ilista mo muna.`
4. `Dagdag ng sampung Rice.`
5. `Ano ang low stock ngayon?`

## How to run once Gemini is configured

```bash
cd server
$env:GEMINI_LIVE_TESTS="1"
npm test -- src/tests/gemini-prompt.test.ts
```

## Expected acceptance
- Valid JSON for all 5 commands
- Confidence `>= 0.7` for the four mutation commands
- `intent: "unknown"` with zero items for the question command

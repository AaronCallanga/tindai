# Transaction Verification Prompt Design

## Overview
This prompt verifies pending inventory transactions during cloud sync. It accepts raw spoken or typed text, the store's dynamic inventory catalog, and the local parser output, then asks Gemini for strict JSON only.

## Design decisions

### Structured JSON output
- The backend validates the response before any cloud ledger writes.
- Narrative responses are rejected and the sync falls back to the local parse.

### Full inventory context
- The prompt includes canonical names and aliases from the signed-in store.
- This supports fuzzy matches like `coke` to `Coke Mismo` without hardcoding a catalog.

### Local parse included as a hint
- The local parser remains the offline source of immediate behavior.
- Gemini can compare its understanding against the local parse, but the backend still decides whether to trust Gemini based on validation and confidence.

### Confidence threshold
- `>= 0.7`: mark the transaction as Gemini-verified and write correction ledger rows when Gemini disagrees with the local parse.
- `< 0.7`: keep the local parse as the cloud source and record the Gemini confidence only.

### Failure behavior
- Invalid JSON, API failures, or missing API configuration all fall back silently to the local parse.
- Raw text and local parse remain preserved in the transaction audit trail.

## Expected response shape

```json
{
  "intent": "sale",
  "confidence": 0.95,
  "items": [
    {
      "spoken_name": "Coke",
      "matched_item_name": "Coke Mismo",
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

## Rehearsed command set
- `Nakabenta ako ng dalawang Coke Mismo at isang Safeguard.`
- `Tatlong itlog nabenta.`
- `Kumuha si Mang Juan ng dalawang Coke Mismo, ilista mo muna.`
- `Dagdag ng sampung Rice.`
- `Ano ang low stock ngayon?`

## Current verification workflow
- Prompt construction is covered by [`server/src/tests/gemini-prompt.test.ts`](/d:/sean/tindai/server/src/tests/gemini-prompt.test.ts).
- Live Gemini rehearsal runs only when `GEMINI_API_KEY` is configured in the environment.

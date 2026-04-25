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
Parse the raw spoken command into strict JSON only.

Rules:
- Detect quantity from Tagalog, English, or numeric forms.
- Match item names against the provided inventory aliases.
- Detect sale, restock, utang, or unknown intent.
- quantity_delta must be negative for sales or utang, positive for restock.
- Return confidence from 0.0 to 1.0.
- If uncertain, lower the confidence and add short notes.
- If this is a question instead of an inventory change, return intent "unknown" with empty items.

Inventory context:
${inventoryJson}

Raw text:
"${params.rawText}"

Local parser result for reference:
${localParseJson}

Return ONLY valid JSON matching this schema:
{
  "intent": "sale|restock|utang|unknown",
  "confidence": 0.0,
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

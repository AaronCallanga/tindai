export type GeminiTransactionVerificationIntent = 'sale' | 'restock' | 'utang' | 'unknown';

export type GeminiTransactionVerification = {
  intent: GeminiTransactionVerificationIntent;
  confidence: number;
  items: Array<{
    spoken_name: string;
    matched_item_name: string;
    quantity_delta: number;
  }>;
  credit: {
    is_utang: boolean;
    customer_name?: string | null;
  };
  notes: string[];
};

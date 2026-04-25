import { getClientEnv } from '@/config/env';

import type { ReceiptOcrBlock, ReceiptOcrImageMeta } from './receiptOcr';
import type { MatchedReceiptItem, ParsedReceiptItem } from './receiptReview';

export type ProcessReceiptOcrRequest = {
  rawText: string;
  ocrBlocks: ReceiptOcrBlock[];
  imageMeta: ReceiptOcrImageMeta;
  provider: 'placeholder' | 'ml_kit';
};

export type ProcessReceiptOcrResponse = {
  receiptId: string;
  status: 'OCR_DONE';
  ocrQuality: 'usable' | 'weak';
  retryRecommended: boolean;
  normalizedText: string;
  rawText: string;
  ocrBlockCount: number;
  imageMeta: ReceiptOcrImageMeta;
};

export type ParseReceiptRequest = {
  rawText: string;
};

export type ParseReceiptResponse = {
  receiptId: string;
  status: 'PARSED';
  nameEnrichmentStatus: 'local_only' | 'gemini_enriched' | 'fallback_local' | 'gemini_fallback';
  merchantName: string | null;
  receiptDate: string | null;
  subtotalAmount: number | null;
  taxAmount: number | null;
  totalAmount: number | null;
  items: ParsedReceiptItem[];
};

export type MatchReceiptRequest = {
  items: ParsedReceiptItem[];
};

export type MatchReceiptResponse = {
  receiptId: string;
  status: 'MATCHED';
  items: MatchedReceiptItem[];
};

type ErrorResponse = {
  message?: string;
};

function mapReceiptApiError(rawMessage: string | undefined, fallbackMessage: string) {
  const message = (rawMessage ?? '').toLowerCase();

  if (message.includes('unauthorized') || message.includes('invalid or expired token')) {
    return 'Kailangan munang mag-login bago iproseso ang resibo.';
  }

  if (message.includes('invalid receipt match payload')) {
    return 'Walang malinaw na listahan ng item sa resibo. Subukan ulit ang mas malinaw na kuha.';
  }

  if (message.includes('invalid receipt parse payload')) {
    return 'Hindi namin mabasa nang maayos ang laman ng resibo. Subukan ulit ang mas malinaw na kuha.';
  }

  if (message.includes('invalid receipt ocr payload')) {
    return 'Hindi maihanda ang laman ng larawan. Subukan ulit kumuha ng mas malinaw na resibo.';
  }

  if (message.includes('store not found')) {
    return 'Walang nakahandang tindahan para sa account na ito. Mag-sign in ulit at subukan muli.';
  }

  if (message.includes('unable to load store inventory for receipt matching')) {
    return 'Hindi muna makuha ang listahan ng paninda ngayon. Subukan ulit maya-maya.';
  }

  if (message.includes('network request failed') || message.includes('fetch failed')) {
    return 'Walang koneksyon sa server ngayon. Suriin ang internet o subukan ulit maya-maya.';
  }

  return rawMessage ?? fallbackMessage;
}

export async function sendReceiptOcrToBackend(params: {
  accessToken: string;
  receiptId: string;
  payload: ProcessReceiptOcrRequest;
}): Promise<ProcessReceiptOcrResponse> {
  const env = getClientEnv();
  const response = await fetch(`${env.EXPO_PUBLIC_API_BASE_URL}/api/v1/receipts/${params.receiptId}/process-ocr`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params.payload),
  });

  const body = (await response.json().catch(() => null)) as ProcessReceiptOcrResponse | ErrorResponse | null;
  if (!response.ok || !body || !('receiptId' in body)) {
    throw new Error(
      mapReceiptApiError(
        (body as ErrorResponse | null)?.message,
        'Hindi naipadala ang nabasang laman ng resibo.',
      ),
    );
  }

  return body;
}

export async function parseReceiptOnBackend(params: {
  accessToken: string;
  receiptId: string;
  payload: ParseReceiptRequest;
}): Promise<ParseReceiptResponse> {
  const env = getClientEnv();
  const response = await fetch(`${env.EXPO_PUBLIC_API_BASE_URL}/api/v1/receipts/${params.receiptId}/parse`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params.payload),
  });

  const body = (await response.json().catch(() => null)) as ParseReceiptResponse | ErrorResponse | null;
  if (!response.ok || !body || !('receiptId' in body)) {
    throw new Error(
      mapReceiptApiError((body as ErrorResponse | null)?.message, 'Hindi maihanda ang detalye ng resibo.'),
    );
  }

  return body;
}

export async function matchReceiptOnBackend(params: {
  accessToken: string;
  receiptId: string;
  payload: MatchReceiptRequest;
}): Promise<MatchReceiptResponse> {
  const env = getClientEnv();
  const response = await fetch(`${env.EXPO_PUBLIC_API_BASE_URL}/api/v1/receipts/${params.receiptId}/match`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params.payload),
  });

  const body = (await response.json().catch(() => null)) as MatchReceiptResponse | ErrorResponse | null;
  if (!response.ok || !body || !('receiptId' in body)) {
    throw new Error(
      mapReceiptApiError(
        (body as ErrorResponse | null)?.message,
        'Hindi mahanapan ng tugma ang mga item sa resibo.',
      ),
    );
  }

  return body;
}

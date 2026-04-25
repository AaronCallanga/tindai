import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getSupabaseAdminClient } from '../config/supabase';
import { verifyTransactionsForOwner } from '../models/sync.model';
import { generateGeminiText } from '../services/gemini.service';
import { getStoreByOwnerId } from '../models/store.model';

vi.mock('../config/supabase', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

vi.mock('../services/gemini.service', async () => {
  const actual = await vi.importActual<typeof import('../services/gemini.service')>(
    '../services/gemini.service',
  );

  return {
    ...actual,
    generateGeminiText: vi.fn(),
  };
});

vi.mock('../models/store.model', () => ({
  getStoreByOwnerId: vi.fn(),
}));

const mockedGetSupabaseAdminClient = vi.mocked(getSupabaseAdminClient);
const mockedGenerateGeminiText = vi.mocked(generateGeminiText);
const mockedGetStoreByOwnerId = vi.mocked(getStoreByOwnerId);

function createSupabaseMock() {
  const inventoryMovementsInsert = vi.fn().mockResolvedValue({ error: null });
  const utangEntriesInsert = vi.fn().mockResolvedValue({ error: null });
  const inventoryItemsInsert = vi.fn().mockImplementation((payload: Record<string, unknown>) => ({
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: {
          id: `inventory-item-${String(payload.name)}`,
          name: payload.name,
          unit: payload.unit ?? 'pcs',
          price: payload.price ?? 0,
          aliases: payload.aliases ?? [],
        },
        error: null,
      }),
    }),
  }));
  const transactionItemsInsert = vi.fn().mockImplementation((payload: Record<string, unknown>) => ({
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: {
          id: `transaction-item-${String(payload.item_id)}`,
        },
        error: null,
      }),
    }),
  }));
  const transactionsInsert = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'transaction-1',
        },
        error: null,
      }),
    }),
  });
  const customersInsert = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'customer-1',
        },
        error: null,
      }),
    }),
  });

  const supabase = {
    from: vi.fn((table: string) => {
      if (table === 'inventory_items') {
        return {
          select: vi.fn(() => {
            const is = vi.fn(() => ({
              returns: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: 'item-coke',
                    name: 'Coke Mismo',
                    unit: 'pcs',
                    price: 20,
                    aliases: ['coke', 'coke mismo'],
                  },
                ],
                error: null,
              }),
            }));

            return {
              eq: vi.fn(() => ({
                is,
              })),
            };
          }),
          insert: inventoryItemsInsert,
        };
      }

      if (table === 'transactions') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              })),
            })),
          })),
          insert: transactionsInsert,
        };
      }

      if (table === 'customers') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              ilike: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              })),
            })),
          })),
          insert: customersInsert,
        };
      }

      if (table === 'transaction_items') {
        return {
          insert: transactionItemsInsert,
        };
      }

      if (table === 'inventory_movements') {
        return {
          insert: inventoryMovementsInsert,
        };
      }

      if (table === 'utang_entries') {
        return {
          insert: utangEntriesInsert,
        };
      }

      throw new Error(`Unhandled table mock: ${table}`);
    }),
  };

  return {
    supabase,
    inventoryMovementsInsert,
    utangEntriesInsert,
    transactionItemsInsert,
    transactionsInsert,
  };
}

describe('verifyTransactionsForOwner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetStoreByOwnerId.mockResolvedValue({
      id: 'store-1',
      ownerId: 'owner-1',
      name: 'Tindai Store',
      currencyCode: 'PHP',
      timezone: 'Asia/Manila',
      updatedAt: '2026-04-25T00:00:00.000Z',
    });
  });

  it('applies gemini verification above the confidence threshold and records correction movements', async () => {
    const { supabase, inventoryMovementsInsert } = createSupabaseMock();
    mockedGetSupabaseAdminClient.mockReturnValue(supabase as never);
    mockedGenerateGeminiText.mockResolvedValue(`{
      "intent": "sale",
      "confidence": 0.82,
      "items": [
        {
          "spoken_name": "coke",
          "matched_item_name": "Coke Mismo",
          "quantity_delta": -2
        }
      ],
      "credit": {
        "is_utang": false,
        "customer_name": null
      },
      "notes": []
    }`);

    const result = await verifyTransactionsForOwner('owner-1', [
      {
        clientMutationId: 'mutation-1',
        rawText: 'Nakabenta ako ng Coke.',
        source: 'voice',
        parserSource: 'offline_rule_parser',
        localParse: { intent: 'sale' },
        isUtang: false,
        items: [
          {
            itemName: 'Coke Mismo',
            quantityDelta: -1,
            unitPrice: 20,
            unit: 'pcs',
          },
        ],
      },
    ]);

    expect(result.results).toEqual([
      {
        clientMutationId: 'mutation-1',
        status: 'synced',
        geminiConfidence: 0.82,
        geminiVerified: true,
      },
    ]);
    expect(inventoryMovementsInsert).toHaveBeenCalledTimes(2);
    expect(inventoryMovementsInsert).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        movement_type: 'gemini_correction',
        quantity_delta: -1,
      }),
    );
  });

  it('falls back to the local parse when gemini confidence is below threshold', async () => {
    const { supabase, inventoryMovementsInsert } = createSupabaseMock();
    mockedGetSupabaseAdminClient.mockReturnValue(supabase as never);
    mockedGenerateGeminiText.mockResolvedValue(`{
      "intent": "sale",
      "confidence": 0.4,
      "items": [
        {
          "spoken_name": "coke",
          "matched_item_name": "Coke Mismo",
          "quantity_delta": -2
        }
      ],
      "credit": {
        "is_utang": false,
        "customer_name": null
      },
      "notes": []
    }`);

    const result = await verifyTransactionsForOwner('owner-1', [
      {
        clientMutationId: 'mutation-2',
        rawText: 'Nakabenta ako ng Coke.',
        source: 'voice',
        parserSource: 'offline_rule_parser',
        localParse: { intent: 'sale' },
        isUtang: false,
        items: [
          {
            itemName: 'Coke Mismo',
            quantityDelta: -1,
            unitPrice: 20,
            unit: 'pcs',
          },
        ],
      },
    ]);

    expect(result.results).toEqual([
      {
        clientMutationId: 'mutation-2',
        status: 'synced',
        geminiConfidence: 0.4,
        geminiVerified: false,
      },
    ]);
    expect(inventoryMovementsInsert).toHaveBeenCalledTimes(1);
    expect(inventoryMovementsInsert).not.toHaveBeenCalledWith(
      expect.objectContaining({
        movement_type: 'gemini_correction',
      }),
    );
  });
});

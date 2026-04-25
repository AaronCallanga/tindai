import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { app } from '../app';
import { getSupabaseAdminClient } from '../config/supabase';
import { getProfileByUserId } from '../models/profile.model';

vi.mock('../config/supabase', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

vi.mock('../models/profile.model', () => ({
  getProfileByUserId: vi.fn(),
}));

const mockedGetSupabaseAdminClient = vi.mocked(getSupabaseAdminClient);
const mockedGetProfileByUserId = vi.mocked(getProfileByUserId);

describe('GET /api/v1/profile/me', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads the current user profile through the model layer', async () => {
    mockedGetSupabaseAdminClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: 'user-123',
              email: 'hello@tindai.app',
              app_metadata: {},
              user_metadata: {},
            },
          },
          error: null,
        }),
      },
    } as never);

    mockedGetProfileByUserId.mockResolvedValue({
      id: 'user-123',
      email: 'hello@tindai.app',
      fullName: 'Tindai User',
      avatarUrl: null,
    });

    const response = await request(app)
      .get('/api/v1/profile/me')
      .set('Authorization', 'Bearer valid-token')
      .expect(200);

    expect(mockedGetProfileByUserId).toHaveBeenCalledWith('user-123');
    expect(response.body).toEqual({
      profile: {
        id: 'user-123',
        email: 'hello@tindai.app',
        fullName: 'Tindai User',
        avatarUrl: null,
      },
    });
  });
});

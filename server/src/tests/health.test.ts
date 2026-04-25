import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { app } from '../app';

describe('GET /health', () => {
  it('returns service status metadata', async () => {
    const response = await request(app).get('/health').expect(200);

    expect(response.body).toMatchObject({
      status: 'ok',
      service: 'tindai-server',
    });
    expect(typeof response.body.timestamp).toBe('string');
  });
});

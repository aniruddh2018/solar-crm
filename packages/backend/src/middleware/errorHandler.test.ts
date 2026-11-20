import { describe, it, expect, vi } from 'vitest';
import { errorHandler } from '../middleware/errorHandler';

describe('errorHandler', () => {
  it('returns 500 with generic message', () => {
    const req = {} as any;
    const res: any = { status: vi.fn(() => res), json: vi.fn(() => res) };
    errorHandler(new Error('Boom'), req, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});

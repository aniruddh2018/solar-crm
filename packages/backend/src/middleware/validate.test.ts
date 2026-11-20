import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { validate } from '../middleware/validate';

function makeRes() {
  const r: any = {};
  r.status = vi.fn(() => r);
  r.json = vi.fn(() => r);
  return r;
}

describe('validate', () => {
  const schema = z.object({ email: z.string().email(), password: z.string().min(6) });

  it('calls next on valid body', () => {
    const req: any = { body: { email: 'a@b.com', password: '123456' } };
    const next = vi.fn();
    validate(schema)(req, makeRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it('returns 400 with details on invalid body', () => {
    const req: any = { body: { email: 'bad', password: '12' } };
    const res = makeRes();
    validate(schema)(req, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].error).toBe('Validation failed');
  });

  it('validates query params', () => {
    const querySchema = z.object({ page: z.string() });
    const req: any = { query: { page: '1' } };
    const next = vi.fn();
    validate(querySchema, 'query')(req, makeRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it('parses body on success', () => {
    const req: any = { body: { email: 'a@b.com', password: '123456' } };
    validate(schema)(req, makeRes(), vi.fn());
    expect(req.body.email).toBe('a@b.com');
  });
});

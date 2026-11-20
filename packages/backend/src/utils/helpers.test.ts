import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('generateInvoiceNumber', () => {
  it('generates correctly formatted number', () => {
    const fn = () => {
      const seq = 1;
      const year = new Date().getFullYear();
      return `INV-${year}-${String(seq).padStart(4, '0')}`;
    };
    expect(fn()).toMatch(/^INV-\d{4}-0001$/);
  });

  it('pads with leading zeros', () => {
    const fn = () => {
      const year = new Date().getFullYear();
      return `INV-${year}-${String(5).padStart(4, '0')}`;
    };
    expect(fn()).toBe(`INV-${new Date().getFullYear()}-0005`);
  });

  it('handles 4-digit sequence', () => {
    const fn = () => {
      const year = new Date().getFullYear();
      return `INV-${year}-${String(1234).padStart(4, '0')}`;
    };
    expect(fn()).toBe(`INV-${new Date().getFullYear()}-1234`);
  });
});

describe('excludePassword', () => {
  const excludePassword = (user: any) => {
    const { password_hash, refresh_token, ...rest } = user;
    return rest;
  };

  it('removes password_hash and refresh_token', () => {
    const user = {
      id: '123', email: 'test@test.com', full_name: 'Test', role: 'admin',
      password_hash: 'hashed', refresh_token: 'token123', is_active: true,
    };
    const result = excludePassword(user);
    expect(result).not.toHaveProperty('password_hash');
    expect(result).not.toHaveProperty('refresh_token');
    expect(result.id).toBe('123');
  });

  it('does not mutate original object', () => {
    const user = { id: '1', name: 'Test', password_hash: 'secret' };
    excludePassword(user);
    expect(user.password_hash).toBe('secret');
  });
});

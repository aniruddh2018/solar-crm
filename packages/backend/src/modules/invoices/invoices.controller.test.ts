import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';

vi.mock('../../db/connection', () => {
  const dbQueue: any[] = [];
  function makeChain(): any {
    const c: any = {
      then: (resolve: any) => {
        const v = dbQueue.shift();
        return Promise.resolve(resolve(v === undefined ? [] : v));
      },
    };
    c.select = c.where = c.whereNotIn = c.whereIn = c.orWhere = c.andWhere = c.leftJoin =
    c.innerJoin = c.orderBy = c.groupBy = c.groupByRaw = c.limit = c.offset = c.insert =
    c.update = c.del = c.first = c.returning = c.count = c.sum = c.orderByRaw =
    c.onDelete = c.distinct = vi.fn(function(this: any, fn: any) {
      if (typeof fn === 'function') fn.call(c);
      return c;
    });
    return c;
  }
  const db = vi.fn(() => makeChain()) as any;
  db.raw = vi.fn((v: string) => v);
  db.fn = { now: () => new Date().toISOString() };
  db.__q = dbQueue;
  return { default: db };
});

import db from '../../db/connection';
import { listInvoices, getInvoice, addPayment } from './invoices.controller';
import { listCustomers, getCustomer } from '../customers/customers.controller';

function makeReq(overrides: any = {}): Request {
  return { body: {}, params: {}, query: {}, user: { id: 'u1', email: 'a@a.com', role: 'admin' }, ...overrides } as any;
}
function makeRes(): Response {
  const r: any = {};
  r.status = vi.fn(() => r);
  r.json = vi.fn(() => r);
  return r;
}
function q(...vals: any[]) { (db as any).__q.push(...vals); }

beforeEach(() => { vi.clearAllMocks(); (db as any).__q.length = 0; });

describe('invoices controller', () => {
  describe('listInvoices', () => {
    it('returns invoices list', async () => {
      q([{ id: 'i1', invoice_number: 'INV-001', total: 5000 }]);
      const rs = makeRes();
      await listInvoices(makeReq(), rs);
      expect((rs.json as any).mock.calls[0][0].invoices).toHaveLength(1);
    });
  });

  describe('getInvoice', () => {
    it('returns 404 for missing invoice', async () => {
      q(null);
      const rs = makeRes();
      await getInvoice(makeReq({ params: { id: 'bad' } }), rs);
      expect(rs.status).toHaveBeenCalledWith(404);
    });

    it('returns invoice with items and payments', async () => {
      q({ id: 'i1', invoice_number: 'INV-001', total: 5000 });
      q([{ id: 'item1', description: 'Panels', quantity: 10, unit_price: 350, total: 3500 }]);
      q([]);
      const rs = makeRes();
      await getInvoice(makeReq({ params: { id: 'i1' } }), rs);
      const body = (rs.json as any).mock.calls[0][0];
      expect(body.invoice.invoice_number).toBe('INV-001');
      expect(body.items).toHaveLength(1);
    });
  });

  describe('addPayment', () => {
    it('records a payment', async () => {
      q({ id: 'i1', total: 5000 });
      q([{ id: 'pay1', amount: 1000, method: 'bank_transfer' }]);
      q([{ total_paid: '1000.00' }]);
      const rs = makeRes();
      await addPayment(makeReq({ params: { id: 'i1' }, body: { amount: 1000, method: 'bank_transfer' } }), rs);
      expect(rs.status).toHaveBeenCalledWith(201);
    });

    it('marks invoice paid when fully covered', async () => {
      q({ id: 'i1', total: 1000 });
      q([{ id: 'pay1', amount: 1000 }]);
      q([{ total_paid: '1000.00' }]);
      q([{ id: 'i1', status: 'paid' }]);
      const rs = makeRes();
      await addPayment(makeReq({ params: { id: 'i1' }, body: { amount: 1000, method: 'check' } }), rs);
      expect(rs.status).toHaveBeenCalledWith(201);
    });

    it('returns 404 for missing invoice', async () => {
      q(null);
      const rs = makeRes();
      await addPayment(makeReq({ params: { id: 'bad' }, body: { amount: 100, method: 'cash' } }), rs);
      expect(rs.status).toHaveBeenCalledWith(404);
    });
  });
});

describe('customers controller', () => {
  describe('listCustomers', () => {
    it('returns customers list', async () => {
      q([{ id: 'c1', first_name: 'John', last_name: 'Doe' }]);
      const rs = makeRes();
      await listCustomers(makeReq(), rs);
      expect((rs.json as any).mock.calls[0][0].customers).toHaveLength(1);
    });
  });

  describe('getCustomer', () => {
    it('returns 404 for missing customer', async () => {
      q(null);
      const rs = makeRes();
      await getCustomer(makeReq({ params: { id: 'bad' } }), rs);
      expect(rs.status).toHaveBeenCalledWith(404);
    });

    it('returns customer with projects and invoices', async () => {
      q({ id: 'c1', first_name: 'John', last_name: 'Doe' });
      q([{ id: 'p1', name: 'Project 1' }]);
      q([{ id: 'i1', invoice_number: 'INV-001' }]);
      const rs = makeRes();
      await getCustomer(makeReq({ params: { id: 'c1' } }), rs);
      const body = (rs.json as any).mock.calls[0][0];
      expect(body.customer.first_name).toBe('John');
      expect(body.projects).toHaveLength(1);
      expect(body.invoices).toHaveLength(1);
    });
  });
});

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
import { listLeads, getLead, updateLeadStatus, addActivity, convertLead } from './leads.controller';

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

describe('leads controller', () => {
  describe('listLeads', () => {
    it('returns leads array', async () => {
      q([{ id: 'l1', first_name: 'A', last_name: 'B' }]);
      const rs = makeRes();
      await listLeads(makeReq(), rs);
      expect((rs.json as any).mock.calls[0][0].leads).toHaveLength(1);
    });

    it('returns empty array when no leads', async () => {
      q([]);
      const rs = makeRes();
      await listLeads(makeReq(), rs);
      expect((rs.json as any).mock.calls[0][0].leads).toEqual([]);
    });
  });

  describe('getLead', () => {
    it('returns 404 for missing lead', async () => {
      q(null);
      const rs = makeRes();
      await getLead(makeReq({ params: { id: 'bad' } }), rs);
      expect(rs.status).toHaveBeenCalledWith(404);
    });

    it('returns lead with activities', async () => {
      q({ id: 'l1', first_name: 'Test', last_name: 'Lead' });
      q([{ id: 'a1', description: 'Called customer' }]);
      const rs = makeRes();
      await getLead(makeReq({ params: { id: 'l1' } }), rs);
      const body = (rs.json as any).mock.calls[0][0];
      expect(body.lead.first_name).toBe('Test');
      expect(body.activities).toHaveLength(1);
    });
  });

  describe('updateLeadStatus', () => {
    it('creates activity and updates status', async () => {
      q({ id: 'l1', status: 'new' });
      q([{ id: 'l1', status: 'contacted' }]);
      q([{ id: 'act1' }]);
      const rs = makeRes();
      await updateLeadStatus(makeReq({ params: { id: 'l1' }, body: { status: 'contacted' } }), rs);
      expect((rs.json as any).mock.calls[0][0].lead.status).toBe('contacted');
    });

    it('returns 404 for missing lead', async () => {
      q(null);
      const rs = makeRes();
      await updateLeadStatus(makeReq({ params: { id: 'bad' }, body: { status: 'new' } }), rs);
      expect(rs.status).toHaveBeenCalledWith(404);
    });
  });

  describe('addActivity', () => {
    it('creates activity for existing lead', async () => {
      q({ id: 'l1' });
      q([{ id: 'a1', description: 'Note' }]);
      const rs = makeRes();
      await addActivity(makeReq({ params: { id: 'l1' }, body: { activity_type: 'call', description: 'Call made' } }), rs);
      expect(rs.status).toHaveBeenCalledWith(201);
    });

    it('returns 404 for missing lead', async () => {
      q(null);
      const rs = makeRes();
      await addActivity(makeReq({ params: { id: 'bad' }, body: { description: 'x' } }), rs);
      expect(rs.status).toHaveBeenCalledWith(404);
    });
  });

  describe('convertLead', () => {
    it('converts lead to customer + project + milestones + marks won', async () => {
      q({ id: 'l1', first_name: 'John', last_name: 'Doe', email: 'j@j.com',
        phone: '555', address: '123 St', city: 'PHX', state: 'AZ', zip: '85001',
        estimated_system_size_kw: 8, estimated_value: 24000, notes: 'Test' });
      q([{ id: 'c1', first_name: 'John' }]);
      q([{ id: 'p1', customer_id: 'c1', name: 'John Doe Solar Installation' }]);
      q(null);
      q([{ id: 'l1', status: 'won' }]);
      const rs = makeRes();
      await convertLead(makeReq({ params: { id: 'l1' } }), rs);
      expect(rs.status).toHaveBeenCalledWith(201);
      const body = (rs.json as any).mock.calls[0][0];
      expect(body.customer).toBeDefined();
      expect(body.project).toBeDefined();
    });
  });
});

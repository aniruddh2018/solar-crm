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
import { listProjects, getProject, updateProjectStatus } from './projects.controller';

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

describe('projects controller', () => {
  describe('listProjects', () => {
    it('returns projects list', async () => {
      q([{ id: 'p1', name: 'Project 1', status: 'in_progress' }]);
      const rs = makeRes();
      await listProjects(makeReq(), rs);
      expect((rs.json as any).mock.calls[0][0].projects).toHaveLength(1);
    });
  });

  describe('getProject', () => {
    it('returns 404 for non-existent project', async () => {
      q(null);
      const rs = makeRes();
      await getProject(makeReq({ params: { id: 'bad' } }), rs);
      expect(rs.status).toHaveBeenCalledWith(404);
    });

    it('returns project with milestones, docs, products', async () => {
      q({ id: 'p1', name: 'Test', status: 'pending' });
      q([{ id: 'm1', title: 'Contract Signed' }]);
      q([]);
      q([]);
      const rs = makeRes();
      await getProject(makeReq({ params: { id: 'p1' } }), rs);
      const body = (rs.json as any).mock.calls[0][0];
      expect(body.project.name).toBe('Test');
      expect(body.milestones).toHaveLength(1);
    });
  });

  describe('updateProjectStatus', () => {
    it('sets completion_date when completed', async () => {
      q([{ id: 'p1', status: 'completed' }]);
      const rs = makeRes();
      await updateProjectStatus(makeReq({ params: { id: 'p1' }, body: { status: 'completed' } }), rs);
      expect((rs.json as any).mock.calls[0][0].project.status).toBe('completed');
    });

    it('returns 404 for non-existent project', async () => {
      q([]);
      const rs = makeRes();
      await updateProjectStatus(makeReq({ params: { id: 'bad' }, body: { status: 'in_progress' } }), rs);
      expect(rs.status).toHaveBeenCalledWith(404);
    });
  });
});

import { vi } from 'vitest';

export function createMockDb() {
  let resolveValue: any = undefined;

  function makeChainable() {
    const chain: any = {
      then: (resolve: any) => {
        return Promise.resolve().then(() => resolve(resolveValue));
      },
    };
    const methods = [
      'select','where','whereNotIn','whereIn','orWhere','andWhere',
      'leftJoin','innerJoin','orderBy','groupBy','groupByRaw','limit','offset',
      'insert','update','del','first','returning','count','sum','orderByRaw',
      'onDelete','distinct','avg','max','min',
      'asCallback',
    ];
    for (const m of methods) {
      chain[m] = vi.fn(function(this: any, ...args: any[]) {
        if (typeof args[0] === 'function') {
          const fn = args[0];
          fn();
        }
        return makeChainable();
      });
    }
    return chain;
  }

  const mock: any = function(_table?: string) {
    return makeChainable();
  };
  mock.raw = vi.fn((v: string) => v);
  mock.fn = { now: () => new Date().toISOString() };
  mock.__setResolve = (v: any) => { resolveValue = v; };
  return mock;
}

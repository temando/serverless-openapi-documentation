import { Clone, IMerge, Merge } from 'lutils';

export const merge: IMerge = new Merge({ depth: 100 }).merge;
export const clone = new Clone({ depth: 100 }).clone;

export function isIterable (obj) {
  if (obj === null || obj === undefined) {
    return false;
  }

  return typeof obj[Symbol.iterator] === 'function';
}

export function omit<T extends Object> (obj: T, keys: string[]): T {
  const cloned = clone(obj);

  for(const key of keys) {
    delete cloned[key];
  }

  return cloned;
}

import * as lutils from 'lutils';

export const merge = (...args) => lutils.merge([...args], { depth: 100 });

export const clone = (arg, options = {}) => lutils.clone(arg, { ...options, depth: 100 });

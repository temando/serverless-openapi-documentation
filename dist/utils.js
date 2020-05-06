"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lutils_1 = require("lutils");
exports.merge = new lutils_1.Merge({ depth: 100 }).merge;
exports.clone = new lutils_1.Clone({ depth: 100 }).clone;
function isIterable(obj) {
    if (obj === null || obj === undefined) {
        return false;
    }
    return typeof obj[Symbol.iterator] === 'function';
}
exports.isIterable = isIterable;
//# sourceMappingURL=utils.js.map
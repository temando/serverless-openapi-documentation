import _ = require("lodash");

export const cleanSchema = schema => _.omit(schema, "$schema", "definitions");

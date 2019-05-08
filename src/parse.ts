import { JSONSchema7 } from "json-schema";
import * as $RefParser from "json-schema-ref-parser";
import * as _ from "lodash";
import * as path from "path";

import { Model } from "./types";
import { cleanSchema } from "./utils";

function updateReferences(schema: JSONSchema7): JSONSchema7 {
  if (!schema) {
    return schema;
  }

  const cloned = _.cloneDeep(schema);

  if (cloned.$ref) {
    return {
      ...cloned,
      $ref: cloned.$ref.replace("#/definitions", "#/components/schemas")
    };
  }

  for (const key of Object.getOwnPropertyNames(cloned)) {
    const value = cloned[key];

    if (typeof value === "object") {
      cloned[key] = updateReferences(value);
    }
  }

  return cloned;
}

export async function parseModels(
  models: Array<Model>,
  root: string
): Promise<{}> {
  const schemas = {};

  if (!_.isArrayLike(models)) {
    throw new Error("Empty models");
  }

  for (const model of models) {
    if (!model.schema) {
      continue;
    }

    const schema = (typeof model.schema === "string"
      ? await $RefParser.bundle(path.resolve(root, model.schema))
      : model.schema) as JSONSchema7;

    _.assign(schemas, updateReferences(schema.definitions), {
      [model.name]: updateReferences(cleanSchema(schema))
    });
  }

  return schemas;
}

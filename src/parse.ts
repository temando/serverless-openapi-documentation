import * as path from 'path';
import * as _ from 'lodash';
import { JSONSchema7 } from 'json-schema';

import * as $RefParser from 'json-schema-ref-parser';

import { IModel } from './types';
import { cleanSchema } from './utils';

export async function parseModels(models: IModel[], root: string): Promise<{}> {
  const schemas = {};

  if (!_.isArrayLike(models)) {
    throw new Error('Empty models');
  }

  for (const model of models) {
    if (!model.schema) {
      continue;
    }

    if (typeof model.schema === 'string') {
      const fullPath = path.resolve(root, model.schema);

      const schema = await $RefParser.bundle(fullPath) as JSONSchema7;

      _.assign(schemas, updateReferences(schema.definitions));

      schemas[model.name] = updateReferences(cleanSchema(schema));
    }

    if(typeof model.schema === 'object') {
      schemas[model.name] = updateReferences(cleanSchema(model.schema));
    }
  }

  return schemas;
}

function updateReferences (schema: JSONSchema7): JSONSchema7 {
  if(!schema) {
    return schema;
  }

  const cloned = _.cloneDeep(schema) as JSONSchema7;

  if (cloned.$ref) {
    return {
      ...cloned,
      $ref: cloned.$ref.replace('#/definitions', '#/components/schemas')
    };
  }

  for (const key of Object.getOwnPropertyNames(cloned)) {
    const value = cloned[key];

    if (typeof value === 'object') {
      cloned[key] = updateReferences(value);
    }
  }

  return cloned;
}

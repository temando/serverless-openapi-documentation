import { dereference } from '@jdw/jst';
import * as c from 'chalk';
import * as openApiValidator from 'swagger2openapi/validate.js';

import * as uuid from 'uuid';
import { IParameterConfig, IServerlessFunctionConfig, IServiceDescription } from './types';
import { clone, merge } from './utils';

export default class DocumentGenerator {
  // The OpenAPI version we currently validate against
  private openapiVersion = '3.0.0-RC1';

  // Base configuration object
  private config = {
    openapi: this.openapiVersion,
    description: '',
    version: '0.0.0',
    title: '',
    paths: {},
    components: {
      schemas: {},
    },
  };

  private serviceDescriptor: IServiceDescription;

  /**
   * Constructor
   * @param serviceDescriptor IServiceDescription
   */
  constructor(serviceDescriptor: IServiceDescription) {
    this.serviceDescriptor = clone(serviceDescriptor);

    merge(this.config, {
      openapi: this.openapiVersion,
      servers: [],
      info: {
        title: serviceDescriptor.summary || '',
        description: serviceDescriptor.description || '',
        version: serviceDescriptor.version || uuid.v4(),
      },
      paths: {},
      components: {
        schemas: {},
        securitySchemes: {},
      },
    });

    for (const model of serviceDescriptor.models) {
      this.config.components.schemas[model.name] = this.cleanSchema(dereference(model.schema));
    }
  }

  public generate() {
    const result: any = {};
    process.stdout.write(`${ c.bold.yellow('[VALIDATION]') } Validating OpenAPI generated output\n`);
    try {
      openApiValidator.validateSync(this.config, result);
      process.stdout.write(`${ c.bold.green('[VALIDATION]') } OpenAPI valid: ${c.bold.green('true')}\n\n`);
      return this.config;
    } catch (e) {
      process.stdout.write(
        `${c.bold.red('[VALIDATION]')} Failed to validate OpenAPI document: \n\n${c.yellow(e.message)}\n\n` +
        `${c.bold.green('Path:')} ${result.context.pop()}\n`,
        );
      throw new Error('Failed to validate OpenAPI document');
    }
  }

  /**
   * Add Paths to OpenAPI Configuration from Serverless function documentation
   * @param config Add
   */
  public addPathsFromFunctionConfig(config: IServerlessFunctionConfig[]): void {
    // loop through function configurations
    for (const funcConfig of config) {
      // loop through http events
      for (const httpEvent of this.getHttpEvents(funcConfig.events)) {
        const httpEventConfig = httpEvent.http;
        if (httpEventConfig.documentation) {
          const documentationConfig = httpEventConfig.documentation;
          // Build OpenAPI path configuration structure for each method
          const pathConfig = {
            [`/${httpEventConfig.path}`]: {
              [httpEventConfig.method]: {
                operationId: funcConfig._functionName,
                summary: documentationConfig.summary || '',
                description: documentationConfig.description || '',
                responses: this.getResponsesFromConfig(documentationConfig),
                parameters: this.getParametersFromConfig(documentationConfig),
                requestBody: this.getRequestBodiesFromConfig(documentationConfig),
              },
            },
          };
          // merge path configuration into main configuration
          merge(this.config.paths, pathConfig);
        }
      }
    }
  }

  /**
   * Cleans schema objects to make them OpenAPI compatible
   * @param schema JSON Schema Object
   */
  private cleanSchema(schema) {
    // Clone the schema for manipulation
    const cleanedSchema = clone(schema);

    // Strip $schema from schemas
    if (cleanedSchema.$schema) {
      delete cleanedSchema.$schema;
    }

    // Return the cleaned schema
    return cleanedSchema;
  }

  /**
   * Derives Path, Query and Request header parameters from Serverless documentation
   * @param documentationConfig
   */
  private getParametersFromConfig(documentationConfig): IParameterConfig[] {
    const parameters: IParameterConfig[] = [];

    // Build up parameters from configuration for each parameter type
    for (const type of ['path', 'query', 'header', 'cookie']) {
      let paramBlock;
      if (type === 'path' && documentationConfig.pathParams) {
        paramBlock = documentationConfig.pathParams;
      } else if (type === 'query' && documentationConfig.queryParams) {
        paramBlock = documentationConfig.queryParams;
      } else if (type === 'header' && documentationConfig.requestHeaders) {
        paramBlock = documentationConfig.requestHeaders;
      } else if (type === 'cookie' && documentationConfig.cookieParams) {
        paramBlock = documentationConfig.cookieParams;
      } else {
        continue;
      }

      // Loop through each parameter in a parameter block and add parameters to array
      for (const parameter of paramBlock) {
        const parameterConfig: IParameterConfig = {
          name: parameter.name,
          in: type,
          description: parameter.description || '',
          required: parameter.required || false, // Note: all path parameters must be required
        };

        // if type is path, then required must be true (@see OpenAPI 3.0-RC1)
        if (type === 'path') {
          parameterConfig.required = true;
        } else if (type === 'query') {
          parameterConfig.allowEmptyValues = parameter.allowEmptyValue || false;  // OpenAPI default is false

          if ('allowReserved' in parameter) {
            parameterConfig.allowReserved = parameter.allowReserved || false;
          }
        }

        if ('deprecated' in parameter) {
          parameterConfig.deprecated = parameter.deprecated;
        }

        if ('style' in parameter) {
          parameterConfig.style = parameter.style;
          if (parameter.explode) {
            parameterConfig.explode = parameter.explode;
          } else {
            parameterConfig.explode = parameter.explode || (parameter.style === 'form' ? true : false);
          }
        }

        // console.log(parameter);
        if (parameter.schema) {
          parameterConfig.schema = this.cleanSchema(parameter.schema);
        }

        if (parameter.example) {
          parameterConfig.example = parameter.example;
        } else if (parameter.examples && Array.isArray(parameter.examples)) {
          parameterConfig.examples = parameter.examples;
        }

        // Add parameter config to parameters array
        parameters.push(parameterConfig);
      }
    }

    return parameters;
  }

  /**
   * Derives request body schemas from event documentation configuration
   * @param documentationConfig
   */
  private getRequestBodiesFromConfig(documentationConfig) {
    const requestBodies = {};

    // Does this event have a request model?
    if (documentationConfig.requestModels) {
      // For each request model type (Sorted by "Content-Type")
      for (const requestModelType of Object.keys(documentationConfig.requestModels)) {
        // get schema reference information
        const requestModel = this.serviceDescriptor.models.filter(
          (model) => model.name === documentationConfig.requestModels[requestModelType],
        ).pop();

        if (requestModel) {
          const reqModelConfig = {
            schema: {
              $ref: `#/components/schemas/${documentationConfig.requestModels[requestModelType]}`,
            },
          };

          // Add examples if any can be found
          if (requestModel.examples && Array.isArray(requestModel.examples)) {
            merge(reqModelConfig, { examples: clone(requestModel.examples) });
          } else if (requestModel.example) {
            merge(reqModelConfig, { example: clone(requestModel.example) });
          }

          const reqBodyConfig: { content: object, description?: string } = {
            content: {
              [requestModelType]: reqModelConfig,
            },
          };

          if (documentationConfig.requestBody && 'description' in documentationConfig.requestBody) {
            reqBodyConfig.description = documentationConfig.requestBody.description;
          }

          merge(requestBodies, reqBodyConfig);
        }
      }
    }

    return requestBodies;
  }

  /**
   * Gets response bodies from documentation config
   * @param documentationConfig
   */
  private getResponsesFromConfig(documentationConfig) {
    const responses = {};
    if (documentationConfig.methodResponses) {
      for (const response of documentationConfig.methodResponses) {
        const methodResponseConfig: { description: any, content: object, headers?: object } = {
          description: (
            (response.responseBody && 'description' in response.responseBody)
              ? response.responseBody.description
              : `Status ${response.statusCode} Response`
          ),
          content: this.getResponseContent(response.responseModels),
        };

        if (response.responseHeaders) {
          methodResponseConfig.headers = {};
          for (const header of response.responseHeaders) {
            methodResponseConfig.headers[header.name] = {
              description: header.description || `${header.name} header`,
            };
            if (header.schema) {
              methodResponseConfig.headers[header.name].schema = this.cleanSchema(header.schema);
            }
          }
        }

        merge(responses, {
          [response.statusCode]: methodResponseConfig,
         });
      }
    }

    return responses;
  }

  private getResponseContent(response) {
    const content = {};
    for (const responseKey of Object.keys(response)) {
      const responseModel = this.serviceDescriptor.models.filter(
          (model) => model.name === response[responseKey],
        ).pop();
      if (responseModel) {
        const resModelConfig = {
          schema: {
            $ref: `#/components/schemas/${response[responseKey]}`,
          },
        };
        if (responseModel.examples && Array.isArray(responseModel.examples)) {
          merge(resModelConfig, { examples: clone(responseModel.examples) });
        } else if (responseModel.example) {
          merge(resModelConfig, { example: clone(responseModel.example) });
        }
        merge(content, { [responseKey] : resModelConfig });
      }
    }
    // console.log(content);
    return content;
  }

  private getHttpEvents(funcConfig) {
    return funcConfig.filter((event) => event.http ? true : false);
  }
}

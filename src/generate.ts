import { dereference } from '@jdw/jst';
import { clone, merge } from 'lutils';
import uuid from 'uuid';

type ServiceDescriptionType = {
  title: string,
  description: string,
  version: string,
  termsOfService?: string,
  contact?: {
    name?: string,
    email?: string,
    url?: string,
  },
  license?: {
    name: string,
    url: string,
  },
  models?: any[],
};

export default class DocumentGenerator {
  private config = {
    description: '',
    version: '0.0.0',
    title: '',
    paths: {},
    components: {
      schemas: {},
    },
  };

  constructor(serviceDescriptor: ServiceDescriptionType) {
    this.config = this.process(clone(serviceDescriptor, { depth: 100 }));
    // merge([this.config, serviceDescriptor], { depth: 32 });
    // console.log(this.config);
  }

  public generate() {
    return this.config;
  }

  public addPathsFromFunctionConfig(config) {
    // loop through function configurations
    for (const funcConfig of config) {
      // loop through http events
      for (const httpEvent of this.getHttpEvents(funcConfig.events)) {
        const httpEventConfig = httpEvent.http;
        if (httpEventConfig.documentation) {
          const documentationConfig = httpEventConfig.documentation;
          // console.log(documentationConfig);
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
          merge([this.config.paths, pathConfig], { depth: 100 });
        }
      }
    }
    // console.log(JSON.stringify(this.config.paths, null, 2));
  }

  private getParametersFromConfig(documentationConfig) {
    const parameters = [];
    // Path Parameters
    if (documentationConfig.pathParams) {
      for (const parameter of documentationConfig.pathParams) {
        parameters.push({
          name: parameter.name,
          in: 'path',
          description: parameter.description,
          required: true, // Note: all path parameters must be required
          schema: parameter.schema || {},
          example: parameter.example || null,
        });
      }
    }
    // Query Parameters
    if (documentationConfig.queryParams) {
      for (const parameter of documentationConfig.queryParams) {
        parameters.push({
          name: parameter.name,
          in: 'query',
          description: parameter.description,
          required: parameter.required || false, // Note: all path parameters must be required
          schema: parameter.schema || {},
          example: parameter.example || null,
        });
      }
    }

    // Request Header Parameters
    if (documentationConfig.requestHeaders) {
      for (const parameter of documentationConfig.requestHeaders) {
        parameters.push({
          name: parameter.name,
          in: 'header',
          description: parameter.description,
          required: parameter.required || false, // Note: all path parameters must be required
          schema: parameter.schema || {},
          example: parameter.example || null,
        });
      }
    }

    return parameters;
  }

  private getRequestBodiesFromConfig(documentationConfig) {
    const requestBodies = {};
    if (documentationConfig.requestModels) {
      for (const requestModelType of Object.keys(documentationConfig.requestModels)) {
        merge([requestBodies, {
          [requestModelType]: {
            schema: {
              $ref: `#/components/schemas/${documentationConfig.requestModels[requestModelType]}`,
            },
          },
         }], { depth: 100 });
      }
    }

    return requestBodies;
  }

  private getResponsesFromConfig(documentationConfig) {
    const responses = {};
    if (documentationConfig.methodResponses) {
      for (const response of documentationConfig.methodResponses) {
        merge([responses, {
          [response.statusCode]: {
            description: response.description || `Status ${response.statusCode} Response`,
            content: this.getResponseContent(response.responseModels),
          },
         }], { depth: 100 });
      }
    }

    return responses;
  }

  private getResponseContent(response) {
    const content = {};
    for (const responseKey of Object.keys(response)) {
      merge(content, { [responseKey] : {
        schema: {
          $ref: `#/components/schemas/${response[responseKey]}`,
        },
      } });
    }
    // console.log(content);
    return content;
  }

  private getHttpEvents(funcConfig) {
    return funcConfig.filter((event) => event.http ? true : false);
  }

  private process(serviceDescriptor): any {
    const configObject = {
      openapi: '3.0.0-RC0',
      servers: [],
      info: {
        title: serviceDescriptor.summary || '',
        description: serviceDescriptor.description || '',
        version: serviceDescriptor.version || uuid.v4(),
      },
      paths: {},
      components: {
        schemas: {},
        requestBodies: {},
        responses: {},
        parameters: {},
        examples: {},
        securitySchemes: {},
      },
    };

    for (const model of serviceDescriptor.models) {
      configObject.components.schemas[model.name] = dereference(model.schema);
    }

    return configObject;
  }
}

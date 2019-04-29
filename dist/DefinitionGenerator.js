"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
const jst_1 = require("@jdw/jst");
// tslint:disable-next-line no-submodule-imports
const validate_1 = require("swagger2openapi/validate");
const uuid = require("uuid");
const utils_1 = require("./utils");
class DefinitionGenerator {
    /**
     * Constructor
     * @param serviceDescriptor IServiceDescription
     */
    constructor(config) {
        // The OpenAPI version we currently validate against
        this.version = '3.0.0';
        // Base configuration object
        this.definition = {
            openapi: this.version,
            components: {},
        };
        this.config = utils_1.clone(config);
    }
    parse() {
        const { title = '', description = '', version = uuid.v4(), servers = [], models, security = [], } = this.config;
        utils_1.merge(this.definition, {
            openapi: this.version,
            info: { title, description, version },
            servers,
            paths: {},
            components: {
                schemas: {},
                securitySchemes: security.reduce((result, s) => {
                    const { authorizerName, name } = s, rest = __rest(s, ["authorizerName", "name"]);
                    result[name] = rest;
                    return result;
                }, {}),
            },
        });
        if (utils_1.isIterable(models)) {
            for (const model of models) {
                if (!model.schema) {
                    continue;
                }
                this.definition.components.schemas[model.name] = this.cleanSchema(jst_1.dereference(model.schema));
            }
        }
        return this;
    }
    validate() {
        const payload = {};
        try {
            validate_1.validateSync(this.definition, payload);
        }
        catch (error) {
            payload.error = error.message;
        }
        return payload;
    }
    /**
     * Add Paths to OpenAPI Configuration from Serverless function documentation
     * @param config Add
     */
    readFunctions(config) {
        // loop through function configurations
        for (const funcConfig of config) {
            // loop through http events
            for (const httpEvent of this.getHttpEvents(funcConfig.events)) {
                const httpEventConfig = httpEvent.http;
                if (httpEventConfig.documentation) {
                    // Build OpenAPI path configuration structure for each method
                    const pathConfig = {
                        [`/${httpEventConfig.path}`]: {
                            [httpEventConfig.method.toLowerCase()]: this.getOperationFromConfig(funcConfig._functionName, httpEventConfig),
                        },
                    };
                    // merge path configuration into main configuration
                    utils_1.merge(this.definition.paths, pathConfig);
                }
            }
        }
    }
    /**
     * Cleans schema objects to make them OpenAPI compatible
     * @param schema JSON Schema Object
     */
    cleanSchema(schema) {
        // Clone the schema for manipulation
        const cleanedSchema = utils_1.clone(schema);
        // Strip $schema from schemas
        if (cleanedSchema.$schema) {
            delete cleanedSchema.$schema;
        }
        // Return the cleaned schema
        return cleanedSchema;
    }
    /**
     * Generate Operation objects from the Serverless Config.
     *
     * @link https://github.com/OAI/OpenAPI-Specification/blob/3.0.0/versions/3.0.0.md#operationObject
     * @param funcName
     * @param documentationConfig
     */
    getOperationFromConfig(funcName, config) {
        const documentationConfig = config.documentation;
        const operationObj = {
            operationId: funcName,
        };
        if (documentationConfig.summary) {
            operationObj.summary = documentationConfig.summary;
        }
        if (documentationConfig.description) {
            operationObj.description = documentationConfig.description;
        }
        if (documentationConfig.tags) {
            operationObj.tags = documentationConfig.tags;
        }
        if (documentationConfig.deprecated) {
            operationObj.deprecated = true;
        }
        if (documentationConfig.requestModels) {
            operationObj.requestBody = this.getRequestBodiesFromConfig(documentationConfig);
        }
        operationObj.parameters = this.getParametersFromConfig(documentationConfig);
        operationObj.responses = this.getResponsesFromConfig(documentationConfig);
        if (config.authorizer && this.config.security) {
            const security = this.config.security.find((s) => s.authorizerName === config.authorizer.name);
            if (security) {
                operationObj.security = [{ [security.name]: [] }];
            }
        }
        return operationObj;
    }
    /**
     * Derives Path, Query and Request header parameters from Serverless documentation
     * @param documentationConfig
     */
    getParametersFromConfig(documentationConfig) {
        const parameters = [];
        // Build up parameters from configuration for each parameter type
        for (const type of ['path', 'query', 'header', 'cookie']) {
            let paramBlock;
            if (type === 'path' && documentationConfig.pathParams) {
                paramBlock = documentationConfig.pathParams;
            }
            else if (type === 'query' && documentationConfig.queryParams) {
                paramBlock = documentationConfig.queryParams;
            }
            else if (type === 'header' && documentationConfig.requestHeaders) {
                paramBlock = documentationConfig.requestHeaders;
            }
            else if (type === 'cookie' && documentationConfig.cookieParams) {
                paramBlock = documentationConfig.cookieParams;
            }
            else {
                continue;
            }
            // Loop through each parameter in a parameter block and add parameters to array
            for (const parameter of paramBlock) {
                const parameterConfig = {
                    name: parameter.name,
                    in: type,
                    description: parameter.description || '',
                    required: parameter.required || false,
                };
                // if type is path, then required must be true (@see OpenAPI 3.0-RC1)
                if (type === 'path') {
                    parameterConfig.required = true;
                }
                else if (type === 'query') {
                    parameterConfig.allowEmptyValue = parameter.allowEmptyValue || false; // OpenAPI default is false
                    if ('allowReserved' in parameter) {
                        parameterConfig.allowReserved = parameter.allowReserved || false;
                    }
                }
                if ('deprecated' in parameter) {
                    parameterConfig.deprecated = parameter.deprecated;
                }
                if ('style' in parameter) {
                    parameterConfig.style = parameter.style;
                    parameterConfig.explode = parameter.explode
                        ? parameter.explode
                        : parameter.style === 'form';
                }
                if (parameter.schema) {
                    parameterConfig.schema = this.cleanSchema(parameter.schema);
                }
                if (parameter.example) {
                    parameterConfig.example = parameter.example;
                }
                else if (parameter.examples && Array.isArray(parameter.examples)) {
                    parameterConfig.examples = parameter.examples;
                }
                if (parameter.content) {
                    parameterConfig.content = parameter.content;
                }
                parameters.push(parameterConfig);
            }
        }
        return parameters;
    }
    /**
     * Derives request body schemas from event documentation configuration
     * @param documentationConfig
     */
    getRequestBodiesFromConfig(documentationConfig) {
        const requestBodies = {};
        if (!documentationConfig.requestModels) {
            throw new Error(`Required requestModels in: ${JSON.stringify(documentationConfig, null, 2)}`);
        }
        // Does this event have a request model?
        if (documentationConfig.requestModels) {
            // For each request model type (Sorted by "Content-Type")
            for (const requestModelType of Object.keys(documentationConfig.requestModels)) {
                // get schema reference information
                const requestModel = this.config.models.filter((model) => model.name === documentationConfig.requestModels[requestModelType]).pop();
                if (requestModel) {
                    const reqModelConfig = {
                        schema: {
                            $ref: `#/components/schemas/${documentationConfig.requestModels[requestModelType]}`,
                        },
                    };
                    this.attachExamples(requestModel, reqModelConfig);
                    const reqBodyConfig = {
                        content: {
                            [requestModelType]: reqModelConfig,
                        },
                    };
                    if (documentationConfig.requestBody && 'description' in documentationConfig.requestBody) {
                        reqBodyConfig.description = documentationConfig.requestBody.description;
                    }
                    utils_1.merge(requestBodies, reqBodyConfig);
                }
            }
        }
        return requestBodies;
    }
    attachExamples(target, config) {
        if (target.examples) {
            utils_1.merge(config, { examples: utils_1.clone(target.examples) });
        }
        else if (target.example) {
            utils_1.merge(config, { example: utils_1.clone(target.example) });
        }
    }
    /**
     * Gets response bodies from documentation config
     * @param documentationConfig
     */
    getResponsesFromConfig(documentationConfig) {
        const responses = {};
        if (documentationConfig.methodResponses) {
            for (const response of documentationConfig.methodResponses) {
                const methodResponseConfig = {
                    description: ((response.responseBody && 'description' in response.responseBody)
                        ? response.responseBody.description
                        : `Status ${response.statusCode} Response`),
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
                utils_1.merge(responses, {
                    [response.statusCode]: methodResponseConfig,
                });
            }
        }
        return responses;
    }
    getResponseContent(response) {
        const content = {};
        for (const responseKey of Object.keys(response)) {
            const responseModel = this.config.models.find((model) => model.name === response[responseKey]);
            if (responseModel) {
                const resModelConfig = {
                    schema: {
                        $ref: `#/components/schemas/${response[responseKey]}`,
                    },
                };
                this.attachExamples(responseModel, resModelConfig);
                utils_1.merge(content, { [responseKey]: resModelConfig });
            }
        }
        return content;
    }
    getHttpEvents(funcConfig) {
        return funcConfig.filter((event) => event.http ? true : false);
    }
}
exports.DefinitionGenerator = DefinitionGenerator;
//# sourceMappingURL=DefinitionGenerator.js.map
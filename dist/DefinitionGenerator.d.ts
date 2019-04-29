import { IDefinition, IDefinitionConfig, IServerlessFunctionConfig } from './types';
export declare class DefinitionGenerator {
    version: string;
    definition: IDefinition;
    config: IDefinitionConfig;
    /**
     * Constructor
     * @param serviceDescriptor IServiceDescription
     */
    constructor(config: IDefinitionConfig);
    parse(): this;
    validate(): {
        valid: boolean;
        context: string[];
        warnings: any[];
        error?: any[];
    };
    /**
     * Add Paths to OpenAPI Configuration from Serverless function documentation
     * @param config Add
     */
    readFunctions(config: IServerlessFunctionConfig[]): void;
    /**
     * Cleans schema objects to make them OpenAPI compatible
     * @param schema JSON Schema Object
     */
    private cleanSchema;
    /**
     * Generate Operation objects from the Serverless Config.
     *
     * @link https://github.com/OAI/OpenAPI-Specification/blob/3.0.0/versions/3.0.0.md#operationObject
     * @param funcName
     * @param documentationConfig
     */
    private getOperationFromConfig;
    /**
     * Derives Path, Query and Request header parameters from Serverless documentation
     * @param documentationConfig
     */
    private getParametersFromConfig;
    /**
     * Derives request body schemas from event documentation configuration
     * @param documentationConfig
     */
    private getRequestBodiesFromConfig;
    private attachExamples;
    /**
     * Gets response bodies from documentation config
     * @param documentationConfig
     */
    private getResponsesFromConfig;
    private getResponseContent;
    private getHttpEvents;
}

import { ILog } from './types';
export declare class ServerlessOpenApiDocumentation {
    hooks: any;
    commands: any;
    /** Serverless Instance */
    private serverless;
    /** CLI options */
    private options;
    /** Serverless Service Custom vars */
    private customVars;
    /**
     * Constructor
     * @param serverless
     * @param options
     */
    constructor(serverless: any, options: any);
    log: ILog;
    /**
     * Processes CLI input by reading the input from serverless
     * @returns config IConfigType
     */
    private processCliInput();
    /**
     * Generates OpenAPI Documentation based on serverless configuration and functions
     */
    private generate();
}

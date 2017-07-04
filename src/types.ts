
export interface IModels {
  name: string;
  description: string;
  contentType: string;
  schema: object | any[];
  examples: any[];
  example: object;
}

export interface IDefinitionConfig {
  title: string;
  description: string;
  version?: string;
  models: IModels[];
}

export interface IDefinitionType {
  file: string;
  format: 'yaml' | 'json';
  indent: number;
}

export interface IServerlessFunctionConfig {
  _functionName: string;
  handler: string;
  description?: string;
  environment?: object;
  events?: any[];
}

export interface IParameterConfig {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  description: string;
  required?: boolean;
  schema?: object;
  deprecated?: boolean;
  allowEmptyValues?: boolean;
  style?: 'form' | 'simple';
  explode?: boolean;
  allowReserved?: boolean;
  example?: any;
  examples?: [any];
}

export type ILog = (...str: string[]) => void;

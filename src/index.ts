import * as fs from 'fs';
import * as YAML from 'js-yaml';
import { merge } from 'lutils';
import DocumentGenerator from './generate';

class ServerlessOpenAPIDocumentation {
  public hooks;
  public commands;
  private serverless;
  private options;
  private provider;
  private customVars;
  private getMethodLogicalId;
  private normalizePath;

  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.provider = 'aws';

    this.customVars = this.serverless.variables.service.custom;
    const naming = this.serverless.providers.aws.naming;
    this.getMethodLogicalId = naming.getMethodLogicalId.bind(naming);
    this.normalizePath = naming.normalizePath.bind(naming);

    this.commands = {
      openapi: {
        commands: {
          generate: {
            lifecycleEvents: [
              'serverless',
            ],
            usage: 'Generate OpenAPI v3 Documentation',
            options: {
              output: {
                usage: 'Output file location [default: openapi.yml|json]',
                shortcut: 'o',
              },
              format: {
                usage: 'OpenAPI file format (yml|json) [default: yml]',
                shortcut: 'f',
              },
              indent: {
                usage: 'File indentation in spaces[default: 2]',
                shortcut: 'i',
              },
            },
          },
        },
      },
    };

    this.hooks = {
      // 'before:deploy:deploy': this.beforeDeploy.bind(this),
      // 'after:deploy:deploy': this.afterDeploy.bind(this),
      'openapi:generate:serverless': this.beforeDeploy.bind(this),
    };
  }

  private beforeDeploy(e) {
    const indent = this.serverless.processedInput.options.indent || 2;
    const outputFormat = this.serverless.processedInput.options.format || 'yaml';

    if (['yaml', 'json'].indexOf(outputFormat.toLowerCase()) < 0) {
      throw new Error('Invalid Output Format Specified - must be one of "yaml" or "json"');
    }

    let outputFile = this.serverless.processedInput.options.output;

    const dg = new DocumentGenerator(this.customVars.documentation);

    const funcConfigs = this.serverless.service.getAllFunctions().map((functionName) => {
      const func = this.serverless.service.getFunction(functionName);
      return merge([{ _functionName: functionName }, func], { depth: 100 });
    });

    dg.addPathsFromFunctionConfig(funcConfigs);

    const outputObject = dg.generate();

    let outputContent = '';
    switch (outputFormat.toLowerCase()) {
      case 'json':
        if (!outputFile) {
          outputFile = 'openapi.json';
        }
        outputContent = JSON.stringify(outputObject, null, indent);
        break;
      case 'yaml':
      default:
        if (!outputFile) {
          outputFile = 'openapi.yml';
        }
        outputContent = YAML.safeDump(outputObject, { indent });
        break;
    }

    fs.writeFileSync(outputFile, outputContent);
  }

  private afterDeploy() {
    console.log('bye');
  }
}

module.exports = ServerlessOpenAPIDocumentation;

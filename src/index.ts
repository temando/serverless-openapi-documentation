import * as DocumentGenerator from './generate';

class ServerlessOpenAPIDocumentation {
  public hooks;
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

    this.hooks = {
      'before:deploy:deploy': this.beforeDeploy.bind(this),
      'after:deploy:deploy': this.afterDeploy.bind(this),
    };
  }

  private beforeDeploy() {
    const dg = new DocumentGenerator(this.customVars.documentation);

    const funcConfigs = this.serverless.service.getAllFunctions().map((functionName) => {
      const func = this.serverless.service.getFunction(functionName);
      console.log(func.events);
      return func;
    });

    return Promise.reject(new Error('fuck'));
  }

  private afterDeploy() {
    console.log('bye');
  }
}

module.exports = ServerlessOpenAPIDocumentation;

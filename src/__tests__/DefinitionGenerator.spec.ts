import * as path from 'path';
import * as Serverless from 'serverless';
import { DefinitionGenerator } from '../DefinitionGenerator';
import { merge } from '../utils';

class ServerlessInterface extends Serverless {
  public service: any = {};
  public config: any = {};
  public yamlParser: any = {};
  public pluginManager: any = {};
  public variables: any = {};
}

describe('OpenAPI Documentation Generator', () => {
  it('Generates OpenAPI document', async () => {
    const servicePath = path.join(__dirname, '../../test/project');
    const serverlessYamlPath = path.join(servicePath, './serverless.yml');
    const sls: ServerlessInterface = new Serverless();

    sls.config.update({
      servicePath,
    });

    const config = await sls.yamlParser.parse(serverlessYamlPath);
    expect(config).not.toBeNull();
    sls.pluginManager.cliOptions = { stage: 'dev' };

    await sls.service.load(config);
    await sls.variables.populateService();

    if ('documentation' in sls.service.custom) {
      const docGen = new DefinitionGenerator(sls.service.custom.documentation);
      docGen.parse();
       // Map function configurations
      const funcConfigs = sls.service.getAllFunctions().map((functionName) => {
        const func = sls.service.getFunction(functionName);
        return merge({ _functionName: functionName }, func);
      });

      // Add Paths to OpenAPI Output from Function Configuration
      docGen.readFunctions(funcConfigs);

      expect(docGen.definition).not.toBeNull();
      expect(docGen.definition).toMatchSnapshot();
    } else {
      throw new Error('Cannot find "documentation" in custom section of "serverless.yml"');
    }
  });
});

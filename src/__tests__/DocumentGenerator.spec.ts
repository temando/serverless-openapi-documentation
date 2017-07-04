import * as path from 'path';
import * as Serverless from 'serverless';
import { DocumentGenerator } from '../DocumentGenerator';

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
    sls.pluginManager.cliOptions = { stage: 'dev' };

    await sls.service.load(config);
    await sls.variables.populateService();

    if ('documentation' in sls.service.custom) {
      const docGen = new DocumentGenerator(sls.service.custom.documentation);

      expect(docGen).not.toBeNull();
    } else {
      throw new Error('Cannot find "documentation" in custom section of "serverless.yml"');
    }
  });
});

import * as fs from 'fs-extra';
import * as path from 'path';
import * as Serverless from 'serverless';
import DocumentGenerator from '../src/generate';

class ServerlessInterface extends Serverless {
  public service: any = {};
  public config: any = {};
  public yamlParser: any = {};
  public pluginManager: any = {};
  public variables: any = {};
}

describe('OpenAPI Documentation Generator', () => {
  it('Generates OpenAPI document', async () => {
    const serverlessConfig = await fs.readFile('test/fixtures/serverless.yml');
    const sls: ServerlessInterface = new Serverless();
    sls.config.update({
      servicePath: path.join(process.cwd(), 'test/fixtures'),
    });
    const config = await sls.yamlParser.parse(path.join(process.cwd(), 'test/fixtures/serverless.yml'));
    sls.pluginManager.cliOptions = { stage: 'dev' };
    await sls.service.load(config);
    sls.variables.populateService({});

    if ('documentation' in sls.service.custom) {
      const docGen = new DocumentGenerator(sls.service.custom.documentation);
    } else {
      throw new Error('Cannot find "documentation" in custom section of "serverless.yml"');
    }
  });
});

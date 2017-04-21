import * as fs from 'fs-promise';
import * as path from 'path';
import * as Serverless from 'serverless';
import DocumentGenerator from '../src/generate';

class ServerlessInterface extends Serverless {
  public service: any = {};
}

describe('OpenAPI Documentation Generator', () => {
  it('Generates OpenAPI document', async () => {
    const serverlessConfig = await fs.readFile('test/fixtures/serverless.yml');
    // console.log(serverlessConfig.toString());
    // const fuck = yaml.safeLoad(serverlessConfig.toString());
    // console.log(JSON.stringify(fuck, null, 2));
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

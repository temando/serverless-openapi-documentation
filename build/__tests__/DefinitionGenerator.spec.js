"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const Serverless = require("serverless");
const DefinitionGenerator_1 = require("../DefinitionGenerator");
class ServerlessInterface extends Serverless {
    constructor() {
        super(...arguments);
        this.service = {};
        this.config = {};
        this.yamlParser = {};
        this.pluginManager = {};
        this.variables = {};
    }
}
describe('OpenAPI Documentation Generator', () => {
    it('Generates OpenAPI document', () => __awaiter(this, void 0, void 0, function* () {
        const servicePath = path.join(__dirname, '../../test/project');
        const serverlessYamlPath = path.join(servicePath, './serverless.yml');
        const sls = new Serverless();
        sls.config.update({
            servicePath,
        });
        const config = yield sls.yamlParser.parse(serverlessYamlPath);
        sls.pluginManager.cliOptions = { stage: 'dev' };
        yield sls.service.load(config);
        yield sls.variables.populateService();
        if ('documentation' in sls.service.custom) {
            const docGen = new DefinitionGenerator_1.DefinitionGenerator(sls.service.custom.documentation);
            expect(docGen).not.toBeNull();
        }
        else {
            throw new Error('Cannot find "documentation" in custom section of "serverless.yml"');
        }
    }));
});
//# sourceMappingURL=DefinitionGenerator.spec.js.map
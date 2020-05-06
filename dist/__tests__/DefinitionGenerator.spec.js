"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const Serverless = require("serverless");
const DefinitionGenerator_1 = require("../DefinitionGenerator");
const utils_1 = require("../utils");
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
    it('Generates OpenAPI document', () => __awaiter(void 0, void 0, void 0, function* () {
        const servicePath = path.join(__dirname, '../../test/project');
        const serverlessYamlPath = path.join(servicePath, './serverless.yml');
        const sls = new Serverless();
        sls.config.update({
            servicePath,
        });
        const config = yield sls.yamlParser.parse(serverlessYamlPath);
        expect(config).not.toBeNull();
        sls.pluginManager.cliOptions = { stage: 'dev' };
        yield sls.service.load(config);
        yield sls.variables.populateService();
        if ('documentation' in sls.service.custom) {
            const docGen = new DefinitionGenerator_1.DefinitionGenerator(sls.service.custom.documentation);
            docGen.parse();
            // Map function configurations
            const funcConfigs = sls.service.getAllFunctions().map((functionName) => {
                const func = sls.service.getFunction(functionName);
                return utils_1.merge({ _functionName: functionName }, func);
            });
            // Add Paths to OpenAPI Output from Function Configuration
            docGen.readFunctions(funcConfigs);
            expect(docGen.definition).not.toBeNull();
            expect(docGen.definition).toMatchSnapshot();
        }
        else {
            throw new Error('Cannot find "documentation" in custom section of "serverless.yml"');
        }
    }));
});
//# sourceMappingURL=DefinitionGenerator.spec.js.map
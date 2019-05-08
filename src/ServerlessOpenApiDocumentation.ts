import chalk from "chalk";
import * as fs from "fs";
import * as YAML from "js-yaml";
import _ = require("lodash");
import * as Serverless from "serverless";
import { inspect } from "util";

import { DefinitionGenerator } from "./DefinitionGenerator";
import { Format, DefinitionConfig, DefinitionType, ILog } from "./types";

interface Options {
  indent: number;
  format: Format;
  output: string;
}

interface ProcessedInput {
  options: Options;
}

interface CustomVars {
  documentation: DefinitionConfig;
}

interface Service {
  custom: CustomVars;
}

interface Variables {
  service: Service;
}

interface FullServerless extends Serverless {
  variables: Variables;
  processedInput: ProcessedInput;
}

export class ServerlessOpenApiDocumentation {
  public hooks;
  public commands;
  /** Serverless Instance */
  private serverless: FullServerless;

  /** Serverless Service Custom vars */
  private customVars: CustomVars;

  /**
   * Constructor
   * @param serverless
   * @param options
   */
  public constructor(serverless: FullServerless, options) {
    // pull the serverless instance into our class vars
    this.serverless = serverless;
    // Serverless service custom variables
    this.customVars = this.serverless.variables.service.custom;

    // Declare the commands this plugin exposes for the Serverless CLI
    this.commands = {
      openapi: {
        commands: {
          generate: {
            lifecycleEvents: ["serverless"],
            usage: "Generate OpenAPI v3 Documentation",
            options: {
              output: {
                usage: "Output file location [default: openapi.yml|json]",
                shortcut: "o"
              },
              format: {
                usage: "OpenAPI file format (yml|json) [default: yml]",
                shortcut: "f"
              },
              indent: {
                usage: "File indentation in spaces [default: 2]",
                shortcut: "i"
              }
            }
          }
        }
      }
    };

    // Declare the hooks our plugin is interested in
    this.hooks = {
      "openapi:generate:serverless": this.generate.bind(this)
    };
  }

  private log: ILog = (...str: Array<string>) => {
    process.stdout.write(str.join(" "));
  };

  /**
   * Generates OpenAPI Documentation based on serverless configuration and functions
   */
  public async generate() {
    this.log(chalk.bold.underline("OpenAPI v3 Documentation Generator\n\n"));
    // Instantiate DocumentGenerator
    const generator = new DefinitionGenerator(
      this.customVars.documentation,
      this.serverless.config.servicePath
    );

    await generator.parse();

    // Map function configurations
    const funcConfigs = this.serverless.service
      .getAllFunctions()
      .map(functionName => {
        const func = this.serverless.service.getFunction(functionName);
        return _.merge({ _functionName: functionName }, func);
      });

    // Add Paths to OpenAPI Output from Function Configuration
    generator.readFunctions(funcConfigs);

    // Process CLI Input options
    const config = this.processCliInput();

    this.log(
      `${chalk.bold.yellow(
        "[VALIDATION]"
      )} Validating OpenAPI generated output\n`
    );

    const validation = generator.validate();

    if (validation.valid) {
      this.log(
        `${chalk.bold.green("[VALIDATION]")} OpenAPI valid: ${chalk.bold.green(
          "true"
        )}\n\n`
      );
    } else {
      this.log(
        `${chalk.bold.red(
          "[VALIDATION]"
        )} Failed to validate OpenAPI document: \n\n`
      );
      this.log(
        `${chalk.bold.green("Context:")} ${JSON.stringify(
          validation.context,
          null,
          2
        )}\n`
      );

      if (typeof validation.error === "string") {
        this.log(`${validation.error}\n\n`);
      } else {
        for (const info of validation.error) {
          this.log(chalk.grey("\n\n--------\n\n"));
          this.log(" ", chalk.blue(info.dataPath), "\n");
          this.log(" ", info.schemaPath, chalk.bold.yellow(info.message));
          this.log(chalk.grey("\n\n--------\n\n"));
          this.log(`${inspect(info, { colors: true, depth: 2 })}\n\n`);
        }
      }
    }

    const { definition } = generator;

    // Output the OpenAPI document to the correct format

    let output;
    switch (config.format.toLowerCase()) {
      case "json":
        output = JSON.stringify(definition, null, config.indent);
        break;
      case "yaml":
      default:
        output = YAML.safeDump(definition, { indent: config.indent });
        break;
    }

    fs.writeFileSync(config.file, output);

    this.log(
      `${chalk.bold.green("[OUTPUT]")} To "${chalk.bold.red(config.file)}"\n`
    );
  }

  /**
   * Processes CLI input by reading the input from serverless
   * @returns config IConfigType
   */
  private processCliInput(): DefinitionType {
    const config: DefinitionType = {
      format: Format.yaml,
      file: "openapi.yml",
      indent: 2
    };

    config.indent = this.serverless.processedInput.options.indent || 2;
    config.format =
      this.serverless.processedInput.options.format || Format.yaml;

    if ([Format.yaml, Format.json].indexOf(config.format) < 0) {
      throw new Error(
        'Invalid Output Format Specified - must be one of "yaml" or "json"'
      );
    }

    config.file =
      this.serverless.processedInput.options.output ||
      (config.format === "yaml" ? "openapi.yml" : "openapi.json");

    this.log(
      `${chalk.bold.green("[OPTIONS]")}`,
      `format: "${chalk.bold.red(config.format)}",`,
      `output file: "${chalk.bold.red(config.file)}",`,
      `indentation: "${chalk.bold.red(String(config.indent))}"\n\n`
    );

    return config;
  }
}

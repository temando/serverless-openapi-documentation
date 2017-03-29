import { merge } from 'lutils';

type ServiceDescriptionType = {
  description: string,
  version: string,
  summary: string,
  termsOfService?: string,
  contact?: {
    name?: string,
    email?: string,
    url?: string,
  },
  license?: {
    name: string,
    url: string,
  },
};

export default class DocumentGenerator {
  private config: ServiceDescriptionType = {
    description: '',
    version: '0.0.0',
    summary: '',
  };

  constructor(serviceDescriptor: ServiceDescriptionType) {
    merge([this.config, serviceDescriptor], { depth: 32 });
  }

  public generate() {
    return {
      openapi: '3.0.0-RC0',
      servers: this.getServers(),
      info: {
        description: this.getDescription(),
        version: this.getVersion(),
        title: this.getTitle(),
        termsOfService: this.getTermsOfService(),
      },
      tags: this.getTags(),
      paths: {},
      components: {
        schemas: this.getSchemas(),
        requestBodies: {},
        responses: {},
        parameters: {},
        examples: {},
        securitySchemes: {},
      },
    };
  }

  private getDescription() {
    return this.config.description;
  }

  private getSchemas() {
    return {};
  }

  private getServers() {
    return [{ url: 'nothing' }];
  }

  private getTermsOfService() {
    return this.config.termsOfService;
  }

  private getTags() {
    return [];
  }

  private getTitle() {
    return this.config.summary;
  }

  private getVersion() {
    return this.config.version;
  }

}

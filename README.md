# Serverless OpenAPI Documentation Plugin

[![NPM](https://img.shields.io/npm/v/serverless-openapi-documentation.svg)](https://npmjs.org/packages/serverless-openapi-documentation/)
[![Travis CI](https://img.shields.io/travis/temando/serverless-openapi-documentation.svg)](https://travis-ci.org/temando/serverless-openapi-documentation)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

Generates [**OpenAPI 3.0.0**](https://github.com/OAI/OpenAPI-Specification/blob/3.0.0/versions/3.0.0.md) documentation from serverless configuration files. OpenAPI is formerly known as Swagger. The configuration is inspired by the format used in [serverless-aws-documentation](https://www.npmjs.com/package/serverless-aws-documentation).

Works well with [Lincoln OpenAPI Renderer](https://github.com/temando/open-api-renderer).

---

- [Usage](#usage)
  - [Options](#options)
  - [Configuration](#configuration)
    - [Models](#models)
    - [Functions](#functions)
    - [`queryParams`](#queryparams)
    - [`pathParams`](#pathparams)
    - [`cookieParams`](#cookieparams)
    - [`requestModels`](#requestmodels)
    - [`methodResponses`](#methodresponses)
- [Example Configuration](#example-configuration)
- [Install](#install)

---

## Usage

This plugin requires additional configuration to use, see the "[Configuration](#configuration)" section for how to configure the plugin to generate documentation.

Below are the commandline options to run the generator:

```bash
serverless openapi generate [options]
```

### Options

```bash
Plugin: ServerlessOpenAPIDocumentation
openapi generate  ...................... Generate OpenAPI v3 Documentation
    --output / -o ...................... Output file location [default: openapi.yml|json]
    --format / -f ...................... OpenAPI file format (yml|json) [default: yml]
    --indent / -i ...................... File indentation in spaces [default: 2]
    --help / -h   ...................... Help
```

### Configuration

To configure this plugin to generate valid OpenAPI documentation there are two places you'll need to modify in your `serverless.yml` file, the `custom` variables section and the `http` event section for each given function in your service.

This plugin is compatible with the same documentation configuration structure in [serverless-aws-documentation](https://www.npmjs.com/package/serverless-aws-documentation) and can run beside it.

The `custom` section of your `serverless.yml` can be configured as below:

```yml
custom:
  documentation:
    version: '1'
    title: 'My API'
    description: 'This is my API'
    models: {}
```

These configurations can be quite verbose; you can separate it out into it's own file, such as `serverless.doc.yml` as below:

```yml
custom:
  documentation: ${file(serverless.doc.yml):documentation}

functions:
  myFunc:
    events:
      - http:
          path: getStuff
          method: get
          documentation: ${file(serverless.doc.yml):endpoints.myFunc}
```

For more info on `serverless.yml` syntax, see their docs.

#### Models

Models contain additional information that you can use to define schemas for endpoints.  You must define the *content type* for each schema that you provide in the models.

The *required* directives for the models section are as follow:

* `name`: the name of the schema
* `description`: a description of the schema
* `contentType`: the content type of the described request/response (ie. `application/json` or `application/xml`).
* `schema`: The JSON Schema ([website](http://json-schema.org/)) that describes the model. You can either use inline `YAML` to define these, or refer to an external schema file as below

```yml
custom:
  documentation:
    models:
      - name: "ErrorResponse"
        description: "This is an error"
        contentType: "application/json"
        schema: ${file(models/ErrorResponse.json)}
      - name: "PutDocumentResponse"
        description: "PUT Document response model (external reference example)"
        contentType: "application/json"
        schema: ${file(models/PutDocumentResponse.json)}
      - name: "PutDocumentRequest"
        description: "PUT Document request model (inline example)"
        contentType: "application/json"
        schema:
          $schema: "http://json-schema.org/draft-04/schema#"
          properties:
            SomeObject:
              type: "object"
              properties:
                SomeAttribute:
                  type: "string"
```

#### Functions

To define the documentation for a given function event, you need to create a `documentation` attribute for your http event in your `serverless.yml` file.

The `documentation` section of the event configuration can contain the following attributes:

* `summary`: a short description of the method
* `description`: a detailed description of the method
* `tags`: an array of tags for this event
* `deprecated`: boolean indicator that indicates clients should migrate away from this function
* `requestBody`: contains description of the request
    * `description`: a description of the request body
* `requestModels`: a list of models to describe the request bodies (see [requestModels](#requestmodels) below)
* `queryParams`: a list of query parameters (see [queryParams](#queryparams) below)
* `pathParams`: a list of path parameters (see [pathParams](#pathparams) below)
* `cookieParams`: a list of cookie parameters (see [cookieParams](#cookieparams) below)
* `methodResponses`: an array of response models and applicable status codes
  * `statusCode`: applicable http status code (ie. 200/404/500 etc.)
  * `responseBody`: contains description of the response
    * `description`: a description of the body response
  * `responseHeaders`: a list of response headers (see [responseHeaders](#responseheaders) below)
  * `responseModels`: a list of models to describe the request bodies (see [responseModels](#responsemodels) below) for each `Content-Type`

```yml
functions:
  createUser:
    handler: "handler.create"
    events:
      - http:
        path: "create"
        method: "post"
        documentation:
          summary: "Create User"
          description: "Creates a user and then sends a generated password email"
          requestBody:
            description: "A user information object"
          requestModels:
            application/json: "PutDocumentRequest"
          pathParams:
            - name: "username"
              description: "The username for a user to create"
              schema:
                type: "string"
                pattern: "^[-a-z0-9_]+$"
          queryParams:
            - name: "membershipType"
              description: "The user's Membership Type"
              schema:
                type: "string"
                enum:
                  - "premium"
                  - "standard"
          cookieParams:
            - name: "SessionId"
              description: "A Session ID variable"
              schema:
                type: "string"
          methodResponses:
            - statusCode: 201
              responseBody:
                description: "A user object along with generated API Keys"
              responseModels:
                application/json: "PutDocumentResponse"
            - statusCode: 500
              responseBody:
                description: "An error message when creating a new user"
              responseModels:
                application/json: "ErrorResponse"
```

#### `queryParams`

Query parameters can be described as follow:

* `name`: the name of the query variable
* `description`: a description of the query variable
* `required`: whether the query parameter is mandatory (boolean)
* `schema`: JSON schema (inline or file)

```yml
queryParams:
  - name: "filter"
    description: "The filter parameter"
    required: true
    schema:
      type: "string"
```

#### `pathParams`

Path parameters can be described as follow:

* `name`: the name of the query variable
* `description`: a description of the query variable
* `schema`: JSON schema (inline or file)

```yml
pathParams:
  - name: "usernameId"
    description: "The usernameId parameter"
    schema:
      type: "string"
```

#### `cookieParams`

Cookie parameters can be described as follow:

* `name`: the name of the query variable
* `description`: a description of the query variable
* `required`: whether the query parameter is mandatory (boolean)
* `schema`: JSON schema (inline or file)

```yml
cookieParams:
  - name: "sessionId"
    description: "The sessionId parameter"
    required: true
    schema:
      type: "string"
```

#### `requestModels`

The `requestModels` property allows you to define models for the HTTP Request of the function event. You can define a different model for each different `Content-Type`. You can define a reference to the relevant request model named in the `models` section of your configuration (see [Defining Models](#models) section).

```yml
requestModels:
  application/json: "CreateRequest"
  application/xml: "CreateRequestXML"
```

#### `methodResponses`

You can define the response schemas by defining properties for your function event.

For an example of a `methodResponses` configuration for an event see below:

```yml
methodResponse:
  - statusCode: 200
    responseHeaders:
      - name: "Content-Type"
        description: "Content Type header"
        schema:
          type: "string"
    responseModels:
      application/json: "CreateResponse"
      application/xml: "CreateResponseXML"
```

##### `responseModels`

The `responseModels` property allows you to define models for the HTTP Response of the function event. You can define a different model for each different `Content-Type`. You can define a reference to the relevant response model named in the `models` section of your configuration (see [Defining Models](#models) section).

```yml
responseModels:
  application/json: "CreateResponse"
  application/xml: "CreateResponseXML"
```

##### `responseHeaders` and `requestHeaders`

The `responseHeaders/requestHeaders` section of the configuration allows you to define the HTTP headers for the function event.

The attributes for a header are as follow:

* `name`: the name of the HTTP Header
* `description`: a description of the HTTP Header
* `schema`: JSON schema (inline or file)

```yml
responseHeaders:
  - name: "Content-Type"
    description: "Content Type header"
    schema:
      type: "string"
requestHeaders:
  - name: "Content-Type"
    description: "Content Type header"
    schema:
      type: "string"
```

## Example configuration

Please view the example [serverless.yml](test/project/serverless.yml).

## Install

This plugin works for Serverless 1.x and up. Serverless 0.5 is not supported.

To add this plugin to your package.json:

**Using npm:**
```bash
npm install serverless-openapi-documentation --save-dev
```

**Using Yarn:**
```bash
yarn add serverless-openapi-documentation --dev
```

Next you need to add the plugin to the `plugins` section of your `serverless.yml` file.

```yml
plugins:
  - serverless-openapi-documentation
```

You can confirm the plugin is correctly installed by running:

```bash
serverless | grep -i "ServerlessOpenAPIDocumentation"
```

It should return `ServerlessOpenAPIDocumentation` as one of the plugins on the list.

> Note: Add this plugin _after_ `serverless-offline` to prevent issues with `String.replaceAll` being overridden incorrectly.

## License

MIT

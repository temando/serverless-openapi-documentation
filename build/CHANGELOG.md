# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.0][] - 2018-04-04

- Various changes

## [0.3.0][] - 2017-08-30

### Changed

- Plugin now generates OpenAPI documentation with a version of `3.0.0` instead of `3.0.0-RC2`.
- Operation now supports `deprecated` and `tags` properties.
- Parameters now support the `content` property.
- Updated various build dependencies.
- OpenAPI definition will now be smaller in most cases, choosing to omit optional properties instead of using empty defaults.

### Fixed

- Handle when `models` is not iterable.
- Handle when `models` have no `schema`.
- Always lowercase the HTTP method to conform to OpenAPI spec.

## [v0.2.1] - 2017-07-07

Last release prior to CHANGELOG being added.


[Unreleased]: https://github.com/temando/serverless-openapi-documentation/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/temando/serverless-openapi-documentation/compare/v0.4.0...v0.4.0
[0.4.0]: https://github.com/temando/serverless-openapi-documentation/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/temando/serverless-openapi-documentation/tree/v0.3.0

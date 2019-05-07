#!/bin/bash


npm run build:link \
  && cd test/project \
  && npm i \
  && npm link serverless-openapi-documentation

#!/bin/bash


yarn build:link \
  && cd test/project \
  && yarn \
  && yarn link serverless-openapi-documentation

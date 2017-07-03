#!/bin/bash

# Clean
rm -rf dist
mkdir dist

# Copy latent, belonging to the index module
rsync -am . ./dist  --exclude '*/*' --include '*' 

# Copy latent files from source, recursively
rsync -am  ./src/* ./dist --exclude '*.ts'

# Build typescript
yarn tsc





#!/bin/bash

# Clean
rm -rf build
mkdir build

# Copy latent, belonging to the index module
rsync -am . ./build  --exclude '*/*' --include '*'

# Copy latent files from source, recursively
rsync -am  ./src/* ./build --exclude '*.ts'

# Build typescript
./node_modules/.bin/tsc

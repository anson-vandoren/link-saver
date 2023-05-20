#!/bin/bash
trap 'echo "Interrupt signal received, exiting."; exit 1;' INT

npm ci

mkdir -p ./data

node scripts/build-prod.mjs

exec node_modules/.bin/tsx src/index.ts
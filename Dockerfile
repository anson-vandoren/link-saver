FROM node:18.12.1-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev
COPY src/ ./src/
COPY ui/ ./ui/
COPY scripts/ ./scripts/

RUN node scripts/build-prod.mjs

CMD ["node_modules/.bin/tsx", "src/index.ts"]
FROM node:18.12.1-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev
COPY src/ ./src/
COPY ui/ ./ui/
COPY scripts/ ./scripts/

RUN npm run build-prod

CMD ["node", "dist/index.cjs"]
FROM node:18

WORKDIR /app

COPY package*.json start.sh ./
COPY src/ ./src/
COPY ui/ ./ui/
COPY scripts/ ./scripts/

RUN chmod +x ./start.sh

ENTRYPOINT [ "./start.sh" ]
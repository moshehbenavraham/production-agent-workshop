FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run check

ENV PORT=3000
ENV EVENT_LOG_PATH=/app/data/events.jsonl

VOLUME ["/app/data"]
EXPOSE 3000

CMD ["npm", "start"]

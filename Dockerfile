FROM node:24-alpine

RUN npm install --global npm@12.0.2

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

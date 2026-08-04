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

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/health').then(async (response) => { const body = await response.json(); if (!response.ok || body.status !== 'ok') process.exit(1); }).catch(() => process.exit(1))"

CMD ["npm", "start"]

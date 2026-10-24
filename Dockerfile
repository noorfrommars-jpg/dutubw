FROM node:20-bullseye-slim

WORKDIR /app

# Install build dependencies for better-sqlite3 native compilation
RUN apt-get update && apt-get install -y python3 make g++ gcc && rm -rf /var/lib/apt/lists/*

COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install --production

WORKDIR /app
COPY server ./server

ENV PORT=5000
ENV NODE_ENV=production

EXPOSE 5000

CMD ["node", "server/src/server.js"]

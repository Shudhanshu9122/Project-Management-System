FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Dependencies first so a source change does not invalidate the install layer.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --chown=node:node db ./db
COPY --chown=node:node src ./src

# The API only reads from disk at startup, so it does not need to run as root.
USER node

EXPOSE 4000

CMD ["node", "src/server.js"]

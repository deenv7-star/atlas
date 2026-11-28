# Atlas — Express API image (server/) + Vite build context.
# The image runs the Express server (`npm run dev` -> node server/index.js),
# which listens on PORT (default 3001, see server/config/env.js).
# It does NOT build or run backend/ (Fastify/Prisma scaffold — FROZEN, see backend/DEPRECATED.md).
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
# package-lock.json exists at the repo root, so use npm ci for a reproducible install.
RUN npm ci
COPY . .
# NOTE: no `npx prisma generate` here — @prisma/client is not a dependency of this
# image (the Express server talks to Postgres via `pg` directly). The old step
# always failed because the package is not installed.
EXPOSE 3001
CMD ["npm", "run", "dev"]

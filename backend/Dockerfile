# syntax=docker/dockerfile:1
# Backend (NestJS) — multi-stage build → small Node runtime image.
# See docs/14-docker-deployment.md for the full explanation.

# ── Stage 1: install all deps (incl. dev) & build ────────────────
FROM node:20-alpine AS build
WORKDIR /app
# Copy manifests first so the install layer caches until deps change
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build            # → dist/

# ── Stage 2: production dependencies only ────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ── Stage 3: minimal runtime ─────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps  /app/node_modules ./node_modules
COPY --from=build /app/dist          ./dist
COPY package*.json ./
# Run as the non-root user the node image already provides
USER node
EXPOSE 4000
CMD ["node", "dist/main.js"]

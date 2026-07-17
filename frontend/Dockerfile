# syntax=docker/dockerfile:1
# Frontend (Vite + React) — build the static bundle, serve it with Nginx.
# NOTE: VITE_* vars are baked in at BUILD time — pass them as build args.
# See docs/14-docker-deployment.md for the full explanation.

# ── Stage 1: build the static bundle ─────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Vite reads VITE_* at build time
ARG VITE_API_URL
ARG VITE_WS_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL
RUN npm run build            # → dist/

# ── Stage 2: serve with Nginx ────────────────────────────────────
FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

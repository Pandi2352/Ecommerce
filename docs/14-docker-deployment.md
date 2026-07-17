# 14 · Docker & Deployment Guide

A practical guide to containerizing and deploying this project. The **frontend
(`frontend/`)** and **backend (`backend/`)** are packaged as **separate images** and
**deployed independently** — the frontend as a static site served by Nginx, the
backend as a Node process, and MongoDB as a managed service (Atlas) or its own
container.

> New to Docker? Read the [primer](#1-docker-in-5-minutes) first, then the
> per-service sections, then the [command reference](#7-command-reference).

## Contents

1. [Docker in 5 minutes](#1-docker-in-5-minutes)
2. [Why separate images](#2-why-separate-images)
3. [Files in this repo](#3-files-in-this-repo)
4. [Backend image (`backend/Dockerfile`)](#4-backend-image-backenddockerfile)
5. [Frontend image (`frontend/Dockerfile`)](#5-frontend-image-frontenddockerfile)
6. [Local orchestration (`docker-compose.yml`)](#6-local-orchestration-docker-composeyml)
7. [Command reference](#7-command-reference)
8. [Environment variables in Docker](#8-environment-variables-in-docker)
9. [Deploying separately](#9-deploying-separately)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Docker in 5 minutes

| Term | What it means |
|------|---------------|
| **Image** | A read-only, layered snapshot of an app + its dependencies + runtime. A blueprint. |
| **Container** | A running instance of an image. You can run many from one image. |
| **Dockerfile** | The recipe that builds an image, step by step. |
| **Layer** | Each Dockerfile instruction creates a cached layer. Order matters: put rarely-changing steps first so rebuilds are fast. |
| **Multi-stage build** | Use a big "builder" stage to compile, then copy only the output into a tiny final image. Keeps images small and secure. |
| **Registry** | Where images are stored/shared (Docker Hub, GHCR, ECR). `push` to upload, `pull` to download. |
| **Volume** | Persistent storage that outlives a container (e.g. MongoDB data). |
| **Network** | A private bridge so containers can reach each other by name. |
| **`.dockerignore`** | Like `.gitignore` — keeps junk (node_modules, .env) out of the build context. |

**The mental model:** `Dockerfile` → (`docker build`) → **image** → (`docker run`) →
**container**. Ship images to a **registry**; production pulls and runs them.

---

## 2. Why separate images

- **Independent scaling & deploys.** The API and the static frontend have different
  runtimes, scaling needs, and release cadences. Separate images let you deploy one
  without touching the other.
- **Right tool per service.** Frontend = static files behind **Nginx** (tiny, fast,
  cacheable). Backend = **Node** process. Bundling them would bloat both.
- **Smaller attack surface & size.** Each final image contains only what it needs.

```
┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│  client img  │  HTTP  │  server img  │  TCP   │   MongoDB    │
│ Nginx :80    │ ─────▶ │ Node  :4000  │ ─────▶ │  (Atlas or   │
│ static SPA   │        │ NestJS API   │        │  container)  │
└──────────────┘        └──────────────┘        └──────────────┘
```

> **Vite env is build-time.** `VITE_*` variables are baked into the frontend bundle
> when the image is **built**, not when it runs. So the API URL is a **build arg**
> for the client image (see §5). The backend, by contrast, reads env at **runtime**.

---

## 3. Files in this repo

| File | Purpose |
|------|---------|
| `backend/Dockerfile` | Multi-stage build → small Node runtime image for the API |
| `backend/.dockerignore` | Excludes node_modules, .env, dist from the build context |
| `frontend/Dockerfile` | Multi-stage build → Nginx image serving the built SPA |
| `frontend/nginx.conf` | Nginx config: SPA fallback + caching + gzip |
| `frontend/.dockerignore` | Build-context excludes for the frontend |
| `docker-compose.yml` | Local one-command orchestration (client + server + MongoDB) |

---

## 4. Backend image (`backend/Dockerfile`)

Multi-stage: **deps → build → runtime**. The final image ships only production
`node_modules` and the compiled `dist/`.

```dockerfile
# backend/Dockerfile

# ── Stage 1: install all deps (incl. dev) & build ────────────────
FROM node:20-alpine AS build
WORKDIR /app
# Copy manifests first so this layer caches until deps change
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
# Run as the non-root user that the node image already provides
COPY --from=deps  /app/node_modules ./node_modules
COPY --from=build /app/dist          ./dist
COPY package*.json ./
USER node
EXPOSE 4000
CMD ["node", "dist/main.js"]
```

**Why it's shaped this way**
- `COPY package*.json` before `COPY . .` → the `npm ci` layer is cached and only
  reruns when dependencies change (fast rebuilds).
- Separate `deps` stage installs **prod-only** modules for the final image.
- `node:20-alpine` is small; `USER node` avoids running as root.

Build & run:

```bash
docker build -t ecommerce-api ./backend
docker run --rm -p 4000:4000 --env-file backend/.env ecommerce-api
```

---

## 5. Frontend image (`frontend/Dockerfile`)

Multi-stage: **build with Node → serve with Nginx**. Because Vite bakes `VITE_*`
at build time, the API URL is passed as a **build arg**.

```dockerfile
# frontend/Dockerfile

# ── Stage 1: build the static bundle ─────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Vite reads VITE_* at build time — pass the API URL as a build arg
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
```

> Build context is `./frontend`, so `COPY nginx.conf` refers to `frontend/nginx.conf`.

`frontend/nginx.conf` — SPA fallback (so client-side routes work), caching, gzip:

```nginx
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  # Client-side routing: unknown paths fall back to index.html
  location / {
    try_files $uri $uri/ /index.html;
  }

  # Long-cache hashed assets
  location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  gzip on;
  gzip_types text/css application/javascript application/json image/svg+xml;
}
```

Build & run (note the build args):

```bash
docker build -t ecommerce-web \
  --build-arg VITE_API_URL=https://api.yourdomain.com/api \
  --build-arg VITE_WS_URL=https://api.yourdomain.com/realtime \
  ./frontend
docker run --rm -p 8080:80 ecommerce-web      # → http://localhost:8080
```

> Changing the API URL means **rebuilding** the frontend image — it's compiled in.
> That's expected for static SPAs.

---

## 6. Local orchestration (`docker-compose.yml`)

For local development it's convenient to bring up **client + server + MongoDB** with
one command. (In production the three are deployed separately — see §9.)

```yaml
# docker-compose.yml
services:
  mongo:
    image: mongo:8
    restart: unless-stopped
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

  server:
    build: ./backend
    restart: unless-stopped
    env_file: ./backend/.env
    environment:
      # Reach Mongo by service name on the compose network
      MONGODB_URI: mongodb://mongo:27017/ecommerce
      CLIENT_ORIGIN: http://localhost:8080
    ports:
      - "4000:4000"
    depends_on:
      - mongo

  web:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_API_URL: http://localhost:4000/api
        VITE_WS_URL: http://localhost:4000/realtime
    restart: unless-stopped
    ports:
      - "8080:80"
    depends_on:
      - server

volumes:
  mongo-data:
```

Bring it up / down:

```bash
docker compose up -d --build     # build + start everything in the background
docker compose logs -f server    # tail the API logs
docker compose down              # stop & remove containers (keeps the volume)
docker compose down -v           # also delete the mongo-data volume (wipes DB)
```

> **Compose networking:** services reach each other by **service name**, which is why
> the server uses `mongodb://mongo:27017`. `localhost` inside a container means the
> container itself — not your host.

---

## 7. Command reference

### Images

```bash
docker build -t <name> <path>          # build an image from a Dockerfile
docker build -t <name> -f <file> .     # specify a Dockerfile path
docker images                          # list local images
docker rmi <image>                     # remove an image
docker tag <img> <registry>/<img>:<tag># tag before pushing
```

### Containers

```bash
docker run --rm -p 4000:4000 <image>          # run; --rm auto-cleans on exit
docker run -d --name api <image>              # run detached (background)
docker run --env-file backend/.env <image>     # inject env vars from a file
docker ps                                     # list running containers
docker ps -a                                  # include stopped ones
docker logs -f <container>                    # follow logs
docker exec -it <container> sh                # shell into a running container
docker stop <container> / docker start <c>    # stop / start
docker rm <container>                         # remove a stopped container
```

### Compose

```bash
docker compose up -d --build     # build + start all services
docker compose ps                # status of compose services
docker compose logs -f [svc]     # follow logs (optionally one service)
docker compose exec server sh    # shell into the server service
docker compose restart server    # restart one service
docker compose down [-v]         # stop/remove (-v also removes volumes)
```

### Registry (deployment)

```bash
docker login <registry>                        # e.g. ghcr.io / docker.io
docker push  <registry>/ecommerce-api:1.0.0    # upload an image
docker pull  <registry>/ecommerce-api:1.0.0    # download an image
```

### Housekeeping

```bash
docker system df          # disk usage
docker image prune        # remove dangling images
docker system prune -a    # remove all unused images/containers/networks (careful)
docker volume ls          # list volumes
```

---

## 8. Environment variables in Docker

| Service | When read | How to pass |
|---------|-----------|-------------|
| **server** (Node) | **Runtime** | `--env-file backend/.env`, `-e KEY=val`, or compose `env_file`/`environment` |
| **client** (Vite) | **Build time** | `--build-arg VITE_API_URL=…` (baked into the bundle) |

- **Never bake secrets into an image.** The backend's secrets (`JWT_*`,
  `MONGODB_URI`) are runtime env, injected by the host/platform — not `COPY`ied in.
- `VITE_*` values are **public** (they ship to the browser), so only put non-secret
  config there (API URL, app name).
- `.dockerignore` must exclude `.env` so it never lands in the build context.

`frontend/.dockerignore` and `backend/.dockerignore`:

```
node_modules
dist
.env
.env.*
!.env.example
npm-debug.log
Dockerfile
.dockerignore
.git
coverage
```

---

## 9. Deploying separately

Because the images are independent, you can mix hosts:

**Backend (`ecommerce-api`)** — any container platform:
- Render / Railway / Fly.io / AWS ECS / Google Cloud Run / a VPS with Docker.
- Set runtime env: `MONGODB_URI` (point at **MongoDB Atlas**), `JWT_*`,
  `CLIENT_ORIGIN` (your frontend's public URL, for CORS), `PORT`.
- Expose `4000` (or the platform's port); health check `GET /api/health`.

**Frontend (`ecommerce-web`)** — a static/container host:
- Build the image with `--build-arg VITE_API_URL=https://<your-api>/api`.
- Run the Nginx image on any container host, **or** skip Docker and deploy the
  built `dist/` to Netlify / Vercel / Cloudflare Pages / S3 + CloudFront.

**Database** — **MongoDB Atlas** (recommended): managed, gives you the **replica
set** that transactions require (see [07-data-model.md](./07-data-model.md)). Or run
the `mongo:8` image with a persistent volume and configure a replica set yourself.

**Typical release flow**

```bash
# tag a version, build, push
docker build -t ghcr.io/<you>/ecommerce-api:1.0.0 ./backend
docker push ghcr.io/<you>/ecommerce-api:1.0.0

docker build -t ghcr.io/<you>/ecommerce-web:1.0.0 \
  --build-arg VITE_API_URL=https://api.yourdomain.com/api \
  ./frontend
docker push ghcr.io/<you>/ecommerce-web:1.0.0
# the platform pulls these tags and runs them
```

> Automate this in CI (GitHub Actions) later — see the CI note in
> [01-tech-stack.md](./01-tech-stack.md).

---

## 10. Troubleshooting

| Symptom | Likely cause / fix |
|---------|--------------------|
| API can't reach Mongo in compose | Use `mongodb://mongo:27017/...` (service name), not `localhost` |
| Frontend calls the wrong API URL | `VITE_API_URL` is build-time — **rebuild** the client image with the right `--build-arg` |
| CORS error in the browser | Set `CLIENT_ORIGIN` on the server to the frontend's exact origin |
| Refreshing a route → 404 | Missing SPA fallback — ensure `try_files … /index.html` in `nginx.conf` |
| Image huge / slow build | Check `.dockerignore` excludes `node_modules`; use the multi-stage builds above |
| Transactions fail in Mongo | Standalone `mongod` has no replica set — use Atlas or a single-node replica set |
| Changes not picked up | You rebuilt without `--build`/cache busted; run `docker compose up -d --build` |

---

## Verification

```bash
# 1. Build both images
docker build -t ecommerce-api ./backend
docker build -t ecommerce-web --build-arg VITE_API_URL=http://localhost:4000/api ./frontend

# 2. Or bring the whole stack up
docker compose up -d --build

# 3. Check
docker compose ps                     # all services "running"
curl http://localhost:4000/api/health # → OK
# open http://localhost:8080          # SPA loads, talks to the API
```

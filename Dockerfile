# ---------------------------------------------------------------------------
# JSONForms Designer — Produktions-Image (statisches SPA hinter nginx)
#
#   docker build -t jsonforms-designer .
#   docker run --rm -p 8080:8080 jsonforms-designer
#
# Details und FIM-Proxy-Konfiguration: docs/BETRIEB.md
# ---------------------------------------------------------------------------

# ---- Build-Stage -----------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

# Nur Manifeste zuerst — Docker-Layer-Cache für npm ci
COPY package.json package-lock.json ./
COPY packages/editor/package.json packages/editor/
COPY packages/app/package.json packages/app/
RUN npm ci --no-fund --ignore-scripts

COPY tsconfig.base.json ./
COPY packages ./packages
RUN npm run build

# ---- Runtime-Stage ---------------------------------------------------------
FROM nginx:1.27-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/packages/app/build /usr/share/nginx/html

# Unprivilegierter Port (kein root nötig für <1024)
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO /dev/null http://127.0.0.1:8080/ || exit 1

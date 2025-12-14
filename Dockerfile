# syntax=docker/dockerfile:1.7

#########################
# Frontend build
#########################
FROM node:20-slim AS frontend-builder
WORKDIR /app

# Enable pnpm via corepack for reproducible installs
RUN corepack enable

# Copy dependency manifests first for better layer caching
COPY frontend/index.html frontend/pnpm-lock.yaml frontend/package.json ./frontend/
COPY frontend/vite.config.ts frontend/tsconfig*.json ./frontend/

# Copy the workspace source
COPY frontend/src ./frontend/src

WORKDIR /app/frontend

# Install dependencies and build only the web app
RUN pnpm install --frozen-lockfile

RUN pwd && ls -la
RUN find . -maxdepth 4 -name index.html -print

RUN pnpm run build

FROM nginx:alpine AS frontend
WORKDIR /usr/share/nginx/html

# Copy built assets into path-scoped directories
COPY --from=frontend-builder /app/frontend/dist ./

# Nginx configuration for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

#########################
# Backend build & run
#########################
FROM python:3.12-slim AS backend-builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app/backend

# Build deps for psycopg/crypto, keep image lean
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential curl gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install uv
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:${PATH}"

# Copy manifests first for caching
COPY backend/pyproject.toml backend/uv.lock ./
COPY backend/src ./src

# Install workspace projects into .venv (prod deps only); uv auto-discovers members from pyproject
RUN uv sync --frozen --no-dev

FROM python:3.12-slim AS backend
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app/backend

# ⭐ 必须：安装 libpq 运行库
RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual env
COPY --from=backend-builder /app/backend/.venv /app/backend/.venv
ENV PATH="/app/backend/.venv/bin:${PATH}"

ENV PYTHONPATH="/app/backend/src:${PYTHONPATH}"

# Copy source
COPY backend/src ./src
COPY backend/alembic ./alembic
COPY backend/entrypoint.sh ./
COPY backend/alembic.ini ./
COPY backend/.env.prod ./.env
COPY backend/scripts ./scripts

# Default to prod settings; override as needed
ENV APP_ENV=prod

EXPOSE 8000

RUN chmod +x /app/backend/entrypoint.sh
ENTRYPOINT ["/app/backend/entrypoint.sh"]

# FastAPI production run

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]

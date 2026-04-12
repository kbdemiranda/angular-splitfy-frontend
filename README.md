<div align="center">

# Splitfy Frontend

Angular-based web client for Splitfy.
Manage subscriptions, billing flows, and account settings from a modern SPA.

[![Angular](https://img.shields.io/badge/Angular-21-dd0031?logo=angular&logoColor=white)](https://angular.dev/)
[![Node](https://img.shields.io/badge/Node-22+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ed?logo=docker&logoColor=white)](https://www.docker.com/)

</div>

## Table of Contents

- [Overview](#overview)
- [Feature Scope](#feature-scope)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Docker Workflows](#docker-workflows)
- [Backend Integration](#backend-integration)
- [Environment Notes](#environment-notes)
- [Screenshots](#screenshots)
- [Available Scripts](#available-scripts)
- [Quality Gates](#quality-gates)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)

## Overview

Splitfy Frontend is the UI layer of the Splitfy platform.
It consumes backend APIs and provides the core product experience for end users and administrators.

This repository is designed to support:

- local development with fast feedback
- containerized development and deployment
- production static hosting via Nginx

## Feature Scope

Current frontend scope includes:

- authentication flows
- dashboard experience
- subscribers management
- billing/charges management
- settings screens

## Tech Stack

- Angular 21
- TypeScript
- SCSS
- RxJS
- Docker + Docker Compose
- Nginx (production container)

## Project Structure

```text
.
├── src/                      # Application source code
├── public/                   # Static public assets
├── Dockerfile.dev            # Development container image
├── Dockerfile                # Production multi-stage image
├── docker-compose.yml        # Development compose stack (4242:4242)
├── docker-compose.prod.yml   # Production compose stack (4242:4242)
├── nginx.conf                # SPA routing for production runtime
└── proxy.conf.cjs            # API proxy config for local/dev mode
```

## Prerequisites

### Local mode (without Docker)

- Node.js 22 or higher
- npm 11 or higher

### Container mode

- Docker Engine
- Docker Compose v2

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Run in development mode

```bash
npm run start
```

Application URL: `http://localhost:4242`

## Docker Workflows

### Development container (hot reload)

```bash
docker compose up --build
```

Application URL: `http://localhost:4242`

### Production-like container (Nginx serving compiled app)

```bash
docker compose -f docker-compose.prod.yml up --build
```

Application URL: `http://localhost:4242`

If port `4242` is already in use, override it at runtime:

```bash
FRONTEND_PORT=4243 docker compose up --build
```

```bash
FRONTEND_PORT=4243 docker compose -f docker-compose.prod.yml up --build
```

### Build local image

```bash
docker build -t angular-splitfy-frontend:local .
```

Run the image locally:

```bash
docker run --rm -p 4242:4242 angular-splitfy-frontend:local
```

### Publish to Docker Hub

Build with your Docker Hub repository name:

```bash
docker build -t <dockerhub-user>/angular-splitfy-frontend:latest .
```

Login and push:

```bash
docker login
docker push <dockerhub-user>/angular-splitfy-frontend:latest
```

If you prefer Compose for a tagged production image:

```bash
DOCKER_IMAGE=<dockerhub-user>/angular-splitfy-frontend IMAGE_TAG=latest docker compose -f docker-compose.prod.yml build
DOCKER_IMAGE=<dockerhub-user>/angular-splitfy-frontend IMAGE_TAG=latest docker compose -f docker-compose.prod.yml push
```

## Backend Integration

Development API proxy is configured in `proxy.conf.cjs`.

Current defaults:

- route prefix: `/api`
- target: `http://localhost:8080` locally
- target: `http://host.docker.internal:8282` in Docker via `.env.docker`

If your backend runs in another container/host, update `target` accordingly.

## Environment Notes

- Dev compose maps host `4242` to container `4242`.
- Prod compose maps host `4242` to container `4242`.
- Keep these mappings aligned with your local backend and reverse proxy setup.

## Screenshots

Add images under `docs/images/` using these filenames:

- `login.png`
- `dashboard.png`
- `subscribers.png`
- `billing.png`
- `settings.png`

### Login

![Login screen placeholder](docs/images/login.png)

### Dashboard

![Dashboard placeholder](docs/images/dashboard.png)

### Subscribers

![Subscribers screen placeholder](docs/images/subscribers.png)

### Billing

![Billing screen placeholder](docs/images/billing.png)

### Settings

![Settings screen placeholder](docs/images/settings.png)

## Available Scripts

```bash
npm run start      # Run Angular dev server
npm run build      # Build production artifacts
npm run test       # Run test suite
npm run e2e        # Run Cypress regression suite (starts app automatically)
npm run e2e:smoke  # Run Cypress smoke suite (starts app automatically)
```

## Quality Gates

Before opening a PR, run:

```bash
npm run build
npm run test
```

## Contributing

Contributions are welcome.

Suggested workflow:

1. Fork the repository.
2. Create a feature branch.
3. Commit with clear, scoped messages.
4. Validate build/tests locally.
5. Open a pull request describing intent and impact.

## Troubleshooting

- Port `4242` already in use:
  Update port mapping in `docker-compose.yml` and `docker-compose.prod.yml`.
- API calls failing in development:
  Re-check `proxy.conf.cjs`, `.env.docker`, and backend availability.
- Dependency conflicts:
  Remove `node_modules` and reinstall with `npm install`.

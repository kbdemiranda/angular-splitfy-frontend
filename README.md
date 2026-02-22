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
├── docker-compose.yml        # Development compose stack (5000:4200)
├── docker-compose.prod.yml   # Production compose stack (5000:80)
├── nginx.conf                # SPA routing for production runtime
└── proxy.conf.json           # API proxy config for local/dev mode
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

Application URL: `http://localhost:4200`

## Docker Workflows

### Development container (hot reload)

```bash
docker compose up --build
```

Application URL: `http://localhost:5000`

### Production-like container (Nginx serving compiled app)

```bash
docker compose -f docker-compose.prod.yml up --build
```

Application URL: `http://localhost:5000`

## Backend Integration

Development API proxy is configured in `proxy.conf.json`.

Current defaults:

- route prefix: `/api`
- target: `http://localhost:8080`

If your backend runs in another container/host, update `target` accordingly.

## Environment Notes

- Dev compose maps host `5000` to container `4200`.
- Prod compose maps host `5000` to container `80`.
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

- Port `5000` already in use:
  Update port mapping in `docker-compose.yml` and `docker-compose.prod.yml`.
- API calls failing in development:
  Re-check `proxy.conf.json` target and backend availability.
- Dependency conflicts:
  Remove `node_modules` and reinstall with `npm install`.

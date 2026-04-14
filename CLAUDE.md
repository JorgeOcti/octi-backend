# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- **Start all services**: `make start` (Docker Compose: mongo, redis, backend, frontend, sass)
- **Logs**: `make logsBackend` / `make logsFrontend`
- **TypeScript check**: `make typescriptCheck`
- **Circular dependency check**: `npm run madge`

### Build & Test
- **Build**: `npm run build` (tsc)
- **Run tests**: `npm test` (ts-mocha, 5s timeout, matches `**/*.spec.ts`)
- **Test with coverage**: `npm run test-with-coverage`
- **Watch mode** (local, no Docker): `npm run dev:tsnode`

### Linting
- ESLint: `npx eslint src/**/*.ts`
- Prettier: `npx prettier --check src/**/*.ts`
- Rules: single quotes, 2-space indent, semicolons required, no trailing commas

### Database
- **Load dump**: `make dumpLoad`
- **Migrations**: via `mongo-migrate-ts` in `src/migrations/`

## Architecture

**Stack**: Express.js 4 + TypeScript, MongoDB (Mongoose 6), Redis, Socket.IO, Bull queues

**Entry point**: `src/server.ts` — bootstraps Mongoose, Redis cache, Bull queues, Socket.IO, then starts the HTTP server.

**App setup**: `src/app/app.ts` — registers all middleware (compression, session, passport, CSRF, Sentry) and mounts all routers.

### Module Structure

Each domain module under `src/` follows a consistent pattern:
```
<module>/
  controllers/    # Express route handlers
  models/         # Mongoose schemas + models
  tasks/          # Bull queue job handlers
  router.ts       # Express router mounting controllers
```

Key modules:
- **app/** — Core: users, companies, cars (vehicles), venues, teams
- **billing/** — Subscription billing with cron jobs (`0 1 1 * *`)
- **inventory/** — Vehicle inventory tracking
- **form/** — Checklists and damage forms
- **request/** — Request management
- **distribution/** — Delivery/distribution tracking
- **planning/** — Planning features
- **stats/** — Analytics
- **integrations/** — IXnet external API sync
- **services/** — Shared services: Redis, Logger, Socket.IO, AWS SES

### Authentication

Passport.js with two strategies (configured in `src/passportConfig.ts`):
- **Local**: username/password with passport-local-mongoose
- **SAML**: SSO via OneLogin (passport-saml)
- **API v1**: JWT via `src/app/controllers/jwt.controller.ts`, mounted at `/api/v1`
- Sessions stored in Redis (connect-redis)

### Queue System (Bull + Redis)

Queues are initialized in `src/server.ts` and run as background processors:
- `emailQueue` — Async email via AWS SES
- `billingQueue` — Monthly billing (cron)
- `inventoryQueue` — Async inventory updates
- `historyQueue` — Event logging

### Database

- **Mongoose 6** with `autoIndex: false` in production
- **Mongoose-redis-cache**: 30s TTL cache on model queries (enabled in non-test envs)
- **Pagination**: `mongoose-paginate-v2` and `mongoose-aggregate-paginate-v2`
- **File attachments**: `mongoose-crate` + `mongoose-crate-s3` for S3 uploads

### Real-time

Socket.IO with `@socket.io/redis-adapter` for pub/sub across instances. JWT-authenticated socket connections.

## Environment Variables

Key vars (see `.env.example`):
- `MONGODB_URI` — MongoDB connection string
- `REDIS_SERVICE_SERVICE_HOST` — Redis host
- `ENV` — `development` | `production` | `testing`
- `PORT` — Server port (default 3000)
- `SECRET_KEY` — Session/JWT secret
- `S3_KEY`, `S3_SECRET`, `S3_BUCKET`, `S3_REGION` — AWS S3
- `SENTRY_DNS` — Error tracking

## Git Workflow

- Branch: `develop` for active development
- PRs target: `master`
- Fork-based workflow per README

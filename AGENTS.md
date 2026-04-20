# Agent Guide — Enterprise Hackathon Management System

## Repo Shape

- **Monorepo**: Turborepo + npm workspaces (`apps/*`, `packages/*`, `services/*`).
- **Apps**: `@ehms/web` (Next.js 15, App Router, no `src/`) | `@ehms/api` (NestJS).
- **Packages**: `@ehms/types` | `@ehms/validation` (Zod) | `@ehms/database` (Prisma).
- **Node**: `>=20`, npm `>=10`. Package manager pinned to `npm@10.2.4`.

## Critical Commands

```bash
# Install & infra (do this first)
npm install
cd docker && docker-compose -f docker-compose.dev.yml up -d

# Env files (required before dev/build)
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# Database (run from packages/database)
cd packages/database
npx prisma migrate dev
npx prisma db seed

# Dev (both apps)
npm run dev        # turbo runs both in parallel

# Build order matters
npm run build:packages   # types → validation → database
npm run build            # apps (lint depends on ^build, test depends on build)

# Testing / checks
npm run lint
npm run test
```

## Build & Dependency Order

- `turbo.json` enforces:
  - `lint` → depends on `^build`
  - `test` → depends on `build`
- Always build packages before linting/testing apps. Use `npm run build:packages` if turbo cache seems off.

## Prisma / Database Gotchas

- **Client is hoisted**: `generator client` outputs to `../../../node_modules/.prisma/client` (root `node_modules`). Do **not** change this path.
- `postinstall` in `@ehms/database` runs `prisma generate`. If client is missing after install, run it manually.
- Seed script lives at `packages/database/prisma/seed.ts` and runs via `tsx`.
- Docker Compose spins up **PostgreSQL 17**, **Redis 7** (password `redispass`), and **MinIO** (bucket `ehms-uploads` auto-created).

## Frontend (`apps/web`)

- **No `src/` directory**: pages live directly under `app/`, components at `components/`.
- **Bilingual/RTL first**: locales `ar` (default, RTL) and `en` (LTR). `localePrefix: 'always'`.
- **Navigation wrappers**: import `Link`, `useRouter`, `usePathname`, `redirect` from `i18n/routing.ts`, **not** from `next/navigation` directly.
- **Tailwind logical props**: use `ps-4 me-2` (padding-start, margin-end), never `pl-4 mr-2`.
- **Next.js config quirks**:
  - `reactStrictMode: false`
  - `output: 'standalone'`
  - `eslint.ignoreDuringBuilds: true`
  - `transpilePackages: ['@ehms/types', '@ehms/validation']`

## Backend (`apps/api`)

- **Entry file**: `nest-cli.json` sets `entryFile: "apps/api/src/main"` — the compiled main is at `dist/apps/api/src/main.js`.
- **Build config**: uses `tsconfig.build.json` (excludes specs).
- **tsconfig paths**: `@ehms/database`, `@ehms/types`, `@ehms/validation` mapped to `../../packages/*/src`.
- **Global prefix**: `api/v1` (configurable via `API_PREFIX`).
- **Swagger**: mounted at `/api/docs` in non-production.
- **CORS**: `CORS_ORIGIN` is comma-separated; both `localhost` and `127.0.0.1` must be listed if both are used.

## Style & Lint

- **Prettier** (root `.prettierrc`): singleQuote, semi, trailingComma `es5`, printWidth `100`, tabWidth `2`, LF.
- **ESLint** (root `.eslintrc.js`): `@typescript-eslint/no-explicit-any: warn`, `no-unused-vars` ignores `^_` args. Web app extends `next/core-web-vitals`.

## Env Reference

- `apps/api/.env`: `DATABASE_URL`, `REDIS_URL` (include `redispass`), `JWT_SECRET`, `S3_*`, `GOOGLE_*`, `CORS_ORIGIN`, `FRONTEND_URL`
- `apps/web/.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1`

## What to Avoid

- Do **not** run `prisma generate` to a local `node_modules` inside `packages/database`.
- Do **not** use raw Next.js navigation APIs; always use the `next-intl` wrappers.
- Do **not** assume `src/app` for the web app.
- Do **not** change the Prisma client output path.

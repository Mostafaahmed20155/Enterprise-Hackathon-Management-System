# Deploy EHMS on Coolify (production)

You run **two separate applications** in Coolify: **API** (NestJS) and **Web** (Next.js). Each has its own Docker image, domain, and environment.

Example domains (adjust to yours):

| Service | Domain | Port (internal) |
|---------|--------|-----------------|
| Frontend | `https://ehms.dpmena.com` | 3000 |
| API | `https://ehmc-app.dpmena.com` | 3001 |

API routes are under **`/api/v1`** (e.g. `https://ehmc-app.dpmena.com/api/v1/auth/login`).

```bash
docker files build 
----
docker build -f docker/Dockerfile.api -t pixeloud/ehms-api:latest .

docker build -f docker/Dockerfile.web -t pixeloud/ehms-web:latest --build-arg NEXT_PUBLIC_API_URL=https://ehmc-app.dpmena.com/api/v1 .

```


## 1. Prerequisites

- Coolify on a VPS with Docker.
- DNS **A/AAAA** records for `ehms.dpmena.com` and `ehmc-app.dpmena.com` pointing at the server (or your proxy).
- Git repository accessible by Coolify (GitHub/GitLab/etc.) with this monorepo.

---

## 2. Data services (PostgreSQL, Redis, object storage)

Create these **before** or **alongside** the app (Coolify resources or external):

1. **PostgreSQL** — create a database and user; note connection string for `DATABASE_URL`.
2. **Redis** — with a password if possible; note URL for `REDIS_URL`.
3. **S3-compatible storage** — production MinIO, AWS S3, Cloudflare R2, etc. Set `S3_*` variables on the API.

If the API cannot reach Postgres/Redis/S3, login, uploads, and background features will fail.

---

## 3. Application A — API (`ehmc-app.dpmena.com`)

### Create resource

- **Type**: Docker Compose *or* **Dockerfile** build (simplest: **Dockerfile**).
- **Build pack**: Nixpacks disabled; use **Dockerfile**.

### Build settings

- **Base directory / context**: repository **root** (where `package.json` and `docker/` live).
- **Dockerfile path**: `docker/Dockerfile.api`
- **Do not** set the context to `apps/api` only; the Dockerfile expects the **monorepo root**.

### Port

- Container exposes **3001**. In Coolify, map public HTTP(S) to this port (Coolify usually sets `PORT` — if your template forces another port, align it with the app or set `PORT=3001` in env).

### Domain

- Assign **`ehmc-app.dpmena.com`** (or your API host). Enable HTTPS (Let’s Encrypt).

### Environment variables (production)

Set at least:

```env
NODE_ENV=production
PORT=3001
API_PREFIX=api/v1

DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public

REDIS_URL=redis://:REDIS_PASSWORD@HOST:6379

JWT_SECRET=<long-random-secret-min-32-chars>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

S3_ENDPOINT=https://your-s3-endpoint
S3_BUCKET_NAME=ehms-uploads
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_REGION=us-east-1
S3_FORCE_PATH_STYLE=true

CORS_ORIGIN=https://ehms.dpmena.com
FRONTEND_URL=https://ehms.dpmena.com

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=https://ehmc-app.dpmena.com/api/v1/auth/oauth/google/callback
```

- **`CORS_ORIGIN`**: must match how users open the site (`https://ehms.dpmena.com`). For multiple origins, use commas: `https://ehms.dpmena.com,https://www.ehms.dpmena.com`
- **`GOOGLE_CALLBACK_URL`**: must match the **API** public URL + `/api/v1/auth/oauth/google/callback` and your Google Cloud OAuth “Authorized redirect URIs”.

### Database migrations (automatic)

On each API container start, `docker/entrypoint-api.sh` runs **`prisma migrate deploy`** (using `DATABASE_URL`) **before** the Nest process starts. New releases apply pending migrations without a separate Coolify job.

- **`SKIP_DB_MIGRATE`**: set to `1` or `true` only for emergencies (container will start without migrating; use with care).

Manual run (same as the entrypoint) if you ever need it outside the container:

```bash
npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma
```

Optional: seed once (only if you want demo data in prod — usually **no**):

```bash
npx prisma db seed
```

---

## 4. Application B — Web (`ehms.dpmena.com`)

### Create resource

- Second application, **Dockerfile** build from the **same repo**.

### Build settings

- **Context**: repository **root**.
- **Dockerfile path**: `docker/Dockerfile.web`

### Build arguments (required)

`NEXT_PUBLIC_*` is inlined at **build time**. In Coolify, add a **build argument**:

| Name | Example value |
|------|----------------|
| `NEXT_PUBLIC_API_URL` | `https://ehmc-app.dpmena.com/api/v1` |

Use **HTTPS** and include **`/api/v1`**. If you change the API domain, **rebuild** the web image.

*(PowerShell one-liner for local test build:)*

```powershell
docker build -f docker/Dockerfile.web -t ehms-web:local --build-arg NEXT_PUBLIC_API_URL=https://ehmc-app.dpmena.com/api/v1 .
```

### Port

- Container exposes **3000**. Map Coolify routing to port **3000**.

### Domain

- Assign **`ehms.dpmena.com`**. Enable HTTPS.

Runtime env for the web app is minimal; the API URL is mostly from the build arg above.

---

## 5. Order of operations (checklist)

1. Create **Postgres** + **Redis** (+ S3/MinIO if not using public cloud yet).
2. Deploy **API** first; set all API env vars (including **`DATABASE_URL`**). The first start runs migrations, then serves the app — confirm health (e.g. `https://ehmc-app.dpmena.com/api/docs`).
3. Deploy **Web** with **`NEXT_PUBLIC_API_URL`** build arg pointing at the live API URL.
4. Open **`https://ehms.dpmena.com`**, test register/login.
5. Configure **Google OAuth** redirect URL to match `GOOGLE_CALLBACK_URL`.

---

## 6. Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| Browser “failed to fetch” on login | Wrong `NEXT_PUBLIC_API_URL`, or API down, or **CORS** (`CORS_ORIGIN` must be the exact frontend origin). |
| API 500 on auth | `DATABASE_URL`, `JWT_SECRET`, or Redis unreachable. |
| API container exits right after start | **`prisma migrate deploy`** failed (bad `DATABASE_URL`, DB down, or migration conflict). Check logs; temporarily `SKIP_DB_MIGRATE=true` only to debug, then fix DB and redeploy. |
| `./entrypoint-api.sh: not found` | Usually **CRLF** line endings on the shell script from Windows, or an old image without the file. Rebuild the API image from current `Dockerfile.api` (it normalizes CRLF and uses `sh /app/entrypoint-api.sh`). |
| Upload errors | `S3_*` wrong or bucket/policy blocking the API. |
| OAuth redirect error | `GOOGLE_CALLBACK_URL` / Google console mismatch with API domain. |

---

## 7. Reference files in this repo

- `docker/Dockerfile.api` — API image  
- `docker/entrypoint-api.sh` — migrations then `node` (API)  
- `docker/Dockerfile.web` — Web image  
- `apps/api/.env.example` — full list of API variables  
- `.dockerignore` — build context exclusions  

For local Docker stack only, see `docker/README.md` (development Compose).

# Docker Development Environment

This directory contains Docker Compose configuration for local development.

## Services

### PostgreSQL 16
- **Port**: 5432
- **Database**: ehms
- **User**: postgres
- **Password**: postgres
- **Encoding**: UTF-8 (Arabic support)
- **Extensions**: pg_trgm, unaccent (for full-text search)

### Redis 7
- **Port**: 6379
- **Password**: redispass
- **Persistence**: AOF enabled
- **Use**: Session storage, caching, Bull queues

### MinIO
- **API Port**: 9000
- **Console Port**: 9001
- **User**: minioadmin
- **Password**: minioadmin
- **Default Bucket**: ehms-uploads (auto-created, public read)
- **Use**: S3-compatible file storage

## Usage

### Start all services
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Stop all services
```bash
docker-compose -f docker-compose.dev.yml down
```

### View logs
```bash
docker-compose -f docker-compose.dev.yml logs -f
```

### Stop and remove all data
```bash
docker-compose -f docker-compose.dev.yml down -v
```

## Access

- **PostgreSQL**: `postgresql://postgres:postgres@localhost:5432/ehms`
- **Redis**: `redis://:redispass@localhost:6379`
- **MinIO Console**: http://localhost:9001
- **MinIO API**: http://localhost:9000

## Health Checks

All services include health checks:
```bash
docker-compose -f docker-compose.dev.yml ps
```

## Troubleshooting

### Port conflicts
If ports 5432, 6379, 9000, or 9001 are in use:
```bash
# Check what's using the port
lsof -i :5432
lsof -i :6379
lsof -i :9000
lsof -i :9001
```

### Reset all data
```bash
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
```

### Connect to PostgreSQL
```bash
docker exec -it ehms-postgres psql -U postgres -d ehms
```

### Connect to Redis
```bash
docker exec -it ehms-redis redis-cli -a redispass
```

## Production

This configuration is for **local development only**. Production deployments should use:
- Managed PostgreSQL (e.g., AWS RDS, Azure Database)
- Managed Redis (e.g., AWS ElastiCache, Azure Cache)
- AWS S3 or equivalent cloud storage
- Proper secrets management
- TLS/SSL encryption

### Coolify: two Docker images (recommended)

Build from the **repository root** (not from `docker/`).

**API (e.g. `https://ehmc-app.dpmena.com`)**

```bash
docker build -f docker/Dockerfile.api -t your-registry/ehms-api:latest .
```

- **Port**: `3001`
- **Runtime env** (set in Coolify): mirror `apps/api/.env.example` — especially `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `FRONTEND_URL`, `S3_*`, `API_PREFIX=api/v1`
- **CORS / frontend URL**: use your real site, e.g. `CORS_ORIGIN=https://ehms.dpmena.com` and `FRONTEND_URL=https://ehms.dpmena.com` (comma-separate extra origins if needed)
- **Migrations**: the API image runs `prisma migrate deploy` on container start (`docker/entrypoint-api.sh`). Set `SKIP_DB_MIGRATE=true` only if you must bypass that (emergency).

**Web (e.g. `https://ehms.dpmena.com`)**

```bash
docker build -f docker/Dockerfile.web -t your-registry/ehms-web:latest \
  --build-arg NEXT_PUBLIC_API_URL=https://ehmc-app.dpmena.com/api/v1 .
```

- **Port**: `3000`
- **Build arg**: `NEXT_PUBLIC_API_URL` must be the **public** API base URL (HTTPS + `/api/v1`). Rebuild the web image whenever this changes.

Coolify: create **two applications**, each with its own Dockerfile path and domain, and point the web build arg at the API URL you assigned.

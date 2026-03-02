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

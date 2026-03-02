# Quick Start Guide

## Prerequisites Checklist

- [ ] Node.js 20+ installed
- [ ] Docker Desktop installed and running
- [ ] Git installed
- [ ] Code editor (VS Code recommended)

## Initial Setup (5 minutes)

### 1. Install Dependencies

```bash
# Install all workspace dependencies
npm install
```

Expected packages to install:
- Root: turbo, prettier, typescript
- API: @nestjs/*, prisma, bcrypt, etc.
- Database: @prisma/client, prisma
- Types & Validation: zod

### 2. Start Docker Services

```bash
cd docker
docker-compose -f docker-compose.dev.yml up -d
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379
- MinIO on ports 9000 (API) and 9001 (Console)

Verify services are running:
```bash
docker-compose -f docker-compose.dev.yml ps
```

All services should show "Up" and "healthy".

### 3. Setup Database

```bash
# Go to database package
cd packages/database

# Copy environment file
cp .env.example .env

# Install bcrypt for seed script
npm install bcrypt

# Run migrations
npx prisma migrate dev --name init

# Seed database with demo data
npx prisma db seed
```

Expected output:
```
✅ Database connected
🌱 Seeding database...
Creating permissions...
✓ Created 21 permissions
Creating roles...
✓ Created 4 roles
Assigning permissions to roles...
✓ Assigned permissions to roles
Creating demo users...
✓ Created 4 demo users
Creating demo skills...
✓ Created 10 skills

✅ Seed completed!

Demo accounts:
  Super Admin: admin@ehms.com / Password123!
  Organizer: organizer@ehms.com / Password123!
  Participant: participant1@ehms.com / Password123!
  Judge: judge@ehms.com / Password123!
```

### 4. Verify Database Connection

```bash
# Open Prisma Studio to browse data
npx prisma studio
```

This opens http://localhost:5555 where you can see:
- 4 users
- 4 roles
- 21 permissions
- 10 skills

## What Works Now

✅ **Database Schema**: Complete with bilingual support
✅ **Seed Data**: 4 demo users with roles
✅ **Docker Services**: PostgreSQL, Redis, MinIO running
✅ **Type System**: Shared types across packages
✅ **Validation**: Zod schemas ready to use

## What Needs Implementation

See [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) for full details.

### Critical Path (Build in this order)

1. **Authentication Module** (Week 1)
   - JWT strategy
   - Login/Register endpoints
   - Google OAuth2

2. **Users Module** (Week 1)
   - User CRUD
   - Profile management

3. **Events Module** (Week 2)
   - Event CRUD
   - State machine
   - Auto-transitions

4. **Teams Module** (Week 3)
   - Team CRUD
   - Invites
   - Member management

5. **Submissions Module** (Week 4)
   - Submission CRUD
   - S3 file upload

6. **Judging Module** (Week 4)
   - Assignments
   - Scoring
   - Leaderboard

7. **Next.js Frontend** (Week 5-8)
   - Setup with next-intl
   - RTL/LTR support
   - All pages

## Project Structure

```
Enterprise-Hackathon-Management-System/
│
├── apps/
│   ├── api/              # NestJS backend (partial)
│   └── web/              # Next.js frontend (TODO)
│
├── packages/
│   ├── database/         # ✅ Prisma schema & migrations
│   ├── types/            # ✅ Shared TypeScript types
│   ├── validation/       # ✅ Zod schemas
│   ├── ui/               # TODO: RTL-aware components
│   ├── i18n/             # TODO: Translation utilities
│   ├── auth/             # TODO: Auth utilities
│   └── arabic-nlp/       # TODO (Phase 2): Arabic NLP
│
├── services/
│   └── ml-recommendations/  # TODO (Phase 2): Python ML
│
└── docker/               # ✅ Docker Compose setup
```

## Development Workflow

### Start Development Mode

```bash
# Terminal 1: Start API (when implemented)
cd apps/api
npm run dev

# Terminal 2: Start Web (when implemented)
cd apps/web
npm run dev

# Terminal 3: Watch for type changes
cd packages/types
npm run dev
```

### Database Changes

```bash
# 1. Edit schema
vim packages/database/prisma/schema.prisma

# 2. Create migration
cd packages/database
npx prisma migrate dev --name <description>

# 3. Regenerate Prisma client
npx prisma generate
```

### Add New Package

```bash
# Create package directory
mkdir -p packages/<package-name>/src

# Add package.json
cat > packages/<package-name>/package.json << 'EOF'
{
  "name": "@ehms/<package-name>",
  "version": "1.0.0",
  "main": "./src/index.ts"
}
EOF

# Add to workspace (already configured in root package.json)
```

## Common Issues & Solutions

### Port Already in Use

```bash
# Check what's using the port
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
lsof -i :9000  # MinIO

# Kill the process or change port in docker-compose
```

### Database Connection Failed

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check logs
docker logs ehms-postgres

# Reset database
cd docker
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
```

### Prisma Client Not Generated

```bash
cd packages/database
npx prisma generate
```

### TypeScript Errors

```bash
# Clean and rebuild
npm run clean
npm install
npm run build
```

## Testing the API (Once Implemented)

### Using cURL

```bash
# Register new user
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "name": "Test User",
    "preferredLocale": "ar"
  }'

# Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ehms.com",
    "password": "Password123!"
  }'
```

### Using Swagger UI

Once API is running, visit:
http://localhost:3001/api/docs

## Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| API (when running) | http://localhost:3001 | - |
| API Docs (when running) | http://localhost:3001/api/docs | - |
| Web (when running) | http://localhost:3000 | - |
| Prisma Studio | http://localhost:5555 | - |
| MinIO Console | http://localhost:9001 | minioadmin / minioadmin |
| PostgreSQL | localhost:5432 | postgres / postgres |
| Redis | localhost:6379 | password: redispass |

## Demo User Accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@ehms.com | Password123! |
| Organizer | organizer@ehms.com | Password123! |
| Participant | participant1@ehms.com | Password123! |
| Judge | judge@ehms.com | Password123! |

## Next Steps

1. ✅ Complete this quick start
2. 🔴 Implement Authentication module (see [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md))
3. 🔴 Implement Users module
4. 🔴 Implement Events module with state machine
5. 🔴 Continue with Teams, Submissions, Judging
6. 🔴 Build Next.js frontend with RTL support

## Need Help?

- Check [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) for detailed status
- Check [README.md](./README.md) for architecture overview
- Review Prisma schema in `packages/database/prisma/schema.prisma`
- Review types in `packages/types/src/`
- Review validation in `packages/validation/src/`

## Useful Commands

```bash
# View all tasks
npm run --workspaces

# Build everything
npm run build

# Lint everything
npm run lint

# Format code
npm run format

# Database Studio
cd packages/database && npx prisma studio

# View Docker logs
cd docker && docker-compose -f docker-compose.dev.yml logs -f

# Stop all services
cd docker && docker-compose -f docker-compose.dev.yml down

# Reset everything
cd docker && docker-compose -f docker-compose.dev.yml down -v
cd packages/database && npx prisma migrate reset
```

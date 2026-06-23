# Quick Setup Guide

## ✅ Issue Fixed: Prisma Version

The Prisma version has been corrected to **6.1.0** (stable) instead of 7.3.0 (which had breaking changes).

---

## 🚀 Quick Start (First Time Setup)

### 1. Start Docker Services
```bash
cd docker
docker-compose -f docker-compose.dev.yml up -d
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379
- MinIO on ports 9000 (API) and 9001 (Console)

### 2. Setup Environment Variables

**Backend** (`apps/api/.env`):
```bash
cd apps/api
cp .env.example .env
```

Edit `.env` and set:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ehms"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

S3_ENDPOINT="http://localhost:9000"
S3_BUCKET_NAME="ehms-uploads"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"

GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:3001/api/v1/auth/oauth/google/callback"
```

**Frontend** (`apps/web/.env.local`):
```bash
cd apps/web
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### 3. Generate Prisma Client
```bash
cd packages/database
npx prisma generate
```

### 4. Run Database Migrations
```bash
npx prisma migrate dev
```

When prompted for migration name, you can just press Enter to use the default.

### 5. Seed Database with Demo Data
```bash
npx prisma db seed
```

This creates:
- 4 demo users (admin, organizer, participant, judge)
- 4 roles with 21 permissions
- 10 sample skills

### 6. Start Development Servers
```bash
# From project root
cd ../..
npm run dev
```

This starts both:
- **Backend API** on http://localhost:3001
- **Frontend** on http://localhost:3000

---

## 🌐 Access the Application

- **Arabic Interface**: http://localhost:3000/ar
- **English Interface**: http://localhost:3000/en
- **API**: http://localhost:3001
- **API Health**: http://localhost:3001/health
- **MinIO Console**: http://localhost:9001 (login: minioadmin / minioadmin)

---

## 👤 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| **Super Admin** | admin@ehms.com | Password123! |
| **Organizer** | organizer@ehms.com | Password123! |
| **Participant** | participant1@ehms.com | Password123! |
| **Judge** | judge@ehms.com | Password123! |

---

## 🔧 Troubleshooting

### Prisma Version Error
If you see errors about Prisma 7 or datasource `url` not being supported:
```bash
# Ensure correct versions are installed
cd packages/database
npm install
npx prisma --version
# Should show: prisma: 6.1.0
```

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# View PostgreSQL logs
docker logs ehms-postgres

# Restart PostgreSQL
docker restart ehms-postgres
```

### Port Already in Use
If you get "port already in use" errors:
```bash
# Kill processes on port 3000 (frontend)
npx kill-port 3000

# Kill processes on port 3001 (backend)
npx kill-port 3001
```

### Reset Database
If you need to start fresh:
```bash
cd packages/database
npx prisma migrate reset
# This will drop all data and re-run migrations
```

### View Database
```bash
cd packages/database
npx prisma studio
# Opens visual database browser at http://localhost:5555
```

---

## 📊 Verify Installation

After setup, verify everything is working:

### 1. Check API Health
```bash
curl http://localhost:3001/health
# Should return: {"status":"ok"}
```

### 2. Check Database Connection
```bash
cd packages/database
npx prisma db pull
# Should complete without errors
```

### 3. Test Frontend
1. Open http://localhost:3000/ar
2. You should see the Arabic homepage
3. Click on "تسجيل الدخول" (Login)
4. Login with: admin@ehms.com / Password123!
5. You should be redirected to the events page

---

## 🎯 Next Steps

After successful setup:

1. **Explore the System**:
   - Login as Organizer and create an event
   - Login as Participant and register for the event
   - Create a team and invite members
   - Create a submission
   - Login as Judge and score submissions

2. **Test RTL/LTR**:
   - Switch between http://localhost:3000/ar and http://localhost:3000/en
   - Verify layout flips correctly
   - Check Arabic typography

3. **Development**:
   - Backend code: `apps/api/src/`
   - Frontend code: `apps/web/app/`
   - Modify and see hot-reload in action

---

## 🛠️ Useful Commands

### Development
```bash
# Start dev servers (both frontend + backend)
npm run dev

# Start only backend
cd apps/api && npm run dev

# Start only frontend
cd apps/web && npm run dev
```

### Database
```bash
# Create new migration
cd packages/database
npx prisma migrate dev --name migration_name

# View database in browser
npx prisma studio

# Reset database
npx prisma migrate reset

# Generate Prisma client
npx prisma generate
```

### Build
```bash
# Build everything
npm run build

# Build API only
cd apps/api && npm run build

# Build frontend only
cd apps/web && npm run build
```

### Linting & Type Checking
```bash
# Lint all
npm run lint

# Type check
cd apps/web && npm run typecheck
```

---

## 📦 Package Versions (Fixed)

```json
{
  "prisma": "6.1.0",
  "@prisma/client": "6.1.0",
  "@nestjs/cli": "^10.4.5",
  "next": "^15.1.3",
  "next-intl": "^3.26.3"
}
```

---

## 🎉 Success!

If you completed all steps without errors, you now have a fully functional bilingual hackathon management system running locally!

**Happy Hacking! 🚀**

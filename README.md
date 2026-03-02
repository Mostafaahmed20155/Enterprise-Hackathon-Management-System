# Enterprise Hackathon Management System (EHMS)

A production-ready, bilingual (Arabic RTL + English LTR) hackathon management platform designed for government and enterprise use.

## Features

- ✅ **Bilingual First-Class Support**: Arabic RTL and English LTR with perfect layout switching
- ✅ **Complete Event Lifecycle**: Draft → Published → Registration → Team Formation → Hacking → Judging → Results
- ✅ **Enterprise RBAC**: Role-based access control with event-scoped permissions
- ✅ **Team Management**: Create teams, invite members, manage collaboration
- ✅ **Authentication**: Email/password + Google OAuth2
- ✅ **Judging System**: Weighted scoring, multiple criteria, automated leaderboards
- ✅ **File Storage**: S3-compatible storage with Arabic filename support
- ✅ **State Machine**: Automated event transitions based on timeline
- ⏳ **AI Team Recommendations**: Coming in Phase 2

## Tech Stack

### Frontend
- **Next.js 14** with App Router
- **next-intl** for internationalization
- **Tailwind CSS** with RTL plugin
- **Radix UI** components
- **React Hook Form** + Zod validation
- **Tanstack Query** for data fetching

### Backend
- **NestJS** with TypeScript
- **Prisma** ORM
- **PostgreSQL 16**
- **Redis** for sessions/caching
- **MinIO** (S3-compatible storage)
- **Bull** for background jobs

### Infrastructure
- **Turborepo** monorepo
- **Docker Compose** for local development

## Project Structure

```
Enterprise-Hackathon-Management-System/
├── apps/
│   ├── web/                 # Next.js frontend (13 pages)
│   └── api/                 # NestJS backend (42 endpoints)
├── packages/
│   ├── database/            # Prisma schema & migrations
│   ├── types/               # Shared TypeScript types
│   └── validation/          # Zod schemas
├── docker/                  # Docker Compose files
└── turbo.json              # Turborepo configuration
```

## Quick Start

### Prerequisites

- **Node.js 20+**
- **Docker & Docker Compose**

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Enterprise-Hackathon-Management-System
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start Docker services** (PostgreSQL, Redis, MinIO)
   ```bash
   cd docker
   docker-compose -f docker-compose.dev.yml up -d
   ```

4. **Setup environment variables**
   ```bash
   # Backend
   cp apps/api/.env.example apps/api/.env

   # Frontend
   cp apps/web/.env.example apps/web/.env.local
   ```

5. **Setup database**
   ```bash
   cd packages/database
   npx prisma migrate dev
   npx prisma db seed
   ```

6. **Start development servers**
   ```bash
   # From root directory
   npm run dev
   ```

### Access the Application

- **Frontend (Arabic)**: http://localhost:3000/ar
- **Frontend (English)**: http://localhost:3000/en
- **API**: http://localhost:3001
- **MinIO Console**: http://localhost:9001 (minioadmin / minioadmin)

## Demo Accounts

The seed script creates 4 demo accounts:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@ehms.com | Password123! |
| Organizer | organizer@ehms.com | Password123! |
| Participant | participant1@ehms.com | Password123! |
| Judge | judge@ehms.com | Password123! |

## Environment Variables

### Backend (`apps/api/.env`)

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ehms"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# S3 / MinIO
S3_ENDPOINT="http://localhost:9000"
S3_BUCKET_NAME="ehms-uploads"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"

# OAuth2
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:3001/api/v1/auth/oauth/google/callback"
```

### Frontend (`apps/web/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

## Development Commands

### Root Commands (Turborepo)

```bash
# Run all apps in dev mode
npm run dev

# Build all apps
npm run build

# Lint all apps
npm run lint

# Type check all apps
npm run typecheck
```

### Backend Commands

```bash
cd apps/api

# Development
npm run start:dev

# Build
npm run build

# Production
npm run start:prod

# Tests
npm run test
npm run test:e2e
```

### Frontend Commands

```bash
cd apps/web

# Development
npm run dev

# Build
npm run build

# Production
npm start
```

### Database Commands

```bash
cd packages/database

# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Seed database
npx prisma db seed

# Studio (GUI)
npx prisma studio
```

## API Documentation

### Authentication

```http
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh
GET  /api/v1/auth/oauth/google
```

### Events

```http
GET    /api/v1/events
POST   /api/v1/events
GET    /api/v1/events/:id
PATCH  /api/v1/events/:id
POST   /api/v1/events/:id/publish
POST   /api/v1/events/:id/register
```

### Teams

```http
GET    /api/v1/teams/:id
POST   /api/v1/teams
PATCH  /api/v1/teams/:id
DELETE /api/v1/teams/:id
POST   /api/v1/teams/:id/invite
POST   /api/v1/teams/:id/join
DELETE /api/v1/teams/:id/members/:userId
```

### Submissions

```http
GET    /api/v1/submissions/:id
POST   /api/v1/submissions
PATCH  /api/v1/submissions/:id
POST   /api/v1/submissions/:id/submit
POST   /api/v1/submissions/:id/files
DELETE /api/v1/submissions/:id/files/:fileId
```

### Judging

```http
GET  /api/v1/judging/events/:eventId/assignments
POST /api/v1/judging/scores
GET  /api/v1/judging/events/:eventId/results
```

## Database Schema

### Key Models

- **User**: Authentication, profile, skills
- **Role**: System roles (SUPER_ADMIN, ORGANIZER, PARTICIPANT, JUDGE)
- **Permission**: Resource-action permissions
- **Event**: Hackathon events with bilingual content (JSONB)
- **Team**: Team collaboration
- **Submission**: Project submissions with file uploads
- **JudgingScore**: Weighted scoring system

### Bilingual Content Pattern

All user-facing content uses JSONB fields:

```json
{
  "name": {
    "en": "Tech Hackathon 2024",
    "ar": "هاكاثون التقنية 2024"
  }
}
```

## Event State Machine

Events progress through 9 states with automatic transitions:

```
DRAFT
  ↓
PUBLISHED
  ↓
REGISTRATION_OPEN (auto-transition at registrationStart)
  ↓
TEAM_FORMATION (auto-transition at registrationEnd)
  ↓
HACKING_PHASE (auto-transition at hackingStart, locks teams)
  ↓
SUBMISSION_CLOSED (auto-transition at hackingEnd)
  ↓
JUDGING (manual transition by organizer)
  ↓
RESULTS_PUBLISHED (manual transition)
  ↓
ARCHIVED (manual transition)
```

Auto-transitions run via cron job every 5 minutes.

## RTL/LTR Support

### Key Principles

1. **Dynamic `dir` attribute**: Set on `<html>` element based on locale
2. **CSS Logical Properties**: Use `margin-inline-start`, `padding-inline-end` instead of `left`/`right`
3. **Tailwind RTL Plugin**: Automatic RTL conversion
4. **Icon Flipping**: Directional icons (arrows, chevrons) flip horizontally in RTL
5. **Arabic Typography**: 10-15% larger font size, increased line height

### Example

```tsx
// Correct ✅
<div className="ps-4 me-2">  // padding-start, margin-end

// Incorrect ❌
<div className="pl-4 mr-2">  // padding-left, margin-right
```

## Testing

### E2E Tests (Planned)

```bash
npm run test:e2e
```

### RTL Visual Regression (Planned)

```bash
npm run test:visual
```

## Deployment

### Docker Production Build

```bash
# Build all apps
npm run build

# Run with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Checklist

- [ ] Change `JWT_SECRET` to a secure random string
- [ ] Update `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- [ ] Configure production database URL
- [ ] Setup production S3 bucket (AWS S3 or MinIO)
- [ ] Enable CORS for production frontend domain
- [ ] Setup Redis with persistence
- [ ] Configure SSL/TLS certificates
- [ ] Enable rate limiting
- [ ] Setup monitoring (Sentry, LogRocket)

## Roadmap

### Phase 1: Core Hackathon Flow ✅ (Completed)
- ✅ Authentication & RBAC
- ✅ Event management with state machine
- ✅ Team formation
- ✅ Submissions with file upload
- ✅ Basic judging
- ✅ Bilingual UI with RTL support

### Phase 2: AI Features (Next)
- Python ML service (FastAPI)
- Team recommendations based on skills
- Arabic NLP normalization
- Multilingual embeddings

### Phase 3: Multi-Tenancy
- Tenant model & data isolation
- Custom domains
- White-label branding

### Phase 4: Enterprise Features
- SAML/SSO
- Advanced analytics
- Audit logs
- PDF exports with Arabic fonts
- Email notifications
- Mentorship system

### Phase 5: Scale & Optimization
- Redis caching
- Query optimization
- CDN integration
- Kubernetes deployment

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Write tests
4. Submit a pull request

## License

Proprietary - Enterprise Use Only

## Support

For issues and questions, contact the development team.

---

Built with ❤️ for enterprise hackathons

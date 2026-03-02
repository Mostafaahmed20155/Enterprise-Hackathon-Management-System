# EHMS Web Frontend

Enterprise Hackathon Management System - Frontend Application

## Features

- ✅ Next.js 14 with App Router
- ✅ next-intl for bilingual support (Arabic RTL + English LTR)
- ✅ Tailwind CSS with RTL plugin
- ✅ Radix UI components
- ✅ Type-safe API client
- ✅ Form validation with React Hook Form + Zod

## Getting Started

### Prerequisites

- Node.js 20+
- Running API backend at http://localhost:3001

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Run development server
npm run dev
```

### Access the App

- **Arabic (default)**: http://localhost:3000/ar
- **English**: http://localhost:3000/en

## Project Structure

```
apps/web/
├── app/
│   ├── [locale]/          # Localized routes
│   │   ├── layout.tsx     # Root layout with dir attribute
│   │   ├── page.tsx       # Homepage
│   │   ├── auth/          # Authentication pages
│   │   ├── events/        # Event pages
│   │   ├── teams/         # Team pages
│   │   ├── submissions/   # Submission pages
│   │   └── judging/       # Judging pages
│   └── globals.css        # Global styles
│
├── components/
│   └── ui/                # Reusable UI components
│
├── i18n/
│   ├── routing.ts         # Locale routing config
│   └── request.ts         # Request config
│
├── lib/
│   ├── api.ts             # API client
│   └── utils.ts           # Utility functions
│
├── messages/
│   ├── ar.json            # Arabic translations
│   └── en.json            # English translations
│
└── middleware.ts          # Next.js middleware for i18n
```

## RTL Support

The app automatically switches between RTL (Arabic) and LTR (English) based on the locale in the URL.

- Uses Tailwind RTL plugin for automatic direction conversion
- Dynamic `dir` attribute on `<html>` element
- Arabic typography optimization (larger font, increased line height)
- Icon flipping for directional elements

## API Integration

The API client (`lib/api.ts`) handles:
- Automatic token injection
- Token refresh on 401 errors
- Locale header injection
- Request/response interceptors

## Development

```bash
# Run dev server
npm run dev

# Type check
npm run typecheck

# Lint
npm run lint

# Build for production
npm run build
```

## Demo Accounts

The system comes with seeded demo accounts (see `packages/database/prisma/seed.ts`):

1. **Super Admin**
   - Email: admin@ehms.com
   - Password: Password123!
   - Can create events, manage users, assign roles

2. **Organizer**
   - Email: organizer@ehms.com
   - Password: Password123!
   - Can create and manage events

3. **Participant**
   - Email: participant1@ehms.com
   - Password: Password123!
   - Can register for events, join teams, submit projects

4. **Judge**
   - Email: judge@ehms.com
   - Password: Password123!
   - Can judge submissions, provide scores

## Available Pages

### Public Routes
- `/ar` or `/en` - Homepage
- `/ar/login` or `/en/login` - Login page
- `/ar/register` or `/en/register` - Registration page

### Protected Routes (require authentication)
- `/ar/events` - Events list
- `/ar/events/create` - Create new event
- `/ar/events/[id]` - Event detail page
- `/ar/teams` - My teams
- `/ar/profile` - User profile
- `/ar/submissions` - Submissions (coming soon)
- `/ar/judging` - Judging interface (coming soon)

(Same routes available with `/en` prefix for English)

## Environment Variables

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

## Features Implemented

- ✅ Bilingual routing (ar/en)
- ✅ RTL/LTR layout switching
- ✅ Authentication pages (Login/Register with Google OAuth)
- ✅ Dashboard layout with navigation
- ✅ Event management (List, Create, Detail pages)
- ✅ Team management (My Teams page)
- ✅ Profile management
- ✅ Responsive design
- ⏳ Submission system (placeholder)
- ⏳ Judging interface (placeholder)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Proprietary - Enterprise Use Only

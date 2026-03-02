# API Testing Guide

## Setup Required

1. **Start Docker services**
```bash
cd docker
docker-compose -f docker-compose.dev.yml up -d
```

2. **Setup database**
```bash
cd packages/database
cp .env.example .env
npm install bcrypt
npx prisma migrate dev --name init
npx prisma db seed
```

3. **Configure API environment**
```bash
cd apps/api
cp .env.example .env.local
# Edit .env.local with your settings
```

4. **Install API dependencies**
```bash
cd apps/api
npm install
```

5. **Start API server**
```bash
cd apps/api
npm run dev
```

API will be available at: http://localhost:3001/api/v1
Swagger docs: http://localhost:3001/api/docs

## Demo User Accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@ehms.com | Password123! |
| Organizer | organizer@ehms.com | Password123! |
| Participant | participant1@ehms.com | Password123! |
| Judge | judge@ehms.com | Password123! |

## API Endpoints

### Authentication

#### 1. Register New User
```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "Password123!",
    "name": "أحمد محمد",
    "preferredLocale": "ar"
  }'
```

**Response:**
```json
{
  "user": {
    "id": "clxxx...",
    "email": "newuser@example.com",
    "name": "أحمد محمد",
    "preferredLocale": "ar"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": 900
}
```

#### 2. Login
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "organizer@ehms.com",
    "password": "Password123!"
  }'
```

**Save the access token for subsequent requests!**

#### 3. Get Current User
```bash
curl -X GET http://localhost:3001/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### 4. Refresh Token
```bash
curl -X POST http://localhost:3001/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

#### 5. Logout
```bash
curl -X POST http://localhost:3001/api/v1/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Users

#### 1. Get Current User Profile
```bash
curl -X GET http://localhost:3001/api/v1/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### 2. Update Profile
```bash
curl -X PATCH http://localhost:3001/api/v1/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "أحمد علي المحدث",
    "bio": "مطور برمجيات متحمس للهاكاثونات",
    "skills": [
      {
        "name": { "en": "React", "ar": "React" },
        "level": "advanced"
      },
      {
        "name": { "en": "Node.js", "ar": "Node.js" },
        "level": "intermediate"
      }
    ]
  }'
```

#### 3. Get User's Teams
```bash
curl -X GET http://localhost:3001/api/v1/users/me/teams \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### 4. Search Users
```bash
curl -X GET "http://localhost:3001/api/v1/users/search?q=محمد&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Events

#### 1. Create Event (Organizer only)
```bash
curl -X POST http://localhost:3001/api/v1/events \
  -H "Authorization: Bearer ORGANIZER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": {
      "en": "Tech Hackathon 2024",
      "ar": "هاكاثون التقنية 2024"
    },
    "description": {
      "en": "A 48-hour hackathon for innovative tech solutions",
      "ar": "هاكاثون لمدة 48 ساعة للحلول التقنية المبتكرة"
    },
    "registrationStart": "2024-06-01T00:00:00Z",
    "registrationEnd": "2024-06-15T23:59:59Z",
    "hackingStart": "2024-06-20T09:00:00Z",
    "hackingEnd": "2024-06-22T18:00:00Z",
    "judgingEnd": "2024-06-25T18:00:00Z",
    "resultsDate": "2024-06-26T15:00:00Z",
    "maxTeamSize": 5,
    "minTeamSize": 2,
    "allowLateSubmissions": false,
    "rules": {
      "en": "1. Teams must be 2-5 members\n2. Original work only\n3. Submit by deadline",
      "ar": "1. يجب أن تتكون الفرق من 2-5 أعضاء\n2. عمل أصلي فقط\n3. التسليم قبل الموعد النهائي"
    },
    "prizes": [
      {
        "place": 1,
        "name": { "en": "First Place", "ar": "المركز الأول" },
        "amount": 50000,
        "currency": "SAR"
      },
      {
        "place": 2,
        "name": { "en": "Second Place", "ar": "المركز الثاني" },
        "amount": 30000,
        "currency": "SAR"
      }
    ]
  }'
```

#### 2. Get All Events (Public)
```bash
curl -X GET "http://localhost:3001/api/v1/events?page=1&limit=10"
```

#### 3. Get Event by ID (Public)
```bash
curl -X GET http://localhost:3001/api/v1/events/EVENT_ID
```

#### 4. Update Event (Organizer only)
```bash
curl -X PATCH http://localhost:3001/api/v1/events/EVENT_ID \
  -H "Authorization: Bearer ORGANIZER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": {
      "en": "Tech Hackathon 2024 - Updated",
      "ar": "هاكاثون التقنية 2024 - محدث"
    }
  }'
```

#### 5. Publish Event (Organizer only)
```bash
curl -X POST http://localhost:3001/api/v1/events/EVENT_ID/publish \
  -H "Authorization: Bearer ORGANIZER_ACCESS_TOKEN"
```

**This transitions the event from DRAFT → PUBLISHED**

#### 6. Register for Event (Participant)
```bash
curl -X POST http://localhost:3001/api/v1/events/EVENT_ID/register \
  -H "Authorization: Bearer PARTICIPANT_ACCESS_TOKEN"
```

#### 7. Get Event Teams
```bash
curl -X GET http://localhost:3001/api/v1/events/EVENT_ID/teams
```

#### 8. Get Event Submissions (With permissions)
```bash
curl -X GET http://localhost:3001/api/v1/events/EVENT_ID/submissions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Testing Flow

### Complete Hackathon Flow

1. **Login as Organizer**
```bash
# Get token
TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"organizer@ehms.com","password":"Password123!"}' | \
  jq -r '.accessToken')

echo "Token: $TOKEN"
```

2. **Create Event**
```bash
EVENT_ID=$(curl -s -X POST http://localhost:3001/api/v1/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": {"en": "Test Hackathon", "ar": "هاكاثون تجريبي"},
    "description": {"en": "Test event", "ar": "فعالية تجريبية"},
    "registrationStart": "2024-01-01T00:00:00Z",
    "registrationEnd": "2024-12-31T23:59:59Z",
    "hackingStart": "2025-01-01T00:00:00Z",
    "hackingEnd": "2025-01-03T23:59:59Z",
    "maxTeamSize": 5,
    "minTeamSize": 2,
    "allowLateSubmissions": false
  }' | jq -r '.id')

echo "Event ID: $EVENT_ID"
```

3. **Publish Event**
```bash
curl -X POST http://localhost:3001/api/v1/events/$EVENT_ID/publish \
  -H "Authorization: Bearer $TOKEN"
```

4. **Login as Participant and Register**
```bash
PARTICIPANT_TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"participant1@ehms.com","password":"Password123!"}' | \
  jq -r '.accessToken')

curl -X POST http://localhost:3001/api/v1/events/$EVENT_ID/register \
  -H "Authorization: Bearer $PARTICIPANT_TOKEN"
```

## Testing with Swagger UI

Visit http://localhost:3001/api/docs for interactive API documentation.

1. Click "Authorize" button
2. Enter: `Bearer YOUR_ACCESS_TOKEN`
3. Test endpoints interactively

## Common Issues

### 401 Unauthorized
- Token expired (15 min expiry)
- Use refresh token to get new access token

### 403 Forbidden
- User doesn't have required permissions
- Check user roles: `GET /auth/me`

### 404 Not Found
- Resource doesn't exist
- Check ID is correct

### 409 Conflict
- User already exists (registration)
- Already registered for event

## Bilingual Testing

### Test Arabic Headers
```bash
curl -X GET http://localhost:3001/api/v1/events \
  -H "Accept-Language: ar"
```

API will return localized responses based on Accept-Language header:
- `ar` → Arabic responses
- `en` → English responses (default)

### Example Arabic Response
```json
{
  "data": [
    {
      "name": "هاكاثون التقنية 2024",
      "description": "هاكاثون لمدة 48 ساعة"
    }
  ]
}
```

### Example English Response
```json
{
  "data": [
    {
      "name": "Tech Hackathon 2024",
      "description": "A 48-hour hackathon"
    }
  ]
}
```

## Event State Machine

Events follow this state flow:

1. **DRAFT** → Create event
2. **PUBLISHED** → Publish event (manual)
3. **REGISTRATION_OPEN** → Auto (when registrationStart reached)
4. **TEAM_FORMATION** → Auto (when registrationEnd reached)
5. **HACKING_PHASE** → Auto (when hackingStart reached, teams locked)
6. **SUBMISSION_CLOSED** → Auto (when hackingEnd reached)
7. **JUDGING** → Manual transition
8. **RESULTS_PUBLISHED** → Auto (when judgingEnd reached)
9. **ARCHIVED** → Manual transition

Auto-transitions run every 5 minutes via cron job.

## Next Steps

After testing the API:
1. Implement Teams module
2. Implement Submissions & File Upload
3. Implement Judging module
4. Build Next.js frontend

## Troubleshooting

### Database connection failed
```bash
cd docker
docker-compose -f docker-compose.dev.yml ps
```

Check if PostgreSQL is healthy.

### Prisma client not generated
```bash
cd packages/database
npx prisma generate
```

### Port 3001 already in use
```bash
lsof -i :3001
kill -9 PID
```

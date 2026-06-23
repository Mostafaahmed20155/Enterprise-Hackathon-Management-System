# Notification System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a working in-app notification system with a real-time red-dot bell icon and dropdown panel showing the last 10 notifications, backed by a Prisma `Notification` model and polled every 30s via React Query.

**Architecture:** A new `NotificationsModule` in NestJS exposes `GET /notifications`, `PATCH /notifications/:id/read`, and `PATCH /notifications/read-all`. `NotificationsService` is exported and injected into `TeamsService`, `EventStateService`, `SubmissionsService`, and `JudgingService` to fan out notifications at trigger points. The frontend polls the list endpoint every 30s; the bell dot appears when any unread notification exists.

**Tech Stack:** NestJS (Prisma, JWT auth), Next.js 14 (React Query, Tailwind/CSS modules, lucide-react, next-intl)

## Global Constraints

- All user-facing copy must be bilingual: `{ "en": "...", "ar": "..." }` JSON stored in Prisma `Json` fields
- Auth on all API endpoints: JWT guard via `@UseGuards(JwtAuthGuard)` + `@CurrentUser()` decorator (matches pattern in existing controllers)
- API base: `http://localhost:3001/api/v1` — all routes prefixed `/notifications`
- Frontend polls every **30 000 ms** (30s) via `refetchInterval` on React Query
- Bell shows **red dot only** (`.ehms-shell-pip` span, controlled by `has-pip` CSS class on button) — no number badge
- No new pages — notification panel is a dropdown from the bell button only
- Prisma client output: `node_modules/.prisma/client` (hoisted monorepo root)
- After any `schema.prisma` change: run `npx prisma migrate dev --name <name>` from `packages/database/`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `packages/database/prisma/schema.prisma` | Modify | Add `Notification` model + `User` relation |
| `apps/api/src/notifications/notifications.service.ts` | Create | CRUD for notifications, exported for injection |
| `apps/api/src/notifications/notifications.controller.ts` | Create | REST endpoints: list, mark-read, mark-all-read |
| `apps/api/src/notifications/notifications.module.ts` | Create | Module wiring, exports `NotificationsService` |
| `apps/api/src/app.module.ts` | Modify | Import `NotificationsModule` |
| `apps/api/src/teams/teams.module.ts` | Modify | Import `NotificationsModule` |
| `apps/api/src/teams/teams.service.ts` | Modify | Inject `NotificationsService`; fire on invite sent, accepted, declined |
| `apps/api/src/events/events.module.ts` | Modify | Import `NotificationsModule` |
| `apps/api/src/events/event-state.service.ts` | Modify | Inject `NotificationsService`; fire on REGISTRATION_OPEN, HACKING_PHASE, RESULTS_PUBLISHED |
| `apps/api/src/judging/judging.module.ts` | Modify | Import `NotificationsModule` |
| `apps/api/src/judging/judging.service.ts` | Modify | Inject `NotificationsService`; fire on assignment created |
| `apps/api/src/submissions/submissions.module.ts` | Modify | Import `NotificationsModule` |
| `apps/api/src/submissions/submissions.service.ts` | Modify | Inject `NotificationsService`; fire on status change to WINNER or DISQUALIFIED |
| `apps/web/lib/api.ts` | Modify | Add `notificationsApi` with `list`, `markRead`, `markAllRead` |
| `apps/web/components/notifications/notification-panel.tsx` | Create | Dropdown panel: list items, mark-read on click, mark-all button |
| `apps/web/app/[locale]/(dashboard)/layout.tsx` | Modify | Wire bell button: real `hasUnread` dot + open/close panel |

---

### Task 1: Add Notification model to Prisma schema

**Files:**
- Modify: `packages/database/prisma/schema.prisma`

**Interfaces:**
- Produces: `Notification` model available via `prisma.notification.*` with fields `id`, `userId`, `type`, `title` (Json), `body` (Json), `link` (String?), `isRead` (Boolean), `readAt` (DateTime?), `createdAt` (DateTime)

- [ ] **Step 1: Add Notification model to schema**

Open `packages/database/prisma/schema.prisma` and add this block after the `AuditLog` model (before the final closing line), and add the `notifications` relation to the `User` model:

In the `User` model, after the `judgingScores` relation line, add:
```prisma
  notifications  Notification[]
```

Then add at the end of the file:
```prisma
model Notification {
  id        String    @id @default(cuid())
  userId    String
  type      String    // TEAM_INVITE_RECEIVED | TEAM_INVITE_ACCEPTED | TEAM_INVITE_DECLINED | EVENT_STATE_CHANGED | SUBMISSION_STATUS_CHANGED | JUDGING_ASSIGNED
  title     Json      // { "en": "...", "ar": "..." }
  body      Json      // { "en": "...", "ar": "..." }
  link      String?
  isRead    Boolean   @default(false)
  readAt    DateTime?
  createdAt DateTime  @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isRead])
  @@index([userId, createdAt])
  @@map("notifications")
}
```

- [ ] **Step 2: Run migration**

```bash
cd packages/database
npx prisma migrate dev --name add_notifications
```

Expected output: `Your database is now in sync with your schema.`

- [ ] **Step 3: Verify Prisma client has Notification type**

```bash
cd packages/database
npx prisma generate
```

Expected: `Generated Prisma Client` with no errors.

- [ ] **Step 4: Commit**

```bash
git add packages/database/prisma/schema.prisma
git add packages/database/prisma/migrations/
git commit -m "feat(db): add Notification model"
```

---

### Task 2: Create NotificationsService and NotificationsModule

**Files:**
- Create: `apps/api/src/notifications/notifications.service.ts`
- Create: `apps/api/src/notifications/notifications.module.ts`

**Interfaces:**
- Consumes: `PrismaService` from `../prisma/prisma.service`
- Produces:
  - `NotificationsService.create(data: CreateNotificationData): Promise<void>`
    - `CreateNotificationData = { userId: string; type: string; title: { en: string; ar: string }; body: { en: string; ar: string }; link?: string }`
  - `NotificationsService.findForUser(userId: string): Promise<{ data: Notification[]; hasUnread: boolean }>`
  - `NotificationsService.markRead(id: string, userId: string): Promise<void>`
  - `NotificationsService.markAllRead(userId: string): Promise<void>`

- [ ] **Step 1: Create NotificationsService**

Create `apps/api/src/notifications/notifications.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateNotificationData {
  userId: string;
  type: string;
  title: { en: string; ar: string };
  body: { en: string; ar: string };
  link?: string;
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateNotificationData): Promise<void> {
    await this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title as any,
        body: data.body as any,
        link: data.link,
      },
    });
  }

  async findForUser(userId: string): Promise<{ data: any[]; hasUnread: boolean }> {
    const [data, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return { data, hasUnread: unreadCount > 0 };
  }

  async markRead(id: string, userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }
}
```

- [ ] **Step 2: Create NotificationsModule**

Create `apps/api/src/notifications/notifications.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
```

- [ ] **Step 3: Commit (controller comes in Task 3 — module file references it, so Tasks 2 and 3 must be committed together after Task 3 is done)**

Hold commit until Task 3 is complete.

---

### Task 3: Create NotificationsController

**Files:**
- Create: `apps/api/src/notifications/notifications.controller.ts`

**Interfaces:**
- Consumes: `NotificationsService.findForUser`, `markRead`, `markAllRead`
- Consumes: `JwtAuthGuard` from `../auth/guards/jwt-auth.guard`, `CurrentUser` from `../common/decorators/current-user.decorator`
- Produces: REST endpoints used by the frontend `notificationsApi`:
  - `GET /notifications` → `{ data: Notification[], hasUnread: boolean }`
  - `PATCH /notifications/:id/read` → `204`
  - `PATCH /notifications/read-all` → `204`

- [ ] **Step 1: Create NotificationsController**

Create `apps/api/src/notifications/notifications.controller.ts`:

```typescript
import { Controller, Get, Patch, Param, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Get()
  async list(@CurrentUser() user: { id: string }) {
    return this.notifications.findForUser(user.id);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async readAll(@CurrentUser() user: { id: string }) {
    await this.notifications.markAllRead(user.id);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  async read(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    await this.notifications.markRead(id, user.id);
  }
}
```

Note: `read-all` route must be defined **before** `:id/read` so NestJS does not treat "read-all" as an id param.

- [ ] **Step 2: Commit Tasks 2 and 3 together**

```bash
git add apps/api/src/notifications/
git commit -m "feat(api): add NotificationsService, Controller, and Module"
```

---

### Task 4: Register NotificationsModule in AppModule

**Files:**
- Modify: `apps/api/src/app.module.ts`

**Interfaces:**
- Consumes: `NotificationsModule` from `./notifications/notifications.module`

- [ ] **Step 1: Import NotificationsModule in AppModule**

In `apps/api/src/app.module.ts`, add the import and add it to the `imports` array:

```typescript
import { NotificationsModule } from './notifications/notifications.module';
```

Add `NotificationsModule` to the `imports` array after `JudgingModule`:

```typescript
    JudgingModule,
    NotificationsModule,
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/app.module.ts
git commit -m "feat(api): register NotificationsModule in AppModule"
```

---

### Task 5: Wire notifications into TeamsService

**Files:**
- Modify: `apps/api/src/teams/teams.module.ts`
- Modify: `apps/api/src/teams/teams.service.ts`

**Interfaces:**
- Consumes: `NotificationsService.create(data: CreateNotificationData): Promise<void>`
- Trigger points:
  1. `inviteMember()` — after `prisma.teamInvite.create()` → notify the **invited user** (if they exist in the system) with type `TEAM_INVITE_RECEIVED`
  2. `respondToInvite()` on accept → notify the **team leader** with type `TEAM_INVITE_ACCEPTED`
  3. `respondToInvite()` on decline → notify the **team leader** with type `TEAM_INVITE_DECLINED`

- [ ] **Step 1: Update TeamsModule to import NotificationsModule**

Replace contents of `apps/api/src/teams/teams.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { TeamsController } from './teams.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [TeamsController],
  providers: [TeamsService],
  exports: [TeamsService],
})
export class TeamsModule {}
```

- [ ] **Step 2: Inject NotificationsService into TeamsService**

In `apps/api/src/teams/teams.service.ts`, add the import:

```typescript
import { NotificationsService } from '../notifications/notifications.service';
```

Change the constructor from:

```typescript
  constructor(private prisma: PrismaService) {}
```

To:

```typescript
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}
```

- [ ] **Step 3: Fire notification after invite created in `inviteMember()`**

After the `await this.prisma.teamInvite.create(...)` call and before the `return` statement in `inviteMember()`, add:

```typescript
    // Notify the invited user if they already have an account
    if (invitedUser) {
      const teamName = (team.name as any)?.en || 'a team';
      await this.notifications.create({
        userId: invitedUser.id,
        type: 'TEAM_INVITE_RECEIVED',
        title: { en: 'Team Invitation', ar: 'دعوة للفريق' },
        body: {
          en: `You have been invited to join ${teamName}`,
          ar: `تمت دعوتك للانضمام إلى ${(team.name as any)?.ar || teamName}`,
        },
        link: '/teams',
      });
    }
```

- [ ] **Step 4: Fire notification after invite accepted/declined in `respondToInvite()`**

Find the `if (!accept)` block in `respondToInvite()`. Replace the entire `if (!accept) { ... }` block and the accept flow's final `return` with:

```typescript
    if (!accept) {
      await this.prisma.teamInvite.update({
        where: { id: inviteId },
        data: { status: InviteStatus.DECLINED },
      });

      // Notify the team leader
      const decliningUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });
      await this.notifications.create({
        userId: invite.team.leaderId,
        type: 'TEAM_INVITE_DECLINED',
        title: { en: 'Invitation Declined', ar: 'تم رفض الدعوة' },
        body: {
          en: `${decliningUser?.name || 'A user'} declined your team invitation`,
          ar: `${decliningUser?.name || 'مستخدم'} رفض دعوتك للفريق`,
        },
        link: '/teams',
      });

      return {
        message: {
          en: 'Invite declined',
          ar: 'تم رفض الدعوة',
        },
      };
    }
```

After the `await this.prisma.teamInvite.update({ where: { id: inviteId }, data: { status: InviteStatus.ACCEPTED } })` call and before the final `return` in `respondToInvite()`, add:

```typescript
    // Notify the team leader
    const joiningUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    await this.notifications.create({
      userId: invite.team.leaderId,
      type: 'TEAM_INVITE_ACCEPTED',
      title: { en: 'Invitation Accepted', ar: 'تم قبول الدعوة' },
      body: {
        en: `${joiningUser?.name || 'A user'} accepted your invitation and joined the team`,
        ar: `${joiningUser?.name || 'مستخدم'} قبل دعوتك وانضم إلى الفريق`,
      },
      link: '/teams',
    });
```

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/teams/teams.module.ts apps/api/src/teams/teams.service.ts
git commit -m "feat(teams): fire notifications on invite sent, accepted, declined"
```

---

### Task 6: Wire notifications into EventStateService

**Files:**
- Modify: `apps/api/src/events/events.module.ts`
- Modify: `apps/api/src/events/event-state.service.ts`

**Interfaces:**
- Consumes: `NotificationsService.create(data: CreateNotificationData): Promise<void>`
- Trigger points in `transition()` after `prisma.event.update()`:
  - `toState === REGISTRATION_OPEN` → notify all users in `EventRegistration` for this event
  - `toState === HACKING_PHASE` → notify all team members for this event
  - `toState === RESULTS_PUBLISHED` → notify all team members for this event

- [ ] **Step 1: Update EventsModule to import NotificationsModule**

Replace contents of `apps/api/src/events/events.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { EventStateService } from './event-state.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [EventsController],
  providers: [EventsService, EventStateService],
  exports: [EventsService, EventStateService],
})
export class EventsModule {}
```

- [ ] **Step 2: Inject NotificationsService into EventStateService**

In `apps/api/src/events/event-state.service.ts`, add the import:

```typescript
import { NotificationsService } from '../notifications/notifications.service';
```

Change the constructor from:

```typescript
  constructor(private prisma: PrismaService) {}
```

To:

```typescript
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}
```

- [ ] **Step 3: Add private helper to fan out notifications to user IDs**

After the constructor in `EventStateService`, add:

```typescript
  private async notifyUsers(
    userIds: string[],
    type: string,
    title: { en: string; ar: string },
    body: { en: string; ar: string },
    link: string,
  ): Promise<void> {
    await Promise.all(
      userIds.map((userId) =>
        this.notifications.create({ userId, type, title, body, link }),
      ),
    );
  }
```

- [ ] **Step 4: Fire event-state notifications in `transition()`**

After the `// Execute side effects` block at the end of `transition()`, add:

```typescript
    // Fan-out notifications for key state transitions
    const eventName = (event.name as any)?.en || 'An event';
    const eventNameAr = (event.name as any)?.ar || eventName;
    const eventLink = `/events/${event.id}`;

    if (toState === EventState.REGISTRATION_OPEN) {
      const registrations = await this.prisma.eventRegistration.findMany({
        where: { eventId: event.id },
        select: { userId: true },
      });
      await this.notifyUsers(
        registrations.map((r) => r.userId),
        'EVENT_STATE_CHANGED',
        { en: 'Registration Now Open', ar: 'التسجيل مفتوح الآن' },
        { en: `Registration for ${eventName} is now open`, ar: `التسجيل في ${eventNameAr} مفتوح الآن` },
        eventLink,
      );
    }

    if (toState === EventState.HACKING_PHASE) {
      const members = await this.prisma.teamMember.findMany({
        where: { team: { eventId: event.id } },
        select: { userId: true },
      });
      await this.notifyUsers(
        members.map((m) => m.userId),
        'EVENT_STATE_CHANGED',
        { en: 'Hacking Phase Started', ar: 'بدأت مرحلة الهاكاثون' },
        { en: `The hacking phase for ${eventName} has begun`, ar: `بدأت مرحلة الهاكاثون في ${eventNameAr}` },
        eventLink,
      );
    }

    if (toState === EventState.RESULTS_PUBLISHED) {
      const members = await this.prisma.teamMember.findMany({
        where: { team: { eventId: event.id } },
        select: { userId: true },
      });
      await this.notifyUsers(
        members.map((m) => m.userId),
        'EVENT_STATE_CHANGED',
        { en: 'Results Published', ar: 'تم نشر النتائج' },
        { en: `Results for ${eventName} have been published`, ar: `تم نشر نتائج ${eventNameAr}` },
        eventLink,
      );
    }
```

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/events/events.module.ts apps/api/src/events/event-state.service.ts
git commit -m "feat(events): fire notifications on key event state transitions"
```

---

### Task 7: Wire notifications into JudgingService

**Files:**
- Modify: `apps/api/src/judging/judging.module.ts`
- Modify: `apps/api/src/judging/judging.service.ts`

**Interfaces:**
- Consumes: `NotificationsService.create(data: CreateNotificationData): Promise<void>`
- Trigger: `createAssignment()` after `prisma.judgingAssignment.create()` → notify the judge with type `JUDGING_ASSIGNED`

- [ ] **Step 1: Update JudgingModule to import NotificationsModule**

Replace contents of `apps/api/src/judging/judging.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { JudgingService } from './judging.service';
import { JudgingController } from './judging.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [JudgingController],
  providers: [JudgingService],
  exports: [JudgingService],
})
export class JudgingModule {}
```

- [ ] **Step 2: Inject NotificationsService into JudgingService**

In `apps/api/src/judging/judging.service.ts`, add the import:

```typescript
import { NotificationsService } from '../notifications/notifications.service';
```

Change the constructor from:

```typescript
  constructor(private prisma: PrismaService) {}
```

To:

```typescript
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}
```

- [ ] **Step 3: Find where createAssignment() returns and add notification before it**

In `judging.service.ts`, find the `createAssignment()` method. After `prisma.judgingAssignment.create(...)` returns and before the `return` statement, add:

```typescript
    const eventName = (event.name as any)?.en || 'an event';
    const eventNameAr = (event.name as any)?.ar || eventName;
    await this.notifications.create({
      userId: dto.judgeId,
      type: 'JUDGING_ASSIGNED',
      title: { en: 'Judging Assignment', ar: 'تعيين تحكيم' },
      body: {
        en: `You have been assigned as a judge for ${eventName}`,
        ar: `تم تعيينك حكماً في ${eventNameAr}`,
      },
      link: `/judging`,
    });
```

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/judging/judging.module.ts apps/api/src/judging/judging.service.ts
git commit -m "feat(judging): fire notification on judge assignment"
```

---

### Task 8: Wire notifications into SubmissionsService

**Files:**
- Modify: `apps/api/src/submissions/submissions.module.ts`
- Modify: `apps/api/src/submissions/submissions.service.ts`

**Interfaces:**
- Consumes: `NotificationsService.create(data: CreateNotificationData): Promise<void>`
- Trigger: any method that updates `status` to `WINNER` or `DISQUALIFIED` — notify the submission `authorId` with type `SUBMISSION_STATUS_CHANGED`

- [ ] **Step 1: Read the submissions module to confirm its shape**

Read `apps/api/src/submissions/submissions.module.ts` — it follows the same pattern as `TeamsModule`.

- [ ] **Step 2: Update SubmissionsModule to import NotificationsModule**

Replace contents of `apps/api/src/submissions/submissions.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { SubmissionsService } from './submissions.service';
import { SubmissionsController } from './submissions.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [SubmissionsController],
  providers: [SubmissionsService],
  exports: [SubmissionsService],
})
export class SubmissionsModule {}
```

- [ ] **Step 3: Inject NotificationsService into SubmissionsService**

In `apps/api/src/submissions/submissions.service.ts`, add the import:

```typescript
import { NotificationsService } from '../notifications/notifications.service';
```

The service currently has `constructor(private prisma: PrismaService, private storage: StorageService) {}`. Change it to:

```typescript
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private notifications: NotificationsService,
  ) {}
```

- [ ] **Step 4: Add a private helper to notify on status change**

After the constructor in `SubmissionsService`, add:

```typescript
  private async notifySubmissionStatus(
    submission: { id: string; authorId: string; title: any },
    newStatus: string,
  ): Promise<void> {
    if (newStatus !== 'WINNER' && newStatus !== 'DISQUALIFIED') return;

    const titleEn = (submission.title as any)?.en || 'Your submission';
    const titleAr = (submission.title as any)?.ar || titleEn;

    const isWinner = newStatus === 'WINNER';
    await this.notifications.create({
      userId: submission.authorId,
      type: 'SUBMISSION_STATUS_CHANGED',
      title: isWinner
        ? { en: 'Congratulations!', ar: 'تهانينا!' }
        : { en: 'Submission Update', ar: 'تحديث المشروع' },
      body: isWinner
        ? { en: `"${titleEn}" has been selected as a winner`, ar: `"${titleAr}" تم اختياره فائزاً` }
        : { en: `"${titleEn}" has been disqualified`, ar: `"${titleAr}" تم استبعاده` },
      link: `/submissions/${submission.id}`,
    });
  }
```

- [ ] **Step 5: Find status-update call sites in SubmissionsService and add notification**

Read `apps/api/src/submissions/submissions.service.ts` to find any method that calls `prisma.submission.update({ data: { status: ... } })`. For each such call site where the new status is provided, call `this.notifySubmissionStatus()` after the update.

The pattern to look for and extend:

```typescript
    const updated = await this.prisma.submission.update({
      where: { id },
      data: { status: dto.status, ... },
      // ...
    });
    await this.notifySubmissionStatus(updated, dto.status);
    return updated;
```

If no explicit status-update method exists beyond `update()`, add the call there for any update that touches `status`.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/submissions/submissions.module.ts apps/api/src/submissions/submissions.service.ts
git commit -m "feat(submissions): fire notifications on WINNER and DISQUALIFIED status"
```

---

### Task 9: Add notificationsApi to frontend API client

**Files:**
- Modify: `apps/web/lib/api.ts`

**Interfaces:**
- Produces:
  - `notificationsApi.list(): Promise<AxiosResponse<{ data: NotificationItem[]; hasUnread: boolean }>>`
  - `notificationsApi.markRead(id: string): Promise<AxiosResponse<void>>`
  - `notificationsApi.markAllRead(): Promise<AxiosResponse<void>>`
  - `NotificationItem = { id: string; type: string; title: { en: string; ar: string }; body: { en: string; ar: string }; link?: string; isRead: boolean; createdAt: string }`

- [ ] **Step 1: Add NotificationItem type and notificationsApi to api.ts**

At the bottom of `apps/web/lib/api.ts`, append:

```typescript
export interface NotificationItem {
  id: string;
  type: string;
  title: { en: string; ar: string };
  body: { en: string; ar: string };
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export const notificationsApi = {
  list: () => api.get<{ data: NotificationItem[]; hasUnread: boolean }>('/notifications'),
  markRead: (id: string) => api.patch<void>(`/notifications/${id}/read`),
  markAllRead: () => api.patch<void>('/notifications/read-all'),
};
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/lib/api.ts
git commit -m "feat(web): add notificationsApi client"
```

---

### Task 10: Create NotificationPanel component

**Files:**
- Create: `apps/web/components/notifications/notification-panel.tsx`

**Interfaces:**
- Consumes: `notificationsApi` from `@/lib/api`, `NotificationItem` type from `@/lib/api`
- Props: `{ onClose: () => void; locale: 'en' | 'ar' }`
- Produces: `<NotificationPanel>` — self-contained dropdown list with mark-all-read button

- [ ] **Step 1: Create the NotificationPanel component**

Create `apps/web/components/notifications/notification-panel.tsx`:

```typescript
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi, NotificationItem } from '@/lib/api';
import { useRouter } from '@/i18n/routing';
import { Check } from 'lucide-react';

interface Props {
  onClose: () => void;
  locale: 'en' | 'ar';
}

export function NotificationPanel({ onClose, locale }: Props) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list().then((r) => r.data),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const handleItemClick = (item: NotificationItem) => {
    if (!item.isRead) {
      markRead.mutate(item.id);
    }
    if (item.link) {
      router.push(item.link as any);
    }
    onClose();
  };

  const notifications = data?.data ?? [];

  return (
    <div className="ehms-notification-panel">
      <div className="ehms-notification-panel-header">
        <span>{locale === 'ar' ? 'الإشعارات' : 'Notifications'}</span>
        {notifications.some((n) => !n.isRead) && (
          <button
            type="button"
            className="ehms-notification-mark-all"
            onClick={() => markAllRead.mutate()}
          >
            <Check size={12} aria-hidden />
            {locale === 'ar' ? 'تعليم الكل مقروءاً' : 'Mark all read'}
          </button>
        )}
      </div>

      <div className="ehms-notification-list">
        {isLoading && (
          <div className="ehms-notification-empty">
            {locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </div>
        )}

        {!isLoading && notifications.length === 0 && (
          <div className="ehms-notification-empty">
            {locale === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}
          </div>
        )}

        {notifications.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`ehms-notification-item ${item.isRead ? 'is-read' : 'is-unread'}`}
            onClick={() => handleItemClick(item)}
          >
            <div className="ehms-notification-item-title">
              {item.title[locale] ?? item.title.en}
            </div>
            <div className="ehms-notification-item-body">
              {item.body[locale] ?? item.body.en}
            </div>
            <div className="ehms-notification-item-time">
              {new Date(item.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/notifications/notification-panel.tsx
git commit -m "feat(web): add NotificationPanel dropdown component"
```

---

### Task 11: Wire bell button in DashboardLayout

**Files:**
- Modify: `apps/web/app/[locale]/(dashboard)/layout.tsx`
- Modify: `apps/web/app/globals.css`

**Interfaces:**
- Consumes: `notificationsApi` from `@/lib/api`, `NotificationPanel` from `@/components/notifications/notification-panel`
- Produces: a working bell button that: polls for unread status every 30s, shows/hides red dot, toggles the `NotificationPanel` dropdown on click

- [ ] **Step 1: Add notification query and panel state to DashboardLayout**

In `apps/web/app/[locale]/(dashboard)/layout.tsx`, add these imports at the top alongside the existing imports:

```typescript
import { NotificationPanel } from '@/components/notifications/notification-panel';
import { notificationsApi } from '@/lib/api';
```

Add a state for panel visibility after the existing `useState` call:

```typescript
  const [isNotifOpen, setIsNotifOpen] = useState(false);
```

Add a React Query for notifications after the existing `invitesQuery`:

```typescript
  const notifQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list().then((r) => r.data),
    refetchInterval: 30_000,
  });
  const hasUnread = notifQuery.data?.hasUnread ?? false;
```

- [ ] **Step 2: Replace the hardcoded bell button with the wired version**

Find this block in the `return` JSX:

```typescript
            <button
              type="button"
              className="ehms-shell-icon-btn has-pip"
              aria-label={copy.notificationsLabel}
            >
              <Bell aria-hidden size={16} />
              <span className="ehms-shell-pip" />
            </button>
```

Replace it with:

```typescript
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className={`ehms-shell-icon-btn ${hasUnread ? 'has-pip' : ''}`}
                aria-label={copy.notificationsLabel}
                onClick={() => setIsNotifOpen((v) => !v)}
              >
                <Bell aria-hidden size={16} />
                {hasUnread && <span className="ehms-shell-pip" />}
              </button>
              {isNotifOpen && (
                <NotificationPanel
                  onClose={() => setIsNotifOpen(false)}
                  locale={isRtl ? 'ar' : 'en'}
                />
              )}
            </div>
```

- [ ] **Step 3: Add CSS for the notification panel**

In `apps/web/app/globals.css`, append these styles at the end of the file:

```css
/* Notification panel */
.ehms-notification-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 100;
  width: 320px;
  background: var(--ehms-surface, #fff);
  border: 1px solid var(--ehms-border, #e5e7eb);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.ehms-notification-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 600;
  border-bottom: 1px solid var(--ehms-border, #e5e7eb);
}

.ehms-notification-mark-all {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--ehms-accent, #6366f1);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.ehms-notification-mark-all:hover {
  text-decoration: underline;
}

.ehms-notification-list {
  max-height: 360px;
  overflow-y: auto;
}

.ehms-notification-empty {
  padding: 24px 16px;
  text-align: center;
  font-size: 13px;
  color: var(--ehms-muted, #6b7280);
}

.ehms-notification-item {
  display: block;
  width: 100%;
  text-align: start;
  padding: 12px 16px;
  border: none;
  border-bottom: 1px solid var(--ehms-border, #e5e7eb);
  background: none;
  cursor: pointer;
  transition: background 0.15s;
}

.ehms-notification-item:last-child {
  border-bottom: none;
}

.ehms-notification-item:hover {
  background: var(--ehms-hover, #f9fafb);
}

.ehms-notification-item.is-unread {
  background: var(--ehms-unread-bg, #f0f0ff);
}

.ehms-notification-item.is-unread:hover {
  background: var(--ehms-unread-hover, #e8e8ff);
}

.ehms-notification-item-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 2px;
}

.ehms-notification-item-body {
  font-size: 12px;
  color: var(--ehms-muted, #6b7280);
  margin-bottom: 4px;
  line-height: 1.4;
}

.ehms-notification-item-time {
  font-size: 11px;
  color: var(--ehms-muted, #9ca3af);
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/[locale]/\(dashboard\)/layout.tsx apps/web/app/globals.css
git commit -m "feat(web): wire bell button to real notification data and panel"
```

---

## Self-Review

**Spec coverage check:**
- ✅ `Notification` model with bilingual `title`/`body`, `isRead`, `link` — Task 1
- ✅ Triggers: team invite received, accepted, declined — Task 5
- ✅ Triggers: event state changes (REGISTRATION_OPEN, HACKING_PHASE, RESULTS_PUBLISHED) — Task 6
- ✅ Triggers: judging assignment — Task 7
- ✅ Triggers: submission WINNER/DISQUALIFIED — Task 8
- ✅ REST endpoints: GET list, PATCH read, PATCH read-all — Tasks 2–3
- ✅ 30s polling via React Query — Task 11
- ✅ Red dot only (no number badge), driven by real `hasUnread` — Task 11
- ✅ Dropdown panel, last 10 notifications, mark-read on click, mark-all button — Task 10
- ✅ Bilingual panel copy — Task 10

**Placeholder scan:** No TBD/TODO items found.

**Type consistency:**
- `CreateNotificationData` defined in Task 2, consumed in Tasks 5–8 ✅
- `NotificationItem` defined in Task 9, consumed in Task 10 ✅
- `notificationsApi.list()` returns `{ data: NotificationItem[]; hasUnread: boolean }` — matches `NotificationsService.findForUser()` return shape ✅
- `['notifications']` query key used consistently in Task 10 and Task 11 ✅

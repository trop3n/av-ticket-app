# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Next.js dev server (http://localhost:3000)
npm run build        # Production build
npm run start        # Run production build
npm run lint         # ESLint (flat config in eslint.config.mjs)

npm run db:migrate   # prisma migrate dev — create+apply a new migration
npm run db:push      # prisma db push — sync schema without creating a migration (prototyping only)
npm run db:seed      # Seed departments (AV/ENGINEERING/TECH_SUPPORT) + admin@example.com / admin1234
npm run db:studio    # Prisma Studio GUI
```

Docker: `docker compose up --build` starts app + Postgres. The app container runs `prisma migrate deploy` on boot (see `Dockerfile` CMD), so migrations must be committed — `db:push` changes won't apply in Docker.

No test runner is configured.

## Architecture

This is a Next.js 16 App Router IT service desk app. Stack: React 19, TypeScript (strict), Tailwind v4, shadcn/ui (New York), Prisma 7 + PostgreSQL, Auth.js v5 beta, React Hook Form + Zod, `@hello-pangea/dnd` for kanban.

### Auth is split into two files — edge vs. Node

- `lib/auth.config.ts` — **edge-safe** config (JWT strategy, callbacks that read from token, no DB/bcrypt imports). Imported by `middleware.ts`, which runs on the edge.
- `lib/auth.ts` — full config that spreads `authConfig` and adds `PrismaAdapter`, the Credentials provider (bcrypt), and a `jwt` callback that hydrates `role` + `departmentId` from Prisma.

Microsoft Entra ID is added to the provider list **only if** `AUTH_MICROSOFT_ENTRA_ID_ID`, `_SECRET`, and `_TENANT_ID` are all set. The sign-in page reads `entraIdConfigured` to decide whether to render that button. Don't move DB or Node-only code into `auth.config.ts` or middleware will break at build/runtime.

Session is augmented via module augmentation in `auth.config.ts`: `session.user` has `id`, `role: UserRole`, `departmentId: string | null`.

### Roles and authorization

Roles: `ADMIN`, `TECHNICIAN`, `REQUESTER` (Prisma enum `UserRole`). Authorization is enforced **per-route-handler**, not centrally:

- Requesters can only see/modify their own tickets — checked in `app/api/tickets/route.ts` (GET filters by `submitterId`), `app/api/tickets/[id]/route.ts` (GET/PATCH return 403), and `app/page.tsx` (dashboard scoping).
- The kanban board passes `canDrag={!isRequester}` to disable drag for requesters.
- Nav items in `components/shared/navbar.tsx` filter by `roles` array; the admin page and department board pages do their own role checks.

When adding new ticket endpoints, replicate this pattern — don't assume middleware has already filtered.

### Real-time updates via SSE

`lib/events.ts` exposes a **process-global** `EventEmitter` (stashed on `globalThis` in dev to survive HMR). API routes call `emitTicketEvent({ type, ticketId, departmentSlug, data })` after writes. `app/api/events/route.ts` is a `force-dynamic` SSE endpoint that subscribes each client to this emitter. `lib/hooks/use-ticket-events.ts` (`useTicketEvents`) manages the `EventSource` with 5s reconnect and optional departmentSlug filter.

Implication: this works for a single app instance only. Horizontally scaling requires an external pub/sub (Redis, etc.) — the in-memory emitter won't propagate across replicas.

### Notifications are fire-and-forget

`lib/notifications/index.ts` exports `notifyTicketCreated`, `notifyTicketAssigned`, `notifyStatusChanged`, `notifyCommentAdded`, `notifyPriorityUrgent`. They're called from API routes with `.catch(() => {})` so delivery failures never block the HTTP response. Email uses SMTP (nodemailer, `SMTP_*` env); Teams uses an incoming webhook (`TEAMS_WEBHOOK_URL`). If either env is missing, the send is a no-op.

### Prisma client

`lib/prisma.ts` uses `@prisma/adapter-pg` (the native pg driver adapter, not the default engine) with a singleton cached on `globalThis` in non-production. `prisma/seed.ts` instantiates its own client the same way. `prisma.config.ts` (Prisma 7's new config format) replaces the old `package.json#prisma` block for most settings.

### Data model highlights (`prisma/schema.prisma`)

- `Ticket` has auto-incrementing `number` (human-facing ID) alongside the `cuid()` `id`. Status flows `NEW → IN_PROGRESS → REVIEW → DONE` (plus `CANCELLED`). Composite indexes on `[departmentId, status]` and `[submitterId]`.
- `TicketAssignment` is many-to-many (a ticket can have multiple assignees).
- `ActivityLog` is written from API routes for TICKET_CREATED / TICKET_UPDATED / etc. — keep writing to it when adding new mutation endpoints.
- `Department.slug` is an enum (`DepartmentSlug`), not free text — URLs like `/board/av` map to these slugs (lowercased in navbar, the page handler should uppercase before querying).

### Validation

Zod schemas live in `types/index.ts` (`createTicketSchema`, `updateTicketSchema`, `createCommentSchema`, `updateUserSchema`). API routes call `schema.safeParse(body)` and return `400` with `error.flatten()` on failure. Keep new schemas here rather than colocating in route files.

### Path aliases

`@/*` → repo root (see `tsconfig.json`). So `@/lib/auth`, `@/components/ui/button`, `@/types`.

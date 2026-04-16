# Design System — IT Service Desk

> **Retrieval rule:** When building a page, first check `design-system/it-service-desk/pages/<page>.md`. If it exists, its rules override this file. Otherwise follow this file exclusively.

**Project:** IT Service Desk (internal tool, ticketing)
**Generated:** 2026-04-16 · adapted for the existing Next.js 16 + shadcn/ui + Tailwind v4 stack
**Category:** Productivity / Dashboard (not landing page)

---

## 1. Product pattern — App Shell + Data Views

This is not a marketing site. Anti-patterns the raw generator suggested (Hero / Features / CTA above fold) do not apply. The shipping pattern is:

- **Persistent top nav** (`components/shared/navbar.tsx`) — product name left, role-scoped links, user menu right. Already floating-capable; keep sticky with backdrop blur.
- **Primary surface = Dashboard** (`/`) — stats strip over Kanban board. The stats strip is context, not the main action.
- **Per-department boards** (`/board/[department]`) — same Kanban, department-filtered.
- **Detail view** (`/tickets/[id]`) — two-column on desktop (ticket body + activity sidebar), stacked on mobile.
- **Form view** (`/tickets/new`) — single-column, RHF + Zod, inline validation.
- **Admin** (`/admin`) — DataTable pattern with filters.

**CTA placement:** one persistent "New Ticket" button top-right of every page that has room. Not a hero.

---

## 2. Color tokens

The repo already ships shadcn's neutral OKLCH theme (`app/globals.css`). **Do not rip it out.** Layer domain-specific semantic tokens on top.

### 2.1 Base palette — keep existing shadcn neutrals

No change to `--background`, `--foreground`, `--card`, `--muted`, `--border`, `--primary` (near-black), `--destructive`. These already hit WCAG AA.

### 2.2 CTA accent (adopted)

One CTA accent is defined in `app/globals.css` for the single primary action across the app (creating a ticket). Exposed as Tailwind token `bg-accent-cta` / `text-accent-cta-foreground` and as a shadcn Button variant.

```css
/* :root and .dark */
--accent-cta: oklch(0.705 0.213 47.604);    /* Tailwind orange-500 ≈ #F97316 */
--accent-cta-foreground: oklch(1 0 0);
```

**Usage:** only via `<Button variant="cta">`. Do not apply the token to secondary actions, nav links, or badges — its job is to be rare so it pops.

**Known contrast caveat:** white on orange-500 is ≈ 2.8:1, below WCAG AA (4.5:1) for normal text. The `cta` variant mitigates with `font-semibold` but does not reach AA at 14px. If a strict-AA pass is needed, swap the token to Tailwind orange-700 (`oklch(0.553 0.195 38.402)` ≈ #C2410C, 5.2:1) in a single edit.

### 2.3 Status tokens (REQUIRED — app-specific)

Ticket status is a first-class visual signal; the board, cards, and detail view all depend on it. Add these semantic tokens; do not inline hex.

| Status        | Light (OKLCH)            | Use                              | Hex ref |
|---------------|--------------------------|----------------------------------|---------|
| `NEW`         | `oklch(0.70 0.13 245)`   | Badge bg; board column header    | ~#3B82F6 (blue-500) |
| `IN_PROGRESS` | `oklch(0.75 0.15 85)`    | Badge bg; board column header    | ~#EAB308 (yellow-500) |
| `REVIEW`      | `oklch(0.68 0.17 295)`   | Badge bg; board column header    | ~#A855F7 (purple-500) |
| `DONE`        | `oklch(0.72 0.17 150)`   | Badge bg; board column header    | ~#22C55E (green-500) |
| `CANCELLED`   | `var(--muted-foreground)`| Strikethrough badge, greyed card | — |

Add each as `--status-<name>` and `--status-<name>-foreground` so badges work in both themes. Always pair background + foreground — never rely on color alone (a11y).

### 2.4 Priority tokens (REQUIRED — app-specific)

| Priority | Token                  | Treatment                                   |
|----------|------------------------|---------------------------------------------|
| `LOW`    | `--priority-low`       | Muted outline badge, no fill                |
| `MEDIUM` | `--priority-medium`    | Subtle tinted badge (`bg-muted`)            |
| `HIGH`   | `--priority-high`      | Amber fill (`oklch(0.78 0.15 75)`)          |
| `URGENT` | `--priority-urgent`    | Red fill + left card border 3px + icon      |

`URGENT` must use more than color — add an icon (`AlertTriangle` from lucide) and a left-border stripe on the card. Existing code escalates priority to Teams webhook with theme color `FF0000` (`lib/notifications/index.ts:36`); keep the UI consistent with that signal.

### 2.5 Color-usage rules

- **Never write raw hex in components.** Use `bg-primary`, `text-muted-foreground`, `bg-[--status-new]`, etc. (shadcn guideline, severity: high).
- Do not use color alone to convey status/priority. Pair with text, icon, or position.
- Minimum contrast 4.5:1 for text, 3:1 for large text and UI borders.

---

## 3. Typography

### 3.1 Current vs. recommended

- **Current:** Geist Sans + Geist Mono (`app/layout.tsx:7-14`).
- **Skill recommendation:** Plus Jakarta Sans (SaaS/B2B mood, friendly-professional).

**Keep Geist.** It's already loaded, it renders well for dense UI, and the generator's rec isn't clearly better for an internal tool. Revisit only if a design pass reveals a concrete gap.

### 3.2 Type scale

| Token        | Size / Line-height  | Use                         |
|--------------|---------------------|-----------------------------|
| `text-xs`    | 12 / 16             | Meta, timestamps, table sub |
| `text-sm`    | 14 / 20             | Body default in dense views |
| `text-base`  | 16 / 24             | Forms, detail body (a11y)   |
| `text-lg`    | 18 / 28             | Card titles                 |
| `text-xl`    | 20 / 28             | Section titles              |
| `text-2xl`   | 24 / 32             | Page titles (`h1`)          |

**Rules:**
- Body paragraph line-height 1.5–1.75; form inputs min 16px to avoid iOS zoom.
- Line length capped at 65–75ch in long-form areas (ticket description, comments). Use `max-w-prose`.
- Font weights: 400 body, 500 emphasis, 600 titles/buttons. Skip 700 unless there's a reason.
- `font-display: swap` is already the Next.js font default — don't regress it.

---

## 4. Spacing, radii, shadows

Align with existing shadcn radius scale already in `globals.css` (`--radius: 0.625rem`, `--radius-sm` through `--radius-4xl`).

**Spacing scale** — Tailwind defaults; common values in this app:

| Token   | px  | Use                                  |
|---------|-----|--------------------------------------|
| `gap-1` | 4   | Icon/label inline                    |
| `gap-2` | 8   | Badge groups                         |
| `gap-3` | 12  | Button icon + text                   |
| `gap-4` | 16  | Card internal                        |
| `gap-6` | 24  | Section between cards                |
| `py-8`  | 32  | Page container vertical              |
| `py-12` | 48  | Major section separation             |

**Shadow scale** — use Tailwind tokens, do not hand-roll:

| Token          | Use                                |
|----------------|------------------------------------|
| `shadow-sm`    | Resting cards, inputs              |
| `shadow-md`    | Hovered cards, dropdowns           |
| `shadow-lg`    | Dialogs, popovers                  |
| `shadow-xl`    | (rare) Command palette, overlays   |

**Radii** — `rounded-md` for inputs/buttons, `rounded-lg` for cards, `rounded-xl` for modals.

---

## 5. Component rules

### 5.1 Buttons

- Primary action (`New Ticket` only): `<Button variant="cta">` — uses the CTA accent token. Do not use this variant for anything else.
- All other primary actions: `<Button>` (default variant). Destructive: `variant="destructive"`. Secondary/outline as per shadcn.
- Disable buttons during async ops and show a spinner in-button (prevents double-submit; severity: high).
- Size `sm` in navbars and table rows, `default` on forms and detail pages.

### 5.2 Cards

- `Card` is interactive **only** when the whole card is a link (kanban card → ticket detail). Apply `cursor-pointer` and a hover treatment (`hover:shadow-md transition-shadow duration-200`) **only** in that case.
- **Do not add `cursor-pointer` to non-interactive cards** (the stats strip on the dashboard). The previous generator output was wrong here.
- Hover should change `box-shadow` and/or `border-color` — never `transform: scale()`, which causes layout jitter in adjacent kanban cards.

### 5.3 Inputs / forms

- Always wrap with shadcn `<Form>` + React Hook Form + Zod (already the pattern in `types/index.ts`). Never use uncontrolled `<Input onChange>` for form state (shadcn guideline, severity: high).
- Pair every input with a `<Label htmlFor>` or `<FormLabel>`. No placeholder-as-label.
- Error message renders below input, `text-sm text-destructive`, with `aria-describedby` linkage.
- Async submit: disable the submit button and show inline spinner.

### 5.4 Dialogs

- Use shadcn `<Dialog>` + `<DialogHeader>` + `<DialogTitle>` + `<DialogDescription>` — never an `Alert` styled as a modal (severity: high).
- Dialogs for: delete confirmations, assignment picker, status change with required comment. Escape + overlay-click closes; focus-trap is handled by shadcn.
- Heavy dialog content (e.g., a future file-upload flow) should be `React.lazy` imported.

### 5.5 Tables

- Use shadcn `<Table>` + `<TableHeader>` + `<TableBody>` for static tables (admin user list).
- For filter / sort / pagination, use the **DataTable** pattern (shadcn + TanStack Table) — do not hand-roll sort state.
- Mobile: `overflow-x-auto` wrapper or collapse to card layout below `md`.

### 5.6 Kanban

- Drag disabled when `canDrag={false}` (requester view) — already implemented at `components/board/kanban-board.tsx:67`.
- Optimistic update on drop; revert + `toast.error` on failure (already implemented at `kanban-board.tsx:54-78`).
- Card must show: status color dot/border, priority badge, ticket number `#N`, title, submitter avatar, comment/attachment counts if > 0.
- Columns: min-width `280px`, `overflow-y-auto` per column, not per board.

### 5.7 Badges

- Use `Badge` variant to encode status and priority via the semantic tokens above. No raw Tailwind color utilities.

### 5.8 Navbar

- Stays sticky (`sticky top-0 z-50`, already set at `navbar.tsx:47`).
- Active link gets `variant="secondary"` — keep existing behavior (`navbar.tsx:56-57`).
- Role-based nav hiding is correct; don't render hidden items disabled (severity: medium).

---

## 6. Interaction & motion

- Transitions: **150–300ms** on color/opacity/shadow/transform. Anything longer feels laggy in a productivity app.
- Hover/focus: always present on interactive elements. Focus ring = shadcn default (`--ring`).
- Respect `prefers-reduced-motion` — wrap non-essential transitions in `@media (prefers-reduced-motion: no-preference)`. This is already easy with `tw-animate-css`.
- Toast notifications via `sonner` (already installed). Use for: mutation success, SSE-driven "ticket updated elsewhere" hints, errors on optimistic rollback.

---

## 7. Loading, empty, and error states

These are the most commonly skipped dashboard states. Treat them as features, not afterthoughts.

| Scenario                             | Treatment                                                          |
|--------------------------------------|--------------------------------------------------------------------|
| Initial board load (SSR)             | Renders with data; no skeleton needed.                             |
| Filter change / navigation in board  | Skeleton columns — 3 placeholder cards per column, `animate-pulse`.|
| Empty board column                   | "No tickets in <status>" + muted icon — never blank whitespace.    |
| Empty dashboard (no tickets at all)  | Illustration + "Create your first ticket" CTA.                     |
| Ticket detail fetch                  | Skeleton for title, body, sidebar. Show `app/loading.tsx` fallback.|
| SSE disconnected                     | Silent reconnect (already done); no user-facing error unless >30s. |
| Mutation failure                     | `toast.error` + revert optimistic state (kanban already does this).|
| 404 ticket                           | `app/not-found.tsx` — render with link back to board.              |
| 500 error                            | `app/error.tsx` — render with "try again" action.                  |

Any async operation that can exceed 300ms must show a loading indicator (severity: high).

---

## 8. Charts (for future dashboard widgets)

Not currently wired, but likely: volume over time, status breakdown, department load.

| Data question                              | Chart              | Library        |
|--------------------------------------------|--------------------|----------------|
| Tickets created per day/week over N weeks  | Line or area chart | Recharts       |
| Status distribution right now              | Donut + legend     | Recharts       |
| Tickets per department (horizontal bar)    | Bar chart          | Recharts       |
| Resolution time distribution               | Box plot           | Plotly         |
| Priority × status matrix                   | Heatmap            | Recharts/D3    |

Rules: pair color with label/pattern; expose a data table alternative; use the shadcn `--chart-1..5` tokens already defined.

---

## 9. Responsive breakpoints

Validate at: **375 / 768 / 1024 / 1440**.

- Board: horizontal scroll on small screens (`overflow-x-auto`, already done). Column min-width 280px.
- Navbar: nav labels hide below `md`, icons remain.
- Ticket detail: stacks below `md`, two-column at `md+`.
- Forms: single column always; never side-by-side fields on mobile.
- Tables: horizontal scroll or card-fallback below `md`.

---

## 10. Accessibility floor

Non-negotiable (severity: critical):

- All interactive elements reachable by keyboard; visible focus ring.
- Tab order matches visual order. No `tabindex > 0`.
- Icon-only buttons require `aria-label` (e.g., user menu trigger in navbar).
- Form inputs bound to labels via `htmlFor` / `<FormLabel>`.
- Status/priority never rely on color alone — add text or icon.
- Images have `alt`; decorative get `alt=""`.
- Color contrast ≥ 4.5:1 for body text, ≥ 3:1 for large text.

---

## 11. Anti-patterns (do NOT use)

- ❌ Raw hex in components — use shadcn theme tokens.
- ❌ `cursor-pointer` on non-interactive elements (stats cards, section headers).
- ❌ `transform: scale()` on hover for cards that sit next to other cards.
- ❌ Emoji as UI icons — use `lucide-react` (already installed).
- ❌ Placeholder-as-label.
- ❌ Toasts for every navigation — reserve for mutations, errors, and async results.
- ❌ Hero / Features / CTA patterns — this is an internal tool, not a landing page.
- ❌ `alert()` / `confirm()` — use `<Dialog>`.
- ❌ Skeleton longer than the real load — if data is already cached, render it.

---

## 12. Pre-delivery checklist

Before merging any UI change, verify:

- [ ] No hardcoded hex; all colors via theme tokens.
- [ ] All icons from `lucide-react`; no emoji icons.
- [ ] `cursor-pointer` only where the element is actually clickable.
- [ ] Hover and focus states present and smooth (150–300ms).
- [ ] Light **and** dark mode tested — text and borders visible in both.
- [ ] Body text contrast ≥ 4.5:1.
- [ ] Status/priority conveyed by more than color.
- [ ] Form inputs have labels; errors have `aria-describedby`.
- [ ] Async buttons disable + show spinner; no double-submit possible.
- [ ] Empty state rendered (no raw blank area).
- [ ] Skeleton/spinner on any >300ms operation.
- [ ] Responsive at 375, 768, 1024, 1440.
- [ ] No horizontal scroll on mobile (kanban exempt — that's intentional).
- [ ] `prefers-reduced-motion` respected on non-essential animation.
- [ ] Keyboard-only walkthrough of the changed surface.

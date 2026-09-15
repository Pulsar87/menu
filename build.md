Professional Digital Menu App — AI Build Prompt
Here's a comprehensive, structured prompt you can hand to an AI coding agent. It's organized so each section is independently scoped, which helps with multi-turn generation.

The Prompt
You are a senior full-stack engineer. Build a production-ready,
digital restaurant menu & ordering platform inspired by
Sirved, Yelp, and Toast POS. Follow the specs below exactly.

═══════════════════════════════════════════════
1. TECH STACK (do not deviate unless I say otherwise)
═══════════════════════════════════════════════
- Frontend (Customer-facing):
  Next.js 15 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
  Mobile-responsive PWA; no native app wrapper.
- Frontend (Staff/KDS dashboard):
  Same Next.js app, separate /staff route group with auth guard.
- Backend:
  Node.js 22 + TypeScript.
- Database:
  PostgreSQL 16. Use migrations, seed scripts.
- Cache / Queue:
  Redis 7 (Upstash) for session store + BullMQ for background jobs
  (order lifecycle, push notifications, analytics aggregation).
- Payments:
  Stripe Checkout + Stripe Terminal (in-store tap/QR).
- QR:
  qrcode + qr-code-styling (server-generated, cached in Redis 24h TTL).
- Auth:
  NextAuth v5 (Auth.js) — email+password, Google OAuth,
  and short-lived "table guest" tokens (no account required).
- Hosting:
  Docker Compose (app, postgres, redis).
  Target deploy: Railway / Fly.io / any container host.
- Testing:
  Vitest (unit), Playwright (E2E happy-path: browse → order → pay).

═══════════════════════════════════════════════
2. DATA MODEL ( include full schema)
═══════════════════════════════════════════════


Core entities:
- Restaurant(id, name, slug, timezone, currency, logo, cover_image,
   address, geo, phone, website, hours JSON, settings JSON)
- User(id, email, name, role: OWNER|MANAGER|STAFF|KITCHEN,
   restaurant_id, avatar)
- Category(id, restaurant_id, name, sort_order, image)
- MenuItem(id, category_id, restaurant_id, name, description,
   price_cents, image_url, is_available, is_featured,
   allergens[], prep_time_min, sort_order, variants JSON[])
   variants: [{ name, modifier_group_id, options[] }]
- ModifierGroup(id, name, max_select, required)
- ModifierOption(id, group_id, name, extra_price_cents)
- Table(id, restaurant_id, number, seats, zone, qr_token)
- Order(id, restaurant_id, table_id, status:
   PLACED→PREPARING→READY→DELIVERED→PAID→CANCELLED,
   items[], notes, subtotal_cents, tax_cents, tip_cents,
   total_cents, stripe_payment_intent_id, placed_at,
   updated_at, kitchen_confirmed_at)
- OrderItem(id, order_id, menu_item_id, quantity,
   modifiers[], special_instructions, line_total_cents)
- Review(id, restaurant_id, customer_name, rating 1-5,
   text, images[], created_at)          ← Yelp-style
- LoyaltyCard(id, customer_phone, points, tier, restaurant_id)
- Notification(id, user_id, order_id, type, read, created_at)

Indexing: GIN on MenuItem(name, description) for full-text search.
Unique: (restaurant_id, table_number), (restaurant_id, slug).

═══════════════════════════════════════════════
3. CUSTOMER-FACING PWA (/)
═══════════════════════════════════════════════
Flow:
  a) Scan restaurant QR → lands on /m/{restaurant_slug}/t/{table_token}
     (no login required). Detect table from token.
  b) Menu screen:
     - Horizontal category chips (sticky top), scroll-snap.
     - Item cards: image, name, description, price, allergen icons,
       "Featured" badge.
     - Tap item → modal sheet with variant/modifier picker,
       quantity stepper, special-instructions textarea.
     - Search bar (debounced, client-side filter by name + tags).
     - Filter toggles: dietary (vegan, gluten-free, nut-free),
       "Available only", price range slider.
  c) Cart:
     - Floating bottom bar (item count + subtotal).
     - Expandable sheet: edit qty, remove, add tip %
       (0/10/15/20/custom).
     - "Send to Kitchen" → creates Order (status=PLACED),
       fires event to KDS.
     - "Pay now" → Stripe Checkout session (card, Apple Pay,
       Google Pay, or "Pay at table" link for staff).
  d) Post-order:
     - Live order tracker (animated progress bar synced):
       PLACED → PREPARING → READY → DELIVERED.
     - Push notification (Web Push / FCM) at each transition.
  e) Review screen (post-PAYED):
     - Star rating, text, optional photo upload (S3-compatible,
       max 5 photos, 10 MB each).
     - Submit → stored, visible on restaurant public page.

═══════════════════════════════════════════════
4. STAFF / OWNER DASHBOARD (/staff)
═══════════════════════════════════════════════
Auth: NextAuth guard. Role-based route access.

a) Menu Manager (CRUD):
   - Drag-and-drop category & item ordering (dnd-kit).
   - Image upload → S3/Cloudflare R2, auto-resize (thumb 400px,
     full 1200px), EXIF strip.
   - Variant/modifier builder (nested forms).
   - Toggle availability per-item and per-category.
   - Bulk actions: mark all sold-out, copy from another restaurant.

b) Live Order Board (KDS):
   - Kanban columns: PLACED | PREPARING | READY | DELIVERED.
   - Auto-scroll, new-order sound (Web Audio API beep).
   - Tap order → detail panel (items, modifiers, instructions).
   - "Start cooking" → status → PREPARING (kitchen_confirmed_at).
   - "Ready" → status → READY, triggers guest push notification.
   - "Deliver" → DELIVERED.
   - Timeout alert: order in PLACED > 3 min → row flashes red.
   - Real-time via WebSocket channel /kds/{restaurant_id}.

c) Table & QR Manager:
   - Visual floor plan (grid, drag tables).
   - Generate / re-generate QR per table → PNG download (2x res).
   - Print-friendly view (browser print, A4 layout).

d) Reviews Mod:
   - List, respond, flag, delete.
   - Aggregate rating widget (avg, count, distribution).

e) Analytics (date-range picker, last 7/30/90 days):
   - Revenue, order count, avg ticket, top items, slowest dishes.
   - Peak hours heatmap (hour × weekday).
   - Review trend line.
   - Export CSV.

f) Settings:
   - Restaurant profile, hours (per-weekday JSON), tax rate,
     currency, tip defaults, notification toggles,
     Stripe account connect (onboarding link).

═══════════════════════════════════════════════
5. REAL-TIME ARCHITECTURE
═══════════════════════════════════════════════
- Channels:
  /kds/{restaurant_id}     → order status changes
  /table/{table_token}     → guest-facing order tracker
  /admin/{restaurant_id}   → staff dashboard live updates
- Event: { type: "order.status_changed", orderId, status, ts }
- Heartbeat: ping/pong 30 s, reconnect with exponential backoff
  (max 30 s). Client-side: re-fetch snapshot on reconnect.

═══════════════════════════════════════════════
6. API DESIGN (REST)
═══════════════════════════════════════════════
Base: /api/v1
Auth: Bearer JWT (staff) / short-lived table token (guest).

Public (no auth):
  GET  /restaurants/:slug
  GET  /restaurants/:slug/menu
  GET  /restaurants/:slug/reviews?sort=newest&page=1

Guest (table token):
  POST /orders                  (create, body: table_token, items[])
  GET  /orders/:id
  POST /orders/:id/payment-intent  (Stripe)

Staff (JWT, role-scoped):
  CRUD /restaurants/:id/menu/categories
  CRUD /restaurants/:id/menu/items
  PATCH /orders/:id/status
  GET  /dashboard/analytics?range=30d
  CRUD /restaurants/:id/tables
  POST /restaurants/:id/reviews/:id/respond
  ... (full OpenAPI 3.1 spec in /docs)

Error format: { error: { code, message, details[] } }
Pagination: cursor-based (?cursor=&limit=).
Rate-limit: 100 req/min per IP (guest), 600/min (staff).
═══════════════════════════════════════════════
7. SECURITY & ACCESS CONTROL
═══════════════════════════════════════════════
- All queries scoped by restaurant_id.
  Enforce middleware: reject if restaurant_id ≠ auth.
- RBAC matrix (OWNER / MANAGER / STAFF / KITCHEN):
  OWNER: everything incl. settings, billing, user mgmt.
  MANAGER: menu CRUD, orders, reviews, tables. No billing.
  STAFF: orders, table QR. No menu edit.
  KITCHEN: KDS read + status advance only.
- Helmet, CORS (allowlist), CSRF on cookie routes,
  input validation (Zod schemas on every input),
  SQL injection safe,
  file upload: MIME whitelist (jpeg, png, webp), size cap 10 MB,
  serve from CDN with signed URLs (15 min expiry).
- Audit log table: (id, user_id, action, entity, entity_id,
  ip, created_at). Log all mutations.

═══════════════════════════════════════════════
8. UI/UX REQUIREMENTS
═══════════════════════════════════════════════
- Design system: shadcn/ui + Tailwind, dark-mode aware.
- Mobile-first. Breakpoints: 640 / 768 / 1024 / 1280.
- Customer menu: 60 fps scroll, lazy-load images
  (next/image, sizes, priority on above-fold).
- Accessibility: WCAG 2.1 AA. All interactive elements
  keyboard-navigable, aria-labels, focus rings,
  sufficient contrast (4.5:1).
- Loading: skeleton screens (no spinners).
- Empty states: illustrative SVG + CTA text.
- Toast notifications (sonner) for async feedback.
- i18n: next-intl, default AR, extensible to
  en. All strings in JSON locale files.
- Dark/light toggle persisted in localStorage,
  respects prefers-color-scheme.

═══════════════════════════════════════════════
9. NON-FUNCTIONAL REQUIREMENTS
═══════════════════════════════════════════════
- Lighthouse ≥ 90 on mobile (perf, a11y, best-practices, SEO).
- TTFB < 200 ms (edge-cached menu pages via ISR revalidate 60 s).
- WebSocket reconnect < 2 s after network blip.
- DB migrations: zero-downtime (expand → migrate → contract).
- CI/CD: GitHub Actions → lint (ESLint) → typecheck (tsc)
  → test (vitest) → build (next build) → deploy.
- Monitoring: Sentry (errors), OpenTelemetry (traces to
  Grafana Tempo), /health + /ready probes.
- Backups: pg_dump nightly → S3, 30-day retention.

═══════════════════════════════════════════════
10. DELIVERABLES (output in this order)
═══════════════════════════════════════════════
For each, output complete, runnable code:

 1. docker-compose.yml  (app, postgres, redis)
 3. Backend:
    - src/server.ts (bootstrap, plugins)
    - src/routes/*.ts (all endpoints, Zod validation)
    - src/services/*.ts (order lifecycle, payment, analytics)
    - src/middleware/auth.ts, rbac.ts
    - src/handler.ts
    - src/jobs/*.ts (BullMQ workers)
 4. Frontend:
    - app/m/[slug]/t/[token]/  (customer PWA)
    - app/staff/  (dashboard)
    - components/  (reusable, well-named)
    - lib/api.ts (typed fetch client)
    - i18n/en.json
 5. tests/
    - unit: order service, RBAC
    - e2e: Playwright (guest order flow, staff KDS)
 6. README.md
    - Setup (env vars, DB init, Stripe test keys)
    - Architecture diagram (Mermaid)
    - API reference link
    - Deployment guide
 7. OpenAPI 3.1 spec (openapi.yaml)

═══════════════════════════════════════════════
11. CONVENTIONS
═══════════════════════════════════════════════
- TypeScript strict mode. No any.
- Error handling: typed errors, no bare catch.
- Naming: kebab-case files, PascalCase components,
  camelCase functions, SCREAMING_SNAKE for env vars.
- Every public function gets a one-line JSDoc.
- Comments: explain WHY, not WHAT.
- Git: conventional commits (feat:, fix:, docs:, etc.)
═══════════════════════════════════════════════
12. FIRST MILESTONE (build this first)
═══════════════════════════════════════════════
Scaffold the project, create the schema,
stand up Docker Compose, implement:
  - Menu CRUD (staff)
  - Customer browse + cart + send-to-kitchen
  - KDS board
  - Table QR generation
Get the Playwright E2E test passing for:
  "Guest scans table → views menu → adds 2 items
   → sends order → KDS shows order → staff marks
   PREPARING → guest sees updated status."

After I confirm that works, proceed to:
  payments → reviews → analytics → loyalty → i18n.
How to use it
Drop the whole block into a fresh conversation with a capable coding agent (Claude, GPT-4, or your internal tool). The "First Milestone" section at the bottom is intentional — it scopes the initial output to a working skeleton rather than 15 000 lines you can't review. Once that builds and the E2E test passes, you prompt for the next slice:

"Milestone 1 verified. Proceed to: Stripe payment integration + guest review submission + review public display."

A few practical tips:

One feature per turn. The agent will produce higher-quality code when you ask for "implement the KDS WebSocket channel" rather than "build everything."
Pin the stack. The prompt locks tech choices so the agent doesn't hallucinate a random framework swap mid-build.

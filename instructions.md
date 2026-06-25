# 📋 Equipment Tracker — Living Project Tracker

> **Institution**: FilmDept University
> **Stack**: React + Vite + Tailwind (Frontend) | Node.js + Express (Backend) | PostgreSQL (Database)
> **Last Updated**: 2026-06-25

---

## 🗺️ Phased Roadmap

### ✅ Phase 1: Foundation & Project Initialization — **COMPLETE** ✓
- [x] Monorepo scaffold — `backend/` and `frontend/` structure created
- [x] Root `.gitignore` configured
- [x] Root `instructions.md` created
- [x] **Backend** — `package.json` initialized, all dependencies installed (118 packages, 0 vulns)
- [x] **Backend** — `src/index.js` Express entry point with health check route — **VERIFIED RUNNING**
- [x] **Backend** — `src/config/db.js` PostgreSQL Pool singleton (via `pg`) with `withTransaction` helper
- [x] **Backend** — `src/middleware/errorHandler.js` global error handler
- [x] **Backend** — `src/middleware/notFound.js` 404 handler
- [x] **Backend** — `.env.example` template created, `.gitignore` configured
- [x] **Frontend** — Vite + React scaffold initialized (0 vulns)
- [x] **Frontend** — Tailwind CSS v3 installed and configured with brand design system
- [x] **Frontend** — Placeholder `App.jsx` with premium dark-mode UI and phase progress tracker

---

### ✅ Phase 2: Database Design & Schema Modeling — **COMPLETE** ✓
- [x] `backend/src/db/schema.sql` — all 8 tables with constraints, indexes, and triggers
- [x] `backend/src/db/seed.sql` — equipment categories with custom buffer times (Cameras: 24h, Cables: 0h, etc.)
- [x] Document Overlap Engine SQL query (detailed in implementation plan)
- [ ] Verify schema runs clean on fresh PostgreSQL DB (requires setup of local database connection)

---

### 🔲 Phase 3: The Overlap Engine & API Endpoints
- [ ] Overlap Engine SQL (algebraic + buffer-aware)
- [ ] `POST /api/reservations` — booking creation with overlap check
- [ ] `GET /api/items/:id/availability` — availability window query
- [ ] `GET /api/reservations` — list with filters
- [ ] `PATCH /api/reservations/:id/status` — approve/cancel/return
- [ ] Route-level input validation (express-validator)

---

### 🔲 Phase 4: Frontend Architecture & Dashboard
- [ ] Design system tokens in Tailwind config
- [ ] Layout shell (sidebar, topbar)
- [ ] Dashboard overview page
- [ ] Items list & detail pages
- [ ] React Router setup

---

### 🔲 Phase 5: Authentication & Tiered Permissions
- [ ] `POST /api/auth/register` and `POST /api/auth/login`
- [ ] JWT issuance and verification middleware
- [ ] Role guard middleware (`student`, `professor`, `admin`)
- [ ] Protected routes on frontend (React context)

---

### 🔲 Phase 6: Booking UI & Calendar Integration
- [ ] Reservation creation form
- [ ] Calendar view (FullCalendar or custom)
- [ ] Conflict feedback UI (shows blocked time ranges)
- [ ] Kit checkout flow

---

### 🔲 Phase 7: Automated Notifications & Webhooks
- [ ] Cron job for overdue/due-soon detection
- [ ] Mock webhook dispatcher (local Express receiver)
- [ ] Webhook subscription management API
- [ ] HMAC signature verification

---

## 🔑 Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Overlap detection | Pure SQL algebraic check | Rule B — no JS date math |
| PKs | UUID (`gen_random_uuid()`) | No sequential ID leakage |
| Timestamps | `TIMESTAMPTZ` | Timezone-safe |
| Deletion | Soft delete (`is_active`) | Audit trail preservation |
| Secrets | `.env` only, never committed | Rule D |
| Kit atomicity | Kit checkout blocks all member items | Consistent availability |
| Professor role | Books freely, cannot approve students | Admin-only approval |

---

## 🐘 Database Tables

| Table | Purpose |
|---|---|
| `users` | All system users with role |
| `equipment_categories` | Item types + buffer_hours config |
| `equipment_items` | Individual physical assets (serial numbers) |
| `kits` | Pre-made bundles |
| `kit_items` | Junction: which items belong to a kit |
| `reservations` | All bookings — core Overlap Engine target |
| `condition_logs` | Damage/state tracking per checkout |
| `webhook_subscriptions` | Phase 7 webhook targets |

---

## ⚙️ Environment Variables (see `backend/.env.example`)

```
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/equipment_tracker
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
```

---

## 📦 Scripts

```bash
# Backend
cd backend && npm run dev     # nodemon watch mode

# Frontend
cd frontend && npm run dev    # Vite dev server (port 5173)
```

---

## 🔖 Git Commit Log (manual — run by developer)

- `feat: Phase 1 — project scaffold, Express entry point, Vite+React+Tailwind frontend`
- *(Phase 2 commit pending approval)*

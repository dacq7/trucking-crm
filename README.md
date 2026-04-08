# Trucking Insurance CRM

> A full-stack CRM built for **trucking insurance agencies** — manage clients, fleets, drivers, cases, and policies from a single place.

![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?style=flat&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?style=flat&logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green?style=flat)

---

## Live Demo

> **[https://trucking-crm.up.railway.app](https://trucking-crm.up.railway.app)** *(deploy in progress)*

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@premiertruckins.com` | `Admin1234!` |
| Vendor | `maria.gonzalez@premiertruckins.com` | `Vendor1234!` |

---

## Screenshots

> *(Screenshots will be added after Railway deployment)*

| Dashboard (Admin) | Cases Pipeline | Client Detail |
|---|---|---|
| ![dashboard](docs/screenshots/dashboard-admin.png) | ![cases](docs/screenshots/cases-pipeline.png) | ![client](docs/screenshots/client-detail.png) |

---

## Built For

Trucking insurance agencies in the U.S. manage a complex, paper-heavy workflow:

1. A **vendor (agent)** onboards a trucking company as a client
2. They capture the fleet (tractors, trailers) and drivers (CDL-A license, MVR status)
3. They open a **case** and request coverages: Primary Auto Liability, Cargo, Physical Damage, GL, etc.
4. The case moves through a multi-step pipeline: Lead → Prospect → Quote Sent → Negotiation → Bound → Policy Issued
5. Once bound, a **policy** is issued with the carrier, premium, payment plan, and FMCSA filing status

This CRM replaces spreadsheets and email threads with a structured, role-based system that keeps every agent's book of business organized and auditable.

---

## Features

### Authentication & Access Control
- JWT-based auth with 8-hour expiration
- Role-based guards: **ADMIN** has full access, **VENDOR** sees only their own data
- Force-change-password flow for new vendor accounts created by admin
- `POST /api/auth/register` — admin-only endpoint to create vendor accounts

### Clients (Trucking Companies)
- Full ACORD-style intake: legal name, DBA, DOT/MC/EIN numbers
- Physical & mailing address, entity type, years in business
- Fleet profile: operation type (OTR / Regional / Local / Intermodal), radius, states of operation
- Cargo profile: commodities, hazmat class, annual gross revenue
- Loss history: total losses past 3 years, prior carriers, non-renewal history
- Vehicles (tractors, trailers, straight trucks) with VIN, stated value, GVW, lienholder
- Drivers with CDL class, experience years, MVR status, DUI flag
- Soft delete — clients are deactivated, not deleted

### Cases (Insurance Files)
- Full pipeline with 9 stages: Lead → Prospect → Application Complete → Quote Sent → Negotiation → Bound → Policy Issued → Renewal / Lost
- Every status change is recorded in `CaseStatusHistory` with timestamp and optional note
- `PATCH /api/cases/:id/status` — dedicated endpoint for stage transitions
- Coverage requests per case: type, limits, deductibles, FMCSA filing requirement
- Lost reason tracking

### Policies
- Issued automatically when a case is bound
- Carrier, MGA, effective/expiration dates, total annual premium, down payment, payment plan
- Bound coverages: PRIMARY_AUTO_LIABILITY, MOTOR_TRUCK_CARGO, PHYSICAL_DAMAGE_COMPREHENSIVE, PHYSICAL_DAMAGE_COLLISION, GENERAL_LIABILITY, NON_TRUCKING_LIABILITY, TRAILER_INTERCHANGE, OCCUPATIONAL_ACCIDENT
- FMCSA filing status (Filed / Pending / Not Required)
- Expiring-soon alerts (30-day window)

### Dashboard
- KPIs: active clients, active policies, total annual premium, policies expiring within 30 days
- **Pipeline distribution chart** — cases by stage with a color-coded bar chart (Recharts)
- **Admin view**: vendor performance table + premium-by-vendor chart + expiring policies table
- **Vendor view**: personal KPIs + recent cases + expiring policy cards
- Unified `GET /api/dashboard/stats` — auto-routes to admin or vendor data based on role

### Users (Admin only)
- Create vendor accounts with temporary password
- Activate / deactivate vendors
- Password reset by admin

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 8 + TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Charts | Recharts 3 |
| Forms | React Hook Form 7 |
| HTTP client | Axios |
| Routing | React Router v7 |
| Notifications | React Hot Toast |
| Backend | Express 5 (native async/await) |
| ORM | Prisma 6 |
| Database | PostgreSQL 14+ |
| Auth | jsonwebtoken + bcryptjs |
| Runtime | Node.js 20+ |

---

## Project Structure

```
trucking-crm/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Data models — do not rename fields
│   │   └── seed.js             # 4 users, 10 clients, 20 cases, 5 policies
│   └── src/
│       ├── index.js
│       ├── middleware/
│       │   ├── auth.js         # JWT verification
│       │   └── requireRole.js  # Role guard factory
│       ├── controllers/        # auth, clients, cases, policies, users, dashboard
│       └── routes/             # Express routers
└── frontend/
    └── src/
        ├── App.tsx
        ├── main.tsx
        ├── context/AuthContext.tsx
        ├── pages/
        │   ├── auth/           # Login, ChangePassword
        │   ├── dashboard/      # Dashboard (KPIs + charts)
        │   ├── clients/        # ClientsList, ClientForm, ClientDetail
        │   ├── cases/          # CasesList, CaseForm, CaseDetail
        │   ├── policies/       # PoliciesList
        │   └── users/          # UsersList, UserForm (admin only)
        ├── services/           # Axios service layer per module
        └── components/layout/  # Sidebar, MainLayout, ProtectedRoute, AdminRoute
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- npm 9+

### 1. Clone & install

```bash
git clone https://github.com/your-username/trucking-crm.git
cd trucking-crm

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Environment variables

**`backend/.env`**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/trucking_crm"
JWT_SECRET="your-long-random-secret-here"
PORT=3001
```

**`frontend/.env`**
```env
VITE_API_URL=http://localhost:3001/api
```

### 3. Database setup

```bash
cd backend

# Run migrations
npm run db:migrate

# Seed with realistic sample data
npm run db:seed
```

The seed creates:
- 1 Admin + 3 Vendor accounts (Maria, Carlos, Jennifer)
- 10 trucking clients across Texas & Florida with real-world data (DOT, MC, EIN)
- 22 vehicles — Peterbilt, Kenworth, Freightliner, Mack, Volvo with VINs and stated values
- 18 CDL-A drivers with MVR status, experience years, and license details
- 20 cases distributed across the full pipeline with complete status history
- 5 active policies with bound coverages (~$149k total annual premium)

### 4. Run

```bash
# Terminal 1 — Backend (port 3001)
cd backend && npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend && npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and log in with:
- `admin@premiertruckins.com` / `Admin1234!`

---

## API Overview

### Auth
| Method | Endpoint | Guard | Description |
|--------|----------|-------|-------------|
| POST | `/api/auth/login` | — | Returns JWT + user |
| POST | `/api/auth/register` | ADMIN | Create vendor account |
| PUT | `/api/auth/change-password` | Any | Change own password |

### Clients
| Method | Endpoint | Guard | Description |
|--------|----------|-------|-------------|
| GET | `/api/clients` | Any | List — VENDOR sees only own clients |
| GET | `/api/clients/:id` | Any | Detail with vehicles, drivers, cases |
| POST | `/api/clients` | Any | Create |
| PUT | `/api/clients/:id` | Any | Update |
| DELETE | `/api/clients/:id` | ADMIN | Soft delete |
| POST | `/api/clients/:id/vehicles` | Any | Add vehicle |
| POST | `/api/clients/:id/drivers` | Any | Add driver |

### Cases
| Method | Endpoint | Guard | Description |
|--------|----------|-------|-------------|
| GET | `/api/cases` | Any | List — VENDOR sees only own cases |
| GET | `/api/cases/:id` | Any | Detail with coverages, policy, history |
| POST | `/api/cases` | Any | Open new case |
| PUT | `/api/cases/:id` | Any | Update fields |
| PATCH | `/api/cases/:id/status` | Any | Advance pipeline stage |
| DELETE | `/api/cases/:id` | ADMIN | Delete |
| POST | `/api/cases/:id/coverages` | Any | Add coverage request |
| POST | `/api/cases/:id/policy` | Any | Issue policy |

### Dashboard
| Method | Endpoint | Guard | Description |
|--------|----------|-------|-------------|
| GET | `/api/dashboard/stats` | Any | KPIs — auto-filtered by role |
| GET | `/api/dashboard/admin` | ADMIN | Admin-only stats |
| GET | `/api/dashboard/vendor` | Any | Vendor-scoped stats |

### Users
| Method | Endpoint | Guard | Description |
|--------|----------|-------|-------------|
| GET | `/api/users` | ADMIN | All users |
| POST | `/api/users` | ADMIN | Create vendor |
| PUT | `/api/users/:id` | ADMIN | Update user |
| POST | `/api/users/:id/reset-password` | ADMIN | Reset password |

---

## Deployment (Railway)

### Backend service
```
Root directory: backend
Build: npm install && npx prisma generate && npx prisma migrate deploy
Start: node src/index.js
Env: DATABASE_URL, JWT_SECRET, PORT
```

### Frontend service
```
Root directory: frontend
Build: npm install && npm run build
Start: npx serve dist -p $PORT
Env: VITE_API_URL (public backend URL + /api)
```

---

## License

MIT — feel free to fork and adapt for your agency's workflow.

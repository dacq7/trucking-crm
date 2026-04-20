# Trucking CRM — Insurance Management Platform

> Full-stack CRM built for trucking insurance agencies in the USA. Manages the complete lifecycle from prospect to bound policy — DOT/MC clients, CDL driver records, fleet vehicles, 8-stage pipeline, and real-time expiration tracking.

[![Node.js](https://img.shields.io/badge/Node.js-22-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Tests](https://img.shields.io/badge/Tests-47%20passing-brightgreen?style=flat-square)](https://github.com/dacq7/trucking-crm)
[![Railway](https://img.shields.io/badge/Railway-deployed-0B0D0E?style=flat-square&logo=railway&logoColor=white)](https://railway.app)
[![Vercel](https://img.shields.io/badge/Vercel-deployed-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com)

**[Live Demo](https://trucking-crm-one.vercel.app)** · **[View Code](https://github.com/dacq7/trucking-crm)**

---

![Dashboard Admin](.github/screenshots/dashboard-admin.png)

---

## What is this?

Trucking insurance agencies in the USA deal with a level of operational complexity that generic CRMs like HubSpot or Salesforce don't address well. Every client has a DOT number, an MC authority, a fleet of vehicles with stated values, and CDL drivers with MVR statuses that directly affect coverage eligibility and premium pricing.

This platform is purpose-built for that workflow. A vendor (insurance agent) creates a client account with their full DOT/MC profile, attaches fleet vehicles and CDL drivers, opens a case, and works it through an 8-stage pipeline — from `LEAD` to `POLICY_ISSUED` — requesting specific coverage types along the way (Primary Auto Liability, Motor Truck Cargo, Physical Damage, FMCSA filings). When a policy is bound, every coverage line item is recorded against it with its own limit, deductible, and annual premium.

Admins get an agency-wide view: pipeline distribution across all vendors, premium volume per agent, and a 30-day expiration watchlist. Vendors see only their own book of business.

The result is a system that mirrors how trucking insurance actually works — not a demo, but a functional tool.

---

## Key Features

| 🚛 Pipeline Management | 👥 Client Management | 📋 Policy Management |
|---|---|---|
| 8-stage insurance pipeline | DOT & MC number tracking | Bound coverage line items |
| Full status history log | Fleet vehicle registry (VIN, GVW, stated value) | Effective & expiration date tracking |
| Visual horizontal stepper | CDL driver records with MVR status | 30-day expiration alerts with pulse indicator |
| LOST/RENEWAL state handling | Ownership type (Owned / Leased / Financed) | Payment plan & finance company |
| Transactional status transitions | HAZMAT & border crossing flags | FMCSA filing status |
| Per-case coverage requests | Owner-operator percentage | Premium volume by vendor (chart) |

---

## Screenshots

<table>
  <tr>
    <td align="center">
      <img src=".github/screenshots/login.png" alt="Login" /><br/>
      <sub>Dark-themed login with role-based access</sub>
    </td>
    <td align="center">
      <img src=".github/screenshots/dashboard-vendor.png" alt="Vendor Dashboard" /><br/>
      <sub>Vendor dashboard with book of business overview</sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src=".github/screenshots/pipeline-chart.png" alt="Pipeline Chart" /><br/>
      <sub>Visual pipeline distribution across all stages</sub>
    </td>
    <td align="center">
      <img src=".github/screenshots/clients-list.png" alt="Clients List" /><br/>
      <sub>Client list with DOT number search and pagination</sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src=".github/screenshots/client-detail.png" alt="Client Detail" /><br/>
      <sub>Client detail with fleet vehicles and CDL drivers</sub>
    </td>
    <td align="center">
      <img src=".github/screenshots/case-pipeline.png" alt="Case Pipeline" /><br/>
      <sub>Interactive pipeline stepper with stage history</sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src=".github/screenshots/case-detail-policy.png" alt="Policy Detail" /><br/>
      <sub>Policy details with bound coverages</sub>
    </td>
    <td align="center">
      <img src=".github/screenshots/policies-list.png" alt="Policies List" /><br/>
      <sub>Policy list with expiration countdown</sub>
    </td>
  </tr>
</table>

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend runtime** | Node.js 22 + Express 5 |
| **ORM** | Prisma 6 |
| **Database** | PostgreSQL 16 |
| **Authentication** | JWT (`jsonwebtoken`) + `bcryptjs`, role-based guards |
| **Frontend** | React 19 + TypeScript 5 + Vite 8 |
| **Styling** | Tailwind CSS v4 (Oxide engine) |
| **Charts** | Recharts |
| **Forms** | React Hook Form |
| **Testing** | Jest + Supertest — 47 passing tests |
| **Backend hosting** | Railway (Express API + PostgreSQL) |
| **Frontend hosting** | Vercel |

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@premiertruckins.com` | `Admin1234!` |
| Vendor | `maria.gonzalez@premiertruckins.com` | `Vendor1234!` |

The seed populates the database with 10 trucking clients (TX & FL), 24 vehicles, 18 CDL-A drivers, 20 cases across all pipeline stages, and 5 active policies totaling ~$149k in annual premium.

---

## Local Setup

```bash
# 1. Clone
git clone https://github.com/dacq7/trucking-crm.git
cd trucking-crm

# 2. Backend
cd backend
npm install
cp .env.example .env          # fill in DATABASE_URL and JWT_SECRET

# 3. Database
npm run db:migrate             # run Prisma migrations
npm run db:seed                # seed with realistic demo data

# 4. Start backend
npm run dev                    # runs on http://localhost:3001

# 5. Frontend (new terminal)
cd ../frontend
npm install
cp .env.example .env           # set VITE_API_URL=http://localhost:3001/api
npm run dev                    # runs on http://localhost:5173
```

**Environment variables:**

```bash
# backend/.env
DATABASE_URL="postgresql://user:password@localhost:5432/trucking_crm"
JWT_SECRET="your-secret-key"
PORT=3001

# frontend/.env
VITE_API_URL=http://localhost:3001/api
```

---

## Running Tests

```bash
cd backend
npm test
```

Expected output:
PASS  tests/auth.test.js
POST /api/auth/login
✓ credenciales válidas → 200 con token JWT y DTO de usuario sin passwordHash
✓ password incorrecta → 401 sin token
✓ email inexistente → 401
✓ usuario con isActive=false → 403 (cuenta inactiva)
✓ body vacío (sin email ni password) → 400
✓ falta solo el password → 400
Middleware auth — protección de rutas con Bearer token
✓ token válido en ruta ADMIN → 200
✓ sin header Authorization → 401
✓ token malformado (no es JWT válido) → 401
✓ header con esquema incorrecto (Basic en vez de Bearer) → 401
✓ token VENDOR en ruta exclusiva ADMIN → 403
PUT /api/auth/change-password
✓ cambio de password con credenciales correctas → 200 con mustChangePassword=false
✓ password actual incorrecta → 401
✓ sin token → 401 antes de llegar al controller
✓ body sin campos requeridos → 400
PASS  tests/models.test.js
Modelo Client — inyección de vendorId y validación de dotNumber único
✓ VENDOR crea cliente → prisma.client.create recibe vendorId del token JWT, no del body
✓ dotNumber duplicado → 409 y prisma.client.create no es llamado
✓ VENDOR no puede acceder al cliente de otro vendor → 403
Modelo Vehicle — clientId inyectado desde URL, no del body
✓ crear vehículo → prisma.vehicle.create recibe clientId del URL param
✓ cliente no encontrado → 404 sin crear vehículo
✓ VENDOR intenta agregar vehículo a cliente de otro vendor → 403
Modelo Driver — clientId inyectado desde URL
✓ crear conductor → prisma.driver.create recibe clientId y campos requeridos
Modelo User — role es campo requerido con valores restringidos
✓ crear usuario sin role → 400, prisma.user.create no es llamado
✓ role VENDOR válido → prisma.user.create con role=VENDOR y mustChangePassword=true
✓ role ADMIN también es válido → 201
✓ role con valor arbitrario (SUPERUSER, GUEST, etc.) → 400
Modelo Policy — caseId inyectado y $transaction atómico
✓ crear póliza → prisma.$transaction llamado y policy.create recibe caseId
✓ caso ya tiene póliza → 409, $transaction no es llamado
✓ caso no encontrado → 404
✓ VENDOR no puede crear póliza en caso de otro vendor → 403
PASS  tests/users.test.js
GET /api/users — listar usuarios
✓ ADMIN obtiene lista de usuarios → 200 con array
✓ ADMIN con filtro ?role=VENDOR → findMany es llamado con where.role=VENDOR
✓ VENDOR intenta listar usuarios → 403 (requiere ADMIN)
✓ sin autenticación → 401
GET /api/users/:id — obtener usuario por ID
✓ usuario existente → 200 con datos completos
✓ ID inexistente → 404
POST /api/users — crear usuario
✓ datos válidos → 201 con temporaryPassword y sin passwordHash
✓ email ya registrado → 409
✓ body sin role → 400
✓ role inválido (no ADMIN ni VENDOR) → 400
✓ VENDOR intentando crear usuario → 403
PUT /api/users/:id — actualizar usuario
✓ actualizar nombre → 200 con datos actualizados
✓ actualizar a email ya en uso por OTRO usuario → 409
✓ ID inexistente → 404
✓ actualizar role a valor inválido → 400
POST /api/users/:id/reset-password — resetear contraseña
✓ usuario existente → 200 con nueva temporaryPassword y mustChangePassword=true
✓ usuario inexistente → 404
Tests: 47 passed, 47 total
Time: 1.622s

---

## Architecture Highlights

**Role-based access control.** Two roles — `ADMIN` and `VENDOR` — enforced at the middleware layer via a reusable `requireRole` guard. Admins see the full agency; vendors see only their own clients, cases, and policies. The frontend applies the same logic conditionally rendering columns, actions, and dashboard sections.

**Vendor data isolation.** Every `Client` and `Case` record carries a `vendorId` foreign key. All list endpoints filter by `req.user.id` when `role === 'VENDOR'`, making cross-vendor data leakage structurally impossible rather than just guarded by convention. This security rule is validated in the test suite — `vendorId` is always injected from the JWT, never from the request body.

**Transactional status pipeline.** Case status transitions (`PATCH /api/cases/:id/status`) run inside a Prisma `$transaction` that atomically updates the case and appends a `CaseStatusHistory` entry. The frontend stepper replays this history to accurately reconstruct which stages were visited, when, and in what order — including `LOST` cases that exited the pipeline early. The test suite verifies `$transaction` is called exactly once on every policy creation.

**Idempotent seed data.** The seed script uses `upsert` for users and a DOT-number existence check for client data, making it safe to run repeatedly without duplicating records. This allows Railway's database to be reset and re-seeded in CI/CD without manual intervention.

**mustChangePassword enforcement.** All new users are created with `mustChangePassword: true`, forcing a password reset on first login. This rule is validated in the test suite across both ADMIN and VENDOR role creation flows.

---

## Project Structure
trucking-crm/
├── backend/
│   ├── src/
│   │   ├── controllers/       # One controller per domain
│   │   │   ├── auth.controller.js
│   │   │   ├── cases.controller.js
│   │   │   ├── clients.controller.js
│   │   │   ├── coverages.controller.js
│   │   │   ├── dashboard.controller.js
│   │   │   ├── drivers.controller.js
│   │   │   ├── policies.controller.js
│   │   │   ├── users.controller.js
│   │   │   └── vehicles.controller.js
│   │   ├── middleware/
│   │   │   ├── auth.js        # JWT verification
│   │   │   └── requireRole.js # ADMIN / VENDOR guard
│   │   ├── routes/            # Express routers per domain
│   │   ├── prisma.js          # Prisma client singleton
│   │   └── index.js           # Express app entry point
│   ├── prisma/
│   │   ├── schema.prisma      # Data model
│   │   └── seed.js            # Idempotent demo data seeder
│   ├── tests/
│   │   ├── setup.js           # Shared Prisma mocks and JWT fixtures
│   │   ├── auth.test.js       # 15 tests — login, middleware, change-password
│   │   ├── users.test.js      # 18 tests — CRUD with role enforcement
│   │   └── models.test.js     # 15 tests — business rules and data isolation
│   └── jest.config.js
│
└── frontend/
└── src/
├── services/          # Per-domain API functions (TypeScript)
└── ...

---

*Built by Diego Correa — [Veridis Dev](https://veridisdev.com)*

# Trucking CRM — Insurance Management Platform

> Full-stack CRM built for trucking insurance agencies in the USA. Manages the complete lifecycle from prospect to bound policy — DOT/MC clients, CDL driver records, fleet vehicles, 8-stage pipeline, and real-time expiration tracking.

[![Node.js](https://img.shields.io/badge/Node.js-22-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
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

## Architecture Highlights

**Role-based access control.** Two roles — `ADMIN` and `VENDOR` — enforced at the middleware layer via a reusable `requireRole` guard. Admins see the full agency; vendors see only their own clients, cases, and policies. The frontend applies the same logic conditionally rendering columns, actions, and dashboard sections.

**Vendor data isolation.** Every `Client` and `Case` record carries a `vendorId` foreign key. All list endpoints filter by `req.user.id` when `role === 'VENDOR'`, making cross-vendor data leakage structurally impossible rather than just guarded by convention.

**Transactional status pipeline.** Case status transitions (`PATCH /api/cases/:id/status`) run inside a Prisma `$transaction` that atomically updates the case and appends a `CaseStatusHistory` entry. The frontend stepper replays this history to accurately reconstruct which stages were visited, when, and in what order — including `LOST` cases that exited the pipeline early.

**Idempotent seed data.** The seed script uses `upsert` for users and a DOT-number existence check for client data, making it safe to run repeatedly without duplicating records. This allows Railway's database to be reset and re-seeded in CI/CD without manual intervention.

---

*Built by Diego Correa — [Veridis Dev](https://veridisdev.com)*

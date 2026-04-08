# CLAUDE.md — Trucking CRM

Archivo de contexto para Claude Code. Léelo completo antes de tocar cualquier archivo.

---

## ¿Qué es este proyecto?

Un **Insurance CRM para transportistas** (trucking insurance). No es un CRM de logística/envíos — es una herramienta para **vendors (agentes de seguros)** que gestionan clientes transportistas, sus flotas, conductores, casos de seguro y pólizas.

Flujo real del negocio:
```
Vendor crea Cliente → agrega Vehículos + Conductores → abre un Caso →
solicita Coberturas → negocia → emite Póliza
```

---

## Stack completo

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + Vite 8 + Tailwind v4 |
| Backend | Express 5 + Prisma 6 + PostgreSQL |
| Auth | JWT (jsonwebtoken) + bcryptjs — **YA instalados** |
| Validación | express-validator |
| Frontend extras | axios, react-router-dom v7, react-hook-form, react-hot-toast, recharts, lucide-react, date-fns |

---

## Estructura del proyecto

```
trucking-crm/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       ← modelos completos, NO modificar sin avisar
│   │   └── seed.js             ← poblar con data realista
│   └── src/
│       ├── index.js            ← entry point Express
│       ├── middleware/
│       │   └── auth.js         ← middleware JWT existente
│       ├── controllers/
│       │   └── auth.controller.js
│       └── routes/
│           ├── auth.routes.js      ← login + change-password (YA existe)
│           ├── clients.routes.js
│           ├── cases.routes.js
│           ├── policies.routes.js
│           ├── dashboard.routes.js
│           └── users.routes.js
└── frontend/
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── context/
        │   └── AuthContext.jsx     ← contexto de auth existente
        ├── pages/
        │   ├── auth/
        │   ├── cases/
        │   ├── clients/
        │   ├── dashboard/
        │   ├── policies/
        │   └── users/
        ├── components/
        ├── services/
        └── utils/
```

---

## Modelos en Prisma (schema.prisma — NO tocar los nombres)

### User
```
id, name, email, passwordHash, role (ADMIN|VENDOR), isActive,
mustChangePassword, createdAt, updatedAt
→ tiene: clients[], cases[]
```

### Client (el transportista asegurado)
```
legalBusinessName, dba, dotNumber (único), mcNumber, ein
contactName, phonePrimary, email
physicalAddress/City/State/Zip
operationType (OTR|LOCAL|REGIONAL|INTERMODAL)
operationRadius (LOCAL|REGIONAL|NATIONAL)
commodities[], hasHazmat, currentlyInsured
vendorId → User
→ tiene: vehicles[], drivers[], cases[]
```

### Driver (conductor del transportista)
```
fullName, dateOfBirth, licenseNumber, licenseState
licenseClass (CLASS_A|CLASS_B|CLASS_C)
cdlExperienceYears, mvrStatus (CLEAN|MINOR_VIOLATIONS|MAJOR_VIOLATIONS)
hasDUI, isOwnerOperator
clientId → Client
```

### Vehicle
```
unitNumber, type (TRACTOR|STRAIGHT_TRUCK|TRAILER|VAN|PICKUP|BOX_TRUCK)
year, make, model, vin, statedValue, gvw
ownership (OWNED|LEASED|FINANCED)
clientId → Client
```

### Case (expediente de seguro)
```
caseNumber (cuid auto), status (LEAD→BOUND→POLICY_ISSUED→RENEWAL|LOST)
clientId → Client, vendorId → User
→ tiene: coverageRequests[], policy?, statusHistory[]
```

### CaseStatus pipeline:
```
LEAD → PROSPECT → APPLICATION_COMPLETE → QUOTE_SENT →
NEGOTIATION → BOUND → POLICY_ISSUED → RENEWAL | LOST
```

### Policy
```
policyNumber, carrier, mga, effectiveDate, expirationDate
totalAnnualPremium, downPayment, paymentPlan (FULL_PAY|MONTHLY|QUARTERLY)
filingStatus (FILED|PENDING|NOT_REQUIRED)
status (ACTIVE|EXPIRED|CANCELLED|PENDING)
caseId (único) → Case
→ tiene: boundCoverages[]
```

### CoverageType enum (para CoverageRequest y BoundCoverage):
```
PRIMARY_AUTO_LIABILITY, MOTOR_TRUCK_CARGO, PHYSICAL_DAMAGE_COMPREHENSIVE,
PHYSICAL_DAMAGE_COLLISION, GENERAL_LIABILITY, NON_TRUCKING_LIABILITY,
TRAILER_INTERCHANGE, OCCUPATIONAL_ACCIDENT
```

---

## Auth — estado actual y lo que falta

### Lo que YA existe:
- `POST /api/auth/login` — funciona
- `PUT /api/auth/change-password` — protegido con middleware auth
- `backend/src/middleware/auth.js` — middleware JWT operativo
- `frontend/src/context/AuthContext.jsx` — contexto de auth en el frontend

### Lo que FALTA (Día 1):
- `POST /api/auth/register` — solo ADMIN puede crear usuarios (vendors)
- Guard de roles en rutas que lo requieran
- Migración del frontend a TypeScript (`.jsx → .tsx`, `.js → .ts`)
- `tsconfig.json` apropiado para Vite + React

### Patrón de roles:
- **ADMIN**: gestión de usuarios, acceso total, puede crear vendors
- **VENDOR**: ve solo sus propios clientes/casos (filtrar por `vendorId`)

---

## Plan de 3 días

### Día 1 — Auth completo + TypeScript
1. `POST /api/auth/register` (solo ADMIN puede invocarla — guard de rol)
2. Guard de roles reutilizable: `requireRole('ADMIN')` como middleware
3. Aplicar guards en `users.routes.js` (solo ADMIN)
4. Migrar frontend a TypeScript: renombrar archivos clave + tsconfig

### Día 2 — Módulos core funcionales
1. Completar CRUD de Clients con filtro por vendorId
2. CRUD de Cases con pipeline de status
3. Seed data realista: 2 vendors, 10+ clients con vehículos/conductores, 20+ cases en distintos estados, algunas policies

### Día 3 — Dashboard + Deploy + README
1. Dashboard KPIs reales: casos por status, pólizas activas, clientes por vendor, premium total
2. Deploy Railway: backend + frontend + Postgres
3. README en inglés: stack, screenshots, live demo, features

---

## Reglas de desarrollo

1. **Leer antes de escribir** — siempre revisar el archivo existente antes de modificarlo
2. **No tocar schema.prisma sin avisar** — los modelos ya están definidos y tienen migraciones
3. **Filtrar por vendorId en VENDOR** — un vendor nunca debe ver datos de otro vendor
4. **Express 5** — maneja promesas nativamente, no necesitas try/catch en cada route si usas async/await directamente
5. **Variables de entorno**: `DATABASE_URL`, `JWT_SECRET`, `PORT` en backend; `VITE_API_URL` en frontend
6. **OS: Ubuntu Linux** — todos los comandos deben ser para Linux, nunca macOS ni Windows

---

## Comandos útiles

```bash
# Backend
cd backend && npm run dev           # desarrollo
cd backend && npm run db:migrate    # nueva migración
cd backend && npm run db:generate   # regenerar cliente Prisma
cd backend && npm run db:seed       # poblar BD
cd backend && npm run db:studio     # Prisma Studio UI

# Frontend
cd frontend && npm run dev          # desarrollo
cd frontend && npm run build        # build producción
```

---

## Variables de entorno necesarias

```bash
# backend/.env
DATABASE_URL="postgresql://user:password@localhost:5432/trucking_crm"
JWT_SECRET="secreto-muy-largo-y-seguro"
PORT=3001

# frontend/.env
VITE_API_URL=http://localhost:3001/api
```

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

## Estado actual — completado

### Auth (✅ Día 1 completo)
- `POST /api/auth/login` ✓
- `POST /api/auth/register` — ADMIN-only ✓
- `PUT /api/auth/change-password` ✓
- `middleware/auth.js` — JWT ✓
- `middleware/requireRole.js` — guard de roles ✓
- Frontend migrado a TypeScript — 25 archivos, tsconfig composite ✓

### Backend (✅ Día 2 completo)
- CRUD Clients con filtro vendorId, soft delete ✓
- CRUD Cases con PATCH /status + CaseStatusHistory automático ✓
- Seed idempotente: 1 admin, 3 vendors, 10 clients TX/FL, 24 vehículos, 18 drivers CDL-A, 20 cases en todo el pipeline, 5 policies (~$149k en primas) ✓

### Frontend — páginas existentes
- `Dashboard.tsx` — KPI cards + PipelineChart (recharts) + ExpiringPolicies ✓
- `ClientsList.tsx` — tabla con búsqueda debounced, paginación, filtro por rol ✓
- `ClientDetail.tsx` — tabs: Info general, Vehicles, Drivers, Cases; modales inline ✓
- `ClientForm.tsx` — formulario de creación/edición
- `CaseDetail.tsx` — tabs: Info + historial de status, Coberturas, Póliza completa con BoundCoverages ✓
- `CaseForm.tsx` — formulario de creación/edición
- `CasesList.tsx` — estado desconocido, revisar antes de tocar
- `PoliciesList.tsx` — tabla con días a vencimiento, filtro por status ✓
- `UsersList.tsx` / `UserForm.tsx` — gestión de vendors (solo ADMIN) ✓
- `Sidebar.tsx` — navegación con roles, logout ✓

### Dashboard (✅ Día 3 completo)
- Endpoint unificado `/api/dashboard/stats` con split ADMIN/VENDOR ✓
- README en inglés con badges, stack, features, setup, API tables ✓

### Patrón de roles:
- **ADMIN**: acceso total, ve todos los clientes/casos, breakdown por vendor
- **VENDOR**: ve solo sus propios datos (filtrado por vendorId)

---

## Roadmap de calidad — en progreso

### Fase A — Pulir lo existente (EN CURSO)
Objetivo: consistencia visual y de idioma para demo profesional en USA.

1. **Idioma** — todo el texto visible al usuario en inglés. Labels, placeholders, botones, toasts, empty states. Los valores de enums del backend (LEAD, BOUND, TRACTOR, etc.) no se traducen.
2. **CasesList completa** — búsqueda por caseNumber/cliente, filtro por status dropdown (8 stages), paginación, columnas: Case #, Client, Status badge semántico, Vendor (solo ADMIN), Created date, acción View. Misma calidad que ClientsList.
3. **Pipeline stepper en CaseDetail** — reemplazar historial plano por stepper horizontal con los 8 stages en orden. Stage actual highlighted, completados en verde, pendientes en gris. Si LOST, rojo en el stage donde se perdió.

### Fase B — Funcionalidad faltante (PENDIENTE)
1. **ClientForm completo** — el schema tiene ~40 campos, organizar en secciones: Business Info, Contact, Operations, Insurance History. Usar react-hook-form.
2. **CaseForm** — crear casos con selección de cliente (search/select), notas iniciales.
3. **PolicyDetail** — vista dedicada de póliza en lugar de redirigir al caso.
4. **Registro de vendor** desde panel admin — flujo completo con mustChangePassword.

### Fase C — Deploy y presentación (PENDIENTE)
1. Deploy en Railway — backend + frontend + Postgres con datos del seed.
2. Screenshots reales en el README.
3. Video demo 2 minutos para Upwork.

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

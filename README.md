# Trucking CRM

Monorepo: **React (Vite) + Tailwind** en `frontend/`, **Express + Prisma + PostgreSQL** en `backend/`. Autenticación prevista con **JWT + bcrypt** (pendiente de implementar en rutas).

## Requisitos

- Node.js 20+ (recomendado)
- PostgreSQL 14+

## Configuración

1. **Base de datos**  
   Crea la base `trucking_crm` y ajusta `backend/.env` (`DATABASE_URL`, `JWT_SECRET`, `PORT`).

2. **Backend**

   ```bash
   cd backend
   npm install
   npm run db:generate
   npm run db:migrate
   npm run dev
   ```

   Health check: `GET http://localhost:3001/api/health` → `{ "status": "ok" }`.

3. **Frontend**

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   Variable `VITE_API_URL` en `frontend/.env` apunta al API (por defecto `http://localhost:3001/api`).

## Prisma

El proyecto usa **Prisma 6** para mantener `url = env("DATABASE_URL")` en `schema.prisma`, alineado con despliegues típicos en Railway y `PrismaClient` estándar. Prisma 7 mueve la URL a otro mecanismo; al subir de versión, revisa la [guía oficial de migración](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions).

## Deploy en Railway

- **PostgreSQL**: servicio Postgres en Railway; copia la URL interna a `DATABASE_URL` del servicio Node.
- **Backend**: root directory `backend`, comando start `npm run start`, variables `DATABASE_URL`, `JWT_SECRET`, `PORT` (Railway suele inyectar `PORT`).
- **Frontend**: root directory `frontend`, build `npm run build`, start con servidor estático o plugin de Railway para Vite; define `VITE_API_URL` con la URL pública del API (incluye `/api` si así lo consumes en el cliente).

Tras el primer deploy del backend, ejecuta migraciones (por ejemplo `npx prisma migrate deploy` en un paso de release o job one-off con la misma `DATABASE_URL`).

## Estructura

```
trucking-crm/
├── frontend/     # Vite + React + Tailwind v4
├── backend/      # Express + Prisma
└── README.md
```

No subas `.env` a git (están en `.gitignore`).

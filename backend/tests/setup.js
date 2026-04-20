/**
 * tests/setup.js — Fixtures y configuración compartida para todos los test files
 *
 * Este archivo NO contiene tests. Exporta helpers que los test files importan
 * para no repetir código de inicialización en cada archivo.
 *
 * Por qué no usamos SQLite con Prisma:
 *   El schema.prisma usa tipos exclusivos de PostgreSQL (String[], enums nativos).
 *   SQLite no los soporta y requeriría un schema alternativo. En su lugar mockeamos
 *   el módulo `src/prisma` completo en cada test file con jest.mock(), lo que es
 *   el enfoque estándar para Express + Prisma.
 *
 * Patrón de uso en test files:
 *   1. jest.mock('../src/prisma', () => ({ ... }))  ← hoisted antes de cualquier require
 *   2. const { buildApp, signToken, adminUser } = require('./setup')
 *   3. const prisma = require('../src/prisma')       ← versión mockeada
 */

require('dotenv').config()

const express = require('express')
const bcrypt  = require('bcryptjs')
const jwt     = require('jsonwebtoken')

// Secreto JWT fijo para tests, independiente del .env real.
// Se setea en process.env antes de que cualquier ruta lo lea.
const TEST_JWT_SECRET = 'jest-test-secret-trucking-crm-fixed'
process.env.JWT_SECRET = TEST_JWT_SECRET

/**
 * buildApp — construye la app Express con todas las rutas reales pero SIN app.listen().
 * Supertest crea un servidor efímero en un puerto libre, por lo que cada test suite
 * corre en aislamiento sin conflicts de puerto.
 *
 * Las rutas importadas aquí son las mismas de producción. Al mockear prisma ANTES
 * de llamar buildApp() (gracias al hoisting de jest.mock), los controllers usan
 * automáticamente el cliente Prisma mockeado.
 */
function buildApp() {
  const app = express()
  app.use(express.json())

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))
  app.use('/api/auth',     require('../src/routes/auth.routes'))
  app.use('/api/users',    require('../src/routes/users.routes'))
  app.use('/api/clients',  require('../src/routes/clients.routes'))
  app.use('/api/cases',    require('../src/routes/cases.routes'))
  app.use('/api/policies', require('../src/routes/policies.routes'))

  return app
}

/**
 * signToken — genera un JWT con el mismo formato que el auth controller real.
 * Permite crear headers Authorization: Bearer <token> en tests de rutas protegidas.
 */
function signToken(user) {
  return jwt.sign(
    {
      id:                 user.id,
      name:               user.name,
      email:              user.email,
      role:               user.role,
      mustChangePassword: user.mustChangePassword,
    },
    TEST_JWT_SECRET,
    { expiresIn: '1h' }
  )
}

// Los hashes se generan con 1 ronda en vez de 10 para que los tests sean rápidos.
// bcrypt con 10 rondas tarda ~100ms por hash; con 1 ronda <5ms.
const ADMIN_RAW_PASSWORD  = 'AdminPass123!'
const VENDOR_RAW_PASSWORD = 'VendorPass123!'

/**
 * adminUser / vendorUser — fixtures de usuarios con IDs y datos fijos.
 * Los passwordHash son bcrypt reales (1 ronda) para que bcrypt.compare funcione
 * correctamente en los tests de login.
 */
const adminUser = {
  id:                 'admin-uuid-test-001',
  name:               'Test Admin',
  email:              'admin@trucking-test.com',
  role:               'ADMIN',
  isActive:           true,
  mustChangePassword: false,
  passwordHash:       bcrypt.hashSync(ADMIN_RAW_PASSWORD, 1),
  createdAt:          new Date('2024-01-01T00:00:00Z'),
  updatedAt:          new Date('2024-01-01T00:00:00Z'),
}

const vendorUser = {
  id:                 'vendor-uuid-test-001',
  name:               'Test Vendor',
  email:              'vendor@trucking-test.com',
  role:               'VENDOR',
  isActive:           true,
  mustChangePassword: false,
  passwordHash:       bcrypt.hashSync(VENDOR_RAW_PASSWORD, 1),
  createdAt:          new Date('2024-01-01T00:00:00Z'),
  updatedAt:          new Date('2024-01-01T00:00:00Z'),
}

module.exports = {
  buildApp,
  signToken,
  adminUser,
  vendorUser,
  ADMIN_RAW_PASSWORD,
  VENDOR_RAW_PASSWORD,
}

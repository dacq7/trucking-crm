/**
 * models.test.js — Tests de capa de modelos y relaciones entre entidades
 *
 * Valida que los controllers pasan los datos correctos a Prisma:
 *   - campos requeridos del schema
 *   - relaciones (clientId, vendorId, caseId) inyectadas correctamente
 *   - enums válidos (Role, VehicleType, LicenseClass)
 *   - comportamiento con $transaction (usado en createPolicy)
 *
 * Por qué no usamos SQLite en memoria:
 *   El schema.prisma usa tipos nativos de PostgreSQL: String[] (arrays),
 *   enums, y onDelete: Cascade. SQLite no soporta arrays ni enums,
 *   lo que requeriría un schema alternativo y divergiría del código real.
 *   El mock de Prisma es el enfoque correcto para este stack.
 *
 * Qué aprendemos de estos tests:
 *   - Los controllers inyectan el vendorId/clientId desde el contexto (JWT o URL)
 *     y NO confían en que el cliente lo envíe — eso es una regla de seguridad
 *   - mustChangePassword=true se activa automáticamente en nuevos usuarios
 *   - createPolicy usa $transaction para actualizar Case y CaseStatusHistory
 *     en la misma operación atómica
 */

jest.mock('../src/prisma', () => {
  // El mock de $transaction recibe el callback del controller y lo ejecuta
  // pasándole el mismo objeto mock como "tx" (transacción). Esto permite
  // que los tests de createPolicy funcionen sin cambiar el controller.
  const mock = {
    user: {
      findUnique: jest.fn(),
      findMany:   jest.fn(),
      create:     jest.fn(),
      update:     jest.fn(),
    },
    client: {
      findMany:   jest.fn(),
      findUnique: jest.fn(),
      create:     jest.fn(),
      update:     jest.fn(),
      count:      jest.fn(),
    },
    case: {
      findUnique: jest.fn(),
      findMany:   jest.fn(),
      create:     jest.fn(),
      update:     jest.fn(),
      count:      jest.fn(),
    },
    policy: {
      findUnique: jest.fn(),
      findMany:   jest.fn(),
      create:     jest.fn(),
      update:     jest.fn(),
      count:      jest.fn(),
    },
    vehicle: {
      findUnique: jest.fn(),
      create:     jest.fn(),
      update:     jest.fn(),
      delete:     jest.fn(),
    },
    driver: {
      findUnique: jest.fn(),
      create:     jest.fn(),
      update:     jest.fn(),
      delete:     jest.fn(),
    },
    caseStatusHistory: {
      create: jest.fn(),
    },
    boundCoverage: {
      deleteMany:   jest.fn(),
      createMany:   jest.fn(),
    },
  }

  // $transaction ejecuta el callback inmediatamente con el mismo mock como tx.
  // Así los tests pueden verificar que policy.create, case.update y
  // caseStatusHistory.create son llamados dentro de la transacción.
  mock.$transaction = jest.fn().mockImplementation((fn) => fn(mock))

  return mock
})

const request = require('supertest')
const prisma   = require('../src/prisma')
const { buildApp, signToken, adminUser, vendorUser } = require('./setup')

const app = buildApp()

beforeEach(() => {
  jest.clearAllMocks()
})

// ─── Modelo Client — campos y relaciones ──────────────────────────────────────

describe('Modelo Client — inyección de vendorId y validación de dotNumber único', () => {

  // Payload mínimo válido para crear un cliente (campos requeridos del schema)
  const clientPayload = {
    legalBusinessName: 'Texas Haulers LLC',
    dotNumber:         'DOT-TX-999001',
    contactName:       'John Doe',
    phonePrimary:      '555-0100',
    email:             'john@texashaulers.com',
    physicalAddress:   '100 Main St',
    physicalCity:      'Houston',
    physicalState:     'TX',
    physicalZip:       '77001',
  }

  test('VENDOR crea cliente → prisma.client.create recibe vendorId del token JWT, no del body', async () => {
    // Regla de seguridad crítica: el vendorId NO viene del request body.
    // El controller lo extrae de req.user.id (JWT verificado).
    // Un VENDOR nunca puede asignarse a sí mismo clientes de otro vendor.
    const createdClient = {
      id:       'client-uuid-test-001',
      vendorId: vendorUser.id,
      vendor:   { id: vendorUser.id, name: vendorUser.name, email: vendorUser.email },
      ...clientPayload,
      isActive:  true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    prisma.client.findUnique.mockResolvedValueOnce(null) // dotNumber no existe
    prisma.client.create.mockResolvedValueOnce(createdClient)

    const token = signToken(vendorUser)
    const res = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${token}`)
      .send(clientPayload)

    expect(res.status).toBe(201)

    // Verificar que create fue llamado exactamente una vez
    expect(prisma.client.create).toHaveBeenCalledTimes(1)

    const createCall = prisma.client.create.mock.calls[0][0]
    // El vendorId debe ser el del usuario autenticado, no uno enviado por el cliente
    expect(createCall.data.vendorId).toBe(vendorUser.id)
    expect(createCall.data.dotNumber).toBe(clientPayload.dotNumber)
    expect(createCall.data.legalBusinessName).toBe(clientPayload.legalBusinessName)
  })

  test('dotNumber duplicado → 409 y prisma.client.create no es llamado', async () => {
    // El controller hace una búsqueda previa por dotNumber.
    // Si ya existe, devuelve 409 sin intentar crear.
    prisma.client.findUnique.mockResolvedValueOnce({
      id: 'existing-client', dotNumber: clientPayload.dotNumber,
    })

    const token = signToken(vendorUser)
    const res = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${token}`)
      .send(clientPayload)

    expect(res.status).toBe(409)
    expect(prisma.client.create).not.toHaveBeenCalled()
  })

  test('VENDOR no puede acceder al cliente de otro vendor → 403', async () => {
    // ensureClientAccess verifica que client.vendorId === req.user.id para VENDOR.
    const clientDeOtroVendor = {
      id:       'client-otro',
      vendorId: 'otro-vendor-id-diferente', // pertenece a otro vendor
      isActive: true,
    }
    prisma.client.findUnique.mockResolvedValueOnce(clientDeOtroVendor)

    const token = signToken(vendorUser)
    const res = await request(app)
      .put(`/api/clients/${clientDeOtroVendor.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ contactName: 'Hacker' })

    expect(res.status).toBe(403)
    expect(prisma.client.update).not.toHaveBeenCalled()
  })
})

// ─── Modelo Vehicle — relación con Client ─────────────────────────────────────

describe('Modelo Vehicle — clientId inyectado desde URL, no del body', () => {

  const vehiclePayload = {
    type:      'TRACTOR',
    year:      2021,
    make:      'Kenworth',
    model:     'T680',
    vin:       '1XKYDP9X1MJ123456',
    ownership: 'OWNED',
  }

  test('crear vehículo → prisma.vehicle.create recibe clientId del URL param', async () => {
    // El clientId viene del parámetro de la URL (/api/clients/:id/vehicles),
    // no del body. Esto garantiza que el vehículo siempre pertenece al cliente correcto.
    const clientId = 'client-uuid-test-001'
    const existingClient = { id: clientId, vendorId: vendorUser.id, isActive: true }
    const createdVehicle = {
      id:       'vehicle-uuid-test-001',
      clientId,
      ...vehiclePayload,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    prisma.client.findUnique.mockResolvedValueOnce(existingClient)
    prisma.vehicle.create.mockResolvedValueOnce(createdVehicle)

    const token = signToken(vendorUser)
    const res = await request(app)
      .post(`/api/clients/${clientId}/vehicles`)
      .set('Authorization', `Bearer ${token}`)
      .send(vehiclePayload)

    expect(res.status).toBe(201)
    expect(prisma.vehicle.create).toHaveBeenCalledTimes(1)

    const createCall = prisma.vehicle.create.mock.calls[0][0]
    // clientId debe ser el del URL, no un valor que el cliente envíe
    expect(createCall.data.clientId).toBe(clientId)
    expect(createCall.data.type).toBe('TRACTOR')
    expect(createCall.data.year).toBe(2021)
  })

  test('cliente no encontrado → 404 sin crear vehículo', async () => {
    // ensureClientAccess devuelve error si el cliente no existe.
    prisma.client.findUnique.mockResolvedValueOnce(null)

    const token = signToken(vendorUser)
    const res = await request(app)
      .post('/api/clients/uuid-inexistente/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send(vehiclePayload)

    expect(res.status).toBe(404)
    expect(prisma.vehicle.create).not.toHaveBeenCalled()
  })

  test('VENDOR intenta agregar vehículo a cliente de otro vendor → 403', async () => {
    const clientDeOtro = { id: 'client-otro', vendorId: 'otro-vendor-uuid', isActive: true }
    prisma.client.findUnique.mockResolvedValueOnce(clientDeOtro)

    const token = signToken(vendorUser)
    const res = await request(app)
      .post(`/api/clients/${clientDeOtro.id}/vehicles`)
      .set('Authorization', `Bearer ${token}`)
      .send(vehiclePayload)

    expect(res.status).toBe(403)
    expect(prisma.vehicle.create).not.toHaveBeenCalled()
  })
})

// ─── Modelo Driver — relación con Client ──────────────────────────────────────

describe('Modelo Driver — clientId inyectado desde URL', () => {

  const driverPayload = {
    fullName:      'Carlos Mendez',
    dateOfBirth:   '1985-06-15',
    licenseNumber: 'TX-CDL-12345678',
    licenseState:  'TX',
    licenseClass:  'CLASS_A',
  }

  test('crear conductor → prisma.driver.create recibe clientId y campos requeridos', async () => {
    const clientId = 'client-uuid-test-001'
    const existingClient = { id: clientId, vendorId: vendorUser.id, isActive: true }
    const createdDriver = {
      id:          'driver-uuid-test-001',
      clientId,
      ...driverPayload,
      dateOfBirth: new Date(driverPayload.dateOfBirth),
      mvrStatus:   'CLEAN',
      hasDUI:      false,
      createdAt:   new Date(),
      updatedAt:   new Date(),
    }

    prisma.client.findUnique.mockResolvedValueOnce(existingClient)
    prisma.driver.create.mockResolvedValueOnce(createdDriver)

    const token = signToken(vendorUser)
    const res = await request(app)
      .post(`/api/clients/${clientId}/drivers`)
      .set('Authorization', `Bearer ${token}`)
      .send(driverPayload)

    expect(res.status).toBe(201)
    expect(prisma.driver.create).toHaveBeenCalledTimes(1)

    const createCall = prisma.driver.create.mock.calls[0][0]
    expect(createCall.data.clientId).toBe(clientId)
    expect(createCall.data.licenseClass).toBe('CLASS_A')
    expect(createCall.data.fullName).toBe(driverPayload.fullName)
  })
})

// ─── Modelo User — validación de role requerido ───────────────────────────────

describe('Modelo User — role es campo requerido con valores restringidos', () => {

  test('crear usuario sin role → 400, prisma.user.create no es llamado', async () => {
    // El controller valida que name, email y role estén presentes.
    // role es un enum en Prisma: ADMIN | VENDOR. Sin rol, no puede crearse.
    const token = signToken(adminUser)
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Sin Rol', email: 'sinrol@test.com' })

    expect(res.status).toBe(400)
    expect(prisma.user.create).not.toHaveBeenCalled()
  })

  test('role VENDOR válido → prisma.user.create con role=VENDOR y mustChangePassword=true', async () => {
    // mustChangePassword=true es el valor por defecto para nuevos usuarios.
    // Garantiza que cambien su contraseña temporal al primer login.
    const newUser = {
      id:                 'new-vendor-uuid',
      name:               'Valid Vendor',
      email:              'valid@test.com',
      role:               'VENDOR',
      isActive:           true,
      mustChangePassword: true,
      createdAt:          new Date(),
      updatedAt:          new Date(),
    }
    prisma.user.findUnique.mockResolvedValueOnce(null) // email libre
    prisma.user.create.mockResolvedValueOnce(newUser)

    const token = signToken(adminUser)
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Valid Vendor', email: 'valid@test.com', role: 'VENDOR' })

    expect(res.status).toBe(201)

    const createCall = prisma.user.create.mock.calls[0][0]
    expect(createCall.data.role).toBe('VENDOR')
    // Nuevo usuario siempre debe requerir cambio de contraseña
    expect(createCall.data.mustChangePassword).toBe(true)
  })

  test('role ADMIN también es válido → 201', async () => {
    const newAdmin = {
      id: 'new-admin-uuid', name: 'New Admin', email: 'newadmin@test.com',
      role: 'ADMIN', isActive: true, mustChangePassword: true,
      createdAt: new Date(), updatedAt: new Date(),
    }
    prisma.user.findUnique.mockResolvedValueOnce(null)
    prisma.user.create.mockResolvedValueOnce(newAdmin)

    const token = signToken(adminUser)
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Admin', email: 'newadmin@test.com', role: 'ADMIN' })

    expect(res.status).toBe(201)
    expect(prisma.user.create.mock.calls[0][0].data.role).toBe('ADMIN')
  })

  test('role con valor arbitrario (SUPERUSER, GUEST, etc.) → 400', async () => {
    const token = signToken(adminUser)
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'X', email: 'x@test.com', role: 'SUPERUSER' })

    expect(res.status).toBe(400)
    expect(prisma.user.create).not.toHaveBeenCalled()
  })
})

// ─── Modelo Policy — $transaction y relación con Case ─────────────────────────

describe('Modelo Policy — caseId inyectado y $transaction atómico', () => {

  const policyPayload = {
    policyNumber:       'POL-2024-TEST-001',
    carrier:            'Progressive Commercial',
    effectiveDate:      '2024-03-01',
    expirationDate:     '2025-03-01',
    totalAnnualPremium: 14400,
    paymentPlan:        'MONTHLY',
  }

  test('crear póliza → prisma.$transaction llamado y policy.create recibe caseId', async () => {
    // createPolicy usa prisma.$transaction para hacer 3 operaciones atómicas:
    //   1. policy.create (nueva póliza)
    //   2. case.update   (status → POLICY_ISSUED)
    //   3. caseStatusHistory.create (registro del cambio)
    // Si cualquier operación falla, todas hacen rollback.
    const caseId = 'case-uuid-test-001'
    const existingCase = {
      id:       caseId,
      status:   'BOUND',
      vendorId: vendorUser.id,
      clientId: 'client-uuid-test-001',
      policy:   null, // sin póliza previa
    }
    const createdPolicy = {
      id:             'policy-uuid-test-001',
      caseId,
      ...policyPayload,
      status:         'ACTIVE',
      boundCoverages: [],
      case:           { id: caseId, client: { id: 'client-uuid-test-001' } },
      createdAt:      new Date(),
      updatedAt:      new Date(),
    }

    prisma.case.findUnique.mockResolvedValueOnce(existingCase)
    prisma.policy.create.mockResolvedValueOnce(createdPolicy)
    prisma.case.update.mockResolvedValueOnce({ ...existingCase, status: 'POLICY_ISSUED' })
    prisma.caseStatusHistory.create.mockResolvedValueOnce({ id: 'hist-001' })

    const token = signToken(vendorUser)
    const res = await request(app)
      .post(`/api/cases/${caseId}/policy`)
      .set('Authorization', `Bearer ${token}`)
      .send(policyPayload)

    expect(res.status).toBe(201)

    // La operación debe haberse ejecutado dentro de una transacción
    expect(prisma.$transaction).toHaveBeenCalledTimes(1)

    // La póliza debe estar vinculada al caso correcto
    expect(prisma.policy.create).toHaveBeenCalledTimes(1)
    const policyCreateCall = prisma.policy.create.mock.calls[0][0]
    expect(policyCreateCall.data.caseId).toBe(caseId)
    expect(policyCreateCall.data.policyNumber).toBe(policyPayload.policyNumber)

    // El caso debe ser actualizado a POLICY_ISSUED automáticamente
    expect(prisma.case.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: caseId },
        data:  { status: 'POLICY_ISSUED' },
      })
    )

    // El historial de status debe registrar el cambio
    expect(prisma.caseStatusHistory.create).toHaveBeenCalledTimes(1)
  })

  test('caso ya tiene póliza → 409, $transaction no es llamado', async () => {
    // Un caso solo puede tener UNA póliza (relación 1-1 en el schema).
    // El controller verifica esto antes de entrar a la transacción.
    const caseConPoliza = {
      id:       'case-con-poliza',
      vendorId: vendorUser.id,
      policy:   { id: 'poliza-existente' }, // ya tiene póliza
    }
    prisma.case.findUnique.mockResolvedValueOnce(caseConPoliza)

    const token = signToken(vendorUser)
    const res = await request(app)
      .post(`/api/cases/${caseConPoliza.id}/policy`)
      .set('Authorization', `Bearer ${token}`)
      .send(policyPayload)

    expect(res.status).toBe(409)
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  test('caso no encontrado → 404', async () => {
    prisma.case.findUnique.mockResolvedValueOnce(null)

    const token = signToken(vendorUser)
    const res = await request(app)
      .post('/api/cases/uuid-inexistente/policy')
      .set('Authorization', `Bearer ${token}`)
      .send(policyPayload)

    expect(res.status).toBe(404)
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  test('VENDOR no puede crear póliza en caso de otro vendor → 403', async () => {
    // getCaseWithAccess verifica que case.vendorId === req.user.id para VENDOR.
    const casoDeOtro = {
      id:       'caso-de-otro',
      vendorId: 'otro-vendor-distinto',
      policy:   null,
    }
    prisma.case.findUnique.mockResolvedValueOnce(casoDeOtro)

    const token = signToken(vendorUser)
    const res = await request(app)
      .post(`/api/cases/${casoDeOtro.id}/policy`)
      .set('Authorization', `Bearer ${token}`)
      .send(policyPayload)

    expect(res.status).toBe(403)
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })
})

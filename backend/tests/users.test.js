/**
 * users.test.js — Tests de CRUD de usuarios (rutas /api/users)
 *
 * Todas las rutas de /api/users están protegidas con auth + requireRole('ADMIN').
 * Esto significa que:
 *   - Un VENDOR autenticado recibe 403 en cualquier endpoint de usuarios
 *   - Un request sin token recibe 401
 *   - Solo ADMIN puede crear, leer y modificar usuarios
 *
 * Los tests también verifican reglas de negocio del controller:
 *   - Emails únicos (409 en duplicados)
 *   - Roles válidos solo ADMIN o VENDOR (400 en otro valor)
 *   - La temporaryPassword se devuelve al crear (para que ADMIN la comparta)
 *   - passwordHash nunca aparece en respuestas
 */

jest.mock('../src/prisma', () => ({
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
    count:      jest.fn(),
  },
  case: {
    findMany:   jest.fn(),
    findUnique: jest.fn(),
    count:      jest.fn(),
  },
}))

const request = require('supertest')
const prisma   = require('../src/prisma')
const { buildApp, signToken, adminUser, vendorUser } = require('./setup')

const app = buildApp()

beforeEach(() => {
  jest.clearAllMocks()
})

// ─── GET /api/users ───────────────────────────────────────────────────────────

describe('GET /api/users — listar usuarios', () => {

  test('ADMIN obtiene lista de usuarios → 200 con array', async () => {
    // findMany devuelve los campos que el controller selecciona explícitamente
    // (sin passwordHash, que solo existe en la BD)
    const usersList = [
      {
        id:                 adminUser.id,
        name:               adminUser.name,
        email:              adminUser.email,
        role:               'ADMIN',
        isActive:           true,
        mustChangePassword: false,
        createdAt:          new Date(),
      },
    ]
    prisma.user.findMany.mockResolvedValueOnce(usersList)

    const token = signToken(adminUser)
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].email).toBe(adminUser.email)
    // Nunca debe exponer el hash de la contraseña
    expect(res.body[0].passwordHash).toBeUndefined()
  })

  test('ADMIN con filtro ?role=VENDOR → findMany es llamado con where.role=VENDOR', async () => {
    // El controller filtra por role si el query param es válido.
    // Verificamos que el argumento pasado a findMany es correcto.
    prisma.user.findMany.mockResolvedValueOnce([])

    const token = signToken(adminUser)
    await request(app)
      .get('/api/users?role=VENDOR')
      .set('Authorization', `Bearer ${token}`)

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ role: 'VENDOR' }),
      })
    )
  })

  test('VENDOR intenta listar usuarios → 403 (requiere ADMIN)', async () => {
    // requireRole('ADMIN') devuelve 403 antes de llegar al controller.
    // findMany no debe ser llamado.
    const token = signToken(vendorUser)
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(403)
    expect(prisma.user.findMany).not.toHaveBeenCalled()
  })

  test('sin autenticación → 401', async () => {
    const res = await request(app).get('/api/users')

    expect(res.status).toBe(401)
    expect(prisma.user.findMany).not.toHaveBeenCalled()
  })
})

// ─── GET /api/users/:id ───────────────────────────────────────────────────────

describe('GET /api/users/:id — obtener usuario por ID', () => {

  test('usuario existente → 200 con datos completos', async () => {
    const userRecord = {
      id:                 adminUser.id,
      name:               adminUser.name,
      email:              adminUser.email,
      role:               'ADMIN',
      isActive:           true,
      mustChangePassword: false,
      createdAt:          new Date(),
      updatedAt:          new Date(),
    }
    prisma.user.findUnique.mockResolvedValueOnce(userRecord)

    const token = signToken(adminUser)
    const res = await request(app)
      .get(`/api/users/${adminUser.id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.id).toBe(adminUser.id)
    expect(res.body.role).toBe('ADMIN')
  })

  test('ID inexistente → 404', async () => {
    // findUnique devuelve null: el usuario no existe en BD.
    prisma.user.findUnique.mockResolvedValueOnce(null)

    const token = signToken(adminUser)
    const res = await request(app)
      .get('/api/users/uuid-que-no-existe-en-bd')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(404)
    expect(res.body.message).toBeDefined()
  })
})

// ─── POST /api/users — crear usuario ─────────────────────────────────────────

describe('POST /api/users — crear usuario', () => {

  test('datos válidos → 201 con temporaryPassword y sin passwordHash', async () => {
    // El controller genera una temporaryPassword aleatoria, la hashea,
    // y la devuelve en texto plano para que el ADMIN la comparta.
    const createdUser = {
      id:                 'new-user-uuid-test',
      name:               'New Vendor',
      email:              'newvendor@test.com',
      role:               'VENDOR',
      isActive:           true,
      mustChangePassword: true,
      createdAt:          new Date(),
      updatedAt:          new Date(),
    }
    prisma.user.findUnique.mockResolvedValueOnce(null) // email no duplicado
    prisma.user.create.mockResolvedValueOnce(createdUser)

    const token = signToken(adminUser)
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Vendor', email: 'newvendor@test.com', role: 'VENDOR' })

    expect(res.status).toBe(201)
    expect(res.body.email).toBe('newvendor@test.com')
    expect(res.body.mustChangePassword).toBe(true)

    // La temporaryPassword debe devolverse para que el admin la comparta
    expect(res.body.temporaryPassword).toBeDefined()
    expect(typeof res.body.temporaryPassword).toBe('string')
    expect(res.body.temporaryPassword.length).toBeGreaterThan(8)

    // El hash nunca debe salir en la respuesta (userDto lo excluye)
    expect(res.body.passwordHash).toBeUndefined()
  })

  test('email ya registrado → 409', async () => {
    // findUnique devuelve un usuario existente: el email está tomado.
    prisma.user.findUnique.mockResolvedValueOnce(adminUser)

    const token = signToken(adminUser)
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Dup', email: adminUser.email, role: 'VENDOR' })

    expect(res.status).toBe(409)
    // Si el email existe, Prisma.create nunca debe ser llamado
    expect(prisma.user.create).not.toHaveBeenCalled()
  })

  test('body sin role → 400', async () => {
    // El controller valida que name, email Y role estén presentes.
    const token = signToken(adminUser)
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Sin Role', email: 'sinrole@test.com' })

    expect(res.status).toBe(400)
    expect(prisma.user.create).not.toHaveBeenCalled()
  })

  test('role inválido (no ADMIN ni VENDOR) → 400', async () => {
    // El schema solo acepta ADMIN y VENDOR. Cualquier otro valor es rechazado.
    const token = signToken(adminUser)
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Bad Role', email: 'badrole@test.com', role: 'SUPERADMIN' })

    expect(res.status).toBe(400)
    expect(prisma.user.create).not.toHaveBeenCalled()
  })

  test('VENDOR intentando crear usuario → 403', async () => {
    // Solo ADMIN puede crear usuarios. Un VENDOR con token válido
    // es bloqueado por requireRole('ADMIN').
    const token = signToken(vendorUser)
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New User', email: 'new@test.com', role: 'VENDOR' })

    expect(res.status).toBe(403)
    expect(prisma.user.create).not.toHaveBeenCalled()
  })
})

// ─── PUT /api/users/:id — actualizar usuario ──────────────────────────────────

describe('PUT /api/users/:id — actualizar usuario', () => {

  test('actualizar nombre → 200 con datos actualizados', async () => {
    // El controller busca el usuario primero (exists check), luego actualiza.
    prisma.user.findUnique.mockResolvedValueOnce(adminUser) // exists check
    prisma.user.update.mockResolvedValueOnce({
      id:                 adminUser.id,
      name:               'Updated Admin Name',
      email:              adminUser.email,
      role:               'ADMIN',
      isActive:           true,
      mustChangePassword: false,
      createdAt:          new Date(),
      updatedAt:          new Date(),
    })

    const token = signToken(adminUser)
    const res = await request(app)
      .put(`/api/users/${adminUser.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Admin Name' })

    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Updated Admin Name')
    // El email no cambió, debe seguir igual
    expect(res.body.email).toBe(adminUser.email)
  })

  test('actualizar a email ya en uso por OTRO usuario → 409', async () => {
    // El controller hace dos findUnique:
    //   1. Verifica que el usuario a actualizar existe
    //   2. Verifica que el nuevo email no pertenece a otro usuario
    prisma.user.findUnique.mockResolvedValueOnce(adminUser) // usuario existe
    prisma.user.findUnique.mockResolvedValueOnce({          // nuevo email ya tomado por otro
      ...vendorUser,
      id:    'otro-usuario-distinto',
      email: 'already-taken@test.com',
    })

    const token = signToken(adminUser)
    const res = await request(app)
      .put(`/api/users/${adminUser.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'already-taken@test.com' })

    expect(res.status).toBe(409)
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  test('ID inexistente → 404', async () => {
    // El exists check devuelve null: el usuario no existe.
    prisma.user.findUnique.mockResolvedValueOnce(null)

    const token = signToken(adminUser)
    const res = await request(app)
      .put('/api/users/uuid-inexistente')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ghost User' })

    expect(res.status).toBe(404)
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  test('actualizar role a valor inválido → 400', async () => {
    // El controller valida el role antes de hacer el update.
    prisma.user.findUnique.mockResolvedValueOnce(adminUser) // existe

    const token = signToken(adminUser)
    const res = await request(app)
      .put(`/api/users/${adminUser.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'GODMODE' })

    expect(res.status).toBe(400)
    expect(prisma.user.update).not.toHaveBeenCalled()
  })
})

// ─── POST /api/users/:id/reset-password ──────────────────────────────────────

describe('POST /api/users/:id/reset-password — resetear contraseña', () => {

  test('usuario existente → 200 con nueva temporaryPassword y mustChangePassword=true', async () => {
    // El reset genera una nueva contraseña temporal y fuerza al usuario
    // a cambiarla en su próximo login (mustChangePassword=true).
    prisma.user.findUnique.mockResolvedValueOnce(vendorUser) // exists check
    prisma.user.update.mockResolvedValueOnce({
      id:                 vendorUser.id,
      name:               vendorUser.name,
      email:              vendorUser.email,
      role:               'VENDOR',
      isActive:           true,
      mustChangePassword: true,
      createdAt:          new Date(),
      updatedAt:          new Date(),
    })

    const token = signToken(adminUser)
    const res = await request(app)
      .post(`/api/users/${vendorUser.id}/reset-password`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.mustChangePassword).toBe(true)
    expect(res.body.temporaryPassword).toBeDefined()
    expect(res.body.passwordHash).toBeUndefined()
  })

  test('usuario inexistente → 404', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null)

    const token = signToken(adminUser)
    const res = await request(app)
      .post('/api/users/uuid-fantasma/reset-password')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(404)
    expect(prisma.user.update).not.toHaveBeenCalled()
  })
})

/**
 * auth.test.js — Tests de autenticación
 *
 * Cubre tres áreas:
 *   1. POST /api/auth/login — credenciales válidas e inválidas
 *   2. Middleware auth.js — protección de rutas con Bearer token
 *   3. PUT /api/auth/change-password — cambio de contraseña autenticado
 *
 * Estrategia de mock:
 *   jest.mock intercepta require('../src/prisma') ANTES de que cualquier ruta
 *   sea cargada. Cada test configura mockResolvedValueOnce para controlar qué
 *   devuelve Prisma en esa llamada específica.
 *
 * Por qué jest.mock va primero:
 *   Jest hoist automáticamente todos los jest.mock() al inicio del archivo,
 *   antes de cualquier require o import. Esto garantiza que cuando buildApp()
 *   carga las rutas, el módulo prisma ya está mockeado.
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
    update:     jest.fn(),
    count:      jest.fn(),
  },
  case: {
    findMany:   jest.fn(),
    findUnique: jest.fn(),
    create:     jest.fn(),
    update:     jest.fn(),
    count:      jest.fn(),
  },
}))

const request = require('supertest')
const prisma   = require('../src/prisma')
const {
  buildApp,
  signToken,
  adminUser,
  vendorUser,
  ADMIN_RAW_PASSWORD,
} = require('./setup')

// buildApp() se llama UNA vez por test file. Supertest reutiliza la misma
// instancia de la app; el estado por request lo controlan los mocks.
const app = buildApp()

// clearMocks (configurado en jest.config.js) limpia el historial de llamadas
// automáticamente. Aquí reiniciamos explícitamente las implementaciones también.
beforeEach(() => {
  jest.clearAllMocks()
})

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {

  test('credenciales válidas → 200 con token JWT y DTO de usuario sin passwordHash', async () => {
    // Simulamos que Prisma encuentra al usuario en BD.
    // bcrypt.compare comparará ADMIN_RAW_PASSWORD contra adminUser.passwordHash real.
    prisma.user.findUnique.mockResolvedValueOnce(adminUser)

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: adminUser.email, password: ADMIN_RAW_PASSWORD })

    expect(res.status).toBe(200)

    // El token debe existir y ser un string (JWT formato xxx.yyy.zzz)
    expect(res.body.token).toBeDefined()
    expect(typeof res.body.token).toBe('string')
    expect(res.body.token.split('.')).toHaveLength(3)

    // El DTO nunca debe exponer el hash de la contraseña
    expect(res.body.user.email).toBe(adminUser.email)
    expect(res.body.user.role).toBe('ADMIN')
    expect(res.body.user.passwordHash).toBeUndefined()
  })

  test('password incorrecta → 401 sin token', async () => {
    // Prisma encuentra el usuario, pero bcrypt.compare fallará porque
    // la contraseña enviada no coincide con el hash almacenado.
    prisma.user.findUnique.mockResolvedValueOnce(adminUser)

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: adminUser.email, password: 'WrongPassword999!' })

    expect(res.status).toBe(401)
    expect(res.body.token).toBeUndefined()
  })

  test('email inexistente → 401', async () => {
    // Prisma devuelve null: ningún usuario tiene ese email.
    prisma.user.findUnique.mockResolvedValueOnce(null)

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'fantasma@noexiste.com', password: 'AnyPass123!' })

    expect(res.status).toBe(401)
    expect(res.body.token).toBeUndefined()
  })

  test('usuario con isActive=false → 403 (cuenta inactiva)', async () => {
    // El controller verifica isActive antes de comparar passwords.
    // Un vendor desactivado no debe poder autenticarse.
    prisma.user.findUnique.mockResolvedValueOnce({ ...vendorUser, isActive: false })

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: vendorUser.email, password: 'VendorPass123!' })

    expect(res.status).toBe(403)
  })

  test('body vacío (sin email ni password) → 400', async () => {
    // El controller valida presencia de email y password antes de consultar BD.
    // Prisma no debe ser llamado en este caso.
    const res = await request(app)
      .post('/api/auth/login')
      .send({})

    expect(res.status).toBe(400)
    expect(prisma.user.findUnique).not.toHaveBeenCalled()
  })

  test('falta solo el password → 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: adminUser.email })

    expect(res.status).toBe(400)
  })
})

// ─── Middleware auth.js — rutas protegidas ────────────────────────────────────

describe('Middleware auth — protección de rutas con Bearer token', () => {

  test('token válido en ruta ADMIN → 200', async () => {
    // GET /api/users requiere ADMIN. Configuramos findMany para devolver
    // una lista vacía (respuesta válida con 0 usuarios).
    prisma.user.findMany.mockResolvedValueOnce([])

    const token = signToken(adminUser)

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  test('sin header Authorization → 401', async () => {
    // auth.js devuelve 401 si no hay header Authorization.
    const res = await request(app).get('/api/users')

    expect(res.status).toBe(401)
    // Prisma no debe ser consultado si el usuario no está autenticado
    expect(prisma.user.findMany).not.toHaveBeenCalled()
  })

  test('token malformado (no es JWT válido) → 401', async () => {
    // jwt.verify lanza error → auth.js atrapa y devuelve 401.
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', 'Bearer este-string-no-es-un-jwt')

    expect(res.status).toBe(401)
  })

  test('header con esquema incorrecto (Basic en vez de Bearer) → 401', async () => {
    // auth.js solo acepta esquema "Bearer", cualquier otro es rechazado.
    const token = signToken(adminUser)
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Basic ${token}`)

    expect(res.status).toBe(401)
  })

  test('token VENDOR en ruta exclusiva ADMIN → 403', async () => {
    // El token es válido (firma correcta), pero requireRole('ADMIN') bloquea
    // a usuarios con rol VENDOR. Esta distinción 401 vs 403 es importante:
    //   401 = no autenticado, 403 = autenticado pero sin permisos.
    const token = signToken(vendorUser)

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(403)
    expect(prisma.user.findMany).not.toHaveBeenCalled()
  })
})

// ─── PUT /api/auth/change-password ───────────────────────────────────────────

describe('PUT /api/auth/change-password', () => {

  test('cambio de password con credenciales correctas → 200 con mustChangePassword=false', async () => {
    // El controller busca al usuario por req.user.id (del JWT), luego
    // valida la contraseña actual con bcrypt.compare.
    prisma.user.findUnique.mockResolvedValueOnce(adminUser)
    prisma.user.update.mockResolvedValueOnce({
      ...adminUser,
      mustChangePassword: false,
    })

    const token = signToken(adminUser)

    const res = await request(app)
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: ADMIN_RAW_PASSWORD, newPassword: 'NewSecurePass456!' })

    expect(res.status).toBe(200)
    // Confirmar que el flag de cambio obligatorio fue removido
    expect(res.body.mustChangePassword).toBe(false)
  })

  test('password actual incorrecta → 401', async () => {
    // bcrypt.compare falla porque la contraseña enviada no coincide.
    prisma.user.findUnique.mockResolvedValueOnce(adminUser)

    const token = signToken(adminUser)

    const res = await request(app)
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'WrongCurrent!', newPassword: 'NewPass456!' })

    expect(res.status).toBe(401)
    // El update NO debe ejecutarse si la contraseña actual es incorrecta
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  test('sin token → 401 antes de llegar al controller', async () => {
    const res = await request(app)
      .put('/api/auth/change-password')
      .send({ currentPassword: ADMIN_RAW_PASSWORD, newPassword: 'NewPass456!' })

    expect(res.status).toBe(401)
    expect(prisma.user.findUnique).not.toHaveBeenCalled()
  })

  test('body sin campos requeridos → 400', async () => {
    const token = signToken(adminUser)

    const res = await request(app)
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({}) // ni currentPassword ni newPassword

    expect(res.status).toBe(400)
  })
})

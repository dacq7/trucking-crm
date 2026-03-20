const crypto = require('crypto')
const bcrypt = require('bcryptjs')

const prisma = require('../prisma')

function userDto(user) {
  if (!user) return null
  const { passwordHash: _p, ...rest } = user
  return rest
}

function generateTemporaryPassword() {
  return `Tmp${crypto.randomBytes(6).toString('base64url')}!`
}

exports.getUsers = async (req, res) => {
  try {
    const { role, isActive } = req.query
    const where = {}

    if (role === 'ADMIN' || role === 'VENDOR') {
      where.role = role
    }

    if (isActive === 'true' || isActive === 'false') {
      where.isActive = isActive === 'true'
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
      },
    })

    return res.json(users)
  } catch (_err) {
    return res.status(500).json({ message: 'Error interno' })
  }
}

exports.getUserById = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' })

    return res.json(user)
  } catch (_err) {
    return res.status(500).json({ message: 'Error interno' })
  }
}

exports.createUser = async (req, res) => {
  try {
    const { name, email, role } = req.body || {}

    if (!name || !email || !role) {
      return res.status(400).json({ message: 'name, email y role son requeridos' })
    }

    if (role !== 'ADMIN' && role !== 'VENDOR') {
      return res.status(400).json({ message: 'role inválido' })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return res.status(409).json({ message: 'El email ya está registrado' })

    const temporaryPassword = generateTemporaryPassword()
    const passwordHash = await bcrypt.hash(temporaryPassword, 10)

    const created = await prisma.user.create({
      data: {
        name,
        email,
        role,
        passwordHash,
        mustChangePassword: true,
      },
    })

    return res.status(201).json({
      ...userDto(created),
      temporaryPassword,
    })
  } catch (_err) {
    return res.status(500).json({ message: 'Error interno' })
  }
}

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params
    const exists = await prisma.user.findUnique({ where: { id } })
    if (!exists) return res.status(404).json({ message: 'Usuario no encontrado' })

    const { name, email, role, isActive } = req.body || {}
    const data = {}

    if (name !== undefined) data.name = name
    if (email !== undefined) {
      const dup = await prisma.user.findUnique({ where: { email } })
      if (dup && dup.id !== id) {
        return res.status(409).json({ message: 'El email ya está en uso' })
      }
      data.email = email
    }
    if (role !== undefined) {
      if (role !== 'ADMIN' && role !== 'VENDOR') {
        return res.status(400).json({ message: 'role inválido' })
      }
      data.role = role
    }
    if (isActive !== undefined) data.isActive = Boolean(isActive)

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return res.json(updated)
  } catch (_err) {
    return res.status(500).json({ message: 'Error interno' })
  }
}

exports.resetPassword = async (req, res) => {
  try {
    const { id } = req.params
    const exists = await prisma.user.findUnique({ where: { id } })
    if (!exists) return res.status(404).json({ message: 'Usuario no encontrado' })

    const temporaryPassword = generateTemporaryPassword()
    const passwordHash = await bcrypt.hash(temporaryPassword, 10)

    const updated = await prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        mustChangePassword: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return res.json({
      ...updated,
      temporaryPassword,
    })
  } catch (_err) {
    return res.status(500).json({ message: 'Error interno' })
  }
}

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const prisma = require('../prisma')

function userDto(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
  }
}

function signJwt(user) {
  const secret = process.env.JWT_SECRET
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    },
    secret,
    { expiresIn: '8h' }
  )
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {}

    if (!email || !password) {
      return res.status(400).json({ message: 'Email y password son requeridos' })
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) return res.status(401).json({ message: 'Credenciales inválidas' })

    if (!user.isActive) return res.status(403).json({ message: 'Usuario inactivo' })

    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) return res.status(401).json({ message: 'Credenciales inválidas' })

    const token = signJwt(user)

    return res.json({
      token,
      user: userDto(user),
    })
  } catch (err) {
    return res.status(500).json({ message: 'Error interno' })
  }
}

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {}

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: 'currentPassword y newPassword son requeridos' })
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    })

    if (!user) return res.status(401).json({ message: 'Usuario no autenticado' })

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!isValid) return res.status(401).json({ message: 'Password actual incorrecta' })

    const hashed = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashed,
        mustChangePassword: false,
      },
    })

    return res.json({ message: 'Password actualizada correctamente', mustChangePassword: false })
  } catch (err) {
    return res.status(500).json({ message: 'Error interno' })
  }
}

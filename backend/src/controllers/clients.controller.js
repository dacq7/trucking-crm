const prisma = require('../prisma')

function toInt(value, fallback) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

async function ensureClientAccess(clientId, user) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
  })

  if (!client) return { error: 'Cliente no encontrado', status: 404 }
  if (user.role === 'VENDOR' && client.vendorId !== user.id) {
    return { error: 'Forbidden', status: 403 }
  }

  return { client }
}

exports.getClients = async (req, res) => {
  try {
    const page = toInt(req.query.page, 1)
    const limit = toInt(req.query.limit, 20)
    const search = (req.query.search || '').trim()
    const vendorIdQuery = req.query.vendorId

    const where = {}
    if (search) {
      where.OR = [
        { legalBusinessName: { contains: search, mode: 'insensitive' } },
        { dotNumber: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (req.user.role === 'VENDOR') {
      where.vendorId = req.user.id
    } else if (vendorIdQuery) {
      where.vendorId = vendorIdQuery
    }

    const [total, data] = await Promise.all([
      prisma.client.count({ where }),
      prisma.client.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          vendor: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
    ])

    return res.json({
      data,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    })
  } catch (_err) {
    return res.status(500).json({ message: 'Error interno' })
  }
}

exports.getClientById = async (req, res) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: {
        vendor: { select: { id: true, name: true, email: true } },
        vehicles: true,
        drivers: true,
        cases: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!client) return res.status(404).json({ message: 'Cliente no encontrado' })
    if (req.user.role === 'VENDOR' && client.vendorId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' })
    }

    return res.json(client)
  } catch (_err) {
    return res.status(500).json({ message: 'Error interno' })
  }
}

exports.createClient = async (req, res) => {
  try {
    const vendorId =
      req.user.role === 'VENDOR'
        ? req.user.id
        : (req.body.vendorId || req.user.id)

    const duplicate = await prisma.client.findUnique({
      where: { dotNumber: req.body.dotNumber },
    })
    if (duplicate) return res.status(409).json({ message: 'DOT Number ya existe' })

    const client = await prisma.client.create({
      data: {
        ...req.body,
        vendorId,
      },
      include: {
        vendor: { select: { id: true, name: true, email: true } },
      },
    })

    return res.status(201).json(client)
  } catch (_err) {
    return res.status(500).json({ message: 'Error interno' })
  }
}

exports.updateClient = async (req, res) => {
  try {
    const { id } = req.params
    const access = await ensureClientAccess(id, req.user)
    if (access.error) return res.status(access.status).json({ message: access.error })

    if (req.user.role !== 'ADMIN') {
      delete req.body.vendorId
    }

    if (req.body.dotNumber && req.body.dotNumber !== access.client.dotNumber) {
      const duplicate = await prisma.client.findUnique({
        where: { dotNumber: req.body.dotNumber },
      })
      if (duplicate && duplicate.id !== id) {
        return res.status(409).json({ message: 'DOT Number ya existe' })
      }
    }

    const updated = await prisma.client.update({
      where: { id },
      data: req.body,
      include: {
        vendor: { select: { id: true, name: true, email: true } },
      },
    })

    return res.json(updated)
  } catch (_err) {
    return res.status(500).json({ message: 'Error interno' })
  }
}

exports.deleteClient = async (req, res) => {
  try {
    const { id } = req.params
    const exists = await prisma.client.findUnique({ where: { id } })
    if (!exists) return res.status(404).json({ message: 'Cliente no encontrado' })

    await prisma.client.update({
      where: { id },
      data: { isActive: false },
    })

    return res.json({ message: 'Cliente desactivado' })
  } catch (_err) {
    return res.status(500).json({ message: 'Error interno' })
  }
}


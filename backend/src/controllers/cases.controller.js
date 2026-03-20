const prisma = require('../prisma')

function toInt(value, fallback) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

async function getCaseWithAccess(caseId, user) {
  const current = await prisma.case.findUnique({ where: { id: caseId } })
  if (!current) return { status: 404, message: 'Caso no encontrado' }
  if (user.role === 'VENDOR' && current.vendorId !== user.id) {
    return { status: 403, message: 'Forbidden' }
  }
  return { current }
}

exports.getCases = async (req, res) => {
  try {
    const page = toInt(req.query.page, 1)
    const limit = toInt(req.query.limit, 20)
    const search = (req.query.search || '').trim()
    const status = req.query.status
    const vendorIdQuery = req.query.vendorId

    const where = {}
    if (status) where.status = status

    if (search) {
      where.OR = [
        { caseNumber: { contains: search, mode: 'insensitive' } },
        { client: { legalBusinessName: { contains: search, mode: 'insensitive' } } },
      ]
    }

    if (req.user.role === 'VENDOR') {
      where.vendorId = req.user.id
    } else if (vendorIdQuery) {
      where.vendorId = vendorIdQuery
    }

    const [total, data] = await Promise.all([
      prisma.case.count({ where }),
      prisma.case.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, legalBusinessName: true, dotNumber: true } },
          vendor: { select: { id: true, name: true } },
          policy: { select: { id: true, policyNumber: true, status: true, expirationDate: true } },
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

exports.getCaseById = async (req, res) => {
  try {
    const data = await prisma.case.findUnique({
      where: { id: req.params.id },
      include: {
        client: true,
        vendor: { select: { id: true, name: true, email: true } },
        coverageRequests: true,
        policy: { include: { boundCoverages: true } },
        statusHistory: { orderBy: { changedAt: 'desc' } },
      },
    })

    if (!data) return res.status(404).json({ message: 'Caso no encontrado' })
    if (req.user.role === 'VENDOR' && data.vendorId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' })
    }

    return res.json(data)
  } catch (_err) {
    return res.status(500).json({ message: 'Error interno' })
  }
}

exports.createCase = async (req, res) => {
  try {
    const { clientId } = req.body
    if (!clientId) return res.status(400).json({ message: 'clientId es requerido' })

    const vendorId =
      req.user.role === 'VENDOR' ? req.user.id : (req.body.vendorId || req.user.id)
    const status = req.body.status || 'LEAD'

    const client = await prisma.client.findUnique({ where: { id: clientId } })
    if (!client) return res.status(404).json({ message: 'Cliente no encontrado' })
    if (req.user.role === 'VENDOR' && client.vendorId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' })
    }

    const created = await prisma.$transaction(async (tx) => {
      const newCase = await tx.case.create({
        data: {
          clientId,
          vendorId,
          status,
          notes: req.body.notes || null,
          lostReason: req.body.lostReason || null,
        },
        include: {
          client: { select: { id: true, legalBusinessName: true, dotNumber: true } },
          vendor: { select: { id: true, name: true } },
          policy: { select: { id: true, policyNumber: true, status: true, expirationDate: true } },
        },
      })

      await tx.caseStatusHistory.create({
        data: {
          caseId: newCase.id,
          status,
          note: 'Estado inicial',
        },
      })

      return newCase
    })

    return res.status(201).json(created)
  } catch (_err) {
    return res.status(500).json({ message: 'Error interno' })
  }
}

exports.updateCase = async (req, res) => {
  try {
    const { id } = req.params
    const access = await getCaseWithAccess(id, req.user)
    if (!access.current) return res.status(access.status).json({ message: access.message })

    const nextData = { ...req.body }
    if (req.user.role !== 'ADMIN') delete nextData.vendorId

    const statusChanged = nextData.status && nextData.status !== access.current.status

    const updated = await prisma.$transaction(async (tx) => {
      const c = await tx.case.update({
        where: { id },
        data: nextData,
        include: {
          client: { select: { id: true, legalBusinessName: true, dotNumber: true } },
          vendor: { select: { id: true, name: true } },
          policy: { select: { id: true, policyNumber: true, status: true, expirationDate: true } },
        },
      })

      if (statusChanged) {
        await tx.caseStatusHistory.create({
          data: {
            caseId: id,
            status: nextData.status,
            note: req.body.statusNote || null,
          },
        })
      }

      return c
    })

    return res.json(updated)
  } catch (_err) {
    return res.status(500).json({ message: 'Error interno' })
  }
}

exports.deleteCase = async (req, res) => {
  try {
    const { id } = req.params
    const exists = await prisma.case.findUnique({ where: { id } })
    if (!exists) return res.status(404).json({ message: 'Caso no encontrado' })

    await prisma.case.delete({ where: { id } })
    return res.json({ message: 'Caso eliminado' })
  } catch (_err) {
    return res.status(500).json({ message: 'Error interno' })
  }
}


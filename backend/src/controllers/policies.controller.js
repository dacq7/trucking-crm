const prisma = require('../prisma')

function toInt(value, fallback) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

async function getCaseWithAccess(caseId, user) {
  const c = await prisma.case.findUnique({ where: { id: caseId }, include: { policy: true } })
  if (!c) return { status: 404, message: 'Caso no encontrado' }
  if (user.role === 'VENDOR' && c.vendorId !== user.id) return { status: 403, message: 'Forbidden' }
  return { c }
}

exports.createPolicy = async (req, res) => {
  try {
    const { id: caseId } = req.params
    const access = await getCaseWithAccess(caseId, req.user)
    if (!access.c) return res.status(access.status).json({ message: access.message })
    if (access.c.policy) return res.status(409).json({ message: 'El caso ya tiene póliza' })

    const boundCoverages = Array.isArray(req.body.boundCoverages) ? req.body.boundCoverages : []
    const payload = { ...req.body }
    delete payload.boundCoverages

    const created = await prisma.$transaction(async (tx) => {
      const policy = await tx.policy.create({
        data: {
          ...payload,
          caseId,
          boundCoverages: boundCoverages.length
            ? {
                create: boundCoverages,
              }
            : undefined,
        },
        include: {
          boundCoverages: true,
          case: { include: { client: true } },
        },
      })

      await tx.case.update({
        where: { id: caseId },
        data: { status: 'POLICY_ISSUED' },
      })

      await tx.caseStatusHistory.create({
        data: {
          caseId,
          status: 'POLICY_ISSUED',
          note: 'Póliza emitida automáticamente',
        },
      })

      return policy
    })

    return res.status(201).json(created)
  } catch (_err) {
    return res.status(500).json({ message: 'Error interno' })
  }
}

exports.updatePolicy = async (req, res) => {
  try {
    const { id: caseId } = req.params
    const access = await getCaseWithAccess(caseId, req.user)
    if (!access.c) return res.status(access.status).json({ message: access.message })
    if (!access.c.policy) return res.status(404).json({ message: 'Póliza no encontrada' })

    const boundCoverages = Array.isArray(req.body.boundCoverages) ? req.body.boundCoverages : null
    const payload = { ...req.body }
    delete payload.boundCoverages

    const updated = await prisma.$transaction(async (tx) => {
      await tx.policy.update({
        where: { caseId },
        data: payload,
      })

      if (boundCoverages) {
        await tx.boundCoverage.deleteMany({ where: { policyId: access.c.policy.id } })
        if (boundCoverages.length) {
          await tx.boundCoverage.createMany({
            data: boundCoverages.map((item) => ({ ...item, policyId: access.c.policy.id })),
          })
        }
      }

      return tx.policy.findUnique({
        where: { caseId },
        include: {
          boundCoverages: true,
          case: { include: { client: true } },
        },
      })
    })

    return res.json(updated)
  } catch (_err) {
    return res.status(500).json({ message: 'Error interno' })
  }
}

exports.getPolicies = async (req, res) => {
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
        { policyNumber: { contains: search, mode: 'insensitive' } },
        { carrier: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (req.user.role === 'VENDOR') {
      where.case = { vendorId: req.user.id }
    } else if (vendorIdQuery) {
      where.case = { vendorId: vendorIdQuery }
    }

    const [total, data] = await Promise.all([
      prisma.policy.count({ where }),
      prisma.policy.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          case: {
            include: {
              client: { select: { id: true, legalBusinessName: true, dotNumber: true } },
            },
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

exports.getPolicyById = async (req, res) => {
  try {
    const data = await prisma.policy.findUnique({
      where: { id: req.params.id },
      include: {
        boundCoverages: true,
        case: {
          include: {
            client: true,
            vendor: { select: { id: true, name: true, email: true } },
          },
        },
      },
    })

    if (!data) return res.status(404).json({ message: 'Póliza no encontrada' })
    if (req.user.role === 'VENDOR' && data.case.vendorId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' })
    }

    return res.json(data)
  } catch (_err) {
    return res.status(500).json({ message: 'Error interno' })
  }
}


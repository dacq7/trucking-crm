const prisma = require('../prisma')

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function toSumOrZero(value) {
  return typeof value === 'number' ? value : 0
}

function buildPoliciesExpiringSoon(policies) {
  return policies.map((p) => ({
    id: p.id,
    policyNumber: p.policyNumber,
    carrier: p.carrier,
    expirationDate: p.expirationDate,
    totalAnnualPremium: p.totalAnnualPremium,
  }))
}

exports.getStats = async (req, res) => {
  if (req.user.role === 'ADMIN') {
    return exports.getAdminStats(req, res)
  }
  return exports.getVendorStats(req, res)
}

exports.getAdminStats = async (req, res) => {
  try {
    const now = new Date()
    const soon = addDays(now, 30)

    const [
      totalClients,
      totalPolicies,
      sumPremium,
      policiesExpiringSoonRaw,
      casesByStatus,
      vendors,
    ] = await Promise.all([
      prisma.client.count({
        where: { isActive: true },
      }),
      prisma.policy.count({
        where: { status: 'ACTIVE' },
      }),
      prisma.policy.aggregate({
        where: { status: 'ACTIVE' },
        _sum: { totalAnnualPremium: true },
      }),
      prisma.policy.findMany({
        where: {
          status: 'ACTIVE',
          expirationDate: {
            gte: now,
            lte: soon,
          },
        },
        select: {
          id: true,
          policyNumber: true,
          carrier: true,
          expirationDate: true,
          totalAnnualPremium: true,
        },
        orderBy: { expirationDate: 'asc' },
      }),
      prisma.case.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      prisma.user.findMany({
        where: { role: 'VENDOR', isActive: true },
        select: { id: true, name: true, email: true },
      }),
    ])

    const totalPremium = toSumOrZero(sumPremium._sum.totalAnnualPremium)

    const vendorStats = await Promise.all(
      vendors.map(async (v) => {
        const [totalClients, totalCases, totalPolicies, sumPremium] =
          await Promise.all([
            prisma.client.count({
              where: { vendorId: v.id, isActive: true },
            }),
            prisma.case.count({
              where: { vendorId: v.id },
            }),
            prisma.policy.count({
              where: {
                status: 'ACTIVE',
                case: { vendorId: v.id },
              },
            }),
            prisma.policy.aggregate({
              where: {
                status: 'ACTIVE',
                case: { vendorId: v.id },
              },
              _sum: { totalAnnualPremium: true },
            }),
          ])

        return {
          id: v.id,
          name: v.name,
          email: v.email,
          totalClients,
          totalCases,
          totalPolicies,
          totalPremium: toSumOrZero(sumPremium._sum.totalAnnualPremium),
        }
      })
    )

    return res.json({
      totalClients,
      totalPolicies,
      totalPremium,
      policiesExpiringSoon: buildPoliciesExpiringSoon(policiesExpiringSoonRaw),
      casesByStatus: casesByStatus.map((c) => ({
        status: c.status,
        count: c._count._all,
      })),
      vendorStats,
    })
  } catch (_err) {
    return res.status(500).json({ message: 'Error interno' })
  }
}

exports.getVendorStats = async (req, res) => {
  try {
    const vendorId = req.user.id
    const now = new Date()
    const soon = addDays(now, 30)

    const [
      totalClients,
      totalPolicies,
      sumPremium,
      policiesExpiringSoonRaw,
      casesByStatus,
      recentCases,
    ] = await Promise.all([
      prisma.client.count({
        where: { vendorId, isActive: true },
      }),
      prisma.policy.count({
        where: {
          status: 'ACTIVE',
          case: { vendorId },
        },
      }),
      prisma.policy.aggregate({
        where: {
          status: 'ACTIVE',
          case: { vendorId },
        },
        _sum: { totalAnnualPremium: true },
      }),
      prisma.policy.findMany({
        where: {
          status: 'ACTIVE',
          expirationDate: {
            gte: now,
            lte: soon,
          },
          case: { vendorId },
        },
        select: {
          id: true,
          policyNumber: true,
          carrier: true,
          expirationDate: true,
          totalAnnualPremium: true,
        },
        orderBy: { expirationDate: 'asc' },
      }),
      prisma.case.groupBy({
        by: ['status'],
        where: { vendorId },
        _count: { _all: true },
      }),
      prisma.case.findMany({
        where: { vendorId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          client: {
            select: {
              legalBusinessName: true,
            },
          },
        },
      }),
    ])

    const totalPremium = toSumOrZero(sumPremium._sum.totalAnnualPremium)

    return res.json({
      totalClients,
      totalPolicies,
      totalPremium,
      policiesExpiringSoon: buildPoliciesExpiringSoon(policiesExpiringSoonRaw),
      casesByStatus: casesByStatus.map((c) => ({
        status: c.status,
        count: c._count._all,
      })),
      recentCases: recentCases.map((c) => ({
        id: c.id,
        clientName: c.client?.legalBusinessName || 'N/A',
        status: c.status,
        createdAt: c.createdAt,
      })),
    })
  } catch (_err) {
    return res.status(500).json({ message: 'Error interno' })
  }
}


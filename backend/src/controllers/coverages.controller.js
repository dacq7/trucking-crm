const prisma = require('../prisma')

async function ensureCaseAccess(caseId, user) {
  const c = await prisma.case.findUnique({ where: { id: caseId } })
  if (!c) return { status: 404, message: 'Caso no encontrado' }
  if (user.role === 'VENDOR' && c.vendorId !== user.id) return { status: 403, message: 'Forbidden' }
  return { c }
}

exports.createCoverageRequest = async (req, res) => {
  try {
    const { id: caseId } = req.params
    const access = await ensureCaseAccess(caseId, req.user)
    if (!access.c) return res.status(access.status).json({ message: access.message })

    const coverage = await prisma.coverageRequest.create({
      data: {
        ...req.body,
        caseId,
      },
    })

    return res.status(201).json(coverage)
  } catch (_err) {
    return res.status(500).json({ message: 'Error interno' })
  }
}

exports.updateCoverageRequest = async (req, res) => {
  try {
    const { id: caseId, coverageId } = req.params
    const access = await ensureCaseAccess(caseId, req.user)
    if (!access.c) return res.status(access.status).json({ message: access.message })

    const current = await prisma.coverageRequest.findUnique({ where: { id: coverageId } })
    if (!current || current.caseId !== caseId) {
      return res.status(404).json({ message: 'Cobertura no encontrada' })
    }

    const updated = await prisma.coverageRequest.update({
      where: { id: coverageId },
      data: req.body,
    })
    return res.json(updated)
  } catch (_err) {
    return res.status(500).json({ message: 'Error interno' })
  }
}

exports.deleteCoverageRequest = async (req, res) => {
  try {
    const { id: caseId, coverageId } = req.params
    const access = await ensureCaseAccess(caseId, req.user)
    if (!access.c) return res.status(access.status).json({ message: access.message })

    const current = await prisma.coverageRequest.findUnique({ where: { id: coverageId } })
    if (!current || current.caseId !== caseId) {
      return res.status(404).json({ message: 'Cobertura no encontrada' })
    }

    await prisma.coverageRequest.delete({ where: { id: coverageId } })
    return res.json({ message: 'Cobertura eliminada' })
  } catch (_err) {
    return res.status(500).json({ message: 'Error interno' })
  }
}


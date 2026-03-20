const prisma = require('../prisma')

async function ensureClientAccess(clientId, user) {
  const client = await prisma.client.findUnique({ where: { id: clientId } })
  if (!client) return { error: 'Cliente no encontrado', status: 404 }
  if (user.role === 'VENDOR' && client.vendorId !== user.id) {
    return { error: 'Forbidden', status: 403 }
  }
  return { client }
}

exports.createDriver = async (req, res) => {
  try {
    const { id: clientId } = req.params
    const access = await ensureClientAccess(clientId, req.user)
    if (access.error) return res.status(access.status).json({ message: access.error })

    const driver = await prisma.driver.create({
      data: {
        ...req.body,
        clientId,
      },
    })

    return res.status(201).json(driver)
  } catch (_err) {
    return res.status(500).json({ message: 'Error interno' })
  }
}

exports.updateDriver = async (req, res) => {
  try {
    const { id: clientId, driverId } = req.params
    const access = await ensureClientAccess(clientId, req.user)
    if (access.error) return res.status(access.status).json({ message: access.error })

    const driver = await prisma.driver.findUnique({ where: { id: driverId } })
    if (!driver || driver.clientId !== clientId) {
      return res.status(404).json({ message: 'Driver no encontrado' })
    }

    const updated = await prisma.driver.update({
      where: { id: driverId },
      data: req.body,
    })
    return res.json(updated)
  } catch (_err) {
    return res.status(500).json({ message: 'Error interno' })
  }
}

exports.deleteDriver = async (req, res) => {
  try {
    const { id: clientId, driverId } = req.params
    const access = await ensureClientAccess(clientId, req.user)
    if (access.error) return res.status(access.status).json({ message: access.error })

    const driver = await prisma.driver.findUnique({ where: { id: driverId } })
    if (!driver || driver.clientId !== clientId) {
      return res.status(404).json({ message: 'Driver no encontrado' })
    }

    await prisma.driver.delete({ where: { id: driverId } })
    return res.json({ message: 'Driver eliminado' })
  } catch (_err) {
    return res.status(500).json({ message: 'Error interno' })
  }
}


const prisma = require('../prisma')

async function ensureClientAccess(clientId, user) {
  const client = await prisma.client.findUnique({ where: { id: clientId } })
  if (!client) return { error: 'Cliente no encontrado', status: 404 }
  if (user.role === 'VENDOR' && client.vendorId !== user.id) {
    return { error: 'Forbidden', status: 403 }
  }
  return { client }
}

exports.createVehicle = async (req, res) => {
  try {
    const { id: clientId } = req.params
    const access = await ensureClientAccess(clientId, req.user)
    if (access.error) return res.status(access.status).json({ message: access.error })

    const vehicle = await prisma.vehicle.create({
      data: {
        ...req.body,
        clientId,
      },
    })

    return res.status(201).json(vehicle)
  } catch (_err) {
    return res.status(500).json({ message: 'Error interno' })
  }
}

exports.updateVehicle = async (req, res) => {
  try {
    const { id: clientId, vehicleId } = req.params
    const access = await ensureClientAccess(clientId, req.user)
    if (access.error) return res.status(access.status).json({ message: access.error })

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } })
    if (!vehicle || vehicle.clientId !== clientId) {
      return res.status(404).json({ message: 'Vehículo no encontrado' })
    }

    const updated = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: req.body,
    })
    return res.json(updated)
  } catch (_err) {
    return res.status(500).json({ message: 'Error interno' })
  }
}

exports.deleteVehicle = async (req, res) => {
  try {
    const { id: clientId, vehicleId } = req.params
    const access = await ensureClientAccess(clientId, req.user)
    if (access.error) return res.status(access.status).json({ message: access.error })

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } })
    if (!vehicle || vehicle.clientId !== clientId) {
      return res.status(404).json({ message: 'Vehículo no encontrado' })
    }

    await prisma.vehicle.delete({ where: { id: vehicleId } })
    return res.json({ message: 'Vehículo eliminado' })
  } catch (_err) {
    return res.status(500).json({ message: 'Error interno' })
  }
}


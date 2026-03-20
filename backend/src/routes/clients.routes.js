const express = require('express')

const auth = require('../middleware/auth')
const requireRole = require('../middleware/requireRole')

const clientsController = require('../controllers/clients.controller')
const vehiclesController = require('../controllers/vehicles.controller')
const driversController = require('../controllers/drivers.controller')

const router = express.Router()

router.get('/', auth, clientsController.getClients)
router.get('/:id', auth, clientsController.getClientById)
router.post('/', auth, clientsController.createClient)
router.put('/:id', auth, clientsController.updateClient)
router.delete('/:id', auth, requireRole('ADMIN'), clientsController.deleteClient)

router.post('/:id/vehicles', auth, vehiclesController.createVehicle)
router.put('/:id/vehicles/:vehicleId', auth, vehiclesController.updateVehicle)
router.delete('/:id/vehicles/:vehicleId', auth, vehiclesController.deleteVehicle)

router.post('/:id/drivers', auth, driversController.createDriver)
router.put('/:id/drivers/:driverId', auth, driversController.updateDriver)
router.delete('/:id/drivers/:driverId', auth, driversController.deleteDriver)

module.exports = router


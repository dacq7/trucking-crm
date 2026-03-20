const express = require('express')

const auth = require('../middleware/auth')
const requireRole = require('../middleware/requireRole')

const dashboardController = require('../controllers/dashboard.controller')

const router = express.Router()

router.get('/admin', auth, requireRole('ADMIN'), dashboardController.getAdminStats)
router.get('/vendor', auth, dashboardController.getVendorStats)

module.exports = router


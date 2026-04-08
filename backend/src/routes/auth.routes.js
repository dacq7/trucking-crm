const express = require('express')

const auth = require('../middleware/auth')
const requireRole = require('../middleware/requireRole')
const authController = require('../controllers/auth.controller')

const router = express.Router()

router.post('/login', authController.login)
router.post('/register', auth, requireRole('ADMIN'), authController.register)
router.put('/change-password', auth, authController.changePassword)

module.exports = router

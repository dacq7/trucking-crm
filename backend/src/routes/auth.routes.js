const express = require('express')

const auth = require('../middleware/auth')
const authController = require('../controllers/auth.controller')

const router = express.Router()

router.post('/login', authController.login)
router.put('/change-password', auth, authController.changePassword)

module.exports = router

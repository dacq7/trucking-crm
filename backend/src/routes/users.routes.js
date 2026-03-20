const express = require('express')

const auth = require('../middleware/auth')
const requireRole = require('../middleware/requireRole')
const usersController = require('../controllers/users.controller')

const router = express.Router()

router.use(auth, requireRole('ADMIN'))

router.get('/', usersController.getUsers)
router.get('/:id', usersController.getUserById)
router.post('/', usersController.createUser)
router.put('/:id', usersController.updateUser)
router.post('/:id/reset-password', usersController.resetPassword)

module.exports = router

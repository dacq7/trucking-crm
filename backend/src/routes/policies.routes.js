const express = require('express')

const auth = require('../middleware/auth')
const policiesController = require('../controllers/policies.controller')

const router = express.Router()

router.get('/', auth, policiesController.getPolicies)
router.get('/:id', auth, policiesController.getPolicyById)

module.exports = router


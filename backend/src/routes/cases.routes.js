const express = require('express')

const auth = require('../middleware/auth')
const requireRole = require('../middleware/requireRole')

const casesController = require('../controllers/cases.controller')
const coveragesController = require('../controllers/coverages.controller')
const policiesController = require('../controllers/policies.controller')

const router = express.Router()

router.get('/', auth, casesController.getCases)
router.get('/:id', auth, casesController.getCaseById)
router.post('/', auth, casesController.createCase)
router.put('/:id', auth, casesController.updateCase)
router.delete('/:id', auth, requireRole('ADMIN'), casesController.deleteCase)

router.post('/:id/coverages', auth, coveragesController.createCoverageRequest)
router.put('/:id/coverages/:coverageId', auth, coveragesController.updateCoverageRequest)
router.delete('/:id/coverages/:coverageId', auth, coveragesController.deleteCoverageRequest)

router.post('/:id/policy', auth, policiesController.createPolicy)
router.put('/:id/policy', auth, policiesController.updatePolicy)

module.exports = router


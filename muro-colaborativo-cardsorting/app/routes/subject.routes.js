//activity routes
const express = require('express')
const subjectController = require('../controllers/subject.controller')

const router = express.Router()

router.get('/', subjectController.list)
router.get('/:id', subjectController.get)

router.post('/', subjectController.create)

module.exports = router

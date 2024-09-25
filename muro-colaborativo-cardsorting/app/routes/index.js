// app = module.parent.exports.app;
const express = require('express')

const utilitiesController = require('../controllers/utilities.controller')

const router = express.Router()

router.use('/', require('./html.routes'))
router.use('/api/activities/', require('./activity.routes'))
router.use('/api/shared-objects/', require('./shared-object.routes'))
router.use('/api/users/', require('./user.routes'))
router.use('/api/subjects/', require('./subject.routes'))
router.use('/api/foro/', require('./forum.routes'))

router.post('/api/photo', utilitiesController.savePhoto)

router.use(utilitiesController.handleNotFound)

router.use(utilitiesController.handleDefaultError)

module.exports = router

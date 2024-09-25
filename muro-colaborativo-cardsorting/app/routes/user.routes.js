const express = require('express')
const userController = require('../controllers/user.controller')

const router = express.Router()

router.post('/', userController.create)
router.post('/login/', userController.login)
router.post('/recover/', userController.requestPasswordReset)
router.post('/reset/', userController.resetPassword)

module.exports = router

//activity routes
const express = require('express')
const sharedObjectController = require(
  '../controllers/shared-object.controller'
)

const router = express.Router()

router.get('/',sharedObjectController.listSharedObjects)

router.post('/', sharedObjectController.create)

router.put('/:id/', sharedObjectController.updateSharedObject)

router.delete('/:id/', sharedObjectController.delete)

module.exports = router

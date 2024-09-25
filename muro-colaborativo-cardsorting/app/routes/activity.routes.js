//activity routes
const express = require('express')
const activityController = require('../controllers/activity.controller')
const {
  validatePinParam,
  validateActivityParams,
} = require('../middlewares/activity.middleware')

const router = express.Router()

router.get('/', activityController.listActivities)
router.get('/:id/', activityController.getActivity)

router.post(
  '/',
  validateActivityParams,
  activityController.create
)

router.patch('/:activity_id/', activityController.updateActivity)

router.delete('/:id/', activityController.vp_deleteActivity)
router.delete('/:id/', activityController.deleteActivity)

module.exports = router

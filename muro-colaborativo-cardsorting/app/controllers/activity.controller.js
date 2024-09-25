/* eslint-disable camelcase */
const activitySvc = require('../services/activity.service')
const subjectService = require('../services/subject.service')
const validations = require('../util/validations')
const validator = require('validator')

module.exports = {
  validatePinParam: (req, res, next) => {
    if (!validations.validatePin(req.params.pin)) {
      res.status(409).json({
        msg: 'PIN invalido',
        msg_dev: 'El pin debe ser un número',
      })
    }
    next()
  },

  listActivities(req, res) {
    activitySvc
      .findActivities(req.query)
      .then((result) => {
        res.json({
          data: result,
        })
      })
      .catch((err) => {
        console.log(err)
        res.status(409).json({
          msg: 'Ocurrió un error al momento de buscar la actividad',
          msg_dev: err,
        })
      })
  },

  getActivity: function (req, res) {
    activitySvc
      .findActivity(req.params.id)
      .then((result) => {
        res.json({
          data: result,
        })
      })
      .catch((err) => {
        console.log(err)
        res.status(409).json({
          msg: 'Ocurrió un error al momento de buscar la actividad',
          msg_dev: err,
        })
      })
  },

  create: (req, res) => {
    //check if user click select or type
    let subjectName = null
    if (req.body.subject === '') {
      subjectName = req.body.subjectSelect
    } else {
      subjectName = req.body.subject
    }
    // We send if activity name es empty
    let hasName = true
    if (subjectName === 'ninguna') hasName = false
    // call a service to create an activity
    activitySvc
      .create(
        req.body.owner_id,
        req.body.background_image,
        req.body.name,
        req.body.pin,
        subjectName,
        hasName
      )
      .then((newActivity) => {
        res.json({
          msg: 'Actividad creada exitosamente',
          data: newActivity,
        })
      })
      .catch((err) => {
        res.status(409).json({
          msg: 'Ocurrió un error al momento de crear la actividad',
          msg_dev: err,
        })
      })
  },

  updateActivity: async (req, res) => {
    if (req.body.subject) {
      try {
        const subject = await subjectService.findSubjectByName(req.body.subject)
        req.body.subject_id = subject.id
      } catch(err) {
        const subject = await subjectService.create(req.body.subject)
        req.body.subject_id = subject.id
      }
      delete req.body.subject
      delete req.body.subjectName
    }

    activitySvc
      .updateActivity(req.params.activity_id, req.body)
      .then((newActivity) => {
        res.json({
          msg: 'Actividad creada exitosamente',
          data: newActivity,
        })
      })
      .catch((err) => {
        console.log(err)
        res.status(409).json({
          msg: 'Ocurrió un error al momento de crear la actividad',
          msg_dev: err,
        })
      })
  },

  resetUserData: (req, res) => {
    activitySvc
      .resetUserData(req.params.activity_id)
      .then((resetUserData_r) => {
        res.json({
          msg: 'Nombre actualizado exitosamente',
          data: resetUserData_r,
        })
      })
      .catch((err) => {
        console.log(err)
        res.status(409).json({
          msg: 'Ocurrió un error al momento de crear la actividad',
          msg_dev: err,
        })
      })
  },

  vp_deleteActivity: (req, res, next) => {
    next()
  },

  deleteActivity: (req, res) => {
    // call a service to create an activity
    activitySvc
      .updateIsDeleted(req.params.id, true)
      .then(() => {
        res.json({
          msg: 'Actividad eliminada exitosamente',
        })
      })
      .catch((err) => {
        console.log(err)
        res.status(409).json({
          msg: 'Ocurrió un error al momento de crear la actividad',
          msg_dev: err,
        })
      })
  },
}

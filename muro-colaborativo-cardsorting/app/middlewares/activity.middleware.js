/* eslint-disable camelcase */
const validator = require('validator')

const validations = require('../util/validations')

module.exports = {
  validatePinParam: (req, res, next) => {
    if (validations.validatePin(req.params.pin)) {
      next()
    } else {
      res.status(409).json({
        msg: 'PIN invalido',
        msg_dev: 'El pin debe ser un número',
      })
    }
  },

  validateActivityParams: (req, res, next) => {
    // TODO is using the client's IP as name adequate? Or should it be the PIN?
    // Runtime test - UI quality. Issue #1
    //valdating params
    if (req.body.owner) req.body.owner_id = req.body.owner
    req.body.name = req.body.titulo
      ? req.body.titulo
      : req.connection.remoteAddress
    if (req.body.owner) {
      req.body.background_image = req.body.image_id_server
    }
    if (req.body.name.length > 100) {
      req.body.name = req.body.name.substring(0, 97) + '...'
    }
    if (req.body.owner_id && !validator.isUUID(req.body.owner_id)) {
      res.status(409).json({
        msg: 'Ocurrió un error al momento de crear la actividad',
        msg_dev: 'El valor owner_id debe ser un UUID ',
      })
    } else if (validations.validatePin(req.body.pin)) {
      next()
    } else 
      res.status(409).json({
        msg: 'PIN no válido.',
        msg_dev: 'El PIN debe ser un número entero',
      })
  },
}

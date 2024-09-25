/* eslint-disable camelcase */
const subjectService = require('../services/subject.service')

module.exports = {
  list: function (req, res) {
    subjectService
      .list()
      .then((result) => {
        res.json({
          data: result,
        })
      })
      .catch((err) => {
        console.log(err)
        res.status(409).json({
          msg: 'Ocurrió un error al momento de buscar la materia',
          msg_dev: err,
        })
      })
  },

  get: function (req, res) {
    subjectService
      .find(req.params.id)
      .then((result) => {
        res.json({
          data: result,
        })
      })
      .catch((err) => {
        console.log(err)
        res.status(409).json({
          msg: 'Ocurrió un error al momento de buscar la materia',
          msg_dev: err,
        })
      })
  },

  create: (req, res) => {
    subjectService
      .create(req.body.name)
      .then((newSubject) => {
        res.json({
          msg: 'Materia creada exitosamente',
          data: newSubject,
        })
      })
      .catch((err) => {
        console.log(err)
        res.status(409).json({
          msg: 'Ocurrió un error al momento de crear la materia',
          msg_dev: err,
        })
      })
  },
}

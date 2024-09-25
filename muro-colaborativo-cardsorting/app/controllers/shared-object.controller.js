/* eslint-disable camelcase */
const sharedObjectService = require('../services/shared-object.service')

module.exports = {
  listSharedObjects: (req, res) => {
    // call a services to create an activity
    sharedObjectService
      .findSharedObjects(req.query)
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
    if (req.body.kindOfObjectReceived === 'text') {
      req.body.imageName = null
    }
    sharedObjectService
      .create(
        req.body.room,
        req.body.percentageX,
        req.body.percentageY,
        req.body.kindOfObjectReceived,
        req.body.cursor,
        req.body.text,
        req.body.activity_id,
        req.body.owners,
        req.body.imageName
      )
      .then((newSharedObject) => {
        res.json({
          msg: 'Objeto creado exitosamente',
          data: newSharedObject,
        })
      })
      .catch((err) => {
        console.log(err)
        res.status(409).json({
          msg: 'Ocurrió un error al momento de guardar el objeto compartido',
          msg_dev: err,
        })
      })
  },

  updateSharedObject: (req, res) => {
    // res.json({msg:"buscando actividad"})
    // call a services to create an activity
    sharedObjectService
      .updateSharedObject(req.params.id, req.body)
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

  delete: (req, res) => {
    //call a services to delete an activity
    // FIXME associated file wont be deleted!!
    sharedObjectService
      .delete(req.params.id)
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
}

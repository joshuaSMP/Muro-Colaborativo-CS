/* eslint-disable camelcase */
const userService = require('../services/user.service')
const nodemailer = require('nodemailer')

module.exports = {
  create: (req, res) => {
    // call a service to create an activity
    userService
      .create(req.body.email, req.body.name, req.body.pw)
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

  login: (req, res) => {
    // call a service to create an activity
    userService
      .login(req.body.email, req.body.pw)
      .then((user_data) => {
        res.json({
          msg: 'access granted',
          data: user_data,
        })
      })
      .catch((err) => {
        res.status(409).json({
          msg_dev: err,
        })
      })
  },

  // eslint-disable-next-line max-lines-per-function
  requestPasswordReset: (req, res) => {
    userService
      .requestPasswordReset(req.body.email)
      // eslint-disable-next-line max-lines-per-function
      .then((result) => {
        let transporter = nodemailer.createTransport({
          host: process.env.MAILER_HOST,
          port: process.env.MAILER_PORT,
          secure: process.env.MAILER_TLS,
          auth: {
            user: process.env.MAILER_USER,
            pass: process.env.MAILER_PASSWORD,
          },
        })
        const resetLink = 
          `http://${req.headers.host}/auth/recover/${result.request_id}/`
        transporter.sendMail({
          from: '"Muro Colaborativo" <' + process.env.MAILER_USER + '>',
          to: req.body.email,
          subject: 'Muro Colaborativo - Recuperación de cuenta',
          text:
            'Hola,\n\n' +
            'Recibimos una petición para reestablecer su contraseña de acceso '+
            'docente al Muro Colaborativo. Para continuar con la recuperación '+
            'de la cuenta, por favor copie y pegue el siguiente enlace en la '+
            'barra de navegación de su navegador: '+
            resetLink +
            '\n\n' +
            'Este enlace solo será válido por 1 hora desde que se registró su '+
            'solicitud para reestableer su contraseña.\n'+
            'Si no ha solicitado reestablecer su contraseña, puede ignorar '+
            'este mensaje.\n\n',
          html:
            '<p>Hola,</p>' +
            '<p>Recibimos una petici&oacute;n para resstablecer su '+
            'contrase&ntilde;a de acceso docente al <i>Muro Colaborativo</i>.'+
            '<br/>Para continuar con la recuperaci&oacute;n de la cuenta, por '+
            'favor haga click aqu&iacute;: <a href="'+
            resetLink +
            '" >' +
            resetLink +
            '</a>.</p>' +
            '<p><i>Este enlace solo ser&aacute; v&aacute;lido por 1 hora '+
            'desde que se registr&oacute; su solicitud para reestablecer su '+
            'contrase&ntilde;a</i>.</p>'+
            '<p>Si no ha solicitado reestablecer su contrase&ntilde;a, puede '+
            'ignorar este mensaje</p>',
        })
        res.json({
          msg: 'user found, email sent',
          data: result.request_id,
        })
      })
      .catch((err) => {
        console.log(err)
        res.status(404).json({
          msg_dev: err,
        })
      })
  },

  resetPassword: (req, res) => {
    userService
      .resetPassword(req.body.request_id, req.body.password)
      .then(() => {
        res.json({
          msg: 'password changed',
        })
      })
      .catch((err) => {
        console.log(err)
        res.status(409).json({
          msg_dev: err,
        })
      })
  },
}

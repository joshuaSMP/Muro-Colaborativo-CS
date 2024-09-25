/* eslint-disable camelcase */

//html routes
const express = require('express')
const router = express.Router()

/* GET home page. */
router.get('/', function (req, res) {
  res.render('home.ejs', {})
})

/* GET login docente. */
router.get('/auth/admin/', function (req, res) {
  res.render('login_admin.ejs', {})
})

router.get('/activity/', function (req, res) {
  res.render('pin.ejs', {})
})

router.get('/activity/public/', function (req, res) {
  const pin = req.query.pin;
  const idProfesor = req.query.idProfesor;

  res.render('publicZone.ejs', { pin: pin, idProfesor: idProfesor });
});

router.get('/auth/user/', function (req, res) {
  res.render('login_privateZone.ejs', {})
})

router.get('/foro/remote/', function (req, res) {
  res.render('alumnoPresencialRemotoForo.ejs', {})
})

router.get('/foro/classroom/', function (req, res) {
  res.render('alumnoPresencialRemotoForo.ejs', {})
})

router.get('/admin/', function (req, res) {
  res.render('controlSession.ejs', {})
})

router.get('/auth/recover/:request_id/', function (req, res) {
  res.render('reset_password.ejs', { request_id: req.params.request_id })
})

module.exports = router

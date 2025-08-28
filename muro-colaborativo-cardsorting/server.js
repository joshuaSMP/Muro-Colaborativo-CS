const app = require('./app/app')
const http = require('http').Server(app)
const io = require('socket.io')(http)
app.set('socketio', io)
require('./app/sockets')(io) // initialize socket config

let port

port = process.env.DEV_PORT

http.listen(port, function () {
  console.log('Starting Muro Colaborativo Server')
  console.log('listening on: ' + port)
})
const activitySvc = require('../services/activity.service')
const constants = require('../util/constants')

//TODO migrate all messages to app/v4/util/constants.js issue #74

// eslint-disable-next-line max-lines-per-function
module.exports = function (io) {
  const nsp = io.of('/mcv4')
  // eslint-disable-next-line max-lines-per-function, max-statements
  nsp.on('connection', function (socket) {
    socket.on('join_room', function (room) {
      socket.join(room)
    })
    // TODO remove issue #25
    socket.on('prueba', function () {
      console.log('executing socket test')
    })

    socket.on('join_activity', function (data) {
      // It is the responsibility of the programmer to previously check
      // the availability of seats Assign a seat to pvzUser in the activity
      socket.join(data.pin);
      activitySvc
          .assignSeat(data.userName, data.pin)
          .then(function (assignedCursor) {
              const socketResponse = {
                  status: 200,
                  data: assignedCursor.cursor,
                  userId: assignedCursor.userId,
              };
              // Emitir respuesta al usuario
              socket.emit('join_room_ack', socketResponse);
          })
          .catch((err) => {
              console.log(err);
              const socketResponse = {
                  status: 409,
                  err: err,
                  data: data,
              };
              // Emitir respuesta al usuario en caso de error
              socket.emit('join_room_ack', socketResponse);
          });
  });
  

    socket.on('move_cursor', function (data) {
      socket.broadcast.to(data.room).emit('move_cursor', data)
    })

    socket.on('drag_new_object', function (data) {
      socket.broadcast.to(data.room).emit('drag_new_object', data)
    })

    socket.on('display_new_object', function (data) {
      //save in action table
      socket.broadcast.to(data.room).emit('display_new_object', data)
    })

    socket.on('move_object', function (data) {
      //save in action table
      socket.broadcast.to(data.room).emit('move_object', data)
    })

    socket.on('delete_object', function (data) {
      // save in action table
      socket.broadcast.to(data.room).emit('delete_object', data)
    })

    socket.on('delete_object_denied', function (data) {
      // FIXME excuse me, was this ever fixed? issue #19
      // is not working in the front-end
      socket.broadcast.to(data.room).emit('delete_object_denied', data)
    })

    socket.on('edit_object', function (data) {
      // save in action table
      socket.broadcast.to(data.room).emit('edit_object', data)
    })

    socket.on('edit_object_res', function (data) {
      socket.broadcast.to(data.room).emit('edit_object_res', data)
    })

    socket.on('moveObjectFromPublicZone', function (data) {
      socket.broadcast.to(data.room).emit('moveObjectFromPublicZone', data)
    })

    socket.on('log_out_user', function (data) {
      activitySvc
        .logOutUser(data.userId, data.pin)
        .then(function () {
          const socketResponse = {
            status: 200,
            data: data,
          }
          // dar aviso a la zona pública de que un nuevo usuario se ha conectado
          socket.broadcast.to(data.pin).emit('log_out_user', data)
          socket.emit('log_out_user_ack', socketResponse)
        })
        .catch((err) => {
          console.log(err)
          const socketResponse = {
            status: 409,
            err: err,
            data: data,
          }
          socket.emit('log_out_user_ack', socketResponse)
          // contestar al usuario
        })
      // remove user from user_data in DB
      socket.broadcast.to(data.room).emit('log_out', data)
    })

    socket.on('log_out_all_users', function (data) {
      activitySvc
        .logOutAllUsers(data.pin)
        .then(function () {
          const socketResponse = {
            status: 200,
            data: data,
          }
          // dar aviso a la zona pública de que un nuevo usuario se ha conectado
          socket.broadcast.to(data.pin).emit('log_out_user_now', socketResponse)
          socket.emit('log_out_all_users_ack', socketResponse)
        })
        .catch((err) => {
          console.log(err)
          // TODO check if all error responses are all the same #issue #25
          const socketResponse = {
            status: 409,
            err: err,
            data: data,
          }
          socket.emit('log_out_all_users_ack', socketResponse)
          // contestar al usuario
        })
      // remove user from user_data in DB
      socket.broadcast.to(data.room).emit('log_out', data)
    })

    socket.on('stop_activity', function (data) {
      socket.broadcast.to(data.pin).emit('pause_activity', data)
    })

    socket.on('resume_activity', function (data) {
      socket.broadcast.to(data.pin).emit('enable_activity', data)
    })

    socket.on(constants.UserWS.CLOSE_ACTIVITY, function (data) {
      // It is the responsibility of the programmer to previously check
      // the availability of seats Assign a sear to pvzUser in the activity

      socket.broadcast.to(data.pin).emit(constants.UserWS.CLOSE_ACTIVITY)
    })
  })
}

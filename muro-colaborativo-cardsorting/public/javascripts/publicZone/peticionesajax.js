import * as jqueryfunctions from './publicJqueryFunctions'

function saveDataSession(sessionData) {
  if (itsAllowedToSave) {
    $.ajax({
      url: "/sessions",
      type: 'post',
      data: JSON.stringify({ "data": sessionData }),
      contentType: 'application/json',
      dataType: "json",
      success: function (response) {
      },
      error: function () {
        swal.fire("Ocurrio un error, inténtelo nuevamente");
      }
    });
  }
}

function getActivityData() {
  // TODO: cambiar a una promesa
  // issue #18
  var url_formed = `/api/activities/${PIN}/`
  $.ajax({
    type: 'GET',
    url: url_formed,
    dataType: 'json',
    success: function (res) {
      if(!res.data.is_active && !localStorage.getItem("adminId")){
        jqueryfunctions.exitPublicZone()
      }
      // save activity id
      localStorage.setItem("activity_id", res.data.id);
      jqueryfunctions.renderActivityData(res.data)
      // show if is paused
      jqueryfunctions.showIsPaused(res.data.is_paused)
      var users = []
      for(var i = 0; i < res.data.length; i++) {
        if(!res.data[i].cursor || !res.data[i].username) continue
        jqueryfunctions.addNewCursor({
          cursor : res.data[i].cursor,
          userId : res.data[i].u_id,
          username : res.data[i].username
        })
      }
      getSharedObjects();
    },
    error: function(err) {
      swal.fire({
        title: "Ocurrió un problema",
        text: err.responseJSON.msg_dev,
        icon: "error",
        showCancelButton: false,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "Ir al inicio",
        closeOnConfirm: false
      }).then(result => {
        if(result.value) {
          removeSessionData
        } else {

        }
      });
    }}); //end ajax
}

function getSessionDataAndRenderIt() {
  var dataToSend = {pin : PIN}
  $.ajax({
    type: 'GET',
    url: '/getCurrentSessionData',
    data: dataToSend,
    dataType: 'json',
    success: function (res) {
      if (res.status == 'ok') {
        sessionData = JSON.parse(res.data);
        renderData(sessionData);
      } else {
        sessionData = res.data;
        renderData(sessionData);
        $('#loadingModal').modal('hide');
      }
    }
  }); //end ajax
}

function getAllSessions() {
  $.ajax({
    type: 'GET',
    url: '/sessions',
    data: "",
    dataType: 'json',
    success: function (res) {
      if (res.status == 'ok') {
        for (var i = 0; i < res.data.length; i++) {
          var tempObject = JSON.parse(res.data[i])
          jqueryfunctions.addNewSessionInList(tempObject, false);
        };
      }
    }
  })
}

function loadSession(dirtyId) {
  var cleanId = dirtyId.replace("loadSessionBtn", "");
  sessionIdLoaded = cleanId;
  $.ajax({
    type: 'POST',
    url: '/loadSession',
    data: { 'sessionId': sessionIdLoaded },
    dataType: 'json',
    success: function (res) {
      if (res.status == 'ok') {
        socket.emit('refreshControlSession', {
        });
        window.location = "/activity/public/";
      }
    }
  })
}

function sendPostForm() {
  $("#owner").val(localStorage.getItem("adminId"));
  $("#email").val(localStorage.getItem("adminEmail"));
  $.ajax({
    type: 'POST',
    url: '/createSession',
    data: $('#form_data_session').serialize(),
    dataType: 'json',
    success: function (res) {
      if (res.status == 'ok') {
        dirtyId = "loadSessionBtn" + (res.data.id)
        loadSession(dirtyId)
      }
    }
  })
}

function changeName() {
  var activity_id = jqueryfunctions.getActivity_id()
  var name = $.trim($('#sessionNameInput').val())
  // save image
  $.ajax({
    type: 'PATCH',
    url: `/api/activities/${activity_id}/`,
    data: {name},
    dataType: 'json',
    success: function (res) {
     $('#nameSession').text($.trim($('#sessionNameInput').val()))
    }
  })
}

function changeImage() {
  var activity_id = jqueryfunctions.getActivity_id()
  var imageName = $('#image_id_serverEdit').val();
  // save image
  $.ajax({
    type: 'PATCH',
    url: `/api/activities/${activity_id}/`,
    data: {background_image: imageName},
    dataType: 'json',
    success: function (res) {
      $("#backgroundImage").attr("src", "/uploads/" + imageName);
    }
  })
}

function saveOnTheFlySession() {
  $('.optionalSave').hide();
  var d = new Date();
  var objectId = d.getTime();
  sessionData.email = localStorage.getItem("adminEmail");
  sessionData.id = objectId;
  sessionData.createdOnTheFly = true;
  $.ajax({
    type: 'POST',
    url: '/createSession',
    data: sessionData,
    dataType: 'json',
    success: function (res) {
      if (res.status == 'ok') {
        loadSessionClean(sessionData.id);
        socket.emit('refreshControlSession', {
        });
        swal.fire({
          title: "Guardado correctamente",
          text: ":)",
          icon: "success",
          timer: 1000,
          showConfirmButton: false
        });
      }
    }
  })
}

function loadSessionClean(cleanId) {
  // FIXME does nothing at all
  // issue #18
  $.ajax({
    type: 'POST',
    url: '/loadSession',
    data: { 'sessionId': cleanId },
    dataType: 'json',
    success: function (res) {
      if (res.status == 'ok') {
      }
    }
  })
}

function stopMovingObject(id) {
  var position = $('#' + id).position();
  var yPercentage = (position.top) / ($("body").height());
  var xPercentage = (position.left) / ($("body").width());
  sessionData.publicObjects[id].percentageX = xPercentage;
  sessionData.publicObjects[id].percentageY = yPercentage;
  $.ajax({
    url: `/api/shared-objects/${id}/`,
    type: 'PUT',
    contentType: 'application/json',
    dataType: "json",
    data: JSON.stringify({percentage_x: xPercentage, percentage_y: yPercentage}),
    error: function () {
      console.log("Can't update public object position")
    }
  })

}

function saveObjectAndIssueId(object){
  object.activity_id = localStorage.getItem("activity_id")
  $.ajax({
    url: "/api/shared-objects/",
    type: 'POST',
    data: JSON.stringify(object),
    contentType: 'application/json',
    dataType: "json",
    success: function(res) {
      jqueryfunctions.displayNewObject(object)
    },
    error: function () {
      swal.fire("Ocurrio un error, inténtelo nuevamente");
    }
  })
}

function getSharedObjects() {
  var activity_id = jqueryfunctions.getActivity_id()
  var url_formed = '/api/shared-objects/?activity_id=' +activity_id
  $.ajax({
    type: 'GET',
    url: url_formed,
    dataType: 'json',
    success: function (res) {
      jqueryfunctions.displayObjectsFromData(res.data)
    }
  }); //end ajax
}

function deleteSharedObject(object, origin){
  var activity_id = jqueryfunctions.getActivity_id()
  var url_formed = `/api/shared-objects/${object.id}/`
  $.ajax({
    type: 'DELETE',
    url: url_formed,
    dataType: 'json',
    success: function (res) {
      if(origin === "delete"){
          object.action_type = "delete"
      } else {
          object.action_type = "edit"
      }
    }
  }); //end ajax
}

function toggleStatus() {
  $.ajax({
    type: 'POST',
    url: "/api/activities/pause/" + localStorage.getItem("activity_id"),
    dataType: 'json',
    success: function (res) {
      // save activity id
      if(res.data.is_paused) {
        $("#statusAppMessage").text("Pausada");
        $("#statusAppMessage").css("color", "#ff8787")
        $("#statusAppMessageMenu").text("Continuar");
        var dataSocket = {
          pin : localStorage.getItem("pin")
        }
        socket.emit('stop_activity', dataSocket);
      } else {
        $("#statusAppMessage").text("Activa");
        $("#statusAppMessage").css("color", "#87dbff")
        $("#statusAppMessageMenu").text("Pausar");
        var dataSocket = {
          pin : localStorage.getItem("pin")
        }
        socket.emit('resume_activity', dataSocket);
      }
    }
  });
}


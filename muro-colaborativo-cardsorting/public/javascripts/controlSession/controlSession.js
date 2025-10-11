var sessionData = {};
var socket = io.connect('/mcv4');
var usersData = {};
var itWasAnActionDoneInPublicZone = false;
var isTheFirstTimeUserInfoIsChecked = true;
var publicZoneUrl = "http://" + window.location.hostname + ":3000/activity/public/"
/*
 * FIXME muy posiblemente en lugar de esta variable sea más conveniente una
 * estrategia como la que se usó con el issue #55 (delegar el cambio de estado
 * a la BD y que informe el estado de la actividad para no maniobrar con las n
 * sesiones que puede tener un usuario) issue #31
 */
var isTheSessionActive = true;
var usersDataInClientSide;

var socket = io.connect('/mcv4');

socket.on('connect', function() {
  // Aqui va codigo cuando se connecta
  // al unirse a un cuarto o
   // Crear y unirse a un cuarto especifico
});

if (localStorage.getItem("currentOptionShown") == null) {
  var currentOptionShown = "sessionsMode";
} else if (localStorage.getItem("currentOptionShown") == "sessionsMode") {
  var currentOptionShown = "sessionsMode";
} else {
  var currentOptionShown = "usersMode";
}

$("#adminNameDiv").text(localStorage.getItem("adminName"));

var nameUser = localStorage.getItem("adminName");
var nameFistLetter = nameUser.charAt(0).toUpperCase();
var lastNameFistLetter = nameUser.substring(nameUser.indexOf(' ') + 1).charAt(0).toUpperCase();
$("#adminNameDiv2").text(nameFistLetter + lastNameFistLetter).css("font-size", "2vw");

$(document).ready(function () {
  sessionIdLoaded = localStorage.getItem("activity_id")
  if (currentOptionShown == "sessionsMode") {
    $("#adminSessionsWorkspace").show();
    $("#adminSessionsBtn").css("background-color", "#2980b9");
  } else {
    $("#usersWorkspace").show();
    $("#usersBtn").css("background-color", "#2980b9");
  }
  $("#currentSessionBtn").click(function () {
    $(".workspace").hide();
    $("#currentSessionWorkspace").show();
  });
  $("#usersBtn").click(function () {
    localStorage.setItem("currentOptionShown", "usersMode")
    $(".workspace").hide();
    $("#usersWorkspace").show();
    $("#adminSessionsBtn").css("background-color", "white");
    $("#usersBtn").css("background-color", "#2980b9");
  })

  $("#adminSessionsBtn").click(function () {
    localStorage.setItem("currentOptionShown", "sessionsMode")
    $(".workspace").hide();
    $("#adminSessionsWorkspace").show();
    $("#adminSessionsBtn").css("background-color", "#2980b9");
    $("#usersBtn").css("background-color", "white");
  })

  $("#adminNameDiv, #adminNameDiv2").click(
    function () {
      onAdminExit();
    })

  $("#exitBtn").click(
    function () {
      onAdminExit();
    })

  $("#resumeStopSessionBtn").click(function () {
    $.ajax({
      type: 'POST',
      url: '/api/activities/pause/' +sessionIdLoaded,
      dataType: 'json',
      success: function (res) {
        if(res.data.is_paused) {
          stopSession()
           // TODO cambiar el estado del botón de activar issue #63
        } else {
          resumeSession()
           // TODO cambiar el estado del botón de activar issue #63
        }
      }
    })
  })

  $("#expandMiniPublicZoneBtn").click(function () {
    openNav()
  })

  $("#container_image").click(function () {
    openNav()
  })

  $('#searchSession').on('input', function () {
    for (var key in dataSessionsJson) {
      if (dataSessionsJson.hasOwnProperty(key)) {
        if (dataSessionsJson[key].name.includes($('#searchSession').val())) {
          $("#" + dataSessionsJson[key].id + "listElement").show();
        } else {
          $("#" + dataSessionsJson[key].id + "listElement").hide();
        }
      }
    }
  });
  $("#sessions_list_CS_Wrapper").height("100%");
  $("#users_list_Wrapper").height("100%");
  onSocketMessage();
  // TODO Checar si la actividad esta activa, cual actividad?
  // Una predeterminada y permanente? Issue #40
  // TODO obtener los datos de los usuarios activity Issue #40
  $("#miniPublicZone").attr('src', publicZoneUrl);
  socket.emit('getUsersActivityData', {});
})// Aqui termina onready Document

function renderData(data) {
  if (data.id != "temp") {
    $('.optionalSave').hide();
  }
  if (data.name == "") {
    $('#nameSession').text("(Haz click aquí para introducir un título)")
  } else {
    $('#nameSession').text(data.name)
  }
  $('#backgroundImage').css("background-image", "url(/uploads/" + data.imageName + ")");
}

function onAdminExit() {
  swal.fire({
    title: "<h5 style='color: black; font-size:16px; font-family: AvantGardeFont; font-family: AvantGardeFont; font-weight: bold;'>" + "¿Estás seguro que deseas salir?" + "</h5>",
    icon: "warning",
    iconColor: '#E68115',
    width: "28em",
    showCancelButton: true,
    confirmButtonColor: "#DD6B55",
    cancelButtonColor: "rgb(51, 102, 153)",
    confirmButtonText: "Cerrar sesión",
    cancelButtonText: "Cancelar",
    closeOnConfirm: false,
  }).then(result => {
    if(result.value) {
      socket.emit('adminLogOut', {
        'accountId': localStorage.getItem("adminId"),
        "email": localStorage.getItem("adminEmail")
      });

      localStorage.removeItem("logged");
      localStorage.removeItem("adminName")
      localStorage.removeItem("adminId")
      localStorage.removeItem("adminEmail")
      localStorage.removeItem("currentOptionShown")
      localStorage.removeItem("subjects");

      window.location = "/auth/admin/"

    }
  });
}

function stopSession() {
  $("#statusAppMessage").text("Pausada");
  $("#statusAppMessage").css("color", "#ff8787")
  var dataSocket = {
    pin : localStorage.getItem("pin")
  }
  socket.emit('stop_activity', dataSocket);
  isTheSessionActive = false;
  $("#resumeStopSessionBtn").attr("src", "/images/play_white_btn.png");
}

function resumeSession() {
  $("#statusAppMessage").text("Activa");
  $("#statusAppMessage").css("color", "#87dbff")
  var dataSocket = {
    pin : localStorage.getItem("pin")
  }
  socket.emit('resume_activity', dataSocket);
  isTheSessionActive = true;
  $("#resumeStopSessionBtn").attr("src", "/images/pause_white_btn.png");
}

function onSocketMessage() {
  socket.on('getUsersActivityData', function (data) {
    usersDataInClientSide = data;
    setTimeout(function () {
      updateUsersTable(data);
    }, 500)
  })
  socket.on('message', function (data) {
    if (typeof data.message == 'undefined') {
      switch (data.typeMessage) {
        case 'newUser':
          saveUserInJson(data);
          addUserInTable(data);
          socket.emit('getUsersActivityData', {});
          break;
        case 'refreshControlSession':
          window.location = "/admin/"
          break;
        case 'usersDataUpdated':
          updateUsersTable(data.usersData);
          break;
        default:
          break;
      }
    }
  });
}

function openNav() {
  document.getElementById("myNav").style.height = "100%";
  setTimeout(function () {
    $("#miniPublicZone").appendTo("#iframeExpadedWrapper");
    $("#miniPublicZone").removeClass("miniScreenIframe");
    $("#miniPublicZone").addClass("fullScreenIframe");
  }, 500)
}

function closeNav() {
  document.getElementById("myNav").style.height = "0%";
  $("#miniPublicZone").appendTo("#miniPublicZoneWrapper");
  $("#miniPublicZone").removeClass("fullScreenIframe");
  $("#miniPublicZone").addClass("miniScreenIframe");
}

function saveUserInJson(data) {
  usersData[data.userId] = data;
}

function addUsersInList(data) {
  var cursor = data.cursor.replace("cursor", "ropen");
  var element = '<li onclick="showUserInfo(this.id)" id="' + data.userId +
   'listElement"" class="list-group-item userInList" style="width:100%" >' +
    '<div class="row">' +
    '<div class="col-xs-3" >' +
    '<img  id="userCursor' + data.userId + 'CS" src="/cursors/' + cursor +
    '.png"  style="width:100%;height:100%;"  >' +
    '</div>' +
    '<div class="col-xs-6" >' +
    '<h3><span id="nameSession' + data.userId + 'CS">' + data.userName + '</span></h3>' +
    '</div>' +
    '<div class="col-xs-3" >' +
    '</div>' +
    '</div>' +
    '</li>'

  $('#users_list').prepend(element);
}

function showUserInfo(userId) {
  $(".userInList").removeClass("selectedUSerInList")
  $("#" + userId).addClass("selectedUSerInList");
  userId = userId.replace("listElement", "");
  var userData = {};
  userData.publicObjects = [];
  userData.userId = userId;
  if (isTheFirstTimeUserInfoIsChecked) {
    $.ajax({
      type: 'GET',
      url: '/getCurrentSessionData',
      data: "",
      dataType: 'json',
      success: function (res) {
        sessionData = res.data;

        isTheFirstTimeUserInfoIsChecked = false;

        for (var key in sessionData.publicObjects) {
          if (sessionData.publicObjects.hasOwnProperty(key)) {

            if (sessionData.publicObjects[key].userId == userId) {
              userData.publicObjects.push(sessionData.publicObjects[key]);
              showInfoUser(userData);


            }
          }
        }
      }
    }); //Aqui termina una peticion Ajax

  } else if (itWasAnActionDoneInPublicZone) {
    $.ajax({
      type: 'GET',
      url: '/getCurrentSessionData',
      data: "",
      dataType: 'json',
      success: function (res) {
        sessionData = res.data;
        itWasAnActionDoneInPublicZone = false;
        for (var key in sessionData.publicObjects) {
          if (sessionData.publicObjects.hasOwnProperty(key)) {
            if (sessionData.publicObjects[key].userId == userId) {
              userData.publicObjects.push(sessionData.publicObjects[key]);
              showInfoUser(userData);
            }
          }
        }
      }
    }); //Aqui termina una peticion Ajax

  } else {
    for (var key in sessionData.publicObjects) {
      if (sessionData.publicObjects.hasOwnProperty(key)) {
        if (sessionData.publicObjects[key].userId == userId) {
          userData.publicObjects.push(sessionData.publicObjects[key]);
          showInfoUser(userData);
        }
      }
    }
  }
}

function showInfoUser(data) {
  $("#infoUserSelectedDiv").empty();
  for (var i = 0; i < data.publicObjects.length; i++) {
    var infoText = '<h1>Elementos compartidos:</h1>' +
      '<h2>' + data.publicObjects[i].text + '</h2>'
    $("#infoUserSelectedDiv").append(infoText);
  }
}

function addUserInTable(data) {
  var cursor = data.cursor.replace("cursor", "")
  var data = '<tr id=row' + data.userId +
    '  style="background-color:#f2f2f2">' +
    '<td>' +
    '<div>' +
    '<img src="/cursors/ropen' + cursor + '.png" style="width:90px;height:90px;">' +
    '<div style="width:100%;text-align:center;  word-wrap: break-word;">' +
    ' <h5>' + data.userName + '</h5>' +
    '</div>' +
    '</div>' +
    ' </td>' +
    '<td>' +
    ' <div>' +
    ' <p>Veces: <span id="objShared' + data.userId + '">--</span></p>' +
    ' <p>Última vez:  <span id="objSharedLastTime' + data.userId + '"> -- </span></p>' +
    '</div>' +
    ' </td>' +
    '<td>' +
    ' <div>' +
    ' <p>Veces: <span id="objCreated' + data.userId + '">--</span></p>' +
    ' <p>Última vez:  <span id="objCreatedLastTime' + data.userId + '"> -- </span></p>' +
    '  </div>' +
    ' </td>' +
    ' <td>' +
    ' <div>' +
    ' <p>Veces: <span id="objEdited' + data.userId + '">--</span></p>' +
    ' <p>Última vez:  <span id="objEditedLastTime' + data.userId + '"> -- </span></p>' +
    ' </div>' +
    ' </td>' +
    ' <td>' +
    '  <div>' +
    ' <p>Veces: <span id="objMoved' + data.userId + '">--</span></p>' +
    ' <p>Última vez:  <span id="objMovedLastTime' + data.userId + '"> -- </span></p>' +
    ' </div>' +
    ' </td>' +
    '</tr>'
  $("#tableBody").prepend(data);
}

function updateUsersTable(data) {
  for (var key in data) {
    if (data.hasOwnProperty(key)) {
      //Si esta es la primera vez que alguien hace algo o la pagina se actualiza
      if (jQuery.isEmptyObject(usersDataInClientSide) || data == usersDataInClientSide) {
        if (data[key].activityData.objShared != 0) {
          $('#objShared' + data[key].userId).text(data[key].activityData.objShared)
        }

        if (data[key].activityData.objCreated != 0) {
          $('#objCreated' + data[key].userId).text(data[key].activityData.objCreated)
        }

        if (data[key].activityData.objEdited != 0) {
          $('#objEdited' + data[key].userId).text(data[key].activityData.objEdited)
        }

        if (data[key].activityData.objMoved != 0) {
          $('#objMoved' + data[key].userId).text(data[key].activityData.objMoved)
        }

      } else {
        if (data[key].activityData.objShared != usersDataInClientSide[key].activityData.objShared) {
          $('#objShared' + data[key].userId).text(data[key].activityData.objShared)
        }
      
        if (data[key].activityData.objCreated != usersDataInClientSide[key].activityData.objCreated) {
          $('#objCreated' + data[key].userId).text(data[key].activityData.objCreated)
        }
        
        if (data[key].activityData.objEdited != usersDataInClientSide[key].activityData.objEdited) {
          $('#objEdited' + data[key].userId).text(data[key].activityData.objEdited)
        }
        
        if (data[key].activityData.objMoved != usersDataInClientSide[key].activityData.objMoved) {
          $('#objMoved' + data[key].userId).text(data[key].activityData.objMoved)
        }
      }
    }
  }
  //Se actualiza usersDataInClientSide
  usersDataInClientSide = data;
  updateActivityTimes()
}

function millisToMinutesAndSeconds(millis) {
  var minutes = Math.floor(millis / 60000);
  var seconds = ((millis % 60000) / 1000).toFixed(0);
  return minutes
}

function updateActivityTimes() {
  var currentDate = new Date();
  for (var key in usersDataInClientSide) {
    if (usersDataInClientSide.hasOwnProperty(key)) {
      if (usersDataInClientSide[key].activityData.objSharedLastTime != 0) {
        var tempTimeObjSharedLastTime = millisToMinutesAndSeconds(currentDate - usersDataInClientSide[key].activityData.objSharedLastTime);
        var saveTimeObjSharedLastTime = tempTimeObjSharedLastTime;
        if (tempTimeObjSharedLastTime == 0) {
          tempTimeObjSharedLastTime = "Hace menos de un minuto"
        } else if (tempTimeObjSharedLastTime == 1) {
          tempTimeObjSharedLastTime = "Hace " + tempTimeObjSharedLastTime + " minuto"
        } else {
          tempTimeObjSharedLastTime = "Hace " + tempTimeObjSharedLastTime + " minutos"
        }
        $('#objSharedLastTime' + usersDataInClientSide[key].userId).text(tempTimeObjSharedLastTime);
      } else {
        var saveTimeObjSharedLastTime = 0;
      }
      if (usersDataInClientSide[key].activityData.objCreatedLastTime != 0) {
        var tempTimeObjCreatedLastTime = millisToMinutesAndSeconds(currentDate - usersDataInClientSide[key].activityData.objCreatedLastTime)
        var saveTimeObjCreatedLastTime = tempTimeObjCreatedLastTime;
        if (tempTimeObjCreatedLastTime == 0) {
          tempTimeObjCreatedLastTime = "Hace menos de un minuto"
        } else if (tempTimeObjCreatedLastTime == 1) {
          tempTimeObjCreatedLastTime = "Hace " + tempTimeObjCreatedLastTime + " minuto"
        } else {
          tempTimeObjCreatedLastTime = "Hace " + tempTimeObjCreatedLastTime + " minutos"
        }
        $('#objCreatedLastTime' + usersDataInClientSide[key].userId).text(tempTimeObjCreatedLastTime);
      } else {
        var saveTimeObjCreatedLastTime = 0;
      }
      if (usersDataInClientSide[key].activityData.objEditedLastTime != 0) {
        var tempTimeObjEditedLastTime = millisToMinutesAndSeconds(currentDate - usersDataInClientSide[key].activityData.objEditedLastTime)
        var saveTimeObjEditedLastTime = tempTimeObjEditedLastTime;
        if (tempTimeObjEditedLastTime == 0) {
          tempTimeObjEditedLastTime = "Hace menos de un minuto"
        } else if (tempTimeObjEditedLastTime == 1) {
          tempTimeObjEditedLastTime = "Hace " + tempTimeObjEditedLastTime + " minuto"
        } else {
          tempTimeObjEditedLastTime = "Hace " + tempTimeObjEditedLastTime + " minutos"
        }
        $('#objEditedLastTime' + usersDataInClientSide[key].userId).text(tempTimeObjEditedLastTime);
      } else {
        var saveTimeObjEditedLastTime = 0;
      }
      if (usersDataInClientSide[key].activityData.objMovedLastTime != 0) {
        var tempTimeObjMovedLastTime = millisToMinutesAndSeconds(currentDate - usersDataInClientSide[key].activityData.objMovedLastTime)
        var saveTimeObjMovedLastTime = tempTimeObjMovedLastTime;
        if (tempTimeObjMovedLastTime == 0) {
          tempTimeObjMovedLastTime = "Hace menos de un minuto"
        } else if (tempTimeObjMovedLastTime == 1) {
          tempTimeObjMovedLastTime = "Hace " + tempTimeObjMovedLastTime + " minuto"
        } else {
          tempTimeObjMovedLastTime = "Hace " + tempTimeObjMovedLastTime + " minutos"
        }
        $('#objMovedLastTime' + usersDataInClientSide[key].userId).text(tempTimeObjMovedLastTime);
        // }
      } else {
        var saveTimeObjMovedLastTime = 0;
      }
      // Calculamos activityNumber
      var dividend = (usersDataInClientSide[key].activityData.objShared * 4) + (usersDataInClientSide[key].activityData.objCreated * 3) + (usersDataInClientSide[key].activityData.objEdited * 2) + (usersDataInClientSide[key].activityData.objMoved)
      var divisor = (saveTimeObjSharedLastTime) + (saveTimeObjCreatedLastTime * .5) + (saveTimeObjEditedLastTime * .25) + (saveTimeObjMovedLastTime * .125) + 1

      var activityNumber = dividend / divisor;
      if (dividend != 0) {
        if (activityNumber >= 4) {
          $("#row" + key).css("background-color", "#98ff84");
        } else if (activityNumber > 1) {
          $("#row" + key).css("background-color", "#f6ff83");
        } else {
          $("#row" + key).css("background-color", "#ff8383");
        }
      }
    }
  }

  setTimeout(function () {
    updateActivityTimes();
  }, 60100);
}
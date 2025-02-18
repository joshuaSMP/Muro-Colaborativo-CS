var uploaded = false;
var sessionIdLoaded = '';
var sessionPinLoaded;
var initialSessionId = '';
var dataSessionsJson = {};
var editMode = false;
var currentSessionIdOnEdit = '';

//  START code to set socket io connection
$(document).ready(function () {
  // Llama a la función para obtener y mostrar las sesiones del administrador
  getAdminSessions();

  // Configura los manejadores de eventos
  $("#addSessionModal").on('hide.bs.modal', function () {
    $(this).find('form')[0].reset();
  });

  $("#uploadImage").click(function () {
    $('#imageSelected').click();
    setTimeout(loadImageOnClient, 2000); // Utiliza la función directamente en el setTimeout
  });

  $('#submitDataSession').click(function () {
    if (editMode) {
      sendPostFormOnEdit();
    } else {
      sendPostForm(); // Llamada directa a la función para enviar el formulario en modo de inserción
    }
  });

  $('#imageSelected').change(function () {
    $('#submitDataSession').attr("disabled", true);
    $('#uploadForm').submit();
    loadImageOnClient();
  });

  $('#addSessionModal').on('hidden.bs.modal', function () {
    editMode = false;
  });

  $('#addSessionModal').on('shown.bs.modal', function (e) {
    var modal = $(this);
    var title = editMode ? 'Editar Pizarra' : 'Crear nueva pizarra'; // Simplifica la lógica
    modal.find('.modal-title').text(title);
  });

});




function loadImageOnClient() {
  if (localStorage.getItem("uploaded") == "true") {
    $('#submitDataSession').attr("disabled", false);
    var imageName = localStorage.getItem("serverFileName")
    // TODO move the style into a CSS class Issue #31
    $("#showImageUploaded").html("<img style='height:100%;width:100%;' src='/uploads/" + imageName + "' ></img>");
    $('#image_id_server').val(imageName);
    uploaded = false;
    localStorage.setItem("uploaded", "false");
    localStorage.removeItem("serverFileName");
  } else {
    setTimeout(function () {
      loadImageOnClient();
    }, 2000)
  }
}




function addNewSessionInList(foro) {
  var element = '<li id="' + foro.id_foro + 'listElement">' +
    '<div class="activitycontainer">' +
    '<h3>' + foro.tema_foro + '</h3>' +
    '<p>PIN: ' + foro.pin + '</p>' +
    '<p>' + (foro.esta_activa ? 'Activo' : 'No activo') + '</p>' +
    '<p>Fecha de creación: ' + foro.fecha_creacion + '</p>' +
    '<button onclick="openForo(\'' + foro.id_foro + '\')">Abrir foro</button>' +
    '</div>' +
    '</li>';

  $('#foros_list').prepend(element);
}


function sendPostForm() {
  var ownerId = localStorage.getItem("adminId");
  console.log("ownerId:", ownerId); // Agregar esta línea para verificar el valor de ownerId
  var tema_foro = $('#form_data_session').find('input[name="tema_foro"]').val(); // Corregido el selector
  var dataToSend = $('#form_data_session').serialize();

  $.ajax({
    method: 'POST',
    url: '/api/foro/crearforo',
    data: {
      id_profesor: ownerId,
      tema_foro: tema_foro,
      formData: dataToSend // Agregar los datos serializados directamente
    },
    dataType: 'json',
    success: function (res) {
      swal.fire("Pizarra creado exitosamente", "", "success")
        .then((result) => {
          if (result.isConfirmed || result.isDismissed) {
            // Esperar a que se cierre el diálogo de confirmación y luego recargar la página
            location.reload();
          }
        });
    },
    error: function (xhr, status, error) {
      console.error('Error en la solicitud AJAX:', error);
    }
  });
}


function sendPostFormOnEdit() {
  console.log("sendPostFormOnEdit");
  var tema_foro = $('#form_data_session').find('input[name="tema_foro"]').val(); 

  if (currentSessionIdOnEdit) {
    console.log("tema_foro:", tema_foro);
    var dataToSend = $('#form_data_session').serialize();

    var data = {
      id_foro: currentSessionIdOnEdit,
      tema_foro: tema_foro, 
      formData: dataToSend 
    };

    $.ajax({
      type: 'PUT',
      url: '/api/foro/' + currentSessionIdOnEdit,
      data: data, 
      dataType: 'json',
      success: function (res) {
        swal.fire("Tema del foro editado exitosamente", "", "success")
          .then((result) => {
            if (result.isConfirmed || result.isDismissed) {
              location.reload();
            }
          });
      },
      error: function (xhr, status, error) {
        console.error('Error en la solicitud AJAX:', error);
      }
    });
  } else {
    console.error("currentSessionIdOnEdit no está definido o está vacío");
  }
}

function getAdminSessions() {
  console.log("Calling getAdminSessions...");
  $.ajax({
    type: 'GET',
    url: '/api/foro/' + localStorage.getItem('adminId'),
    dataType: 'json',
    success: function (res) {
      console.log("getAdminSessions successful:", res);
      $('#sessions_list').empty(); // Limpia la lista antes de agregar nuevos elementos
      for (var i = 0; i < res.forums.length; i++) {
        var foro = res.forums[i];
        var fechaCreacion = new Date(foro.fecha_creacion);
        var fechaFormateada = fechaCreacion.toLocaleDateString("es-ES", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        var textoBoton = foro.esta_activa ? "Desactivar" : "Activar"; // Define el texto del botón según el estado de foro.esta_activa
        var element = '<li id="' + foro.id_foro + 'listElement">' +
          '<div class="activitycontainer">' +
          '<div style="text-align:center; padding:5px; font: 1.5vw;">' +
          '<h3>' + foro.tema_foro + '</h3> <br>' +
          '<div class="dropdown">' +
          '<button style="position: relative; width:1.5vw; height:2vh; left:14vw; top:34vh; background-color: #c4e1ff; border: none;" onclick=desplegarConClickDropdown(\'myDropdown2' + foro.id_foro + '\'' + ');>' +
          '<img src= "/images/puntos_blancos.svg">' +
          '</button>' +
          '<div class="dropdown-content" id="myDropdown2' + foro.id_foro + '" style="left: 10vw; top: 30vh;">' +
          '<style> .bottom-three { margin-bottom: 3cm; } </style>' +
          '<a id="' + foro.id_foro + 'loadSessionBtn" onclick="toggleSession(\'' + foro.id_foro + '\', ' + !foro.esta_activa + ')">' + textoBoton + '</a>' +
          '<a id="' + foro.id_foro + 'openSessionBtn" onclick="irAlMuralProfesor(\'' + foro.id_foro + '\',\'' + foro.tema_foro + '\',\'' + foro.pin + '\',\'' + foro.id_profesor + '\')">Ingresar al foro </a>' + 
          '<a id="' + foro.id_foro + 'editSessionBtn" onclick="fillDataInModalOnEditSession(\'' + foro.id_foro + '\');" data-toggle="modal" data-target="#addSessionModal">Editar</a>' +
          '<a id="' + foro.id_foro + 'deleteSessionBtn" onclick="deleteSession(\'' + foro.id_foro + '\')">Eliminar </a>' +
          '</div>' +
          '</div>' +
          '</div>' +
          '<div id="container_image" style="display:flex; justify-content:center;">' +
          '<img class="image-wrapper" id="imageSession' + foro.id_foro + '" src="/images/Aula.png" width= 20%;' +
          '</div>' +
          '<div id="activity-information" style="position: absolute; top: 45vh; right:9.9vw; font-size: 1vw;">' +
          '<center> <p style= "font-family: AvantGardeFont; margin-bottom: 0.09cm;">PIN: <span>' + foro.pin + '</span></p>' +
          '<p name = "activityState" style= "font-family: AvantGardeFont; margin-bottom: 0.09cm;">' + (foro.esta_activa ? 'Activo' : 'Desactivado') + '</p>' +
          '<p name ="subjectActivity" style= "font-family: AvantGardeFont; margin-bottom: 0.09cm;"> <span id="materia_' + foro.id_foro + '">' + '</span> </p>' +
          '<p class ="creationDateActivity" style= "font-family: AvantGardeFont; margin-bottom: 0.09cm;"> Creada: ' + fechaFormateada + '</p> </center>' +
          '</div>' +
          '</div>' +
          '</div>' +
          '</li>';
        $('#sessions_list').prepend(element);
      }
    },
    error: function (xhr, status, error) {
      console.error("Error in getAdminSessions:", error);
    }
  });
}
function irAlMuralProfesor(idForo,Temaforo, pin, idProfesor) {
  localStorage.setItem("idForo", idForo);
  localStorage.setItem("pin", pin);
  localStorage.setItem("idProfesor", idProfesor);
  localStorage.setItem("TemaForo", Temaforo);

  window.location = "/activity/public/";
}




function toggleSession(forumId, newStatus) {
  $.ajax({
    type: 'PUT',
    url: '/api/foro/' + forumId + '/status',
    contentType: 'application/json',
    data: JSON.stringify({ esta_activa: newStatus }),
    success: function (res) {
      console.log("Estado del foro actualizado:", res);
      // Actualiza el botón y el estado del foro en la UI
      $('#' + forumId + 'loadSessionBtn').text(newStatus ? "Desactivar" : "Activar");
      $('#' + forumId + 'loadSessionBtn').attr("onclick", "toggleSession('" + forumId + "', " + !newStatus + ")");
      $('#' + forumId + 'listElement').find('p[name="activityState"]').text(newStatus ? 'Activo' : 'Desactivado');
    },
    error: function (xhr, status, error) {
      console.error("Error al actualizar el estado del foro:", error);
    }
  });
}





function cleanAddSessionModal() {
  $('#titulo').val();
  $('#owner').val();
  $('#number_students').val(10);
  $('#image_id_server').val();
  $('#imageSelected').val();
  $('#showImageUploaded').html("");
  $('#subject').val();
}

// Función para desplegar el menú con clic en el botón
function desplegarConClickDropdown(idDropdown) {
  document.getElementById(idDropdown).classList.toggle("show");
}

function cerrarDropdown(idDropdown) {
  var dropdown = document.getElementById(idDropdown);
  if (dropdown) {
    dropdown.classList.remove("show"); // Remover la clase "show" para ocultar el menú
  }
}


function loadSession(dirtyId) {
  var cleanId = dirtyId.replace("loadSessionBtn", "");
  // TODO verificar esto, se aplica a todas? activas o no? en curso o no? Issue #63
  $("#" + cleanId + 'listElement').css("background-color", "#66ff66")
  var image = dataSessionsJson[cleanId].imageName
  if (image && (image.includes('.jpeg') || image.includes('.png') || image.includes('.jpg'))) {
    $("#publicZoneBackgroundImage").attr("src", "/uploads/" + image)
  } else {
    $("#publicZoneBackgroundImage").attr("src", "/images/cuadro_blanco.png");
  }
  //console.log('loadSession', dataSessionsJson[cleanId].imageName, 'pin', dataSessionsJson[cleanId].pin);
  $("#currentSessionName").text(dataSessionsJson[cleanId].name)
  sessionIdLoaded = cleanId;
  var url_formed = '/api/foro/' + dirtyId
  $.ajax({
    type: 'GET',
    url: url_formed,
    dataType: 'json',
    success: function (res) {
      // save activity id
      if (res.data.is_paused) {
        $("#statusAppMessage").text("Pausada");
        $("#statusAppMessage").css("color", "#ff8787")
        isTheSessionActive = false;
        $("#resumeStopSessionBtn").attr("src", "/images/play_white_btn.png");
      } else {
        $("#statusAppMessage").text("Activa");
        $("#statusAppMessage").css("color", "#87dbff")
        isTheSessionActive = true;
        $("#resumeStopSessionBtn").attr("src", "/images/pause_white_btn.png");
      }
    }
  }); //end ajax
}//loadSession



function toggleSessionBackground(id, isActive) {
  if (isActive) {
    $("#" + id + 'listElement').find('.activitycontainer').css("background-color", "#336699")
    $("#" + id + 'listElement').find('.activitycontainer').find('h3').css("color", "#ffffff")
    $("#" + id + 'listElement').find('.activitycontainer').find('#activity-information').find('p').css("color", "#ffffff")
    $("#" + id + 'listElement').find('.activitycontainer').find('.dotsMenu').find('.dropdown').find('button').css("background-color", "#336699")
  } else {
    $("#" + id + 'listElement').find('.activitycontainer').css("background-color", "#99CCFF")
    $("#" + id + 'listElement').find('.activitycontainer').find('h3').css("color", "#000000")
    $("#" + id + 'listElement').find('.activitycontainer').find('#activity-information').find('p').css("color", "#000000")
    $("#" + id + 'listElement').find('.activitycontainer').find('.dotsMenu').find('.dropdown').find('button').css("background-color", "#99CCFF")
  }
  $("#" + id + 'listElement').css("background-color", "")
  $("#" + id + 'loadSessionBtn').text(isActive ? "Desactivar" : "Activar")
}

function prepareStartSession(id) {
  $("#" + id + 'loadSessionBtn').hide();
  $("#" + id + "editSessionBtn").hide();
  $("#" + id + "deleteSessionBtn").hide();
  $("#" + id + "listElement").addClass("selectedSessionInList");
};

function cancelStartSession(id) {
  var cleanId;
  if (id.includes("cancelSessionBtn")) {
    emitSocketMessage_sessionCanceled()
    cleanId = id.replace("cancelSessionBtn", "")
  } else {
    cleanId = id;
  }
  restoreToLoadAndEdit(cleanId);
}

function restoreToLoadAndEdit(id) {
  $("#" + id + 'loadSessionBtn').show();
  $("#" + id + "editSessionBtn").show();
  $("#" + id + "deleteSessionBtn").show();
  $("#" + id + "listElement").removeClass("selectedSessionInList");
}

function emitSocketMessage_sessionLoaded(id) {
  socket.emit('sessionIdLoaded', { idSession: id });
}

function emitSocketMessage_sessionCanceled() {
  socket.emit('sessionCanceled', { 'msg': 'such a pity' });
}

function fillDataInModalOnEditSession(id) {
  editMode = true;
  console.log("fillDataInModalOnEditSession:", id);
  cleanId = id.replace("editSessionBtn", "");
  currentSessionIdOnEdit = cleanId;
  if (dataSessionsJson && dataSessionsJson[cleanId]) {
    $('#titulo').val(dataSessionsJson[cleanId].tema_foro);
  } else {
    console.error("El objeto en dataSessionsJson no está definido o el ID del foro no está presente.");
  }
}








function updateDataInSessionList(id) {
  //console.log('updateDataInSessionList', dataSessionsJson[id].imageName);
  if (dataSessionsJson[id].imageName) {
    if (id === sessionIdLoaded) {
      $("#publicZoneBackgroundImage").attr("src", "/uploads/" + dataSessionsJson[id].imageName);
    }
    $("#imageSession" + id).attr("src", "/uploads/" + dataSessionsJson[id].imageName);
  } else {
    if (id === sessionIdLoaded) {
      $("#publicZoneBackgroundImage").attr("src", "/images/cuadro_blanco.png");
    }
    $("#imageSession" + id).attr("src", "/images/cuadro_blanco.png");
  }
  //console.log('updateDataInSessionList', dataSessionsJson[id].imageName, dataSessionsJson[id].pin);
  $("#tema_foro" + id).text(dataSessionsJson[id].name);
  $("#ownerSession" + id).text(dataSessionsJson[id].owner);
}

function deleteSession(dirtyId) {
  swal.fire({
    title: "¿Estás seguro que deseas eliminar esta pizarra?",
    text: "Las contribuciones compartidas en el serán eliminados",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#DD6B55",
    confirmButtonText: "Si, deseo eliminarla",
    closeOnConfirm: false
  }).then(result => {
    if (result.value) {
      var cleanId = dirtyId.replace("deleteSessionBtn", "")
      $.ajax({
        type: 'DELETE',
        url: '/api/foro/' + cleanId,
        data: {
          "id_foro": cleanId,
        },
        dataType: 'json',
        success: function (res) {
          $("#" + cleanId + "listElement").hide();
          swal.fire({
            title: "La pizarra ha sido eliminado correctamente",
            text: "",
            icon: "success",
            timer: 1000,
            showConfirmButton: false
          })
        }
      })
    }
  });
}

function filterSelectionAZ() {
  var list, i, switching, b, shouldswitch;
  list = document.getElementById("sessions_list");
  switching = true;
  while (switching) {
    switching = false;
    b = list.getElementsByTagName("LI");
    for (i = 0; i < (b.length - 1); i++) {
      b[i].style.display = "";
      shouldswitch = false;
      if (b[i].innerHTML.toLowerCase() >
        b[i + 1].innerHTML.toLowerCase()) {
        shouldswitch = true;
        break;
      }
    }
    if (shouldswitch) {
      b[i].parentNode.insertBefore(b[i + 1], b[i]);
      switching = true;
    }
  }
}

function filterSelectionZA() {
  var list, i, switching, b, shouldswitch;
  list = document.getElementById("sessions_list");
  switching = true;
  while (switching) {
    switching = false;
    b = list.getElementsByTagName("LI");
    for (i = 0; i < (b.length - 1); i++) {
      b[i].style.display = "";
      shouldswitch = false;
      if (b[i].innerHTML.toLowerCase() <
        b[i + 1].innerHTML.toLowerCase()) {
        shouldswitch = true;
        break;
      }
    }
    if (shouldswitch) {
      b[i].parentNode.insertBefore(b[i + 1], b[i]);
      switching = true;
    }
  }
}

function filterSelectionRecentDate() {
  var list, i, switching, b, shouldswitch, c;
  list = document.getElementById("sessions_list");
  switching = true;
  while (switching) {
    switching = false;
    b = list.getElementsByTagName("LI");
    c = list.getElementsByClassName("creationDateActivity");
    for (i = 0; i < (c.length - 1); i++) {
      b[i].style.display = "";
      shouldswitch = false;
      if (c[i].innerHTML.toLowerCase() <
        c[i + 1].innerHTML.toLowerCase()) {
        shouldswitch = true;
        break;
      }
    }
    if (shouldswitch) {
      b[i].parentNode.insertBefore(b[i + 1], b[i]);
      switching = true;
    }
  }
}

function filterSelectionOldestDate() {
  var list, i, switching, b, shouldswitch, c;
  list = document.getElementById("sessions_list");
  switching = true;
  while (switching) {
    switching = false;
    b = list.getElementsByTagName("LI");
    c = list.getElementsByClassName("creationDateActivity");
    for (i = 0; i < (c.length - 1); i++) {
      b[i].style.display = "";
      shouldswitch = false;
      if (c[i].innerHTML.toLowerCase() >
        c[i + 1].innerHTML.toLowerCase()) {
        shouldswitch = true;
        break;
      }
    }
    if (shouldswitch) {
      b[i].parentNode.insertBefore(b[i + 1], b[i]);
      switching = true;
    }
  }
}

function filterSelectionActive() {
  //document.location.reload(true);
  var list, i, switching, b, shouldswitch, c, x, j;
  list = document.getElementById("sessions_list");
  c = list.getElementsByClassName("activityStatus");
  x = list.getElementsByTagName("LI");
  for (i = 0; i < x.length; i++) {
    x[i].style.display = "";
  }
  for (j = 0; j < c.length; j++) {
    if (c[j].innerHTML == 'false') {
      x[j].style.display = "none";
    }
  }
}

function filterSelectionInactive() {
  //document.location.reload(true);
  var list, i, switching, b, shouldswitch, c, x, j;
  list = document.getElementById("sessions_list");
  c = list.getElementsByClassName("activityStatus");
  x = list.getElementsByTagName("LI");
  for (i = 0; i < x.length; i++) {
    x[i].style.display = "";
  }
  for (j = 0; j < c.length; j++) {
    if (c[j].innerHTML == 'true') {
      x[j].style.display = "none";
    }
  }

}


window.onclick = function (event) {
  /*if (!event.target.matches('.dropbtn')) {
    var dropdowns = document.getElementsByClassName("dropdown-content");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }*/
  /*if (!event.target.matches('.sort-modal-button')) {
    var dropdowns = document.getElementsByClassName("dropdown-content");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }*/
}
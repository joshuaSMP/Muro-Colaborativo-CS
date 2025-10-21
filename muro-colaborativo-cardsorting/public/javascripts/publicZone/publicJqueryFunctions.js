//Constants
var objectsCreated = 0;
var objectsCreatedJson = {};
var pin_priv = localStorage.getItem("pin");
var profesor = localStorage.getItem("idProfesor");
var userId = localStorage.getItem("userId");
var muralHeight = $("#mural").height();
var muralWidth = $("#mural").width();
var objectReceived = 0; // count for the objects received
var trackPadCoordinatesX = 0;
var trackPadCoordinatesY = 0;
var createdObjectsId = [];
var sessionData = {};
sessionData.remoteObjects = {};
var onEdit = false;
var cursorsAndUsersIdJson = {};
var namesAndUsersId = {};
var itsAllowedToSave = true;
var insideAnIframe = false;
var sendCoordinatesEachThisNumber = 7;
var PIN = localStorage.getItem("pin");
var foro_id = localStorage.getItem('idForo');
// Starts socket io connection
var socket = io.connect('/mcv4');

socket.on('connect', function () {
  // connection done
  // joining room
  // create and join to specific room
  socket.emit('join_room', PIN);
});

let ramacontribucion = 0;
let ContributionId = null;
let textoedicion= "";
let editmode = false;
let tipotext= false;
let contenido= "";

$("#fullScreenPublicZone").click(function () {
	$(document).toggleFullScreen();
})

$(document).ready(function() {
  // Move modals to be direct children of `body` to escape any
  // stacking contexts that could limit their z-index. This is a robust
  // way to ensure they always appear on top of other page content.
  $("#selectMosaicSpace, #workspaceMode, #SubirFoto, #linkMode").appendTo("body");
  ValidarStatus();

  getContributionslist();
  $('.toggle-icon').click();
  getActivityData();
  console.log(pin_priv);
  if (pin_priv) {
    $('#ipAdress').text(pin_priv);
  } else {
    console.error('PIN no encontrado en la URL');
    window.pin_priv = null;
  }
});

// Manejador de eventos para la subida de archivos.
// Se usa la delegación de eventos de jQuery para asegurar que funcione
// incluso si los elementos se manipulan dinámicamente.
$(document).on('change', '#fileInput', function(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const previewContainer = $('#imagencargada');
      previewContainer.html(`<img src="${e.target.result}" style="max-width: 100%; max-height: 100%; object-fit: contain;">`);
    };
    reader.readAsDataURL(file);
  }
});

socket.on('nueva_contribucion', function(contribution) {
  // Nos aseguramos de no duplicar la contribución para el usuario que la creó.
  // El servidor emite a todos, pero el creador ya la renderiza en el success del AJAX.
  // Una mejor implementación sería que el servidor no emita al remitente.
  // Por ahora, esta validación del lado del cliente es suficiente.

  // Comprobamos si el elemento ya existe para evitar duplicados
  if ($(`#${contribution.id_contribucion}listElement`).length === 0) {
    if (contribution.rama === 1) {
      generarrama1(contribution);
    } else if (contribution.rama === 2) {
      generarrama2(contribution);
    } else if (contribution.rama === 3) {
      generarrama3(contribution);
    } else if (contribution.rama === 4) {
      generarrama4(contribution);
    } else if (contribution.rama === 5) {
      generarrama5(contribution);
    }
  }
});

socket.on('contribucion_actualizada', function(contribution) {
  const contributionId = contribution.id_contribucion;
  const elementToUpdate = $(`#comentario${contributionId} .coment-cuerpo, #comment${contributionId} .coment-cuerpo`);

  if (elementToUpdate.length > 0) {
    let newContent;
    if (contribution.tipo === 2) {
      newContent = `<center><img class="imageWrapper" src="/uploads/${contribution.contenido}" style="width:50%;height:30%;margin-left:100px" /></center>`;
    } else if (contribution.tipo === 3) {
      const [url, linkText] = contribution.contenido.split(',');
      newContent = `<a href="${url}" target="_blank">${linkText || url}</a>`;
    } else {
      newContent = contribution.contenido;
    }
    // Se asume que el contenido copiado no se puede editar, por lo que no se reprocesa aquí.
    // Si se pudiera, se necesitaría una lógica más compleja para manejar la referencia.
    elementToUpdate.html(newContent);
  }
});

socket.on('contribucion_eliminada', function(data) {
  const { id_contribucion, rama, id_contribucioncompartida } = data;
  const elementToRemove = $(`#${id_contribucion}listElement`);

  if (elementToRemove.length > 0) {
    elementToRemove.remove();
    // Update comment count on parent if it's a reply
    if (rama > 1 && id_contribucioncompartida) {
      // The parent ID is the id_contribucioncompartida
      updateCommentCount(rama, id_contribucioncompartida, -1);
    }
  }
});

socket.on('contribucion_movida', function(data) {
  const elementToMove = $(`#${data.id}listElement`);
  if (elementToMove.length) {
    elementToMove.css({ top: data.top, left: data.left });
  }
});

socket.on('reaccion_actualizada', function(data) {
  const { id_contribucion } = data;
  if ($(`#${id_contribucion}listElement`).length > 0) {
    getReaccionCountAndSetEmoji(id_contribucion);
  }
});

socket.on('contribucion_movida', function(data) {
  const elementToMove = $(`#${data.id}listElement`);
  if (elementToMove.length) {
    elementToMove.css({ top: data.top, left: data.left });
  }
});

socket.on('foro_estado_actualizado', function(data) {
  console.log('Nuevo estado del foro recibido (profesor):', data.esta_activa);
  if (data.esta_activa) {
    // El foro se ha activado
    $('#createObjectBtn').show();
  } else {
    // El foro se ha desactivado
    $('#createObjectBtn').hide();
  }
});

function ValidarStatus() {
  $.ajax({
    type: 'GET',
    url: '/api/foro/obtener/' + pin_priv,
    dataType: 'json',
    success: function (res) {
      if (res.esta_activa) {
        $('#createObjectBtn').show();
        console.log('El foro está abierto (profesor):', res);
      } else {
        $('#createObjectBtn').hide();
        console.log('El foro está cerrado (profesor):', res);
      }
    },
    error: function (xhr, status, error) {
      console.error('Error en la solicitud AJAX:', error);
    }
  });
}

document.getElementById('Discusion').addEventListener('scroll', function() {
  scrollFunction();
});

function scrollFunction() {
  const scrollToTopBtn = document.getElementById("scrollToTopBtn");
  const discusion = document.getElementById("Discusion");

  // Verificar si el usuario está haciendo scroll hacia arriba
  if (discusion.scrollTop === 0) {
    scrollToTopBtn.classList.add("visible");
  } else {
    scrollToTopBtn.classList.remove("visible");
  }
}

// Función para desplazar la página hacia arriba y recargarla
function scrollToTop() {
  // Desplaza suavemente el contenedor de discusión hacia arriba
  const discusion = document.getElementById("Discusion");
  discusion.scrollTo({ top: 0, behavior: 'smooth' });
}


function initializeReactionHandlers() {
  $('#contributions_list').on('click', '.emoji', function () {
    var id_contribucion = $(this).closest('.emojiTable').attr('id').replace('tablaEmojis', '');
    var selectedEmoji = $(this).text();
    var currentEmoji = $('#emojiIcon' + id_contribucion).text();

    if (selectedEmoji === currentEmoji) {
      var id_reaccion = $('#emojiIcon' + id_contribucion).data('reaction-id');
      if (id_reaccion) {
        removeReaccion(id_reaccion, id_contribucion);
      }
    } else {
      $(this).closest('.emojiTable').hide();
      addOrUpdateReaccion(id_contribucion, selectedEmoji);
    }
  });

  $('#contributions_list').on('click', '.nreaccion', function () {
    var id_contribucion = $(this).attr('id').replace('conteoReaccion', '');
    toggleReaccionTable(id_contribucion);
  });
}


function toggleReaccionTable(id_contribucion) {
  $(`#numReacciones${id_contribucion}`).toggle();
  if ($(`#numReacciones${id_contribucion}`).is(':visible')) {
    getReaccionCount(id_contribucion);
  }
}

function addOrUpdateReaccion(id_contribucion, emoji) {
  var id_reaccion = $('#emojiIcon' + id_contribucion).data('reaction-id');
  var idProfesor = localStorage.getItem("idProfesor") || localStorage.getItem("userId"); // Usar idProfesor si existe, si no, userId como fallback
  var propietario = 2; // 2 para profesor, correcto

  var datos = {
    id_contribucion: id_contribucion,
    emoji: emoji,
    id_alumno: null,
    id_profesor: idProfesor,
    propietario: propietario
  };

  if (id_reaccion) {
    datos.id_reaccion = id_reaccion;
    $.ajax({
      type: 'PUT',
      url: '/api/foro/reaccion/' + id_reaccion,
      data: JSON.stringify(datos),
      contentType: 'application/json',
      success: function (response) {
        console.log('Reacción actualizada:', response);
        $('#emojiIcon' + id_contribucion).html(emoji).data('reaction-id', id_reaccion);
        updateReactionCount(id_contribucion);
        getReaccionCountAndSetEmoji(id_contribucion);
      },
      error: function (xhr, status, error) {
        console.error('Error al actualizar la reacción:', error);
        alert('Ocurrió un error al actualizar la reacción.');
      }
    });
  } else {
    $.ajax({
      type: 'POST',
      url: '/api/foro/nuevareaccion',
      data: JSON.stringify(datos),
      contentType: 'application/json',
      success: function (response) {
        console.log('Reacción añadida:', response);
        $('#emojiIcon' + id_contribucion).html(emoji).data('reaction-id', response.id_reaccion);
        updateReactionCount(id_contribucion);
        getReaccionCountAndSetEmoji(id_contribucion);
      },
      error: function (xhr, status, error) {
        console.error('Error al añadir la reacción:', error);
        alert('Ocurrió un error al añadir la reacción.');
      }
    });
  }
}

function removeReaccion(id_reaccion, id_contribucion) {
  $.ajax({
    type: 'DELETE',
    url: '/api/foro/reaccion/' + id_reaccion,
    success: function (response) {
      console.log('Reacción eliminada:', response);
      var conteoReaccionElement = $('#conteoReaccion' + id_contribucion);
      var conteoActual = parseInt(conteoReaccionElement.text());
      conteoReaccionElement.text(Math.max(0, conteoActual - 1));
      $('#emojiIcon' + id_contribucion).html('☺+').removeData('reaction-id');
      getReaccionCountAndSetEmoji(id_contribucion);
      $(`#tablaEmojis${id_contribucion}`).hide();
    },
    error: function (xhr, status, error) {
      console.error('Error al eliminar la reacción:', error);
      alert('Ocurrió un error al eliminar la reacción.');
    }
  });
}

function updateReactionCount(id_contribucion) {
  $.ajax({
    type: 'GET',
    url: '/api/foro/reacciones/' + id_contribucion,
    success: function (response) {
      var conteoReaccionElement = $('#conteoReaccion' + id_contribucion);
      conteoReaccionElement.text(response.length);

      const userId = localStorage.getItem("IdProfesor");
      const userReaction = response.find(reaction => reaction.id_profesor === userId);

      if (userReaction) {
        const emojiIcon = $(`#emojiIcon${id_contribucion}`);
        emojiIcon.html(userReaction.emoji).data('reaction-id', userReaction.id_reaccion);
      }
    },
    error: function (xhr, status, error) {
      console.error('Error al obtener el conteo de reacciones:', error);
      alert('Ocurrió un error al obtener el conteo de reacciones.');
    }
  });
}

function getReaccionCount(id_contribucion) {
  $.ajax({
    type: 'GET',
    url: `/api/foro/reacciones/${id_contribucion}`, 
    success: function (response) {
      let counts = {
        '👍': 0,
        '👎': 0,
        '❤️': 0
      };

      response.forEach(reaction => {
        if (counts.hasOwnProperty(reaction.emoji)) {
          counts[reaction.emoji]++;
        }
      });

      let mostReactedEmoji = '☺';
      let maxCount = 0;
      for (const emoji in counts) {
        if (counts.hasOwnProperty(emoji) && counts[emoji] > maxCount) {
          mostReactedEmoji = emoji;
          maxCount = counts[emoji];
        }
      }

      if (maxCount > 0) {
        $(`#emojiIcon${id_contribucion}`).text(mostReactedEmoji);
      }
      
      $(`#gusta${id_contribucion}`).text(counts['👍']); 
      $(`#disgusta${id_contribucion}`).text(counts['👎']);
      $(`#corazon${id_contribucion}`).text(counts['❤️']);      

      $(`#numReacciones${id_contribucion}`).show();
    },
    error: function (xhr, status, error) {
      console.error('Error al obtener el conteo de reacciones:', error);
      alert('Ocurrió un error al obtener el conteo de reacciones.');
    }
  });
}

async function getReaccionCountAndSetEmoji(id_contribucion) {
  try {
    const response = await $.ajax({
      type: 'GET',
      url: `/api/foro/reacciones/${id_contribucion}`,
      dataType: 'json'
    });

    if (response.length > 0) {
      console.log(`La contribución ${id_contribucion} tiene emojis.`);
      let counts = {
        '👍': 0,
        '👎': 0,
        '❤️': 0
      };

      response.forEach(reaction => {
        if (counts.hasOwnProperty(reaction.emoji)) {
          counts[reaction.emoji]++;
        }
      });

      const sortedEmojis = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
      const topEmojis = sortedEmojis.slice(0, 3);

      let emojisHTML = '';
      topEmojis.forEach(emoji => {
        if (counts[emoji] > 0) {
          emojisHTML += `<span class="emoji">${emoji} ${counts[emoji]}</span>`;
        }
      });

      $(`#userEmojis${id_contribucion}`).html(emojisHTML);
      $(`#numReacciones${id_contribucion}`).text(response.length);

      const userId = localStorage.getItem("userId").trim();
      console.log(`El userId es: ${userId}`);
      response.forEach(reaction => {
        console.log(`El reaction.id_alumno es: ${reaction.id_alumno.trim()}`);
      });
      const userReaction = response.find(reaction => reaction.id_alumno.trim() === userId);
      if (userReaction) {
        console.log(`El usuario ${userId} ha reaccionado a la contribución ${id_contribucion} con ${userReaction.emoji}.`);
        $(`#emojiIcon${id_contribucion}`).html(userReaction.emoji).data('reaction-id', userReaction.id_reaccion);
      }
    } else {
      console.log(`La contribución ${id_contribucion} no tiene emojis.`);
      $(`#userEmojis${id_contribucion}`).empty();
      $(`#numReacciones${id_contribucion}`).text('0');
    }
  } catch (error) {
    console.error('Error al obtener el conteo de reacciones:', error);
    alert('Ocurrió un error al obtener el conteo de reacciones.');
  }
}




async function getContributionslist() {
  $('#contributions_list').empty();
  const currentUserId = localStorage.getItem("userId");
  try {
    const res = await $.ajax({
      type: 'GET',
      url: '/api/foro/contribuciones/' + pin_priv,
      dataType: 'json'
    });

    for (let contribucion of res) {
      const fechaCreacion = new Date(contribucion.fecha);
      const fechaFormateada = fechaCreacion.toLocaleDateString("es-ES", { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'});
      let contenido;
      let referenciaAutor;
      const emoji = contribucion.emoji || '☺+';
      if (contribucion.tipo === 2) {
        contenido = `<center><img class="imageWrapper" src="/uploads/${contribucion.contenido}" style="width:50%;height:30%; margin-left:100px" /></center>`;
      } else if (contribucion.tipo === 3) {
        const [url, linkText] = contribucion.contenido.split(',');
        contenido = `<a href="${url}" target="_blank">${linkText || url}</a>`;
      } else {
        contenido = contribucion.contenido;
      }

      if (contenido.includes('<p>')) {
        const inicioReferenciaAutor = contenido.indexOf('<p>');
        const finReferenciaAutor = contenido.indexOf('</p>', inicioReferenciaAutor);
        referenciaAutor = contenido.substring(inicioReferenciaAutor, finReferenciaAutor + 4);
        contenido = contenido.substring(finReferenciaAutor + 4);
        console.log(referenciaAutor);
        console.log(contenido);
        if (contribucion.tipo === 2) {
          contenido = `<center><img class="imageWrapper" src="/uploads/${contenido}</center>`;
        } else if (contribucion.tipo === 3) {
          contenido = `<a href="${contenido}</a>`;
        }
      }

      if (contribucion.rama === 1) {
        getReaccionCountAndSetEmoji(contribucion.id_contribucion);
        const nombrePropietario = contribucion.propietario === 2 ? `Profesor ${contribucion.nombre_profesor}` : contribucion.nombre_alumno;
        const idalumnooprofesor = contribucion.propietario === 2 ? contribucion.idProfesor : contribucion.idAlumno;
        const styleBackground = contribucion.propietario === 2 ? 'background-color: #f7e29ee8;' : '';

        const element = `
      <li id="${contribucion.id_contribucion}listElement">
          <div class="comentario" id="comentario${contribucion.id_contribucion}" ${styleBackground ? `style="${styleBackground}"` : ''}>
              <div class="UsuarioComen">
                ${nombrePropietario}  
                </div> <div class="fecha-creacion" id="alumnoid${contribucion.idAlumno}">${fechaFormateada}</div>
                      <img src="https://cdn-icons-png.flaticon.com/512/61/61140.png" alt="Botón" class="acciones" id="acciones${contribucion.id_contribucion}">
                   ${referenciaAutor ? `<div class="copiado">${referenciaAutor}</div>` : ''}
                  <div class="coment-cuerpo" id="rama1tipo${contribucion.tipo}">
                      ${contenido}
                  </div>
                  <div class="coment-pie">
                      <div class="reacciones-comentarios-wrapper">
                          <span id="userEmojis${contribucion.id_contribucion}" class="userEmojis"></span>
                          <div id="emojiIcon${contribucion.id_contribucion}" class="reacciones" data-reaction-id="${contribucion.id_reaccion || ''}">${emoji}</div>
                          <div id="tablaEmojis${contribucion.id_contribucion}" class="emojiTable" style="display: none;">
                              <table id="emojisTable" onclick="seleccionarEmoji(event)">
                                  <tr>
                                      <td><span class="emoji">👍</span></td>
                                      <td><span class="emoji">👎</span></td>
                                      <td><span class="emoji">❤️</span></td>
                                  </tr>
                              </table>
                          </div>
                          <span id="numComentarios${contribucion.id_contribucion}" class="ncoment" onclick="toggleSubcomments('comment${contribucion.id_contribucion}')"></span>
                      </div>
                      <div class="contenedor">
                          <img src="/images/responder.png" alt="Botón" class="responder">
                          <div class="mensaje" id="mensaje">Responder a ${nombrePropietario}</div>
                      </div>
                  </div>
              </div>
              <div class="sub-comentario" id="comment${contribucion.id_contribucion}Subcomments" style="display: none"></div>
          </li>`;
        $('#contributions_list').prepend(element);
        makeContributionDraggable(contribucion.id_contribucion);

        $(`#emojiIcon${contribucion.id_contribucion}`).click(function () {
          var id_contribucion = $(this).attr("id").substring(9);
          $(`#tablaEmojis${id_contribucion}`).toggle();
        });

        updateReactionCount(contribucion.id_contribucion);
        verificarYMostrarRama2(contribucion.id_contribucion, 2, nombrePropietario);
      }
    }

    $(document).on("click", ".responder2", function () {
      ramacontribucion = 3;
      ContributionId = $(this).closest(".sub-coment").attr("id").substring(7); 
      console.log("La contribucion es:", ContributionId);
      console.log("Hola, mi rama es:", ramacontribucion);
      $("#createObjectBtn").hide();
      $("#selectMosaicSpace").show();
    });

// -------------------ACCIONES DE LA RAMA 1----------------------------
    $(document).on("click", ".acciones", function () {
      const id_contribucion = $(this).attr("id").substring(8);
      const tablaAccionesEdicionId = `#TablaAccionesEdicion${id_contribucion}`;
      if ($(tablaAccionesEdicionId).length === 0) {
        let accionesHtml = `<div class="TablaAccionesEdicion" id="TablaAccionesEdicion${id_contribucion}">`;
          accionesHtml += `
            <img class="iconoeditar" src="/images/editar.png">
            <img class="iconoeliminar" src="/images/eliminar.png">
            <img class="iconocopiar" src="/images/copiar.png">
            </div>  `
        $(`#comentario${id_contribucion}`).append(accionesHtml);
        $(tablaAccionesEdicionId).hide();
      }

      $(tablaAccionesEdicionId).toggle();
    });

    $(document).on("click", ".iconoeliminar", function () {
      ContributionId = $(this).closest(".comentario").attr("id").substring(10);
      deleteContribucion(ContributionId);
    });

    $(document).on("click", ".iconoeditar", function () {
      const comentarioDiv = $(this).closest(".comentario");
      ContributionId = $(this).closest(".comentario").attr("id").substring(10);
      console.log("Hola, mi respuesta es a:", ContributionId);
      const comentCuerpoDiv = comentarioDiv.find(".coment-cuerpo");
      const tipo = comentCuerpoDiv.attr("id").match(/rama1tipo(\d+)/)[1];
      contenido = comentCuerpoDiv.html();
      textoedicion = contenido;
      $("#selectMosaicSpace").show();
      editmode = true;
      var urlMatch = contenido.match(/href="([^"]*)"/);
      var nombreMatch = contenido.match(/>([^<]*)</);
      if (tipo === "1") {
        $("#workspaceMode").show();
        $("#selectMosaicWorkspace").hide();
        $("#selectMosaicSpace").hide();
        $("#trackpadMode").hide();
        $("#trackpadSideBar").hide();
        $("#texto").val(contenido.trim());
      } if (tipo === "2") {        
        $("#SubirFoto").show();
        $("#selectMosaicWorkspace").hide();
        $("#selectMosaicSpace").hide();
        $("#trackpadMode").hide();
        $("#trackpadSideBar").hide();
        var div = document.getElementById("imagencargada");
        div.innerHTML = contenido;
        var img = div.querySelector('.imageWrapper'); // Selecciona la imagen dentro del div #imagencargada
        if (img) {
          img.style.width = "100%";
        }
      }
      if (tipo === "3") {        
        $("#linkMode").show();
        $("#selectMosaicWorkspace").hide();
        $("#selectMosaicSpace").hide();
        $("#trackpadMode").hide();
        $("#trackpadSideBar").hide();
        var url = urlMatch[1];
        var nombre = nombreMatch[1];
        $("#nombreLinkArea").val(nombre.trim());
        $("#linkArea").val(url.trim());
      }
    });

    $(document).on("click", ".iconocopiar", function() {
      const id_contribucion = $(this).closest(".comentario").attr("id").substring(10);
      const nombreAlumno = $(this).closest(".comentario").find(".UsuarioComen").text().trim();
      copiarContribucion(id_contribucion, currentUserId, nombreAlumno);
  });

  $(document).on("click", ".responder", function () {
    editmode = false;
    $("#textArea").val("");
    ramacontribucion = 2;
    ContributionId = $(this).closest(".comentario").attr("id").substring(10);
    console.log("La contribucion es, ", ContributionId);
    console.log("Hola, mi rama es:", ramacontribucion);
    $("#selectMosaicSpace").show();
    $("#texto").val("");
    $("#nombreLinkArea").val("");
    $("#linkArea").val("");
    var div = document.getElementById("imagencargada");
    div.innerHTML = "";
  });

// -------------------ACCIONES DE LA RAMA 2----------------------------

$(document).on("click", ".acciones2", function () {
  const id_contribucion = $(this).closest(".sub-coment").attr("id").substring(7); 
  const tablaAccionesEdicionId = `#TablaAccionesEdicion${id_contribucion}`;
  const alumnoId = $(this).attr("id").substring(8).trim(); 
  const userId = currentUserId.trim(); 
  
  console.log("alumno: ", alumnoId);
  console.log("alumnoactivo: ", userId);
  
  if ($(tablaAccionesEdicionId).length === 0) {
    let accionesHtml = `<div class="TablaAccionesEdicion" id="TablaAccionesEdicion${id_contribucion}">`;
      accionesHtml += `
            <img class="iconoeditar2" src="/images/editar.png">
            <img class="iconoeliminar2" src="/images/eliminar.png">
            <img class="iconocopiar2" src="/images/copiar.png">
      `;
    
    $(`#comment${id_contribucion}`).append(accionesHtml); 
    $(tablaAccionesEdicionId).hide();
  }

  $(tablaAccionesEdicionId).toggle();
});

 

$(document).on("click", ".iconoeditar2", function () {
  const comentarioDiv = $(this).closest(".sub-coment");
  ContributionId = $(this).closest(".sub-coment").attr("id").substring(7);
  console.log("Hola, mi respuesta es a:", ContributionId);
  const comentCuerpoDiv = comentarioDiv.find(".coment-cuerpo");
  const tipo = comentCuerpoDiv.attr("id").match(/rama1tipo(\d+)/)[1];
  contenido = comentCuerpoDiv.html();
  textoedicion = contenido;
  $("#selectMosaicSpace").show();
  editmode = true;
  var urlMatch = contenido.match(/href="([^"]*)"/);
  var nombreMatch = contenido.match(/>([^<]*)</);
  if (tipo === "1") {
    $("#workspaceMode").show();
    $("#selectMosaicWorkspace").hide();
    $("#selectMosaicSpace").hide();
    $("#trackpadMode").hide();
    $("#trackpadSideBar").hide();
    $("#texto").val(contenido.trim());
  } if (tipo === "2") {
    $("#SubirFoto").show();
    $("#selectMosaicWorkspace").hide();
    $("#selectMosaicSpace").hide();
    $("#trackpadMode").hide();
    $("#trackpadSideBar").hide();
    var div = document.getElementById("imagencargada");
    div.innerHTML = contenido;
    var img = div.querySelector('.imageWrapper'); // Selecciona la imagen dentro del div #imagencargada
    if (img) {
      img.style.width = "100%";
    }
  }
  if (tipo === "3") {
    $("#linkMode").show();
    $("#selectMosaicWorkspace").hide();
    $("#selectMosaicSpace").hide();
    $("#trackpadMode").hide();
    $("#trackpadSideBar").hide();
    var url = urlMatch[1];
    var nombre = nombreMatch[1];
    $("#nombreLinkArea").val(nombre.trim());
    $("#linkArea").val(url.trim());
  }
});

$(document).on("click", ".iconoeliminar2", function () {
  let ContributionId = $(this).closest(".sub-coment").attr("id").substring(7);
  console.log("Contribución a eliminar:", ContributionId);
  let contribucioncompartida = $(this).closest(".sub-coment").find("p").attr("id");
  let rama = 2;
  deleteContribucion(ContributionId, rama, contribucioncompartida);
});

$(document).on("click", ".iconocopiar2", function () {
  const id_contribucion = $(this).closest(".sub-coment").attr("id").substring(7);
  const nombreAlumno = $(this).closest(".sub-coment").find(".UsuarioComen").text().trim();
  copiarContribucion(id_contribucion, currentUserId, nombreAlumno);
});


        


// -------------------ACCIONES DE LA RAMA 3----------------------------

$(document).on("click", ".acciones3", function () {
  const id_contribucion = $(this).closest(".sub-coment3").attr("id").substring(7); 
  const tablaAccionesEdicionId = `#TablaAccionesEdicion${id_contribucion}`;
  if ($(tablaAccionesEdicionId).length === 0) {
    let accionesHtml = `<div class="TablaAccionesEdicion" id="TablaAccionesEdicion${id_contribucion}">`;
      accionesHtml += `
            <img class="iconoeditar3" src="/images/editar.png">
            <img class="iconoeliminar3" src="/images/eliminar.png">
            <img class="iconocopiar3" src="/images/copiar.png">
      `;
    
    $(`#comment${id_contribucion}`).append(accionesHtml); 
    $(tablaAccionesEdicionId).hide();
  }

  $(tablaAccionesEdicionId).toggle();
});


$(document).on("click", ".iconoeditar3", function () {
  const comentarioDiv = $(this).closest(".sub-coment3");
  ContributionId = $(this).closest(".sub-coment3").attr("id").substring(7);
  console.log("Hola, mi respuesta es a:", ContributionId);
  const comentCuerpoDiv = comentarioDiv.find(".coment-cuerpo");
  const tipo = comentCuerpoDiv.attr("id").match(/rama1tipo(\d+)/)[1];
  contenido = comentCuerpoDiv.html();
  textoedicion = contenido;
  $("#selectMosaicSpace").show();
  editmode = true;
  var urlMatch = contenido.match(/href="([^"]*)"/);
  var nombreMatch = contenido.match(/>([^<]*)</);
  if (tipo === "1") {
    $("#workspaceMode").show();
    $("#selectMosaicWorkspace").hide();
    $("#selectMosaicSpace").hide();
    $("#trackpadMode").hide();
    $("#trackpadSideBar").hide();
    $("#texto").val(contenido.trim());
  } if (tipo === "2") {
    $("#SubirFoto").show();
    $("#selectMosaicWorkspace").hide();
    $("#selectMosaicSpace").hide();
    $("#trackpadMode").hide();
    $("#trackpadSideBar").hide();
    var div = document.getElementById("imagencargada");
    div.innerHTML = contenido;
    var img = div.querySelector('.imageWrapper'); // Selecciona la imagen dentro del div #imagencargada
    if (img) {
      img.style.width = "100%";
    }
  }
  if (tipo === "3") {
    $("#linkMode").show();
    $("#selectMosaicWorkspace").hide();
    $("#selectMosaicSpace").hide();
    $("#trackpadMode").hide();
    $("#trackpadSideBar").hide();
    var url = urlMatch[1];
    var nombre = nombreMatch[1];
    $("#nombreLinkArea").val(nombre.trim());
    $("#linkArea").val(url.trim());
  }
});

$(document).on("click", ".iconoeliminar3", function () {
  ContributionId = $(this).closest(".sub-coment3").attr("id").substring(7);
  console.log("Contribucion a eliminar:", ContributionId)
  let contribucioncompartida = $(this).closest(".sub-coment3").find("p").attr("id");
  let rama = 3;
  deleteContribucion(ContributionId, rama, contribucioncompartida);
});

$(document).on("click", ".iconocopiar3", function () {
  const id_contribucion = $(this).closest(".sub-coment3").attr("id").substring(7);
  const nombreAlumno = $(this).closest(".sub-coment3").find(".UsuarioComen").text().trim();
  copiarContribucion(id_contribucion, currentUserId, nombreAlumno);
});

// -------------------ACCIONES DE LA RAMA 4----------------------------

$(document).on("click", ".acciones4", function () {
  const id_contribucion = $(this).closest(".sub-coment4").attr("id").substring(7); 
  const tablaAccionesEdicionId = `#TablaAccionesEdicion${id_contribucion}`;

  if ($(tablaAccionesEdicionId).length === 0) {
    let accionesHtml = `<div class="TablaAccionesEdicion" id="TablaAccionesEdicion${id_contribucion}">`;
      accionesHtml += `
            <img class="iconoeditar4" src="/images/editar.png">
            <img class="iconoeliminar4" src="/images/eliminar.png">
            <img class="iconocopiar4" src="/images/copiar.png">
      `;
    
    $(`#comment${id_contribucion}`).append(accionesHtml); 
    $(tablaAccionesEdicionId).hide();
  }

  $(tablaAccionesEdicionId).toggle();

});


$(document).on("click", ".iconoeditar4", function () {
  const comentarioDiv = $(this).closest(".sub-coment4");
  ContributionId = $(this).closest(".sub-coment4").attr("id").substring(7);
  console.log("Hola, mi respuesta es a:", ContributionId);
  const comentCuerpoDiv = comentarioDiv.find(".coment-cuerpo");
  const tipo = comentCuerpoDiv.attr("id").match(/rama1tipo(\d+)/)[1];
  contenido = comentCuerpoDiv.html();
  textoedicion = contenido;
  $("#selectMosaicSpace").show();
  editmode = true;
  var urlMatch = contenido.match(/href="([^"]*)"/);
  var nombreMatch = contenido.match(/>([^<]*)</);
  if (tipo === "1") {
    $("#workspaceMode").show();
    $("#selectMosaicWorkspace").hide();
    $("#selectMosaicSpace").hide();
    $("#trackpadMode").hide();
    $("#trackpadSideBar").hide();
    $("#texto").val(contenido.trim());
  } if (tipo === "2") {
    $("#SubirFoto").show();
    $("#selectMosaicWorkspace").hide();
    $("#selectMosaicSpace").hide();
    $("#trackpadMode").hide();
    $("#trackpadSideBar").hide();
    var div = document.getElementById("imagencargada");
    div.innerHTML = contenido;
    var img = div.querySelector('.imageWrapper'); // Selecciona la imagen dentro del div #imagencargada
    if (img) {
      img.style.width = "100%";
    }
  }
  if (tipo === "3") {
    $("#linkMode").show();
    $("#selectMosaicWorkspace").hide();
    $("#selectMosaicSpace").hide();
    $("#trackpadMode").hide();
    $("#trackpadSideBar").hide();
    var url = urlMatch[1];
    var nombre = nombreMatch[1];
    $("#nombreLinkArea").val(nombre.trim());
    $("#linkArea").val(url.trim());
  }
});

$(document).on("click", ".iconoeliminar4", function () {
  ContributionId = $(this).closest(".sub-coment4").attr("id").substring(7);
  console.log("Contribucion a eliminar:", ContributionId)
  let contribucioncompartida = $(this).closest(".sub-coment4").find("p").attr("id");
  let rama = 4;
  deleteContribucion(ContributionId, rama, contribucioncompartida);
});

$(document).on("click", ".iconocopiar4", function () {
  const id_contribucion = $(this).closest(".sub-coment4").attr("id").substring(7);
  const nombreAlumno = $(this).closest(".sub-coment4").find(".UsuarioComen").text().trim();
  copiarContribucion(id_contribucion, currentUserId, nombreAlumno);
});

// -------------------ACCIONES DE LA RAMA 5----------------------------

$(document).on("click", ".acciones5", function () {
  const id_contribucion = $(this).closest(".sub-coment5").attr("id").substring(7); 
  const tablaAccionesEdicionId = `#TablaAccionesEdicion${id_contribucion}`;

  if ($(tablaAccionesEdicionId).length === 0) {
    let accionesHtml = `<div class="TablaAccionesEdicion" id="TablaAccionesEdicion${id_contribucion}">`;
      accionesHtml += `
            <img class="iconoeditar5" src="/images/editar.png">
            <img class="iconoeliminar5" src="/images/eliminar.png">
            <img class="iconocopiar5" src="/images/copiar.png">
      `;
    
    $(`#comment${id_contribucion}`).append(accionesHtml); 
    $(tablaAccionesEdicionId).hide();
  }

  $(tablaAccionesEdicionId).toggle();
});

$(document).on("click", ".iconoeditar5", function () {
  const comentarioDiv = $(this).closest(".sub-coment5");
  ContributionId = $(this).closest(".sub-coment5").attr("id").substring(7);
  console.log("Hola, mi respuesta es a:", ContributionId);
  const comentCuerpoDiv = comentarioDiv.find(".coment-cuerpo");
  const tipo = comentCuerpoDiv.attr("id").match(/rama1tipo(\d+)/)[1];
  contenido = comentCuerpoDiv.html();
  textoedicion = contenido;
  $("#selectMosaicSpace").show();
  editmode = true;
  var urlMatch = contenido.match(/href="([^"]*)"/);
  var nombreMatch = contenido.match(/>([^<]*)</);
  if (tipo === "1") {
    $("#workspaceMode").show();
    $("#selectMosaicWorkspace").hide();
    $("#selectMosaicSpace").hide();
    $("#trackpadMode").hide();
    $("#trackpadSideBar").hide();
    $("#texto").val(contenido.trim());
  } if (tipo === "2") {
    $("#SubirFoto").show();
    $("#selectMosaicWorkspace").hide();
    $("#selectMosaicSpace").hide();
    $("#trackpadMode").hide();
    $("#trackpadSideBar").hide();
    var div = document.getElementById("imagencargada");
    div.innerHTML = contenido;
    var img = div.querySelector('.imageWrapper'); 
    if (img) {
      img.style.width = "100%";
    }
  }
  if (tipo === "3") {
    $("#linkMode").show();
    $("#selectMosaicWorkspace").hide();
    $("#selectMosaicSpace").hide();
    $("#trackpadMode").hide();
    $("#trackpadSideBar").hide();
    var url = urlMatch[1];
    var nombre = nombreMatch[1];
    $("#nombreLinkArea").val(nombre.trim());
    $("#linkArea").val(url.trim());
  }
});

$(document).on("click", ".iconoeliminar5", function () {
  ContributionId = $(this).closest(".sub-coment5").attr("id").substring(7);
  console.log("Contribucion a eliminar:", ContributionId)
  let contribucioncompartida = $(this).closest(".sub-coment5").find("p").attr("id");
  let rama = 5;
  deleteContribucion(ContributionId, rama, contribucioncompartida);
});

$(document).on("click", ".iconocopiar5", function () {
  const id_contribucion = $(this).closest(".sub-coment5").attr("id").substring(7);
  const nombreAlumno = $(this).closest(".sub-coment5").find(".UsuarioComen").text().trim();
  copiarContribucion(id_contribucion, currentUserId, nombreAlumno);
});

//--------------------------------------------------------------------

initializeReactionHandlers();

  } catch (error) {
    console.error("Error in getContributions:", error);
  }
};

function makeContributionDraggable(contributionId) {
  const selector = `#${contributionId}listElement`;
  $(selector).draggable({
    containment: "#Discusion",
    cursor: "move",
    stack: "#contributions_list > li",
    scroll: true,
    scrollSensitivity: 50,
    scrollSpeed: 15,
    stop: function(event, ui) {
      // Cuando el usuario suelta el elemento, emitimos su nueva posición
      const contributionId = $(this).attr('id').replace('listElement', '');
      const position = ui.position; // { top, left }
      const pin = localStorage.getItem("pin");
      
      socket.emit('mover_contribucion', { id: contributionId, top: position.top, left: position.left, pin: pin });
    }
  });
}

function verificarYMostrarRama2(idContribucion, rama, nombreAlumno) {
  const currentUserId = localStorage.getItem("userId"); // Obtener el userId del localStorage
  $.ajax({
    type: 'GET',
    url: `/api/foro/contribucionescompartidas/${idContribucion}?rama=${rama}`,
    dataType: 'json',
    success: function (res) {
      if (res.length > 0) {
        const numComentarios = res.length;
        const numComentariosElement = $(`#numComentarios${idContribucion}`);
        if (numComentariosElement.length > 0) {
          const nuevoTexto = numComentarios === 1 ? `Ver ${numComentarios} comentario` : `Ver ${numComentarios} comentarios`;
          numComentariosElement.text(nuevoTexto);
        }

        res.forEach(function (contribucionRama2) {
          const fechaCreacion = new Date(contribucionRama2.fecha);
          const fechaFormateada = fechaCreacion.toLocaleDateString("es-ES", { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'});
          let contenido;
          let referenciaAutor;
          const emoji = contribucionRama2.emoji || '☺+';

          if (contribucionRama2.tipo === 2) {
            contenido = `<center><img class="imageWrapper" src="/uploads/${contribucionRama2.contenido}" style="width:50%;height:30%;margin-left:100px" /></center>`;
          } else if (contribucionRama2.tipo === 3) {
            const [url, linkText] = contribucionRama2.contenido.split(',');
            contenido = `<a href="${url}" target="_blank">${linkText || url}</a>`;
          } else {
            contenido = contribucionRama2.contenido;
          }

          // Separar el contenido en dos partes
          if (contenido.includes('<p>')) {
            const inicioReferenciaAutor = contenido.indexOf('<p>');
            const finReferenciaAutor = contenido.indexOf('</p>', inicioReferenciaAutor);
            referenciaAutor = contenido.substring(inicioReferenciaAutor, finReferenciaAutor + 4);
            contenido = contenido.substring(finReferenciaAutor + 4);
            console.log(referenciaAutor);
            console.log(contenido);
            if (contribucionRama2.tipo === 2) {
              contenido = `<center><img class="imageWrapper" src="/uploads/${contenido}</center>`;
            } else if (contribucionRama2.tipo === 3) {
              contenido = `<a href="${contenido}</a>`;
            }
          }

          // Generar el elemento HTML para la contribución de la rama 2
          const nombrePropietario = contribucionRama2.propietario === 2 ? `Profesor ${contribucionRama2.nombre_profesor}` : contribucionRama2.nombre_alumno;
          const idalumnooprofesor = contribucionRama2.propietario === 2 ? contribucionRama2.idProfesor : contribucionRama2.idAlumno;
          const styleBackground = contribucionRama2.propietario === 2 ? 'background-color: #fff0bde8;' : '';
          getReaccionCountAndSetEmoji(contribucionRama2.id_contribucion);
          const elementRama2 = `
            <li id="${contribucionRama2.id_contribucion}listElement">
              <div class="sub-coment" id="comment${contribucionRama2.id_contribucion}"${styleBackground ? `style="${styleBackground}"` : ''}>
                <p id= ${contribucionRama2.id_contribucion_compartida} class=respondioa><span style= font-size:18px; >↶</span> Respondió a ${nombreAlumno}</p>
                <div class="UsuarioComen">
                  ${nombrePropietario}
                  <div class="fecha-creacion" id="alumnoid${contribucionRama2.idAlumno}">${fechaFormateada}</div>
                  <img src="https://cdn-icons-png.flaticon.com/512/61/61140.png" alt="Botón" class="acciones2" id="alumnoid${contribucionRama2.idAlumno}">
                </div>
                ${referenciaAutor ? `<div class="copiado">${referenciaAutor}</div>` : ''}
                <div class="coment-cuerpo" id="rama1tipo${contribucionRama2.tipo}">${contenido}</div>
                <div class="coment-pie">
                  <span id="userEmojis${contribucionRama2.id_contribucion}" class="userEmojis"></span>
                  <div id="emojiIcon${contribucionRama2.id_contribucion}" class="reacciones" data-reaction-id="${contribucionRama2.id_reaccion || ''}">${emoji}</div>
                  <div id="tablaEmojis${contribucionRama2.id_contribucion}" class="emojiTable" style="display: none;">
                    <table id="emojisTable" onclick="seleccionarEmoji(event)">
                      <tr>
                        <td><span class="emoji">👍</span></td>
                        <td><span class="emoji">👎</span></td>
                      <td><span class="emoji">❤️</span></td>                      
                      </tr>
                    </table>
                  </div>
                  <span id="numComentarios${contribucionRama2.id_contribucion}" class="ncoment" onclick="toggleSubcomments2('comment2${contribucionRama2.id_contribucion}')"></span>
                      <div class="contenedor">
                          <img src="/images/responder.png" alt="Botón" class="responder2">
                          <div class="mensaje" id="mensaje">Responder a ${nombrePropietario}</div>
                      </div>
                </div>
              </div>
              <div class="sub-comentario3" id="comment2${contribucionRama2.id_contribucion}Subcomments" style="display: none"></div>
            </li>`;

          // Agregar el elemento generado a la lista de subcomentarios
          $(`#comment${idContribucion}Subcomments`).append(elementRama2);

          // Evento para mostrar/ocultar tabla de emojis
          $(`#emojiIcon${contribucionRama2.id_contribucion}`).click(function () {
            var id_contribucion = $(this).attr("id").substring(9);
            $(`#tablaEmojis${id_contribucion}`).toggle();
          });

          // Actualizar conteo de reacciones
          updateReactionCount(contribucionRama2.id_contribucion);

          // Verificar y mostrar ramas 3 y 4
          verificarYMostrarRama3(contribucionRama2.id_contribucion, 3, nombrePropietario);
        });
      }
    } 
    ,
    error: function (xhr, status, error) {
      console.error("Error en verificarYMostrarRamas:", error);
    }
  });
}


function verificarYMostrarRama3(idContribucion, rama, nombreAlumno) {
  const currentUserId = localStorage.getItem("userId");
  $.ajax({
    type: 'GET',
    url: `/api/foro/contribucionescompartidas/${idContribucion}?rama=${rama}`,
    dataType: 'json',
    success: function (res) {
      if (res.length > 0) {
        const numComentarios = res.length;
        const numComentariosElement = $(`#numComentarios3${idContribucion}`);
        if (numComentariosElement.length > 0) {
          const nuevoTexto = numComentarios === 1 ? `Ver ${numComentarios} comentario` : `Ver ${numComentarios} comentarios`;
          numComentariosElement.text(nuevoTexto);
        }
        res.forEach(function (contribucionRama2) {
          const fechaCreacion = new Date(contribucionRama2.fecha);
          const fechaFormateada = fechaCreacion.toLocaleDateString("es-ES", { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'});
          let contenido = '';
          let referenciaAutor = '';
          const emoji = contribucionRama2.emoji || '☺+';

          // Manejar el contenido basado en el tipo
          if (contribucionRama2.tipo === 2) {
            contenido = `<center><img class="imageWrapper" src="/uploads/${contribucionRama2.contenido}" style="width:50%;height:30%;margin-left:100px" /></center>`;
          } else if (contribucionRama2.tipo === 3) {
            const [url, linkText] = contribucionRama2.contenido.split(',');
            contenido = `<a href="${url}" target="_blank">${linkText || url}</a>`;
          } else {
            contenido = contribucionRama2.contenido;
          }

          // Separar el contenido en dos partes si tiene referencia al autor
          if (contenido.includes('<p>')) {
            const inicioReferenciaAutor = contenido.indexOf('<p>');
            const finReferenciaAutor = contenido.indexOf('</p>', inicioReferenciaAutor);
            referenciaAutor = contenido.substring(inicioReferenciaAutor, finReferenciaAutor + 4); // Incluye el cierre </p>
            contenido = contenido.substring(finReferenciaAutor + 4); // Obtiene el contenido después de la referencia al autor
            // Clasificar el contenido como imagen o enlace
            if (contribucionRama2.tipo === 2) {
              contenido = `<center><img class="imageWrapper" src="/uploads/${contenido}</center>`;
            } else if (contribucionRama2.tipo === 3) {
              contenido = `<a href="${contenido}" target="_blank">${contenido}</a>`;
            }
          }

          if (rama === 3) {
            getReaccionCountAndSetEmoji(contribucionRama2.id_contribucion);
            const nombrePropietario = contribucionRama2.propietario === 2 ? `Profesor ${contribucionRama2.nombre_profesor}` : contribucionRama2.nombre_alumno;
            const styleBackground = contribucionRama2.propietario ===  2 ? 'background-color: #fff0bde8;' : '';

            const element = `
             <li id="${contribucionRama2.id_contribucion}listElement">
            <div class="sub-coment3" id="comment${contribucionRama2.id_contribucion}"${styleBackground ? `style="${styleBackground}"` : ''}>
             <p id= ${contribucionRama2.id_contribucion_compartida} class=respondioa><span style= font-size:18px; >↶</span> Respondió a ${nombreAlumno}</p>
                <div class="UsuarioComen">
                  ${nombrePropietario}
                  <div class="fecha-creacion" id="alumnoid${contribucionRama2.idAlumno}">${fechaFormateada}</div>
                <img src="https://cdn-icons-png.flaticon.com/512/61/61140.png" alt="Botón" class="acciones3" id="alumnoid${contribucionRama2.idAlumno}">
              </div>
              ${referenciaAutor ? `<div class="copiado">${referenciaAutor}</div>` : ''}
              <div class="coment-cuerpo" id="rama1tipo${contribucionRama2.tipo}">${contenido}</div>
              <div class="coment-pie">
                <span id="userEmojis${contribucionRama2.id_contribucion}" class="userEmojis"></span>
                <div id="emojiIcon${contribucionRama2.id_contribucion}" class="reacciones" data-reaction-id="${contribucionRama2.id_reaccion || ''}">${emoji}</div>
                <div id="tablaEmojis${contribucionRama2.id_contribucion}" class="emojiTable" style="display: none;">
                  <table id="emojisTable" onclick="seleccionarEmoji(event)">
                    <tr>
                      <td><span class="emoji">👍</span></td>
                      <td><span class="emoji">👎</span></td>
                      <td><span class="emoji">❤️</span></td>
                    </tr>
                  </table>
                </div>
                <span id="numComentarios3${contribucionRama2.id_contribucion}" class="ncoment" onclick="toggleSubcomments3('comment3${contribucionRama2.id_contribucion}')"></span>
                <div class="contenedor">
                          <img src="/images/responder.png" alt="Botón" class="responder3">
                          <div class="mensaje" id="mensaje">Responder a ${nombrePropietario}</div>
                </div>
              </div>
            </div>
            <div class="sub-comentario4" id="comment3${contribucionRama2.id_contribucion}Subcomments" style="display: none"></div>
            </li>`;

            // Añadir el comentario al DOM
            $(`#comment2${idContribucion}Subcomments`).append(element);

            // Manejar click en el icono de emoji
            $(`#emojiIcon${contribucionRama2.id_contribucion}`).click(function () {
              const id_contribucion = $(this).attr("id").substring(9);
              $(`#tablaEmojis${id_contribucion}`).toggle();
            });

            updateReactionCount(contribucionRama2.id_contribucion);

            verificarYMostrarRama4(contribucionRama2.id_contribucion, 4, nombrePropietario);
          }
        });

        $(document).on("click", ".responder3", function () {
          editmode = false;
          $("#textArea").val("");
          ramacontribucion = 4;
          ContributionId = $(this).closest(".sub-coment3").attr("id").substring(7);
          $("#selectMosaicSpace").show();
          $("#texto").val("");
          $("#nombreLinkArea").val("");
          $("#linkArea").val("");
          var div = document.getElementById("imagencargada");
          div.innerHTML = "";
        });
      }
    },
    error: function (xhr, status, error) {
      console.error("Error en verificarYMostrarRamas:", error);
    }
  });
}

function verificarYMostrarRama4(idContribucion, rama, nombreAlumno) {
  $.ajax({
    type: 'GET',
    url: `/api/foro/contribucionescompartidas/${idContribucion}?rama=${rama}`,
    dataType: 'json',
    success: function (res) {
      if (res.length > 0) {
        const numComentarios = res.length;
        const numComentariosElement = $(`#numComentarios4${idContribucion}`);
        if (numComentariosElement.length > 0) {
          const nuevoTexto = numComentarios === 1 ? `Ver ${numComentarios} comentario` : `Ver ${numComentarios} comentarios`;
          numComentariosElement.text(nuevoTexto);
        }
        res.forEach(function (contribucionRama2) {
          const fechaCreacion = new Date(contribucionRama2.fecha);
          const fechaFormateada = fechaCreacion.toLocaleDateString("es-ES", { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'});
          let contenido;
          let referenciaAutor;
          const emoji = contribucionRama2.emoji || '☺+';

          if (contribucionRama2.tipo === 2) {
            contenido = `<center><img class="imageWrapper" src="/uploads/${contribucionRama2.contenido}" style="width:50%;height:30%;margin-left:100px" /></center>`;
          } else if (contribucionRama2.tipo === 3) {
            const [url, linkText] = contribucionRama2.contenido.split(',');
            contenido = `<a href="${url}" target="_blank">${linkText || url}</a>`;
          } else {
            contenido = contribucionRama2.contenido;
          }

          if (contenido.includes('<p>')) {
            const inicioReferenciaAutor = contenido.indexOf('<p>');
            const finReferenciaAutor = contenido.indexOf('</p>', inicioReferenciaAutor);
            referenciaAutor = contenido.substring(inicioReferenciaAutor, finReferenciaAutor + 4);
            contenido = contenido.substring(finReferenciaAutor + 4);
            // Clasificar el contenido como imagen o enlace
            if (contribucionRama2.tipo === 2) {
              contenido = `<center><img class="imageWrapper" src="/uploads/${contenido}</center>`;
            } else if (contribucionRama2.tipo === 3) {
              contenido = `<a href="${contenido}" target="_blank">${contenido}</a>`;
            }
          }
          if (rama === 4) {
            getReaccionCountAndSetEmoji(contribucionRama2.id_contribucion);
            const nombrePropietario = contribucionRama2.propietario === 2 ? `Profesor ${contribucionRama2.nombre_profesor}` : contribucionRama2.nombre_alumno;
            const idalumnooprofesor = contribucionRama2.propietario === 2 ? contribucionRama2.idProfesor : contribucionRama2.idAlumno;
            const styleBackground = contribucionRama2.propietario === 2 ? 'background-color: #fef2cce8;' : '';
            console.log("Rama", rama);
            const element = `
             <li id="${contribucionRama2.id_contribucion}listElement">
            <div class="sub-coment4" id="comment${contribucionRama2.id_contribucion}" ${styleBackground ? `style="${styleBackground}"` : ''}>
                <p id= ${contribucionRama2.id_contribucion_compartida} class=respondioa><span style= font-size:18px; >↶</span> Respondió a ${nombreAlumno}</p>
                <div class="UsuarioComen">
                  ${nombrePropietario}
                  <div class="fecha-creacion" id="alumnoid${contribucionRama2.idAlumno}">${fechaFormateada}</div>
                  <img src="https://cdn-icons-png.flaticon.com/512/61/61140.png" alt="Botón" class="acciones4" id="alumnoid${contribucionRama2.idAlumno}">
                </div>
                 ${referenciaAutor ? `<div class="copiado">${referenciaAutor}</div>` : ''}
                <div class="coment-cuerpo" id="rama1tipo${contribucionRama2.tipo}">${contenido}</div>
                <div class="coment-pie" >
                  <span id="userEmojis${contribucionRama2.id_contribucion}" class="userEmojis"></span>
                  <div id="emojiIcon${contribucionRama2.id_contribucion}" class="reacciones" data-reaction-id="${contribucionRama2.id_reaccion || ''}">${emoji}</div>
                  <div id="tablaEmojis${contribucionRama2.id_contribucion}" class="emojiTable" style="display: none;">
                    <table id="emojisTable" onclick="seleccionarEmoji(event)">
                      <tr>
                        <td><span class="emoji">👍</span></td>
                        <td><span class="emoji">👎</span></td>
                        <td><span class="emoji">❤️</span></td>                        
                      </tr>
                    </table>
                  </div>                 
                  <span id="numComentarios4${contribucionRama2.id_contribucion}" class="ncoment" onclick="toggleSubcomments4('comment4${contribucionRama2.id_contribucion}')"></span>
                  <div class="contenedor">
                          <img src="/images/responder.png" alt="Botón" class="responder4">
                          <div class="mensaje" id="mensaje">Responder a ${nombrePropietario}</div>
                      </div>
                </div>
              </div>
              <div class="sub-comentario5" id="comment4${contribucionRama2.id_contribucion}Subcomments" style="display: none"></div>
              </li>`;
            verificarYMostrarRama5(contribucionRama2.id_contribucion, 5, nombrePropietario);
            $(`#comment3${idContribucion}Subcomments`).append(element);

            $(`#emojiIcon${contribucionRama2.id_contribucion}`).click(function () {
              var id_contribucion = $(this).attr("id").substring(9);
              $(`#tablaEmojis${id_contribucion}`).toggle();
            });
            updateReactionCount(contribucionRama2.id_contribucion);
          }
        });
        $(document).on("click", ".responder4", function () {
          editmode = false;
          $("#textArea").val("");
          ramacontribucion = 5;
          ContributionId = $(this).closest(".sub-coment4").attr("id").substring(7);
          console.log("La contribucion es:", ContributionId);
          console.log("Hola, mi rama es:", ramacontribucion);
          $("#selectMosaicSpace").show();
          $("#texto").val("");
          $("#nombreLinkArea").val("");
          $("#linkArea").val("");
          var div = document.getElementById("imagencargada");
          div.innerHTML = "";
        });
      }
    },
    error: function (xhr, status, error) {
      console.error("Error en verificarYMostrarRamas:", error);
    }
  });
};


function verificarYMostrarRama5(idContribucion, rama, nombreAlumno) {
  $.ajax({
    type: 'GET',
    url: `/api/foro/contribucionescompartidas/${idContribucion}?rama=${rama}`,
    dataType: 'json',
    success: function (res) {
      if (res.length > 0) {
        const numComentarios = res.length;
        const numComentariosElement = $(`#numComentarios4${idContribucion}`);
        if (numComentariosElement.length > 0) {
          const nuevoTexto = numComentarios === 1 ? `Ver ${numComentarios} comentario` : `Ver ${numComentarios} comentarios`;
          numComentariosElement.text(nuevoTexto);
        }
        res.forEach(function (contribucionRama2) {
          const fechaCreacion = new Date(contribucionRama2.fecha);
          const fechaFormateada = fechaCreacion.toLocaleDateString("es-ES", { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'});
          let contenido;
          let referenciaAutor;
          const emoji = contribucionRama2.emoji || '☺+';

          if (contribucionRama2.tipo === 2) {
            contenido = `<center><img class="imageWrapper" src="/uploads/${contribucionRama2.contenido}" style="width:50%;height:30%;margin-left:100px" /></center>`;
          } else if (contribucionRama2.tipo === 3) {
            const [url, linkText] = contribucionRama2.contenido.split(',');
            contenido = `<a href="${url}" target="_blank">${linkText || url}</a>`;
          } else {
            contenido = contribucionRama2.contenido;
          }

          // Separar el contenido en dos partes
          if (contenido.includes('<p>')) {
            const inicioReferenciaAutor = contenido.indexOf('<p>');
            const finReferenciaAutor = contenido.indexOf('</p>', inicioReferenciaAutor);
            referenciaAutor = contenido.substring(inicioReferenciaAutor, finReferenciaAutor + 4); // Incluye el cierre </p>
            contenido = contenido.substring(finReferenciaAutor + 4); // Obtiene el contenido después de la referencia al autor
            // Clasificar el contenido como imagen o enlace
            if (contribucionRama2.tipo === 2) {
              contenido = `<center><img class="imageWrapper" src="/uploads/${contenido}</center>`;
            } else if (contribucionRama2.tipo === 3) {
              contenido = `<a href="${contenido}" target="_blank">${contenido}</a>`;
            }
          }

          // Clasificar el contenido como imagen o enlace
          if (contribucionRama2.tipo === 2) {
            contenido = `<center><img class="imageWrapper" src="/uploads/${contenido}" style="width:50%;height:30%;margin-left:100px" /></center>`;
          } else if (contribucionRama2.tipo === 3) {
            contenido = `<a href="${contenido}" target="_blank">${contenido}</a>`;
          }
          if (rama === 5) {
            getReaccionCountAndSetEmoji(contribucionRama2.id_contribucion);
            const nombrePropietario = contribucionRama2.propietario === 2 ? `Profesor ${contribucionRama2.nombre_profesor}` : contribucionRama2.nombre_alumno;
            const idalumnooprofesor = contribucionRama2.propietario === 2 ? contribucionRama2.idProfesor : contribucionRama2.idAlumno;
            const styleBackground = contribucionRama2.propietario === 2 ? 'background-color: #fdf6e0e8;' : '';
            console.log("Rama", rama);
            const element = `
             <li id="${contribucionRama2.id_contribucion}listElement">
            <div class="sub-coment5" id="comment${contribucionRama2.id_contribucion}"  ${styleBackground ? `style="${styleBackground}"` : ''}>
                <p id= ${contribucionRama2.id_contribucion_compartida} class=respondioa><span style= font-size:18px; >↶</span> Respondió a ${nombreAlumno}</p>
                <div class="UsuarioComen">
                  ${nombrePropietario}
                  <div class="fecha-creacion" id="alumnoid${contribucionRama2.idAlumno}">${fechaFormateada}</div>
                  <img src="https://cdn-icons-png.flaticon.com/512/61/61140.png" alt="Botón" class="acciones5" id="alumnoid${contribucionRama2.idAlumno}">
                </div>
                 ${referenciaAutor ? `<div class="copiado">${referenciaAutor}</div>` : ''}
                <div class="coment-cuerpo" id="rama1tipo${contribucionRama2.tipo}">${contenido}</div>
                <div class="coment-pie" >
                  <span id="userEmojis${contribucionRama2.id_contribucion}" class="userEmojis"></span>
                  <div id="emojiIcon${contribucionRama2.id_contribucion}" class="reacciones" data-reaction-id="${contribucionRama2.id_reaccion || ''}">${emoji}</div>
                  <div id="tablaEmojis${contribucionRama2.id_contribucion}" class="emojiTable" style="display: none;">
                    <table id="emojisTable" onclick="seleccionarEmoji(event)">
                      <tr>
                        <td><span class="emoji">👍</span></td>
                        <td><span class="emoji">👎</span></td>
                        <td><span class="emoji">❤️</span></td>                        
                      </tr>
                    </table>
                  </div>                 
                </div>
              </div>
              </li>`;
            $(`#comment4${idContribucion}Subcomments`).append(element);

            $(`#emojiIcon${contribucionRama2.id_contribucion}`).click(function () {
              var id_contribucion = $(this).attr("id").substring(9);
              $(`#tablaEmojis${id_contribucion}`).toggle();
            });
            updateReactionCount(contribucionRama2.id_contribucion);
          }
        });
      }
    },
    error: function (xhr, status, error) {
      console.error("Error en verificarYMostrarRamas:", error);
    }
  });
};

async function copiarContribucion(contributionId, userId, nombre_alumno) {
  const tablaAccionesEdicionId = `#TablaAccionesEdicion${contributionId}`;
  try {
    const confirmacion = await swal.fire({
      title: "¿Estás seguro de que deseas copiar esta contribución?",
      text: "Al copiar una contribución se mostrará el nombre del autor.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, copiar con responsabilidad",
      cancelButtonText: "Cancelar"
    });

    if (!confirmacion.isConfirmed) {
      return;
    }

    const response = await fetch(`/api/foro/contribuciones/copiarcontribucion/${contributionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId: userId, nombreAlumno: nombre_alumno }) // Incluir nombreAlumno en el cuerpo de la solicitud
    });

    if (!response.ok) {
      throw new Error('Error al copiar la contribución');
    }

    const newContribution = await response.json();

    swal.fire({
      title: "La contribución ha sido copiada",
      text: "",
      icon: "success",
      timer: 1000,
      showConfirmButton: false
    }).then(async (result) => {
      if (result.isConfirmed || result.isDismissed) {
        const { rama } = newContribution; // Suponiendo que la respuesta contiene el campo 'rama'
        if (rama === 1) {
          await generarrama1(newContribution);
          $(tablaAccionesEdicionId).hide();
        } else if (rama === 2) {
          await generarrama2(newContribution);
          $(tablaAccionesEdicionId).hide();
        } else if (rama === 3) {
          await generarrama3(newContribution);
          $(tablaAccionesEdicionId).hide();
        } else if (rama === 4) {
          await generarrama4(newContribution);
          $(tablaAccionesEdicionId).hide();
        } else if (rama === 5) {
          await generarrama5(newContribution);
          $(tablaAccionesEdicionId).hide();
        }
      }
    });
  } catch (error) {
    console.error('Error:', error);
    alert('Ocurrió un error al copiar la contribución');
  }
}




function deleteContribucion(contributionId, rama, idcomentariocuenta) {
  console.log("Eliminando");
  swal.fire({
    title: "¿Estás seguro que deseas eliminar tu contribución?",
    text: "Lo que opinaste del tema será eliminado",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#DD6B55",
    confirmButtonText: "Sí, deseo eliminarla",
    cancelButtonText: "Cancelar",
    allowOutsideClick: false,
    allowEscapeKey: false
  }).then((result) => {
    if (result.isConfirmed) {
      $.ajax({
        type: 'DELETE',
        url: '/api/foro/contribuciones/' + contributionId,
        dataType: 'json',
        success: function () {
          // The UI update is now handled by the 'contribucion_eliminada' socket event
          swal.fire({
            title: "La contribución ha sido eliminada correctamente",
            text: "",
            icon: "success",
            timer: 1000,
            showConfirmButton: false
          });
        },
        error: function (xhr, status, error) {
          console.error("Error al eliminar la contribución:", error);
          swal.fire({
            title: "Error al eliminar la contribución",
            text: "Ocurrió un problema al intentar eliminar la contribución. Por favor, intenta nuevamente.",
            icon: "error"
          });
        }
      });
    } else if (result.isDismissed) {
      console.log("Eliminación cancelada");
    }
  }).catch((error) => {
    console.error("Error al mostrar el diálogo de confirmación:", error);
  });
}

function updateCommentCount(rama, idcomentariocuenta, incremento) {
  let commentCountElem;

  switch (rama) {
    case 2:
      commentCountElem = $(`#numComentarios${idcomentariocuenta}`);
      break;
    case 3:
      commentCountElem = $(`#numComentarios${idcomentariocuenta}`);
      break;
    case 4:
      commentCountElem = $(`#numComentarios3${idcomentariocuenta}`);
      break;
    case 5:
      commentCountElem = $(`#numComentarios4${idcomentariocuenta}`);
      break;
    default:
      commentCountElem = $(`#numComentarios5${idcomentariocuenta}`);
      break;
  }

  let currentText = commentCountElem.text();
  let currentCount = parseInt(currentText.match(/\d+/)[0]);

  if (!isNaN(currentCount)) {
    let newCount = currentCount + incremento;
    if (newCount > 0) {
      commentCountElem.text(`Ocultar ${newCount} comentario${newCount !== 1 ? 's' : ''}`);
    } else {
      commentCountElem.text(''); // Mostrar vacío cuando el contador es 0
    }
  }
}

// Manejador para el botón de aceptar la imagen subida
document.getElementById('botonimagenAceptar').onclick = function() {
  enviarImagenAlServidor();
};

//CONTRIBUCION POR TEXTO
document.getElementById('botonAceptarTexto').addEventListener('click', function () {
  var contenido = document.getElementById('texto').value;
  var tipo = 1;
  var rama = ramacontribucion;
  var propietario = 2;
  if (contenido.trim() === '') {
    alert('Por favor, escribe algo antes de crear la contribución.');
    return;
  }
  var idForo = localStorage.getItem('idForo');
  var idAlumno = null;
  var idProfesor = localStorage.getItem('idProfesor');
  var id_contribucion = ContributionId;

  crearContribucion(contenido, tipo, rama, propietario, idForo, idAlumno, idProfesor,id_contribucion);
});


//CONTRIBUCION POR ENLACE
document.getElementById('okLink').addEventListener('click', function () {
  var link = document.getElementById('linkArea').value;
  var nombreLink = document.getElementById('nombreLinkArea').value;
  var contenido = link + "," + nombreLink;

  if (link.trim() === '' || nombreLink.trim() === '') {
    alert('Por favor, escriba una URL y un nombre para la URL antes de crear la contribución.');
    return;
  }

  var tipo = 3;
  var rama = ramacontribucion;
  var propietario = 2;
  var idForo = localStorage.getItem('idForo');
  var idAlumno = null;
  var idProfesor = localStorage.getItem('idProfesor');
  var id_contribucion = ContributionId;

  crearContribucion(contenido, tipo, rama, propietario, idForo, idAlumno, idProfesor,id_contribucion);
});
//CONTRIBUCION POR IMAGEN
function enviarImagenAlServidor() {
  var tipo = 2;
  var botonAceptar = document.getElementById('botonimagenAceptar');
  botonAceptar.disabled = true; // Deshabilitar el botón para evitar múltiples envíos

  var rama = ramacontribucion;
  var propietario = 2;
  var idForo = localStorage.getItem('idForo');
  var idAlumno = null 
  var idProfesor = localStorage.getItem('idProfesor');
  var id_contribucion = ContributionId;

  // Obtener la imagen mostrada en 'imagencargada'
  var imagencargada = document.getElementById('imagencargada').querySelector('img');

  // Crear un canvas para dibujar la imagen con su tamaño original
  var canvas = document.createElement('canvas');
  var context = canvas.getContext('2d');

  // Configurar el tamaño del canvas para que coincida con el tamaño original de la imagen
  canvas.width = imagencargada.naturalWidth;
  canvas.height = imagencargada.naturalHeight;

  // Dibujar la imagen en el canvas
  context.drawImage(imagencargada, 0, 0);

  // Convertir la imagen en un blob JPEG
  canvas.toBlob(function (blob) {
    var formData = new FormData();
    formData.append('photo', blob, 'photo.jpg'); // Agregar la imagen al FormData

    // Enviar la imagen al servidor
    $.ajax({
      url: '/api/photo',
      type: 'POST',
      data: formData,
      processData: false,
      contentType: false,
      success: function (data) {
        // The server now returns a clean JSON response
        crearContribucion(data.filename, tipo, rama, propietario, idForo, idAlumno, idProfesor,id_contribucion);
        botonAceptar.disabled = false; // Re-habilitar el botón en caso de éxito
      },
      error: function (jqXHR, textStatus, errorThrown) {
        console.error('File upload failed: ' + textStatus, errorThrown);
        botonAceptar.disabled = false; // Re-habilitar el botón en caso de error
      }
    });
  }, 'image/jpeg');
}

function crearContribucion(contenido, tipo, rama, propietario, idForo, idAlumno, idProfesor, id_contribucion) {
  var Id = ContributionId; 
  var datos = {
    contenido: contenido,
    rama: rama,
    tipo: tipo,
    propietario: propietario,
    id_foro: idForo, // Corregido para usar el parámetro
    id_alumno: idAlumno, // Corregido para usar el parámetro
    id_profesor: idProfesor,
    id_contribucioncompartida: Id,
  };

  const tablaAccionesEdicionId = `#TablaAccionesEdicion${ContributionId}`;
  if (editmode) {
    updateContribution(ContributionId, tipo, contenido)
      .then((response) => {
        if (tipo == 1) {
          $("#selectMosaicSpace").hide();
          $("#workspaceMode").hide();
          $("#createObjectBtn").show();
          $(tablaAccionesEdicionId).hide();
        } else if (tipo == 2) {
          $("#selectMosaicSpace").hide();
          $("#SubirFoto").hide();
          $("#createObjectBtn").show();
          $(tablaAccionesEdicionId).hide();
        } else if (tipo == 3) {
          $("#selectMosaicSpace").hide();
          $("#linkMode").hide();
          $("#createObjectBtn").show();
          $(tablaAccionesEdicionId).hide();
        }
        swal.fire("Contribución actualizada exitosamente", "", "success")
          .then((result) => {
            if (result.isConfirmed || result.isDismissed) {
              // La actualización del DOM ahora es manejada por el evento de socket 'contribucion_actualizada'
              // para mantener la consistencia en todos los clientes.
              console.log('Contribución actualizada:', response);
              editmode = false;
              $("#textArea").val("");
              $("#texto").val("");
              contenido = "";
            }
          });
      });
  } else {
    $.ajax({
      type: 'POST',
      url: '/api/foro/crearcontribucion/',
      data: JSON.stringify(datos),
      contentType: 'application/json',
      success: function (response) {
        if (tipo == 1) {
          $("#workspaceMode").hide();
        } else if (tipo == 2) {
          $("#SubirFoto").hide();
        } else if (tipo == 3) {
          $("#linkMode").hide();
        }
        $("#selectMosaicSpace").hide();
        $("#createObjectBtn").show();
        $(tablaAccionesEdicionId).hide();
        swal.fire("Contribución creada exitosamente", "¡Gracias por tu contribución!", "success");
        console.log('Contribución creada:', response);
        document.getElementById('texto').value = '';
      },
      error: function (xhr, status, error) {
        console.error('Error al crear la contribución:', error);
        alert('Ocurrió un error al crear la contribución.');
      }
    });
  }

}


async function generarrama1(response) {
  // Obtener el contenedor contributions_list
  const contributionsList = document.getElementById('contributions_list');
  try {
    const idContribucion = response.id_contribucion;

    
    const rama = response.rama;

    const nombresResponse = await $.ajax({
      type: 'GET',
      url: `/api/foro/contribuciones/${idContribucion}/${rama}`,
      dataType: 'json'
    });

    if (nombresResponse && nombresResponse.length > 0) {
      const nombreAlumno = nombresResponse[0].nombre_alumno;
      const nombreProfesor = nombresResponse[0].nombre_profesor;

      // Obtener la fecha de creación formateada
      const fechaCreacion = new Date(response.fecha);
      const fechaFormateada = fechaCreacion.toLocaleDateString("es-ES", { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'});

      const nombrePropietario = response.propietario === 2 ? `Profesor ${nombreProfesor}` : nombreAlumno;
      const idAlumnoProfesor = response.propietario === 2 ? response.idProfesor : response.idAlumno;
      const styleBackground = response.propietario === 2 ? 'background-color: #f7e29ee8;' : '';

      let contenido;
      let referenciaAutor = '';

      // Manejo del contenido según el tipo
      if (response.tipo === 2) {
        contenido = `<center><img class="imageWrapper" src="/uploads/${response.contenido}" style="width:50%;height:30%;margin-left:100px" /></center>`;
      } else if (response.tipo === 3) {
        const [url, linkText] = response.contenido.split(',');
        contenido = `<a href="${url}" target="_blank">${linkText || url}</a>`;
      } else {
        contenido = response.contenido;
      }

      // Separar el contenido en caso de incluir referencia al autor
      if (contenido.includes('<p>')) {
        const inicioReferenciaAutor = contenido.indexOf('<p>');
        const finReferenciaAutor = contenido.indexOf('</p>', inicioReferenciaAutor);
        referenciaAutor = contenido.substring(inicioReferenciaAutor, finReferenciaAutor + 4); // Incluye el cierre </p>
        contenido = contenido.substring(finReferenciaAutor + 4); // Obtiene el contenido después de la referencia al autor
        console.log(referenciaAutor);
        console.log(contenido);
        if (response.tipo === 2) {
          contenido = `<center><img class="imageWrapper" src="/uploads/${contenido}</center>`;
        } else if (response.tipo === 3) {
          contenido = `<a href="${contenido}</a>`;
        }
      }

      // Construir el contenido HTML de la contribución
      let contenidoHtml = `
        <li id="${response.id_contribucion}listElement">
          <div class="comentario" id="comentario${response.id_contribucion}"${styleBackground ? `style="${styleBackground}"` : ''}>
            <div class="UsuarioComen" >
              ${nombrePropietario}  
              <div class="fecha-creacion" id="alumnoid${response.id_alumno}">${fechaFormateada}</div>
              <img src="https://cdn-icons-png.flaticon.com/512/61/61140.png" alt="Botón" class="acciones" id="acciones${response.id_contribucion}">
            </div>
            ${referenciaAutor ? `<div class="copiado">${referenciaAutor}</div>` : ''}
            <div class="coment-cuerpo" id="rama1tipo${response.tipo}">
              ${contenido}
            </div>
            <div class="coment-pie">
            <span id="userEmojis${response.id_contribucion}" class="userEmojis"></span>
              <div id="emojiIcon${response.id_contribucion}" class="reacciones">${response.emoji || '☺+'}</div>
              <div id="tablaEmojis${response.id_contribucion}" class="emojiTable" style="display: none;">
                <table id="emojisTable">
                  <tr>
                    <td><span class="emoji">👍</span></td>
                    <td><span class="emoji">👎</span></td>
                    <td><span class="emoji">❤️</span></td>
                  </tr>
                </table>
              </div>
              <span id="numComentarios${response.id_contribucion}" class="ncoment" onclick="toggleSubcomments('comment${response.id_contribucion}')"></span>
             <div class="contenedor">
                <img src="/images/responder.png" alt="Botón" class="responder">
                <div class="mensaje" id="mensaje">Responder a ${nombreAlumno}</div>
              </div>
            </div>
          </div>
          <div class="sub-comentario" id="comment${response.id_contribucion}Subcomments" style="display: none;"></div>
        </li>
      `;

      // Añadir la nueva contribución al principio de contributions_list
      contributionsList.insertAdjacentHTML('afterbegin', contenidoHtml);

      // Hacer la nueva contribución arrastrable
      makeContributionDraggable(response.id_contribucion);

      // Event listener para mostrar/ocultar emojis
      $(`#emojiIcon${response.id_contribucion}`).click(function () {
        $(`#tablaEmojis${response.id_contribucion}`).toggle();
      });

      // Event listener para acciones (editar, eliminar, copiar)
      $(document).on("click", `.acciones${response.id_contribucion}`, function () {
        const tablaAccionesEdicionId = `#TablaAccionesEdicion${response.id_contribucion}`;
        if ($(tablaAccionesEdicionId).length === 0) {
          let accionesHtml = `<div class="TablaAccionesEdicion" id="TablaAccionesEdicion${response.id_contribucion}">`;
          accionesHtml += `
            <img class="iconoeditar" src="/images/editar.png">
            <img class="iconoeliminar" src="/images/eliminar.png">
            <img class="iconocopiar" src="/images/copiar.png">
          `;
          accionesHtml += `</div>`; // Agrega el cierre de la div de acciones
          $(`#comentario${response.id_contribucion}`).append(accionesHtml);
          $(tablaAccionesEdicionId).hide();
        } else {
          $(tablaAccionesEdicionId).toggle();
        }
      });

      // Actualizar contador de reacciones
      updateReactionCount(response.id_contribucion);

      // Verificar y mostrar rama 2
      verificarYMostrarRama2(response.id_contribucion, 2, nombreAlumno);
    } else {
      console.error('No se encontraron nombres de alumno y profesor en la respuesta de la API.');
      alert('Error: No se encontraron nombres de alumno y profesor.');
    }
  } catch (error) {
    console.error('Error al obtener nombres de alumno y profesor:', error);
    alert('Error al obtener nombres de alumno y profesor. Inténtalo de nuevo más tarde.');
  }
}






async function generarrama2(response) {
  const contributionsList = document.getElementById('contributions_list'); // Obtener el contenedor contributions_list

  try {
    const idContribucion = response.id_contribucion;
    const rama = response.rama;
    const idContribucionCompartida = response.id_contribucion_compartida; // Nuevo campo para identificar la contribución compartida

    console.log('ID Contribución:', idContribucion);
    console.log('Rama:', rama);
    console.log('ID Contribución Compartida:', idContribucionCompartida);

    // Realizar una solicitud GET para obtener nombres de alumno y profesor
    const nombresResponse = await $.ajax({
      type: 'GET',
      url: `/api/foro/contribuciones/${idContribucion}/${rama}`,
      dataType: 'json'
    });

    if (nombresResponse && nombresResponse.length > 0) {
      const nombreAlumno = nombresResponse[0].nombre_alumno;
      const nombreProfesor = nombresResponse[0].nombre_profesor;
      const nombreautor=nombresResponse[0].nombre_alumno_contribucion_compartida;
      const id_contribucion_compartida = nombresResponse[0].id_contribucion_compartida;

      console.log('Nombre Alumno:', nombreAlumno);
      console.log('Nombre Profesor:', nombreProfesor);
      console.log('ID Contribución Compartida en respuesta:', id_contribucion_compartida);

      // Formatear la fecha de creación
      const fechaCreacion = new Date(response.fecha);
      const fechaFormateada = fechaCreacion.toLocaleDateString("es-ES", { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'});

      // Determinar el propietario y el estilo de fondo
      const nombrePropietario = response.propietario === 2 ? `Profesor ${nombreProfesor}` : nombreAlumno;
      const styleBackground = response.propietario === 2 ? 'background-color: #f7e29ee8;' : '';

      let contenido;
      let referenciaAutor = '';

      // Manejar el contenido según el tipo de contribución
      if (response.tipo === 2) {
        contenido = `<center><img class="imageWrapper" src="/uploads/${response.contenido}" style="width:50%;height:30%;margin-left:100px" /></center>`;
      } else if (response.tipo === 3) {
        const [url, linkText] = response.contenido.split(',');
        contenido = `<a href="${url}" target="_blank">${linkText || url}</a>`;
      } else {
        contenido = response.contenido;
      }

      // Separar el contenido en caso de incluir referencia al autor
      if (contenido.includes('<p>')) {
        const inicioReferenciaAutor = contenido.indexOf('<p>');
        const finReferenciaAutor = contenido.indexOf('</p>', inicioReferenciaAutor);
        referenciaAutor = contenido.substring(inicioReferenciaAutor, finReferenciaAutor + 4); // Incluye el cierre </p>
        contenido = contenido.substring(finReferenciaAutor + 4); // Obtiene el contenido después de la referencia al autor
        console.log(referenciaAutor);
        console.log(contenido);
        if (response.tipo === 2) {
          contenido = `<center><img class="imageWrapper" src="/uploads/${contenido}</center>`;
        } else if (response.tipo === 3) {
          contenido = `<a href="${contenido}</a>`;
        }
      }

      // Construir el contenido HTML de la contribución
      const contenidoHtml = `
      <li id="${response.id_contribucion}listElement">
        <div class="sub-coment" id="comment${response.id_contribucion}"${styleBackground ? `style="${styleBackground}"` : ''}>
          <p id= ${id_contribucion_compartida} class=respondioa ><span style= font-size:18px; >↶</span> Respondió a ${nombreautor}</p>
          <div class="UsuarioComen" >
            ${nombrePropietario}  
              <div class="fecha-creacion" id="alumnoid${response.idAlumno}">${fechaFormateada}</div>
            <img src="https://cdn-icons-png.flaticon.com/512/61/61140.png" alt="Botón" class="acciones2" id="alumnoid${response.id_alumno}">
          </div>
          ${referenciaAutor ? `<div class="copiado">${referenciaAutor}</div>` : ''}
          <div class="coment-cuerpo" id="rama1tipo${response.tipo}">
            ${contenido}
          </div>
          <div class="coment-pie">
          <span id="userEmojis${response.id_contribucion}" class="userEmojis"></span>
            <div id="emojiIcon${response.id_contribucion}" class="reacciones" data-reaction-id="${response.id_reaccion || ''}">${response.emoji || '☺+'}</div>
            <div id="tablaEmojis${response.id_contribucion}" class="emojiTable" style="display: none;">
              <table id="emojisTable" onclick="seleccionarEmoji(event)">
                <tr>
                  <td><span class="emoji">👍</span></td>
                  <td><span class="emoji">👎</span></td>
                  <td><span class="emoji">❤️</span></td>
                </tr>
              </table>
            </div>
            <span id="numComentarios${response.id_contribucion}" class="ncoment" onclick="toggleSubcomments('comment${response.id_contribucion}')"></span>
              <div class="contenedor">
                <img src="/images/responder.png" alt="Botón" class="responder2">
                <div class="mensaje" id="mensaje">Responder a ${nombreAlumno}</div>
              </div>
          </div>
        </div>
        <div class="sub-comentario3" id="comment2${response.id_contribucion}Subcomments" style="display: none;"></div>
        </li>
      `;

      // Encontrar la contribución principal por id_contribucion_compartida
      const subComentariosContainer = document.getElementById(`comment${id_contribucion_compartida}Subcomments`);

      // Verificar si se encontró la contribución principal
      if (subComentariosContainer) {
        // Insertar el HTML generado al principio del contenedor subComentariosContainer
        subComentariosContainer.insertAdjacentHTML('afterbegin', contenidoHtml);

        // Actualizar el contador de comentarios de la contribución principal
      // Incrementar el contador de comentarios
      const numComentariosElement = $(`#numComentarios${id_contribucion_compartida}`);
      if (numComentariosElement.length > 0) {
        if (numComentariosElement.text().trim() === '') {
          numComentariosElement.text(`Ocultar 1 comentario`);
        } else {
          const currentText = numComentariosElement.text();
          const currentCount = parseInt(currentText.split(' ')[1]);
          const newCount = currentCount + 1;
          numComentariosElement.text(`Ocultar ${newCount} comentarios`);
        }
        subComentariosContainer.style.display = 'block';
      }

        // Mensajes de consola para depuración
        console.log(`Nueva contribución agregada dentro de subComentariosContainer con id ${id_contribucion_compartida}`);
      } else {
        console.error('No se encontró el contenedor de subcomentarios con id_contribucion_compartida:', id_contribucion_compartida);
      }

      // Event listener para mostrar/ocultar emojis
      $(`#emojiIcon${response.id_contribucion}`).click(function () {
        $(`#tablaEmojis${response.id_contribucion}`).toggle();
      });

      // Event listener para acciones (editar, eliminar, copiar)
      $(document).on("click", `.acciones2${response.id_contribucion}`, function () {
        const tablaAccionesEdicionId = `#TablaAccionesEdicion${response.id_contribucion}`;
        if ($(tablaAccionesEdicionId).length === 0) {
          let accionesHtml = `<div class="TablaAccionesEdicion" id="TablaAccionesEdicion${response.id_contribucion}">`;
          accionesHtml += `
            <img class="iconoeditar2" src="/images/editar.png">
            <img class="iconoeliminar2" src="/images/eliminar.png">
            <img class="iconocopiar2" src="/images/copiar.png">

            
          `;
          accionesHtml += `</div>`; // Cierre de la div de acciones
          $(`#comment${response.id_contribucion}`).append(accionesHtml);
          $(tablaAccionesEdicionId).hide();
        } else {
          $(tablaAccionesEdicionId).toggle();
        }
      });

      // Actualizar contador de reacciones
      updateReactionCount(response.id_contribucion);

      // Verificar y mostrar rama 3 (si aplica)
      verificarYMostrarRama3(response.id_contribucion, 3, nombrePropietario);
      verificarYMostrarRama3(response.id_contribucion, 4, nombrePropietario);
    } else {
      console.error('No se encontraron nombres de alumno y profesor en la respuesta de la API.');
      alert('Error: No se encontraron nombres de alumno y profesor.');
    }
  } catch (error) {
    console.error('Error al obtener nombres de alumno y profesor:', error);
    alert('Error al obtener nombres de alumno y profesor. Inténtalo de nuevo más tarde.');
  }
}

async function generarrama3(response) {
  const contributionsList = document.getElementById('contributions_list'); // Obtener el contenedor contributions_list

  try {
    const idContribucion = response.id_contribucion;
    const rama = response.rama;
    const idContribucionCompartida = response.id_contribucion_compartida; // Nuevo campo para identificar la contribución compartida

    console.log('ID Contribución:', idContribucion);
    console.log('Rama:', rama);
    console.log('ID Contribución Compartida:', idContribucionCompartida);

    // Realizar una solicitud GET para obtener nombres de alumno y profesor
    const nombresResponse = await $.ajax({
      type: 'GET',
      url: `/api/foro/contribuciones/${idContribucion}/${rama}`,
      dataType: 'json'
    });

    if (nombresResponse && nombresResponse.length > 0) {
      const nombreAlumno = nombresResponse[0].nombre_alumno;
      const nombreProfesor = nombresResponse[0].nombre_profesor;
      const nombreautor=nombresResponse[0].nombre_alumno_contribucion_compartida;
      const id_contribucion_compartida = nombresResponse[0].id_contribucion_compartida;

      console.log('Nombre Alumno:', nombreAlumno);
      console.log('Nombre Profesor:', nombreProfesor);
      console.log('ID Contribución Compartida en respuesta:', id_contribucion_compartida);

      // Formatear la fecha de creación
      const fechaCreacion = new Date(response.fecha);
      const fechaFormateada = fechaCreacion.toLocaleDateString("es-ES", { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'});

      // Determinar el propietario y el estilo de fondo
      const nombrePropietario = response.propietario === 2 ? `Profesor ${nombreProfesor}` : nombreAlumno;
      const styleBackground = response.propietario === 2 ? 'background-color: #f7e29ee8;' : '';

      let contenido;
      let referenciaAutor = '';

      // Manejar el contenido según el tipo de contribución
      if (response.tipo === 2) {
        contenido = `<center><img class="imageWrapper" src="/uploads/${response.contenido}" style="width:50%;height:30%;margin-left:100px" /></center>`;
      } else if (response.tipo === 3) {
        const [url, linkText] = response.contenido.split(',');
        contenido = `<a href="${url}" target="_blank">${linkText || url}</a>`;
      } else {
        contenido = response.contenido;
      }

      // Separar el contenido en caso de incluir referencia al autor
      if (contenido.includes('<p>')) {
        const inicioReferenciaAutor = contenido.indexOf('<p>');
        const finReferenciaAutor = contenido.indexOf('</p>', inicioReferenciaAutor);
        referenciaAutor = contenido.substring(inicioReferenciaAutor, finReferenciaAutor + 4); // Incluye el cierre </p>
        contenido = contenido.substring(finReferenciaAutor + 4); // Obtiene el contenido después de la referencia al autor
        console.log(referenciaAutor);
        console.log(contenido);
        if (response.tipo === 2) {
          contenido = `<center><img class="imageWrapper" src="/uploads/${contenido}</center>`;
        } else if (response.tipo === 3) {
          contenido = `<a href="${contenido}</a>`;
        }
      }

      // Construir el contenido HTML de la contribución
      const contenidoHtml = `
      <li id="${response.id_contribucion}listElement">
        <div class="sub-coment3" id="comment${response.id_contribucion}"${styleBackground ? `style="${styleBackground}"` : ''}>
          <p id= ${id_contribucion_compartida} class=respondioa><span style= font-size:18px; >↶</span> Respondió a ${nombreautor}</p>
          <div class="UsuarioComen" >
            ${nombrePropietario}  
              <div class="fecha-creacion" id="alumnoid${response.idAlumno}">${fechaFormateada}</div>
            <img src="https://cdn-icons-png.flaticon.com/512/61/61140.png" alt="Botón" class="acciones3" id="alumnoid${response.id_alumno}">
          </div>
          ${referenciaAutor ? `<div class="copiado">${referenciaAutor}</div>` : ''}
          <div class="coment-cuerpo" id="rama1tipo${response.tipo}">
            ${contenido}
          </div>
          <div class="coment-pie">
          <span id="userEmojis${response.id_contribucion}" class="userEmojis"></span>
            <div id="emojiIcon${response.id_contribucion}" class="reacciones" data-reaction-id="${response.id_reaccion || ''}">${response.emoji || '☺+'}</div>
            <div id="tablaEmojis${response.id_contribucion}" class="emojiTable" style="display: none;">
              <table id="emojisTable" onclick="seleccionarEmoji(event)">
                <tr>
                  <td><span class="emoji">👍</span></td>
                  <td><span class="emoji">👎</span></td>
                  <td><span class="emoji">❤️</span></td>
                </tr>
              </table>
            </div>
            <span id="numComentarios3${response.id_contribucion}" class="ncoment" onclick="toggleSubcomments3('comment3${response.id_contribucion}')"></span>
              <div class="contenedor">
                <img src="/images/responder.png" alt="Botón" class="responder3">
                <div class="mensaje" id="mensaje">Responder a ${nombreAlumno}</div>
              </div>
          </div>
        </div>
        <div class="sub-comentario4" id="comment3${response.id_contribucion}Subcomments" style="display: none;"></div>
        </li>
      `;

      // Encontrar la contribución principal por id_contribucion_compartida
      const subComentariosContainer = document.getElementById(`comment2${id_contribucion_compartida}Subcomments`);

      // Verificar si se encontró la contribución principal
      if (subComentariosContainer) {
        // Insertar el HTML generado al principio del contenedor subComentariosContainer
        subComentariosContainer.insertAdjacentHTML('afterbegin', contenidoHtml);

        // Actualizar el contador de comentarios de la contribución principal
        const numComentariosElement = $(`#numComentarios${id_contribucion_compartida}`);
        if (numComentariosElement.length > 0) {
          if (numComentariosElement.text().trim() === '') {
            numComentariosElement.text(`Ocultar 1 comentario`);
          } else {
            const currentText = numComentariosElement.text();
            const currentCount = parseInt(currentText.split(' ')[1]);
            const newCount = currentCount + 1;
            numComentariosElement.text(`Ocultar ${newCount} comentarios`);
          }
          subComentariosContainer.style.display = 'block';
        }

        // Mensajes de consola para depuración
        console.log(`Nueva contribución agregada dentro de subComentariosContainer con id ${id_contribucion_compartida}`);
      } else {
        console.error('No se encontró el contenedor de subcomentarios con id_contribucion_compartida:', id_contribucion_compartida);
      }

      // Event listener para mostrar/ocultar emojis
      $(`#emojiIcon${response.id_contribucion}`).click(function () {
        $(`#tablaEmojis${response.id_contribucion}`).toggle();
      });

      // Event listener para acciones (editar, eliminar, copiar)
      $(document).on("click", `.acciones3${response.id_contribucion}`, function () {
        const tablaAccionesEdicionId = `#TablaAccionesEdicion${response.id_contribucion}`;
        if ($(tablaAccionesEdicionId).length === 0) {
          let accionesHtml = `<div class="TablaAccionesEdicion" id="TablaAccionesEdicion${response.id_contribucion}">`;
          accionesHtml += `
            <img class="iconoeditar3" src="/images/editar.png">
            <img class="iconoeliminar3" src="/images/eliminar.png">
            <img class="iconocopiar3" src="/images/copiar.png">
          `;
          accionesHtml += `</div>`; // Cierre de la div de acciones
          $(`#comment${response.id_contribucion}`).append(accionesHtml);
          $(tablaAccionesEdicionId).hide();
        } else {
          $(tablaAccionesEdicionId).toggle();
        }
      });

      // Actualizar contador de reacciones
      updateReactionCount(response.id_contribucion);

      // Verificar y mostrar rama 3 (si aplica)
      verificarYMostrarRama4(response.id_contribucion, 3, nombrePropietario);
      verificarYMostrarRama4(response.id_contribucion, 4, nombrePropietario);
    } else {
      console.error('No se encontraron nombres de alumno y profesor en la respuesta de la API.');
      alert('Error: No se encontraron nombres de alumno y profesor.');
    }
  } catch (error) {
    console.error('Error al obtener nombres de alumno y profesor:', error);
    alert('Error al obtener nombres de alumno y profesor. Inténtalo de nuevo más tarde.');
  }
}

async function generarrama4(response) {
  const contributionsList = document.getElementById('contributions_list'); // Obtener el contenedor contributions_list

  try {
    const idContribucion = response.id_contribucion;
    const rama = response.rama;
    const idContribucionCompartida = response.id_contribucion_compartida; // Nuevo campo para identificar la contribución compartida

    console.log('ID Contribución:', idContribucion);
    console.log('Rama:', rama);
    console.log('ID Contribución Compartida:', idContribucionCompartida);

    // Realizar una solicitud GET para obtener nombres de alumno y profesor
    const nombresResponse = await $.ajax({
      type: 'GET',
      url: `/api/foro/contribuciones/${idContribucion}/${rama}`,
      dataType: 'json'
    });

    if (nombresResponse && nombresResponse.length > 0) {
      const nombreAlumno = nombresResponse[0].nombre_alumno;
      const nombreProfesor = nombresResponse[0].nombre_profesor;
      const nombreautor=nombresResponse[0].nombre_alumno_contribucion_compartida;
      const id_contribucion_compartida = nombresResponse[0].id_contribucion_compartida;

      console.log('Nombre Alumno:', nombreAlumno);
      console.log('Nombre Profesor:', nombreProfesor);
      console.log('ID Contribución Compartida en respuesta:', id_contribucion_compartida);

      // Formatear la fecha de creación
      const fechaCreacion = new Date(response.fecha);
      const fechaFormateada = fechaCreacion.toLocaleDateString("es-ES", { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'});

      // Determinar el propietario y el estilo de fondo
      const nombrePropietario = response.propietario === 2 ? `Profesor ${nombreProfesor}` : nombreAlumno;
      const styleBackground = response.propietario === 2 ? 'background-color: #f7e29ee8;' : '';

      let contenido;
      let referenciaAutor = '';

      // Manejar el contenido según el tipo de contribución
      if (response.tipo === 2) {
        contenido = `<center><img class="imageWrapper" src="/uploads/${response.contenido}" style="width:50%;height:30%;margin-left:100px" /></center>`;
      } else if (response.tipo === 3) {
        const [url, linkText] = response.contenido.split(',');
        contenido = `<a href="${url}" target="_blank">${linkText || url}</a>`;
      } else {
        contenido = response.contenido;
      }

      // Separar el contenido en caso de incluir referencia al autor
      if (contenido.includes('<p>')) {
        const inicioReferenciaAutor = contenido.indexOf('<p>');
        const finReferenciaAutor = contenido.indexOf('</p>', inicioReferenciaAutor);
        referenciaAutor = contenido.substring(inicioReferenciaAutor, finReferenciaAutor + 4); // Incluye el cierre </p>
        contenido = contenido.substring(finReferenciaAutor + 4); // Obtiene el contenido después de la referencia al autor
        console.log(referenciaAutor);
        console.log(contenido);
        if (response.tipo === 2) {
          contenido = `<center><img class="imageWrapper" src="/uploads/${contenido}</center>`;
        } else if (response.tipo === 3) {
          contenido = `<a href="${contenido}</a>`;
        }
      }

      // Construir el contenido HTML de la contribución
      const contenidoHtml = `
      <li id="${response.id_contribucion}listElement">
        <div class="sub-coment4" id="comment${response.id_contribucion}" ${styleBackground ? `style="${styleBackground}"` : ''}>
          <p id= ${id_contribucion_compartida} class=respondioa><span style= font-size:18px; >↶</span> Respondió a ${nombreautor}</p>
          <div class="UsuarioComen" >
            ${nombrePropietario}  
              <div class="fecha-creacion" id="alumnoid${response.idAlumno}">${fechaFormateada}</div>
            <img src="https://cdn-icons-png.flaticon.com/512/61/61140.png" alt="Botón" class="acciones4" id="alumnoid${response.id_alumno}">
          </div>
          ${referenciaAutor ? `<div class="copiado">${referenciaAutor}</div>` : ''}
          <div class="coment-cuerpo" id="rama1tipo${response.tipo}">
            ${contenido}
          </div>
          <div class="coment-pie">
          <span id="userEmojis${response.id_contribucion}" class="userEmojis"></span>
            <div class="fecha-creacion2">${fechaFormateada}</div>
            <div id="emojiIcon${response.id_contribucion}" class="reacciones" data-reaction-id="${response.id_reaccion || ''}">${response.emoji || '☺+'}</div>
            <div id="tablaEmojis${response.id_contribucion}" class="emojiTable" style="display: none;">
              <table id="emojisTable" onclick="seleccionarEmoji(event)">
                <tr>
                  <td><span class="emoji">👍</span></td>
                  <td><span class="emoji">👎</span></td>
                  <td><span class="emoji">❤️</span></td>
                </tr>
              </table>
            </div>
            <span id="numComentarios4${response.id_contribucion}" class="ncoment" onclick="toggleSubcomments4('comment4${response.id_contribucion}')"></span>
              <div class="contenedor">
                <img src="/images/responder.png" alt="Botón" class="responder4">
                <div class="mensaje" id="mensaje">Responder a ${nombreAlumno}</div>
              </div>
          </div>
        </div>
        <div class="sub-comentario5" id="comment4${response.id_contribucion}Subcomments" style="display: none;"></div>
        </li>
      `;

      // Encontrar la contribución principal por id_contribucion_compartida
      const subComentariosContainer = document.getElementById(`comment3${id_contribucion_compartida}Subcomments`);

      // Verificar si se encontró la contribución principal
      if (subComentariosContainer) {
        // Insertar el HTML generado al principio del contenedor subComentariosContainer
        subComentariosContainer.insertAdjacentHTML('afterbegin', contenidoHtml);

        // Actualizar el contador de comentarios de la contribución principal
        const numComentariosElement = $(`#numComentarios3${id_contribucion_compartida}`);
        if (numComentariosElement.length > 0) {
          if (numComentariosElement.text().trim() === '') {
            numComentariosElement.text(`Ocultar 1 comentario`);
          } else {
            const currentText = numComentariosElement.text();
            const currentCount = parseInt(currentText.split(' ')[1]);
            const newCount = currentCount + 1;
            numComentariosElement.text(`Ocultar ${newCount} comentarios`);
          }
          subComentariosContainer.style.display = 'block';
        }

        // Mensajes de consola para depuración
        console.log(`Nueva contribución agregada dentro de subComentariosContainer con id ${id_contribucion_compartida}`);
      } else {
        console.error('No se encontró el contenedor de subcomentarios con id_contribucion_compartida:', id_contribucion_compartida);
      }

      // Event listener para mostrar/ocultar emojis
      $(`#emojiIcon${response.id_contribucion}`).click(function () {
        $(`#tablaEmojis${response.id_contribucion}`).toggle();
      });

      // Event listener para acciones (editar, eliminar, copiar)
      $(document).on("click", `.acciones4${response.id_contribucion}`, function () {
        const tablaAccionesEdicionId = `#TablaAccionesEdicion${response.id_contribucion}`;
        if ($(tablaAccionesEdicionId).length === 0) {
          let accionesHtml = `<div class="TablaAccionesEdicion" id="TablaAccionesEdicion${response.id_contribucion}">`;
          accionesHtml += `
            <img class="iconoeditar4" src="/images/editar.png">
            <img class="iconoeliminar4" src="/images/eliminar.png">
            <img class="iconocopiar4" src="/images/copiar.png">
          `;
          accionesHtml += `</div>`; // Cierre de la div de acciones
          $(`#comment${response.id_contribucion}`).append(accionesHtml);
          $(tablaAccionesEdicionId).hide();
        } else {
          $(tablaAccionesEdicionId).toggle();
        }
      });

      // Actualizar contador de reacciones
      updateReactionCount(response.id_contribucion);

      // Verificar y mostrar rama 3 (si aplica)
      verificarYMostrarRama5(response.id_contribucion, 3, nombrePropietario);
      verificarYMostrarRama5(response.id_contribucion, 4, nombrePropietario);
    } else {
      console.error('No se encontraron nombres de alumno y profesor en la respuesta de la API.');
      alert('Error: No se encontraron nombres de alumno y profesor.');
    }
  } catch (error) {
    console.error('Error al obtener nombres de alumno y profesor:', error);
    alert('Error al obtener nombres de alumno y profesor. Inténtalo de nuevo más tarde.');
  }
}

async function generarrama5(response) {
  const contributionsList = document.getElementById('contributions_list'); // Obtener el contenedor contributions_list

  try {
    const idContribucion = response.id_contribucion;
    const rama = response.rama;
    const idContribucionCompartida = response.id_contribucion_compartida; // Nuevo campo para identificar la contribución compartida

    console.log('ID Contribución:', idContribucion);
    console.log('Rama:', rama);
    console.log('ID Contribución Compartida:', idContribucionCompartida);

    // Realizar una solicitud GET para obtener nombres de alumno y profesor
    const nombresResponse = await $.ajax({
      type: 'GET',
      url: `/api/foro/contribuciones/${idContribucion}/${rama}`,
      dataType: 'json'
    });

    if (nombresResponse && nombresResponse.length > 0) {
      const nombreAlumno = nombresResponse[0].nombre_alumno;
      const nombreProfesor = nombresResponse[0].nombre_profesor;
      const nombreautor=nombresResponse[0].nombre_alumno_contribucion_compartida;
      const id_contribucion_compartida = nombresResponse[0].id_contribucion_compartida;

      console.log('Nombre Alumno:', nombreAlumno);
      console.log('Nombre Profesor:', nombreProfesor);
      console.log('ID Contribución Compartida en respuesta:', id_contribucion_compartida);

      // Formatear la fecha de creación
      const fechaCreacion = new Date(response.fecha);
      const fechaFormateada = fechaCreacion.toLocaleDateString("es-ES", { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'});

      // Determinar el propietario y el estilo de fondo
      const nombrePropietario = response.propietario === 2 ? `Profesor ${nombreProfesor}` : nombreAlumno;
      const styleBackground = response.propietario === 2 ? 'background-color: #f7e29ee8;' : '';

      let contenido;
      let referenciaAutor = '';

      // Manejar el contenido según el tipo de contribución
      if (response.tipo === 2) {
        contenido = `<center><img class="imageWrapper" src="/uploads/${response.contenido}" style="width:50%;height:30%;margin-left:100px" /></center>`;
      } else if (response.tipo === 3) {
        const [url, linkText] = response.contenido.split(',');
        contenido = `<a href="${url}" target="_blank">${linkText || url}</a>`;
      } else {
        contenido = response.contenido;
      }

      // Separar el contenido en caso de incluir referencia al autor
      if (contenido.includes('<p>')) {
        const inicioReferenciaAutor = contenido.indexOf('<p>');
        const finReferenciaAutor = contenido.indexOf('</p>', inicioReferenciaAutor);
        referenciaAutor = contenido.substring(inicioReferenciaAutor, finReferenciaAutor + 4); // Incluye el cierre </p>
        contenido = contenido.substring(finReferenciaAutor + 4); // Obtiene el contenido después de la referencia al autor
        console.log(referenciaAutor);
        console.log(contenido);
        if (response.tipo === 2) {
          contenido = `<center><img class="imageWrapper" src="/uploads/${contenido}</center>`;
        } else if (response.tipo === 3) {
          contenido = `<a href="${contenido}</a>`;
        }
      }

      // Construir el contenido HTML de la contribución
      const contenidoHtml = `
      <li id="${response.id_contribucion}listElement">
        <div class="sub-coment5" id="comment${response.id_contribucion}" ${styleBackground ? `style="${styleBackground}"` : ''}>
          <p id= ${id_contribucion_compartida} class=respondioa><span style= font-size:18px; >↶</span> Respondió a ${nombreautor}</p>
          <div class="UsuarioComen">
            ${nombrePropietario}  
              <div class="fecha-creacion" id="alumnoid${response.idAlumno}">${fechaFormateada}</div>
            <img src="https://cdn-icons-png.flaticon.com/512/61/61140.png" alt="Botón" class="acciones5" id="alumnoid${response.id_alumno}">
          </div>
          ${referenciaAutor ? `<div class="copiado">${referenciaAutor}</div>` : ''}
          <div class="coment-cuerpo" id="rama1tipo${response.tipo}">
            ${contenido}
          </div>
          <div class="coment-pie">
          <span id="userEmojis${response.id_contribucion}" class="userEmojis"></span>
            <div id="emojiIcon${response.id_contribucion}" class="reacciones" data-reaction-id="${response.id_reaccion || ''}">${response.emoji || '☺+'}</div>
            <div id="tablaEmojis${response.id_contribucion}" class="emojiTable" style="display: none;">
              <table id="emojisTable" onclick="seleccionarEmoji(event)">
                <tr>
                  <td><span class="emoji">👍</span></td>
                  <td><span class="emoji">👎</span></td>
                  <td><span class="emoji">❤️</span></td>
                </tr>
              </table>
            </div>
          </div>
        </div>
        </li>
      `;
      // Encontrar la contribución principal por id_contribucion_compartida
      const subComentariosContainer = document.getElementById(`comment4${id_contribucion_compartida}Subcomments`);

      // Verificar si se encontró la contribución principal
      if (subComentariosContainer) {
        subComentariosContainer.insertAdjacentHTML('afterbegin', contenidoHtml);

        // Actualizar el contador de comentarios de la contribución principal
        const numComentariosElement = $(`#numComentarios4${id_contribucion_compartida}`);
        if (numComentariosElement.length > 0) {
          if (numComentariosElement.text().trim() === '') {
            numComentariosElement.text(`Ocultar 1 comentario`);
          } else {
            const currentText = numComentariosElement.text();
            const currentCount = parseInt(currentText.split(' ')[1]);
            const newCount = currentCount + 1;
            numComentariosElement.text(`Ocultar ${newCount} comentarios`);
          }
          subComentariosContainer.style.display = 'block';
        }


        console.log(`Nueva contribución agregada dentro de subComentariosContainer con id ${id_contribucion_compartida}`);
      } else {
        console.error('No se encontró el contenedor de subcomentarios con id_contribucion_compartida:', id_contribucion_compartida);
      }


      $(`#emojiIcon${response.id_contribucion}`).click(function () {
        $(`#tablaEmojis${response.id_contribucion}`).toggle();
      });

      $(document).on("click", `.acciones5${response.id_contribucion}`, function () {
        const tablaAccionesEdicionId = `#TablaAccionesEdicion${response.id_contribucion}`;
        if ($(tablaAccionesEdicionId).length === 0) {
          let accionesHtml = `<div class="TablaAccionesEdicion" id="TablaAccionesEdicion${response.id_contribucion}">`;
          accionesHtml += `
            <img class="iconoeditar5" src="/images/editar.png">
            <img class="iconoeliminar5" src="/images/eliminar.png">
            <img class="iconocopiar5" src="/images/copiar.png">
          `;
          accionesHtml += `</div>`; // Cierre de la div de acciones
          $(`#comment${response.id_contribucion}`).append(accionesHtml);
          $(tablaAccionesEdicionId).hide();
        } else {
          $(tablaAccionesEdicionId).toggle();
        }
      });

      // Actualizar contador de reacciones
      updateReactionCount(response.id_contribucion);

    } else {
      console.error('No se encontraron nombres de alumno y profesor en la respuesta de la API.');
      alert('Error: No se encontraron nombres de alumno y profesor.');
    }
  } catch (error) {
    console.error('Error al obtener nombres de alumno y profesor:', error);
    alert('Error al obtener nombres de alumno y profesor. Inténtalo de nuevo más tarde.');
  }
}

async function updateContribution(contributionId, tipo, contenido) {
  var datos = {
    tipo: tipo,
    contenido: contenido
  };

  try {
    const response = await $.ajax({
      type: 'PUT',
      url: `/api/foro/contribuciones/${contributionId}`,
      data: JSON.stringify(datos),
      contentType: 'application/json'
    });
    return response;
  } catch (error) {
    console.error('Error al actualizar la contribución:', error);
    throw new Error('Ocurrió un error al actualizar la contribución.');
  }
}









$("#selectMosaicSpace").hide();
$("#workspaceMode").hide();

// Shows right click menu
$(document).bind("contextmenu", function (event) {
  if (!$(event.target).parents(".noselect").length == 0) {
    event.preventDefault();
    // Show contextmenu
    $(".right-click-remote-menu").finish().toggle(100).
      css({
        top: event.pageY + "px",
        left: event.pageX + "px"
      });
  }
});

//Functions to show plus button menus
$("#addNewObject").click(function () {
  $("#textArea").val("");
  $("#workspaceMode").show();
  $("#selectMosaicWorkspace").hide();
  $("#selectMosaicSpace").hide();
  $("#trackpadMode").hide();
  $("#trackpadSideBar").hide();
})

$(".createObject").click(function () {
  ContributionId = null;
  ramacontribucion = 1;
  console.log("Hola, mi rama es:", ramacontribucion);
  $("#selectMosaicSpace").show();
  $("#texto").val("");
  $("#nombreLinkArea").val("");
  $("#linkArea").val("");
  var div = document.getElementById("imagencargada");
  div.innerHTML = "";
})


$("#cancelIcon").click(function () {
  $("#textArea").val("");
  $("#nombreLinkArea").val("");
  $("#linkArea").val("");
  var div = document.getElementById("imagencargada");
  div.innerHTML = "";
})

$("#cancelButton").click(function () {
  if(editmode){
    $("#workspaceMode").hide();
    $("#createObjectBtn").show();
  }else{
    $("#workspaceMode").hide();
    $("#selectMosaicSpace").show();
  }
  });
  

  
  $("#returnButton").click(function () {
    $("#selectMosaicSpace").hide();
    $("#createObjectBtn").show();
    editmode = false;
  });
  
  $(".responder").click(function () {
    editmode = false;
    $("#texto").val("");
    $("#nombreLinkArea").val("");
    $("#linkArea").val("");
    var div = document.getElementById("imagencargada");
    div.innerHTML = "";
    contenido = "";
    $("#createObjectBtn").hide();
    $("#selectMosaicSpace").show();
  })
  
  $("#cerrarAcciones").click(function () {
    $("#TablaAcciones").hide();
  });
  
  $(".acciones").click(function () {
    $("#TablaAcciones").toggle();
  });
  
  $("#addLink").click(function () {
    $("#selectMosaicSpace").hide();
    $("#linkMode").toggle();
  })
  
  $("#addLink").click(function () {
    $("#selectMosaicSpace").hide();
    $("#linkMode").show();
    $("#createObjectBtn").show();
  })
  

  
  $("#createObjectBtn").click(function () {
  editmode=false;
  });
  
  $("#chooseFile").click(function () {
    $("#selectMosaicSpace").hide();
    $("#SubirFoto").show();
  })

// Simula el clic en el input de archivo cuando se presiona el botón visible.
$("#cargarfoto").click(function () {
  $("#fileInput").click();
});


document.getElementById('tomarfoto').addEventListener('click', function () {
  const video = document.createElement('video');
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  navigator.mediaDevices.getUserMedia({ video: true })
    .then(function (stream) {
      video.srcObject = stream;
      video.play();
    })
    .catch(function (err) {
      console.log('Error al acceder a la cámara: ' + err);
    });

  video.addEventListener('canplay', function () {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convertir la imagen a formato JPG
    canvas.toBlob(function (blob) {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = function () {
        const imageDataURL = reader.result;

        // Mostrar la imagen en el elemento 'imagencargada'
        const imagencargada = document.getElementById('imagencargada');
        imagencargada.innerHTML = '<img src="' + imageDataURL + '" style="max-width: 100%; max-height: 100%; ">';

        // Detener el video y liberar los recursos de la cámara
        video.pause();
        video.srcObject.getVideoTracks()[0].stop();
      }
    }, 'image/jpeg');
  });
});



function mostrarTabla(id) {
  var tablaAcciones = document.getElementById(id);
  tablaAcciones.style.display = "block"; // Mostrar la tabla de acciones
}

// Función para cerrar la tabla de acciones
document.addEventListener('click', function (event) {
  if (!event.target.matches('#cerrarAccionesEdicion')) return; // Si el clic no es en el botón de cerrar, salimos de la función
  var tablaAcciones = event.target.parentElement;
  tablaAcciones.style.display = "none"; // Ocultar la tabla de acciones
});


function count(textarea) {
  var maxLength = 250;
  var currentLength = textarea.value.length;
  var remainingChars = maxLength - currentLength;
  document.getElementById('count').textContent = remainingChars;
}

$(document).ready(function () {
  actualizarListaContribuciones();
});

function mostrarTabla(emojiIconId) {
  var tablaEmojis = document.getElementById('tablaEmojis');
  tablaEmojis.style.display = 'block';

  var emojiActualId = emojiIconId;

  tablaEmojis.setAttribute('data-emojiActualId', emojiActualId);
}

function ocultarTabla() {
  var tablaEmojis = document.getElementById('tablaEmojis');
  tablaEmojis.style.display = 'none';
}

function seleccionarEmoji(event) {
  var emojiSeleccionado = event.target.innerHTML;
  var emojiActualId = document.getElementById('tablaEmojis').getAttribute('data-emojiActualId');

  document.getElementById(emojiActualId).innerHTML = emojiSeleccionado;
  ocultarTabla();
}

cerrarTabla.addEventListener('click', function () {
  tablaEmojis.style.display = 'none';
});

emojis.forEach(emoji => {
  emoji.addEventListener('click', emojiClickHandler);
});

function toggleSubcomments(commentId) {
  var subcomments = document.getElementById(commentId + 'Subcomments');
  if (subcomments.style.display === 'none' || subcomments.style.display === '') {
    subcomments.style.display = 'block';
  } else {
    subcomments.style.display = 'none';
  }
}

function toggleSubcomments3(commentId) {
  var subcomments = document.getElementById(commentId + 'Subcomments');
  if (subcomments.style.display === 'none' || subcomments.style.display === '') {
    subcomments.style.display = 'block';
  } else {
    subcomments.style.display = 'none';
  }
}

function toggleSubcomments2(commentId) {
  var subcomments = document.getElementById(commentId + 'Subcomments');
  if (subcomments.style.display === 'none' || subcomments.style.display === '') {
    subcomments.style.display = 'block';
  } else {
    subcomments.style.display = 'none';
  }
}

function toggleSubcomments3(commentId) {
  var subcomments = document.getElementById(commentId + 'Subcomments');
  if (subcomments.style.display === 'none' || subcomments.style.display === '') {
    subcomments.style.display = 'block';
  } else {
    subcomments.style.display = 'none';
  }
}

function toggleSubcomments4(commentId) {
  var subcomments = document.getElementById(commentId + 'Subcomments');
  if (subcomments.style.display === 'none' || subcomments.style.display === '') {
    subcomments.style.display = 'block';
  } else {
    subcomments.style.display = 'none';
  }
}


function toggleDiscussion(discussionId) {
  var discussion = document.getElementById(discussionId);
  var button = event.target;

  if (!discussion.style.maxHeight || discussion.style.maxHeight === '0px') {
    // Establece manualmente una altura máxima grande para abrir completamente el contenedor de discusión
    discussion.style.maxHeight = '10000px'; // Puedes ajustar este valor según sea necesario
    button.innerHTML = "▼";
  } else {
    discussion.style.maxHeight = '0px';
    button.innerHTML = "▶";
  }
}

socket.on('connect', function () {
  // connection done
  // joining room
  // create and join to specific room
  socket.emit('join_room', PIN);
});

socket.on("new_user_connected", function (data) {
  addNewCursor(data)
})

socket.on("display_new_object", function (data) {
  objectReceived++;
  mapActivityPrivZoneObjIntoActivityObj(data);
  saveObjectAndIssueId(data);
})


function getActivityData() {
  // TODO: cambiar a una promesa
  // issue #18
  var url_formed = '/api/foro/pin/' + PIN
  $.ajax({
    type: 'GET',
    url: url_formed,
    dataType: 'json',
    success: function (res) {
      if (!res.data.is_active && !localStorage.getItem("adminId")) {
        //todo: exit remote zone function
      }
      // save activity id
      localStorage.setItem("tema_foro", res.data.id_foro);
      renderActivityData(res.data)
      // show if is paused
      showIsPaused(res.data.is_paused)
      var users = []
      console.log('askakjpajsahfiwiueywerwiyryyyyyyy', res.data.length);
      for (var i = 0; i < 20; i++) {
        console.log('iiiiiiiiiiii');
        if (!res.data[i].cursor || !res.data[i].username) continue
        addNewCursor({
          cursor: res.data[i].cursor,
          userId: res.data[i].u_id,
          username: res.data[i].username
        })
      }
      console.log('eeeeeeeeeeeee');
      getSharedObjects();
    },
    error: function (err) {
      swal.fire({
        title: "Ocurrió un problema",
        text: err.responseJSON.msg_dev,
        icon: "error",
        showCancelButton: false,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "Ir al inicio",
        closeOnConfirm: false
      }).then(result => {
        if (result.value) {
          removeSessionData
        } else {

        }
      });
    }
  })
}
function renderActivityData(data) {
  if (data.id !== null) {
    $('.optionalSave').hide();
  }
  if (data.tema_foro == "" || data.tema_foro === null) {
    $('#ForoName').text("(Haz click aquí para introducir un título)")
  } else {
    $('#ForoName').text(data.tema_foro)
    $('#tema').text(data.tema_foro)
    $('#userName').text(localStorage.getItem("userName"));
  }
  if (data.background_image) {
    $("#backgroundImage").attr("src", "/uploads/" + data.background_image);
  }
  $('#backgroundImage').css("width", "100%");
  var imageHeight = $("#mural").height() - $("#headerPublicZone").height();
  $('#backgroundImage').css("height", imageHeight);

  localStorage.setItem('idForo', data.id_foro);
  localStorage.setItem('idAlumno', data.id_alumno);
  localStorage.setItem('idProfesor', data.id_profesor);
}

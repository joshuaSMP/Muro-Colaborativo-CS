var socket = io.connect('/mcv4');
var dataSession = {};
var sessionIdLoaded = '';
var userId = localStorage.getItem("userId");
var pin = ""
$(document).ready(function () {
	// check if the user is in an active session
	$('#login-btn').click(function () {
    $('#login-btn').prop('disabled', true);
    pin = $.trim($("#pin").val())
    getActivityData(pin).then(function(res){
        // habilitar botón
        $('#login-btn').prop('disabled', false);
        // si no se encontró la actividad:

        // save pin in localstorage
        // create an front-end Id
        var name = $.trim($("#userName").val())
        if(!name) {
            return alert("Debe proporcionar un nombre de usuario")
        }
        if(name.length > 20) {
            return alert("El nombre de usuario no puede tener más de 20 caracteres")
        }
        saveUserDataInLocalStorage(name, pin)
        // enviar datos por socket
        sendUserName(name, pin) 
    }).catch(function(err){
        // habilitar botón
        $('#login-btn').prop('disabled', false);
    })
});


	$("#userName").keyup(function(event){
    if(event.keyCode == 13) {
        $("#login-btn").click();
    }
	});
})

function sendUserName(username, pin) {
	var dataToSend = {
			'userName' : username,
			'pin' : pin
		}
	socket.emit('join_activity', dataToSend)
}

socket.on('join_room_ack', function (res) {
	if(res.status === 200) {
		//continue to private zone
		continueToPrivateZone(res)
	} else {
		console.log("hola")
	}
});

function getSessionData() {
	$.ajax({
		type: 'GET',
		url: '/getCurrentSessionData',
		data: "",
		dataType: 'json',
		success: function (res) {
			if (res.status == 'ok') {
				dataSession = JSON.parse(res.data)
				sessionIdLoaded = dataSession.id;
				$('#nameSession').text('Actividad: ' + dataSession.name).css('color', '#99ffcc');
			}
		}
	}); //end ajax
}

function saveUserDataInLocalStorage(name, pin){
	localStorage.setItem("userName", name);
	localStorage.setItem("pin", pin);
}

function getActivityData(pin) {
  // TODO cambiar a una promesa Issue #30
  var url_formed = '/api/foro/pin/' +pin
  return new Promise(function(resolve, reject) {
		$.ajax({
			type: 'GET',
			url: url_formed,
			dataType: 'json'
		}).done(function(data){
			resolve(data)
		}).fail(function(err){
			reject(err)
		})
  })
}

function continueToPrivateZone(data){
	var miCheckbox = document.getElementById('miElementoCheckbox');
	localStorage.setItem("userId", data.userId);
	localStorage.setItem("cursor", data.data);

	if(miCheckbox.checked == true) {
  	window.location = "/foro/classroom/";
	} else {
  	window.location = "/foro/remote/";
	}	
}

function getCheckboxes() {
	return document.querySelectorAll('input[type=checkbox]');
}

function uncheckAllCheckboxes() {
  var checkboxes = getCheckboxes();
	for (var i = 0, length = checkboxes.length; i < length; i++) {
    checkboxes[i].checked = false;
  }
}

function manageClick() {
  uncheckAllCheckboxes();
	this.checked = true;
}

function init() {
  var checkboxes = getCheckboxes();
	for (var i = 0, length = checkboxes.length; i < length; i++) {
    checkboxes[i].addEventListener('click', manageClick);
  }
}
init();

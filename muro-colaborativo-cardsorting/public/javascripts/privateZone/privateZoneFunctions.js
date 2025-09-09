// NOTAS SOBRE RESOLUCION DE ISSUE 23:
// Se identificaron y corrigieron variables globales que podrian ser mejor variables globales y se
// pusieron asi. Se quitaron funciones que se declararon pero nunca se usan. No se encontro ninguna
// vibracion. Se pasaron los estilos a css, estan en el archivo mainPrivateZone.css. Y se elimino div
// oculto en privateZone.ejs y se reemplazo por una funcion llamada submitUpload en privateZoneFunctions.js.
// Las funciones eliminadas fueron addNewElementToCursorsAndUsersArray y cleanAddSessionModal, y las
// variables eliminadas fueron cursorsAndUsersIdArray y muralName. Las variables globales que pasaron a
// variables locales fueron sendCoordinatesEachThisNumber, displacementX, displacementY y
// changesInPixelsInTrackPad.

// Functions for private Zone
// START the declarations of the global variables
var arrayColors = ["#ff3535", "#2980b9", "#27ae60", "#f39c12", "#8e44ad",
	"#16a085", "#d35400", "#34495e", "#bdc3c7", "#7f8c8d", "#e74c3c", "#3498db",
	"#2ecc71", "#f39c12", "#9b59b6", "#1abc9c", "#e67e22", "#34495e", "#ecf0f1",
	"#95a5a6"];
var numberOfRequest = 0;
var OS_Device = getMobileOperatingSystem();
var positionStartCursorX = 0;
var positionStartCursorY = 0;
var addToXposition = 0;
var addToYposition = 0;
var counterInSendingTrackPadCoordinates = 0;
var objectsCreated = 0;
var kindOfObjectToSend = "";
var uploaded = false;
var serverFileName = "";
var userId = localStorage.getItem("userId");
var username = localStorage.getItem("userName")
var idforo = localStorage.getItem("IdForo") 
var sessionData;
var assignedCursor;
var moveModeOn = false;
var editModeOn = false;
var currentEditedExternalObjectId = {};
var objectsCreatedJson = {};
var arrayOfPrivateIds = [];
var objectSelectedId = "";
var currentObjectToSend = "";
var isAnEditedObject = false;
var originalEditedObject = {}
var pin_priv = localStorage.getItem("pin")
var nombreLink = "";
var link = "";
var newId_image = "";

// CREATING THE MODEL
var model = {
	user: "user1",
	mode: "trackpad"
};

// Shows right click menu
$(document).bind("contextmenu", function (event) {
	if (!$(event.target).parents(".content-wrapper").length == 0) {
		event.preventDefault();

		// Show contextmenu
		$(".right-click-remote-menu").finish().toggle(100).
			css({
				top: event.pageY + "px",
				left: event.pageX + "px"
			});
	}

});


$(document).bind("mousedown", function (e) {
	if (!$(e.target).parents(".right-clic-remote-menu").length > 0) {
		$(".right-click-remote-menu").hide(100);
	}
});

$(".right-click-remote-menu li").click(function () {
	switch ($(this).attr("data-action")) {
		case "editar": alert("editar"); break;
		case "copiar": alert("copiar"); break;
		case "eliminar": alert("eliminar"); break;
	}
	$(".right-click-remote-menu").hide(100);
});

function count(val) {
	var len = val.value.length;
	if (len >= 251) {
		val.value = val.value.substring(0, 250);
	} else {
		$('#count').text(250 - len);
	}
}

$("#maximizeBtn").click(function () {
	$(document).toggleFullScreen();
})

//  START code to set socket io connection
var socket = io.connect('/mcv4');
socket.on('connect', function () {
	// connection done
	// joining room
	// create and join to specific room
	socket.emit('join_room', pin_priv);
});

// START ready function
$(document).ready(function () {
	// check if the activity is still active
	getActivityData();
	$('.modal').on('show.bs.modal', function () {
		$('.modal').not($(this)).each(function () {
			$(this).modal('hide');
		});
	});

	$('#blockScreenModal').modal({
		backdrop: 'static',
		keyboard: false
	});

	$("#userName").text(username);
	$("#pinNumber").text(pin_priv)

	// simulate a trackpad
	$("#dummyTrackpadMode").draggable({
		scroll: false,
		delay: 100,
		helper: "clone"
	})
	$("#dummyTrackpadMode").on("dragstart", function (event) {
		positionStartCursorY = event.pageY;
		positionStartCursorX = event.pageX;
	})// setting initial position when drag starts
	$("#dummyTrackpadMode").on('drag', function (event) {
		sendingCoordinatesAsATrackPad(event)
	})//sending the changes in X and Y position, in order to simulate a trackpad

	changeMode('trackpad');
	// start event registration

	$("#chooseFile").click(function () {
		chooseFile();
	})

	$("#addLink").click(function () {
		changeMode('linkmode');
	})

	$("#okLink").click(function () {
		let linkname = $.trim($('#nombreLinkArea').val());
		link = $.trim($("#linkArea").val());
		if (editModeOn) {
			let text = $.trim($('#nombreLinkArea').val());
			//console.log("ID privateId ->      " + privateId)
			console.log("ID ibjectSelectedId ->     " + objectSelectedId);
			$("#" + objectSelectedId).text(text);
			objectsCreatedJson[objectSelectedId].text = text
			objectsCreatedJson[objectSelectedId].link = link
			objectsCreatedJson[objectSelectedId].linkname = linkname
			objectsCreatedJson[objectSelectedId].create_date = new Date();
			localStorage.setItem("objectsCreatedJson", JSON.stringify(objectsCreatedJson));
			showObjectInBarSide(objectSelectedId);
			editModeOn = false;
			changeMode('trackpad');
			var dataToSend = {
				message: "editObjectInPrivateZone",
				type: 'userMessage',
				room: pin_priv,
				user: $.trim($("#userDisplay").text()),
				userId: userId,
				cursor: assignedCursor,
				link: link
			};
			socket.send(JSON.stringify(dataToSend));
		} else {
			kindOfObjectToSend = "text"
			nombreLink = $.trim($('#nombreLinkArea').val());
			saveNewObject();
			changeMode('trackpad');
			var dataToSend = {
				message: "objectCreated",
				type: 'userMessage',
				user: $("#userDisplay").text(),
				userId: userId,
				room: pin_priv,
				cursor: assignedCursor,
				link: link
			};
			socket.send(JSON.stringify(dataToSend));
		}
	})

	$(".sideBarBtn").click(function () {
		setOutLine(this);
	});


	$(".createObject").click(function () {
		changeMode('selectMosaic');
	})


	$("#okButton").click(function () {
		if (editModeOn) {
			let text = $.trim($("#textArea").val())
			$("#" + objectSelectedId).text(text);
			objectsCreatedJson[objectSelectedId].text = text
			objectsCreatedJson[objectSelectedId].create_date = new Date();
			localStorage.setItem("objectsCreatedJson", JSON.stringify(objectsCreatedJson));
			showObjectInBarSide(objectSelectedId);
			editModeOn = false;
			changeMode('trackpad');
			var dataToSend = {
				message: "editObjectInPrivateZone",
				type: 'userMessage',
				room: pin_priv,
				user: $.trim($("#userDisplay").text()),
				userId: userId,
				cursor: assignedCursor
			};
			socket.send(JSON.stringify(dataToSend));
		} else {
			kindOfObjectToSend = "text"
			saveNewObject();
			changeMode('trackpad');
			var dataToSend = {
				message: "objectCreated",
				type: 'userMessage',
				user: $("#userDisplay").text(),
				userId: userId,
				room: pin_priv,
				cursor: assignedCursor
			};
			socket.send(JSON.stringify(dataToSend));
		}
	})

	$(".mosaicMatrixOnSideBar").draggable();

	$("#moveButtonOrEdit").click(function () {
		if (!moveModeOn) {
			$("#moveOrEditModal").modal("show");
		} else {
			var dataToSend = {
				message: "moveObject",
				type: 'userMessage',
				room: pin_priv,
				user: $("#userDisplay").text(),
				userId: userId,
				cursor: assignedCursor
			};
			socket.emit("move_object", dataToSend)
			moveModeOn = false;
		}
	})

	$("#moveButton").click(function () {
		moveModeOn = true;
		var dataToSend = {
			message: "moveObject",
			type: 'userMessage',
			user: $("#userDisplay").text(),
			userId: userId,
			room: pin_priv,
			cursor: assignedCursor
		};
		socket.emit("move_object", dataToSend)
	})

	$("#editButton").click(function () {
		editText();
	})

	$("#deleteObject").click(function () {
		var dataToSend = {
			message: "deleteObject",
			type: 'userMessage',
			user: $("#userDisplay").text(),
			room: pin_priv,
			userId: userId
		};
		socket.emit("delete_object", dataToSend)
	})

	$("#addNewObject").click(function () {
		$("#textArea").val("");
		changeMode('workspace');
	})

	// end event registration
	$("#workspaceMode").hide();
	$("#uploadForm").submit(function () { });

	//buttons in selectEditOrDeleteObjectModal
	$("#selectObjectBtn").click(function () {
		showObjectInBarSide(objectSelectedId);
		changeMode("trackpad");
	});

	$("#editObjectBtn").click(function () {
		if (objectsCreatedJson[objectSelectedId].kindOfObjectToSend == "image") {
			swal.fire("Por el momento no se pueden editar imagenes", ":(", "warning")
		} else {
			$("#addNewObject").click();
			$("#textArea").val(objectsCreatedJson[objectSelectedId].text);
		}
		editModeOn = true;
	});

	$("#deleteObjectBtn").click(function () {
		if (currentObjectToSend == objectSelectedId) {
			swal.fire("No se puede eliminar elemento", "Ya que se encuentra seleccionado para compartirse", "warning")
		} else {
			$("#" + objectSelectedId).hide();
			$("#" + objectSelectedId).remove();
			delete objectsCreatedJson[objectSelectedId];
			localStorage.setItem("objectsCreatedJson", JSON.stringify(objectsCreatedJson));
		}
	});

	// calling initial functions
	onSocketMessage();
	var cursorInLocalStorage = localStorage.getItem("cursor");
	// consolelo
	//showCursor(cursorInLocalStorage)  TODO(): check if we need this functionality on v5.0
});

// START all the Private Zone functions
// Start Function to change from trackpad - workspace mode
function changeMode(mode) {
	model.mode = mode;
	switch (mode) {
		case "trackpad":
			$("#workspaceMode").hide();
			$("#selectMosaicWorkspace").hide();
			$("#selectMosaicSpace").hide();
			$("#trackpadMode").show();
			$("#trackpadSideBar").show();
			$(".mosaicMatrixOnSideBar").hide();
			$(".sideBarBtn").css("outline-style", "none");
			$(".sideBarBtn").css("outline", "none");
			$("#sidebar-wrapper").css("height", "100%");
			$("#sidebar-wrapper").css("width", "347px");
			$("#linkMode").hide();
			break
		case "workspace":
			$("#workspaceMode").show();
			$("#selectMosaicWorkspace").hide();
			$("#selectMosaicSpace").hide();
			$("#trackpadMode").hide();
			$("#trackpadSideBar").hide();
			$("#linkMode").hide();
			break
		case "selectMosaic":
			$("#workspaceMode").hide();
			$("#trackpadMode").hide();
			$("#trackpadSideBar").hide();
			$("#selectMosaicWorkspace").show();
			$("#selectMosaicSpace").show();
			$(".mosaicMatrixOnSideBar").show();
			$("#linkMode").hide();
			break
		case "linkmode":
			$("#linkMode").show();
			$("#workspaceMode").hide();
			$("#selectMosaicWorkspace").hide();
			$("#selectMosaicSpace").hide();
			$("#trackpadMode").hide();
			$("#trackpadSideBar").hide();
			break
	}
} // end Function to change from trackpad - workspace mode

function showDropdownContent(dropdown) {
	var dropdownContent = dropdown.querySelector('.dropdown-content');
	dropdownContent.style.display = 'block';
}

function hideDropdownContent(dropdown) {
	var dropdownContent = dropdown.querySelector('.dropdown-content');
	if (!dropdown.matches(':hover')) {
		dropdownContent.style.display = 'none';
	}
}

function highlightElement(element) {
	element.style.border = '2px solid black';
	element.style.padding = '6px';
	element.style.borderRadius = '15px';
}

function removeHighlight(element) {
	element.style.border = 'none';
	element.style.padding = '0';
	element.style.borderRadius = '0';
}

// Start Function to save mosaic Matrix in Mosaic Matrix Array in Model Data
function saveNewObject() {
	var d = new Date();
	var newTextId = "textDiv" + objectsCreated
	var privateId = 'privateId' + d.getTime()
	var element =
		'<div class="activitycontainer"' +
		'<div style="text-align:center; padding:5px; margin-bottom:20px;">' +
		'<div class="dotsMenu">' +
		'<div class="dropdown" onmouseover="showDropdownContent(this);" onmouseout="hideDropdownContent(this);">' +
		'<button style="position: relative; width:3rem; height:3rem; left:150px; top:50px; background-color: #99CCFF; border: none;">' +
		'<img src= "/images/puntos_blancos.svg">' +
		'</button>' +
		'<div class="dropdown-content" style="position:absolute; left: 175px; top: 25px; display: none;">' +
		'<div style="background-color: #E62C56; height: 120px; width: 200px; display: flex; flex-direction: column; border-radius: 15px; padding: 20px;">' +
		'<a id="' + newTextId + 'editSessionBtnA" onclick="editObject(this.id);" onmouseover="highlightElement(this);" onmouseout="removeHighlight(this);"  style="margin-bottom: 8px; margin-top: -8px; color: white;" data-toggle="modal">Editar</a>' +
		'<a id="' + newTextId + 'moveSessionBtnA" onclick="moveObject(this.id);" onmouseover="highlightElement(this);" onmouseout="removeHighlight(this);"  style="margin-bottom: 8px; margin-top: 8px; color: white;">Mover </a>' +
		'<a id="' + newTextId + 'deleteSessionBtnA" onclick="deleteObject(this.id);" onmouseover="highlightElement(this);" onmouseout="removeHighlight(this);"  style="margin-bottom: 8px; margin-top: 8px; color: white;">Eliminar </a>' +
		'</div>' +
		'</div>' +
		'</div>' +
		'</div>' +
		'</div>' +
		'</div>'
	if (kindOfObjectToSend == "text") {
		if (nombreLink) {
			var getText = nombreLink;
		} else {
			var getText = $.trim($("#textArea").val())
		}
		var ownersbox = "";

		if (nombreLink) {
			var getText = nombreLink;
			$("#mosaicToSend").html("<div id=" + newTextId + " class='mosaicToSend'> <p id='textoEnlace'>" + getText + "</p> </div>" + element);
		} else {
			var getText = $.trim($("#textArea").val())
			$("#mosaicToSend").html("<div id=" + newTextId + " class='mosaicToSend'>" + getText + "</div>" + element);
		}
		$("#mosaicToSend").draggable({
			helper: "clone",
			scroll: false,
			stop: function (event, ui) {
				sendObject(privateId)
			}, delay: 100
		}).on('drag', function () {
			sendCoordinates(event, "onDrag");
		})
		ownersbox = '<img src="../cursors/ropen' + assignedCursor + '.png" width="30" height="30" class="ownersbox" />';
		var newObject = "<div  id=" + privateId + " class='divTextSelectWrapper'  >" +
			'<div class="row"><div class="newObjectPosition">.</div>' + ownersbox + '</div>' +
			"<div class='row'>" +
			"<div id=" + privateId + " class='divTextSelectV2 newObject' style='border-color:" + arrayColors[assignedCursor - 1] + "'>" + getText + "</div>" +
			"</div>" +
			"</div>"
		$("#selectMosaicWorkspace").append("<div id=" + privateId + " class='divTextSelect newObject' style='border-color:" + arrayColors[assignedCursor - 1] + "'>" + getText + "</div>")
		$("#" + privateId).click(function () {
			$("#selectEditOrDeletObjectModal").modal("show");
			objectSelectedId = privateId;
		})
		objectSelectedId = privateId;
		if (nombreLink) {
			$("#textoEnlace").click(function () {
				console.log(link);
				window.open(link, "_blank");
			});
		}
		var owners;
		if ("undefined" != typeof currentEditedExternalObjectId.objectId) {
			owners = determineOwners()
		} else {	//is a new element
			owners = [userId];
		}
		objectsCreatedJson[privateId] = {
			"create_date": d,
			"kindOfObjectToSend": kindOfObjectToSend,
			"text": getText,
			"owners": owners,
			"link": link,
			"linkname": nombreLink
		}
		if (isAnEditedObject) {
			originalEditedObject.last_edited_date = d
			objectsCreatedJson[privateId].originalObject = originalEditedObject
			objectsCreatedJson[privateId].privateId = originalEditedObject.privateId
		} else {
			objectsCreatedJson[privateId].originalObject = null
			objectsCreatedJson[privateId].privateId = privateId
		}
		originalEditedObject = {}
		isAnEditedObject = false
		localStorage.setItem("objectsCreatedJson", JSON.stringify(objectsCreatedJson));
	} else if (kindOfObjectToSend == "image") {
		var newId = "imageDiv" + objectsCreated;
		var originalName = $("#imageSelected").val().replace("C:\\fakepath\\", "")

		$("#mosaicToSend").draggable({
			helper: "clone",
			scroll: false,
			stop: function (event, ui) {
				sendObject(privateId)
			}, delay: 100
		}).on('drag', function () {
			sendCoordinates(event, "onDrag");
		})
		$("#mosaicToSend").html("<img class='mosaicToSendSize' src='/images/loader.gif' ></img>");

		objectsCreatedJson[privateId] = {
			"create_date": d,
			"kindOfObjectToSend": kindOfObjectToSend,
			"text": "",
			"owners": owners
		}
		objectsCreatedJson[privateId].originalObject = null
		objectsCreatedJson[privateId].privateId = privateId
		localStorage.setItem("objectsCreatedJson", JSON.stringify(objectsCreatedJson));
		setTimeout(function () {
			loadImageOnClient(newId, originalName, privateId)
		}, 2000);
		objectSelectedId = privateId;
		newId_image = newId;
	}
	objectsCreated++;
}

function editObject(id) {
	editModeOn = true;
	if (kindOfObjectToSend == "text") {
		console.log('Text');
		if (link) {
			console.log('2 Link');
			modalId = "#linkMode";
			$("#addLink").click();
			$("#linkArea").val(objectsCreatedJson[objectSelectedId].link);
			$("#nombreLinkArea").val(objectsCreatedJson[objectSelectedId].linkname);
			console.log("editObject(id) linkname ->" + objectsCreatedJson[objectSelectedId].linkname)
		} else {
			$("#addNewObject").click();
			$("#textArea").val(objectsCreatedJson[objectSelectedId].text);
			console.log('3 Text');
		}
	} else if (kindOfObjectToSend == "image") {
		console.log('Image');
		$("#chooseFile").click();
	}
	cleanId = id.replace("editObjectBtnA", "");
}

//Start Function Send Object to the public Zone
function sendObject(privateId) {
	var owners = objectsCreatedJson[privateId].owners;
	if (model.mode == "trackpad") {
		if ((event.pageX - 220) > 0) {
			var objectToSend = objectsCreatedJson[privateId];
			var widthSideBar = $("#sidebar-wrapper").width();
			var trackPadHeight = $(document).height();
			var trackPadWidth = $(document).width() - widthSideBar;
			var percentageXcoordinate = (event.pageX - 220) / trackPadWidth;
			var percentageYcoordinate = (event.pageY) / trackPadHeight;
			var dataPrueba = {
				id: privateId,
				room: pin_priv,
				originalObject: objectToSend.originalObject,
				percentageX: percentageXcoordinate,
				percentageY: percentageYcoordinate,
				kindOfObjectReceived: objectToSend.kindOfObjectToSend,
				cursor: assignedCursor,
				owners: owners,
				userId: userId
			};
			if (dataPrueba.originalObject !== null && objectToSend.kindOfObjectToSend == "text") {
				dataPrueba.originalObject.shared_times = dataPrueba.originalObject.shared_times + 1
			}
			if (objectToSend.kindOfObjectToSend == "text") {
				dataPrueba.text = objectsCreatedJson[privateId].text;
			} else if (objectToSend.kindOfObjectToSend == "image") {
				dataPrueba.image_path = serverFileName;
			}
			socket.emit("display_new_object", dataPrueba);
			$("#mosaicToSend").html("")
		}
	}

}

// Start function to sendCoordinates
function sendCoordinates(event, typeOfEvent) {
	var sendCoordinatesEachThisNumber = 5;
	numberOfRequest++;
	if (event.pageX > 0 && numberOfRequest > (sendCoordinatesEachThisNumber - 2) &&
		(OS_Device == "Android" || numberOfRequest == (sendCoordinatesEachThisNumber - 1))) {
		var widthSideBar = $("#sidebar-wrapper").width();
		var trackPadHeight = $("#trackpadMode").height();
		var trackPadWidth = $("#trackpadMode").width() - widthSideBar;
		var percentageXcoordinate = (event.pageX - 220) / trackPadWidth;
		var percentageYcoordinate = (event.pageY) / trackPadHeight;

		var dataPrueba = {
			message: "sendingCoordinatesOnDrag",
			type: 'userMessage',
			room: pin_priv,
			user: $.trim($("#userDisplay").text()),
			percentageX: percentageXcoordinate,
			percentageY: percentageYcoordinate,
			typeOfEvent: typeOfEvent,
			userId: userId
		};
		socket.emit("drag_new_object", dataPrueba);
	}
	//sendCoordinatesEachThisNumber
	if (numberOfRequest > sendCoordinatesEachThisNumber) {
		numberOfRequest = 0;
	}
}

function setOutLine(element) {
	$(".sideBarBtn").css("outline-style", "none");
	$(".sideBarBtn").css("outline", "none");
	$("#" + element.id).css("outline-style", "dotted");
	$("#" + element.id).css("outline-width", "7px");
	$("#" + element.id).css("outline-color", "#8E8F8C");
}

/**
* Determine the mobile operating system.
* This function either returns 'iOS', 'Android' or 'unknown'
* @returns {String}
*/
function getMobileOperatingSystem() {
	var userAgent = navigator.userAgent || navigator.vendor || window.opera;
	if (userAgent.match(/iPad/i) || userAgent.match(/iPhone/i) || userAgent.match(/iPod/i)) {
		return 'iOS';
	} else if (userAgent.match(/Android/i)) {
		return 'Android';
	} else {
		return 'unknown';
	}
}

/*
 * Sends the resulting's track pad event position to server
 */
function sendingCoordinatesAsATrackPad(event) {
  var sendCoordinatesEachThisNumber = 5;
  var displacementX = 0;
  var displacementY = 0;
  var changesInPixelsInTrackPad = 5;
  if (!("undefined" === typeof event.originalEvent)) {
    if (sendCoordinatesEachThisNumber < counterInSendingTrackPadCoordinates) {
      counterInSendingTrackPadCoordinates = 0;
      displacementY = event.originalEvent.pageY - positionStartCursorY;
      displacementX = event.originalEvent.pageX - positionStartCursorX;
      var dataToSend = {
        room: pin_priv,
        message: "trackPadCoordinates",
        type: 'userMessage',
        user: $("#userDisplay").text(),
        x: displacementX * changesInPixelsInTrackPad,
        y: displacementY * changesInPixelsInTrackPad,
        userId: userId
      };
      socket.emit('move_cursor', dataToSend);
    }
    counterInSendingTrackPadCoordinates++;
    positionStartCursorX = event.originalEvent.pageX;
    positionStartCursorY = event.originalEvent.pageY
  }
}

// function to sumbit form automatically
function submitForm() {
  var formData = new FormData(document.getElementById('uploadForm'));
  $.ajax({
    url: '/api/photo',
    type: 'POST',
    data: formData,
    processData: false,
    contentType: false,
    success: function (data) {
      // The response from /api/photo is a script. We need to extract the filename.
      var match = data.match(/localStorage\.setItem\("serverFileName","([^"]+)"\)/);
      if (match && match[1]) {
        serverFileName = match[1];
        uploaded = true;
        if (editModeOn) {
          loadImageOnClient(newId_image, "", objectSelectedId);
        } else {
          kindOfObjectToSend = "image";
          saveNewObject();
          changeMode('trackpad');
        }
      } else {
        console.error("Could not extract filename from response.");
      }
    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.error('File upload failed: ' + textStatus, errorThrown);
    }
  });
}
function chooseFile() {
	$("#imageSelected").click();
}

function loadImageOnClient(newId, originalName, privateId) {
  var element =
    '<div class="activitycontainer"' +
    '<div style="text-align:center; padding:5px; margin-bottom:20px;">' +
    '<div class="dotsMenu">' +
    '<div class="dropdown" onmouseover="showDropdownContent(this);" onmouseout="hideDropdownContent(this);">' +
    '<button style="position: relative; width:3rem; height:3rem; left:150px; top:50px; background-color: #99CCFF; border: none;">' +
    '<img src= "/images/puntos_blancos.svg">' +
    '</button>' +
    '<div class="dropdown-content" style="position:absolute; left: 175px; top: 25px; display: none;">' +
    '<div style="background-color: #E62C56; height: 120px; width: 200px; display: flex; flex-direction: column; border-radius: 15px; padding: 20px;">' +
    '<a id="' + newId + 'editObjectBtnA" onclick="editObject(this.id);" onmouseover="highlightElement(this);" onmouseout="removeHighlight(this);"  style="margin-bottom: 8px; margin-top: -8px; color: white;" data-toggle="modal">Editar</a>' +
    '<a id="' + newId + 'moveObjectBtnA" onclick="moveObject(this.id);" onmouseover="highlightElement(this);" onmouseout="removeHighlight(this);"  style="margin-bottom: 8px; margin-top: 8px; color: white;">Mover </a>' +
    '<a id="' + newId + 'deleteObjectBtnA" onclick="deleteObject(this.id);" onmouseover="highlightElement(this);" onmouseout="removeHighlight(this);"  style="margin-bottom: 8px; margin-top: 8px; color: white;">Eliminar </a>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>'
  $("#mosaicToSend").html("<img class='mosaicToSendSize' src='/uploads/" + serverFileName + "' ></img>" + element);
  $("#selectMosaicWorkspace").append("<img id=" + privateId + "  class='divImageSelect' src='/uploads/" + serverFileName + "' style='border: 3px solid; border-color:" + arrayColors[assignedCursor - 1] + "'  ></img> ")
  uploaded = false;
  objectsCreatedJson[privateId] = {
    "privateId": privateId,
    "kindOfObjectToSend": "image",
    "owners": [userId],
    "image_path": serverFileName
  }
  localStorage.setItem("objectsCreatedJson", JSON.stringify(objectsCreatedJson));
  $("#" + privateId).click(function () {
    $("#selectEditOrDeletObjectModal").modal("show");
    objectSelectedId = privateId;
  })
  if (editModeOn) {
    editModeOn = false;
  }
}

function getSessionData() {
	$.ajax({
		type: 'GET',
		url: '/getCurrentSessionData',
		data: "",
		dataType: 'json',
		success: function (res) {
			if (res.status == 'ok') {
				sessionData = JSON.parse(res.data)
			}
		}
	}); //end ajax
}

function onSocketMessage() {
	// when a session is loaded
	socket.on('message', function (data) {
		if (typeof data.message != 'undefined') {
			switch (data.message) {
				case "editObjectResponse":
					if (data.userId == userId) {
						$(".createObject").click();
						$("#addNewObject").click();
						$("#textArea").val(data.text);
						isAnEditedObject = true;
						data.completeObject.edited_times = data.completeObject.edited_times + 1
						data.completeObject.return_private_zone_date = new Date()
						originalEditedObject = data.completeObject;
						currentEditedExternalObjectId = {
							"objectId": data.objectId,
							"owners": data.owners,
							"cursor": data.cursor
						};
					}
					break;
				case "deleteObjectResponse":
					if (data.userId == userId) {
						swal.fire("No tienes permisos para borrar este elemento");
					}
					break;
			}
		} else {
			switch (data.typeMessage) {
				case 'stopSession':
					$("#blockScreenModal").modal("show");
					break;
				case 'resumeSession':
					$("#blockScreenModal").modal("hide");
					break;
				case 'adminLogOut':
					exitPrivateZone()
					break;
				default:
					// do nothing
					break;
			}
		}
	});
}

function exitPrivateZone() {
	localStorage.removeItem("userId");
	localStorage.removeItem("objectsCreatedJson");
	localStorage.removeItem("cursor")
	localStorage.removeItem("userName")
	window.location = "/auth/user/"
}

function showCursor(cursorInLocalStorage) {
	$('#userCursor').append('<h3>' + userId + '</h3>')
	var cursor = cursorInLocalStorage.replace("cursor", "");
	assignedCursor = cursor;
	var tempColor = arrayColors[assignedCursor - 1];
	$(".divTextSelect").css("border-color", tempColor);
	$('#userCursor').append('<div class="userCursor" style="background-image:url(../cursors/ropen' + cursor + '.png);background-size: 60px 60px;z-index:1">')
	//$("#trackpadMode").css("background", arrayColors[cursor - 1]);
}

function editText() {
	var dataToSend = {
		message: "editObject",
		type: 'userMessage',
		room: pin_priv,
		userId: userId,
		cursor: assignedCursor
	};
	socket.emit("edit_object", dataToSend)
};

function determineOwners() {
	var tempOwners;
	var alredyEditedForMe = false;
	for (var index = 0; index < currentEditedExternalObjectId.owners.length; index++) {
		var element = currentEditedExternalObjectId.owners[index];
		if (element == userId) {
			alredyEditedForMe = true;
			break
		}
	}
	if (alredyEditedForMe) {
		tempOwners = currentEditedExternalObjectId.owners;
		return tempOwners;
	} else {
		tempOwners = currentEditedExternalObjectId.owners
		tempOwners.push(userId);
		currentEditedExternalObjectId = {};
		return tempOwners;
	}
}

function showObjectInBarSide(id) {
	currentObjectToSend = id;
	object = objectsCreatedJson[id];
	var element =
		'<div class="activitycontainer"' +
		'<div style="text-align:center; padding:5px; margin-bottom:20px;">' +
		'<div class="dotsMenu">' +
		'<div class="dropdown" onmouseover="showDropdownContent(this);" onmouseout="hideDropdownContent(this);">' +
		'<button style="position: relative; width:3rem; height:3rem; left:150px; top:50px; background-color: #99CCFF; border: none;">' +
		'<img src= "/images/puntos_blancos.svg">' +
		'</button>' +
		'<div class="dropdown-content" style="position:absolute; left: 175px; top: 25px; display: none;">' +
		'<div style="background-color: #E62C56; height: 120px; width: 200px; display: flex; flex-direction: column; border-radius: 15px; padding: 20px;">' +
		'<a id="editObjectBtnA" onclick="editObject(this.id);" onmouseover="highlightElement(this);" onmouseout="removeHighlight(this);"  style="margin-bottom: 8px; margin-top: -8px; color: white;" data-toggle="modal">Editar</a>' +
		'<a id="moveObjectBtnA" onclick="moveObject(this.id);" onmouseover="highlightElement(this);" onmouseout="removeHighlight(this);"  style="margin-bottom: 8px; margin-top: 8px; color: white;">Mover </a>' +
		'<a id="deleteObjectBtnA" onclick="deleteObject(this.id);" onmouseover="highlightElement(this);" onmouseout="removeHighlight(this);"  style="margin-bottom: 8px; margin-top: 8px; color: white;">Eliminar </a>' +
		'</div>' +
		'</div>' +
		'</div>' +
		'</div>' +
		'</div>' +
		'</div>'
	if (object.kindOfObjectToSend == "text") {
		if (nombreLink) {
			$("#mosaicToSend").html("<div   class='mosaicToSend'> <p id='textoEnlace'>" + object.text + "</div>" + element)
		} else {
			$("#mosaicToSend").html("<div   class='mosaicToSend'>" + object.text + "</div>" + element);
		}
		$("#mosaicToSend").draggable({
			helper: "clone",
			scroll: false,
			stop: function (event, ui) {
				sendObject(id)
			}, delay: 100
		}).on('drag', function () {
			sendCoordinates(event, "onDrag");
		})
		$("#textArea").val(object.text);
		if (nombreLink) {
			$("#textoEnlace").click(function () {
				console.log(link);
				window.open(link, "_blank");
			});
		}
	} else if (object.kindOfObjectToSend == "image") {
		$("#mosaicToSend").draggable({
			helper: "clone",
			scroll: false,
			stop: function (event, ui) {
				sendObject(id)
			}, delay: 100
		}).on('drag', function () {
			sendCoordinates(event, "onDrag");
		})
		$("#mosaicToSend").html("<img class='mosaicToSendSize' src='/uploads/" + object.image_path + "' ></img>");
		serverFileName = object.image_path
	}
}

function renderSavedObjectsInLocalStorage() {
	if (localStorage.getItem("objectsCreatedJson") != null && localStorage.getItem("objectsCreatedJson") != "") {
		objectsCreatedJson = JSON.parse(localStorage.getItem("objectsCreatedJson"));
		for (var key in objectsCreatedJson) {
			var object = objectsCreatedJson[key];
			arrayOfPrivateIds.push(object.privateId);
			if (object.kindOfObjectToSend == "text") {
				kindOfObjectToSend = object.kindOfObjectToSend;
				var ownersbox = "";
				ownersbox = '<img src="../cursors/ropen' + assignedCursor + '.png" width="30" height="30" clas="ownersbox />';
				var newObject = "<div  id=" + object.privateId + " class='divTextSelectWrapper'  >" +
					'<div class="row"><div class="newObjectPosition">.</div>' + ownersbox + '</div>' +
					"<div class='row'>" +
					"<div id=" + object.privateId + " class='divTextSelectV2 newObject' style='border-color:" + arrayColors[assignedCursor - 1] + "'>" + object.text + "</div>" +
					"</div>" +
					"</div>"
				// TODO move this style tag into CSS files issue #23
				$("#selectMosaicWorkspace").append("<div id=" + object.privateId + " class='divTextSelect' style='background:white;font-size:25px;overflow:hidden;border: 3px solid; border-color:" + arrayColors[assignedCursor - 1] + "''>" + object.text + "</div>")
			} else if (object.kindOfObjectToSend == "image") {
				kindOfObjectToSend = object.kindOfObjectToSend;
				// TODO move this style tag into CSS files issue #23
				$("#selectMosaicWorkspace").append("<img id=" + object.privateId + "  class='divImageSelect' src='/uploads/" + object.image_path + "' style='border: 3px solid; border-color:" + arrayColors[assignedCursor - 1] + "'></img> ")
			}
		}// enf for-loop
		for (var i = 0; i < arrayOfPrivateIds.length; i++) {
			var element = arrayOfPrivateIds[i];
			$("#" + arrayOfPrivateIds[i]).click(createCallback(element))
		}
	}
}

function createCallback(element) {
	return function () {
		$("#selectEditOrDeletObjectModal").modal('show');
		objectSelectedId = element;
	}
}

function logOut() {
	var data = {
		pin: pin_priv,
		userId: userId
	};
	socket.emit("log_out_user", data)
	exitPrivateZone()
}

function getActivityData() {
	// TODO cambiar a una promesa Issue #30
	var url_formed = '/api/foro/pin/' + pin_priv
	$.ajax({
		type: 'GET',
		url: url_formed,
		dataType: 'json',
		success: function (res) {
			if (!res.data.is_active) {
				exitPrivateZone()
			}
			if (res.data.is_paused) {
				$("#blockScreenModal").modal("show");
			} else {
				$('#blockScreenModal').modal('hide');
			}
			if (res.data.name != null) {
				$('#ForoName').text(res.data.tema_foro);
			} else {
				$('#ForoName').text('Mural sin título');
			}
		}
	}); //end ajax
}

// socker messages
socket.on('log_out_user_ack', function (data) {
	if (data.status === 200) {
		exitPrivateZone()
	}
});

socket.on('delete_object_denied', function (data) {
	if (data.userId == userId) {
		swal.fire("No tienes permisos para borrar este elemento");
	}
});

socket.on('edit_object_res', function (data) {
	if (data.userId == userId) {
		$(".createObject").click();
		$("#addNewObject").click();
		$("#textArea").val(data.text);
		isAnEditedObject = true;
		originalEditedObject = data.completeObject;
		currentEditedExternalObjectId = {
			"objectId": data.objectId,
			"owners": data.owners,
			"cursor": data.cursor
		};
	}
});

socket.on("log_out_user_now", function (data) {
	exitPrivateZone()
})

function guid() {
	function s4() {
		return Math.floor((1 + Math.random()) * 0x10000).toString(16)
			.substring(1);
	}
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

socket.on("pause_activity", function (data) {
	$("#blockScreenModal").modal("show");
})

socket.on("enable_activity", function (data) {
	$("#blockScreenModal").modal("hide");
})

socket.on("close_activity", function () {
	swal.fire({
		title: "Sesión terminada",
		text: "La sesión ha terminado",
		icon: "info",
		showCancelButton: false,
		confirmButtonColor: "#DD6B55",
		confirmButtonText: "Ir al inicio",
		closeOnConfirm: false
	}).then(result => {
		if (result.value) {
			exitPrivateZone()
		} else {

		}
	});
})

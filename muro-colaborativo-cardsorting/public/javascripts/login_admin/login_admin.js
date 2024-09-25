$(document).ready(function () {
  $("#saveNameBtn").click(function () {
    saveUser();
  });
  $("#resetPassBtn").click(function () {
    resetPassword();
    $("#resetPasswordModal").modal("hide");
  });

  $("#login-btn").click(function () {
    login();
  });

  $("#passwordLogin, #emailLogin ").keyup(function (event) {
    if (event.keyCode == 13) {
      $("#login-btn").click();
    }
  });
});

function saveUser() {
  var nameUser = document.getElementById("sessionNameInput").value;
  //var emailUser = document.getElementById("emailInput").value;
  var emailUser = document.getElementById('emailInput');
  var passUser = document.getElementById("passwordInput").value,
    errors = [];

  var espacios = false;
  var cont = 0;
  var validEmail =  /^\w+([.-_+]?\w+)*@\w+([.-]?\w+)*(\.\w{2,10})+$/;  

  if (nameUser.length == 0) {
    alert("El campo Nombre no puede quedar vacio. Por favor intente de nuevo");
    return false;
  }
  

  //if (emailUser.length == 0) {
  //  alert("El campo Correo no puede quedar vacio. Por favor intente de nuevo");
  //  return false;
  //}

  if (passUser.length < 8) {
    errors.push("La contraseña debe tener al menos 8 caracteres");
  }
  if (passUser.search(/[a-z]/i) < 0) {
    errors.push("La contraseña debe tener al menos una letra.");
  }
  if (passUser.search(/[0-9]/) < 0) {
    errors.push("La contraseña debe tener al menos un número.");
  }
  if (passUser.length == 0) {
    errors.push("Debe ingresar una contraseña. Por favor intente de nuevo");    
  }
  if (errors.length > 0) {
    alert(errors.join("n"));
    return false;
  }

// Using test we can check if the text match the pattern
  if(!validEmail.test(emailUser.value)){    
    alert('Correo No valido');    
  } else {
    var data = {
      name: $.trim($("#sessionNameInput").val()),
      email: $.trim($("#emailInput").val()),
      pw: $.trim($("#passwordInput").val()),
    };
    $.ajax({
      type: "POST",
      url: "/api/users/",
      data: data,
      dataType: "json",
      success: function (res) {
        localStorage.setItem("adminName", data.name);
        localStorage.setItem("adminId", res.data.id);
        localStorage.setItem("adminEmail", data.email);
        localStorage.setItem("logged", "true");
        $.ajax({
          method: "POST",
          url: "/api/activities/",
          data: {
            owner_id: res.data.id,
            titulo: data.name,
          },
        })
          .done(function (res) {
            localStorage.setItem("pin", res.data.pin);
            window.location = "/admin/";
          })
          .fail(function (err) {
            swal.fire(err.responseJSON.msg_dev);
          });
      },
      error: function (err) {
        swal.fire("Este correo ya está registrado");
      },
    }); //end ajax
    alert("Todo esta correcto");
    return true;
  }
}

function resetPassword() {
  var data = {
    email: $.trim($("#resetPassEmail").val()),
  };
  $.ajax({
    method: "POST",
    url: "api/user/recover/",
    data: data,
    dataType: "JSON",
    success: function (res) {
      swal.fire("Se ha enviado un correo con un enlace para recuperar su acceso");
    },
    error: function (err) {
      swal.fire("El correo no está registrado");
    },
  });
}

function login() {
  var data = {
    email: $.trim($("#emailLogin").val()),
    pw: $.trim($("#passwordLogin").val()),
  };
  $.ajax({
    type: "POST",
    url: "/api/users/login/",
    data: data,
    dataType: "json",
    success: function (res) {
      localStorage.setItem("adminName", res.data.name);
      localStorage.setItem("adminId", res.data.id);
      localStorage.setItem("adminEmail", data.email);
      localStorage.setItem("logged", "true");
      window.location = "/admin/";
    },
    error: function (err) {
      $("#errorformulario").append("Usuario o contraseña incorrecto");
    },
  }); //end ajax
}

function proceedLogIn(res) {
  localStorage.setItem("adminName", res.data.name);
  localStorage.setItem("adminId", res.data.accountId);
  localStorage.setItem("adminEmail", res.data.email);
  localStorage.setItem("logged", "true");
  window.location = "/admin/";
}

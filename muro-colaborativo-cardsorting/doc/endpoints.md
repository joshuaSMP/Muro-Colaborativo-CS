# Listado de endpoints

## Índice
- [Endpoints HTML (8)](#endpoints-html)
  - [(GET) /](#get)
  - [(GET) /auth/admin/](#get-authadmin)
  - [(GET) /activity/](#get-activity)
  - [(GET) /activity/public/](#get-activitypublic)
  - [(GET) /auth/user/](#get-authuser)
  - [(GET) /activity/classroom/](#get-activityclassroom)
  - [(GET) /admin/](#get-admin)
  - [(GET) /auth/recover/:request_id/](#get-authrecoverrequest_id)
- [Actividades (5)](#actividades)
  - [(GET) /api/activities/:id](#get-apiactivitiesid)
  - [(GET) /api/activities/](#get-apiactivitiesuser_iduser_id)
  - [(POST) /api/activities/](#post-apiactivities)
  - [(PATCH) /api/activities/:activity_id/](#patch-apiactivitiesactivity_id)
  - [(DELETE) /api/activities/:id](#delete-apiactivitiesid)
- [Objetos compartidos (4)](#objetos-compartidos-shared-objects)
  - [(GET) /api/shared-objects/](#get-apishared-objects)
  - [(POST) /api/shared-objects/](#post-apishared-object)
  - [(PUT) /api/shared-objects/:id/x_coor/:x_coor/y_coor/:y_coor](#put-apishared-objectsidx_coorx_coory_coory_coor)
  - [(DELETE) /api/shared-objects/:id](#delete-apishared-objectsid)
- [Usuarios (4)](#usuarios)
  - [(POST) /api/users/](#post-/api/users/)
  - [(POST) /api/users/login/](#post-apiuserslogin)
  - [(POST) /api/users/recover/](#post-apiusersrequestResetPass)
  - [(POST) /api/users/reset/](#post-api/users/reset/)
- [Materias (3)](#materias)
  - [(GET) /api/subjects/:id](#get-apisubjectsid)
  - [(GET) /api/subjects/](#get-apisubjects)
  - [(POST) /api/subjects/](#post-apisubjects)

## Endpoints HTML

### (GET) /
*Template*: /views/home.ejs

Pagina home

### (GET) /auth/admin/
*Template*: /views/login_admin.ejs

Inicio de sesión para profesores

### (GET) /activity/
*Template*: /views/pin.ejs

Formulario que acepta un pin y busca la actividad relacionada en la base de datos

### (GET) /activity/public/
*Template*: /views/activity/public.ejs

Muro público de una actividad

### (GET) /auth/user/
*Template*: /views/login_privateZone.ejs

Inicio de sesión para un muro privado (acceso con equipo o usuario y pin de la actividad)

### (GET) /activity/classroom/
*Template*: /views/privateZone.ejs

Zona privada

### (GET) /admin/
*Template*: /views/controlSession.ejs

Lista de zonas creadas por el profesor logeado

### (GET) /auth/recover/:request_id/
*Template*: /views/reset_password.ejs
*Query Params*:
- request_id: el request id asociado al usuario

Página para reestablecer la contraseña de un usuario

## Actividades

### (GET) /api/activities/:id
*Query Params*:
- id: el id de una actividad

Regresa la actividad del id dado

### (GET) /api/activities/
*Query Params*:
- user_id: el id de un usuario

Regresa las actividades CREADAS por un usuario

### (POST) /api/activities/
*Body*:
```
{
  owner_id: El id del propietario de la actividad
  background_image: path de la imagen de fondo de la actividad
  name: nombre de la actividad
  pin: pin de la actividad
  subject: nombre de la materia (existente o nueva) asociada a la actividad
}
```

Crea una actividad

### (PATCH) /api/activities/:activity_id/
*Body Params*
- is_active: el estado de una actividad
- is_paused: si la actividad se encuentra pausada
- name: nombre de una actividad
- subject: materia asociada a la actividad
- background_image: imagen de fondo de la actividad

Actualiza las propiedades de una actividad

### (DELETE) /api/activities/:id
*Query Params*:
- id: el id de una actividad

Asigna el valor 'true' a la bandera is_deleted de la actividad dada

## Objetos compartidos (Shared objects)

### (GET) /api/shared-objects/
*Query Params*:
- activity_id: el id de una actividad

Devuelve todos los objetos compartidos asociados a la actividad dada

### (POST) /api/shared-objects/
*Body*:
```
{
  room (int): número identificador de la sala
  percentageX (number): porcentaje de la posicion en el eje x
  percentageY (number): porcentaje de la posición en el eje y
  kindOfObjectReceived (string): tipo de objeto
  cursor (int): 
  text (string): contenido del objeto compartido
  activity_id: id de la actividad a la que pertenece
  owners (string[]): una lista con los id de los usuarios dueños
  imageName: path de la imagen si lo incluye
}
```
Crea un objeto compartido en la base de datos

### (PUT) /api/shared-objects/:id/x_coor/:x_coor/y_coor/:y_coor
*URL paramas*:
- id: el id de un objeto compartido
- x_coor: porcentage de posición en el eje x
- y_coor: porcentage de posición en el eje y

Actualiza los valores para percentage_x y percentage_y de un objeto compartido

### (DELETE) /api/shared-objects/:id
*URL params*:
- id: el id de un objeto compartido

Elimina un objeto compartido

## Usuarios

### (POST) /api/users/
*Body*:
```
{
  email: correo electrónico del usuario
  name: nombre del usuario
  pw: contraseña del usuario
}
```

Crea un usuario

### (POST) /api/users/login
*Body*:
```
{
  email: correo del usuario
  pw: contraseña del usuario
}
```

Devuelve la información del usuario si el correo y la contraseña coinciden con un usuario guardado.

NOTA: la contraseña se hashea pero no se utiliza para el proceso de login.

### (POST) /api/users/recover/
*Body*:
```
{
  email: un correo electrónico
}
```

Manda un correo eletrónico con un link de recuperación para que el usuario reestablesca su contraseña

### (POST) /api/users/reset/
*Body*:
```
{
  request_id: el request id de un usuario
  password: contraseña nueva
}
```

Cambia la contraseña del usuario asociado al request id por la proporcionada

## Materias

### (GET) /api/subjects/:id
*Query params*:
- id: el id de una materia

Devuelve la materia con el id dada

### (GET) /api/subjects/

Devuelve todas las materias

### (POST) /api/subjects/
*Body*:
```
{
  name: nombre de la materia
}
```

Crea una materia

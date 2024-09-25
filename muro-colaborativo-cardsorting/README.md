# Muro colaborativo

## Documentación

- (Lista de endpoints)[./doc/endpoints.md]

## Requerimientos

Requerimientos para correr en un ambiente local:
- Node >= 16
- PostgreSQL >= 14

Para utilizar la versión dockerizada del proyecto, necesitas tener instalado lo siguiente:
- Docker >= 20.10.16
- docker-compose >= 1.29.2

## Instalación

Para preparar un ambiente local, seguir los siguientes pasos antes de correr el proyecto:
1. Instalar las dependencias del proyecto:
```
npm install
```

Para preparar el ambiente dockerizado, seguir los siguientes pasos antes de correr el proyecto:
1. Construir los contenedores:
```
docker-compose build
```

## Configuración

1. Copiar el archivo `.env.example` en un archivo con el nombre `.env`
2. Ingresar los valores correctos de la base de datos a conectar
3. Correr los scripts SQL en la base de datos:
```
# Descripción de la base de datos
psql -h <HOST> -p <PUERTO> -U <USUARIO> -f db/scripts/db.sql
# Triggers
psql -h <HOST> -p <PUERTO> -U <USUARIO> -f db/scripts/db-triggers.sql
```

Para configurar la base de datos desde el ambiente dockerizado, correr el siguiente comando en la consola antes de realizar el paso 3:
1. Ingresar al contenedor de la base de datos:
```
docker-compose exec mc-postgres bash
```

## Inicialización

Para iniciar un ambiente local:
1. Iniciar el proyecto de Node:
```
npm start
```

Para correr un ambiente dockerizado:
1. Iniciar los contenedores:
```
docker-compose up
```

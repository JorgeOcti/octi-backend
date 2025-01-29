<a id="readme-top"></a>

<h1 align="center">OSA Andes</h1>


<div align="center">
  <a href="https://s3-sa-east-1.amazonaws.com/mediaosa/osa_andes_share.jpg">
    <img src="https://s3-sa-east-1.amazonaws.com/mediaosa/osa_andes_share.jpg" alt="Logo" width="100%">
  </a>

<br />

  <p align="center">
    On Shelf Availability para control de unidades.
    <br />
    <a href="https://andes.osacontrol.com/api-docs/"><strong>Api docs »</strong></a>
    <br />
  </p>

</div>



<!-- TABLE OF CONTENTS -->
<details>
  <summary>Tabla de contenidos</summary>
  <ol>
    <li>
      <a href="#getting-started">Configuración inicial</a>
      <ul>
        <li><a href="#prerequisites">Prerrequisitos</a></li>
        <li><a href="#installation">Instalación</a></li>
        <li><a href="#readme-env">Configuración del .env</a></li>
      </ul>
    </li>
    <li>
      <a href="#usage">Como usar</a>
      <ul>
        <li><a href="#open">Como abrir la aplicación</a></li>
        <li><a href="#user">Usuarios disponibles por defecto</a></li>
      </ul>
    </li>
  </ol>
</details>

<!-- GETTING STARTED -->
## Configuración inicial

En la siguiente sección se detallan los pasos para poder configurar inicialmente la aplicación para poder correrla en un ambiente local.

<a id="prerrequisites"></a>
### Requisitos

La aplicación se encuentra completamente manejada en containers de docker, por lo anterior, la única dependencia necesaria inicialmente es tener docker y docker-compose instalado en la máquina local.

* docker  
  Para instalar docker pueden verse las instrucciones para cada sistema operativo directamente en su [página](https://www.docker.com/get-started/)

* npm  
  Opcionalmente, se puede mantener la última versión de npm, para poder correr alguno de los componentes de la app sin ocupar docker.
  ```sh
  npm install npm@latest -g
  ```

<a id="installation"></a>
### Instalación
1. Hacer un fork del repo en bitbucket

2. Clonar el repo
   ```sh
    git clone <link-del-fork>
   ```
3. Entrar a la carpeta del proyecto
4. Hacer el build de los contenedores de docker
   ```sh
    docker compose build
   ```
5. Crear un archivo .env en la carpeta del proyecto y
setear las <a href="#readme-env">Configuración inicial</a>

6. Correr los contenedores de docker
   ```sh
   docker compose up -d
   ```
7. Entrar a la carpeta dummy_data
  
8. Revisar el nombre del contenedor que tiene la base de datos
   ```sh
   docker ps --filter name=mongo
   ```
9. Corre el script de carga de datos entregándole el nombre del contenedor
   ```sh
   ./dataLoad.sh <nombre-del-contenedor>
   ```

<a id="readme-env"></a>
### Configuración del .env

A continuación se detallan las variables que debe de tener el .env, sus significados y sus posibles valores por defecto.

#### Configuración base

* SECRET_KEY  
  Es la llave que se ocupa para encriptar las contraseñas de los usuarios, por ende, si se estan ocupando los datos de prueba de la base de datos, entonces se sugiere ocupar el siguiente valor por defecto:
   ```sh
    SECRET_KEY=m9nqdK2tLv3pr9Vu7h4AAE3f68m4Eyy0
   ```
  
* ENV  
  Setea el ambiente
   ```sh
    ENV=development
   ```

* PORT  
  Setea el puerto para el frontend
   ```sh
    PORT=3030
   ```
* SITE_URL  
  Setea la url para el sitio
   ```sh
    SITE_URL=http://localhost:3030
   ```

#### Configuración de externos

A contiuación se detallan las variables de ambiente para trabajar con recursos externos al codigo fuente, estas no tienen un valor por defecto a usar.

* S3  
   ```sh
    S3_BUCKET=
    S3_KEY=
    S3_SECRET=
    S3_REGION=
   ```
* AWS  
   ```sh
    AWS_SECRET_ACCESS_KEY=
    AWS_REGION=
    AWS_ACCESS_KEY_ID=
   ```
* PUSHER  
   ```sh
    PUHSER_SECRET_KEY=
    PUSHER_INSTANCE_ID=
   ```

* SENTRY  
   ```sh
    SENTRY_DNS=
   ```
* SES  
   ```sh
    SES_REGION=
   ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<a id="usage"></a>
## Como usar

En esta sección se explica brevemente como ocupar la aplicación.

<a id="open"></a>
### Como abrir la aplicación

Luego de tener corriendo toda la aplicación con lo visto en la sección pasada. Se debe ingresar a la aplicación por medio del navegador, entrando al [localhost:3030](http://localhost:3030/).

Entrando lo primero que veremos será el login, si configuramos correctamente el .env y subimos los datos de prueba a la base de datos, entonces podremos usar cualquiera de los usuarios que se detallan en la siguiente sección y entrar a la aplicación.

<a id="user"></a>
### Usuarios disponibles por defecto
A continuación se detallan los usuarios creados por defecto en la base de datos. Todos los usuarios tienen distintas cantidades de información, sin embargo, el usuario que tiene acceso a la información más completa y compleja es el que está marcado con una ```x``` en ```most_populated```.
| email                      | password | venue    | company                          | team  | most_populated |
| -------------------------- | -------- | -------- | -------------------------------- | ----- | -------------- |
| Garrett_Heller93@gmail.com | tenavero | MAGENTA  | POTATOES SALAD                   | whale |                |
| Dan.Schowalter11@yahoo.com | waqotale | GOLD     | WARD'S SPECIAL BLUE SWIMMER CRAB | whale |                |
| Marsha_Tromp@hotmail.com   | sememixo | LAVENDER | BUNNY CHOW                       | whale | x              |

<p align="right">(<a href="#readme-top">back to top</a>)</p>

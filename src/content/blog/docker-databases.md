---
title: Docker Compose para Bases de Datos y Herramientas de Administración
author: Codevs
pubDatetime: 2024-10-09T03:42:51Z
slug: docker-databases
featured: false
tags:
  - Docker
  - Dockerfile
  - MySql
  - PostgreSql
  - Adminer
description:
  "El uso de contenedores ha transformado el desarrollo de aplicaciones al ofrecer entornos reproducibles y fáciles de configurar."
---

El uso de contenedores ha transformado el desarrollo de aplicaciones al ofrecer entornos reproducibles y fáciles de configurar. Docker es una herramienta clave para implementar rápidamente bases de datos y herramientas de administración como Adminer y PHPMyAdmin. Este artículo describe cómo configurar un entorno con PostgreSQL, MariaDB, Adminer, y opcionalmente, PHPMyAdmin usando docker-compose.

### 1. ¿Qué es Docker Compose?

Docker Compose es una herramienta que te permite definir y ejecutar aplicaciones multicontenedor en Docker usando un archivo YAML. Este archivo permite gestionar todos los servicios de la aplicación de manera centralizada.

En este ejemplo, configuramos PostgreSQL, MariaDB y dos herramientas para la administración de bases de datos: Adminer y PHPMyAdmin.

### 2. Descripción del archivo docker-compose.yml

El siguiente es el archivo docker-compose.yml, que define los contenedores para las bases de datos y sus herramientas de administración.

```yaml

version: "3"

services:
  postgres:
    container_name: "POSTGRES-DB"
    image: postgres:16
    restart: always
    volumes:
      - ./pgdata:/var/lib/postgresql/data  
    environment:
      POSTGRES_USER: root         
      POSTGRES_PASSWORD: sample 
    ports:
      - "5432:5432"                 
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U root"]
      interval: 10s
      timeout: 5s
      retries: 5
  
  mysql:
    container_name: "MYSQL-DB"
    image: mariadb:latest
    restart: always
    volumes:
      - ./mariadb:/var/lib/mysql
    environment:
      MYSQL_ROOT_PASSWORD: sample
      MYSQL_PASSWORD: sample
    ports:
      - "3306:3306"
    healthcheck:
      test: ["CMD-SHELL", "mysqladmin ping -h localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  adminer:
    container_name: "TRY-ADMINER-MAIN"
    image: adminer
    restart: always
    depends_on:
      - mysql
      - postgres
    ports:
      - 8080:8080
```

#### Servicios configurados

- PostgreSQL: Base de datos relacional que utiliza un volumen para persistir los datos.
            Se expone en el puerto 5432.
            Incluye una verificación de salud (healthcheck) que se ejecuta cada 10 segundos.

- MariaDB: Base de datos relacional similar a MySQL.
        Volúmenes utilizados para persistencia y otros datos.
        Se expone en el puerto 3306.

- Adminer: Herramienta ligera para la administración de bases de datos.
        Se expone en el puerto 8080.
        Administra tanto MariaDB como PostgreSQL.

Utiliza un archivo de configuración personalizado y un volumen para persistir los datos.

### 3. Configuración de las bases de datos

PostgreSQL: La imagen postgres:16 instala PostgreSQL versión 16. El servicio define las credenciales para el usuario root con la contraseña sample. El volumen ./pgdata asegura que los datos se conserven incluso si el contenedor se reinicia.

MariaDB: Se utiliza la imagen mariadb:latest. Al igual que en PostgreSQL, se especifica una contraseña para root. Los volúmenes mapean el directorio de datos (/var/lib/mysql) y otro directorio (/home) para propósitos adicionales.

### 4. Administración de bases de datos con Adminer y PHPMyAdmin

Adminer: Esta herramienta permite gestionar las bases de datos desde una interfaz web sencilla. Adminer está configurado para depender de postgres y db, por lo que estará disponible una vez que ambas bases de datos estén listas. Se accede a través del puerto 8080.

PHPMyAdmin (opcional): Si necesitas usar PHPMyAdmin para gestionar MariaDB, puedes descomentar el servicio correspondiente. PHPMyAdmin se configurará para conectarse a MariaDB y estará disponible en el puerto 8081. Lo utilizo para poder generar el diagrama de la base de datos.

```yaml
    phpmyadmin:
    image: phpmyadmin/phpmyadmin
    container_name: pma
    depends_on:
        - db
    environment:
        PMA_HOST: db
        PMA_PORT: 3306
        PMA_ARBITRARY: 1
    restart: always
    ports:
        - 8081:80
```

### 5. Conclusión

Con este docker-compose.yml, puedes configurar un entorno con dos bases de datos (PostgreSQL y MariaDB), una herramienta de administración ligera como Adminer. Este enfoque es ideal para entornos de desarrollo donde es necesario gestionar múltiples servicios de manera sencilla y rápida.

Puedes ajustar este archivo según tus necesidades, añadiendo o eliminando servicios y configuraciones.

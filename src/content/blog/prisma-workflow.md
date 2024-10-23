---
title: Dominando Prisma, Creación de Bases de Datos y Migraciones Eficientes
author: Codevs
pubDatetime: 2024-10-22T03:42:51Z
slug: prisma-workflow
featured: false
tags:
  - Prisma
  - Database
  - MySql
  - PostgreSql
description:
  "En este artículo exploraremos cómo usar Prisma para gestionar bases de datos de manera eficiente con MySQL y PostgreSQL."
---


En este artículo, exploraremos cómo usar Prisma para gestionar bases de datos de manera eficiente con MySQL y PostgreSQL. Desde la creación del esquema hasta el manejo de migraciones en entornos de producción, este tutorial cubre cada paso con ejemplos claros y concisos. Además, hablaremos sobre cómo gestionar vistas en Prisma y las diferencias clave entre MySQL y PostgreSQL. ¡Ideal para desarrolladores que buscan optimizar el trabajo con bases de datos relacionales usando Prisma!

## 1. Creación de la base de datos a partir del schema

Prisma facilita la creación de una base de datos a partir de un archivo de esquema (schema.prisma). Este archivo define tus modelos, relaciones y más. A continuación, veremos cómo hacerlo paso a paso con MySQL.

Ejemplo con MySQL
Asegúrate de tener el archivo schema.prisma configurado con el siguiente ejemplo:

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id    Int     @id @default(autoincrement())
  name  String
  email String  @unique
  age   Int
}
```

Datasource define la conexión a la base de datos.
Generator crea el cliente Prisma para que lo uses en tu código.
Model define las tablas (en este caso, una tabla User con campos id, name y email).
Comandos de migración
Para generar las tablas a partir del schema, puedes utilizar uno de estos comandos:

```bash
npx prisma db push
```

O bien, para generar una migración:

```bash
npx prisma migrate dev --name init
```

Estos comandos crearán las tablas necesarias en tu base de datos MySQL.

### Diferencia con PostgreSQL

El esquema sería muy similar, cambiando el provider a postgresql:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

En PostgreSQL, se permite usar funciones avanzadas como arrays y jsonb, mientras que MySQL no tiene soporte nativo para estos tipos de datos.

## 2. Eliminar un campo de un modelo existente

Supongamos que queremos eliminar el campo age del siguiente modelo User:

### Modelo inicial

```prisma
model User {
  id    Int     @id @default(autoincrement())
  name  String
  email String  @unique
  age   Int     // Campo a eliminar
  posts Post[]
}
```

Editar el archivo schema.prisma

```prisma
model User {
  id    Int     @id @default(autoincrement())
  name  String
  email String  @unique
  posts Post[]
}
```

Crear la nueva migración
Después de editar el archivo, ejecuta el siguiente comando para crear la migración:

```bash
npx prisma migrate dev --name remove_age_field
```

Este comando generará una migración que elimina el campo age. El SQL generado puede verse de la siguiente manera:

```sql
ALTER TABLE `User` DROP COLUMN `age`;
```

## 3. Cambiar el tipo de datos de un campo

Supongamos que queremos cambiar el tipo del campo email de String a Text.

Modelo inicial

```prisma
model User {
  id    Int     @id @default(autoincrement())
  name  String
  email String  @unique
  posts Post[]
}
```

Editar el archivo schema.prisma

```prisma
model User {
  id    Int     @id @default(autoincrement())
  name  String
  email Text    @unique // Cambiamos a tipo Text
  posts Post[]
}
```

Crear la nueva migración
Genera la nueva migración con el siguiente comando:

```bash
npx prisma migrate dev --name change_email_to_text
```

El SQL generado podría ser algo como esto:

```sql
ALTER TABLE `User` MODIFY COLUMN `email` TEXT;
```

## 4. Agregar una nueva tabla

Imagina que necesitas agregar una tabla Comment. Para ello, añade el siguiente modelo en el archivo schema.prisma:

```prisma
model User {
  id    Int     @id @default(autoincrement())
  name  String
  email String  @unique
  posts Post[]
}

model Post {
  id      Int     @id @default(autoincrement())
  title   String
  content String
  userId  Int
  user    User    @relation(fields: [userId], references: [id])
  comments Comment[]
}

model Comment {
  id      Int     @id @default(autoincrement())
  content String
  postId  Int
  post    Post    @relation(fields: [postId], references: [id])
}
```

Crear la nueva migración

```bash
npx prisma migrate dev --name add_comment_model
```

El SQL generado para crear la tabla Comment sería algo como esto:

```sql
CREATE TABLE `Comment` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `content` VARCHAR(255) NOT NULL,
  `postId` INT NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE CASCADE
);
```

## 5. Qué hacer si modificas manualmente el archivo de migración

Si decides editar el archivo migration.sql manualmente, asegúrate de seguir estos pasos:

- Pruebas: Aplica los cambios en un entorno de prueba antes de hacerlo en producción.
Sincronización con el schema: Asegúrate de que el archivo schema.prisma refleje los cambios.

Por ejemplo, si cambias la longitud de una columna name de 255 a 100 caracteres:

Antes:

```sql
ALTER TABLE `User` ADD COLUMN `name` VARCHAR(255);
```

Después (editado manualmente):

```sql
ALTER TABLE `User` ADD COLUMN `name` VARCHAR(100);
```

Nota: En algunos casos, puede ser necesario realizar ediciones manuales al archivo migration.sql. Esto suele aplicarse cuando necesitamos insertar datos específicos que son esenciales para la configuración inicial del sistema o para mantener la consistencia durante el desarrollo. Por ejemplo, la inserción de registros en tablas relacionadas con catálogos, países o ciudades, que son fundamentales desde el inicio del sistema o en etapas intermedias de desarrollo.

Es importante tener en cuenta que, si bien Prisma gestiona automáticamente las migraciones, las ediciones manuales pueden ser útiles para personalizar scripts que, por motivos del negocio o requisitos del cliente, no pueden ser generados automáticamente. Cuando se edita el migration.sql manualmente, es esencial hacerlo con cuidado, asegurando que las modificaciones sean compatibles con el esquema y la integridad de la base de datos.

## 6. Hacer rollback de una migración específica

Prisma no ofrece una función automática de rollback, pero puedes revertir manualmente los cambios. Sigue estos pasos:

Identifica la migración: Ubica la migración en el directorio migrations/.
Escribe el SQL inverso: Crea un archivo SQL para deshacer la operación.
Por ejemplo, si una migración añadió una columna age, puedes eliminarla con este SQL:

```sql
ALTER TABLE `User` DROP COLUMN `age`;
```

## 7. Consideraciones al trabajar con migraciones en producción

Cuando trabajes en producción, ten en cuenta las siguientes recomendaciones:

Usa el comando prisma migrate deploy para aplicar migraciones de manera segura:

```bash
npx prisma migrate deploy
```

Respaldo: Realiza un respaldo de la base de datos antes de aplicar cualquier migración.

Evita ediciones manuales en producción. Prueba los cambios en desarrollo o staging.

## Conclusión

Prisma simplifica la gestión de esquemas y migraciones. Siguiendo estos pasos, podrás eliminar campos, cambiar tipos de datos o agregar tablas nuevas con facilidad. Sin embargo, recuerda tener precauciones adicionales al trabajar en producción y probar siempre los cambios en un entorno seguro.






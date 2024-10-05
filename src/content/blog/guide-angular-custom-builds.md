---
title: Guía Completa Cómo Hacer Builds Personalizados en Angular para Diferentes Instancias (Logos y Estilos)
author: Codevs
pubDatetime: 2024-10-30T03:42:51Z
slug: guide-angular-custom-builds
featured: false
tags:
  - Angular
  - Config
  - Builds
  - Custom-builds
description:
  "En proyectos Angular, es común que surja la necesidad de generar versiones específicas de la aplicación para diferentes clientes, marcas o instancias. Un ejemplo común es cambiar logos o temas de color, sin alterar el código base. En esta guía paso a paso, aprenderás cómo realizar builds personalizados, reemplazando logos y estilos según la instancia que estés construyendo."
---

> Este es un articulo original de [blog post](https://codevs.tech/blog/posts/guide-angular-custom-builds). En proyectos Angular, es común que surja la necesidad de generar versiones específicas de la aplicación para diferentes clientes.

Si trabajas en proyectos que requieren distintas versiones visuales o funcionales (cambio de logos, colores, textos), es vital poder generar builds personalizados sin complicaciones. Angular permite hacerlo mediante la configuración de reemplazo de archivos y scripts de automatización.

Esta guía asume que ya tienes una aplicación Angular instalada y funcionando localmente.

### Paso 1: Configurar los Entornos en ```angular.json```

Lo primero que haremos será definir las configuraciones de build para las distintas versiones de nuestra aplicación (por ejemplo, versiones en diferentes idiomas o para diferentes marcas).

#### 1.1 Modificar ```angular.json```

Abre el archivo angular.json y localiza la propiedad projects/architect/build/configurations. Aquí es donde podemos definir nuestras configuraciones personalizadas para los builds de Angular.

Agrega las siguientes configuraciones de entorno para francés e inglés:

```json
// angular.json
"prod-french": {
    "fileReplacements": [
      {
        "replace": "src/environments/environment.ts",
        "with": "src/environments/environment.prod-french.ts"
      }
    ]
},
"prod-english": {
    "fileReplacements": [
      {
        "replace": "src/environments/environment.ts",
        "with": "src/environments/environment.prod-english.ts"
      }
    ]
}
```

##### ¿Qué hace fileReplacements?

La propiedad fileReplacements le dice a Angular qué archivo debe reemplazar en el momento del build. En este caso, estamos indicando que cuando se haga un build para francés, Angular reemplazará el archivo environment.ts con environment.prod-french.ts, y para inglés, lo hará con environment.prod-english.ts.

Esto te permite manejar diferentes configuraciones como URLs de APIs, parámetros de configuración, etc.

### Paso 2: Crear los Archivos de Entorno

Ahora, crearemos los archivos de entorno personalizados que especificamos en el paso anterior.

#### 2.1 Crear los archivos environment.prod-french.ts y environment.prod-english.ts

Dentro de la carpeta src/environments, crea los dos archivos que usaremos para los builds personalizados.

```typescript
// environment.prod-french.ts
export const environment = {
  production: true,
  host: "http://french.codevs.tech",
};

// environment.prod-english.ts
export const environment = {
  production: true,
  host: "http://english.codevs.tech",
};
```

¿Qué es el archivo de entorno?
Los archivos de entorno son muy útiles para definir variables de configuración que cambian dependiendo del ambiente (desarrollo, producción, diferentes marcas). Aquí puedes especificar cosas como la URL de la API, flags de producción, entre otros.

### Paso 3: Personalizar Logos para Cada Instancia

Un caso común de personalización es el cambio de logos. Por ejemplo, podemos querer que la aplicación francesa tenga un logo diferente al de la versión en inglés. Para esto, utilizaremos el paquete copyfiles, que permite copiar archivos fácilmente durante el proceso de build.

#### 3.1 Instalar copyfiles

Ejecuta el siguiente comando para instalar el paquete:

```bash
npm install copyfiles
```

Este paquete nos ayudará a copiar archivos (como imágenes o estilos) de una carpeta a otra antes de que Angular realice el build.

#### 3.2 Organizar los logos en carpetas separadas

Coloca los logos específicos de cada instancia en carpetas separadas dentro de src:

```css
src/
  ├── assets/
  └── french/
      └── logo.png
  └── english/
      └── logo.png
```

De esta manera, podrás tener un logo específico para cada versión sin mezclar los archivos.

### Paso 4: Configurar Scripts en package.json

Para automatizar el reemplazo de logos, vamos a modificar el archivo package.json. Aquí, usaremos hooks de NPM para ejecutar comandos antes de hacer los builds.

#### 4.1 Modificar package.json

Agrega los siguientes scripts en la sección "scripts" de tu package.json:

```json
"scripts": {
  "prebuildfrench": "copyfiles --flat src/french/logo.png src/assets/images",
  "buildfrench": "ng build --configuration=prod-french",

  "prebuildenglish": "copyfiles --flat src/english/logo.png src/assets/images",
  "buildenglish": "ng build --configuration=prod-english"
},
```

Explicación:
prebuildfrench: Este script copia el logo específico de la versión francesa a la carpeta assets/images antes de hacer el build.
buildfrench: Este script ejecuta el build de la configuración definida como prod-french.
El mismo patrón se sigue para la versión inglesa.

##### ¿Qué son los Hooks en NPM?

Los hooks de NPM son comandos que se ejecutan automáticamente antes o después de otro comando. En este caso, prebuildfrench se ejecutará antes de buildfrench, asegurando que el logo adecuado esté en la carpeta de destino al momento de hacer el build.

### Paso 5: Ejecutar Builds Personalizados

Con todo configurado, ahora podemos generar nuestros builds personalizados simplemente ejecutando los comandos correspondientes.

#### 5.1 Generar el build para francés:

```bash
npm run buildfrench
```

#### 5.2 Generar el build para inglés:

```bash
npm run buildenglish
```

##### ¿Qué sucede durante la ejecución?

Primero, el hook prebuildfrench o prebuildenglish copiará el logo adecuado a la carpeta de imágenes.
Luego, se ejecutará el build utilizando la configuración del entorno correspondiente.
El resultado será una aplicación con el logo correcto y las configuraciones definidas para cada instancia.

### Conclusión

Con esta técnica, puedes manejar fácilmente múltiples instancias de tu aplicación Angular con personalizaciones de logos, colores o configuraciones. Esto es especialmente útil en proyectos donde se necesita entregar builds específicos para diferentes clientes o marcas, manteniendo una única base de código.

Gracias a la flexibilidad de Angular y herramientas como copyfiles, es posible extender las funcionalidades de los builds para adaptarlos a las necesidades específicas de tu proyecto.

¡Ahora estás listo para crear builds personalizados con Angular!.

---
title: Guía Paso a Paso Cómo Generar Llaves SSH para GitHub y GitLab en Linux/WSL
author: Codevs
pubDatetime: 2024-09-29T03:42:51Z
slug: ssh-github-gitlab
featured: false
tags:
  - Github
  - SSH
description:
  "Como crear llaves para nuestro entorno de trabajo para clientes GIT"
---

> Este es un articulo original de [blog post](https://codevs.tech/blog/posts/ssh-github-gitlab). Como crear llaves SSH para nuestro entorno de trabajo con clientes GIT.

En nuestra carrera como desarrolladores, la autenticación con llaves SSH es esencial para acceder de manera segura a servicios como GitHub y GitLab. Esta guía te llevará paso a paso por el proceso de generar, configurar y usar tus llaves SSH en un entorno Linux/WSL (Windows Subsystem for Linux) utilizando distribuciones Ubuntu/Debian.

## ¿Qué es SSH y por qué lo necesitamos?

SSH (Secure Shell) es un protocolo de administración remota que te permite conectarte y operar de manera segura en servidores remotos a través de Internet. Utiliza técnicas de cifrado para proteger la comunicación, asegurando que tu interacción con el servidor (o un servicio como GitHub o GitLab) esté protegida contra ataques maliciosos.

Usamos llaves SSH para facilitar el acceso a nuestros repositorios de código sin necesidad de ingresar la contraseña cada vez que interactuamos con ellos.

### Paso 1: Generar una Llave SSH

#### 1.1 Abrir la terminal

Lo primero que debemos hacer es abrir nuestra terminal favorita. Si estás utilizando WSL en Windows, puedes abrir la aplicación Ubuntu o Debian desde el menú de inicio.

#### 1.2 Generar la llave SSH

Para generar una llave SSH, ejecuta el siguiente comando en la terminal:

```bash
ssh-keygen -t rsa -b 4096 -C "<tu_correo@dominio.com>"
```

Este comando:

- -t rsa: Especifica que usaremos el algoritmo RSA.
- -b 4096: Genera una clave de 4096 bits (más segura).
- -C: Añade un comentario a la llave (usualmente tu email).

Verás una respuesta similar a esta en tu terminal:

```bash
Generating public/private rsa key pair.
Enter file in which to save the key (/home/usuario/.ssh/id_rsa):
Presiona Enter para aceptar la ruta por defecto o ingresa un nombre específico para tu llave. En este ejemplo, la llamaremos github_me para la llave de GitHub:
/home/usuario/.ssh/github_me
```

#### 1.3 Contraseña opcional

Te pedirá que ingreses una contraseña para la llave. Es recomendable agregar una por seguridad, aunque también puedes dejarla en blanco presionando Enter. Si eliges una contraseña, asegúrate de recordarla.

##### ¡Felicidades! Has generado tu llave SSH

### Paso 2: Verificar la Creación de la Llave

Para asegurarte de que las llaves se generaron correctamente, puedes listar el contenido del directorio .ssh (donde se guardan tus llaves):

```bash
ls -la ~/.ssh
```

Deberías ver algo como:

```bash
id_rsa      id_rsa.pub      github_me      github_me.pub
```

Las extensiones .pub indican las llaves públicas que compartirás con GitHub o GitLab.

### Paso 3: Configurar SSH para Múltiples Cuentas (GitHub y GitLab)

Si tienes varias cuentas, como una en GitHub y otra en GitLab, puedes configurarlas fácilmente para que funcionen simultáneamente.

#### 3.1 Crear el archivo config
Crea un archivo de configuración en el directorio .ssh:

```bash
cd ~/.ssh
touch config
vim config
```

El archivo config te permite definir varias configuraciones para diferentes servidores de Git. Agrega las siguientes líneas:

```bash


# Cuenta GitHub Personal

Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/github_me

# Cuenta GitLab Personal

Host gitlab.com
  HostName gitlab.com
  User git
  IdentityFile ~/.ssh/gitlab_me
```

#### 3.2 Guardar el archivo

Guarda y cierra el archivo config. Ahora el sistema sabe qué llave usar cuando te conectas a GitHub o GitLab.

### Paso 4: Agregar las Llaves SSH al Agente

Para que las llaves SSH funcionen automáticamente, debemos agregar las llaves generadas al SSH Agent. El SSH Agent es un programa que se ejecuta en segundo plano y gestiona tus llaves privadas.

Primero, inicia el agente:

```bash
eval "$(ssh-agent -s)"
```

Luego, añade tus llaves:

```bash
ssh-add ~/.ssh/github_me
ssh-add ~/.ssh/gitlab_me
```

### Paso 5: Copiar las Llaves Públicas a GitHub y GitLab

Ahora necesitas copiar la llave pública y agregarla a tu cuenta de GitHub y/o GitLab.

#### 5.1 Copiar la llave pública

Usa el siguiente comando para copiar el contenido de tu llave pública al portapapeles:

```bash
xclip -sel clip < ~/.ssh/github_me.pub
```

Si no tienes xclip instalado, puedes hacerlo con:

```bash
sudo apt install xclip
```

#### 5.2 Agregar la llave en GitHub

Ve a tu cuenta de GitHub.

1. Navega a Settings > SSH and GPG keys.
2. Haz clic en New SSH key.
3. Pega tu llave pública y asigna un título.

#### 5.3 Agregar la llave en GitLab

Ve a tu cuenta de GitLab.

1. Ve a Preferences > SSH Keys.
2. Pega tu llave pública y asigna un título.

### Paso 6: Verificar la Conexión SSH

Una vez que hayas agregado la llave pública, verifica que todo funcione correctamente conectándote a GitHub o GitLab desde la terminal.

Para GitHub:

```bash
ssh -T <git@github.com>
Para GitLab:
```

```bash
ssh -T <git@gitlab.com>
Si todo está bien configurado, recibirás un mensaje que te da la bienvenida al servidor de GitHub o GitLab.
```

### Paso 7: Configuración para Servidores Privados o GitLab Empresarial
Si trabajas en una compañía que tiene su propio servidor GitLab o un dominio personalizado, puedes agregarlo a tu archivo config de la siguiente manera:

```bash
# Cuenta GitLab de Empresa
Host git.miempresa.com
  HostName git.miempresa.com
  User git
  IdentityFile ~/.ssh/gitlab_empresa
```

Verifica la conexión usando:

```bash
ssh -T <git@git.miempresa.com>
```

### Conclusión

Con este tutorial, has configurado con éxito tus llaves SSH para trabajar con múltiples cuentas en GitHub y GitLab. Esto te permitirá autenticarse de manera segura y eficiente, sin tener que ingresar tu contraseña en cada interacción. Si trabajas con varios servidores o repositorios, esta configuración te ahorrará mucho tiempo.

Si tienes más cuentas o servidores adicionales, puedes seguir este mismo proceso para agregarlos y manejarlos de manera sencilla. ¡Buena suerte en tus proyectos!

---
title: Introducción a las Rutas en Next.js 15
author: Codevs
pubDatetime: 2024-11-02T09:00:01Z
slug: nextjs-15-routes
featured: false
tags:
  - NextJS
  - TypeScript
description:
  "Exploraremos los conceptos basicos de NextJS 15, para el manejo de rutas y el renderizado"
---

## 1. Introducción a Next.js 15 y su Enrutamiento

Next.js es un framework de React que ofrece soporte completo para renderización del lado del servidor (SSR), generación de sitios estáticos (SSG) y API integradas. En Next.js 15, la carpeta app gestiona las rutas de la aplicación automáticamente. Esto significa que cualquier archivo o carpeta dentro de app se convierte en una ruta.

### Por ejemplo:

```typescript
app/page.tsx = Ruta principal (/)
app/about/page.tsx = Ruta /about
```

## 2. Inicializando un Proyecto de Next.js con TypeScript

Para empezar, instalaremos un proyecto básico de Next.js con soporte para TypeScript.

```bash
Copy code
npx create-next-app@15 nextjs-routes-demo --typescript
cd nextjs-routes-demo
```

Con esto, tenemos una estructura de proyecto básica donde trabajaremos en la carpeta app.

## 3. Rutas Estáticas

Ejemplo Básico de Rutas Estáticas
En Next.js, las rutas se crean en función de la estructura de carpetas. Vamos a crear algunas rutas básicas para ver cómo funciona:

Ruta Principal: Edita el archivo app/page.tsx, que corresponde a la ruta /.

```typescript
// app/page.tsx
export default function Home() {
  return (
    <main>
      <h1>Bienvenido a Next.js 15</h1>
      <p>Exploraremos cómo funcionan las rutas en este proyecto.</p>
    </main>
  );
}
```

Ruta Acerca de Nosotros: Crea una carpeta about dentro de app, y en ella, un archivo page.tsx. Esto crea la ruta /about.

```typescript
// app/about/page.tsx
export default function About() {
  return (
    <main>
      <h1>Acerca de Nosotros</h1>
      <p>Esta es la página de About en Next.js 15.</p>
    </main>
  );
}
```

Al visitar /about, verás la página creada automáticamente gracias a la convención de archivos de Next.js.

## 4. Rutas Dinámicas

Concepto de Rutas Dinámicas
Las rutas dinámicas permiten crear URLs basadas en parámetros, como un ID de usuario o el nombre de un artículo. En Next.js, puedes usar el formato [nombre].tsx para declarar una ruta dinámica.

Ejemplo: Ruta Dinámica para un Blog
Vamos a crear una ruta dinámica para cada publicación del blog.

Crear la Ruta Dinámica: Dentro de app, crea una carpeta blog, y dentro de ella, otra carpeta [id], con un archivo page.tsx para representar la página de detalles de cada publicación.

```typescript
// app/blog/[id]/page.tsx
import { useRouter } from 'next/router';

export default function BlogPost() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <main>
      <h1>Publicación de Blog</h1>
      <p>ID de la publicación: {id}</p>
    </main>
  );
}
```

La URL /blog/1 mostrará el ID 1, y /blog/2 mostrará el ID 2.

## 5. Anidación de Rutas

Next.js permite crear rutas anidadas. Esto es útil cuando necesitas organizar páginas en diferentes secciones. Supongamos que queremos una sección para las políticas de la empresa.

Ruta para las Políticas: Dentro de app, crea una carpeta policies y, dentro de ella, subcarpetas como privacy y terms con sus respectivos archivos page.tsx.

```typescript
// app/policies/privacy/page.tsx
export default function PrivacyPolicy() {
  return <h1>Política de Privacidad</h1>;
}

// app/policies/terms/page.tsx
export default function TermsOfService() {
  return <h1>Términos de Servicio</h1>;
}
```

Estas rutas estarán disponibles en /policies/privacy y /policies/terms.

## 6. Uso de Middleware para Validación

Next.js 15 ofrece un sistema de middleware que permite validar o proteger rutas específicas. El middleware se ejecuta antes de acceder a una página, y puedes usarlo para verificar autenticación o aplicar redirecciones.

Ejemplo de Middleware para Validar Autenticación
Supongamos que queremos proteger la sección /blog para que solo usuarios autenticados puedan acceder.

Creación del Middleware: En la raíz del proyecto, crea un archivo middleware.ts.

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token');

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/blog/:path*'],
};
```

Aquí estamos verificando si el usuario tiene una cookie de autenticación (auth_token). Si no la tiene, redirigimos a /login.

Configuración de Rutas Protegidas: El campo matcher permite especificar las rutas que deben pasar por el middleware. En este caso, cualquier ruta bajo /blog será protegida.

## 7. Ejemplo Completo: Blog con Rutas Dinámicas y Middleware

Pongamos todos estos conceptos en práctica con una aplicación de blog completa que incluye rutas estáticas, dinámicas y middleware.

Página de Lista de Publicaciones:

```typescript
// app/blog/page.tsx
import Link from 'next/link';

const posts = [
  { id: '1', title: 'Primera publicación' },
  { id: '2', title: 'Segunda publicación' },
];

export default function Blog() {
  return (
    <main>
      <h1>Blog</h1>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <Link href={`/blog/${post.id}`}>
              {post.title}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

Página de Detalle de la Publicación:

```typescript
// app/blog/[id]/page.tsx
import { useRouter } from 'next/router';

export default function BlogPost() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <main>
      <h1>Publicación de Blog</h1>
      <p>ID de la publicación: {id}</p>
    </main>
  );
}
```

Middleware para Protección: Como vimos antes, el middleware redirige a /login si el usuario no tiene un auth_token.

Página de Inicio de Sesión:

```typescript
// app/login/page.tsx
export default function Login() {
  return (
    <main>
      <h1>Iniciar Sesión</h1>
      <p>Por favor, inicia sesión para acceder al blog.</p>
    </main>
  );
}
```

Con esto, tenemos una aplicación de blog donde las rutas están protegidas y el acceso a /blog solo es posible si el usuario está autenticado.

## 8. Conclusión

En este artículo, hemos cubierto los aspectos esenciales del enrutamiento en Next.js 15. Aprendimos a crear rutas estáticas y dinámicas, a anidar rutas, y cómo usar middleware para proteger páginas. Estos conceptos te ayudarán a estructurar aplicaciones complejas en Next.js.

En el siguiente artículo, exploraremos la renderización en el lado del servidor (SSR)
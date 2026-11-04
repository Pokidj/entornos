# Instalación en tu servidor

## GitHub Pages — 05/11/2026

Repositorio: https://github.com/Pokidj/entornos. Código estático en `dist/`.
En Settings → Pages → Build and deployment → Source, seleccionar **GitHub Actions**.
El workflow `.github/workflows/pages.yml` publica solo `dist` al cambiar la web
(o el propio workflow) en main. También puede ejecutarse con Run workflow.
La dirección prevista, una vez completado el despliegue, es:
https://pokidj.github.io/entornos/

No se publica la raíz del repositorio: documentación, pruebas, capturas ni
metadatos de Sites quedan fuera del artefacto. Las capturas de revisión se retiran
del seguimiento de Git, conservando sus copias locales. `dist/.nojekyll` evita
procesamiento Jekyll. No se requiere compilación ni dependencias en el despliegue.
Las rutas de recursos y del catálogo son relativas y admiten `/entornos/`.

Configuración manual para puentes anteriores; el EXE actual autoriza desde su ventana:

```json
{"hotkey":"CTRL+F9","web_url":"https://pokidj.github.io/entornos/"}
```

Reiniciar el puente y permitir el acceso local en el navegador si lo solicita.
El dominio original de Sites sigue siendo una publicación independiente.
La conexión a GitHub y la carga inicial de main ya están confirmadas; Pages
requiere su configuración y un workflow completado antes de darlo por publicado.


## Subir la web

1. Descomprime `entorno-generator-ultima-version.zip`.
2. Sube su contenido al directorio público de tu hosting, por ejemplo
   `public_html/`, o a una subcarpeta como `public_html/generador/`.
   `index.html` debe quedar directamente dentro de esa carpeta.
3. Conserva los nombres y la estructura, especialmente `downloads/` y
   `vehicles.json`. No hace falta ejecutar una compilación, instalar Node,
   Python, PHP ni una base de datos en el servidor.
4. Activa HTTPS y abre tu dirección, por ejemplo `https://tudominio.es/generador/`.
   El servidor debe servir `index.html` como índice, JavaScript como JavaScript,
   JSON como JSON y permitir descargar el EXE de `downloads/`.

Funciona como sitio estático en Apache, Nginx o un hosting compatible. No es un
recurso que se instale en la carpeta `resources` de FXServer. El comando
`/entorno` debe existir en tu servidor de juego para que este lo procese.

## Conectar el puente desde tu dominio

Descarga y abre la versión actual de `Puente Entorno.exe` en el PC de Windows
con FiveM. Pulsa «Conectar puente» en la web y autoriza el dominio en la ventana
del puente. Lo recordará; no necesitas editar archivos al cambiar de alojamiento.
Al actualizar, cierra primero el puente anterior y conserva el ejecutable nuevo
en una carpeta fija donde pueda guardar su configuración. Si usas inicio con
Windows y cambias de carpeta, vuelve a activar esa opción desde la nueva copia.

La autorización no envía ningún entorno. Si cancelas o caduca, la web sigue sin
poder preparar ni ejecutar comandos. Los permisos locales del navegador siguen
siendo necesarios. No abras puertos del router. El móvil no controla el puente del PC.
Los ajustes manuales web_url anteriores siguen siendo válidos, pero no hacen falta
para autorizar dominios nuevos. Más detalles y revocación en DOCUMENTACION.md.

## Comprobar después de subir

- Abre el sitio por HTTPS y comprueba que carga el catálogo de coches.
- Genera con el asistente y con texto manual; copia y pega para revisar el texto.
- Guarda un entorno y recarga: debe seguir disponible en ese navegador.
- Descarga el puente y comprueba su detección con el nuevo dominio configurado.
- Con una partida abierta, prueba un envío de roleplay autorizado y confirma que
  el servidor de juego publica el comando. Las pruebas de entrega usan simuladores
  y no sustituyen esta comprobación en tu servidor.

Los favoritos, guardados e historial se almacenan en el navegador, separados por
origen. Cambiar de dominio no migra los datos del dominio anterior automáticamente.

## Actualizar

Sustituye los archivos de la web, conservando su estructura. Si tu hosting usa
caché o CDN, vacía esa caché. No se incluyen datos personales de los navegadores
en el ZIP. El puente mantiene su configuración local junto al ejecutable.

`DOCUMENTACION.md` contiene el manual completo; `REVISION.md` detalla las pruebas
y sus límites. El paquete incluye los archivos necesarios para alojar la web,
su descarga del puente y la documentación; no contiene las dependencias de pruebas.

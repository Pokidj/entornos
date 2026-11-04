# Instalación en tu servidor

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

## Configurar el puente para tu dominio

La generación y copia funcionan sin puente. Para enviar a FiveM, cada jugador
debe abrir `Puente Entorno.exe` en su PC de Windows, donde está jugando.
El EXE está incluido en `downloads/` y puede descargarse desde la web.

Al cambiar de alojamiento, cierra el puente y crea o edita `configuracion.json`
**junto al EXE**, en una carpeta donde puedas guardar cambios. Conserva los
otros ajustes existentes. Ejemplo:

```json
{
  "hotkey": "CTRL+F9",
  "web_url": "https://tudominio.es/generador/"
}
```

Sustituye la dirección por la tuya y vuelve a abrir el puente. Cada jugador que
use la nueva web debe tener ese ajuste. No hace falta recompilar el EXE.
Esquema, dominio y puerto deben coincidir: `www` y sin `www` son orígenes distintos.
No pongas comodines ni credenciales en la dirección.

Abre FiveM y la web en ese mismo PC. Si el navegador pide acceso a la red local,
permítelo y pulsa «Conectar puente». El servicio escucha solo en
`127.0.0.1:39173`: no abras puertos del router ni lo expongas desde el servidor.
El móvil puede generar y copiar, pero no controlar el puente del PC por Wi-Fi.

Si tu hosting aplica una Content Security Policy, permite los archivos locales
del sitio y las conexiones a `http://127.0.0.1:39173` en `connect-src`.
No añadas `upgrade-insecure-requests` sin comprobar su efecto sobre la conexión
HTTP al puente. El acceso local depende también de los permisos del navegador.

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

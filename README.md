# Generador de /entornos

Herramienta para preparar avisos de roleplay con el comando `/entorno`.
La web genera el texto a partir de selecciones; el puente opcional de Windows
permite enviarlo a la consola de FiveM desde la web o mediante un atajo.

- [Manual de uso y documentación técnica](DOCUMENTACION.md)
- [Historial de cambios](CHANGELOG.md)
- [Resumen de verificación](REVISION.md)
- [Instalación en tu servidor](INSTALACION.md)
- [Web actual](https://entorno-rp-radio-2710.balmyguppy1.chatgpt.site/)

## Empezar

La cabecera tiene una «Guía rápida» opcional con accesos a los campos. El panel
del entorno ofrece un asistente de cuatro pasos con opciones y buscadores. Escribir
una situación a mano genera directamente. Los detalles restantes se completan en el formulario.
Mis entornos muestra botones compactos y pliega el formulario bajo «Guardar / gestionar».

1. Elige una acción general en «Qué está pasando», como Robar o Secuestrar.
   Puedes dejar «Detalle» vacío para un aviso general, elegir uno relacionado
   o escribirlo y pulsar «Usar mi texto».
2. Ajusta tono y extensión. Puedes editar el resultado directamente.
3. Copia el entorno o envíalo con el puente.

«Ver historial de envíos» permite consultar y copiar los últimos 100 envíos del
botón y del atajo. Se guarda en este navegador; mantén la web abierta para registrar
los envíos del puente. Vaciar ese historial no borra Mis entornos ni los favoritos.

En el recuadro independiente «Mis entornos», encima de los dos paneles,
pon un nombre a tu selección y pulsa «Guardar».
Tendrás un botón para cargarla con un clic, sin espacios fijos. Las configuraciones
anteriores se conservan mediante migración automática.

Para el puente, cierra cualquier versión anterior, descarga `Puente Entorno.exe`
desde la web y ábrelo en el mismo PC que FiveM. El atajo predeterminado es
**Ctrl + F9**. Su menú está en la bandeja junto al reloj.
Si no se detecta estando abierto, usa «Conectar puente» en la web y revisa el
mensaje de conexión y el permiso de acceso local del navegador.

## Carpetas y entregables

En el espacio de trabajo, `outputs/entorno-rp` contiene esta documentación, la web
en `dist/` y sus pruebas en `tests/`. `outputs/puente-fivem-configurable` contiene
el código, pruebas y EXE del puente.

| ZIP en `outputs/` | Contenido |
| --- | --- |
| `entorno-generator-ultima-version.zip` | Archivos listos para alojar la web, descarga del EXE y documentación. |
| `puente-fivem-configurable.zip` | EXE, código del puente, configuración, pruebas y documentación en `docs/`. |
| `documentacion-entorno.zip` | Manual, changelog y resumen, sin binarios. |

## Mantener la documentación

Actualizar el manual y el changelog con cada cambio. Esta regla está registrada
en los archivos `AGENTS.md` del proyecto. Desde esta carpeta, ejecutar:

```powershell
python scripts/package-release.py
```

El script reconstruye los tres ZIP a partir de los archivos actuales. No publica
la web ni recompila el ejecutable. Las copias de documentación dentro de los ZIP
se generan desde estos documentos; no deben editarse por separado.

Para alojarlo en tu servidor, sube el contenido del ZIP de la web al directorio
público y sigue `INSTALACION.md`, incluido en los tres paquetes. No requiere
instalar herramientas de desarrollo en el servidor.

## GitHub y despliegue

Repositorio: [Pokidj/entornos](https://github.com/Pokidj/entornos).

1. En **Settings → Pages → Source**, selecciona **GitHub Actions**.
2. Abre **Actions → Publicar en GitHub Pages** y comprueba el despliegue.
3. La dirección prevista es https://pokidj.github.io/entornos/.

El workflow publica únicamente `dist/`, sin compilación. Los cambios de la web
subidos a main activan su publicación; documentación y pruebas quedan fuera.
El resto del repositorio se conserva para mantenimiento. Las capturas de revisión
se excluyen de Git. Consulta `INSTALACION.md` para autorizar Pages en el puente.
El sitio de Sites se mantiene independiente; no se sincroniza automáticamente.

## Puente en cualquier alojamiento

Actualiza el EXE, pulsa **Conectar puente** en la web y autoriza el dominio en
la ventana de Windows. Se recuerda automáticamente. Ya no necesitas editar
web_url al cambiar de alojamiento. El permiso local del navegador puede seguir
siendo necesario. Código del puente en `bridge/`; descarga en `dist/downloads/`.

## Redacción de la ropa

La llamada describe al grupo con «uno de ellos», «otro» y, cuando corresponde,
«el último». Colores combinados disponibles en ropa y coche; se eligen como
negro/blanco y se redactan como «negro y blanco». Se conservan los guardados anteriores.

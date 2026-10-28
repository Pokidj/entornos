# Generador de /entornos

Herramienta para preparar avisos de roleplay con el comando `/entorno`.
La web genera el texto a partir de selecciones; el puente opcional de Windows
permite enviarlo a la consola de FiveM desde la web o mediante un atajo.

- [Manual de uso y documentación técnica](DOCUMENTACION.md)
- [Historial de cambios](CHANGELOG.md)
- [Resumen de verificación](REVISION.md)
- [Web actual](https://entorno-rp-radio-2710.balmyguppy1.chatgpt.site/)

## Empezar

1. Selecciona una situación y añade los detalles que quieras.
2. Ajusta tono y extensión. Puedes editar el resultado directamente.
3. Copia el entorno o envíalo con el puente.

En el recuadro independiente «Mis entornos», debajo de los dos paneles,
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

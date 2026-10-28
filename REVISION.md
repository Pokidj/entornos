# Revisión y verificación actuales

Consulta el [manual completo](DOCUMENTACION.md) y el [historial de cambios](CHANGELOG.md).

## Última revisión web — 28/10/2026

- 442 comprobaciones principales superadas, incluidas 379 situaciones.
- Suites de copia/confirmación y de preparación/eventos superadas.
- Configuraciones con nombre: migración de espacios antiguos, más de cinco elementos,
  carga rápida, actualización, renombrado, nombres duplicados, eliminación/deshacer,
  persistencia tras recargar, nombres tratados como texto y errores de almacenamiento.
- Revisión visual en escritorio y a 320 px, con nombres largos y sin desbordamiento
  en los estados comprobados.
- Documentación y paquetes actualizados con el nuevo sistema de configuraciones.
- Configuraciones trasladadas a un recuadro independiente, con el mismo ancho y
  alineación que el bloque de conexión con FiveM. Se conserva la carga con un clic.
- Recuadro renombrado a «Mis entornos»: campo y botón Guardar centrados arriba,
  accesos rápidos debajo. Centrado y orden comprobados en navegador.
- Las acciones del entorno seleccionado se agrupan junto a Guardar en la barra superior.
- Botones de generación, copia y ejecución alineados en la fila inferior en escritorio;
  mensajes del puente agrupados debajo de la fila de botones.
- Añadida suite `test-bridge-detection.mjs`: conexión manual con más tiempo,
  detección sin AbortSignal.timeout, destinos locales compatibles y mensajes de error.
- Comprobación local real del puente: GET /health 200, FiveM conectado y CORS del
  origen esperado; OPTIONS 204 con permiso de red privada. No se enviaron comandos.
- No se pudo inspeccionar esta conexión dentro de la pestaña de ChatGPT por un
  error de su herramienta de navegador; la compatibilidad final necesita prueba allí.

## Puente — resultado de su revisión anterior

24 pruebas: 23 superadas y una omitida porque el entorno aislado bloquea RegisterHotKey
con error 5. El código y el EXE del puente no cambian con las configuraciones de la web.
Las pruebas del agente no enviaron avisos a una partida ni reiniciaron Windows;
el usuario confirmó que el puente funciona en su equipo.

## Repetir comprobaciones

Web, desde `tests/`: `npm install` y `npm test`.

Puente, desde su carpeta: `python -m unittest discover -s tests -p "test_*.py" -v`.

Empaquetar, desde esta carpeta: `python scripts/package-release.py`.

# Revisión y verificación actuales

Consulta el [manual completo](DOCUMENTACION.md) y el [historial de cambios](CHANGELOG.md).

## Última revisión web — 29/10/2026

- Último ajuste de distribución: Mis entornos encima de ambos paneles, con estilo
  de «¿Qué has visto?». Posición, borde y carga de guardados comprobados en navegador.
  A 320 px, acciones de guardado de 44 px y sin desbordamiento horizontal.
  Cambio de presentación: se conservan los resultados de las suites anteriores;
  no se han repetido las pruebas funcionales completas para mover y estilizar el bloque.

- Historial: 27 comprobaciones específicas superadas además de las 1.182 generales
  y suites previas. Atajo con rotación desactivada, botón, respuesta/evento en ambos
  órdenes, cancelaciones, fallos, incertidumbre, recarga, límite, copia, vaciado,
  preservación de favoritos, datos ilegibles y ausencia de tokens comprobados.
  Simuladores y datos de prueba: no se enviaron comandos a una partida real.
- Historial revisado visualmente con entradas de ejemplo, fechas y ambos orígenes:
  acceso desde el resultado, despliegue del texto y vista a 320 px sin desbordamiento;
  controles móviles de 44 px. La vista de ejemplo bloquea la conexión al puente real.

- Revisión de código y experiencia: guía opcional, accesos iniciales, mensajes de
  ayuda, orden escena/personas/desplazamiento y botones con estados coherentes.
  Etiquetas vinculadas al buscador visible, estado desactivado, escritura tras Escape
  y enfoque desde la guía comprobados. Sintaxis de todos los JS y enlaces locales válidos.
- Diseño final comprobado en escritorio y a 320 px, con guía abierta/cerrada,
  arranque desde un ejemplo, detalle opcional, personas, resultado y botones de 44 px.
  Sin desbordamiento horizontal; las acciones inferiores conservan su alineación.
  «Ver mi entorno» enfoca el panel sin activar el editor ni el teclado del móvil.

- 1.182 comprobaciones principales superadas, incluidas 974 situaciones y ropa
  individual, modo compartido, cambios de cantidad, guardados y compatibilidad antigua.
- Puente: 23 pruebas correctas y una omitida por RegisterHotKey en el entorno aislado.
  Servidor/consola simulados y registro de inicio simulado: no se envió nada a FiveM
  ni se cambió el inicio de Windows. Código y EXE del puente conservados.
- Robos ampliados: 345 escenas nuevas y 496 detalles concretos más el aviso general.
  Índices anteriores intactos, escenas y etiquetas sin duplicados, categorías,
  búsquedas por nombres/tipos, lugares y recuperación de guardados comprobados.
  Revisión en navegador de Fleeca, Pacific Standard y búsqueda por «banco».
- Acción/detalle: 20 acciones generales, detalles relacionados, aviso sin detalle,
  cambio y limpieza de detalle, texto propio, migración de guardados anteriores y
  una sola generación por cambio de acción comprobados.
- Vista acción/detalle revisada en navegador: aviso general de Robar, joyería como
  detalle, cambio a Secuestrar sin arrastrar la joyería, botones alineados y móvil
  a 375 px sin desbordamiento horizontal.
- Situaciones propias: infinitivos, texto literal, límite, teclado, texto tratado como
  contenido y no HTML, guardado, recarga y sustitución por catálogo comprobados.
  Repeticiones de palabras, frases de color y lugar comprobadas. Interacción real
  de Usar mi texto y alineación de acciones verificadas; sin desbordamiento a 375 px.
- Catálogo ampliado sin duplicados ni cambios en los índices anteriores. Búsquedas
  por infinitivos, sinónimos, varias palabras, orden inverso y fragmentos comprobadas.
  Lugares de peluquería, chatarrería, comercios, oficina, aeronaves y embarcaciones
  comprobados; las situaciones genéricas conservan la elección libre del lugar.
- Editor de vestimenta comprobado en navegador a 1280 y 375 px: descripciones
  distintas para dos personas, casilla compartida y recuperación sin desbordamiento.
  La fila de generación y copia conserva su alineación en escritorio.
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

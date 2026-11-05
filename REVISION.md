# Revisión y verificación actuales

Consulta el [manual completo](DOCUMENTACION.md) y el [historial de cambios](CHANGELOG.md).

## Guardados compactos y resumen flotante — 05/11/2026

- Suite completa npm superada, incluidas copia, atajo, detección e historial.
  Se añaden nueve comprobaciones de resumen, foco, Escape, salida del cursor,
  interacción táctil y cambio de tamaño. Prueba dirigida de diálogo: 31 superadas.
- Navegador real: botones con solo el nombre, resumen al enfocar sin cargar la
  selección y cierre con Escape. A 320 px: carga con un toque, botón de 44 px,
  resumen dentro de la pantalla y sin desbordamiento horizontal.
- Documentación y ZIP actualizados. Puente y EXE conservados; no se repiten las
  pruebas de Windows ni se realizan envíos a una partida real.

## Mis entornos: diálogo y resúmenes — 05/11/2026

- 1.255 comprobaciones generales y suites de copia, atajo, detección e historial
  (27) superadas. Se adaptan las pruebas antiguas al diálogo y se añaden 22 de
  apertura/cancelación/foco, vista previa, tarjeta, acciones, búsqueda, captura
  estable, datos malformados, HTML como texto y catálogo cargado con retraso.
- En navegador real: farmacia, dos personas, ropa negro/blanco y Massacro gris;
  guardar con Intro, recargar, cargar tarjeta y cancelar renombrado con Escape.
- Ventana a 320 px sin desbordamiento horizontal, botones de 44 px y foco en el
  nombre. Previsualización y tarjeta muestran los parámetros guardados.
- Sin cambios del puente ni del EXE y sin envíos a una partida real. Documentación
  y ZIP regenerados desde la fuente canónica, conservando el ejecutable actual.


## Redacción, ropa y colores — 05/11/2026

- 1.233 comprobaciones generales superadas sobre 974 escenas. Pruebas nuevas de
  redacción individual, descripción incompleta, más de, ropa compartida, artículos,
  210 parejas de colores, compatibilidad de índices, guardado y ropa/coche bicolores.
- Ausencia de puntos y coma comprobada en generación larga repetida, tonos y texto
  propio; sustitución por puntos y mayúsculas. Versiones breves conservan los detalles.
- Suites de copia, preparación/atajo, detección y 27 comprobaciones de historial
  superadas. No se ha enviado nada a una partida real. Código y EXE del puente
  conservados; no se repiten sus pruebas de Windows al no haber cambios en él.
- En navegador: tres personas con negro, blanco y azul; después sudadera y pantalón
  con negro/blanco. Resultado natural sin etiquetas técnicas ni barras en la llamada.
- Documentación canónica y ZIP regenerados y verificados con el EXE existente.


## Puente para cualquier alojamiento — 05/11/2026

- Puente: 34 pruebas, 33 correctas y una omitida por RegisterHotKey en el entorno
  aislado. Diez pruebas nuevas de descubrimiento, rechazo, origen/Host inválido,
  aprobación, tokens antiguos, borrado de preparación, persistencia, duplicados,
  límite, caducidad, callback tardío y rotación durante solicitudes en curso. Sin envíos a una partida real.
- Web: 1.192 comprobaciones generales, suites de copia, atajo y 27 de historial.
  Detección ampliada: no solicita autorización en segundo plano, conexión manual,
  rechazo, compatibilidad de v3, dominio recordado y ausencia de envíos al emparejar.
- EXE GUI reconstruido con dependencias fijadas. Módulos pairing, bridge_ui,
  hotkeys y startup incluidos; arranque --help correcto, sin abrir el servicio.
- Ventana nativa de prueba completó la aceptación con callback verdadero, sin
  autorizar un servidor real. Vista de detección pendiente revisada en navegador
  con fixture que bloquea toda conexión al puente real.
- El estado de publicación se consulta en el workflow de GitHub Pages y en el
  despliegue de Sites; ninguna prueba simulada confirma un envío en partida.


## Preparación de GitHub Pages — 05/11/2026

- Carga inicial de main confirmada por el conector en el commit 7872e796a378981271807009c8aba1180933aad2.
- Revisados publicación limitada a dist, recursos relativos bajo /entornos/, JSON,
  archivos necesarios y exclusión de las capturas. Copias locales conservadas.
- Cambio de distribución, sin modificar el generador ni el puente. Se conservan
  las pruebas funcionales de la revisión anterior; EXE sin recompilar.
- Cambios subidos a main en cd63d291bc80986acd1725da9c37b18e77558309.
  Ejecución 41933534665: checkout y comprobación de archivos correctos;
  configure-pages falla con Not Found porque Pages no está habilitado/configurado
  para GitHub Actions. Activación pendiente en Settings → Pages; aún no publicado.


## Conexión GitHub — 05/11/2026

- Repositorio Pokidj/entornos confirmado vacío mediante el conector, con permisos
  de escritura. Remoto local github añadido y lectura remota sin referencias.
- Push de prueba bloqueado por el gestor de credenciales de Windows en el entorno
  aislado. No se ha subido código ni configurado un despliegue automático.
- Cambio de configuración/documentación: se mantienen los resultados funcionales
  anteriores; no se repiten suites de ejecución. EXE conservado y ZIP regenerados.


## Última revisión web — 29/10/2026

- Revisión para alojamiento propio: guía de instalación y cambio de dominio
  añadida a los tres ZIP. Sin cambios del código de la web ni del puente.
  Sintaxis JavaScript/Python, archivos JSON, enlaces locales, contenido de ZIP
  y coincidencia del EXE con la descarga comprobados en esta entrega.
  Pruebas del puente repetidas: 23 correctas y una omitida por RegisterHotKey.
  Los sockets de prueba requirieron permiso de red local en el entorno aislado;
  la ejecución con ese permiso terminó correctamente. Solo se usaron simuladores.
  No se ha instalado en el servidor del usuario ni enviado nada a una partida.
  Web: repetidas 1.192 comprobaciones generales sobre 974 situaciones y las suites
  de copia, preparación/atajo, detección y 27 comprobaciones de historial.

- Último ajuste: guardados compactos con gestión plegada y asistente de cuatro
  pasos. Pruebas de navegación, filtros, cantidad, lugares compatibles, omisión,
  escritura directa, carga de guardados y restablecimiento añadidas a la suite.
  Vista móvil a 320 px comprobada sin desbordamiento horizontal. Sin cambios
  del puente ni del EXE; sin envíos a una partida real.
  Resultado: 1.192 comprobaciones generales y suites de copia, atajo, detección
  e historial (27 comprobaciones) superadas. Corregida la inserción del detalle
  manual al abrirse el buscador; escritorio y móvil revisados en navegador.

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

# Revisión y uso

La web es estática. Para alojarla, sube TODOS los archivos de `dist/`, manteniendo sus nombres. No necesita instalación ni compilación. Hay que servirla por HTTP/HTTPS; abrir `index.html` como archivo local puede impedir cargar el catálogo.

La conexión con FiveM es opcional. El puente configurable se distribuye aparte y debe ejecutarse en el mismo PC que FiveM. Desde un móvil puedes generar y copiar entornos, pero el puente local del PC no se detecta en el teléfono.

## Correcciones de esta revisión

- Código formateado y estilos consolidados en `styles.css`.
- Eliminados manejadores y estados antiguos que ya no se utilizaban.
- Los filtros del catálogo ya no regeneran el entorno innecesariamente.
- La carga de una configuración conserva el vehículo aunque el catálogo llegue más tarde.
- Cantidades manuales inválidas bloquean el resultado y el copiado.
- Los selectores eliminados no acumulan manejadores de eventos.
- Teclado: ArrowUp inicial selecciona el último resultado; solo queda abierto un desplegable.
- Los lugares concretos con nombre no se tratan como barrios compatibles con cualquier escena.
- Diseño móvil sin desbordamiento horizontal; fuentes de entrada de 16 px y controles táctiles más altos.
- Puente: límite global de tiempo para el saludo de consola, validación reforzada de URL y sesión renovada al cambiar de dominio.

## Verificación

- 418 comprobaciones automatizadas de la web, incluidas las 379 situaciones.
- 11 pruebas del puente con consola simulada y peticiones HTTP locales.
- Revisión en navegador de escritorio y con tamaños de móvil de 390 y 320 px.
- El ejecutable de Windows se ha reconstruido a partir del código revisado, en modo bandeja sin consola.

No se ha enviado ningún entorno real a tu servidor durante las pruebas. La aceptación y publicación por el comando particular de tu servidor debe comprobarse dentro de FiveM.

## Repetir pruebas de la web

En `tests/`, ejecutar `npm install` y `npm test`. Solo las pruebas necesitan jsdom; la web publicada no usa esa dependencia.

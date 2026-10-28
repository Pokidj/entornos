# Historial de cambios

Las entradas nuevas se añaden arriba. Se usa la fecha real de Europa/Madrid.
No se han asignado versiones semánticas retrospectivas: los hitos históricos se
describen por su contenido. Las referencias de commit identifican estados de la
web; no equivalen a números de versión comercial del puente.

## 2026-10-28 — Mis entornos y guardado centrado

- Renombrado el recuadro a «Mis entornos», con etiquetas de nombre y contador coherentes.
- Campo de nombre y botón de guardado centrados arriba; accesos rápidos debajo.
- Conservados los datos guardados, las acciones de edición y el ancho del recuadro.
- Documentación y paquetes actualizados.

## 2026-10-28 — Recuadro independiente de configuraciones

- «Mis configuraciones» sale del panel de resultado y pasa a un recuadro propio
  debajo de los dos paneles, antes de la conexión con FiveM y con su mismo ancho.
- Se mantienen los accesos rápidos y todas las acciones de guardado y edición.
- Botones distribuidos en filas adaptables; el recuadro sigue visible aunque se
  oculte el bloque de conexión al detectar el puente.
- Manual y paquetes actualizados.

## 2026-10-28 — Configuraciones con nombre y acceso rápido

- Sustituidos los cinco espacios fijos por configuraciones con nombre, sin límite
  artificial de cinco elementos y con botones siempre visibles de acceso rápido.
- «Guardar nueva», carga con un clic, selección resaltada, actualización de datos,
  renombrado y eliminación con posibilidad de deshacer durante la sesión de página.
- Validación de nombre, duplicados, situación y cantidad antes de guardar.
- Migración automática de espacios ocupados desde `entorno-configs-v1` a `entorno-configs-v2`;
  conservación del formato anterior y diferenciación de nombres repetidos.
- Gestión de errores de almacenamiento sin sobrescribir datos ilegibles o perder
  la versión guardada al fallar una escritura. Nombres tratados como texto.
- Separada esta función en `presets.js` y retirado el antiguo gestor de espacios.
- Manual y README actualizados. La integración del puente se conserva.
- Verificación: pruebas de migración, más de cinco configuraciones, carga/actualización,
  renombrado, duplicados, borrado/deshacer, recarga, nombres con HTML y errores de almacenamiento.
- 442 comprobaciones principales de web superadas, junto con las suites de copia
  y puente. Revisión visual en escritorio y a 320 px, incluidos nombres largos.

## 2026-10-28 — Documentación y mantenimiento

### Añadido

- Manual completo de la web, el puente, alojamiento, arquitectura, almacenamiento,
  configuración, uso de atajos, pruebas, compilación y solución de problemas.
- README con accesos al manual y al historial.
- Changelog de la evolución del proyecto, reconstruido con la conversación y los
  estados de código disponibles.
- Instrucciones persistentes en `AGENTS.md` para actualizar documentación e historial
  dentro de cada cambio futuro.
- Script `scripts/package-release.py` para generar los ZIP de web, puente y documentación
  con las mismas copias documentales y sin cachés ni dependencias.
- Paquete independiente `documentacion-entorno.zip`.

### Actualizado

- `REVISION.md` pasa a señalar el estado y documentación actuales, evitando cifras antiguas.
- Guías del puente alineadas con las 422 comprobaciones de web de la revisión anterior.
- Documentación incluida en los paquetes de entrega.

### Verificación

- Validación de archivos requeridos, enlaces documentales locales y contenido de los ZIP.
- Cambio documental: conserva el código de la web y el EXE existentes. No supone
  una nueva prueba en FiveM ni una nueva publicación del sitio.

## 2026-10-28 — Revisión de diseño compacto

Referencia de la web: `d5012cd5ed0465602594951c4234a7506ca7262a`.

### Mejorado

- Márgenes, cabecera, separación de campos y alturas de controles más compactos.
- Paneles de selección y resultado con anchos iguales y proporciones coherentes.
- Tono y extensión agrupados en dos columnas con sus etiquetas.
- Copiar y ejecutar situados junto al texto del resultado.
- Configuraciones guardadas al final del panel, dentro de un desplegable.
- Detalles de escena y texto adicional reunidos en un único desplegable.
- Catálogo de vehículos que se pliega al seleccionar un modelo, dejando a la vista
  color y acabado; reapertura mediante «Ver catálogo».
- Al cargar una configuración con coche se conserva el catálogo plegado; al vaciar
  se prepara de nuevo para elegir.
- Ajustes de móvil, casillas, texto de ayuda y foco visible de teclado.
- Identificador de versión en recursos de la web para evitar mezclar archivos en caché.

### Verificación

- 422 comprobaciones principales de web y suites de copia/confirmación y puente superadas.
- Puente: 23 pruebas superadas y una omitida por bloqueo de RegisterHotKey en aislamiento.
- Navegador: escritorio, anchos 320/390, selectores, detalles, configuraciones y catálogo.
- Publicación confirmada y ZIP de la web actualizado.

## 2026-10-28 — Visibilidad y ajuste de la opción automática

Referencia de la web: `908e23d030edfc03427e77e438ac9aa6087e7a14`.

- Corregido el desbordamiento de la casilla «Generar otra versión después de usar el atajo».
- Casilla visible únicamente si Ejecutar en FiveM está habilitado y el puente admite eventos.
- El bloque de descarga/conexión se oculta al detectar el puente y reaparece al perderlo.
- Conservación de la preferencia de generación automática aunque la casilla esté oculta.
- Pruebas de desconexión, reconexión y estados del botón.

## 2026-10-28 — Otra versión después del envío con atajo

Referencia de la web: `958eba18b066b80b77e781b4c3a5ca4e8911cad6`.

- Opción persistente en la web para generar y preparar otra versión con los mismos
  parámetros después de completar un envío con el atajo.
- API autenticada `/events` y capacidad `send-events` del puente; eventos secuenciados
  que distinguen envío con atajo y envío desde la web.
- Nueva preparación sin enviar automáticamente el siguiente texto.
- Eventos repetidos, antiguos o correspondientes a textos ya editados se ignoran.
- Fallos, escrituras inciertas y botón manual no disparan otra versión.
- Recepción de eventos mientras la web está en segundo plano, sujeta a suspensión del navegador.
- Variantes de comienzo también en la extensión Breve.
- Puente recompilado y descarga/paquetes actualizados.
- Pruebas de autenticación, eventos, parámetros intactos y las tres longitudes.

## 2026-10-28 — Selector de teclas, ventanas e inicio con Windows

Referencia de la web que distribuyó el puente: `3c1037f3fb1482a7825799a570db4df5ca68ded1`.

- Selector visual para pulsar la tecla o combinación deseada; Ctrl + F9 sigue por defecto.
- Ampliados tipos de teclas: letras/números solos, funciones, navegación, teclado numérico,
  signos y modificadores. Se informa de combinaciones reservadas u ocupadas.
- Botones Guardar, Cancelar, Predeterminado y Desactivar en el selector.
- Interfaz de ventanas separada del bucle del menú de bandeja; corregida la falta
  de respuesta de Aceptar y comprobadas dos ventanas consecutivas.
- Eliminado el acceso para abrir la web y los menús de su dirección.
- Ajuste técnico opcional de dominio conservado para otros alojamientos.
- Opción «Iniciar con Windows», desactivada por defecto, mediante registro del usuario.
- Rutas con espacios, conservación de modos de inicio y desactivación sin tocar otras apps.
- Compilación GUI y comprobación de los módulos incluidos y del servicio empaquetado.

## 2026-10-28 — Descarga directa del ejecutable

Referencia de la web: `513857a6a133a1949f3ae3ee1abb53310d50f5f0`.

- El botón de la web entrega directamente **Puente Entorno.exe**, en lugar de un ZIP.
- Instrucciones adaptadas para abrir el EXE sin extracción.
- Paquete ZIP de código/configuración del puente conservado como entrega aparte.

## 2026-10-28 — Atajo global configurable

Referencia de la web: `8202bad7c19a17f6ab4bc7e30dccdf662529e3bb`.

- Preparación automática del borrador en memoria mediante `/prepare`.
- Atajo global predeterminado Ctrl + F9, inicialmente con combinaciones predefinidas.
- Envío únicamente si el proceso GTA de FiveM está en primer plano.
- Registro nativo con MOD_NOREPEAT y separación de cliente normal/CL2.
- Bloqueo de envíos consecutivos duplicados y de borradores obsoletos.
- Comprobación de foco antes de conectar y antes de escribir a consola.
- Estado de preparación, atajo disponible/desactivado y compatibilidad con puentes anteriores.
- La confirmación se mantiene para el botón de la web; el atajo envía directamente.
- Entorno preparado en memoria, perdido al cerrar el puente; textos no guardados en disco.

## Etapas iniciales — Historial reconstruido

Estas etapas reflejan el orden de los requisitos y cambios de la conversación.
No se conservan fechas de publicación individuales suficientemente precisas para
asignarlas a cada petición. El proyecto ya existía al comenzar estas revisiones;
no se presentan estos apartados como versiones publicadas separadas.

### Generación y variedad

- Generador inicial de llamadas de testigos con prefijo `/entorno` y parámetros básicos.
- Redacción menos repetitiva que el saludo fijo a policía, apoyada en ejemplos aportados.
- Ampliación progresiva de bancos de variantes, aperturas, reacciones y cierres,
  con objetivos de diversidad de 240 posibilidades y más de 1.000 combinaciones.
  No se atribuye una cifra exacta actual de textos únicos a esos objetivos históricos.
- Nuevos tonos y modo Aleatorio; otra versión puede escoger otra voz.
- Breve reducido, Normal como extensión predeterminada y añadido Largo.

### Situaciones y lugares

- Situaciones ampliadas y presentadas con mayúscula inicial.
- Buscador integrado en el campo de situación; después extendido a otros selectores.
- Licorería, badulaque y situaciones de secuestro.
- Escenas de yate, furgón blindado, carguero, barbería, chatarrería, farmacia,
  tienda de ropa, pawnshop/casa de empeños, tienda digital/electrónica y casas.
- Más lugares generales, incluida iglesia, y zonas de GTA V como Paleto y Grapeseed.
- Compatibilidad entre situación y lugar para evitar combinaciones incoherentes;
  eliminación informada de lugares incompatibles al cambiar de situación.

### Personas, apariencia, armas y transporte

- Opciones rápidas en lugar de escribir la mayoría de parámetros.
- Cantidades iniciales 1–6/más de 6, ampliadas a 1–10 y entrada manual.
- Etiqueta «¿Cuántos sois?» y casilla «más de» aplicada a la cantidad elegida.
- Unificación de la cantidad manual, botones a todo el ancho y números en una línea.
- Ropa, colores, cara y detalles visibles.
- Armas reorganizadas en Desarmado, Arma melee, Arma de fuego y No se distingue;
  tipos de armas con nombres generales en la redacción.
- Catálogo GTA V/Online con buscador, categorías y favoritos de vehículos.
- Listas de colores y acabado; botones para coche, a pie y vehículo no visto.
- Compactación progresiva del buscador del catálogo.

### Configuraciones, interfaz e identidad

- Inicio sin parámetros seleccionados y cinco configuraciones guardadas localmente.
- Panel de configuraciones reducido y situado en la columna de resultado.
- Sustitución del texto promocional por la identidad del generador y evolución
  del título hasta «Generador de /entornos».
- Logo de cabecera y favicon.
- Estilo oscuro de referencia solicitado, con acentos burdeos y dorados.
- Retirada de etiquetas promocionales, aviso de plantillas/disponibilidad, numeración
  delante de categorías, créditos visibles de catálogo y textos de toolkit.
- Título de resultado cambiado a `/entorno`, eliminación de cajas y botones duplicados.
- Columnas de igual ancho y botón de copia diferenciado y colocado abajo.
- Ayuda de portapapeles, notificación y color verde tras copiar.
- Copiar y Ejecutar en FiveM en la misma fila cuando corresponde.

### Integración con FiveM y distribución

- Investigación y creación del puente local para comunicar la web con la consola.
- Detección para mostrar la función de ejecución y confirmación al usar el botón web.
- Ejecución en bandeja sin mantener una consola visible.
- Configuración de otro alojamiento/dominio y distribución desde la propia web.
- Límite del móvil aclarado: compartir Wi-Fi no da acceso al puente del PC.
- Generación de ZIP actualizados y limpieza de entregas antiguas/temporales.

### Revisión y móvil

- Revisión de sintaxis y flujo de datos, carga tardía del catálogo y configuraciones.
- Validación de cantidades manuales y correcciones de gramática de prendas.
- Los filtros de vehículos dejan de regenerar el entorno innecesariamente.
- Limpieza de eventos de selectores retirados para evitar acumulación de manejadores.
- Mejoras de teclado: selección inicial con ArrowUp y un solo desplegable activo.
- Validación de URL, origen, sesión y tiempos de conexión del puente.
- Primera adaptación móvil con controles táctiles, entradas de 16 px y prevención
  de desbordamientos horizontales.

## Cómo añadir el siguiente cambio

Crear arriba un apartado con fecha real y un título concreto. Describir las funciones,
correcciones o diseño que cambian; añadir las pruebas realizadas y sus límites.
Actualizar el manual al estado final y reconstruir los paquetes. No marcar como
publicado algo que solo existe localmente ni registrar una prueba que no se ejecutó.

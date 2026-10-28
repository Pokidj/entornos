# Documentación del Generador de /entornos

Última actualización documental: **28 de octubre de 2026**, Europa/Madrid.
Este manual describe el estado actual. El [changelog](CHANGELOG.md) conserva su evolución.

## 1. Qué hace

La web construye llamadas de testigos para roleplay. Combina una situación con
personas, lugar, ropa, armas, transporte y detalles, y produce un texto que empieza
por `/entorno`. La generación usa plantillas y variantes locales, sin un servicio
externo de IA. El puente de Windows es opcional y conecta el navegador con FiveM.

Web actual: [Generador de /entornos](https://entorno-rp-radio-2710.balmyguppy1.chatgpt.site/).
La web conserva su configuración de acceso existente; este manual no cambia su audiencia.

## 2. Guía de la web

### Selección rápida

- **Cantidad:** botones del 1 al 10 en una línea, cantidad manual de 1 a 999
  y casilla para expresar «más de» la cantidad elegida. La entrada manual y
  los botones representan la misma cantidad. Los valores manuales inválidos
  impiden generar y copiar un resultado.
- **Situación:** buscador integrado con 379 situaciones en el catálogo actual.
  Incluye robos, amenazas, daños, persecuciones, secuestros y escenas en negocios,
  viviendas, yates, cargueros y furgones blindados.
- **Lugar:** barrios y zonas de GTA V, como Paleto o Grapeseed, y lugares concretos.
  La lista se filtra según la situación. Si un lugar previo deja de ser compatible,
  se elimina y se informa del cambio. Es posible dejarlo sin especificar.
- **Apariencia:** vestimenta, color de ropa y cara/accesorios.
- **Arma visible:** Desarmado, Arma melee, Arma de fuego o No se distingue.
  Las categorías con armas despliegan sus tipos. La redacción utiliza nombres
  comprensibles como pistola, rifle o escopeta, sin exigir el modelo exacto.
- **Transporte:** seleccionar coche, a pie o vehículo no visto. El catálogo actual
  incluye 921 modelos, búsqueda por nombre/marca, categorías y favoritos.
  Al elegir un vehículo se pliega el catálogo; «Ver catálogo» permite cambiarlo.
  Color y acabado quedan accesibles fuera de la lista plegada.
- **Detalles adicionales:** casillas observables y un texto libre opcional de hasta
  400 caracteres, agrupados en un desplegable.

Los parámetros empiezan sin elegir, con **tono Aleatorio** y **extensión Normal**.
«Vaciar todo» restablece esa selección; no borra los favoritos ni las configuraciones guardadas.

### Resultado

El texto se actualiza al seleccionar. «Generar otra versión» cambia la redacción
manteniendo los parámetros. Los tonos ofrecen distintas voces y reacciones;
Aleatorio elige un tono al generar. Hay tres extensiones: Breve, Normal y Largo.
Las variantes breves también pueden cambiar su comienzo.

El resultado se puede editar directamente. «Copiar entorno» lo lleva al portapapeles,
muestra una notificación y vuelve verde el mensaje de copia. Al cambiar el texto
se restablece ese estado. Si el navegador impide copiar, se informa y se selecciona
el texto para copiarlo manualmente.

### Configuraciones con nombre y acceso rápido

«Mis entornos» tiene un recuadro independiente debajo de los paneles,
con el mismo ancho que el bloque de conexión con FiveM. Permanece visible, sin
espacios preestablecidos ni límite fijo de cinco elementos. Escribe un nombre
de hasta 40 caracteres y pulsa «Guardar» (también puedes pulsar Enter).
El campo de nombre y el botón están centrados en la parte superior del recuadro;
los botones de acceso rápido se muestran debajo.
Hace falta elegir una situación y utilizar una cantidad válida, si la especificas.
Cada configuración se convierte en un botón: una pulsación carga sus parámetros.
El botón activo queda resaltado. Los nombres no pueden repetirse ignorando
mayúsculas y espacios sobrantes; guardar nunca sobrescribe otra configuración por nombre.

Al cargar una configuración aparecen «Actualizar datos», «Renombrar» y «Eliminar».
Estas acciones se sitúan junto a «Guardar» en la barra superior; en pantallas
estrechas se ajustan a varias filas para evitar desbordamientos.
Actualizar conserva el nombre y sustituye sus parámetros por la selección actual;
renombrar usa el nombre del campo sin cambiar sus parámetros. Tras eliminar se puede
«Deshacer» mientras se conserve esa recuperación en la página; no sobrevive a una recarga.
Se conservan parámetros, cantidad y su modificador, arma, vehículo y detalles.
Cargar un vehículo funciona aunque el catálogo todavía esté descargándose.
No se guarda el texto generado como si fuese un parámetro.

Los cinco espacios anteriores se migran automáticamente: solo se convierten los
ocupados, conservando sus datos. Los nombres repetidos reciben un sufijo para
distinguirlos. El almacenamiento anterior se conserva como respaldo. No existe un
límite artificial de configuraciones; se aplica la capacidad del navegador. Si una
escritura falla se informa y se mantienen los datos anteriores. Si no se puede leer
el formato guardado, se bloquea guardar para evitar sobrescribirlo.

### Diseño y teclado

Dos paneles del mismo ancho en escritorio, controles de altura coherente y acciones
de copia junto al texto. En móvil se usa una columna principal, campos agrupados
en dos columnas cuando corresponde y entradas de tamaño legible. Se mantienen
los números en una fila. Los campos con búsqueda admiten navegación por teclado
y cierre de desplegables; solo debe quedar abierto un buscador a la vez.

La revisión visual cubrió anchos de 320 y 390 píxeles y escritorio. La casilla de
versión automática se ajusta al ancho del panel y solo aparece cuando el botón
«Ejecutar en FiveM» está habilitado y el puente admite eventos de envío.

## 3. Datos guardados

| Dato | Dónde se guarda |
| --- | --- |
| Favoritos de vehículos | `localStorage`, clave `entorno-favs`. |
| Configuraciones con nombre | `localStorage`, clave `entorno-configs-v2`; `entorno-configs-v1` se conserva tras migrar los espacios anteriores. |
| Preferencia de otra versión tras el atajo | `localStorage`, clave `entorno-auto-version`. |
| Atajo del puente | `configuracion.json` junto al EXE. |
| Inicio con Windows | Registro del usuario de Windows, descrito más adelante. |
| Entorno preparado y sesión del puente | Memoria del proceso; no se persisten los textos en disco. |

El almacenamiento del navegador depende del origen: otro dominio, otro navegador
o borrar sus datos puede dejar los favoritos y configuraciones anteriores fuera
de alcance. No existe sincronización de configuraciones entre dispositivos.

## 4. Puente de Windows

### Instalar y actualizar

1. Cierra el puente anterior desde su icono de bandeja.
2. Descarga `Puente Entorno.exe` desde la web y guárdalo en una carpeta fija.
3. Abre el EXE en el mismo PC donde juegas. No necesita instalar Python ni mantener
   una consola abierta. El icono puede quedar entre los iconos ocultos junto al reloj.
4. Abre FiveM, entra al servidor y recarga la web.
5. Si el navegador solicita acceso a la red local para el generador, permite ese acceso.

La web detecta el puente. Oculta el bloque «Conecta el generador con FiveM» mientras
lo detecta y lo vuelve a mostrar si deja de estar disponible. La preparación del
texto no ejecuta ningún comando.

### Dos formas de enviar

- **Botón de la web:** «Ejecutar en FiveM» solicita confirmación antes del envío.
- **Atajo:** prepara el texto en la web, espera a «Entorno preparado», vuelve a FiveM
  y pulsa **Ctrl + F9**. Envía directamente, sin una confirmación adicional.

El atajo solo envía cuando el proceso del juego de FiveM correspondiente está en
primer plano. Distingue el cliente normal y CL2. Mantener la tecla pulsada no debe
repetir el aviso. El mismo texto normalizado no se vuelve a enviar consecutivamente;
existe además un intervalo mínimo de dos segundos entre envíos.

Un envío a la consola no confirma que el servidor haya aceptado o publicado su
comando particular. Si una escritura queda incierta, el puente evita repetirla
automáticamente y pide comprobar el juego.

### Menú de bandeja

| Opción | Uso |
| --- | --- |
| Comprobar estado | Conexión con la consola, preparación y estado del atajo. |
| Elegir atajo de teclado | Pulsar una tecla/combinación y Guardar; también restaurar, desactivar o cancelar. |
| Iniciar con Windows | Activar/desactivar el inicio al entrar en la sesión; inicialmente desactivado. |
| Cerrar puente | Liberar el atajo y cerrar el servicio local. |

El selector admite letras, números, teclas de función, flechas, teclado numérico,
signos y combinaciones con Ctrl, Alt, Shift o Win. Un modificador aislado no es una
tecla de acción. Windows reserva algunas combinaciones o puede haber otra aplicación
usándolas: en ese caso se informa y hay que elegir otra.

Las ventanas se atienden en el hilo principal de la interfaz, separado del menú
de bandeja y del servidor local. Se corrigió el problema de ventanas que no respondían
al pulsar Aceptar. El puente ya no abre el generador ni muestra menús para su dirección.

### Inicio con Windows

La opción crea o elimina solo el valor `PuenteEntorno` de:

```text
HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run
```

No requiere administrador y conserva los modos `--slash`/`--cl2` activos al habilitarlo.
La ruta se entrecomilla para admitir espacios. Mantén el EXE donde estaba al activarlo.
Si lo mueves, abre la nueva copia y vuelve a activar la opción. Desactívala antes
de borrar el puente. Una ruta demasiado larga produce un aviso en vez de guardarse.

## 5. Otra versión después del atajo

Activa en la web **«Generar otra versión después de usar el atajo»**. La preferencia
se recuerda en ese navegador y requiere un puente que anuncie `send-events`.

1. Se prepara el texto actual en el puente.
2. El usuario pulsa el atajo con FiveM delante.
3. Si termina el envío, el puente emite un evento secuenciado con origen `hotkey`.
4. La web genera otra redacción con las mismas selecciones y prepara ese nuevo texto.
5. La siguiente versión espera otra pulsación: no se ejecuta sola.

Funciona con Breve, Normal y Largo. Se ignoran eventos repetidos, textos que ya no
coinciden con la edición actual y envíos desde el botón manual. Un fallo o una escritura
incierta no dispara la generación. La web tiene que permanecer abierta: puede estar
en segundo plano, pero si el navegador la suspende o se cierra no puede preparar
otra versión hasta volver a ejecutarse.

## 6. Alojamiento y cambio de dominio

La web publicada es HTML/CSS/JavaScript estático. No necesita Node ni Python para
funcionar en el alojamiento; esos programas se usan en desarrollo y pruebas.

Sube **todo el contenido de `dist/`**, conservando nombres y la carpeta `downloads/`.
El ZIP de la web coloca esos archivos directamente en su raíz, además de documentación.
Sirve la página por HTTP/HTTPS: abrir `index.html` con `file://` puede impedir cargar
el catálogo o conectar el puente. Usa HTTPS en el alojamiento final.

El puente acepta de forma predeterminada el origen de la web actual. Para otro
alojamiento, el responsable puede usar el ajuste técnico opcional:

```json
{
  "hotkey": "CTRL+F9",
  "web_url": "https://tudominio.es/generador/"
}
```

Guardar junto al EXE en `configuracion.json` y reiniciar el puente. El campo `web_url`
no es necesario para el dominio predeterminado y no aparece en su menú. El origen
incluye esquema, dominio y puerto; `www` y sin `www` no son equivalentes. No usar
comodines, credenciales, consultas ni fragmentos. Un cambio de origen renueva la sesión.

Si el alojamiento define CSP, su `connect-src` debe permitir la conexión con el puente
local. Las restricciones de red local o contenido mixto del navegador pueden requerir
permisos o afectar la compatibilidad; no todos los navegadores garantizan el mismo acceso.
Los recursos de esta revisión llevan un parámetro de versión para renovar su caché.
Cambiar ese identificador cuando se publiquen nuevas versiones de esos recursos.

La web en un móvil permite generar y copiar. El puente del PC **no se controla desde
el móvil**, aunque compartan Wi-Fi: escucha únicamente en el bucle local de cada dispositivo.
No se ha implementado emparejamiento ni acceso remoto por LAN.

## 7. Arquitectura y archivos

```text
outputs/
  entorno-rp/
    README.md, DOCUMENTACION.md, CHANGELOG.md, REVISION.md
    AGENTS.md                 Reglas de mantenimiento
    .openai/hosting.json       Identidad/configuración del sitio
    dist/
      index.html              Estructura y formularios
      styles.css              Estilo y adaptación móvil
      app.js                  Parámetros, generación, catálogo y configuraciones
      presets.js              Configuraciones con nombre, migración y accesos rápidos
      voices.js               Tonos y bancos de variantes
      situation-combo.js      Buscador de situaciones
      searchable-selects.js   Selectores con búsqueda y teclado
      location-logic.js       Compatibilidad entre situaciones y lugares
      fivem-bridge.js         Detección, preparación, confirmación y eventos
      vehicles.json           Catálogo distribuido con la web
      logo.svg, favicon.svg   Identidad visual
      downloads/Puente Entorno.exe
    tests/                    Pruebas de la web con jsdom
    scripts/package-release.py
  puente-fivem-configurable/
    Puente Entorno.exe
    puente.py                 HTTP local, protocolo FiveM y bandeja
    hotkeys.py                Registro y validación del atajo
    bridge_ui.py              Ventanas y selector de teclas
    startup.py                Inicio con Windows
    configuracion.json
    Iniciar-CL2.cmd, Iniciar-con-barra.cmd
    requirements-build.txt, LEEME.txt, PRUEBAS.txt
    tests/
```

### Conexión local

| Elemento | Dirección o función |
| --- | --- |
| Navegador a puente | `http://127.0.0.1:39173` |
| Puente a consola normal | Puerto local `29200` |
| Puente a consola CL2 | Puerto local `29300` |
| `GET /health` | Identidad, versión 2, conexión, token temporal, capacidades, secuencia y preparación. |
| `POST /prepare` | Guarda o vacía el borrador en memoria; no envía al juego. |
| `POST /execute` | Envía un `/entorno` válido desde el botón de la web. |
| `POST /events` | Espera eventos posteriores a una secuencia, hasta 18 segundos. |

Las peticiones verifican `Origin` y `Host`; los POST requieren `X-Entorno-Token`
y JSON. La consulta de eventos vuelve a comprobar la sesión después de la espera.
El puente limita tamaño y sintaxis, rechaza controles/saltos de línea, normaliza
separadores y solo admite el comando de entorno. No expone ejecución arbitraria.

El protocolo de consola usa saludo `PPCR`, respuesta `AINF` y trama `CMND`.
Por defecto envía `entorno "texto"`; `--slash` usa `/entorno "texto"` y `--cl2`
selecciona la segunda consola. `--console` es un modo de diagnóstico para desarrolladores.
El acceso es local: no abrir puertos del router ni ampliar el enlace a toda la red.

## 8. Desarrollo, pruebas y compilación

### Web

Desde `outputs/entorno-rp/tests`:

```powershell
npm install
npm test
```

Dependencia de pruebas: `jsdom` 29.1.1. No se carga en la web de producción.
Las tres suites son `test-web.mjs`, `test-copy-actions.mjs` y `test-web-hotkey.mjs`.
Para una vista local, desde `outputs/entorno-rp`:

```powershell
python -m http.server 8766 --bind 127.0.0.1 --directory dist
```

Visitar `http://127.0.0.1:8766/`. El puente no aceptará automáticamente este origen
de pruebas: su autorización de dominio sigue aplicándose.

### Puente

Desde `outputs/puente-fivem-configurable`, con Python 3.12 para reconstruir:

```powershell
python -m unittest discover -s tests -p "test_*.py" -v
python -m pip install -r requirements-build.txt
python -m PyInstaller --onefile --windowed --name "Puente Entorno" --hidden-import pystray._win32 --exclude-module numpy puente.py
```

Dependencias fijadas: pystray 0.19.5, Pillow 13.0.0 y PyInstaller 6.22.3. La interfaz
también requiere Tk/Tcl de la distribución de Python, que se incluye al empaquetar.
No excluir `tkinter` al compilar esta versión. La salida habitual de PyInstaller
está en su carpeta `dist/`; reemplazar con ella el EXE de distribución del puente
y `entorno-rp/dist/downloads/Puente Entorno.exe` antes de crear los ZIP.

### Última verificación disponible

- 442 comprobaciones de la suite principal de la web superadas, más las suites
  de copia/confirmación y de preparación/eventos.
- Puente: 24 pruebas en total, 23 superadas y una omitida porque el entorno aislado
  rechaza el registro global de teclas con error 5.
- Revisión visual de escritorio y de anchos 320/390, sin desbordamiento horizontal
  en los estados comprobados; pruebas de plegado del catálogo y configuraciones.
- En revisiones anteriores se comprobó el EXE GUI, módulos incluidos, igualdad
  de la descarga, arranque de `/health` y botones de ventanas.
- El usuario confirmó el funcionamiento del puente en su equipo. Las pruebas del
  agente no publicaron avisos en una partida ni reiniciaron Windows para validar el arranque.

La batería de web se volvió a ejecutar al incorporar configuraciones con nombre;
incluye migración, más de cinco elementos, actualización, renombrado, borrado/deshacer,
recarga, nombres duplicados y errores de almacenamiento. El resultado del puente
corresponde a su revisión anterior: su código y ejecutable no cambian en esta entrega.
Actualizar estas cifras solo cuando se obtengan resultados nuevos.

## 9. Problemas habituales

| Problema | Comprobación |
| --- | --- |
| No aparece Ejecutar en FiveM | Puente abierto en el mismo PC, versión actual, permisos del navegador y origen autorizado. |
| El puente está detectado pero no permite enviar | FiveM dentro del servidor, borrador válido y distinto del último enviado; esperar el intervalo mínimo. |
| El atajo no actúa | FiveM delante, atajo activo/disponible y entorno preparado. Cambiar una combinación reservada u ocupada. |
| No genera el siguiente entorno | Activar la opción, actualizar el puente, dejar la web abierta y revisar que el envío no haya sido manual, fallido o incierto. |
| Ya está abierto o puerto ocupado | Buscar el icono de otra instancia y cerrarla; usar una sola versión del puente. |
| No inicia con Windows después de moverlo | Abrir la nueva copia desde una carpeta fija y volver a activar la opción. |
| No se guardan favoritos/configuraciones | Revisar almacenamiento del navegador, modo privado y dominio usado. |
| No carga el catálogo | Servir la web por HTTP/HTTPS e incluir `vehicles.json`. |
| El servidor no publica el aviso | Comprobar su comando de entorno y, si corresponde, probar el modo `--slash`; el puente solo confirma el envío a consola. |

## 10. Entregas y mantenimiento

La fuente canónica de documentación es esta carpeta: `README.md`, `DOCUMENTACION.md`,
`CHANGELOG.md` y `REVISION.md`. Las copias dentro de ZIP se generan desde ella.
Desde `outputs/entorno-rp`:

```powershell
python scripts/package-release.py
```

Esto reconstruye los ZIP de web, puente y documentación en `outputs/`, sin recompilar
el EXE ni publicar el sitio. El ZIP de documentación no incluye binarios. Se excluyen
dependencias, cachés y metadatos Git de los paquetes.

Con cada cambio: revisar este manual, añadir una entrada al changelog con su fecha
real, ajustar guías afectadas, comprobar lo necesario y regenerar paquetes. Las
reglas persistentes están en los `AGENTS.md` de la carpeta de trabajo y del repositorio.
No hay un monitor que edite documentación fuera de los trabajos realizados en el proyecto.

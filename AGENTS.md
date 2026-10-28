# Documentación obligatoria del proyecto

Cada cambio debe incluir la revisión de `DOCUMENTACION.md` y una entrada nueva en
`CHANGELOG.md`. Mantener `README.md` y `REVISION.md` coherentes; los documentos de
esta carpeta son la fuente canónica para los ZIP.

Usar fechas reales de Europa/Madrid. No inventar versiones, fechas históricas,
resultados de pruebas ni estados de publicación. Separar lo comprobado de lo
pendiente. Nunca incluir credenciales.

Si el cambio afecta al puente de `../puente-fivem-configurable`, actualizar también
su LEEME y PRUEBAS. Reconstruir el EXE solo cuando cambie su código.

Antes de entregar, ejecutar `python scripts/package-release.py` desde esta carpeta
y verificar los ZIP actualizados. Excluir temporales, dependencias, cachés y `.git`.
Conservar la identidad y audiencia del sitio al publicar cambios de la web.

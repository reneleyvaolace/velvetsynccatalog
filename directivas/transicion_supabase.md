# Directiva: Transición a Supabase como Fuente de Verdad Única
## Versión: 1.0.0 | Última actualización: 2026-03-14

### Objetivos
- Eliminar la dependencia del archivo local `devices-categories.csv`.
- Establecer Supabase como la única fuente de verdad para el catálogo de dispositivos.
- Asegurar que el enriquecimiento de datos técnica se realice directamente sobre la base de datos de Supabase.

### Estrategia
1. **Auditoría de Acceso a Datos**: Confirmar que `DeviceCatalog.jsx` y `CategoryManager.jsx` solo utilizan el cliente de Supabase.
2. **Migración de Scripts de Sincronización**: Crear un nuevo script de Python que lea de Supabase y actualice con la API de LoveSpouse, reemplazando el flujo basado en CSV.
3. **Limpieza de Archivos**: Eliminar archivos redundantes (`devices-categories.csv`, `csv-exporter.js`, `compatible_devices.json`).
4. **Actualización de Documentación**: Reflejar los cambios en las directivas de sincronización.

### Pasos de Ejecución
1. Crear `scripts/supabase_sync_lovespouse.py` utilizando `supabase-py` y `.env.local`.
2. Ejecutar una prueba de sincronización para validar la conexión y actualización.
3. Eliminar `devices-categories.csv`.
4. Eliminar `csv-exporter.js`.
5. Eliminar cualquier referencia a `compatible_devices.json` en scripts secundarios.
6. Actualizar `directivas/lovespouse_catalog_sync.md` para reflejar el nuevo flujo.

### Historial de Aprendizaje
- La dependencia de archivos CSV locales genera inconsistencias cuando varios componentes intentan actualizar la base de datos.
- La normalización de datos debe ocurrir antes de la inserción/actualización en Supabase para mantener la integridad de los filtros.

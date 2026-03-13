## Versión: 1.0.0 | Última actualización: 2026-03-13

### Objetivo:
Migrar la fuente de datos del catálogo de dispositivos de un archivo JSON local (`compatible_devices.json`) a una base de datos Supabase, integrando el cliente oficial, mapeando campos, actualizando el componente `DeviceCatalog.jsx` y configurando el manejo de rutas de medios locales.

### Entradas:
- `src/data/compatible_devices.json` (Archivo original a ser reemplazado).
- Variables de entorno en `.env.local` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).

### Salidas:
- `src/lib/supabase.js`: Cliente de Supabase configurado.
- `src/utils/mediaUtils.js`: Helpers para URLs de imágenes, QRs y PDFs.
- `src/components/DeviceCatalog.jsx`: Componente actualizado para consumir Supabase.
- `vite.config.js`: Configuración actualizada para assets estáticos.
- `activity.log`: Registro detallado de la migración.

### Lógica y Pasos a Ejecutar:
1. **Configuración de Conectividad:** Crear el cliente de Supabase en `src/lib/supabase.js`.
2. **Mapeo de Datos:** Implementar la lógica de mapeo JSON → Supabase (id → id, title → model_name, etc.).
3. **Refactorización del Componente:**
   - Reemplazar el import del JSON por el cliente de Supabase.
   - Actualizar `useEffect` para realizar el fetch asíncrono desde la tabla `device_catalog`.
   - Implementar `mapDeviceFromSupabase()` para mantener compatibilidad con la UI.
4. **Gestión de Medios:**
   - Crear utilidades de rutas en `src/utils/mediaUtils.js`.
   - Modificar `vite.config.js` para incluir extensiones de archivos PDF e imágenes en el build/server.
5. **Actualización de Filtros:** Adaptar la lógica de filtrado a los nuevos nombres de campos (usage_type, target_anatomy, etc.).
6. **Limpieza y Git:** Eliminar el JSON antiguo y asegurar que `.env.local` esté en `.gitignore`.

### Restricciones / Trampas Conocidas (Historial de Aprendizaje):
- *2026-03-13 (1.0.0):* Inicialización de la migración. Se debe asegurar que las rutas locales de medios coincidan con la estructura `/documentacion/docs/...`.

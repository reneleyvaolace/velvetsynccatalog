# Directiva: Migración de Archivos a GitHub
## Versión: 1.0.0 | Última actualización: 2026-03-13

### Objetivo
Migrar el almacenamiento y referencia de archivos multimedia (imágenes, QR, PDF) desde el sistema de archivos local (o almacenamiento de Supabase) hacia un repositorio público en GitHub para asegurar accesibilidad global y centralización.

### Entradas
- Repositorio GitHub: `reneleyvaolace/velvetsynccatalog`
- Rama: `main`
- Directorio de assets: `documentacion/docs/`
- Tabla Supabase: `device_catalog`

### Lógica de Implementación
1. **Sincronización de GitHub**: 
   - Asegurar que todos los archivos locales en `documentacion/docs/` estén commiteados y pusheados a la rama `main`.
   - La base URL para archivos RAW será: `https://raw.githubusercontent.com/reneleyvaolace/velvetsynccatalog/main/documentacion/docs/`.

2. **Actualización de Base de Datos (SQL)**:
   - Modificar las columnas `image_url`, `qr_code_url` y `ficha_tecnica_url` para apuntar a las URLs de GitHub Raw.
   - Usar el `id` del dispositivo para construir el nombre del archivo según los patrones:
     - Imágenes: `img/VS_{id}.jpg`
     - QR: `qr/QR_{id}.png`
     - PDF: `pdf/FICHA_{id}_PREMIUM.pdf`

3. **Adaptación del Frontend**:
   - Actualizar `src/utils/mediaUtils.js` para que los generadores de URL apunten a GitHub por defecto.
   - Asegurar que `DeviceCatalog.jsx` consuma estas nuevas rutas.

### Pasos Realizados
1. Identificación de archivos locales y estado de Git.
2. `git add .`, `git commit` y `git push` para subir más de 7000 archivos (imágenes y PDFs).
3. Creación del script SQL `scripts/migrar_rutas_github.sql`.
4. Refactorización de `src/utils/mediaUtils.js`.

### Historial de Aprendizaje
- **Restricción**: El push inicial fue lento debido al volumen de archivos binarios (casi 600MB). Se debe monitorear el progreso del terminal.
- **Nota**: El acceso a Supabase vía MCP puede estar restringido si el proyecto no está listado en la cuenta vinculada, por lo que se proporciona el script SQL para ejecución manual o vía panel de Supabase.

### Verificación
- Confirmar que las URLs de GitHub Raw son accesibles públicamente.
- Verificar en el navegador la carga de imágenes tras el cambio en `mediaUtils.js`.

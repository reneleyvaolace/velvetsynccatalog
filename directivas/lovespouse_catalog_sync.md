## Versión: 2.0.0 | Última actualización: 2026-03-14

### Objetivo:
Sincronizar y enriquecer el catálogo de dispositivos directamente en **Supabase** utilizando la API pública de LoveSpouse (`https://lovespouse.zlmicro.com/index.php?g=App&m=Diyapp&a=getproductdetail&barcode=XXXX&userid=-1`), extrayendo el Título, Imágenes, Funciones soportadas, el **ID interno del dispositivo** y su **código QR de vinculación**.

### Entradas:
- Tabla `device_catalog` en Supabase.
- Variables de entorno en `.env.local` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).

### Salidas:
- Tabla `device_catalog` actualizada en Supabase.
- `activity.log`: Registro de ejecución.

### Lógica y Pasos a Ejecutar:
1. Conectar a Supabase y obtener la lista de dispositivos (id, barcode).
2. Iterar utilizando `ThreadPoolExecutor` para manejar llamadas concurrentes a la API de LoveSpouse.
3. Para cada dispositivo:
   - Consultar la API de LoveSpouse usando el `barcode`.
   - Extraer `Title`, `Pics`, `Qrcode`, `FuncObj` (para funciones soportadas) e `IsPrecise`.
   - Actualizar el registro correspondiente en la tabla `device_catalog` de Supabase.
4. Validar la actualización mediante logs.

### Restricciones / Trampas Conocidas (Historial de Aprendizaje):
- *2026-03-14 (2.0.0):* Se rompió el vínculo con el archivo CSV local. Supabase es ahora la fuente de verdad única. El script `scripts/supabase_sync_lovespouse.py` reemplaza al anterior flujo basado en archivos locales.
- *2026-03-14 (2.0.0):* El campo `supported_funcs` se almacena como una cadena separada por pipes (`|`) para compatibilidad con el front-end que utiliza regex `[|,;]` para su visualización.
- *2026-03-08 (1.1.0):* Se descubrió que el payload original de la API retorna nodos subutilizados y muy útiles como el ID en base de datos (`data.Id`) y el código QR de vinculación app (`data.Qrcode`).
- El request a la API puede retornar JSON pero, si el dispositivo no existe, arroja un comportamiento que capturar (`response.result == false`).
- ThreadPool de máximo 10 workers resulta estable para evitar bloqueos por parte de la API.

## Versión: 1.1.0 | Última actualización: 2026-03-08

### Objetivo:
Enriquecer el catálogo de dispositivos base (`devices-categories.csv`) utilizando la API pública de LoveSpouse (`https://lovespouse.zlmicro.com/index.php?g=App&m=Diyapp&a=getproductdetail&barcode=XXXX&userid=-1`), extrayendo el Título, Imágenes, Funciones soportadas, el **ID interno del dispositivo** y su **código QR de vinculación**.

### Entradas:
- `devices-categories.csv`: El archivo original con los barcodes e información predefinida.

### Salidas:
- `.tmp/devices-categories-enriched.csv`: El catálogo resultante consolidado y enriquecido con nueva metadata.
- `activity.log`: Registro de ejecución.

### Lógica y Pasos a Ejecutar:
1. Cargar el archivo CSV de entrada y detectar la columna `Barcode`.
2. Iterar utilizando `ThreadPoolExecutor` para manejar llamadas REST HTTP concurrentes, manteniendo control explícito de fallos de red por Timeouts.
3. Hacer la llamada GET sobre cada Barcode a la API.
4. Extraer las nuevas propiedades `data.Id` (ID Interno de la DB de LoveSpouse), `data.Qrcode` (URL de la imagen del código QR), e integrarlo junto al `Title`, `Pics` y `SupportedFuncs`.
5. Recrear el Dataset y volcarlo al archivo de destino final `.tmp/devices-categories-enriched.csv`.

### Restricciones / Trampas Conocidas (Historial de Aprendizaje):
- *2026-03-08 (1.1.0):* Se descubrió que el payload original de la API retorna nodos subutilizados y muy útiles como el ID en base de datos (`data.Id`) y el código QR de vinculación app (`data.Qrcode`). Se deben mapear obligatoriamente previendo su hipotética nulidad `api_data.get('Qrcode', '')`.
- El request a la API puede retornar JSON pero, si el dispositivo no existe, arroja un comportamiento que capturar (`response.result == false`).
- Para optimizar tiempo de uso si hay miles de dispositivos, incluir un rate-limit moderado o control temporal puede ser necesario. ThreadPool de máximo 10 workers resulta estable por ahora.

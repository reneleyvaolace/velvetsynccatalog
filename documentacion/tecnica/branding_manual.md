# Manual Técnico: Branding Velvet Sync
## Versión: 1.2.0 | Última actualización: 2026-03-08

### Concepto Creativo
La marca "Velvet Sync" utiliza la estética 'Neon Noir' para transmitir sofisticación y precisión técnica. Los elementos visuales están diseñados para ser discretos pero potentes, representando la sincronización dual y la transferencia cifrada de datos.

### Identidad Visual y Animación
#### Motor de Animación "Build-and-Stay"
A diferencia de los logos genéricos con bucles infinitos, Velvet Sync implementa una animación de entrada de un solo uso para enfatizar la **construcción segura del túnel de datos**:
1. **Entrada Espacial**: El logo aparece desde el plano superior con un sutil escalado.
2. **Trazado de Canales (CH1 y CH2)**: Los caminos SVG se dibujan mediante `stroke-dashoffset` en una secuencia entrelazada.
3. **Fijación de Posición**: Una vez completado el trazado, los vectores se bloquean (`animation-fill-mode: forwards`) para evitar distracciones visuales, manteniendo solo un pulso de luz residual en el núcleo central.
#### Paleta de Colores
- **Negro Obsidiana (#0A0A0A):** Base para la interfaz, transmite discreción y profesionalismo.
- **Magenta Eléctrico (#E43681):** Acento para operaciones activas de CH1.
- **Cian Profundo (#00FFEE):** Acento para operaciones activas de CH2 o confirmaciones de transferencia.

#### Isotipo
Un isotipo abstracto que combina dos ondas de frecuencia entrelazadas. La forma resultante recuerda vagamente a una 'V' (por Velvet) o a un símbolo de 'Infinito' estilizado, representando el flujo constante de datos entre dos canales.

### Archivos de Marca
- `velvet_sync_logo_suite`: Logo principal con nombre tipográfico.
- `velvet_sync_stealth_icon`: Icono minimalista para la aplicación, diseñado para pasar desapercibido como un ajuste de sistema o monitor de frecuencia.

### Uso Correcto e Integración
- **Fondo:** El logo principal (`logo_integrated.png`) tiene un fondo negro sólido para integrarse perfectamente. En CSS, se utiliza `mix-blend-mode: screen` para asegurar una transparencia digital completa sobre degradados.
- **Icono App:** Destinado para el escritorio y barra de tareas para máxima discreción.
- **Contenedor:** Se ha eliminado el borde y fondo explícito del contenedor para evitar el efecto 'etiqueta', sustituyéndolo por un aura de brillo suave (`radial-gradient`).

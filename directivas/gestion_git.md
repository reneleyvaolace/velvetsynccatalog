# Directiva: Gestión de Repositorio Git
## Versión: 1.0.0 | Última actualización: 2026-03-08

### Objetivo
Establecer un flujo de trabajo para la vinculación y sincronización del proyecto local con repositorios remotos de GitHub.

### Entrada
- URL del repositorio remoto.
- Archivos locales del proyecto.

### Salida
- Repositorio local inicializado.
- Remote 'origin' configurado.
- Código subido a la rama principal.

### Lógica de Ejecución
1. Verificar si el directorio `.git` existe.
2. Si no existe, ejecutar `git init`.
3. Configurar el remote `origin` con la URL proporcionada.
4. Si ya existe un remote `origin`, actualizarlo.
5. Realizar un commit inicial con todos los archivos (respetando `.gitignore`).
6. Renombrar la rama a `main`.
7. Subir los cambios al remoto.

### Restricciones / Historial de Aprendizaje
- **2026-03-08:** Vinculación inicial con el repositorio `velvetsynccatalog.git` completada con éxito.
- **Nota:** Asegurarse de que el archivo `.gitignore` sea respetado.
- **Seguridad:** No subir archivos `.env` o carpetas `node_modules`.

### Skill Utilizadas
- Control de versiones (Git).
- Automatización mediante Python.

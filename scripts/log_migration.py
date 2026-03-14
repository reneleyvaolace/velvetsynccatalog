import logging
import os

# Configuración de logs
logging.basicConfig(
    filename='activity.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def log_action(message):
    logging.info(message)
    print(message)

def main():
    log_action("--- INICIO LOG MIGRACIÓN GITHUB ---")
    log_action("Paso 1: Actualización de repositorio GitHub con activos locales.")
    log_action("Resultado: Push exitoso de documentacion/docs/ a la rama main.")
    log_action("Paso 2: Generación de script SQL 'scripts/migrar_rutas_github.sql'.")
    log_action("Paso 3: Actualización de 'src/utils/mediaUtils.js' para usar URLs de GitHub Raw.")
    log_action("Paso 4: Creación de directiva 'directivas/migracion_github.md'.")
    log_action("--- FIN LOG MIGRACIÓN GITHUB ---")

if __name__ == "__main__":
    main()

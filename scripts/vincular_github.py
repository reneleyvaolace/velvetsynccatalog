# -*- coding: utf-8 -*-
"""
Script: vincular_github.py
Versión: 1.0.0
Descripción: Vincula el proyecto local a un repositorio de GitHub y realiza el push inicial.
"""

import subprocess
import os
import logging
from datetime import datetime

# Configuración de Logs
logging.basicConfig(
    filename='activity.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    encoding='utf-8'
)

def run_git_command(command):
    try:
        logging.info(f"Ejecutando comando: {' '.join(command)}")
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            check=True,
            cwd=os.getcwd()
        )
        logging.info(f"Resultado exitoso: {result.stdout.strip()}")
        return True, result.stdout.strip()
    except subprocess.CalledProcessError as e:
        error_msg = f"Error en comando {' '.join(command)}: {e.stderr.strip()}"
        logging.error(error_msg)
        return False, error_msg

def main():
    repo_url = "https://github.com/reneleyvaolace/velvetsynccatalog.git"
    logging.info("--- Iniciando proceso de vinculación de GitHub ---")
    
    # 1. Verificar/Inicializar Git
    if not os.path.exists('.git'):
        success, msg = run_git_command(['git', 'init'])
        if not success: return
    else:
        logging.info("El repositorio git ya está inicializado.")

    # 2. Configurar Remoto
    # Intentamos remover 'origin' si ya existe para evitar conflictos
    run_git_command(['git', 'remote', 'remove', 'origin'])
    
    success, msg = run_git_command(['git', 'remote', 'add', 'origin', repo_url])
    if not success: return

    # 3. Preparar archivos (add .)
    success, msg = run_git_command(['git', 'add', '.'])
    if not success: return

    # 4. Commit Inicial
    # Verificamos si hay algo que commitear
    success, msg = run_git_command(['git', 'status', '--porcelain'])
    if success and msg:
        success, msg = run_git_command(['git', 'commit', '-m', 'Initial commit: Vinculación con GitHub'])
        if not success: return
    else:
        logging.info("No hay cambios para commitear.")

    # 5. Rama Principal (main)
    success, msg = run_git_command(['git', 'branch', '-M', 'main'])
    if not success: return

    # 6. Push
    logging.info("Realizando push a origin main...")
    # Usamos -u para setear el upstream
    success, msg = run_git_command(['git', 'push', '-u', 'origin', 'main'])
    
    if success:
        logging.info("Vinculación y push inicial completados con éxito.")
        print("✅ Proyecto vinculado a GitHub exitosamente.")
    else:
        print(f"❌ Error al vincular el proyecto: {msg}")

if __name__ == "__main__":
    main()

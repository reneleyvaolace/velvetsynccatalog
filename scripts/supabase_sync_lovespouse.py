# scripts/supabase_sync_lovespouse.py
# Versión: 1.0.0
import logging
import os
import requests
import json
from concurrent.futures import ThreadPoolExecutor
from supabase import create_client, Client
from dotenv import load_dotenv

# Configuración de Logging
logging.basicConfig(
    filename='activity.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Cargar variables de entorno desde .env.local
load_dotenv('.env.local')

API_URL = "https://lovespouse.zlmicro.com/index.php?g=App&m=Diyapp&a=getproductdetail&barcode={}&userid=-1"

def fetch_lovespouse_data(barcode):
    try:
        url = API_URL.format(barcode)
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data and isinstance(data, dict) and data.get('response', {}).get('result'):
                return data.get('data', {})
    except Exception as e:
        logging.error(f"Error fetching barcode {barcode}: {e}")
    return None

def sync_device(device, supabase: Client):
    barcode = device.get('barcode')
    if not barcode:
        return None

    api_data = fetch_lovespouse_data(barcode)
    if not api_data:
        logging.warning(f"No se encontró data en API para Barcode: {barcode}")
        return False

    # Extraer supported_funcs desde FuncObj
    func_obj = api_data.get('FuncObj', {})
    funcs_enabled = [k for k, v in func_obj.items() if v]
    
    # Mapear datos a la estructura de Supabase
    update_data = {
        'model_name': api_data.get('Title', device.get('model_name')),
        'image_url': api_data.get('Pics', device.get('image_url')),
        'qr_code_url': api_data.get('Qrcode', device.get('qr_code_url')),
        'supported_funcs': '|'.join(funcs_enabled),
        'is_precise_new': api_data.get('IsPrecise') == 1,
        'updated_at': 'now()'
    }

    try:
        # Usar barcode como ID de búsqueda si el ID es problemático, pero aquí tenemos el ID de Supabase
        supabase.table('device_catalog').update(update_data).eq('id', device['id']).execute()
        logging.info(f"Sincronizado exitosamente ID {device['id']} (Barcode: {barcode})")
        return True
    except Exception as e:
        logging.error(f"Error actualizando ID {device['id']}: {e}")
        return False

def main():
    url = os.environ.get("VITE_SUPABASE_URL")
    key = os.environ.get("VITE_SUPABASE_ANON_KEY")
    
    if not url or not key:
        print("X Error: No se encontraron las variables de entorno de Supabase.")
        return

    supabase: Client = create_client(url, key)

    print("I Obteniendo dispositivos de Supabase...")
    try:
        # Obtenemos todos los dispositivos para sincronizar
        response = supabase.table('device_catalog').select('id', 'barcode', 'model_name', 'image_url', 'qr_code_url').execute()
        devices = response.data
    except Exception as e:
        print(f"X Error al consultar Supabase: {e}")
        return

    if not devices:
        print("! No hay dispositivos en el catálogo para sincronizar.")
        return

    print(f"I Sincronizando {len(devices)} dispositivos con LoveSpouse API...")
    
    # Usamos ThreadPoolExecutor para acelerar el proceso
    with ThreadPoolExecutor(max_workers=10) as executor:
        results = list(executor.map(lambda d: sync_device(d, supabase), devices))

    success_count = sum(1 for r in results if r)
    print(f"V Sincronización completada: {success_count}/{len(devices)} exitosos.")
    logging.info(f"Sincronización terminada: {success_count}/{len(devices)} exitosos.")

if __name__ == "__main__":
    main()

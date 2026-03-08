# Versión: 1.4.0
import csv
import json
import logging
import os
import requests
import time
from concurrent.futures import ThreadPoolExecutor

# Configuración de Logging
logging.basicConfig(
    filename='activity.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

API_URL = "https://lovespouse.zlmicro.com/index.php?g=App&m=Diyapp&a=getproductdetail&barcode={}&userid=-1"
INPUT_CSV = "devices-categories.csv"
TMP_DIR = ".tmp"
OUTPUT_CSV = os.path.join(TMP_DIR, "devices-categories-enriched.csv")
OUTPUT_JSON = os.path.join(TMP_DIR, "compatible_devices.json")

# Mapa de traducción de funciones
TRANSLATION_MAP = {
    "经典模式": "Modo Clásico",
    "音乐模式": "Modo Música",
    "摇一摇": "Agitar",
    "互动模式": "Modo Interactivo",
    "划一划": "Deslizar",
    "视频模式": "Modo Video",
    "游戏模式": "Modo Juego",
    "探索模式": "Modo Explorar",
    "加热模式": "Modo Calentamiento",
    "视频": "Video",
    "游戏": "Juego",
    "探索": "Explorar",
    "凯格尔": "Kegel"
}

def translate_name(name):
    return TRANSLATION_MAP.get(name, name)

def ensure_tmp_dir():
    if not os.path.exists(TMP_DIR):
        os.makedirs(TMP_DIR)

def fetch_full_data(row):
    barcode = row['Barcode']
    device_data = {
        "id": int(row['ID']),
        "barcode": barcode,
        "name": row['Nombre'],
        "motorLogic": row['MotorLogic (Single Channel/Dual Channel)'],
        "category": {
            "usageType": row['UsageType (Masculino/Femenino/Universal)'],
            "targetAnatomy": row['TargetAnatomy (Prostata/Clitoris/Vaginal/Anal/Universal)'],
            "stimulationType": row['StimulationType (Vibracion/Succion/Empuje/Calentamiento/Interactivo)']
        }
    }
    
    try:
        url = API_URL.format(barcode)
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data and isinstance(data, dict) and data.get('response', {}).get('result'):
                api = data.get('data', {})
                
                # Campos básicos y técnicos para el CSV
                row['DB_Id'] = api.get('Id', '')
                row['RealTitle'] = api.get('Title', '')
                row['Pics'] = api.get('Pics', '')
                row['CateId'] = api.get('CateId', '')
                row['Qrcode'] = api.get('Qrcode', '')
                
                # Nuevos campos técnicos basados en la UI
                row['Wireless'] = api.get('Wireless', '2.4g').upper()
                row['FactoryId'] = api.get('FactoryId', '')
                row['IsEncrypt'] = 'Seguro' if api.get('IsEncrypt') == 1 else 'No'
                row['IsPrecise'] = '0-255' if api.get('IsPrecise') == 1 else 'Estándar'
                row['BroadcastPrefix'] = api.get('BroadcastPrefix', '')
                row['BleName'] = api.get('BleName', '')
                
                func_obj = api.get('FuncObj', {})
                funcs_enabled = [k for k, v in func_obj.items() if v]
                row['SupportedFuncs'] = '|'.join(funcs_enabled)

                # Traducción de productFuncs
                raw_funcs = api.get('ProductFuncs', [])
                translated_funcs = []
                for f in raw_funcs:
                    translated_funcs.append({
                        "Id": f.get('Id'),
                        "Name": translate_name(f.get('Name', '')),
                        "Code": f.get('Code')
                    })

                # Construcción del objeto JSON completo
                device_data.update({
                    "title": api.get('Title', ''),
                    "pics": api.get('Pics', ''),
                    "qrcode": api.get('Qrcode', ''),
                    "wireless": api.get('Wireless', '2.4g'),
                    "cateId": api.get('CateId', 0),
                    "factoryId": api.get('FactoryId', 0),
                    "funcObj": func_obj,
                    "productFuncs": translated_funcs,
                    "broadcastPrefix": api.get('BroadcastPrefix', ''),
                    "bleName": api.get('BleName', ''),
                    "isEncrypt": api.get('IsEncrypt', 0),
                    "isPrecise": api.get('IsPrecise', 0),
                    "motors": [translate_name(f.get('Name', '')) for f in raw_funcs if f.get('Name')]
                })
                
                logging.info(f"Éxito al obtener data técnica para Barcode: {barcode}")
            else:
                row.update({'DB_Id': '', 'RealTitle': '', 'Pics': '', 'CateId': '', 'Qrcode': '', 'SupportedFuncs': '', 'Wireless': '', 'FactoryId': '', 'IsEncrypt': '', 'IsPrecise': '', 'BroadcastPrefix': '', 'BleName': ''})
        else:
            row.update({'DB_Id': '', 'RealTitle': '', 'Pics': '', 'CateId': '', 'Qrcode': '', 'SupportedFuncs': '', 'Wireless': '', 'FactoryId': '', 'IsEncrypt': '', 'IsPrecise': '', 'BroadcastPrefix': '', 'BleName': ''})
    except Exception as e:
        row.update({'DB_Id': '', 'RealTitle': '', 'Pics': '', 'CateId': '', 'Qrcode': '', 'SupportedFuncs': '', 'Wireless': '', 'FactoryId': '', 'IsEncrypt': '', 'IsPrecise': '', 'BroadcastPrefix': '', 'BleName': ''})
        logging.error(f"Error en {barcode}: {e}")
    
    return row, device_data

def main():
    logging.info("Iniciando sincronización técnica profunda (v1.4.0)...")
    ensure_tmp_dir()
    
    with open(INPUT_CSV, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        # Extendemos campos del CSV con la nueva metadata técnica
        new_fields = ['DB_Id', 'RealTitle', 'Pics', 'CateId', 'Qrcode', 'SupportedFuncs', 'Wireless', 'FactoryId', 'IsEncrypt', 'IsPrecise', 'BroadcastPrefix', 'BleName']
        fieldnames = reader.fieldnames
        for nf in new_fields:
            if nf not in fieldnames:
                fieldnames.append(nf)

    enriched_csv_rows = []
    json_data_list = []
    
    print(f"Sincronizando {len(rows)} productos con LoveSpouse API (Modo Técnico)...")
    with ThreadPoolExecutor(max_workers=10) as executor:
        results = list(executor.map(fetch_full_data, rows))
        
    for csv_row, json_obj in results:
        enriched_csv_rows.append(csv_row)
        json_data_list.append(json_obj)
        
    # Guardar CSV
    with open(OUTPUT_CSV, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(enriched_csv_rows)

    # Guardar JSON
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(json_data_list, f, indent=2, ensure_ascii=False)

    print(f"Catálogo técnico completo generado en {OUTPUT_CSV} y {OUTPUT_JSON}")
    logging.info("Proceso técnico terminado exitosamente.")

if __name__ == "__main__":
    main()

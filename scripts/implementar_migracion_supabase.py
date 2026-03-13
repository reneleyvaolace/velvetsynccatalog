import os
import logging

# Versión: 1.0.0
# Scripts de migración de datos local JSON a Supabase

# Configuración de logs en activity.log
logging.basicConfig(
    filename='activity.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def log_action(message):
    logging.info(message)
    print(message)

def main():
    log_action("Iniciando ejecución de migración Supabase (Fases 3, 5, 6)...")

    # 1. Modificar DeviceCatalog.jsx
    catalog_path = 'src/components/DeviceCatalog.jsx'
    if os.path.exists(catalog_path):
        with open(catalog_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Paso 3.1: Reemplazar imports
        if "import compatibleDevices from '../data/compatible_devices.json';" in content:
            content = content.replace(
                "import compatibleDevices from '../data/compatible_devices.json';",
                "import { supabase } from '../lib/supabase';\nimport { getDeviceImage, getDeviceQR, getDevicePDF } from '../utils/mediaUtils';"
            )
            log_action("Imports actualizados en DeviceCatalog.jsx")
        
        # Paso 3.2 y 3.3: Reemplazar useEffect y añadir helper
        old_effect = """  useEffect(() => {
    setDevices(compatibleDevices);
    setLoading(false);
  }, []);"""
        
        if old_effect in content:
            new_logic = """  // Helper to map data from Supabase to components expected format
  const mapDeviceFromSupabase = (device) => {
    // Parse supported_funcs (comma separated string) to motors array
    const motors = device.supported_funcs ? device.supported_funcs.split(',').map(f => f.trim()) : [];
    
    // Parse motor_logic to funcObj
    const funcObj = {
      CH1: device.motor_logic === 'single' || device.motor_logic === 'dual',
      CH2: device.motor_logic === 'dual'
    };

    return {
      ...device,
      title: device.model_name, // Aliasing for compatibility with JSX if not updated everywhere
      pics: getDeviceImage(device.id),
      qrcode: getDeviceQR(device.id),
      motors: motors,
      funcObj: funcObj,
      isPrecise: device.is_precise_new ? 1 : 0,
      barcode: device.id.toString(),
      manualUrl: getDevicePDF(device.id),
      techSheetUrl: getDevicePDF(device.id),
      // Flatten category for simpler access in filters
      usage_type: device.usage_type,
      target_anatomy: device.target_anatomy,
      stimulation_type: device.stimulation_type
    };
  };

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const { data, error } = await supabase
          .from('device_catalog')
          .select('*')
          .order('id', { ascending: true });
        
        if (error) throw error;
        if (data) {
          const mappedData = data.map(mapDeviceFromSupabase);
          setDevices(mappedData);
        }
      } catch (err) {
        console.error('Error fetching from Supabase:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDevices();
  }, []);"""
            content = content.replace(old_effect, new_logic)
            log_action("useEffect y mapDeviceFromSupabase implementados")

        # Paso 5.1: Adaptar filtros a campos de Supabase
        # Actualizamos la lógica de filtrado en filteredDevices useMemo
        content = content.replace(
            "device.category && device.category.usageType === selectedUsageType",
            "device.usage_type === selectedUsageType"
        )
        content = content.replace(
            "device.category && device.category.targetAnatomy === selectedAnatomy",
            "device.target_anatomy === selectedAnatomy"
        )
        content = content.replace(
            "device.category && device.category.stimulationType === selectedStimulation",
            "device.stimulation_type === selectedStimulation"
        )
        log_action("Lógica de filtros actualizada")

        # Paso 5.2: Actualizar opciones de selects en el JSX
        # Usage Type
        content = content.replace('<option value="Masculino">Masculino</option>', '<option value="external">Externo</option>')
        content = content.replace('<option value="Femenino">Femenino</option>', '<option value="internal">Interno</option>')
        content = content.replace('<option value="Universal">Universal</option>', '<option value="universal">Universal</option>')
        
        # Anatomy options
        content = content.replace('<option value="Próstata">Próstata</option>', '<option value="prostate">Próstata</option>')
        content = content.replace('<option value="Clítoris">Clítoris</option>', '<option value="clitoral">Clítoris</option>')
        content = content.replace('<option value="Vaginal">Vaginal</option>', '<option value="vaginal">Vaginal</option>')
        content = content.replace('<option value="Anal">Anal</option>', '<option value="anal">Anal</option>')
        
        # Stimulation options
        content = content.replace('<option value="Vibración">Vibración</option>', '<option value="vibration">Vibración</option>')
        content = content.replace('<option value="Succión">Succión</option>', '<option value="suction">Succión</option>')
        content = content.replace('<option value="Empuje">Empuje</option>', '<option value="thrust">Empuje</option>')
        content = content.replace('<option value="Calentamiento">Calentamiento</option>', '<option value="heating">Calentamiento</option>')
        content = content.replace('<option value="Interactivo">Interactivo</option>', '<option value="interactive">Interactivo</option>')
        log_action("Opciones de select (Fase 5.2) actualizadas")

        with open(catalog_path, 'w', encoding='utf-8') as f:
            f.write(content)
        log_action(f"Archivo actualizado: {catalog_path}")

    # Paso 6.1: Eliminar archivos innecesarios
    json_path = 'src/data/compatible_devices.json'
    if os.path.exists(json_path):
        os.remove(json_path)
        log_action(f"Archivo eliminado: {json_path}")
    
    # Paso 6.2: Actualizar .gitignore
    gitignore_path = '.gitignore'
    if os.path.exists(gitignore_path):
        with open(gitignore_path, 'r') as f:
            lines = f.readlines()
        if not any('.env.local' in line for line in lines):
            with open(gitignore_path, 'a') as f:
                f.write('\n# Local environment variables\n.env.local\n')
            log_action("Actualizado .gitignore para incluir .env.local")

    log_action("Migración completada con éxito.")

if __name__ == "__main__":
    main()

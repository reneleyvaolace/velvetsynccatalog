/**
 * Script para descargar dispositivos desde Supabase y actualizar el archivo local
 * 
 * Uso: node download-supabase-devices.js <SUPABASE_URL> <SUPABASE_KEY>
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const supabaseUrl = process.argv[2];
const supabaseKey = process.argv[3];

if (!supabaseUrl || !supabaseKey) {
  console.log('Uso: node download-supabase-devices.js <SUPABASE_URL> <SUPABASE_KEY>');
  console.log('Ejemplo: node download-supabase-devices.js https://xxx.supabase.co eyJhbG...');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function downloadDevices() {
  console.log('📥 Descargando dispositivos desde Supabase...\n');

  // Consultar todos los dispositivos
  const { data, error } = await supabase
    .from('device_catalog')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log(`✅ ${data.length} dispositivos descargados\n`);

  // Transformar datos al formato esperado por la aplicación
  const formattedDevices = data.map(device => {
    // Parsear supported_funcs
    const motors = device.supported_funcs
      ? device.supported_funcs.split(/[|,;]/).map(f => f.trim()).filter(Boolean)
      : [];

    // Determinar motor logic
    const motorLogic = device.motor_logic === 'dual' 
      ? 'Dual Channel (0xD + 0xA)' 
      : 'Single Channel';

    // Determinar categoría
    const category = {
      usageType: device.usage_type ? String(device.usage_type).charAt(0).toUpperCase() + String(device.usage_type).slice(1) : 'Universal',
      targetAnatomy: device.target_anatomy ? String(device.target_anatomy).charAt(0).toUpperCase() + String(device.target_anatomy).slice(1) : 'Universal',
      stimulationType: device.stimulation_type || 'Vibración'
    };

    // FuncObj desde motors
    const funcObj = {};
    motors.forEach(m => {
      const key = m.toLowerCase().replace(/\s+/g, '_');
      funcObj[key] = true;
    });

    // URLs de imágenes
    const pics = `https://image.zlmicro.com/images/product/${device.id}.png`;
    const qrcode = `https://image.zlmicro.com/images/product/qrcode/${device.id}.png`;

    return {
      id: device.id,
      barcode: device.barcode || device.id.toString(),
      name: device.model_name,
      motorLogic: motorLogic,
      category: category,
      title: device.model_name,
      pics: pics,
      qrcode: qrcode,
      wireless: device.wireless || 'bluetooth',
      cateId: device.category_id || 10,
      factoryId: device.factory_id || null,
      funcObj: funcObj,
      productFuncs: [], // Se puede poblar si existe otra tabla
      broadcastPrefix: '',
      bleName: '',
      isEncrypt: device.is_encrypt !== undefined ? device.is_encrypt : 0,
      isPrecise: device.is_precise_new ? 1 : 0,
      motors: motors,
      // Campos adicionales
      usage_type: device.usage_type,
      target_anatomy: device.target_anatomy,
      stimulation_type: device.stimulation_type,
      motor_logic: device.motor_logic,
      supported_funcs: device.supported_funcs,
      updated_at: device.updated_at
    };
  });

  // Guardar archivo
  const outputPath = '.tmp/compatible_devices.json';
  writeFileSync(outputPath, JSON.stringify(formattedDevices, null, 2), 'utf-8');

  console.log('📁 Archivo guardado:', outputPath);
  console.log('📊 Estadísticas:');
  console.log(`   Total: ${formattedDevices.length} dispositivos`);
  console.log(`   ID mínimo: ${Math.min(...formattedDevices.map(d => d.id))}`);
  console.log(`   ID máximo: ${Math.max(...formattedDevices.map(d => d.id))}`);

  // Contar por tipo de uso
  const byUsage = {};
  formattedDevices.forEach(d => {
    const type = d.usage_type || 'unknown';
    byUsage[type] = (byUsage[type] || 0) + 1;
  });
  console.log('\n📈 Por tipo de uso:');
  Object.entries(byUsage).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}`);
  });

  console.log('\n✅ ¡Descarga completada!');
}

downloadDevices().catch(console.error);

/**
 * Script para sincronizar Supabase con el archivo local compatible_devices.json
 * 
 * ADVERTENCIA: Esto eliminará todos los dispositivos actuales en Supabase
 * y los reemplazará con los del archivo local.
 * 
 * Uso: node sync-supabase-devices.js <SUPABASE_URL> <SUPABASE_KEY>
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = process.argv[2];
const supabaseKey = process.argv[3];

if (!supabaseUrl || !supabaseKey) {
  console.log('Uso: node sync-supabase-devices.js <SUPABASE_URL> <SUPABASE_KEY>');
  console.log('Ejemplo: node sync-supabase-devices.js https://xxx.supabase.co eyJhbG...');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncDevices() {
  console.log('🔄 Iniciando sincronización...\n');

  // Leer archivo local
  console.log('📁 Leyendo archivo local...');
  const localData = JSON.parse(readFileSync('.tmp/compatible_devices.json', 'utf-8'));
  console.log(`   ${localData.length} dispositivos encontrados\n`);

  // 1. Eliminar todos los dispositivos actuales en Supabase
  console.log('🗑️  Eliminando dispositivos actuales en Supabase...');
  const { error: deleteError } = await supabase
    .from('device_catalog')
    .delete()
    .neq('id', 0); // Elimina todo (ningún id es != 0)

  if (deleteError) {
    console.error('❌ Error al eliminar:', deleteError.message);
    return;
  }
  console.log('   ✅ Eliminados\n');

  // 2. Preparar datos para insertar
  console.log('📦 Preparando datos para insertar...');
  const devicesToInsert = localData.map(device => ({
    id: device.id,
    model_name: device.name || device.title,
    barcode: device.barcode || device.id.toString(),
    wireless: device.wireless || 'bluetooth',
    motor_logic: device.motorLogic?.includes('Dual') ? 'dual' : 'single',
    usage_type: device.category?.usageType?.toLowerCase() || 'universal',
    target_anatomy: device.category?.targetAnatomy?.toLowerCase() || 'universal',
    stimulation_type: device.category?.stimulationType?.toLowerCase() || 'vibration',
    is_precise_new: device.isPrecise === 1,
    is_encrypt: device.isEncrypt !== undefined ? device.isEncrypt : 0,
    factory_id: device.factoryId || null,
    supported_funcs: Array.isArray(device.motors) ? device.motors.join('|') : '',
    updated_at: new Date().toISOString()
  }));

  console.log(`   ${devicesToInsert.length} dispositivos preparados\n`);

  // 3. Insertar en lotes de 100
  console.log('📥 Insertando en Supabase (lotes de 100)...');
  const batchSize = 100;
  let inserted = 0;

  for (let i = 0; i < devicesToInsert.length; i += batchSize) {
    const batch = devicesToInsert.slice(i, i + batchSize);
    const { error } = await supabase
      .from('device_catalog')
      .insert(batch);

    if (error) {
      console.error(`❌ Error en lote ${i / batchSize}:`, error.message);
      continue;
    }

    inserted += batch.length;
    console.log(`   ✓ Lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(devicesToInsert.length / batchSize)} - ${inserted}/${devicesToInsert.length}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ SINCRONIZACIÓN COMPLETADA`);
  console.log(`   Dispositivos insertados: ${inserted}`);
  console.log('='.repeat(60));

  // 4. Verificar
  console.log('\n🔍 Verificando...');
  const { data, error } = await supabase
    .from('device_catalog')
    .select('id')
    .order('id', { ascending: true });

  if (error) {
    console.error('❌ Error al verificar:', error.message);
    return;
  }

  console.log(`   Supabase ahora tiene ${data.length} dispositivos`);
  
  const localIds = new Set(localData.map(d => d.id));
  const supabaseIds = new Set(data.map(d => d.id));
  const coincidentes = [...localIds].filter(id => supabaseIds.has(id)).length;
  
  if (coincidentes === localData.length) {
    console.log('   ✅ ¡Todos los dispositivos están sincronizados!');
  } else {
    console.log(`   ⚠️  Coincidentes: ${coincidentes}/${localData.length}`);
  }
}

syncDevices().catch(console.error);

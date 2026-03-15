/**
 * Script para verificar la cantidad de dispositivos en Supabase
 * y compararla con el archivo local
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
import { config } from 'dotenv';
const envPath = join(__dirname, '.env');
config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: No se encontraron las variables de entorno de Supabase');
  console.error('Asegúrate de tener un archivo .env con:');
  console.error('  VITE_SUPABASE_URL=...');
  console.error('  VITE_SUPABASE_ANON_KEY=...');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyDevices() {
  console.log('🔍 Verificando dispositivos...\n');

  // 1. Consultar Supabase
  console.log('📊 Consultando Supabase...');
  const { data: supabaseData, error } = await supabase
    .from('device_catalog')
    .select('id, model_name')
    .order('id', { ascending: true });

  if (error) {
    console.error('❌ Error al consultar Supabase:', error.message);
    return;
  }

  const supabaseCount = supabaseData?.length || 0;
  console.log(`✅ Dispositivos en Supabase: ${supabaseCount}`);

  // 2. Leer archivo local
  console.log('\n📁 Leyendo archivo local...');
  const localPath = join(__dirname, '.tmp', 'compatible_devices.json');
  const localData = JSON.parse(readFileSync(localPath, 'utf-8'));
  const localCount = localData.length;
  console.log(`✅ Dispositivos en archivo local: ${localCount}`);

  // 3. Comparar IDs
  console.log('\n🔬 Comparando IDs...');
  const supabaseIds = new Set(supabaseData.map(d => d.id));
  const localIds = new Set(localData.map(d => d.id));

  const onlyInSupabase = [...supabaseIds].filter(id => !localIds.has(id));
  const onlyInLocal = [...localIds].filter(id => !supabaseIds.has(id));

  console.log(`\n📈 Resultados:`);
  console.log(`   IDs en Supabase: ${supabaseIds.size}`);
  console.log(`   IDs en local: ${localIds.size}`);
  console.log(`   Coincidentes: ${[...supabaseIds].filter(id => localIds.has(id)).length}`);

  if (onlyInSupabase.length > 0) {
    console.log(`\n⚠️  Solo en Supabase (${onlyInSupabase.length}):`);
    console.log(`   ${onlyInSupabase.sort((a, b) => a - b).join(', ')}`);
  }

  if (onlyInLocal.length > 0) {
    console.log(`\n⚠️  Solo en local (${onlyInLocal.length}):`);
    console.log(`   ${onlyInLocal.sort((a, b) => a - b).join(', ')}`);
  }

  // 4. Conclusión
  console.log('\n' + '='.repeat(50));
  if (supabaseCount === localCount && onlyInSupabase.length === 0 && onlyInLocal.length === 0) {
    console.log('✅ ¡LOS DATOS ESTÁN SYNCRONIZADOS!');
  } else {
    console.log('⚠️  HAY DIFERENCIAS ENTRE SUPABASE Y EL ARCHIVO LOCAL');
  }
  console.log('='.repeat(50));

  // 5. Mostrar últimos dispositivos agregados
  console.log('\n📋 Últimos 10 dispositivos en Supabase:');
  supabaseData.slice(-10).forEach(d => {
    console.log(`   ID ${d.id}: ${d.model_name}`);
  });
}

verifyDevices().catch(console.error);

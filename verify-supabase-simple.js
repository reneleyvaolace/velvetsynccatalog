/**
 * Script para verificar dispositivos en Supabase
 * Uso: node verify-supabase-simple.js TU_SUPABASE_URL TU_SUPABASE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = process.argv[2];
const supabaseKey = process.argv[3];

if (!supabaseUrl || !supabaseKey) {
  console.log('Uso: node verify-supabase-simple.js <SUPABASE_URL> <SUPABASE_KEY>');
  console.log('Ejemplo: node verify-supabase-simple.js https://xxx.supabase.co eyJhbG...');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  console.log('🔍 Consultando Supabase...\n');

  const { data, error } = await supabase
    .from('device_catalog')
    .select('id, model_name')
    .order('id', { ascending: true });

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  const supabaseCount = data.length;
  const supabaseIds = new Set(data.map(d => d.id));

  // Leer local
  const localData = JSON.parse(readFileSync('.tmp/compatible_devices.json', 'utf-8'));
  const localCount = localData.length;
  const localIds = new Set(localData.map(d => d.id));

  console.log(`📊 Supabase: ${supabaseCount} dispositivos`);
  console.log(`📁 Local:    ${localCount} dispositivos`);
  console.log(`✅ Coincidentes: ${[...supabaseIds].filter(id => localIds.has(id)).length}`);

  const onlyInSupabase = [...supabaseIds].filter(id => !localIds.has(id));
  const onlyInLocal = [...localIds].filter(id => !supabaseIds.has(id));

  if (onlyInSupabase.length > 0) {
    console.log(`\n⚠️  Solo en Supabase (${onlyInSupabase.length}): ${onlyInSupabase.sort((a,b)=>a-b).join(', ')}`);
  }
  if (onlyInLocal.length > 0) {
    console.log(`\n⚠️  Solo en local (${onlyInLocal.length}): ${onlyInLocal.sort((a,b)=>a-b).join(', ')}`);
  }

  console.log('\n' + '='.repeat(50));
  if (supabaseCount === localCount && onlyInSupabase.length === 0) {
    console.log('✅ ¡DATOS SYNCRONIZADOS!');
  } else {
    console.log('⚠️  HAY DIFERENCIAS');
  }
  console.log('='.repeat(50));
}

verify();

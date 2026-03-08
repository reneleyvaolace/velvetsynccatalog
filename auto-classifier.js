/**
 * Auto-Classifier Script for Velvet Sync
 * Clasifica automáticamente los dispositivos basado en patrones
 * 
 * Uso: node auto-classifier.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JSON_FILE = path.join(__dirname, 'src', 'data', 'compatible_devices.json');

// Patrones de clasificación por nombre
const namePatterns = {
  masculino: [
    'masturbador', 'masturbator', 'copa', 'cup', 'anillo', 'ring', 'próstata', 
    'prostate', 'masculino', 'men', 'hombre', 'boy', 'caballero', 'knight'
  ],
  femenino: [
    'vibrador', 'vibrator', 'varita', 'wand', 'huevo', 'egg', 'clítoris',
    'clitoris', 'vaginal', 'femenino', 'women', 'mujer', 'girl', 'lady'
  ],
  anal: [
    'anal', 'plug', 'tapón', 'buttplug', 'trasero', 'rectal'
  ]
};

// Patrones de clasificación por funciones
const functionPatterns = {
  masculino: ['kegel', 'prostate', 'classic'],
  femenino: ['music', 'heating', 'ai_voice'],
  anal: ['explore', 'finger']
};

// Clasificación por CateId (si está disponible)
const categoryById = {
  10: { usageType: 'Universal', targetAnatomy: 'Anal', stimulationType: 'Vibración' },
  13: { usageType: 'Universal', targetAnatomy: 'Anal', stimulationType: 'Vibración' }
};

function classifyDevice(device) {
  const title = (device.title || '').toLowerCase();
  const barcode = (device.barcode || '').toLowerCase();
  const functions = (device.productFuncs || []).map(f => (f.Code || '').toLowerCase());
  const cateId = device.cateId;

  let category = {
    usageType: 'Universal',
    targetAnatomy: 'Universal',
    stimulationType: 'Vibración'
  };

  // 1. Intentar clasificar por CateId
  if (cateId && categoryById[cateId]) {
    return categoryById[cateId];
  }

  // 2. Clasificar por patrones en el nombre
  let usageScore = { masculino: 0, femenino: 0 };
  
  namePatterns.masculino.forEach(pattern => {
    if (title.includes(pattern) || barcode.includes(pattern)) usageScore.masculino += 2;
  });
  
  namePatterns.femenino.forEach(pattern => {
    if (title.includes(pattern) || barcode.includes(pattern)) usageScore.femenino += 2;
  });

  // 3. Clasificar por funciones
  functionPatterns.masculino.forEach(pattern => {
    if (functions.includes(pattern)) usageScore.masculino += 1;
  });
  
  functionPatterns.femenino.forEach(pattern => {
    if (functions.includes(pattern)) usageScore.femenino += 1;
  });

  // Determinar uso basado en scores
  if (usageScore.masculino > usageScore.femenino && usageScore.masculino > 0) {
    category.usageType = 'Masculino';
  } else if (usageScore.femenino > usageScore.masculino && usageScore.femenino > 0) {
    category.usageType = 'Femenino';
  }

  // 4. Clasificar anatomía
  let hasAnalPattern = false;
  namePatterns.anal.forEach(pattern => {
    if (title.includes(pattern) || barcode.includes(pattern)) hasAnalPattern = true;
  });
  
  functionPatterns.anal.forEach(pattern => {
    if (functions.includes(pattern)) hasAnalPattern = true;
  });

  if (hasAnalPattern) {
    category.targetAnatomy = 'Anal';
  } else if (category.usageType === 'Masculino') {
    category.targetAnatomy = 'Próstata';
  } else if (category.usageType === 'Femenino') {
    category.targetAnatomy = 'Clítoris';
  }

  // 5. Clasificar estimulación
  if (functions.includes('music') || functions.includes('video') || functions.includes('game')) {
    category.stimulationType = 'Interactivo';
  } else if (functions.includes('heating')) {
    category.stimulationType = 'Calentamiento';
  } else if (functions.includes('finger')) {
    category.stimulationType = 'Succión';
  }

  return category;
}

// Main execution
console.log('🔬 Velvet Sync Auto-Classifier\n');
console.log('📂 Leyendo catálogo...');

const devices = JSON.parse(fs.readFileSync(JSON_FILE, 'utf-8'));

console.log(`📦 Total dispositivos: ${devices.length}\n`);

let stats = {
  masculino: 0,
  femenino: 0,
  universal: 0,
  anal: 0,
  prostata: 0,
  clitoris: 0,
  vaginal: 0
};

// Clasificar cada dispositivo
devices.forEach(device => {
  const category = classifyDevice(device);
  device.category = category;
  
  // Update stats
  stats[category.usageType.toLowerCase()]++;
  stats[category.targetAnatomy.toLowerCase().replace('í', 'i')]++;
});

console.log('📊 Estadísticas de Clasificación:\n');
console.log('Uso:');
console.log(`  Masculino:  ${stats.masculino}`);
console.log(`  Femenino:   ${stats.femenino}`);
console.log(`  Universal:  ${stats.universal}`);
console.log('\nAnatomía:');
console.log(`  Próstata:   ${stats.prostata}`);
console.log(`  Clítoris:   ${stats.clitoris}`);
console.log(`  Vaginal:    ${stats.vaginal}`);
console.log(`  Anal:       ${stats.anal}`);
console.log('');

// Guardar resultado
console.log('💾 Guardando catálogo clasificado...');
fs.writeFileSync(JSON_FILE, JSON.stringify(devices, null, 2), 'utf-8');

console.log('✅ ¡Clasificación completada!\n');
console.log('📝 Nota: Esta es una clasificación automática. Revisa y ajusta manualmente en el admin si es necesario.');
console.log('🌐 Admin: http://localhost:5173/admin\n');

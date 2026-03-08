/**
 * Export/Import CSV for Velvet Sync
 * Permite exportar a CSV, editar en Excel, y reimportar
 * 
 * Uso: 
 *   node csv-exporter.js export   - Exporta a CSV
 *   node csv-exporter.js import   - Importa desde CSV
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JSON_FILE = path.join(__dirname, 'src', 'data', 'compatible_devices.json');
const CSV_FILE = path.join(__dirname, 'devices-categories.csv');

// Export JSON to CSV
function exportToCSV() {
  console.log('📤 Exportando a CSV...\n');

  const devices = JSON.parse(fs.readFileSync(JSON_FILE, 'utf-8'));

  // CSV Header with clear column names
  let csv = 'ID,Barcode,Nombre,UsageType (Masculino/Femenino/Universal),TargetAnatomy (Prostata/Clitoris/Vaginal/Anal/Universal),StimulationType (Vibracion/Succion/Empuje/Calentamiento/Interactivo),MotorLogic (Single Channel/Dual Channel)\n';

  devices.forEach(device => {
    // Use barcode if title is empty or generic
    let displayName = device.title || '';
    if (!displayName || displayName.trim() === '' || displayName === 'Unknown Device') {
      displayName = `Dispositivo ${device.barcode}`;
    }
    displayName = `"${displayName.replace(/"/g, '""')}"`;

    const usageType = device.category?.usageType || 'Universal';
    const targetAnatomy = device.category?.targetAnatomy || 'Universal';
    const stimulationType = device.category?.stimulationType || 'Vibración';
    const motorLogic = device.motorLogic || 'Single Channel';

    csv += `${device.id},${device.barcode},${displayName},${usageType},${targetAnatomy},${stimulationType},${motorLogic}\n`;
  });

  fs.writeFileSync(CSV_FILE, csv, 'utf-8');

  console.log(`✅ Exportado: ${CSV_FILE}`);
  console.log(`📦 Total dispositivos: ${devices.length}`);
  console.log('\n📝 Instrucciones:');
  console.log('1. Abre el archivo CSV en Excel');
  console.log('2. Edita las columnas:');
  console.log('   - UsageType: Masculino | Femenino | Universal');
  console.log('   - TargetAnatomy: Prostata | Clitoris | Vaginal | Anal | Universal');
  console.log('   - StimulationType: Vibracion | Succion | Empuje | Calentamiento | Interactivo');
  console.log('3. Guarda el CSV (no cambies el nombre de las columnas)');
  console.log('4. Ejecuta: node csv-exporter.js import\n');
}

// Import CSV to JSON
function importFromCSV() {
  console.log('📥 Importando desde CSV...\n');
  
  if (!fs.existsSync(CSV_FILE)) {
    console.log('❌ Error: No se encontró el archivo CSV');
    console.log(`📁 Ruta esperada: ${CSV_FILE}`);
    console.log('\n💡 Primero ejecuta: node csv-exporter.js export\n');
    return;
  }
  
  const devices = JSON.parse(fs.readFileSync(JSON_FILE, 'utf-8'));
  const csvContent = fs.readFileSync(CSV_FILE, 'utf-8');
  const lines = csvContent.split('\n').slice(1); // Skip header
  
  let updatedCount = 0;
  
  lines.forEach(line => {
    if (!line.trim()) return;
    
    // Parse CSV line (handle quoted fields)
    const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
    if (!matches) return;
    
    // Simple CSV parse (improve for complex cases)
    const parts = line.split(',').map(p => p.replace(/^"|"$/g, '').replace(/""/g, '"'));
    
    if (parts.length < 7) return;
    
    const [id, barcode, title, usageType, targetAnatomy, stimulationType, motorLogic] = parts;
    const deviceId = parseInt(id);
    
    const device = devices.find(d => d.id === deviceId);
    if (device) {
      device.category = {
        usageType: usageType || 'Universal',
        targetAnatomy: targetAnatomy || 'Universal',
        stimulationType: stimulationType || 'Vibración'
      };
      device.motorLogic = motorLogic || 'Single Channel';
      updatedCount++;
    }
  });
  
  fs.writeFileSync(JSON_FILE, JSON.stringify(devices, null, 2), 'utf-8');
  
  console.log(`✅ Importado: ${updatedCount} dispositivos actualizados`);
  console.log(`📦 Total dispositivos: ${devices.length}`);
  console.log('\n🌐 Ahora puedes ver los cambios en: http://localhost:5173/admin\n');
}

// Main
const command = process.argv[2];

if (command === 'export') {
  exportToCSV();
} else if (command === 'import') {
  importFromCSV();
} else {
  console.log('🔬 Velvet Sync CSV Exporter/Importer\n');
  console.log('Uso:');
  console.log('  node csv-exporter.js export   - Exporta catálogo a CSV');
  console.log('  node csv-exporter.js import   - Importa categorías desde CSV\n');
  console.log('Flujo recomendado:');
  console.log('  1. node csv-exporter.js export');
  console.log('  2. Abre devices-categories.csv en Excel');
  console.log('  3. Edita las categorías');
  console.log('  4. Guarda el CSV');
  console.log('  5. node csv-exporter.js import\n');
}

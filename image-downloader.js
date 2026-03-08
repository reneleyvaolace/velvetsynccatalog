/**
 * Image & QR Downloader for Velvet Sync
 * Descarga imágenes y QRs localmente, verifica existencia y genera reporte
 * 
 * Uso: node image-downloader.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JSON_FILE = path.join(__dirname, 'src', 'data', 'compatible_devices.json');
const DEVICES_DIR = path.join(__dirname, 'public', 'images', 'devices');
const QRCODES_DIR = path.join(__dirname, 'public', 'qrcodes');
const REPORT_FILE = path.join(__dirname, 'image-download-report.json');

const downloadFile = promisify((url, dest, callback) => {
  const file = fs.createWriteStream(dest);
  
  https.get(url, (response) => {
    if (response.statusCode === 200) {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        callback(null, true);
      });
    } else {
      file.close();
      callback(null, false);
    }
  }).on('error', (err) => {
    fs.unlink(dest, () => {});
    callback(null, false);
  });
});

async function downloadImages() {
  console.log('🖼️  Velvet Sync Image Downloader\n');
  console.log('📂 Leyendo catálogo...');
  
  const devices = JSON.parse(fs.readFileSync(JSON_FILE, 'utf-8'));
  console.log(`📦 Total dispositivos: ${devices.length}\n`);
  
  const report = {
    timestamp: new Date().toISOString(),
    total: devices.length,
    images: { downloaded: 0, failed: 0, missing: 0 },
    qrcodes: { downloaded: 0, failed: 0, missing: 0 },
    devices: []
  };
  
  let processed = 0;
  
  for (const device of devices) {
    processed++;
    const progress = `[${processed}/${devices.length}]`;
    
    const deviceReport = {
      id: device.id,
      barcode: device.barcode,
      title: device.title,
      image: { status: 'missing', localPath: null },
      qrcode: { status: 'missing', localPath: null }
    };
    
    // Download product image
    if (device.pics && device.pics.startsWith('http')) {
      const imageName = `device-${device.id}.png`;
      const imagePath = path.join(DEVICES_DIR, imageName);
      
      if (!fs.existsSync(imagePath)) {
        process.stdout.write(`${progress} 📷 Descargando imagen ID ${device.id}... `);
        const success = await downloadFile(device.pics, imagePath);
        
        if (success) {
          device.pics = `/images/devices/${imageName}`;
          deviceReport.image = { status: 'downloaded', localPath: `/images/devices/${imageName}` };
          report.images.downloaded++;
          console.log('✅');
        } else {
          deviceReport.image = { status: 'failed', localPath: null };
          report.images.failed++;
          console.log('❌');
        }
      } else {
        device.pics = `/images/devices/${imageName}`;
        deviceReport.image = { status: 'exists', localPath: `/images/devices/${imageName}` };
        console.log(`${progress} 📷 Imagen ya existe`);
      }
    } else {
      deviceReport.image = { status: 'missing', localPath: null };
      report.images.missing++;
      console.log(`${progress} ⚠️  Sin URL de imagen`);
    }
    
    // Download QR code
    if (device.qrcode && device.qrcode.startsWith('http')) {
      const qrName = `qr-${device.id}.png`;
      const qrPath = path.join(QRCODES_DIR, qrName);
      
      if (!fs.existsSync(qrPath)) {
        process.stdout.write(`${progress} 📱 Descargando QR ID ${device.id}... `);
        const success = await downloadFile(device.qrcode, qrPath);
        
        if (success) {
          device.qrcode = `/qrcodes/${qrName}`;
          deviceReport.qrcode = { status: 'downloaded', localPath: `/qrcodes/${qrName}` };
          report.qrcodes.downloaded++;
          console.log('✅');
        } else {
          deviceReport.qrcode = { status: 'failed', localPath: null };
          report.qrcodes.failed++;
          console.log('❌');
        }
      } else {
        device.qrcode = `/qrcodes/${qrName}`;
        deviceReport.qrcode = { status: 'exists', localPath: `/qrcodes/${qrName}` };
        console.log(`${progress} 📱 QR ya existe`);
      }
    } else {
      deviceReport.qrcode = { status: 'missing', localPath: null };
      report.qrcodes.missing++;
      console.log(`${progress} ⚠️  Sin URL de QR`);
    }
    
    // Add manual/tech sheet links (remote URLs based on ID)
    device.manualUrl = `https://lovespouse.zlmicro.com/manuals/${device.id}.pdf`;
    device.techSheetUrl = `https://lovespouse.zlmicro.com/specs/${device.id}.pdf`;
    
    report.devices.push(deviceReport);
  }
  
  // Save updated JSON
  console.log('\n💾 Guardando catálogo actualizado...');
  fs.writeFileSync(JSON_FILE, JSON.stringify(devices, null, 2), 'utf-8');
  
  // Save report
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2), 'utf-8');
  
  // Print summary
  console.log('\n📊 RESUMEN:\n');
  console.log('Imágenes:');
  console.log(`  ✅ Descargadas: ${report.images.downloaded}`);
  console.log(`  ❌ Fallidas:    ${report.images.failed}`);
  console.log(`  ⚠️  Sin URL:     ${report.images.missing}`);
  console.log('\nQR Codes:');
  console.log(`  ✅ Descargados: ${report.qrcodes.downloaded}`);
  console.log(`  ❌ Fallidos:    ${report.qrcodes.failed}`);
  console.log(`  ⚠️  Sin URL:     ${report.qrcodes.missing}`);
  
  console.log('\n📁 Archivos generados:');
  console.log(`  - ${REPORT_FILE}`);
  console.log(`  - ${JSON_FILE}`);
  
  console.log('\n🌐 URLs remotas agregadas:');
  console.log('  - manualUrl: https://lovespouse.zlmicro.com/manuals/{ID}.pdf');
  console.log('  - techSheetUrl: https://lovespouse.zlmicro.com/specs/{ID}.pdf');
  
  console.log('\n✅ ¡Proceso completado!\n');
}

// Run
downloadImages().catch(console.error);

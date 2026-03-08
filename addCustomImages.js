/**
 * Script to add custom images to compatible_devices.json
 * Reads from src/config/customImages.js and updates the JSON file
 * 
 * Usage: node addCustomImages.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { customImages } from './src/config/customImages.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JSON_FILE = path.join(__dirname, 'src', 'data', 'compatible_devices.json');

console.log('Adding custom images to devices...\n');

// Read the JSON file
const devices = JSON.parse(fs.readFileSync(JSON_FILE, 'utf-8'));

let updatedCount = 0;

// Update devices with custom images
devices.forEach(device => {
  const customImage = customImages[device.id];
  
  if (customImage && (!device.pics || device.pics === '')) {
    device.pics = customImage;
    updatedCount++;
    console.log(`✓ Updated device ${device.id} (${device.title}) with custom image`);
  }
});

// Save the updated JSON
fs.writeFileSync(JSON_FILE, JSON.stringify(devices, null, 2), 'utf-8');

console.log(`\n✅ Updated ${updatedCount} devices with custom images.`);
console.log(`📁 File saved: ${JSON_FILE}`);

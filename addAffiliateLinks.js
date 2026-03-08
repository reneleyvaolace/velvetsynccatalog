/**
 * Script to add affiliate links to compatible_devices.json
 * Reads from src/config/affiliateLinks.js and updates the JSON file
 * 
 * Usage: node addAffiliateLinks.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { affiliateLinks } from './src/config/affiliateLinks.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JSON_FILE = path.join(__dirname, 'src', 'data', 'compatible_devices.json');

console.log('Adding affiliate links to devices...\n');

// Read the JSON file
const devices = JSON.parse(fs.readFileSync(JSON_FILE, 'utf-8'));

let updatedCount = 0;

// Update devices with affiliate links
devices.forEach(device => {
  const links = affiliateLinks[device.id];
  
  if (links) {
    device.amazonUrl = links.amazonUrl || '';
    device.mercadoLibreUrl = links.mercadoLibreUrl || '';
    updatedCount++;
    console.log(`✓ Updated device ${device.id} (${device.title})`);
  }
});

// Save the updated JSON
fs.writeFileSync(JSON_FILE, JSON.stringify(devices, null, 2), 'utf-8');

console.log(`\n✅ Updated ${updatedCount} devices with affiliate links.`);
console.log(`📁 File saved: ${JSON_FILE}`);

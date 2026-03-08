/**
 * Metadata Harvester Utility
 * Fetches device metadata from manufacturer API and saves compatible devices to JSON
 *
 * Usage: node metadataHarvester.js [startId] [endId]
 * Example: node metadataHarvester.js 8100 8160
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = 'https://lovespouse.zlmicro.com/index.php?g=App&m=Diyapp&a=getproductdetail&barcode={ID}&userid=-1';
const OUTPUT_FILE = path.join(__dirname, 'src', 'data', 'compatible_devices.json');

/**
 * Fetch device metadata from manufacturer API
 * @param {number} deviceId - The device ID to fetch
 * @returns {Promise<object|null>} - Device data or null if not compatible
 */
async function fetchDeviceMetadata(deviceId) {
  const url = API_URL.replace('{ID}', deviceId);
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();

    // API response structure: { data: {...}, response: {...} }
    const deviceData = data.data || data;

    // Check if device has no encryption (IsEncrypt: 0)
    if (deviceData.IsEncrypt !== 0) {
      return null;
    }

    // Skip devices with no valid data (empty Title, DeviceTitle, and BarCode)
    const hasValidData = deviceData.Title || deviceData.DeviceTitle || deviceData.BarCode;
    if (!hasValidData) {
      return null;
    }

    // Extract relevant information
    const rawTitle = deviceData.Title || deviceData.DeviceTitle || '';
    const deviceInfo = {
      id: deviceId,
      title: rawTitle ? translateToSpanish(rawTitle) : 'Unknown Device',
      name: deviceData.Name || '',
      barcode: deviceData.BarCode || deviceId.toString(),
      pics: Array.isArray(deviceData.Pics) ? deviceData.Pics[0] : (deviceData.Pics || ''),
      qrcode: deviceData.Qrcode || '',
      wireless: deviceData.Wireless || '',
      cateId: deviceData.CateId || 0,
      factoryId: deviceData.FactoryId || 0,
      funcObj: deviceData.FuncObj || null,
      productFuncs: (deviceData.ProductFuncs || []).map(func => ({
        Id: func.Id,
        Name: translateToSpanish(func.Name),
        Code: func.Code
      })),
      isEncrypt: deviceData.IsEncrypt || 0,
      isPrecise: deviceData.IsPrecise || 0,
      broadcastPrefix: deviceData.BroadcastPrefix || '',
      bleName: deviceData.BleName || '',
      amazonUrl: '',
      mercadoLibreUrl: '',
      // Motor logic classification
      motorLogic: classifyMotorLogic(deviceData.FuncObj),
      // Category based on API Cate field (or Universal if not available)
      category: classifyCategory(deviceData.FuncObj, deviceData.ProductFuncs, deviceData.Cate)
    };

    // Extract motor capabilities from FuncObj
    const motors = extractMotorCapabilities(deviceData.FuncObj, deviceData.ProductFuncs);
    deviceInfo.motors = motors;

    return deviceInfo;
    
  } catch (error) {
    console.error(`Error fetching device ${deviceId}:`, error.message);
    return null;
  }
}

/**
 * Translate function names from Chinese/English to Spanish
 * @param {string} name - Function name to translate
 * @returns {string} - Translated name in Spanish
 */
function translateToSpanish(name) {
  if (!name) return '';

  // Trim whitespace and normalize
  const trimmedName = name.trim();

  // Normalize Unicode characters (handle different encodings)
  const normalizedName = trimmedName.normalize('NFC');

  const translations = {
    // Chinese to Spanish - Device Titles (including variants)
    '若拉 2 代': 'Generación 2',
    '小熊': 'Osito',
    '玫瑰花': 'Rosa',
    'S5 玫瑰花': 'Rosa S5',
    '艾余 CL1910': 'AiYu CL1910',
    '谦度 TD001': 'Qian Du TD001',
    '骑士 3 号': 'Caballero No. 3',
    '小火箭': 'Pequeño Cohete',
    '20 宫格测试': 'Prueba Cuadrícula 20',
    '梦蝶': 'Mariposa Soñada',
    '小鲸鱼跳蛋': 'Huevo Saltarín Ballenita',
    ' 小鲸鱼跳蛋': 'Huevo Saltarín Ballenita',
    '18 宫格测试公版 - 穿戴': 'Prueba 18 Cuadrícula - Vestible',
    '水之欢': 'Alegría del Agua',
    '待定': 'Por Definir',
    '谢勇待定': 'Xie Yong Pendiente',
    '飞天润': 'Fei Tian Run',
    '悦蕾 CD20-APP': 'YueLei CD20-APP',
    '茜茜磁吸穿戴': 'Cici Magnético Vestible',
    '兔子锁精环 APP 版': 'Anillo Retenedor Conejito APP',
    '左拉测试 8+8+8': 'Prueba Zola 8+8+8',
    '电击球': 'Bola Eléctrica',
    '动力火车': 'Tren de Potencia',
    '佩蒂 JX035': 'Petty JX035',
    '贝挺 3 代': 'Bei Ting Gen 3',
    '小浪扣动穿戴': 'Xiao Lang Vestible',
    '魔法球': 'Bola Mágica',
    '老孙待定': 'Lao Sun Pendiente',
    '中德黑色伸缩肛塞': 'Anal Retráctil Negro',
    '8+8+8 加热': '8+8+8 Calefacción',
    '标准双马达打样测试码': 'Código Prueba Doble Motor Estándar',
    '优利卡 -APP': 'Unica-APP',
    ' 猫头跳蛋': 'Huevo Saltarín Cabeza Gato',
    '后庭王者': 'Rey del Ano',
    '舌舔 QZ-001': 'Lamedor QZ-001',
    '双球': 'Doble Bola',
    '小海豚': 'Pequeño Delfín',
    '喜宝': 'Xi Bao',
    ' 2DAA ': '2DAA',
    ' 23009': '23009',
    ' ': '',

    // Chinese to Spanish - Functions/Modes
    '经典模式': 'Modo Clásico',
    '音乐模式': 'Modo Música',
    '摇一摇': 'Agitar',
    '互动模式': 'Modo Interactivo',
    '划一划': 'Deslizar',
    '视频模式': 'Modo Video',
    '游戏模式': 'Modo Juego',
    '普通经典': 'Clásico Normal',
    '探索模式': 'Modo Explorar',
    '专属游戏模式': 'Modo de Juego Exclusivo',
    '凯格尔': 'Kegel',
    '加热': 'Calentamiento',
    '声音控制模式': 'Modo de Control por Voz',
    '放电': 'Descarga',
    '自定义模式': 'Modo Personalizado',
    '计时计数': 'Temporizador y Contador',
    '语音开关': 'Interruptor de Voz',
    '语音控制': 'Control por Voz',
    '物与物': 'Dispositivo a Dispositivo',
    ' 物与物': 'Dispositivo a Dispositivo',
    '睡眠模式': 'Modo Sueño',
    '场景模式': 'Modo Escena',
    '趋势': 'Tendencias',
    '打击': 'Golpe',
    '视频 2': 'Video 2',
    '视频语音': 'Video Voz',
    '切换语音': 'Cambiar Voz',
    '手指': 'Dedo',
    '声音': 'Voz',
    '睡眠': 'Sueño',
    '经典': 'Clásico',
    '音乐': 'Música',
    '视频': 'Video',
    '游戏': 'Juego',
    'CH1': 'Canal 1',
    'CH2': 'Canal 2',

    // English to Spanish
    'Classic Mode': 'Modo Clásico',
    'Music Mode': 'Modo Música',
    'Video Mode': 'Modo Video',
    'Game Mode': 'Modo Juego',
    'Shake': 'Agitar',
    'Interactive': 'Interactivo',
    'Touch Control': 'Control Táctil',
    'Heating': 'Calentamiento',
    'Kegel': 'Kegel',
    'Voice Control': 'Control por Voz',
    'AI Voice': 'Voz IA',
    'Trends': 'Tendencias',
    'Discharge': 'Descarga',
    'Scene Mode': 'Modo Escena',
    'Sleep Mode': 'Modo Sueño',
    'Explore Mode': 'Modo Explorar',
    'Custom Mode': 'Modo Personalizado',
    'Custom Game': 'Juego Personalizado',
    'Strike': 'Golpe',
    'TOT': 'TOT',
    'Video 2': 'Video 2',
    'Video Voice': 'Video Voz',
    'Video Wu': 'Video Wu',
    'Switch Voice': 'Cambiar Voz',
    'Finger': 'Dedo',
    'Voice': 'Voz',
    'Sleep': 'Sueño',
    'Classic': 'Clásico',
    'Music': 'Música',
    'Video': 'Video',
    'Game': 'Juego'
  };

  // Use normalizedName for lookup with fallbacks
  return translations[normalizedName] || translations[trimmedName] || translations[name] || name;
}

/**
 * Classify motor logic based on FuncObj
 * @param {object} funcObj - The FuncObj from API response
 * @returns {string} - 'Dual Channel (0xD + 0xA)' or 'Single Channel'
 */
function classifyMotorLogic(funcObj) {
  if (!funcObj) return 'Single Channel';

  // Check for dual channel capability (CH1 and CH2)
  const hasCH1 = funcObj.CH1 === true;
  const hasCH2 = funcObj.CH2 === true;

  // Also check for complex function combinations that indicate dual channel
  // Like the 8154 model which has multiple independent control modes
  const hasComplexControl = (
    funcObj.classic &&
    funcObj.music &&
    funcObj.video &&
    funcObj.game
  );

  if (hasCH1 && hasCH2) {
    return 'Dual Channel (0xD + 0xA)';
  }

  // Some devices with complex control patterns are dual channel
  if (hasComplexControl) {
    return 'Dual Channel (0xD + 0xA)';
  }

  return 'Single Channel';
}

/**
 * Classify device into taxonomy categories
 * Uses API category (Cate.Name) when available, otherwise uses classification logic
 * @param {object} funcObj - The FuncObj from API response
 * @param {Array} productFuncs - The ProductFuncs array
 * @param {object} cate - The Cate object from API (contains Id and Name)
 * @returns {object} - { usageType, targetAnatomy, stimulationType }
 */
function classifyCategory(funcObj, productFuncs, cate) {
  const category = {
    usageType: 'Universal',
    targetAnatomy: 'Universal',
    stimulationType: 'Vibración'
  };

  // If API provides category name, use it as reference
  if (cate && cate.Name && cate.Name.trim()) {
    const categoryName = cate.Name.toLowerCase();

    // Map API categories to our taxonomy
    if (categoryName.includes('masculino') || categoryName.includes('hombre') || categoryName.includes('men')) {
      category.usageType = 'Masculino';
    } else if (categoryName.includes('femenino') || categoryName.includes('mujer') || categoryName.includes('women') || categoryName.includes('female')) {
      category.usageType = 'Femenino';
    }

    if (categoryName.includes('prostata') || categoryName.includes('prostate') || categoryName.includes('anal')) {
      category.targetAnatomy = 'Próstata';
    } else if (categoryName.includes('clitoris') || categoryName.includes('clitoris') || categoryName.includes('vaginal')) {
      category.targetAnatomy = 'Clítoris';
    } else if (categoryName.includes('anal')) {
      category.targetAnatomy = 'Anal';
    }
  }

  // If category is still default, leave as Universal for manual classification
  // This is better than auto-classifying incorrectly

  return category;
}

/**
 * Extract motor capabilities from FuncObj and ProductFuncs
 * @param {object} funcObj - The FuncObj from API response
 * @param {Array} productFuncs - The ProductFuncs array from API response
 * @returns {Array<string>} - List of capabilities in Spanish
 */
function extractMotorCapabilities(funcObj, productFuncs) {
  const capabilities = [];

  if (!funcObj) {
    return capabilities;
  }

  // Check for CH1 and CH2 capabilities first
  if (funcObj.CH1) {
    capabilities.push('Canal 1');
  }
  if (funcObj.CH2) {
    capabilities.push('Canal 2');
  }

  // If no CH1/CH2 found, extract feature capabilities from ProductFuncs (preferred)
  if (capabilities.length === 0 && productFuncs && productFuncs.length > 0) {
    // Use ProductFuncs names translated to Spanish
    for (const func of productFuncs) {
      if (func.Name) {
        capabilities.push(translateToSpanish(func.Name));
      }
    }
  }

  // Fallback: if still no capabilities, use FuncObj boolean flags
  if (capabilities.length === 0) {
    const featureMap = {
      classic: 'Modo Clásico',
      music: 'Modo Música',
      video: 'Modo Video',
      game: 'Modo Juego',
      shake: 'Agitar',
      intera: 'Interactivo',
      finger: 'Control Táctil',
      heating: 'Calentamiento',
      kegel: 'Kegel',
      voice: 'Control por Voz',
      ai_voice: 'Voz IA',
      trends: 'Tendencias',
      discharge: 'Descarga',
      scene: 'Modo Escena',
      sleep: 'Modo Sueño',
      explore: 'Modo Explorar',
      custom_mode: 'Modo Personalizado',
      customer_game: 'Juego Personalizado',
      strike: 'Golpe',
      tot: 'TOT',
      video2: 'Video 2',
      video_voice: 'Video Voz',
      video_wu: 'Video Wu',
      voice_control: 'Control por Voz',
      switch_voice: 'Cambiar Voz'
    };

    for (const [key, value] of Object.entries(featureMap)) {
      if (funcObj[key] === true) {
        capabilities.push(value);
      }
    }
  }

  return capabilities;
}

/**
 * Harvest metadata for a range of device IDs
 * @param {number} startId - Starting device ID
 * @param {number} endId - Ending device ID
 */
async function harvestMetadata(startId, endId) {
  console.log(`Starting metadata harvest from ${startId} to ${endId}...`);
  
  const compatibleDevices = [];
  const totalDevices = endId - startId + 1;
  
  for (let id = startId; id <= endId; id++) {
    process.stdout.write(`\rProcessing device ${id - startId + 1}/${totalDevices} (ID: ${id})...`);
    
    const deviceData = await fetchDeviceMetadata(id);
    
    if (deviceData) {
      compatibleDevices.push(deviceData);
      console.log(`\n✓ Found compatible device: ${deviceData.title} (ID: ${id})`);
    }
  }
  
  console.log('\n');
  console.log(`Harvest complete! Found ${compatibleDevices.length} compatible devices.`);
  
  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Save to JSON file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(compatibleDevices, null, 2), 'utf-8');
  console.log(`Results saved to: ${OUTPUT_FILE}`);
  
  return compatibleDevices;
}

// Main execution
const args = process.argv.slice(2);
const startId = parseInt(args[0]) || 8100;
const endId = parseInt(args[1]) || 8160;

if (isNaN(startId) || isNaN(endId) || startId > endId) {
  console.error('Invalid arguments. Usage: node metadataHarvester.js [startId] [endId]');
  console.error('Example: node metadataHarvester.js 8100 8160');
  process.exit(1);
}

harvestMetadata(startId, endId)
  .then(() => {
    console.log('Harvesting completed successfully!');
  })
  .catch((error) => {
    console.error('Harvesting failed:', error);
    process.exit(1);
  });

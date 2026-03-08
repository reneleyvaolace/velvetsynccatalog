/**
 * Translation dictionary for device functions and capabilities
 * Chinese (and other languages) to Spanish
 */

export const functionTranslations = {
  // Chinese to Spanish translations
  '经典模式': 'Modo Clásico',
  '音乐模式': 'Modo Música',
  '摇一摇': 'Agitar',
  '互动模式': 'Modo Interactivo',
  '划一划': 'Deslizar',
  '视频模式': 'Modo Video',
  '游戏模式': 'Modo Juego',
  '普通经典': 'Clásico Normal',
  '若拉 2 代': 'Generación 2',
  '小熊': 'Osito',
  '玫瑰花': 'Rosa',
  '艾余 CL1910': 'AiYu CL1910',
  '小火箭': 'Pequeño Cohete',
  '梦蝶': 'Mariposa Soñada',
  '小鲸鱼跳蛋': 'Huevo Saltarín Ballenita',
  '兔子锁精环 APP 版': 'Anillo Retenedor Conejito APP',
  '水之欢': 'Alegría del Agua',
  '飞天润': 'Fei Tian Run',
  '悦蕾 CD20-APP': 'YueLei CD20-APP',
  '茜茜磁吸穿戴': 'Cici Magnético Vestible',
  '待定': 'Por Definir',
  '谢勇待定': 'Xie Yong Pendiente',
  '谦度 TD001': 'Qian Du TD001',
  '骑士 3 号': 'Caballero No. 3',
  '小海豚': 'Pequeño Delfín',
  '喜宝': 'Xi Bao',
  '中德黑色伸缩肛塞': 'Anal Retráctil Negro',
  '老孙待定': 'Lao Sun Pendiente',
  '魔法球': 'Bola Mágica',
  '佩蒂 JX035': 'Petty JX035',
  '贝挺 3 代': 'Bei Ting Gen 3',
  '小浪扣动穿戴': 'Xiao Lang Vestible',
  '动力火车': 'Tren de Potencia',
  '后庭王者': 'Rey del Ano',
  '舌舔 QZ-001': 'Lamedor QZ-001',
  '双球': 'Doble Bola',
  '猫头跳蛋': 'Huevo Saltarín Cabeza Gato',
  '标准双马达打样测试码': 'Prueba Doble Motor Estándar',
  '优利卡-APP': 'Unica-APP',
  '8+8+8 加热': '8+8+8 Calefacción',
  '左拉测试 8+8+8': 'Prueba Zola 8+8+8',
  '电击球': 'Bola Eléctrica',
  '20 宫格测试': 'Prueba Cuadrícula 20',
  '18 宫格测试公版 - 穿戴': 'Prueba 18 Cuadrícula - Vestible',
  '20DH': '20DH',
  '277': '277',
  '186': '186',
  '042': '042',
  '0067': '0067',
  '025': '025',

  // Category/function names
  '探索模式': 'Modo Explorar',

  // English technical terms to Spanish
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
  'Game': 'Juego',
  
  // Additional translations
  'CH1': 'Canal 1',
  'CH2': 'Canal 2',
};

/**
 * Translate a function name to Spanish
 * @param {string} name - The function name in Chinese or English
 * @returns {string} - Translated name in Spanish
 */
export function translateFunction(name) {
  if (!name) return 'Desconocido';
  
  // Try exact match first
  if (functionTranslations[name]) {
    return functionTranslations[name];
  }
  
  // Try case-insensitive match
  const lowerName = name.toLowerCase();
  for (const [key, value] of Object.entries(functionTranslations)) {
    if (key.toLowerCase() === lowerName) {
      return value;
    }
  }
  
  // If no translation found, return original
  return name;
}

/**
 * Translate an array of function names
 * @param {Array<{Name: string, Code: string}>} funcs - Array of function objects
 * @returns {Array<{Name: string, Code: string, NameEs: string}>} - Array with Spanish translations
 */
export function translateFunctions(funcs) {
  if (!funcs || !Array.isArray(funcs)) return [];
  
  return funcs.map(func => ({
    ...func,
    NameEs: translateFunction(func.Name)
  }));
}

/**
 * Get Spanish labels for UI
 */
export const uiLabels = {
  // Main titles
  deviceCatalog: 'Catálogo de Dispositivos',
  compatibleDevices: 'dispositivo(s) compatible(s) encontrado(s)',
  loading: 'Cargando catálogo de dispositivos...',
  noDevices: 'No se encontraron dispositivos compatibles',
  runHarvester: 'Ejecuta el metadata harvester para poblar el catálogo:',

  // Device card
  barcode: 'Código de Barras',
  wireless: 'Conexión',
  features: 'Características',
  none: 'Ninguna',

  // Modal
  deviceInfo: 'Información del Dispositivo',
  deviceId: 'ID del Dispositivo',
  factoryId: 'ID Fábrica',
  categoryId: 'ID Categoría',
  broadcastPrefix: 'Prefijo Broadcast',
  bleName: 'Nombre BLE',
  encryption: 'Cifrado',
  no: 'No ✓',
  yes: 'Sí ⚠',
  capabilities: 'Características / Capacidades',
  noCapabilities: 'No se detectaron capacidades',
  productFunctions: 'Funciones del Producto',
  qrCode: 'Código QR',
  name: 'Nombre',

  // Motor badges
  ch1: 'Canal 1',
  ch2: 'Canal 2',

  // Search and Filters
  searchPlaceholder: '🔍 Buscar por nombre, barcode, ID...',
  sortBy: 'Ordenar por',
  activeFilters: 'Filtros activos',
  clearAll: 'Limpiar todo',
  filterByFeature: 'Filtrar por característica',
  noResults: 'No se encontraron resultados',
  noResultsMessage: 'No hay dispositivos que coincidan con los filtros seleccionados.',
  clearFilters: 'Limpiar filtros',

  // Affiliate Links
  buyLinks: 'Enlaces de Compra',
  amazon: 'Ver en Amazon',
  amazonNotAvailable: 'Amazon no disponible',
  mercadoLibre: 'Ver en Mercado Libre',
  mlNotAvailable: 'Mercado Libre no disponible',
};

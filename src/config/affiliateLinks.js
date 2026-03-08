/**
 * Affiliate Links Configuration
 * Add Amazon and Mercado Libre affiliate links for each device by ID
 * 
 * Format: deviceId: { amazonUrl: '...', mercadoLibreUrl: '...' }
 */

export const affiliateLinks = {
  // Example:
  // 8100: {
  //   amazonUrl: 'https://www.amazon.com.mx/dp/XXXXXXXXXX?tag=tu-tag-20',
  //   mercadoLibreUrl: 'https://articulo.mercadolibre.com.mx/MLM-XXXXXXXXXX-_JM'
  // },
  
  // Agrega aquí tus enlaces de afiliado por dispositivo
  // Los IDs corresponden al campo 'id' en compatible_devices.json
};

/**
 * Get affiliate links for a device
 * @param {number} deviceId - The device ID
 * @returns {{amazonUrl?: string, mercadoLibreUrl?: string}} - Affiliate links object
 */
export function getAffiliateLinks(deviceId) {
  return affiliateLinks[deviceId] || { amazonUrl: '', mercadoLibreUrl: '' };
}

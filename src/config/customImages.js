/**
 * Custom Images Configuration
 * Add custom image URLs for devices that don't have images from the API
 * 
 * Format: deviceId: 'https://example.com/image.png'
 */

export const customImages = {
  // Example:
  // 8815: 'https://example.com/custom-image.png',
  
  // Agrega aquí las URLs de imágenes personalizadas por dispositivo
  // Los IDs corresponden al campo 'id' en compatible_devices.json
};

/**
 * Get custom image for a device
 * @param {number} deviceId - The device ID
 * @returns {string} - Custom image URL or empty string
 */
export function getCustomImage(deviceId) {
  return customImages[deviceId] || '';
}

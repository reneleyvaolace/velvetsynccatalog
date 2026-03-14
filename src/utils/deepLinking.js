/**
 * Velvet Sync - Deep Linking Utility
 * Permite abrir la app nativa desde el navegador web
 * 
 * URL Scheme: velvetsync://
 * Universal Links: https://velvetsync.com/app/
 */

// URL Scheme personalizado para la app nativa
const APP_URL_SCHEME = 'velvetsync://';

// Universal Links (HTTPS fallback para iOS/Android)
const UNIVERSAL_LINK_BASE = 'https://velvetsync.com/app';

/**
 * Detecta si el dispositivo es móvil (Android o iOS)
 */
export const isMobile = () => {
  if (typeof navigator === 'undefined') return false;
  
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
};

/**
 * Detecta si es iOS
 */
export const isIOS = () => {
  if (typeof navigator === 'undefined') return false;
  
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
};

/**
 * Detecta si es Android
 */
export const isAndroid = () => {
  if (typeof navigator === 'undefined') return false;
  
  return /android/i.test(navigator.userAgent);
};

/**
 * Construye una URL profunda para conectar un dispositivo específico
 * @param {number} deviceId - ID del dispositivo en Supabase
 * @param {string} [action='connect'] - Acción a realizar (connect, pair, control)
 * @returns {string} - URL profunda completa
 */
export const buildDeepLink = (deviceId, action = 'connect') => {
  const params = new URLSearchParams({
    device_id: deviceId.toString(),
    action: action,
    source: 'web_catalog',
    timestamp: Date.now().toString()
  });
  
  // URL Scheme para app nativa
  const schemeUrl = `${APP_URL_SCHEME}device?${params.toString()}`;
  
  // Universal Link HTTPS (fallback)
  const universalUrl = `${UNIVERSAL_LINK_BASE}/device?${params.toString()}`;
  
  return {
    schemeUrl,      // velvetsync://device?...
    universalUrl    // https://velvetsync.com/app/device?...
  };
};

/**
 * Intenta abrir la app nativa con fallback a la web
 * @param {number} deviceId - ID del dispositivo
 * @param {string} [action='connect'] - Acción a realizar
 * @returns {Promise<{success: boolean, result: 'opened'|'fallback'|'unsupported'|'blocked', message?: string}>}
 */
export const openNativeApp = (deviceId, action = 'connect') => {
  return new Promise((resolve) => {
    const { schemeUrl, universalUrl } = buildDeepLink(deviceId, action);

    const isWindows = typeof navigator !== 'undefined' && /Windows NT/i.test(navigator.userAgent);
    const mobile = isMobile();

    // Si no es móvil ni Windows con app, retornar no soportado
    if (!mobile && !isWindows) {
      resolve({
        success: false,
        result: 'unsupported',
        message: 'Solo disponible en dispositivos móviles'
      });
      return;
    }

    // En Windows, el protocolo probablemente no esté registrado
    // Mejor mostrar que no está disponible
    if (isWindows && !mobile) {
      resolve({
        success: false,
        result: 'unsupported',
        message: 'La app de Velvet Sync debe estar instalada. Disponible solo en móviles.'
      });
      return;
    }

    // Móvil: intentar abrir la app
    let appOpened = false;
    let timeoutFired = false;

    const timeout = setTimeout(() => {
      timeoutFired = true;
      if (!appOpened) {
        resolve({
          success: false,
          result: 'fallback',
          message: 'No se detectó la app de Velvet Sync. ¿Está instalada?'
        });
      }
    }, 1500);

    // Detectar si la app se abrió (la página se oculta)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && !timeoutFired) {
        appOpened = true;
        clearTimeout(timeout);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        resolve({
          success: true,
          result: 'opened'
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Crear iframe oculto para iOS < 11.3
    if (isIOS()) {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = schemeUrl;
      document.body.appendChild(iframe);
    } else {
      // Para Android
      window.location.href = schemeUrl;
    }

    // Fallback: intentar Universal Link después de 2 segundos
    setTimeout(() => {
      if (!appOpened && !timeoutFired) {
        window.location.href = universalUrl;
      }
    }, 2000);
  });
};

/**
 * Genera un intent URI para Android (más confiable)
 * @param {number} deviceId - ID del dispositivo
 * @param {string} [action='connect'] - Acción a realizar
 * @returns {string} - Intent URI para Android
 */
export const buildAndroidIntent = (deviceId, action = 'connect') => {
  const packageName = 'com.velvetsync.app'; // Cambiar por el package name real
  
  return `intent://device?device_id=${deviceId}&action=${action}#Intent;scheme=velvetsync;package=${packageName};end`;
};

/**
 * Muestra un modal/prompt personalizado para elegir cómo abrir la app
 * @param {number} deviceId - ID del dispositivo
 * @param {Function} onChooseApp - Callback cuando elige abrir app
 * @param {Function} onChooseWeb - Callback cuando elige quedarse en web
 */
export const showAppChooser = (deviceId, onChooseApp, onChooseWeb) => {
  // Implementación personalizada según UI
  // Esta función puede ser llamada para mostrar opciones al usuario
  const choice = window.confirm(
    '¿Deseas abrir la app nativa de Velvet Sync para conectar este dispositivo?\n\n' +
    'Aceptar: Abrir app nativa\n' +
    'Cancelar: Permanecer en el navegador'
  );
  
  if (choice) {
    onChooseApp();
  } else {
    onChooseWeb();
  }
};

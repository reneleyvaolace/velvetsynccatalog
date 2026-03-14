const GITHUB_BASE = 'https://raw.githubusercontent.com/reneleyvaolace/velvetsynccatalog/main/documentacion/docs';

export const getDeviceImage = (id) => `${GITHUB_BASE}/img/VS_${id}.jpg`
export const getDeviceQR = (id) => `${GITHUB_BASE}/qr/QR_${id}.png`
export const getDevicePDF = (id) => `${GITHUB_BASE}/pdf/FICHA_${id}_PREMIUM.pdf`
export const getIconUrl = (name) => `${GITHUB_BASE}/icons/${name}.png`



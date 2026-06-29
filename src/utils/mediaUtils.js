import { GITHUB_BASE } from '../config/constants';

export const getDeviceImage = (id) => `${GITHUB_BASE}/img/VS_${id}.jpg`
export const getDeviceQR = (id) => `${GITHUB_BASE}/qr/QR_${id}.png`
export const getDevicePDF = (id) => `${GITHUB_BASE}/pdf/FICHA_${id}_PREMIUM.pdf`
export const getIconUrl = (name) => `${GITHUB_BASE}/icons/${name}.png`



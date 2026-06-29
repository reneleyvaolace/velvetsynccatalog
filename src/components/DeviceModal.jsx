import { useCallback, startTransition } from 'react';
import { getIconUrl } from '../utils/mediaUtils';
import { formatCapability, getOriginalName } from '../utils/deviceFeatures';

function DeviceModal({ selectedDevice, isAIReady, isMobileDevice, onClose, onStartAIDemo, onOpenNativeApp, onOpenPdfViewer }) {
  const handleClose = useCallback(() => {
    startTransition(() => onClose());
  }, [onClose]);

  const handleOpenNative = useCallback(() => {
    onOpenNativeApp();
  }, [onOpenNativeApp]);

  const handleStartAIDemo = useCallback(() => {
    if (selectedDevice) onStartAIDemo(selectedDevice);
  }, [onStartAIDemo, selectedDevice]);

  const handleOpenPdfViewer = useCallback((url, title, type) => {
    onOpenPdfViewer(url, title, type);
  }, [onOpenPdfViewer]);

  if (!selectedDevice) return null;

  return (
    <div className="device-modal-overlay" onClick={handleClose}>
      <div className="device-modal" onClick={(e) => e.stopPropagation()}>
        <button className="device-modal-close" onClick={handleClose}>&times;</button>

        <div className="device-modal-content">
          <div className="device-modal-left">
            <div className="device-modal-image">
              {selectedDevice.pics ? (
                <img
                  src={selectedDevice.pics}
                  alt={selectedDevice.title}
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect fill="%231a1a1a" width="400" height="300"/><text fill="%23333" x="50%" y="50%" text-anchor="middle" dy=".3em">Sin Imagen</text></svg>';
                  }}
                />
              ) : (
                <div className="device-image-placeholder-large">
                  <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
                    <rect fill="#1a1a1a" width="400" height="300" />
                    <text fill="#333" x="50%" y="50%" textAnchor="middle" dy=".3em">Sin Imagen</text>
                  </svg>
                </div>
              )}
            </div>

            {selectedDevice.qrcode && (
              <div className="device-qrcode">
                <h4>Código QR</h4>
                <img src={selectedDevice.qrcode} alt="QR Code" />
              </div>
            )}

            <button className="connect-btn-large" onClick={handleOpenNative}>
              <span className="btn-icon">📡</span>
              {isMobileDevice ? 'Vincular en App' : 'Vincular en Velvet Sync'}
            </button>

            {isMobileDevice && (
              <button className="open-app-btn-large" onClick={handleOpenNative}>
                <span className="btn-icon">📱</span>
                Abrir en la App
              </button>
            )}
          </div>

          <div className="device-modal-info">
            <h2>{selectedDevice.title}</h2>
            {getOriginalName(selectedDevice.title) && (
              <p className="device-modal-id">Original: {getOriginalName(selectedDevice.title)}</p>
            )}
            <p className="device-modal-id">ID del Dispositivo: {selectedDevice.id}</p>

            <div className="device-tech-grid">
              <div className="tech-item">
                <span className="tech-label">Barcode</span>
                <span className="tech-value">{selectedDevice.barcode}</span>
              </div>
              <div className="tech-item">
                <span className="tech-label">Conexión</span>
                <span className="tech-value wireless">{selectedDevice.wireless?.toUpperCase() || 'N/A'}</span>
              </div>
              <div className="tech-item">
                <span className="tech-label">Channel Logic</span>
                <span className={`tech-value ${selectedDevice.funcObj?.CH1 && selectedDevice.funcObj?.CH2 ? 'dual' : 'single'}`}>
                  {selectedDevice.funcObj?.CH1 && selectedDevice.funcObj?.CH2 ? 'Dual Channel' : 'Single Channel'}
                </span>
              </div>
              <div className="tech-item">
                <span className="tech-label">Precisión</span>
                <span className="tech-value">{selectedDevice.isPrecise === 1 ? '0-255' : '0-100'}</span>
              </div>
              <div className="tech-item">
                <span className="tech-label">Factory ID</span>
                <span className="tech-value">{selectedDevice.factoryId || 'N/A'}</span>
              </div>
              <div className="tech-item">
                <span className="tech-label">Cifrado</span>
                <span className={`tech-value ${selectedDevice.isEncrypt === 0 ? 'secure' : 'warning'}`}>
                  {selectedDevice.isEncrypt === 0 ? '✓ Seguro' : '⚠ Activo'}
                </span>
              </div>
            </div>

            <div className="device-modal-capabilities">
              <h3>Características / Capacidades</h3>
              {selectedDevice.motors && selectedDevice.motors.length > 0 ? (
                <div className="capability-tags">
                  {selectedDevice.motors
                    .flatMap(m => typeof m === 'string' ? m.split(/[|,;]/) : m)
                    .map(f => f.trim())
                    .filter(Boolean)
                    .map((cap, idx) => {
                      const formatted = formatCapability(cap);
                      if (!formatted) return null;
                      return (
                        <span key={idx} className={`capability-tag ${!formatted.active ? 'inactive' : ''}`}>
                          {formatted.icon && (
                            <img src={getIconUrl(formatted.icon)} className="cap-icon-mini" alt="" />
                          )}
                          {formatted.label}
                        </span>
                      );
                    })}
                </div>
              ) : (
                <p>Sin capacidades detectadas</p>
              )}
            </div>

            {selectedDevice.productFuncs && selectedDevice.productFuncs.length > 0 && (
              <div className="device-modal-funcs">
                <h3>Funciones del Producto</h3>
                <div className="funcs-list">
                  {selectedDevice.productFuncs.map((func) => (
                    <div key={func.Id} className="func-item">
                      <span className="func-name">{func.Name}</span>
                      <span className="func-code">[{func.Code}]</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="device-modal-docs">
              <h3>📚 Documentación</h3>
              <div className="docs-links">
                {selectedDevice.techSheetUrl && (
                  <button
                    onClick={() => handleOpenPdfViewer(selectedDevice.techSheetUrl, `Ficha Técnica - ${selectedDevice.title}`)}
                    className="doc-link tech-sheet"
                  >
                    📋 Ficha Técnica
                  </button>
                )}
                {selectedDevice.qrcode && (
                  <button
                    onClick={() => handleOpenPdfViewer(selectedDevice.qrcode, `QR Code - ${selectedDevice.title}`, 'image')}
                    className="doc-link qr-code"
                  >
                    📱 Ver QR Code
                  </button>
                )}
              </div>
              <p className="docs-note">
                ℹ️ La documentación se carga desde el servidor del fabricante
              </p>
            </div>

            {isAIReady(selectedDevice.id) && (
              <div className="device-modal-ai">
                <button className="ai-demo-btn" onClick={handleStartAIDemo}>
                  <span className="btn-icon">✨</span>
                  Experiencia IA
                </button>
                <p className="ai-note">
                  ✨ Este dispositivo es compatible con Velvet Sync AI Impulse
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeviceModal;

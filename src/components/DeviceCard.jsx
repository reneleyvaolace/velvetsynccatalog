import { memo, startTransition, useCallback } from 'react';
import { getIconUrl } from '../utils/mediaUtils';
import { FEATURE_MAP, formatCapability, getOriginalName } from '../utils/deviceFeatures';

const DeviceCard = memo(function DeviceCard({ device, isAIReady, onStartAIDemo, onSelectDevice }) {
  const hasCH1 = device.motors?.includes('Canal 1') || device.funcObj?.CH1;
  const hasCH2 = device.motors?.includes('Canal 2') || device.funcObj?.CH2;
  const isDualChannel = hasCH1 && hasCH2;
  const precision = device.isPrecise === 1 ? '0-255' : '0-100';
  const deviceAIReady = isAIReady(device.id);

  const handleCardClick = useCallback(() => {
    startTransition(() => onSelectDevice(device));
  }, [onSelectDevice, device]);

  const handleAIClick = useCallback((e) => {
    e.stopPropagation();
    if (deviceAIReady) {
      onStartAIDemo(device);
    } else {
      startTransition(() => onSelectDevice(device));
    }
  }, [deviceAIReady, onStartAIDemo, onSelectDevice, device]);

  const activeCapabilities = device.motors?.filter(c => formatCapability(c)?.active) || [];

  return (
    <div className={`device-card ${deviceAIReady ? 'ai-ready' : ''}`} onClick={handleCardClick}>
      <div className="device-image-container">
        {deviceAIReady && (
          <div className="ai-impulse-badge">
            <span className="badge-text">AI IMPULSE VERIFIED</span>
            <div className="badge-glow"></div>
            <div className="ai-tooltip">
              <p>Este dispositivo permite la sincronización milimétrica con el análisis de sentimientos de Velvet Sync.</p>
              <p className="tooltip-tech">Soporta control de precisión 0-255 y ráfagas temporales por palabra clave.</p>
            </div>
          </div>
        )}

        <img
          src={device.pics}
          alt={device.title}
          className="device-image"
          loading="lazy"
          width="300"
          height="200"
          onError={(e) => { e.target.src = '/images/placeholder-device.svg'; }}
        />
        <div className="device-overlay">
          <span className="device-id-badge">#{device.id}</span>
        </div>
      </div>

      <div className="device-info">
        <div className="device-title-container">
          <h3 className="device-title">{device.title}</h3>
          <div className="device-category-icons">
            {device.stimulation_icon_url && (
              <img src={device.stimulation_icon_url} className="cat-mini-icon" alt="stimulation" loading="lazy" />
            )}
            {device.anatomy_icon_url && (
              <img src={device.anatomy_icon_url} className="cat-mini-icon" alt="anatomy" loading="lazy" />
            )}
          </div>
          {getOriginalName(device.title) && (
            <div className="original-name-tooltip">
              <span className="tooltip-icon">🈯</span>
              <div className="tooltip-content">
                <p className="tooltip-note">Nombre traducido del chino</p>
                <p className="tooltip-original">Original: <strong>{getOriginalName(device.title)}</strong></p>
              </div>
            </div>
          )}
        </div>

        {deviceAIReady && (
          <div className="ai-tech-description">
            <span className="tech-icon">⚡</span>
            Soporta control de precisión 0-255 y ráfagas temporales por palabra clave
          </div>
        )}

        <div className="device-tech-specs">
          <div className="tech-spec">
            <span className="spec-label">Channel Logic:</span>
            <span className={`spec-value ${isDualChannel ? 'dual' : 'single'}`}>
              {isDualChannel ? 'Dual Channel' : 'Single Channel'}
            </span>
          </div>
          <div className="tech-spec">
            <span className="spec-label">Precisión:</span>
            <span className="spec-value">{precision}</span>
          </div>
        </div>

        <div className="channel-pills">
          {hasCH1 && <span className="channel-pill ch1"><span className="pill-dot"></span>CH1</span>}
          {hasCH2 && <span className="channel-pill ch2"><span className="pill-dot"></span>CH2</span>}
          {!hasCH1 && !hasCH2 && <span className="channel-pill standard">Standard</span>}
        </div>

        <div className="device-capabilities">
          {activeCapabilities.length > 0 ? (
            <div className="capability-badges">
              {activeCapabilities.slice(0, 4).map((cap, idx) => {
                const formatted = formatCapability(cap);
                if (!formatted || !formatted.active) return null;
                return (
                  <span key={idx} className="capability-badge" title={formatted.label}>
                    {formatted.icon && (
                      <img src={getIconUrl(formatted.icon)} className="badge-icon-mini" alt="" loading="lazy" />
                    )}
                    {formatted.label}
                  </span>
                );
              })}
              {activeCapabilities.length > 4 && (
                <span className="capability-badge more">+{activeCapabilities.length - 4}</span>
              )}
            </div>
          ) : (
            <span className="no-capabilities">Sin características</span>
          )}
        </div>

        <div className="device-actions">
          <button className={`connect-btn ${deviceAIReady ? 'ai-lab-trigger' : ''}`} onClick={handleAIClick}>
            <span className="btn-icon">{deviceAIReady ? '🧠' : '✦'}</span>
            {deviceAIReady ? 'Laboratorio IA' : 'Especificaciones'}
          </button>
        </div>
      </div>
    </div>
  );
});

export { DeviceCard };

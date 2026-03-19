import { memo, startTransition, useCallback } from 'react';
import { getIconUrl } from '../utils/mediaUtils';

const FEATURE_MAP = {
  'classic': { label: 'Clásico', icon: 'icon_vibrator' },
  'music': { label: 'Música', icon: 'icon_sync_music' },
  'intera': { label: 'Interactivo', icon: 'icon_remote_partner' },
  'finger': { label: 'Manual', icon: 'icon_motion_control' },
  'video': { label: 'Video', icon: 'icon_video' },
  'game': { label: 'Juegos', icon: 'icon_tab_games' },
  'explore': { label: 'Explorar', icon: 'icon_explore' },
  'shake': { label: 'Agitar', icon: 'icon_shake_mode' },
  'heating': { label: 'Calor', icon: 'icon_heat' },
  'kegel': { label: 'Ejercicios', icon: 'icon_kegel' },
  'voice': { label: 'Voz', icon: 'icon_voice_control' },
  'discharge': { label: 'Descarga', icon: 'icon_pulse_waves' },
  'trends': { label: 'Tendencias', icon: 'icon_intensity' },
  'ai_voice': { label: 'Voz IA', icon: 'icon_voice_control' },
  'thrust': { label: 'Empuje', icon: 'icon_thrust' },
  'suction': { label: 'Succión', icon: 'icon_suction' },
  'audioplot': { label: 'Ritmo Audio', icon: 'icon_sync_music' },
  'videoplot': { label: 'Ritmo Video', icon: 'icon_video' },
  'video_voice': { label: 'Video Voz', icon: 'icon_voice_control' },
  'video_wu': { label: 'Remix Video', icon: 'icon_video' },
  'video2': { label: 'Video Pro', icon: 'icon_video' },
  'custom_mode': { label: 'Modo Propio', icon: 'icon_custom_pattern' },
  'customer_game': { label: 'Mi Juego', icon: 'icon_tab_games' },
  'game_roulette': { label: 'Ruleta', icon: 'icon_game_roulette' },
  'fruit_game': { label: 'Frutas', icon: 'icon_fruit_game' },
  'scene': { label: 'Escenas', icon: 'icon_explore' },
  'tot': { label: 'Entrenar', icon: 'icon_kegel' },
  'training': { label: 'Rutina', icon: 'icon_kegel' },
  'sleep': { label: 'Sueño', icon: 'icon_vibrator' },
  'strike': { label: 'Golpeo', icon: 'icon_pulse_waves' },
  'switch_voice': { label: 'Cambiar Voz', icon: 'icon_voice_control' },
  'voice_control': { label: 'Control Voz', icon: 'icon_voice_control' },
  'remote_session': { label: 'Sesión Remota', icon: 'icon_remote_session' },
  'bluetooth': { label: 'Bluetooth', icon: 'icon_bluetooth' }
};

const formatCapability = (raw) => {
  if (!raw) return null;
  let clean = raw.replace(/{|}|"|'/g, '');
  let parts = clean.split(':');
  let key = parts[0].trim().toLowerCase();
  let value = parts[1] ? parts[1].trim() : 'true';

  const mapping = FEATURE_MAP[key];
  if (mapping) {
    return { label: mapping.label, icon: mapping.icon, active: value !== 'false' };
  }

  const fallbackLabel = key.charAt(0).toUpperCase() + key.slice(1);
  return { label: fallbackLabel, icon: null, active: value !== 'false' };
};

const getOriginalName = (title) => {
  const originalNames = {
    'Rosa S5': 'S5 玫瑰花', 'Qian Du TD001': '谦度 TD001', 'YueLei CD20-APP': '悦蕾 CD20-APP',
    'Cici Magnético Vestible': '茜茜磁吸穿戴', 'Anillo Retenedor Conejito APP': '兔子锁精环 APP 版',
    'Prueba Zola 8+8+8': '左拉测试 8+8+8', 'Petty JX035': '佩蒂 JX035', 'Bei Ting Gen 3': '贝挺 3 代',
    'Xiao Lang Vestible': '小浪扣动穿戴', 'Lao Sun Pendiente': '老孙待定', 'Anal Retráctil Negro': '中德黑色伸缩肛塞',
    'Código Prueba Doble Motor Estándar': '标准双马达打样测试码', 'Unica-APP': '优利卡 -APP',
    'Huevo Saltarín Cabeza Gato': '猫头跳蛋', 'Rey del Ano': '后庭王者', 'Lamedor QZ-001': '舌舔 QZ-001',
    'Xi Bao': '喜宝', 'Fei Tian Run': '飞天润', 'AiYu CL1910': '艾余 CL1910', 'Generación 2': '若拉 2 代',
    'Osito': '小熊', 'Caballero No. 3': '骑士 3 号', 'Pequeño Cohete': '小火箭', 'Prueba Cuadrícula 20': '20 宫格测试',
    'Mariposa Soñada': '梦蝶', 'Huevo Saltarín Ballenita': '小鲸鱼跳蛋', 'Prueba 18 Cuadrícula - Vestible': '18 宫格测试公版 - 穿戴',
    'Alegría del Agua': '水之欢', 'Por Definir': '待定', 'Xie Yong Pendiente': '谢勇待定',
    'Bola Eléctrica': '电击球', 'Tren de Potencia': '动力火车', 'Bola Mágica': '魔法球',
    '8+8+8 Calefacción': '8+8+8 加热', 'Doble Bola': '双球', 'Pequeño Delfín': '小海豚',
  };
  return originalNames[title] || null;
};

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

export { DeviceCard, formatCapability, getOriginalName, FEATURE_MAP };

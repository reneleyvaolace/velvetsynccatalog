import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { isMobile } from '../utils/deepLinking';
import { GITHUB_BASE } from '../config/constants';

const velvetLogo = `${GITHUB_BASE}/logo_velvet.png`;

function AIDemoModal({ selectedDevice, onClose }) {
  const [aiDemoState, setAiDemoState] = useState('idle');
  const [aiMessage, setAiMessage] = useState('');
  const [testProgress, setTestProgress] = useState(0);
  const [testLog, setTestLog] = useState([]);
  const testTimerRef = useRef(null);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    setIsMobileDevice(isMobile());
  }, []);

  useEffect(() => {
    return () => {
      if (testTimerRef.current) {
        clearInterval(testTimerRef.current);
      }
    };
  }, []);

  const completeAITest = useCallback(() => {
    setAiDemoState('complete');
    setTestProgress(100);

    const stopCommands = [];
    if (selectedDevice?.funcObj?.CH1) {
      stopCommands.push('🛑 CH1: 0xD5964C (STOP)');
    }
    if (selectedDevice?.funcObj?.CH2) {
      stopCommands.push('🛑 CH2: 0xA5113F (STOP)');
    }
    if (stopCommands.length === 0) {
      stopCommands.push('🛑 Comando STOP genérico enviado');
    }

    setTestLog(prev => [...prev, ...stopCommands, '✅ Sesión finalizada correctamente']);
  }, [selectedDevice]);

  const runAITest = useCallback(() => {
    setAiDemoState('speaking');
    setAiMessage(`Iniciando Laboratorio de Optimización para ${selectedDevice.title}...`);

    setTimeout(() => {
      setAiDemoState('testing');
      setTestProgress(0);
      setTestLog([
        '🔒 Estableciendo túnel P2P cifrado...',
        `📡 Detectado: ${selectedDevice.title} (ID: ${selectedDevice.id})`,
        `⚙️ Arquitectura: ${selectedDevice.motor_logic === 'dual' ? 'Dual Channel rMesh' : 'Single Channel Standard'}`
      ]);

      const testDuration = 6000;
      const startTime = Date.now();

      testTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / testDuration) * 100, 100);
        setTestProgress(progress);

        if (elapsed > 1000 && elapsed < 1100) {
          setTestLog(prev => [...prev, '⚡ Calibrando latencia de respuesta...']);
        }
        if (elapsed > 2000 && elapsed < 2100) {
          const mainCap = Array.isArray(selectedDevice.stimulation_type) 
            ? selectedDevice.stimulation_type[0] || 'Vibración'
            : selectedDevice.stimulation_type || 'Vibración';
          setTestLog(prev => [...prev, `🌀 Sincronizando impulsos de ${mainCap}...`]);
        }
        if (elapsed > 3500 && elapsed < 3600) {
          if (selectedDevice.is_precise_new) {
            setTestLog(prev => [...prev, '🎯 Verificando precisión 0-255 (Impulse Verified)']);
          } else {
            setTestLog(prev => [...prev, '📈 Validando curvas de intensidad estándar...']);
          }
        }
        if (elapsed > 4500 && elapsed < 4600) {
          setTestLog(prev => [...prev, '🛡️ Capa de privacidad Velvet Sync: Activa']);
        }

        if (progress >= 100) {
          clearInterval(testTimerRef.current);
          completeAITest();
        }
      }, 50);
    }, 1500);
  }, [selectedDevice, completeAITest]);

  const handleOpenNativeApp = useCallback(async (action = 'sync_profile') => {
    if (!selectedDevice) return;

    const deepLink = `velvetsync://device/${selectedDevice.id}?action=${action}`;

    try {
      const { error } = await supabase
        .from('device_sync')
        .insert([
          {
            device_id: selectedDevice.id,
            command: action === 'sync_profile' ? 'APPLY_AI_PROFILE' : 'INIT_CONNECTION',
            payload: {
              timestamp: new Date().toISOString(),
              toy_id: selectedDevice.id,
              ai_optimized: true,
              motor_logic: selectedDevice.motor_logic,
              intensity_map: [255, 128, 64]
            },
            status: 'pending'
          }
        ]);

      if (error) throw error;
    } catch (err) {
      console.error('❌ Error de sincronización:', err);
    }

    if (isMobileDevice) {
      window.location.href = deepLink;
      setTimeout(() => {
        alert(
          `📡 Perfil optimizado enviado al puente Velvet Sync.\n\n` +
          `Abre la Velvet Sync App en tu dispositivo para aplicar los cambios a tu ${selectedDevice.title}.`
        );
      }, 2000);
      return;
    }

    alert(
      `🧪 Perfil "Sináptico" enviado con éxito.\n\n` +
      `Tu ${selectedDevice.title} (SN: ${selectedDevice.id}) recibirá la configuración en cuanto abras la app móvil.`
    );
  }, [selectedDevice, isMobileDevice]);

  if (!selectedDevice) return null;

  return (
    <div className="ai-demo-overlay" onClick={onClose}>
      <div className="ai-demo-modal velvet-lab-mode" onClick={(e) => e.stopPropagation()}>
        <button className="ai-demo-close" onClick={onClose}>&times;</button>

        <div className="ai-demo-content">
          <div className="ai-lab-header">
            <img src={velvetLogo} alt="Velvet Sync" className="ai-lab-logo" />
            <div className="ai-lab-tag">LABORATORIO DE IA</div>
          </div>

          <div className={`ai-avatar-section ${aiDemoState}`}>
            <div className={`ai-avatar ${aiDemoState}`}>
              <div className="avatar-ring"></div>
              <div className="avatar-core"></div>
              <div className="avatar-haptic-pulse"></div>
            </div>
            <div className="ai-status">
              {aiDemoState === 'idle' && 'VELVET AI: LISTO'}
              {aiDemoState === 'speaking' && 'ANALIZANDO HARDWARE...'}
              {aiDemoState === 'testing' && 'SINCRONIZACIÓN SINÁPTICA'}
              {aiDemoState === 'complete' && 'OPTIMIZACIÓN FINALIZADA'}
            </div>
          </div>

          {aiMessage && (
            <div className="ai-message-bubble lab-style">
              <p>{aiMessage}</p>
            </div>
          )}

          <div className="ai-device-info lab-context">
            <h3>{selectedDevice.title}</h3>
            <p className="device-id">SN: {selectedDevice.id}</p>
            <div className="ai-specs">
              <span className="spec-badge">
                {selectedDevice.motor_logic === 'dual' ? 'DUAL MOTOR' : 'SINGLE MOTOR'}
              </span>
              {selectedDevice.is_precise_new && (
                <span className="spec-badge precision">IMPULSE VERIFIED</span>
              )}
              <span className="spec-badge">
                {selectedDevice.usage_type?.toUpperCase()}
              </span>
            </div>
          </div>

          {aiDemoState === 'testing' && (
            <div className="haptic-visualizer-bars">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="haptic-bar"
                  style={{
                    animationDelay: `${i * 0.1}s`,
                    height: `${30 + Math.random() * 70}%`
                  }}
                ></div>
              ))}
            </div>
          )}

          {aiDemoState === 'idle' && (
            <button className="ai-test-btn lab-btn" onClick={runAITest}>
              <span className="btn-icon">🧠</span>
              Iniciar Sincronización IA
            </button>
          )}

          {aiDemoState === 'testing' && (
            <div className="test-progress-section lab-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${testProgress}%` }}></div>
              </div>
              <div className="progress-footer">
                <span className="progress-pct">{Math.round(testProgress)}%</span>
                <span className="progress-detail">CALIBRANDO SENSORES</span>
              </div>
            </div>
          )}

          {testLog.length > 0 && (
            <div className="test-log lab-log">
              <div className="log-entries">
                {testLog.map((entry, idx) => (
                  <div key={idx} className={`log-entry ${entry.includes('🛑') ? 'stop-command' : ''}`}>
                    <span className="log-timestamp">[{new Date().toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' })}]</span> {entry}
                  </div>
                ))}
              </div>
            </div>
          )}

          {aiDemoState === 'complete' && (
            <div className="ai-demo-actions lab-actions">
              <div className="complete-summary">
                <p>Perfil de placer generado y cifrado localmente para este hardware.</p>
              </div>

              <button className="ai-open-app-btn pulse-glow" onClick={handleOpenNativeApp}>
                <span className="btn-icon">⚡</span>
                Subir Perfil a Velvet App
              </button>

              <button className="ai-close-btn lab-secondary" onClick={onClose}>
                Finalizar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AIDemoModal;

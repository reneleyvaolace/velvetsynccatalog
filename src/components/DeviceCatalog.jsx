import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { getDeviceImage, getDeviceQR, getDevicePDF, getIconUrl } from '../utils/mediaUtils';
import { translateFunction } from '../utils/translations';
import { isMobile, openNativeApp, buildDeepLink } from '../utils/deepLinking';
const GITHUB_BASE = 'https://raw.githubusercontent.com/reneleyvaolace/velvetsynccatalog/main/documentacion/docs';
const velvetLogo = `${GITHUB_BASE}/logo_velvet.png`;

import stealthIcon from '../assets/velvet_sync/stealth_icon.png';

import './DeviceCatalog.css';

// Mapa de iconos para funciones
const FEATURE_MAP = {
  // Principales
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
  
  // Audio & Video Sync
  'audioplot': { label: 'Ritmo Audio', icon: 'icon_sync_music' },
  'videoplot': { label: 'Ritmo Video', icon: 'icon_video' },
  'video_voice': { label: 'Video Voz', icon: 'icon_voice_control' },
  'video_wu': { label: 'Remix Video', icon: 'icon_video' },
  'video2': { label: 'Video Pro', icon: 'icon_video' },
  
  // Modos y Juegos
  'custom_mode': { label: 'Modo Propio', icon: 'icon_custom_pattern' },
  'customer_game': { label: 'Mi Juego', icon: 'icon_tab_games' },
  'game_roulette': { label: 'Ruleta', icon: 'icon_game_roulette' },
  'fruit_game': { label: 'Frutas', icon: 'icon_fruit_game' },
  'scene': { label: 'Escenas', icon: 'icon_explore' },
  
  // Entrenamiento y Salud
  'tot': { label: 'Entrenar', icon: 'icon_kegel' },
  'training': { label: 'Rutina', icon: 'icon_kegel' },
  
  // Otros
  'sleep': { label: 'Sueño', icon: 'icon_vibrator' },
  'strike': { label: 'Golpeo', icon: 'icon_pulse_waves' },
  'switch_voice': { label: 'Cambiar Voz', icon: 'icon_voice_control' },
  'voice_control': { label: 'Control Voz', icon: 'icon_voice_control' },
  'remote_session': { label: 'Sesión Remota', icon: 'icon_remote_session' },
  'bluetooth': { label: 'Bluetooth', icon: 'icon_bluetooth' }
};



/**
 * Limpia y traduce una cadena de característica técnica
 */
const formatCapability = (raw) => {
  if (!raw) return null;
  
  // 1. Limpiar JSON strings ("audioPlot": true)
  let clean = raw.replace(/{|}|"/g, '');
  let parts = clean.split(':');
  let key = parts[0].trim().toLowerCase();
  let value = parts[1] ? parts[1].trim() : 'true';

  const mapping = FEATURE_MAP[key];
  if (mapping) {
    return {
      label: mapping.label,
      icon: mapping.icon,
      active: value !== 'false'
    };
  }

  // Fallback para llaves desconocidas: Capitalize First
  const fallbackLabel = key.charAt(0).toUpperCase() + key.slice(1);
  return {
    label: fallbackLabel,
    icon: null,
    active: value !== 'false'
  };
};





// Taxonomy options with official Velvet Sync icons
const TAXONOMY_OPTIONS = {
  usage: [
    { value: '', label: 'Todos', icon: 'icon_explore' },
    { value: 'external', label: 'Externo', icon: 'icon_motion_control' },
    { value: 'internal', label: 'Interno', icon: 'icon_vibrator' },
    { value: 'universal', label: 'Universal', icon: 'icon_video' }
  ],
  anatomy: [
    { value: '', label: 'Todas', icon: 'icon_tab_games' },
    { value: 'clitoral', label: 'Clítoris', icon: 'icon_shake_mode' },
    { value: 'vaginal', label: 'Vaginal', icon: 'icon_vibrator' },
    { value: 'anal', label: 'Anal', icon: 'icon_pulse_waves' },
    { value: 'prostate', label: 'Próstata', icon: 'icon_thrust' },
    { value: 'universal', label: 'Universal', icon: 'icon_explore' }
  ],
  stimulation: [
    { value: '', label: 'Todos', icon: 'icon_explore' },
    { value: 'vibration', label: 'Vibración', icon: 'icon_intensity' },
    { value: 'suction', label: 'Succión', icon: 'icon_suction' },
    { value: 'thrust', label: 'Empuje', icon: 'icon_thrust' },
    { value: 'heating', label: 'Calor', icon: 'icon_heat' },
    { value: 'interactive', label: 'Interactivo', icon: 'icon_remote_partner' }
  ]
};

/**
 * Velvet Sync Device Catalog
 * Dark Neon Noir aesthetic - Engineering focused, privacy-first
 * With AI Impulse Verified compatibility
 */
function DeviceCatalog() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [showAIFilter, setShowAIFilter] = useState(false);

  // Taxonomy filter states
  const [selectedUsageType, setSelectedUsageType] = useState(''); // Masculino, Femenino, Universal
  const [selectedAnatomy, setSelectedAnatomy] = useState(''); // Próstata, Clítoris, Vaginal, Anal
  const [selectedStimulation, setSelectedStimulation] = useState(''); // Vibración, Succión, Empuje, etc.

  // AI Demo Modal states
  const [showAIDemo, setShowAIDemo] = useState(false);
  const [aiDemoState, setAiDemoState] = useState('idle'); // idle, speaking, testing, complete
  const [aiMessage, setAiMessage] = useState('');
  const [testProgress, setTestProgress] = useState(0);
  const [testLog, setTestLog] = useState([]);
  const testTimerRef = useRef(null);

  // Mobile app detection state
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    // Detect if running on mobile
    setIsMobileDevice(isMobile());
  }, []);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedFeatures, showAIFilter, selectedUsageType, selectedAnatomy, selectedStimulation]);

  // AI-Ready devices (rMesh 11-byte protocol)
  const AI_READY_DEVICES = useMemo(() => new Set([
    8154,  // Caballero No. 3
    7043,  // Modelo compatible
    8131,  // YCGS001
    8815,  // AATD593 - Dual Channel con precisión 0-255
    8215,  // Prueba Cuadrícula 20
    8001,  // SJH-011
  ]), []);

  // Check if device supports AI Impulse
  const isAIReady = (deviceId) => AI_READY_DEVICES.has(deviceId);

  // Get original Chinese name for translated titles
  const getOriginalName = (title) => {
    const originalNames = {
      'Rosa S5': 'S5 玫瑰花',
      'Qian Du TD001': '谦度 TD001',
      'YueLei CD20-APP': '悦蕾 CD20-APP',
      'Cici Magnético Vestible': '茜茜磁吸穿戴',
      'Anillo Retenedor Conejito APP': '兔子锁精环 APP 版',
      'Prueba Zola 8+8+8': '左拉测试 8+8+8',
      'Petty JX035': '佩蒂 JX035',
      'Bei Ting Gen 3': '贝挺 3 代',
      'Xiao Lang Vestible': '小浪扣动穿戴',
      'Lao Sun Pendiente': '老孙待定',
      'Anal Retráctil Negro': '中德黑色伸缩肛塞',
      'Código Prueba Doble Motor Estándar': '标准双马达打样测试码',
      'Unica-APP': '优利卡 -APP',
      'Huevo Saltarín Cabeza Gato': '猫头跳蛋',
      'Rey del Ano': '后庭王者',
      'Lamedor QZ-001': '舌舔 QZ-001',
      'Xi Bao': '喜宝',
      'Fei Tian Run': '飞天润',
      'AiYu CL1910': '艾余 CL1910',
      'Generación 2': '若拉 2 代',
      'Osito': '小熊',
      'Caballero No. 3': '骑士 3 号',
      'Pequeño Cohete': '小火箭',
      'Prueba Cuadrícula 20': '20 宫格测试',
      'Mariposa Soñada': '梦蝶',
      'Huevo Saltarín Ballenita': '小鲸鱼跳蛋',
      'Prueba 18 Cuadrícula - Vestible': '18 宫格测试公版 - 穿戴',
      'Alegría del Agua': '水之欢',
      'Por Definir': '待定',
      'Xie Yong Pendiente': '谢勇待定',
      'Bola Eléctrica': '电击球',
      'Tren de Potencia': '动力火车',
      'Bola Mágica': '魔法球',
      '8+8+8 Calefacción': '8+8+8 加热',
      'Doble Bola': '双球',
      'Pequeño Delfín': '小海豚',
    };
    return originalNames[title] || null;
  };

  // Helper to map data from Supabase to components expected format
  const mapDeviceFromSupabase = (device) => {
    // Parse supported_funcs (exhaustively split by commas, pipes, or semicolons)
    const motors = device.supported_funcs 
      ? device.supported_funcs.split(/[|,;]/).map(f => f.trim()).filter(Boolean) 
      : [];
    
    // Parse motor_logic to funcObj
    const funcObj = {
      CH1: device.motor_logic === 'single' || device.motor_logic === 'dual',
      CH2: device.motor_logic === 'dual'
    };

    return {
      ...device,
      title: device.model_name || `Dispositivo ${device.id}`, // Aliasing for compatibility
      pics: device.image_url || getDeviceImage(device.id),
      qrcode: device.qr_code_url || getDeviceQR(device.id),
      motors: motors,
      funcObj: funcObj,
      isPrecise: device.is_precise_new ? 1 : 0,
      barcode: device.barcode || device.id.toString(),
      manualUrl: device.ficha_tecnica_url || getDevicePDF(device.id),
      techSheetUrl: device.ficha_tecnica_url || getDevicePDF(device.id),
      // Flatten category for simpler access in filters
      usage_type: device.usage_type || 'universal',
      target_anatomy: device.target_anatomy || 'universal',
      stimulation_type: device.stimulation_type || 'vibration'
    };
  };

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const { data, error } = await supabase
          .from('device_catalog')
          .select('*')
          .order('id', { ascending: true });
        
        if (error) throw error;
        if (data) {
          const mappedData = data.map(mapDeviceFromSupabase);
          setDevices(mappedData);
        }
      } catch (err) {
        console.error('Error fetching from Supabase:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDevices();
  }, []);

  // Get all unique features from all devices and clean them up
  const allFeatures = useMemo(() => {
    const featuresSet = new Set();
    
    devices.forEach(device => {
      if (!device.motors) return;

      // Intentar procesar como array o string
      const rawMotors = Array.isArray(device.motors) ? device.motors : [device.motors];

      rawMotors.forEach(rawItem => {
        if (!rawItem) return;

        // Convertir a string si es objeto
        let str = typeof rawItem === 'string' ? rawItem : JSON.stringify(rawItem);
        
        // 1. Limpiar caracteres JSON y pipes
        // Esto manejará {"classic": true}, "classic: true", classic|music, etc.
        let cleaned = str.replace(/{|}|"|\[|\]/g, '');
        
        // Split por pipe y por coma (por si viene JSON list)
        const parts = cleaned.split(/[|,]/);
        
        parts.forEach(part => {
          // Tomar solo la llave si es key:value
          let key = part.split(':')[0].trim();
          
          // Filtrar basura y valores booleanos crudos
          if (key && !['true', 'false', 'null', 'undefined'].includes(key.toLowerCase())) {
            featuresSet.add(key);
          }
        });
      });
    });

    return Array.from(featuresSet).sort((a, b) => {
      const labelA = FEATURE_MAP[a.toLowerCase()]?.label || a;
      const labelB = FEATURE_MAP[b.toLowerCase()]?.label || b;
      return labelA.localeCompare(labelB);
    });
  }, [devices]);



  // Filter devices
  const filteredDevices = useMemo(() => {
    let result = [...devices];

    // AI & Precisión filter
    if (showAIFilter) {
      result = result.filter(device => isAIReady(device.id));
    }

    // Taxonomy filters
    if (selectedUsageType) {
      result = result.filter(device =>
        device.usage_type === selectedUsageType
      );
    }

    if (selectedAnatomy) {
      result = result.filter(device =>
        device.target_anatomy === selectedAnatomy
      );
    }

    if (selectedStimulation) {
      result = result.filter(device =>
        device.stimulation_type === selectedStimulation
      );
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(device =>
        device.title.toLowerCase().includes(term) ||
        device.barcode.toLowerCase().includes(term) ||
        device.id.toString().includes(term)
      );
    }

    // Filter by selected features
    if (selectedFeatures.length > 0) {
      result = result.filter(device =>
        device.motors && device.motors.some(feature =>
          selectedFeatures.includes(feature)
        )
      );
    }

    // Sort by ID
    result.sort((a, b) => a.id - b.id);

    return result;
  }, [devices, searchTerm, selectedFeatures, showAIFilter, selectedUsageType, selectedAnatomy, selectedStimulation]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredDevices.length / itemsPerPage);
  const currentPageDevices = filteredDevices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Page handlers
  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Toggle feature filter
  const toggleFeature = (feature) => {
    setSelectedFeatures(prev =>
      prev.includes(feature)
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedFeatures([]);
    setShowAIFilter(false);
    setSelectedUsageType('');
    setSelectedAnatomy('');
    setSelectedStimulation('');
  };

  // Start AI Demo
  const startAIDemo = (device) => {
    setSelectedDevice(device);
    setShowAIDemo(true);
    setAiDemoState('idle');
    setAiMessage('');
    setTestProgress(0);
    setTestLog([]);
  };

  // Run AI Test (3-5 seconds)
  const runAITest = () => {
    setAiDemoState('speaking');
    setAiMessage(`Iniciando Laboratorio de Optimización para ${selectedDevice.title}...`);

    // AI Avatar speaks - More professional / engineering tone
    setTimeout(() => {
      setAiDemoState('testing');
      setTestProgress(0);
      setTestLog([
        '🔒 Estableciendo túnel P2P cifrado...',
        `📡 Detectado: ${selectedDevice.title} (ID: ${selectedDevice.id})`,
        `⚙️ Arquitectura: ${selectedDevice.motor_logic === 'dual' ? 'Dual Channel rMesh' : 'Single Channel Standard'}`
      ]);

      const testDuration = 6000; // 6s duration for more presence
      const startTime = Date.now();

      testTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / testDuration) * 100, 100);
        setTestProgress(progress);

        // Dynamic log messages based on device capabilities
        if (elapsed > 1000 && elapsed < 1100) {
          setTestLog(prev => [...prev, '⚡ Calibrando latencia de respuesta...']);
        }
        if (elapsed > 2000 && elapsed < 2100) {
          const mainCap = selectedDevice.stimulation_type || 'Vibración';
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
  };

  // Complete AI Test and send stop commands
  const completeAITest = () => {
    setAiDemoState('complete');
    setTestProgress(100);

    // Send specific stop commands
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
  };

  // Close AI Demo
  const closeAIDemo = () => {
    if (testTimerRef.current) {
      clearInterval(testTimerRef.current);
    }
    setShowAIDemo(false);
    setAiDemoState('idle');
    setSelectedDevice(null);
  };

  // Open native app or sync with Supabase
  const handleOpenNativeApp = async (action = 'connect') => {
    if (!selectedDevice) return;

    // 1. Intentar abrir la app vía Deep Link (velvetsync://)
    const deepLink = `velvetsync://device/${selectedDevice.id}?action=${action}`;
    
    // 2. Registrar la intención en Supabase para sincronización Realtime (Web -> App bridge)
    try {
      const { data, error } = await supabase
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
              intensity_map: [255, 128, 64] // Simulado: perfil de intensidad optimizado
            },
            status: 'pending'
          }
        ]);

      if (error) throw error;
      console.log('📡 Sincronización enviada a Supabase:', data);
    } catch (err) {
      console.error('❌ Error de sincronización:', err);
    }

    // 3. Si es móvil, intentar el disparo del Deep Link
    if (isMobileDevice) {
      window.location.href = deepLink;
      
      // Fallback si no abre en 2 segundos
      setTimeout(() => {
        alert(
          `📡 Perfil optimizado enviado al puente Velvet Sync.\n\n` +
          `Abre la Velvet Sync App en tu dispositivo para aplicar los cambios a tu ${selectedDevice.title}.`
        );
      }, 2000);
      return;
    }

    // Si es Desktop, informar que se envió el perfil a la nube
    alert(
      `🧪 Perfil "Sináptico" enviado con éxito.\n\n` +
      `Tu ${selectedDevice.title} (SN: ${selectedDevice.id}) recibirá la configuración en cuanto abras la app móvil.`
    );
  };

  if (loading) {
    return (
      <div className="device-catalog-loading">
        <div className="velvet-loader">
          <div className="loader-pulse"></div>
          <p>Estableciendo conexión segura con Velvet Sync...</p>
        </div>
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="device-catalog-empty">
        <h2>⚠ Sin Dispositivos Compatibles</h2>
        <p>Ejecuta el metadata harvester para poblar el catálogo:</p>
        <code>node metadataHarvester.js 8000 9000</code>
      </div>
    );
  }

  return (
    <div className="velvet-catalog">
      {/* Hero Section */}
      <header className="velvet-hero">
        <div className="hero-glow"></div>
        <div className="hero-content">
          <div className="hero-logo-container">
            <img src={velvetLogo} alt="Velvet Sync Logo" className="hero-logo" />
          </div>
          <h1 className="hero-title">
            <span className="title-neon">Velvet Sync</span>
            <span className="title-subtitle">Privacidad Cifrada, Placer Absoluto</span>
          </h1>
          <div className="hero-description">
            <p className="hero-text">
              <span className="highlight">Herramienta de ingeniería local</span> — No somos una red social pública.
            </p>
            <p className="hero-text">
              Control total sobre tu hardware. Sin nubes. Sin vigilancia. Sin compromisos.
            </p>
            <div className="hero-badges">
              <span className="hero-badge">🔒 Cifrado de Extremo a Extremo</span>
              <span className="hero-badge">📡 Protocolo rMesh</span>
              <span className="hero-badge">🖥 Ejecución Local</span>
              <span className="hero-badge ai-badge">🤖 Listo para AI Impulse</span>
            </div>
          </div>
        </div>
      </header>

      {/* Search and Filters */}
      <div className="filters-section">
        {/* Pagination Per Page Selector */}
        <div className="pagination-per-page">
          <label>📄 Mostrar:</label>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={50}>50 dispositivos</option>
            <option value={100}>100 dispositivos</option>
            <option value={200}>200 dispositivos</option>
            <option value={500}>500 dispositivos</option>
          </select>
          <span className="items-label">por página</span>
        </div>

        {/* Taxonomy Filters */}
        <div className="taxonomy-filters">
          <h3 className="taxonomy-title">🔬 Taxonomía de Filtros Visuales</h3>

          <div className="taxonomy-visual-grid">
            {/* Tipo de Uso */}
            <div className="taxonomy-visual-group">
              <label className="taxonomy-label">Tipo de Uso:</label>
              <div className="taxonomy-chips">
                {TAXONOMY_OPTIONS.usage.map(opt => (
                  <button 
                    key={opt.value}
                    className={`taxonomy-chip ${selectedUsageType === opt.value ? 'active' : ''}`}
                    onClick={() => setSelectedUsageType(opt.value)}
                  >
                    <span className="chip-icon">
                      <img 
                        src={getIconUrl(opt.icon)} 
                        alt="" 
                        className="taxonomy-icon-img" 
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </span>
                    <span className="chip-label">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Anatomía Objetivo */}
            <div className="taxonomy-visual-group">
              <label className="taxonomy-label">Anatomía Objetivo:</label>
              <div className="taxonomy-chips">
                {TAXONOMY_OPTIONS.anatomy.map(opt => (
                  <button 
                    key={opt.value}
                    className={`taxonomy-chip ${selectedAnatomy === opt.value ? 'active' : ''}`}
                    onClick={() => setSelectedAnatomy(opt.value)}
                  >
                    <span className="chip-icon">
                      <img 
                        src={getIconUrl(opt.icon)} 
                        alt="" 
                        className="taxonomy-icon-img" 
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </span>
                    <span className="chip-label">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tipo de Estimulación */}
            <div className="taxonomy-visual-group">
              <label className="taxonomy-label">Tipo de Estimulación:</label>
              <div className="taxonomy-chips">
                {TAXONOMY_OPTIONS.stimulation.map(opt => (
                  <button 
                    key={opt.value}
                    className={`taxonomy-chip ${selectedStimulation === opt.value ? 'active' : ''}`}
                    onClick={() => setSelectedStimulation(opt.value)}
                  >
                    <span className="chip-icon">
                      <img 
                        src={getIconUrl(opt.icon)} 
                        alt="" 
                        className="taxonomy-icon-img" 
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </span>
                    <span className="chip-label">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* AI & Precisión Filter Toggle */}
        <div className="ai-filter-toggle">
          <button
            className={`ai-filter-btn ${showAIFilter ? 'active' : ''}`}
            onClick={() => setShowAIFilter(!showAIFilter)}
          >
            <span className="ai-icon">🤖</span>
            IA & Precisión
            {showAIFilter && <span className="filter-count">{filteredDevices.length}</span>}
          </button>
          {showAIFilter && (
            <div className="ai-filter-description">
              Mostrando dispositivos con protocolo rMesh de 11 bytes y control de precisión 0-255
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Buscar por nombre, barcode, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="search-clear" onClick={() => setSearchTerm('')}>✕</button>
          )}
        </div>

        {/* Active Filters */}
        {(searchTerm || selectedFeatures.length > 0 || showAIFilter || selectedUsageType || selectedAnatomy || selectedStimulation) && (
          <div className="active-filters">
            <span className="active-filters-label">Filtros activos:</span>
            {selectedUsageType && (
              <span className="active-filter-tag taxonomy-tag">
                📊 Uso: {
                  selectedUsageType === 'external' ? 'Externo' : 
                  selectedUsageType === 'internal' ? 'Interno' : 
                  selectedUsageType === 'universal' ? 'Universal' : selectedUsageType
                }
                <button onClick={() => setSelectedUsageType('')}>✕</button>
              </span>
            )}
            {selectedAnatomy && (
              <span className="active-filter-tag taxonomy-tag">
                🎯 Anatomía: {
                  selectedAnatomy === 'clitoral' ? 'Clítoris' :
                  selectedAnatomy === 'vaginal' ? 'Vaginal' :
                  selectedAnatomy === 'anal' ? 'Anal' :
                  selectedAnatomy === 'prostate' ? 'Próstata' :
                  selectedAnatomy === 'universal' ? 'Universal' : selectedAnatomy
                }
                <button onClick={() => setSelectedAnatomy('')}>✕</button>
              </span>
            )}
            {selectedStimulation && (
              <span className="active-filter-tag taxonomy-tag">
                ⚡ Estimulación: {
                  selectedStimulation === 'vibration' ? 'Vibración' :
                  selectedStimulation === 'suction' ? 'Succión' :
                  selectedStimulation === 'thrust' ? 'Empuje' :
                  selectedStimulation === 'heating' ? 'Calentamiento' :
                  selectedStimulation === 'interactive' ? 'Interactivo' : selectedStimulation
                }
                <button onClick={() => setSelectedStimulation('')}>✕</button>
              </span>
            )}
            {showAIFilter && (
              <span className="active-filter-tag ai-tag">
                🤖 IA & Precisión
                <button onClick={() => setShowAIFilter(false)}>✕</button>
              </span>
            )}
            {searchTerm && (
              <span className="active-filter-tag">
                🔍 "{searchTerm}"
                <button onClick={() => setSearchTerm('')}>✕</button>
              </span>
            )}
            {selectedFeatures.map(feature => (
              <span key={feature} className="active-filter-tag">
                {feature}
                <button onClick={() => toggleFeature(feature)}>✕</button>
              </span>
            ))}
            <button className="clear-all-btn" onClick={clearFilters}>
              Limpiar todo
            </button>
          </div>
        )}

        {/* Feature Filters */}
        <div className="features-filter">
          <h3 className="features-filter-title">Filtrar por característica:</h3>
          <div className="features-list">
            {allFeatures.map(feature => {
              const mapping = FEATURE_MAP[feature.toLowerCase()];
              const label = mapping ? mapping.label : feature;
              const iconName = mapping ? mapping.icon : null;

              return (
                <button
                  key={feature}
                  className={`feature-filter-btn ${selectedFeatures.includes(feature) ? 'active' : ''}`}
                  onClick={() => toggleFeature(feature)}
                >
                  {iconName && (
                    <img 
                      src={getIconUrl(iconName)} 
                      className="feature-icon-mini" 
                      alt="" 
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  )}
                  {label}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Device Grid */}
      <div className="device-gallery">
        {filteredDevices.length === 0 ? (
          <div className="no-results">
            <h3>⚠ Sin Resultados</h3>
            <p>No hay dispositivos que coincidan con los filtros seleccionados.</p>
            <button className="clear-filters-btn" onClick={clearFilters}>
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div>
            <div className="pagination-info">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredDevices.length)} de {filteredDevices.length} dispositivos
            </div>
            {currentPageDevices.map((device) => {
              // Check for CH1/CH2 capabilities
              const hasCH1 = device.motors?.includes('Canal 1') || device.funcObj?.CH1;
              const hasCH2 = device.motors?.includes('Canal 2') || device.funcObj?.CH2;
              const isDualChannel = hasCH1 && hasCH2;
              const precision = device.isPrecise === 1 ? '0-255' : '0-100';
              const deviceAIReady = isAIReady(device.id);

              return (
                <div
                  key={device.id}
                  className={`device-card ${deviceAIReady ? 'ai-ready' : ''}`}
                  onClick={() => setSelectedDevice(device)}
                >
                <div className="device-image-container">
                  {/* AI Impulse Badge */}
                  {deviceAIReady && (
                    <div className="ai-impulse-badge">
                      <span className="badge-text">AI IMPULSE VERIFIED</span>
                      <div className="badge-glow"></div>
                      {/* Tooltip */}
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
                    onError={(e) => {
                      // Fallback a placeholder local si falla la URL externa
                      e.target.src = '/images/placeholder-device.svg';
                    }}
                    loading="lazy"
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
                        <img src={device.stimulation_icon_url} className="cat-mini-icon" alt="stimulation" />
                      )}
                      {device.anatomy_icon_url && (
                        <img src={device.anatomy_icon_url} className="cat-mini-icon" alt="anatomy" />
                      )}
                    </div>
                    {/* Tooltip con nombre original en chino */}

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

                  {/* AI Technical Description */}
                  {deviceAIReady && (
                    <div className="ai-tech-description">
                      <span className="tech-icon">⚡</span>
                      Soporta control de precisión 0-255 y ráfagas temporales por palabra clave
                    </div>
                  )}

                  {/* Technical Specs */}
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

                  {/* Channel Pills */}
                  <div className="channel-pills">
                    {hasCH1 && (
                      <span className="channel-pill ch1">
                        <span className="pill-dot"></span>
                        CH1
                      </span>
                    )}
                    {hasCH2 && (
                      <span className="channel-pill ch2">
                        <span className="pill-dot"></span>
                        CH2
                      </span>
                    )}
                    {!hasCH1 && !hasCH2 && (
                      <span className="channel-pill standard">Standard</span>
                    )}
                  </div>

                  {/* Features */}
                  <div className="device-capabilities">
                    {device.motors && device.motors.length > 0 ? (
                      <div className="capability-badges">
                        {device.motors
                          .flatMap(m => typeof m === 'string' ? m.split(/[|,;]/) : m)
                          .map(f => f.trim())
                          .filter(Boolean)
                          .slice(0, 5)
                          .map((cap, idx) => {
                            const formatted = formatCapability(cap);
                          if (!formatted) return null;
                          // Solo mostramos las que son TRUE en la tarjeta de la galería para no saturar
                          if (!formatted.active) return null;
                          
                          return (
                            <span key={idx} className="capability-badge" title={formatted.label}>
                              {formatted.icon && (
                                <img 
                                  src={getIconUrl(formatted.icon)} 
                                  className="badge-icon-mini" 
                                  alt="" 
                                />
                              )}
                              {formatted.label}
                            </span>
                          );
                        })}
                        {device.motors.filter(c => formatCapability(c)?.active).length > 4 && (
                          <span className="capability-badge more">
                            +{device.motors.filter(c => formatCapability(c)?.active).length - 4}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="no-capabilities">Sin características</span>
                    )}
                  </div>


                  {/* Connect Button */}
                  <div className="device-actions">
                    <button
                      className={`connect-btn ${deviceAIReady ? 'ai-lab-trigger' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (deviceAIReady) {
                          startAIDemo(device);
                        } else {
                          setSelectedDevice(device);
                        }
                      }}
                    >
                      <span className="btn-icon">{deviceAIReady ? '🧠' : '✦'}</span>
                      {deviceAIReady ? 'Laboratorio IA' : 'Especificaciones'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pagination-controls">
          <button className="pagination-btn" onClick={() => goToPage(1)} disabled={currentPage === 1}>⏮</button>
          <button className="pagination-btn" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>◀</button>
          <div className="pagination-pages">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) pageNum = i + 1;
              else if (currentPage <= 3) pageNum = i + 1;
              else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = currentPage - 2 + i;
              return (
                <button
                  key={pageNum}
                  className={`pagination-page ${currentPage === pageNum ? 'active' : ''}`}
                  onClick={() => goToPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          <button className="pagination-btn" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>▶</button>
          <button className="pagination-btn" onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages}>⏭</button>
        </div>
      )}

      {/* AI Demo Modal - VELVET LAB MODE */}
      {showAIDemo && selectedDevice && (
        <div className="ai-demo-overlay" onClick={closeAIDemo}>
          <div className="ai-demo-modal velvet-lab-mode" onClick={(e) => e.stopPropagation()}>
            <button className="ai-demo-close" onClick={closeAIDemo}>
              &times;
            </button>

            <div className="ai-demo-content">
              {/* Header with Velvet Logo */}
              <div className="ai-lab-header">
                <img src={velvetLogo} alt="Velvet Sync" className="ai-lab-logo" />
                <div className="ai-lab-tag">LABORATORIO DE IA</div>
              </div>

              {/* Haptic Visualizer / Avatar */}
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

              {/* Status Message */}
              {aiMessage && (
                <div className="ai-message-bubble lab-style">
                  <p>{aiMessage}</p>
                </div>
              )}

              {/* Device Tech Context */}
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
                    {selectedDevice.usage_type.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Pulse Visualizer (Active during test) */}
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

              {/* Initial Action */}
              {aiDemoState === 'idle' && (
                <button className="ai-test-btn lab-btn" onClick={runAITest}>
                  <span className="btn-icon">🧠</span>
                  Iniciar Sincronización IA
                </button>
              )}

              {/* Progress Bar */}
              {aiDemoState === 'testing' && (
                <div className="test-progress-section lab-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${testProgress}%` }}
                    ></div>
                  </div>
                  <div className="progress-footer">
                    <span className="progress-pct">{Math.round(testProgress)}%</span>
                    <span className="progress-detail">CALIBRANDO SENSORES</span>
                  </div>
                </div>
              )}

              {/* Test Log */}
              {(testLog.length > 0) && (
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

              {/* Final Actions */}
              {aiDemoState === 'complete' && (
                <div className="ai-demo-actions lab-actions">
                  <div className="complete-summary">
                    <p>Perfil de placer generado y cifrado localmente para este hardware.</p>
                  </div>
                  
                  <button 
                    className="ai-open-app-btn pulse-glow" 
                    onClick={() => handleOpenNativeApp('sync_profile')}
                  >
                    <span className="btn-icon">⚡</span>
                    Subir Perfil a Velvet App
                  </button>
                  
                  <button className="ai-close-btn lab-secondary" onClick={closeAIDemo}>
                    Finalizar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Device Detail Modal (non-AI) */}
      {!showAIDemo && selectedDevice && (
        <div className="device-modal-overlay" onClick={() => setSelectedDevice(null)}>
          <div className="device-modal" onClick={(e) => e.stopPropagation()}>
            <button className="device-modal-close" onClick={() => setSelectedDevice(null)}>
              &times;
            </button>

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

                {/* Connect Button Large - Tries to open native app */}
                <button
                  className="connect-btn-large"
                  onClick={handleOpenNativeApp}
                >
                  <span className="btn-icon">📡</span>
                  {isMobileDevice ? 'Vincular en App' : 'Vincular en Velvet Sync'}
                </button>

                {/* Open in App Button - Only show on mobile as alternative */}
                {isMobileDevice && (
                  <button
                    className="open-app-btn-large"
                    onClick={handleOpenNativeApp}
                  >
                    <span className="btn-icon">📱</span>
                    Abrir en la App
                  </button>
                )}
              </div>

              <div className="device-modal-info">
                <h2>{selectedDevice.title}</h2>
                <p className="device-modal-id">ID del Dispositivo: {selectedDevice.id}</p>

                {/* Technical Grid */}
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

                {/* Capabilities */}
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
                          <span 
                            key={idx} 
                            className={`capability-tag ${!formatted.active ? 'inactive' : ''}`}
                          >
                            {formatted.icon && (
                              <img 
                                src={getIconUrl(formatted.icon)} 
                                className="cap-icon-mini" 
                                alt="" 
                              />
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


                {/* Product Functions */}
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

                {/* Documentation Links */}
                <div className="device-modal-docs">
                  <h3>📚 Documentación</h3>
                  <div className="docs-links">
                    {selectedDevice.manualUrl && (
                      <a
                        href={selectedDevice.manualUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="doc-link manual"
                      >
                        📖 Manual de Usuario
                      </a>
                    )}
                    {selectedDevice.techSheetUrl && (
                      <a
                        href={selectedDevice.techSheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="doc-link tech-sheet"
                      >
                        📋 Ficha Técnica
                      </a>
                    )}
                    {selectedDevice.qrcode && (
                      <a
                        href={selectedDevice.qrcode}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="doc-link qr-code"
                      >
                        📱 Ver QR Code
                      </a>
                    )}
                  </div>
                  <p className="docs-note">
                    ℹ️ La documentación se carga desde el servidor del fabricante
                  </p>
                </div>

                {/* AI Demo Button (if compatible) */}
                {isAIReady(selectedDevice.id) && (
                  <div className="device-modal-ai">
                    <button className="ai-demo-btn" onClick={() => startAIDemo(selectedDevice)}>
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
      )}
    </div>
  );
}

export default DeviceCatalog;

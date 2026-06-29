import { useState, useEffect, useMemo, useCallback, startTransition, useDeferredValue } from 'react';
import { supabase } from '../lib/supabase';
import { getDeviceImage, getDeviceQR, getDevicePDF, getIconUrl } from '../utils/mediaUtils';
import { isMobile } from '../utils/deepLinking';
import { useDebounce } from '../hooks/usePerformance';
import { FEATURE_MAP } from '../utils/deviceFeatures';
import { GITHUB_BASE } from '../config/constants';
import { DeviceCard } from './DeviceCard';
import DeviceModal from './DeviceModal';
import AIDemoModal from './AIDemoModal';
import PDFViewerModal from './PDFViewerModal';

const STIM_ALIASES = {
  intera: 'interactive'
};


const velvetLogo = `${GITHUB_BASE}/logo_velvet.png`;

import './DeviceCatalog.css';

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

function DeviceCatalog() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 100);
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [showAIFilter, setShowAIFilter] = useState(false);

  const [selectedUsageType, setSelectedUsageType] = useState('');
  const [selectedAnatomy, setSelectedAnatomy] = useState('');
  const [selectedStimulation, setSelectedStimulation] = useState('');

  const [showAIDemo, setShowAIDemo] = useState(false);

  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfTitle, setPdfTitle] = useState('');
  const [pdfType, setPdfType] = useState('pdf');

  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    setIsMobileDevice(isMobile());
  }, []);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedFeatures, showAIFilter, selectedUsageType, selectedAnatomy, selectedStimulation]);

  const AI_READY_DEVICES = useMemo(() => new Set([
    8154, 7043, 8131, 8815, 8215, 8001,
  ]), []);

  const isAIReady = useCallback((deviceId) => AI_READY_DEVICES.has(deviceId), [AI_READY_DEVICES]);

  const normalizeField = (value) => {
    if (!value) return null;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.map(item => String(item).toLowerCase().trim());
        }
        return [String(parsed).toLowerCase().trim()];
      } catch {
        return value.split(',').map(item => item.toLowerCase().trim());
      }
    }
    if (Array.isArray(value)) {
      return value.map(item => String(item).toLowerCase().trim());
    }
    if (typeof value === 'object') {
      return Object.entries(value)
        .filter(([, v]) => v)
        .map(([k]) => k.toLowerCase().trim());
    }
    return [String(value).toLowerCase().trim()];
  };

  const mapDeviceFromSupabase = useCallback((device) => {
    let motors = [];
    if (device.supported_funcs) {
      if (typeof device.supported_funcs === 'string') {
        try {
          const parsed = JSON.parse(device.supported_funcs);
          if (typeof parsed === 'object' && parsed !== null) {
            motors = Object.entries(parsed).filter(([, v]) => v).map(([k]) => k);
          } else {
            motors = device.supported_funcs.split(/[|,;]/).map(f => f.trim()).filter(Boolean);
          }
        } catch {
          motors = device.supported_funcs.split(/[|,;]/).map(f => f.trim()).filter(Boolean);
        }
      }
    }

    const funcObj = {
      CH1: device.motor_logic === 'single' || device.motor_logic === 'dual',
      CH2: device.motor_logic === 'dual'
    };

    const usageArr = normalizeField(device.usage_type);
    const anatomyArr = normalizeField(device.target_anatomy);
    const stimArr = normalizeField(device.stimulation_type) || [];

    const stimFromFuncs = motors
      .filter(k => STIM_ALIASES[k.toLowerCase()])
      .map(k => STIM_ALIASES[k.toLowerCase()]);

    const mergedStim = [...new Set([...stimArr, ...stimFromFuncs])];

    const title = device.model_name || `Dispositivo ${device.id}`;
    const barcode = device.barcode || device.id.toString();

    return {
      ...device,
      title,
      pics: device.image_url || getDeviceImage(device.id),
      qrcode: device.qr_code_url || getDeviceQR(device.id),
      motors,
      funcObj,
      isPrecise: device.is_precise_new ? 1 : 0,
      barcode,
      _searchKey: `${title.toLowerCase()} ${barcode.toLowerCase()} ${device.id}`,
      manualUrl: device.ficha_tecnica_url || getDevicePDF(device.id),
      techSheetUrl: device.ficha_tecnica_url || getDevicePDF(device.id),
      usage_type: usageArr?.[0] || 'universal',
      target_anatomy: anatomyArr || ['universal'],
      stimulation_type: mergedStim.length > 0 ? mergedStim : ['vibration']
    };
  }, []);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const { data, error } = await supabase
          .from('device_catalog')
          .select('id, model_name, image_url, qr_code_url, ficha_tecnica_url, motor_logic, is_precise_new, supported_funcs, usage_type, target_anatomy, stimulation_type')
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
  }, [mapDeviceFromSupabase]);

  const allFeatures = useMemo(() => {
    const featuresSet = new Set();

    devices.forEach(device => {
      if (!device.motors) return;

      const rawMotors = Array.isArray(device.motors) ? device.motors : [device.motors];

      rawMotors.forEach(rawItem => {
        if (!rawItem) return;

        let str = typeof rawItem === 'string' ? rawItem : JSON.stringify(rawItem);

        let cleaned = str.replace(/{|}|"|\[|\]/g, '');

        const parts = cleaned.split(/[|,]/);

        parts.forEach(part => {
          let key = part.split(':')[0].trim();

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

  const filteredDevices = useMemo(() => {
    const hasSearch = debouncedSearchTerm.trim();
    const searchTermLower = hasSearch ? debouncedSearchTerm.toLowerCase().trim() : '';
    const hasFeatures = selectedFeatures.length > 0;

    const result = [];

    for (let i = 0; i < devices.length; i++) {
      const device = devices[i];

      if (showAIFilter && !isAIReady(device.id)) continue;
      if (selectedUsageType && device.usage_type !== selectedUsageType) continue;
      if (selectedAnatomy && !device.target_anatomy?.includes(selectedAnatomy)) continue;

      if (selectedStimulation) {
        const stimArr = device.stimulation_type;
        if (!stimArr) continue;
        let found = false;
        for (let s = 0; s < stimArr.length; s++) {
          if (stimArr[s] === selectedStimulation || stimArr[s].includes(selectedStimulation)) {
            found = true;
            break;
          }
        }
        if (!found) continue;
      }

      if (hasSearch) {
        if (!device._searchKey.includes(searchTermLower)) continue;
      }

      if (hasFeatures) {
        const motors = device.motors;
        if (!motors) continue;
        let found = false;
        for (let m = 0; m < motors.length; m++) {
          if (selectedFeatures.includes(motors[m])) {
            found = true;
            break;
          }
        }
        if (!found) continue;
      }

      result.push(device);
    }

    result.sort((a, b) => a.id - b.id);
    return result;
  }, [devices, debouncedSearchTerm, selectedFeatures, showAIFilter, selectedUsageType, selectedAnatomy, selectedStimulation, isAIReady]);

  const deferredFilteredDevices = useDeferredValue(filteredDevices);

  const totalPages = Math.ceil(filteredDevices.length / itemsPerPage);
  const currentPageDevices = deferredFilteredDevices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPage = useCallback((page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [totalPages]);

  const toggleFeature = useCallback((feature) => {
    setSelectedFeatures(prev =>
      prev.includes(feature)
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedFeatures([]);
    setShowAIFilter(false);
    setSelectedUsageType('');
    setSelectedAnatomy('');
    setSelectedStimulation('');
  }, []);

  const startAIDemo = useCallback((device) => {
    setSelectedDevice(device);
    setShowAIDemo(true);
  }, []);

  const closeAIDemo = useCallback(() => {
    setShowAIDemo(false);
  }, []);

  const handleOpenNativeApp = useCallback(async (action = 'connect') => {
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
      console.log('📡 Sincronización enviada a Supabase:');
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

  const openPdfViewer = useCallback((url, title, type = 'pdf') => {
    setPdfUrl(url);
    setPdfTitle(title);
    setPdfType(type);
    setShowPdfViewer(true);
  }, []);

  const closePdfViewer = useCallback(() => {
    setShowPdfViewer(false);
    setPdfUrl('');
    setPdfTitle('');
  }, []);

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

      <div className="filters-section">
        <div className="pagination-per-page">
          <label>📄 Mostrar:</label>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={20}>20 dispositivos</option>
            <option value={50}>50 dispositivos</option>
            <option value={100}>100 dispositivos</option>
          </select>
          <span className="items-label">por página</span>
        </div>

        <div className="taxonomy-filters">
          <h3 className="taxonomy-title">🔬 Taxonomía de Filtros Visuales</h3>

          <div className="taxonomy-visual-grid">
            {Object.entries(TAXONOMY_OPTIONS).map(([key, options]) => (
              <div key={key} className="taxonomy-visual-group">
                <label className="taxonomy-label">
                  {key === 'usage' ? 'Tipo de Uso:' : key === 'anatomy' ? 'Anatomía Objetivo:' : 'Tipo de Estimulación:'}
                </label>
                <div className="taxonomy-chips">
                  {options.map(opt => {
                    const selectedValue = key === 'usage' ? selectedUsageType : key === 'anatomy' ? selectedAnatomy : selectedStimulation;
                    const setter = key === 'usage' ? setSelectedUsageType : key === 'anatomy' ? setSelectedAnatomy : setSelectedStimulation;
                    return (
                      <button
                        key={opt.value}
                        className={`taxonomy-chip ${selectedValue === opt.value ? 'active' : ''}`}
                        onClick={() => setter(opt.value)}
                      >
                        <span className="chip-icon">
                          <img
                            src={getIconUrl(opt.icon)}
                            alt=""
                            className="taxonomy-icon-img"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        </span>
                        <span className="chip-label">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

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

        {(searchTerm || selectedFeatures.length > 0 || showAIFilter || selectedUsageType || selectedAnatomy || selectedStimulation) && (
          <div className="active-filters">
            <span className="active-filters-label">Filtros activos:</span>
            {selectedUsageType && (
              <span className="active-filter-tag taxonomy-tag">
                📊 Uso: {{
                  external: 'Externo',
                  internal: 'Interno',
                  universal: 'Universal'
                }[selectedUsageType] || selectedUsageType}
                <button onClick={() => setSelectedUsageType('')}>✕</button>
              </span>
            )}
            {selectedAnatomy && (
              <span className="active-filter-tag taxonomy-tag">
                🎯 Anatomía: {{
                  clitoral: 'Clítoris',
                  vaginal: 'Vaginal',
                  anal: 'Anal',
                  prostate: 'Próstata',
                  universal: 'Universal'
                }[selectedAnatomy] || selectedAnatomy}
                <button onClick={() => setSelectedAnatomy('')}>✕</button>
              </span>
            )}
            {selectedStimulation && (
              <span className="active-filter-tag taxonomy-tag">
                ⚡ Estimulación: {{
                  vibration: 'Vibración',
                  suction: 'Succión',
                  thrust: 'Empuje',
                  heating: 'Calentamiento',
                  interactive: 'Interactivo'
                }[selectedStimulation] || selectedStimulation}
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

      <div className="device-gallery">
        {deferredFilteredDevices.length === 0 ? (
          <div className="no-results">
            <h3>⚠ Sin Resultados</h3>
            <p>No hay dispositivos que coincidan con los filtros seleccionados.</p>
            <button className="clear-filters-btn" onClick={clearFilters}>
              Limpiar filtros
            </button>
          </div>
        ) : (
          <>
            <div className="pagination-info">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, deferredFilteredDevices.length)} de {deferredFilteredDevices.length} dispositivos
            </div>
            {currentPageDevices.map(device => (
              <DeviceCard
                key={device.id}
                device={device}
                isAIReady={isAIReady}
                onStartAIDemo={startAIDemo}
                onSelectDevice={setSelectedDevice}
              />
            ))}
          </>
        )}
      </div>

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

      {showAIDemo && selectedDevice && (
        <AIDemoModal
          selectedDevice={selectedDevice}
          onClose={closeAIDemo}
        />
      )}

      {!showAIDemo && selectedDevice && (
        <DeviceModal
          selectedDevice={selectedDevice}
          isAIReady={isAIReady}
          isMobileDevice={isMobileDevice}
          onClose={() => startTransition(() => setSelectedDevice(null))}
          onStartAIDemo={startAIDemo}
          onOpenNativeApp={handleOpenNativeApp}
          onOpenPdfViewer={openPdfViewer}
        />
      )}

      {showPdfViewer && (
        <PDFViewerModal
          pdfUrl={pdfUrl}
          pdfTitle={pdfTitle}
          pdfType={pdfType}
          onClose={closePdfViewer}
        />
      )}
    </div>
  );
}

export default DeviceCatalog;

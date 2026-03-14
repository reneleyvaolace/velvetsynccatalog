import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './CategoryManager.css';

/**
 * Category Manager - Admin Panel
 * Permite editar manualmente las categorías de los dispositivos
 */
function CategoryManager() {
  const [devices, setDevices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsageType, setSelectedUsageType] = useState('');
  const [selectedAnatomy, setSelectedAnatomy] = useState('');
  const [selectedStimulation, setSelectedStimulation] = useState('');
  const [savedChanges, setSavedChanges] = useState(0);
  const [showSavedNotification, setShowSavedNotification] = useState(false);

  // Category filter states
  const [filterUsageType, setFilterUsageType] = useState('');
  const [filterAnatomy, setFilterAnatomy] = useState('');
  const [filterStimulation, setFilterStimulation] = useState('');
  const [filterStatus, setFilterStatus] = useState(''); // complete, pending, all

  // Sort state
  const [sortBy, setSortBy] = useState('id'); // id, name, usageType, anatomy
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc

  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  // Bulk edit state
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [bulkUsageType, setBulkUsageType] = useState('');
  const [bulkAnatomy, setBulkAnatomy] = useState('');
  const [bulkStimulation, setBulkStimulation] = useState('');

  // Usage type options (Values match Supabase slugs, labels match UI)
  const usageOptions = [
    { value: 'external', label: 'Externo' },
    { value: 'internal', label: 'Interno' },
    { value: 'universal', label: 'Universal' }
  ];

  // Anatomy options
  const anatomyOptions = [
    { value: 'clitoral', label: 'Clítoris' },
    { value: 'vaginal', label: 'Vaginal' },
    { value: 'anal', label: 'Anal' },
    { value: 'prostate', label: 'Próstata' },
    { value: 'universal', label: 'Universal' }
  ];

  // Stimulation options
  const stimulationOptions = [
    { value: 'vibration', label: 'Vibración' },
    { value: 'suction', label: 'Succión' },
    { value: 'thrust', label: 'Empuje' },
    { value: 'heating', label: 'Calentamiento' },
    { value: 'interactive', label: 'Interactivo' }
  ];

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const { data, error } = await supabase
          .from('device_catalog')
          .select('*')
          .order('id', { ascending: true });
        
        if (error) throw error;
        if (data) {
          const mappedData = data.map(device => ({
            ...device,
            // Mapping Supabase fields to the current state expectation
            title: device.model_name,
            barcode: device.id.toString(),
            category: {
              usageType: device.usage_type || 'universal',
              targetAnatomy: device.target_anatomy || 'universal',
              stimulationType: device.stimulation_type || 'vibration'
            },
            motorLogic: device.motor_logic || 'single'
          }));
          setDevices(mappedData);
        }
      } catch (err) {
        console.error('Error fetching from Supabase:', err);
      }
    };
    fetchDevices();
  }, []);

  // Filter and sort devices
  const filteredDevices = useMemo(() => {
    let result = [...devices];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(device =>
        device.title.toLowerCase().includes(term) ||
        device.barcode.toLowerCase().includes(term) ||
        device.id.toString().includes(term)
      );
    }

    // Category filters
    if (filterUsageType) {
      result = result.filter(device =>
        device.category?.usageType === filterUsageType
      );
    }

    if (filterAnatomy) {
      result = result.filter(device =>
        device.category?.targetAnatomy === filterAnatomy
      );
    }

    if (filterStimulation) {
      result = result.filter(device =>
        device.category?.stimulationType === filterStimulation
      );
    }

    // Status filter
    if (filterStatus) {
      if (filterStatus === 'complete') {
        result = result.filter(device =>
          device.category?.usageType &&
          device.category?.targetAnatomy &&
          device.category?.stimulationType
        );
      } else if (filterStatus === 'pending') {
        result = result.filter(device =>
          !device.category?.usageType ||
          !device.category?.targetAnatomy ||
          !device.category?.stimulationType
        );
      }
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'id':
          comparison = a.id - b.id;
          break;
        case 'name':
          comparison = a.title.localeCompare(b.title, 'es');
          break;
        case 'usageType':
          comparison = (a.category?.usageType || '').localeCompare(b.category?.usageType || '', 'es');
          break;
        case 'anatomy':
          comparison = (a.category?.targetAnatomy || '').localeCompare(b.category?.targetAnatomy || '', 'es');
          break;
        case 'stimulation':
          comparison = (a.category?.stimulationType || '').localeCompare(b.category?.stimulationType || '', 'es');
          break;
        case 'status':
          const aComplete = a.category?.usageType && a.category?.targetAnatomy && a.category?.stimulationType;
          const bComplete = b.category?.usageType && b.category?.targetAnatomy && b.category?.stimulationType;
          comparison = (aComplete ? 0 : 1) - (bComplete ? 0 : 1);
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [devices, searchTerm, filterUsageType, filterAnatomy, filterStimulation, filterStatus, sortBy, sortOrder]);

  // Update device name
  const updateDeviceName = (deviceId, newName) => {
    setDevices(prev => prev.map(device => {
      if (device.id === deviceId) {
        return {
          ...device,
          title: newName
        };
      }
      return device;
    }));
  };

  // Start editing name
  const startEditing = (device) => {
    setEditingId(device.id);
    setEditingName(device.title);
  };

  // Save edited name
  const saveEditing = (deviceId) => {
    if (editingName.trim()) {
      updateDeviceName(deviceId, editingName.trim());
    }
    setEditingId(null);
    setEditingName('');
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
  };

  // Toggle device selection
  const toggleDeviceSelection = (deviceId) => {
    setSelectedDevices(prev =>
      prev.includes(deviceId)
        ? prev.filter(id => id !== deviceId)
        : [...prev, deviceId]
    );
  };

  // Select all visible devices
  const selectAllDevices = () => {
    if (selectedDevices.length === filteredDevices.length) {
      setSelectedDevices([]);
    } else {
      setSelectedDevices(filteredDevices.map(d => d.id));
    }
  };

  // Apply bulk edit
  const applyBulkEdit = () => {
    if (selectedDevices.length === 0) return;

    setDevices(prev => prev.map(device => {
      if (selectedDevices.includes(device.id)) {
        return {
          ...device,
          category: {
            usageType: bulkUsageType || device.category?.usageType || 'universal',
            targetAnatomy: bulkAnatomy || device.category?.targetAnatomy || 'universal',
            stimulationType: bulkStimulation || device.category?.stimulationType || 'vibration'
          }
        };
      }
      return device;
    }));

    // Reset bulk edit
    setSelectedDevices([]);
    setBulkUsageType('');
    setBulkAnatomy('');
    setBulkStimulation('');
    setSavedChanges(prev => prev + 1);
    setShowSavedNotification(true);
    setTimeout(() => setShowSavedNotification(false), 3000);
  };

  // Update category for a device
  const updateCategory = (deviceId, field, value) => {
    setDevices(prev => prev.map(device => {
      if (device.id === deviceId) {
        return {
          ...device,
          category: {
            ...device.category,
            [field]: value
          }
        };
      }
      return device;
    }));
  };

  // Update motor logic for a device
  const updateMotorLogic = (deviceId, value) => {
    setDevices(prev => prev.map(device => {
      if (device.id === deviceId) {
        return {
          ...device,
          motorLogic: value
        };
      }
      return device;
    }));
  };

  // Save changes to Supabase
  const saveToDatabase = async () => {
    try {
      // Prepare data for update
      const updates = devices.map(device => ({
        id: device.id,
        model_name: device.title,
        usage_type: device.category.usageType,
        target_anatomy: device.category.targetAnatomy,
        stimulation_type: device.category.stimulationType,
        motor_logic: device.motorLogic.includes('Dual') ? 'dual' : 'single',
        updated_at: new Date().toISOString()
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('device_catalog')
          .update({
            model_name: update.model_name,
            usage_type: update.usage_type,
            target_anatomy: update.target_anatomy,
            stimulation_type: update.stimulation_type,
            motor_logic: update.motor_logic
          })
          .eq('id', update.id);

        if (error) throw error;
      }

      setSavedChanges(0);
      setShowSavedNotification(true);
      setTimeout(() => setShowSavedNotification(false), 3000);
    } catch (err) {
      console.error('Error saving to Supabase:', err);
      alert('Error al guardar en la base de datos');
    }
  };

  // Export updated devices to JSON
  const exportToJson = () => {
    const dataStr = JSON.stringify(devices, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'compatible_devices_updated.json';
    link.click();
    URL.revokeObjectURL(url);
    
    setSavedChanges(prev => prev + 1);
    setShowSavedNotification(true);
    setTimeout(() => setShowSavedNotification(false), 3000);
  };

  // Copy to clipboard
  const copyToClipboard = () => {
    const dataStr = JSON.stringify(devices, null, 2);
    navigator.clipboard.writeText(dataStr);
    
    setSavedChanges(prev => prev + 1);
    setShowSavedNotification(true);
    setTimeout(() => setShowSavedNotification(false), 3000);
  };

  // Reset to original
  const resetToOriginal = () => {
    if (window.confirm('¿Estás seguro de que quieres recargar los datos originales? Se perderán los cambios no guardados.')) {
      window.location.reload();
    }
  };

  // Get badge color based on category
  const getCategoryBadgeClass = (category) => {
    if (!category) return 'category-badge unknown';
    
    const { usageType, targetAnatomy, stimulationType } = category;
    
    if (usageType === 'external') return 'category-badge masculino';
    if (usageType === 'internal') return 'category-badge femenino';
    if (targetAnatomy === 'prostate') return 'category-badge prostata';
    if (targetAnatomy === 'clitoral') return 'category-badge clitoris';
    if (targetAnatomy === 'vaginal') return 'category-badge vaginal';
    if (targetAnatomy === 'anal') return 'category-badge anal';
    if (stimulationType === 'interactive') return 'category-badge interactivo';
    
    return 'category-badge universal';
  };

  return (
    <div className="category-manager">
      {/* Header */}
      <header className="manager-header">
        <div className="header-content">
          <div className="header-top">
            <h1 className="manager-title">
              <span className="title-icon">🔬</span>
              Gestor de Categorías - Velvet Sync
            </h1>
            <Link to="/" className="catalog-link">
              📱 Ver Catálogo →
            </Link>
          </div>
          <p className="manager-subtitle">
            Clasifica manualmente los dispositivos por tipo de uso, anatomía objetivo y tipo de estimulación
          </p>
        </div>

        {/* Action Buttons */}
        <div className="header-actions">
          <button className="action-btn reset-btn" onClick={resetToOriginal}>
            🔄 Recargar Originales
          </button>
          <button className="action-btn copy-btn" onClick={copyToClipboard}>
            📋 Copiar JSON
          </button>
          <button className="action-btn export-btn" onClick={saveToDatabase}>
            💾 Guardar en DB
          </button>
          <button className="action-btn export-btn" onClick={exportToJson}>
            📥 Descargar JSON
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-value">{devices.length}</span>
          <span className="stat-label">Dispositivos</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{devices.filter(d => d.category?.usageType === 'external').length}</span>
          <span className="stat-label">Externo</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{devices.filter(d => d.category?.usageType === 'internal').length}</span>
          <span className="stat-label">Interno</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{devices.filter(d => d.category?.usageType === 'universal').length}</span>
          <span className="stat-label">Universal</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{savedChanges}</span>
          <span className="stat-label">Cambios</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <input
          type="text"
          className="search-input-large"
          placeholder="🔍 Buscar por nombre, barcode o ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Category Filters & Sort */}
      <div className="filters-sort-section">
        <div className="filters-group">
          <h3 className="filters-title">🔽 Filtrar por Categoría:</h3>
          <div className="filters-grid">
            <div className="filter-item">
              <label className="filter-label">Tipo de Uso:</label>
              <select
                className="filter-select"
                value={filterUsageType}
                onChange={(e) => setFilterUsageType(e.target.value)}
              >
                <option value="">Todos</option>
                {usageOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label className="filter-label">Anatomía:</label>
              <select
                className="filter-select"
                value={filterAnatomy}
                onChange={(e) => setFilterAnatomy(e.target.value)}
              >
                <option value="">Todas</option>
                {anatomyOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label className="filter-label">Estimulación:</label>
              <select
                className="filter-select"
                value={filterStimulation}
                onChange={(e) => setFilterStimulation(e.target.value)}
              >
                <option value="">Todas</option>
                {stimulationOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label className="filter-label">Estado:</label>
              <select
                className="filter-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="complete">✓ Completos</option>
                <option value="pending">⚠ Pendientes</option>
              </select>
            </div>
          </div>
        </div>

        <div className="sort-group">
          <h3 className="filters-title">📊 Ordenar por:</h3>
          <div className="sort-controls">
            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="id">ID</option>
              <option value="name">Nombre</option>
              <option value="usageType">Tipo de Uso</option>
              <option value="anatomy">Anatomía</option>
              <option value="stimulation">Estimulación</option>
              <option value="status">Estado</option>
            </select>

            <button
              className="sort-order-btn"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              title={sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
            >
              {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
            </button>

            {(filterUsageType || filterAnatomy || filterStimulation) && (
              <button className="clear-filters-btn" onClick={() => {
                setFilterUsageType('');
                setFilterAnatomy('');
                setFilterStimulation('');
              }}>
                🧹 Limpiar Filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Devices Table */}

      {/* Bulk Edit Panel */}
      {selectedDevices.length > 0 && (
        <div className="bulk-edit-panel">
          <div className="bulk-header">
            <h3 className="bulk-title">
              📝 Edición Masiva - {selectedDevices.length} dispositivo(s) seleccionado(s)
            </h3>
            <button className="bulk-clear-btn" onClick={() => setSelectedDevices([])}>
              ✕ Deseleccionar
            </button>
          </div>

          <div className="bulk-form">
            <div className="bulk-form-group">
              <label className="bulk-label">Tipo de Uso:</label>
              <select
                className="bulk-select"
                value={bulkUsageType}
                onChange={(e) => setBulkUsageType(e.target.value)}
              >
                <option value="">Sin cambiar</option>
                {usageOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="bulk-form-group">
              <label className="bulk-label">Anatomía:</label>
              <select
                className="bulk-select"
                value={bulkAnatomy}
                onChange={(e) => setBulkAnatomy(e.target.value)}
              >
                <option value="">Sin cambiar</option>
                {anatomyOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="bulk-form-group">
              <label className="bulk-label">Estimulación:</label>
              <select
                className="bulk-select"
                value={bulkStimulation}
                onChange={(e) => setBulkStimulation(e.target.value)}
              >
                <option value="">Sin cambiar</option>
                {stimulationOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <button className="bulk-apply-btn" onClick={applyBulkEdit}>
              ✓ Aplicar Cambios
            </button>
          </div>
        </div>
      )}

      <div className="devices-table-container">
        <table className="devices-table">
          <thead>
            <tr>
              <th className="col-select">
                <input
                  type="checkbox"
                  className="select-all-checkbox"
                  checked={selectedDevices.length === filteredDevices.length && filteredDevices.length > 0}
                  onChange={selectAllDevices}
                  title="Seleccionar todos"
                />
              </th>
              <th className="col-id">ID</th>
              <th className="col-name">Nombre</th>
              <th className="col-motor">Motor Logic</th>
              <th className="col-usage">Tipo de Uso</th>
              <th className="col-anatomy">Anatomía</th>
              <th className="col-stimulation">Estimulación</th>
              <th className="col-status">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filteredDevices.map((device) => (
              <tr key={device.id} className={`device-row ${selectedDevices.includes(device.id) ? 'selected' : ''}`}>
                {/* Select Checkbox */}
                <td className="cell-select">
                  <input
                    type="checkbox"
                    className="device-checkbox"
                    checked={selectedDevices.includes(device.id)}
                    onChange={() => toggleDeviceSelection(device.id)}
                    title="Seleccionar dispositivo"
                  />
                </td>

                {/* ID */}
                <td className="cell-id">
                  <span className="id-badge">#{device.id}</span>
                </td>
                
                {/* Name */}
                <td className="cell-name">
                  {editingId === device.id ? (
                    <div className="edit-name-container">
                      <input
                        type="text"
                        className="name-edit-input"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEditing(device.id);
                          if (e.key === 'Escape') cancelEditing();
                        }}
                        autoFocus
                      />
                      <div className="edit-actions">
                        <button className="edit-save-btn" onClick={() => saveEditing(device.id)}>
                          ✓ Guardar
                        </button>
                        <button className="edit-cancel-btn" onClick={() => cancelEditing()}>
                          ✕ Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="name-container">
                      <button className="edit-name-btn" onClick={() => startEditing(device)}>
                        ✏️ {device.title}
                      </button>
                      {device.category && (
                        <span className={getCategoryBadgeClass(device.category)}>
                          {usageOptions.find(o => o.value === device.category.usageType)?.label || device.category.usageType}
                        </span>
                      )}
                    </div>
                  )}
                  <span className="device-barcode">Barcode: {device.barcode}</span>
                </td>
                
                {/* Motor Logic */}
                <td className="cell-motor">
                  <select
                    className="motor-select"
                    value={device.motorLogic || 'Single Channel'}
                    onChange={(e) => updateMotorLogic(device.id, e.target.value)}
                  >
                    <option value="Single Channel">Single Channel</option>
                    <option value="Dual Channel (0xD + 0xA)">Dual Channel (0xD + 0xA)</option>
                  </select>
                </td>
                
                {/* Usage Type */}
                <td className="cell-usage">
                  <select
                    className="category-select"
                    value={device.category?.usageType || 'universal'}
                    onChange={(e) => updateCategory(device.id, 'usageType', e.target.value)}
                  >
                    <option value="">Seleccionar...</option>
                    {usageOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </td>
                
                {/* Target Anatomy */}
                <td className="cell-anatomy">
                  <select
                    className="category-select"
                    value={device.category?.targetAnatomy || 'universal'}
                    onChange={(e) => updateCategory(device.id, 'targetAnatomy', e.target.value)}
                  >
                    <option value="">Seleccionar...</option>
                    {anatomyOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </td>
                
                {/* Stimulation Type */}
                <td className="cell-stimulation">
                  <select
                    className="category-select"
                    value={device.category?.stimulationType || 'vibration'}
                    onChange={(e) => updateCategory(device.id, 'stimulationType', e.target.value)}
                  >
                    <option value="">Seleccionar...</option>
                    {stimulationOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </td>
                
                {/* Status */}
                <td className="cell-status">
                  {device.category?.usageType && device.category?.targetAnatomy && device.category?.stimulationType ? (
                    <span className="status-complete">✓ Completo</span>
                  ) : (
                    <span className="status-pending">⚠ Pendiente</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Saved Notification */}
      {showSavedNotification && (
        <div className="saved-notification">
          ✓ ¡Cambios guardados exitosamente!
        </div>
      )}

      {/* Instructions */}
      <div className="instructions-panel">
        <h3>📖 Instrucciones de Uso:</h3>
        <ol>
          <li><strong>Buscar:</strong> Usa la barra de búsqueda para encontrar dispositivos por nombre, barcode o ID.</li>
          <li><strong>Clasificar:</strong> Selecciona el Tipo de Uso, Anatomía Objetivo y Tipo de Estimulación para cada dispositivo.</li>
          <li><strong>Motor Logic:</strong> Define si es Single Channel o Dual Channel (0xD + 0xA).</li>
          <li><strong>Guardar:</strong> Haz clic en "Descargar JSON" para obtener el archivo actualizado.</li>
          <li><strong>Actualizar:</strong> Reemplaza el archivo <code>src/data/compatible_devices.json</code> con el descargado.</li>
        </ol>
        
        <div className="legend">
          <h4>Leyenda:</h4>
          <div className="legend-item">
            <span className="legend-badge masculino">Externo</span>
            <span>Dispositivos diseñados para uso externo</span>
          </div>
          <div className="legend-item">
            <span className="legend-badge femenino">Interno</span>
            <span>Dispositivos diseñados para uso interno</span>
          </div>
          <div className="legend-item">
            <span className="legend-badge universal">Universal</span>
            <span>Dispositivos de uso universal</span>
          </div>
          <div className="legend-item">
            <span className="status-complete">✓ Completo</span>
            <span>Todas las categorías asignadas</span>
          </div>
          <div className="legend-item">
            <span className="status-pending">⚠ Pendiente</span>
            <span>Faltan categorías por asignar</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CategoryManager;

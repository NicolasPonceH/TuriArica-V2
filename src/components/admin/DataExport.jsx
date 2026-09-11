import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  Layers,
  MapPin,
  Bus,
  ShieldAlert,
  Lightbulb,
  X,
  HardDrive
} from 'lucide-react';
import { usePlaces } from '../../contexts/PlacesContext';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  getLiveRoutesGeoJSON,
  getLiveZonesGeoJSON,
  getLiveMeetingPoints,
  getLiveLightsGeoJSON,
  getLiveTransitLinesGeoJSON,
  resetAllGeoDataToDefault
} from '../../data/mapGeoData';

export default function DataExport() {
  const { exportData, importData, adminPlaces, places } = usePlaces();
  const { t } = useLanguage();
  const fileInputRef = useRef(null);

  // Notification Toast State
  const [toast, setToast] = useState(null);

  // Custom Modal Confirmation State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    confirmVariant: 'danger',
    onConfirm: null
  });

  // Layer statistics state
  const [stats, setStats] = useState({
    placesCount: 0,
    transitCount: 0,
    routesCount: 0,
    zonesCount: 0,
    meetingCount: 0,
    lightsCount: 0
  });

  const loadStats = () => {
    try {
      const routes = getLiveRoutesGeoJSON();
      const zones = getLiveZonesGeoJSON();
      const meetings = getLiveMeetingPoints();
      const lights = getLiveLightsGeoJSON();
      const transit = getLiveTransitLinesGeoJSON();

      setStats({
        placesCount: places?.length || 0,
        transitCount: transit?.features?.length || 0,
        routesCount: routes?.features?.length || 0,
        zonesCount: zones?.features?.length || 0,
        meetingCount: meetings?.length || 0,
        lightsCount: lights?.features?.length || 0
      });
    } catch (e) {
      console.warn('Error loading stats:', e);
    }
  };

  useEffect(() => {
    loadStats();
  }, [places]);

  const showToast = (message, type = 'success') => {
    setToast({ id: Date.now(), message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  // 1. Export SQLite Raw Database (.db)
  const handleExportDatabase = () => {
    try {
      const downloadUrl = 'http://localhost:5000/api/backup/db';
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `turiarica_backup_${new Date().toISOString().slice(0, 10)}.db`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('Descargando archivo binario de Base de Datos SQLite (turiarica.db)...', 'success');
    } catch (e) {
      console.error(e);
      showToast('No se pudo conectar con el servidor para descargar la base de datos.', 'error');
    }
  };

  // 2. Export Unified GeoJSON
  const handleExportUnifiedGeoJSON = () => {
    try {
      const routes = getLiveRoutesGeoJSON()?.features || [];
      const zones = getLiveZonesGeoJSON()?.features || [];
      const lights = getLiveLightsGeoJSON()?.features || [];
      const transit = getLiveTransitLinesGeoJSON()?.features || [];
      const meetings = getLiveMeetingPoints() || [];

      const meetingFeatures = meetings.map((m) => ({
        type: 'Feature',
        properties: {
          id: m.id,
          name: m.name,
          address: m.address,
          capacidad: m.capacidad,
          tipo: 'punto_encuentro',
          layer_group: 'seguridad'
        },
        geometry: {
          type: 'Point',
          coordinates: [m.lng, m.lat]
        }
      }));

      const unifiedFeatures = [
        ...routes.map(f => ({ ...f, properties: { ...f.properties, layer_group: 'evacuacion' } })),
        ...zones.map(f => ({ ...f, properties: { ...f.properties, layer_group: 'inundacion' } })),
        ...lights.map(f => ({ ...f, properties: { ...f.properties, layer_group: 'luminarias' } })),
        ...transit.map(f => ({ ...f, properties: { ...f.properties, layer_group: 'transporte_publico' } })),
        ...meetingFeatures
      ];

      const fullGeoJSON = {
        type: 'FeatureCollection',
        metadata: {
          project: 'TuriArica',
          generator: 'TuriArica Cartography Engine',
          exported_at: new Date().toISOString(),
          total_features: unifiedFeatures.length
        },
        features: unifiedFeatures
      };

      const blob = new Blob([JSON.stringify(fullGeoJSON, null, 2)], { type: 'application/geo+json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `turiarica_cartografia_completa_${new Date().toISOString().slice(0, 10)}.geojson`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast(`GeoJSON unificado exportado con éxito (${unifiedFeatures.length} elementos espaciales).`, 'success');
    } catch (e) {
      console.error(e);
      showToast('Error al compilar el archivo GeoJSON unificado.', 'error');
    }
  };

  // 3. Export Places JSON
  const handleExportPlacesJSON = () => {
    try {
      const data = exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `turiarica_lugares_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Archivo JSON de lugares turísticos exportado correctamente.', 'success');
    } catch (e) {
      console.error(e);
      showToast('Error al exportar lugares en JSON.', 'error');
    }
  };

  // 4. Import / Restore Places JSON
  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const success = importData(event.target.result);
      if (success) {
        showToast('Datos de lugares importados y sincronizados correctamente.', 'success');
        loadStats();
      } else {
        showToast('Error: El archivo no tiene un esquema JSON válido de TuriArica.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // 5. Reset Official Cartography Data
  const confirmResetOfficialData = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Restablecer Cartografía Oficial',
      message: '¿Estás seguro de restablecer todas las vías, zonas de tsunami, luminarias y transporte a las capas predeterminadas oficiales de Arica? Tus modificaciones locales se sobreescribirán.',
      confirmText: 'Sí, Restablecer Todo',
      confirmVariant: 'danger',
      onConfirm: () => {
        resetAllGeoDataToDefault();
        loadStats();
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        showToast('Cartografía y trazados restablecidos a los valores oficiales por defecto.', 'success');
      }
    });
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl backdrop-blur-xl border ${
              toast.type === 'success'
                ? 'bg-emerald-600/95 text-white border-emerald-400/40'
                : 'bg-rose-600/95 text-white border-rose-400/40'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 size={20} className="text-emerald-200 shrink-0" />
            ) : (
              <AlertTriangle size={20} className="text-rose-200 shrink-0" />
            )}
            <p className="text-sm font-semibold">{toast.message}</p>
            <button
              onClick={() => setToast(null)}
              className="ml-3 p-1 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100"
            >
              <div className="flex items-center gap-3 text-rose-600 mb-3">
                <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">{confirmModal.title}</h3>
              </div>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">{confirmModal.message}</p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmModal.onConfirm}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-200 transition-colors"
                >
                  {confirmModal.confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-4 border border-sky-100 shadow-sm text-center">
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-2">
            <MapPin size={18} />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.placesCount}</p>
          <p className="text-xs font-bold text-slate-500">Lugares</p>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-4 border border-sky-100 shadow-sm text-center">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-2">
            <Bus size={18} />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.transitCount}</p>
          <p className="text-xs font-bold text-slate-500">Líneas Transp.</p>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-4 border border-sky-100 shadow-sm text-center">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
            <Layers size={18} />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.routesCount}</p>
          <p className="text-xs font-bold text-slate-500">Vías Evacuación</p>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-4 border border-sky-100 shadow-sm text-center">
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-2">
            <ShieldAlert size={18} />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.zonesCount}</p>
          <p className="text-xs font-bold text-slate-500">Zonas Tsunami</p>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-4 border border-sky-100 shadow-sm text-center">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 size={18} />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.meetingCount}</p>
          <p className="text-xs font-bold text-slate-500">Ptos. Encuentro</p>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-4 border border-sky-100 shadow-sm text-center">
          <div className="w-8 h-8 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center mx-auto mb-2">
            <Lightbulb size={18} />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.lightsCount}</p>
          <p className="text-xs font-bold text-slate-500">Luminarias</p>
        </div>
      </div>

      {/* Main Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: SQLite Full Database Backup */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 border border-sky-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl border border-sky-100">
                <Database size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Base de Datos SQLite (.db)</h3>
                <p className="text-xs font-semibold text-slate-400">Servidor Backend / Persistencia Principal</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              Descarga una copia binaria exacta del archivo <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sky-700 font-mono">turiarica.db</code>. Contiene la totalidad de tablas de datos: usuarios administradores, catálogo de lugares turísticos, eventos, líneas de transporte y coordenadas viales.
            </p>
          </div>

          <button
            onClick={handleExportDatabase}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-md shadow-sky-200 transition-all active:scale-[0.99]"
          >
            <Download size={18} />
            <span>Descargar Base de Datos (.db)</span>
          </button>
        </div>

        {/* Card 2: Unified GeoJSON Export */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 border border-sky-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                <Layers size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Cartografía GeoJSON Unificada</h3>
                <p className="text-xs font-semibold text-slate-400">Estándar GIS / QGIS / Leaflet / Mapbox</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              Exporta en un único archivo <code className="bg-slate-100 px-1.5 py-0.5 rounded text-emerald-700 font-mono">.geojson</code> todas las capas espaciales activas de Arica: recorridos viales de micros/colectivos, vías de evacuación ante tsunami, polígonos de cota de riesgo, focos de luz nocturnos y puntos de encuentro.
            </p>
          </div>

          <button
            onClick={handleExportUnifiedGeoJSON}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-200 transition-all active:scale-[0.99]"
          >
            <Download size={18} />
            <span>Exportar Capas GeoJSON</span>
          </button>
        </div>

        {/* Card 3: Places & Tourism Content JSON */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 border border-sky-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
                <FileJson size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Respaldo de Lugares Turísticos</h3>
                <p className="text-xs font-semibold text-slate-400">Formato JSON portable</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              Genera una copia en JSON de los lugares agregados y modificados desde el panel de administración, incluyendo nombres, descripciones multilingües, coordenadas y enlaces multimedia.
            </p>
          </div>

          <button
            onClick={handleExportPlacesJSON}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md shadow-amber-200 transition-all active:scale-[0.99]"
          >
            <Download size={18} />
            <span>Exportar Lugares (JSON)</span>
          </button>
        </div>

        {/* Card 4: Import / Restore JSON */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 border border-sky-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl border border-purple-100">
                <Upload size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Restaurar Lugares desde JSON</h3>
                <p className="text-xs font-semibold text-slate-400">Importación directa de copia previa</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              Carga un archivo de respaldo JSON generado previamente por TuriArica para restaurar los puntos turísticos en el navegador o en la base de datos local.
            </p>
          </div>

          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md shadow-purple-200 transition-all active:scale-[0.99]"
            >
              <Upload size={18} />
              <span>Seleccionar Archivo JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone: Reset Default Cartography */}
      <div className="bg-rose-50/50 rounded-3xl p-6 border border-rose-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-rose-100 text-rose-700 rounded-2xl shrink-0">
            <RefreshCw size={22} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-rose-900">Restablecer Capas Cartográficas Oficiales</h4>
            <p className="text-xs text-rose-700 mt-0.5">
              Reinicia las vías de evacuación, polígonos de tsunami, luminarias y líneas de transporte a los datos oficiales predeterminados.
            </p>
          </div>
        </div>

        <button
          onClick={confirmResetOfficialData}
          className="shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-200 transition-all active:scale-[0.99]"
        >
          <RefreshCw size={15} />
          <span>Restablecer Datos Oficiales</span>
        </button>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bus, Car, Search, Plus, Compass, Trash2, Clock,
  DollarSign, MapPin, X, AlertTriangle, CheckCircle2,
  Route, ArrowRight
} from 'lucide-react';
import {
  getLiveTransitLinesGeoJSON,
  saveLiveTransitLines,
  LINEAS_TRANSPORTE_PUBLICO,
  GEODATA_UPDATED_EVENT
} from '../../data/mapGeoData';
import { resolveMediaUrl, API_BASE_URL } from '../../utils/constants';

export default function TransitList({ onTraceOnMap, onAddNew, notify }) {
  const [transitLines, setTransitLines] = useState(() => {
    const live = getLiveTransitLinesGeoJSON();
    return live?.features || LINEAS_TRANSPORTE_PUBLICO.features;
  });

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'micro' | 'colectivo'
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Sincronizar con API backend de SQLite y escuchar cambios en tiempo real
  useEffect(() => {
    const fetchBackendLines = () => {
      fetch(`${API_BASE_URL}/transit`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data && data.features && data.features.length > 0) {
            setTransitLines(data.features);
            saveLiveTransitLines(data.features);
          }
        })
        .catch(() => {});
    };
    fetchBackendLines();

    const handleUpdate = () => {
      const live = getLiveTransitLinesGeoJSON();
      setTransitLines(live?.features || LINEAS_TRANSPORTE_PUBLICO.features);
    };

    window.addEventListener(GEODATA_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(GEODATA_UPDATED_EVENT, handleUpdate);
  }, []);

  const filteredLines = transitLines.filter(line => {
    const props = line.properties || {};
    const matchesSearch = !search.trim() || (
      (props.nombre && props.nombre.toLowerCase().includes(search.toLowerCase())) ||
      (props.numero && String(props.numero).toLowerCase().includes(search.toLowerCase())) ||
      (props.paradas && props.paradas.some(p => p.nombre.toLowerCase().includes(search.toLowerCase())))
    );
    const matchesType = filterType === 'all' || props.tipo === filterType;
    return matchesSearch && matchesType;
  });

  const microCount = transitLines.filter(l => l.properties?.tipo === 'micro').length;
  const colectivoCount = transitLines.filter(l => l.properties?.tipo === 'colectivo').length;

  const handleDelete = async (id, nombre) => {
    try {
      await fetch(`${API_BASE_URL}/transit/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('[TRANSIT] Falló eliminación en backend:', e);
    }
    const updated = transitLines.filter(l => l.properties.id !== id);
    setTransitLines(updated);
    saveLiveTransitLines(updated);
    setConfirmDeleteId(null);
    if (notify) {
      notify({ type: 'success', text: `Línea "${nombre}" eliminada exitosamente.` });
    }
  };

  return (
    <div className="space-y-6 w-full text-left">
      {/* BARRA DE HERRAMIENTAS: BÚSQUEDA, FILTROS Y ACCIONES */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-sky-100 p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Buscador */}
          <div className="flex-1 flex items-center gap-2.5 bg-slate-50/80 rounded-2xl px-4 py-2.5 border border-slate-200/90 focus-within:border-sky-500 focus-within:bg-white transition-all">
            <Search size={18} className="text-sky-600 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por número, nombre de línea o parada..."
              className="flex-1 bg-transparent outline-none text-xs sm:text-sm text-slate-800 placeholder-slate-400 font-medium"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-xs text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Contador y Botón "+ Nueva Línea" */}
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="text-xs font-bold text-sky-800 bg-sky-50 border border-sky-100 px-3.5 py-2.5 rounded-2xl">
              {filteredLines.length} de {transitLines.length} líneas
            </span>
            <button
              onClick={onAddNew}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white text-xs sm:text-sm font-black shadow-md shadow-sky-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0"
            >
              <Plus size={16} />
              <span>Nueva Línea de Transporte</span>
            </button>
          </div>
        </div>

        {/* Filtros de Tipo */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-sky-50">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas ({transitLines.length})
          </button>
          <button
            onClick={() => setFilterType('micro')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              filterType === 'micro'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Bus size={14} />
            <span>Microbuses ({microCount})</span>
          </button>
          <button
            onClick={() => setFilterType('colectivo')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              filterType === 'colectivo'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Car size={14} />
            <span>Taxis Colectivos ({colectivoCount})</span>
          </button>
        </div>
      </div>

      {/* 3. GRILLA DE LÍNEAS DE TRANSPORTE */}
      {filteredLines.length === 0 ? (
        <div className="bg-white/80 rounded-3xl border border-sky-100 p-12 text-center text-slate-400 space-y-2">
          <Bus size={36} className="mx-auto text-slate-300" />
          <p className="font-bold text-sm text-slate-600">No se encontraron líneas de transporte</p>
          <p className="text-xs">Prueba con otro término de búsqueda o agrega una nueva línea en el mapa.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredLines.map((line) => {
            const props = line.properties || {};
            const paradas = props.paradas || [];
            const isMicro = props.tipo === 'micro';
            const lineColor = props.color || (isMicro ? '#0284c7' : '#f59e0b');

            return (
              <motion.div
                key={props.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/95 backdrop-blur-md rounded-3xl p-5 border border-sky-100 shadow-sm hover:shadow-md hover:border-sky-200 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Foto de la Línea si existe */}
                  {props.foto && (
                    <div className="mb-3 rounded-2xl overflow-hidden h-28 w-full bg-slate-100 border border-sky-100">
                      <img
                        src={resolveMediaUrl(props.foto)}
                        alt={props.nombre}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Encabezado de la Tarjeta */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        style={{ backgroundColor: lineColor }}
                        className="w-10 h-10 rounded-2xl text-white flex items-center justify-center font-black text-sm shadow-md shadow-slate-900/10 shrink-0"
                      >
                        {isMicro ? <Bus size={20} /> : <Car size={20} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                            {isMicro ? 'MICRO' : 'COLECTIVO'} {props.numero}
                          </span>
                          <span
                            style={{ backgroundColor: `${lineColor}20`, color: lineColor }}
                            className="text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase"
                          >
                            Activa
                          </span>
                        </div>
                        <h3 className="text-sm font-black text-slate-900 leading-tight mt-1 line-clamp-1">
                          {props.nombre}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Fila de Datos Clave (Tarifa, Horario, Frecuencia) */}
                  <div className="grid grid-cols-3 gap-2 my-3 p-2.5 rounded-2xl bg-slate-50/90 border border-sky-50 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold">Tarifa</span>
                      <span className="font-extrabold text-slate-800 flex items-center gap-0.5">
                        <DollarSign size={11} className="text-emerald-600" />
                        {props.tarifa || '$500'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold">Horario</span>
                      <span className="font-extrabold text-slate-800 flex items-center gap-0.5 truncate">
                        <Clock size={11} className="text-sky-600 shrink-0" />
                        <span className="truncate">{props.horario || '06:30 - 22:30'}</span>
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold">Paradas</span>
                      <span className="font-extrabold text-slate-800 flex items-center gap-0.5">
                        <MapPin size={11} className="text-amber-600" />
                        {paradas.length}
                      </span>
                    </div>
                  </div>

                  {/* Previsualización de Paradas Principales */}
                  {paradas.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Recorrido Conectado
                      </p>
                      <div className="flex flex-wrap items-center gap-1 text-[11px]">
                        {paradas.slice(0, 3).map((p, idx) => (
                          <span
                            key={p.id || idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-50/70 border border-sky-100 text-sky-900 font-bold text-[10px]"
                          >
                            <span className="w-3.5 h-3.5 rounded-full bg-sky-600 text-white text-[9px] flex items-center justify-center font-black">
                              {idx + 1}
                            </span>
                            <span className="truncate max-w-[120px]">{p.nombre}</span>
                          </span>
                        ))}
                        {paradas.length > 3 && (
                          <span className="text-[10px] font-bold text-slate-400">
                            +{paradas.length - 3} más
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="pt-2 border-t border-sky-50 flex items-center gap-2">
                  <button
                    onClick={() => onTraceOnMap(line)}
                    className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-sky-600/20 transition-all cursor-pointer"
                  >
                    <Compass size={14} />
                    <span>Trazar en Mapa</span>
                  </button>

                  <button
                    onClick={() => setConfirmDeleteId(props.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Eliminar línea"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Modal / Diálogo de Confirmación de Borrado */}
                {confirmDeleteId === props.id && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs space-y-2 animate-in fade-in duration-150">
                    <p className="font-bold text-rose-900">
                      ¿Seguro que deseas eliminar la línea {props.numero}?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(props.id, props.nombre)}
                        className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs cursor-pointer"
                      >
                        Sí, eliminar
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg font-bold text-xs border border-slate-200 cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

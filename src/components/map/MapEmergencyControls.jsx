import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sun,
  Moon,
  Clock,
  ShieldAlert,
  Navigation,
  LifeBuoy,
  Eye,
  EyeOff,
  Search,
  RotateCcw,
  Footprints,
  Bike,
  Car,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Flame,
  Hospital,
  ShieldCheck,
  SunMedium,
  Check,
  X,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MapEmergencyControls({
  mode, // 'day' | 'night' | 'auto' | 'evacuation'
  onSetMode,
  isEvacuationActive,
  onToggleEvacuation,
  onLocateUser,
  onFindSafePoint,
  layerVisibility,
  onToggleLayer,
  searchQuery,
  onSearchChange,
  filterOfficialOnly,
  onToggleOfficialOnly,
  onResetFilters,
  routingProfile,
  onChangeRoutingProfile,
  userRiskStatus
}) {
  const [showLegend, setShowLegend] = useState(false);
  const [showLayers, setShowLayers] = useState(false);

  return (
    <div className="w-full bg-white/95 backdrop-blur-2xl p-3.5 sm:p-4 rounded-3xl border border-sky-100/90 shadow-xl shadow-sky-950/5 space-y-3 text-left transition-all">
      {/* 1. FILA PRINCIPAL: MODOS + BUSCADOR + ACCIONES RÁPIDAS */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Selector de Modos (Auto por defecto, Día, Noche, Evacuación) */}
        <div className="flex items-center gap-1 bg-slate-100/90 p-1.5 rounded-2xl shrink-0 overflow-x-auto no-scrollbar border border-slate-200/80">
          <button
            onClick={() => onSetMode('auto')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              mode === 'auto'
                ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-md shadow-sky-500/25'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
            title="Modo Automático según horario local (Día / Noche)"
          >
            <Clock size={15} />
            <span>Auto</span>
          </button>

          <button
            onClick={() => onSetMode('day')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              mode === 'day'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
            title="Forzar Modo Día (OpenStreetMap Claro)"
          >
            <Sun size={15} />
            <span>Día</span>
          </button>

          <button
            onClick={() => onSetMode('night')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              mode === 'night'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
            title="Forzar Modo Noche Ilimitado"
          >
            <Moon size={15} />
            <span>Noche</span>
          </button>

          <div className="w-px h-5 bg-slate-200 mx-0.5 shrink-0" />

          {/* Botón de Emergencia Tsunami */}
          <button
            onClick={onToggleEvacuation}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              isEvacuationActive
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/40 animate-pulse'
                : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
            }`}
            title="Activar Protocolo de Evacuación ante Tsunami"
          >
            <ShieldAlert size={15} />
            <span>Evacuación</span>
          </button>
        </div>

        {/* Buscador de Lugares, Playas y Calles */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar lugar, playa, restaurante, hospital..."
            className="w-full pl-9 pr-8 py-2 rounded-2xl text-xs font-semibold bg-slate-50 border border-slate-200/80 text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-brand-500/30 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Acciones Rápidas (GPS, Perfil de Ruta, Pantalla Completa, Capas, Leyenda) */}
        <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto no-scrollbar">
          {/* Botón Mi Ubicación */}
          <button
            onClick={onLocateUser}
            className="px-3 py-2 rounded-2xl bg-slate-100 hover:bg-white text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors border border-slate-200/60 cursor-pointer shadow-2xs"
            title="Obtener mi ubicación GPS"
          >
            <Navigation size={14} className="text-brand-500" />
            <span className="hidden sm:inline">Mi Ubicación</span>
          </button>

          {/* Perfil de ruta: Pie / Bici / Auto */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/60">
            <button
              onClick={() => onChangeRoutingProfile('foot')}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                routingProfile === 'foot' ? 'bg-white text-brand-600 shadow-xs' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Caminar a pie"
            >
              <Footprints size={14} />
            </button>
            <button
              onClick={() => onChangeRoutingProfile('bike')}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                routingProfile === 'bike' ? 'bg-white text-brand-600 shadow-xs' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Bicicleta"
            >
              <Bike size={14} />
            </button>
            <button
              onClick={() => onChangeRoutingProfile('car')}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                routingProfile === 'car' ? 'bg-white text-brand-600 shadow-xs' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Automóvil"
            >
              <Car size={14} />
            </button>
          </div>

          {/* Botón Ver Mapa en Pantalla Completa (Página dedicada) */}
          <Link
            to="/mapa"
            className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-brand-600 via-sky-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-sky-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer btn-tactile shrink-0"
            title="Abrir mapa interactivo dedicado en pantalla completa con todos los lugares y detalles"
          >
            <Maximize2 size={14} />
            <span>Ver Mapa Completo</span>
          </Link>

          {/* Capas Toggle */}
          <button
            onClick={() => { setShowLayers(!showLayers); if (showLegend) setShowLegend(false); }}
            className={`px-3 py-2 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border ${
              showLayers ? 'bg-brand-500 text-white border-brand-600 shadow-sm' : 'bg-slate-100 hover:bg-white text-slate-700 border-slate-200/60 shadow-2xs'
            }`}
          >
            <Eye size={14} />
            <span className="hidden sm:inline">Capas</span>
            {showLayers ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {/* Leyenda Toggle */}
          <button
            onClick={() => { setShowLegend(!showLegend); if (showLayers) setShowLayers(false); }}
            className={`px-3 py-2 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border ${
              showLegend ? 'bg-brand-500 text-white border-brand-600 shadow-sm' : 'bg-slate-100 hover:bg-white text-slate-700 border-slate-200/60 shadow-2xs'
            }`}
          >
            <Info size={14} />
            <span className="hidden sm:inline">Leyenda</span>
          </button>
        </div>
      </div>

      {/* 2. FILA DE CAPAS RÁPIDAS (PILLS CLARAS, ADAPTADAS A LA PALETA) */}
      <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-slate-200/70">
        <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Capas visibles:</span>

        {/* Vías de evacuación */}
        <button
          onClick={() => onToggleLayer('viasEvacuacion')}
          className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
            layerVisibility.viasEvacuacion
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
              : 'bg-slate-100/90 hover:bg-white text-slate-600 border-slate-200/80 shadow-2xs'
          }`}
        >
          <span className={`w-2.5 h-1 rounded-full ${layerVisibility.viasEvacuacion ? 'bg-white' : 'bg-emerald-500'}`} />
          <span>Vías de Evacuación</span>
        </button>

        {/* Puntos de encuentro cota 30+ */}
        <button
          onClick={() => onToggleLayer('puntosEncuentro')}
          className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
            layerVisibility.puntosEncuentro
              ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
              : 'bg-slate-100/90 hover:bg-white text-slate-600 border-slate-200/80 shadow-2xs'
          }`}
        >
          <LifeBuoy size={13} className={layerVisibility.puntosEncuentro ? 'text-white' : 'text-teal-600'} />
          <span>Puntos Seguros Cota 30+</span>
        </button>

        {/* Zonas de inundación tsunami */}
        <button
          onClick={() => onToggleLayer('zonasRiesgo')}
          className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
            layerVisibility.zonasRiesgo
              ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
              : 'bg-slate-100/90 hover:bg-white text-slate-600 border-slate-200/80 shadow-2xs'
          }`}
        >
          <span className={`w-2.5 h-2.5 rounded-sm border border-dashed ${layerVisibility.zonasRiesgo ? 'bg-white/40 border-white' : 'bg-red-500/40 border-red-500'}`} />
          <span>Zonas Inundables Tsunami</span>
        </button>

        {/* Iluminación urbana */}
        <button
          onClick={() => onToggleLayer('focosLuz')}
          className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
            layerVisibility.focosLuz
              ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
              : 'bg-slate-100/90 hover:bg-white text-slate-600 border-slate-200/80 shadow-2xs'
          }`}
        >
          <SunMedium size={13} className={layerVisibility.focosLuz ? 'text-white' : 'text-amber-500'} />
          <span>Iluminación Urbana</span>
        </button>

        {/* Solo oficiales */}
        <button
          onClick={onToggleOfficialOnly}
          className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
            filterOfficialOnly
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
              : 'bg-slate-100/90 hover:bg-white text-slate-600 border-slate-200/80 shadow-2xs'
          }`}
        >
          <ShieldCheck size={13} className={filterOfficialOnly ? 'text-white' : 'text-indigo-600'} />
          <span>Solo Oficiales</span>
        </button>
      </div>

      {/* 3. BANNERS DE EMERGENCIA Y RIESGO (FUERA DEL MAPA) */}
      <AnimatePresence>
        {isEvacuationActive && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full bg-gradient-to-r from-red-600 to-rose-700 text-white p-4 rounded-2xl shadow-lg border border-red-400 overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <ShieldAlert size={22} className="text-white animate-bounce" />
                </div>
                <div>
                  <h4 className="font-black text-sm sm:text-base leading-tight">
                    Protocolo de Evacuación por Tsunami Activado
                  </h4>
                  <p className="text-xs text-red-100 mt-0.5">
                    Se muestran rutas de escape habilitadas y zonas seguras sobre cota 30 msnm.
                  </p>
                </div>
              </div>

              <button
                onClick={onFindSafePoint}
                className="px-4 py-2 bg-white text-red-700 hover:bg-red-50 font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer shrink-0 self-start sm:self-auto"
              >
                <LifeBuoy size={15} />
                <span>Ruta a Punto Seguro Cercano</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {userRiskStatus?.inRisk && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="w-full bg-amber-500 text-slate-950 p-3 rounded-2xl shadow-md font-bold text-xs flex items-center justify-between gap-3 border border-amber-300"
          >
            <div className="flex items-center gap-2.5">
              <AlertTriangle size={20} className="shrink-0 text-slate-950" />
              <div>
                <span className="font-black">¡Alerta! Te encuentras en {userRiskStatus.zoneName} (Zona de Inundación).</span>
                <span className="block text-[11px] font-medium opacity-90">Evacúa hacia zonas sobre cota 30 msnm por las rutas habilitadas.</span>
              </div>
            </div>
            <button
              onClick={onFindSafePoint}
              className="px-3 py-1.5 bg-slate-950 text-white font-black text-xs rounded-xl hover:bg-slate-900 cursor-pointer shrink-0"
            >
              Evacuar Ahora
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. PANEL DESPLEGABLE DE LEYENDA (FUERA DEL MAPA) */}
      <AnimatePresence>
        {showLegend && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3"
          >
            <div className="flex items-center justify-between text-xs font-black text-slate-900 uppercase tracking-wider">
              <span>Simbología y Significado de Capas</span>
              <button onClick={() => setShowLegend(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={15} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div className="space-y-1.5">
                <div className="text-[10px] font-black uppercase text-slate-400">Vías de Evacuación</div>
                <div className="flex items-center gap-2 text-slate-700">
                  <span className="w-4 h-1 bg-emerald-500 rounded-full shrink-0" />
                  <span>Vía Activa (Hacia cota 30+)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <span className="w-4 h-1 bg-red-500 rounded-full shrink-0" />
                  <span>Vía Bloqueada / Obras</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <span className="w-4 h-1 bg-amber-500 rounded-full shrink-0" />
                  <span>Vía en Revisión</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-[10px] font-black uppercase text-slate-400">Zonas y Puntos</div>
                <div className="flex items-center gap-2 text-slate-700">
                  <LifeBuoy size={14} className="text-teal-600 shrink-0" />
                  <span>Punto Seguro (Cota &gt; 30 msnm)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <span className="w-3.5 h-3.5 bg-red-500/30 border border-dashed border-red-500 rounded shrink-0" />
                  <span>Zona de Riesgo Tsunami</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-[10px] font-black uppercase text-slate-400">Iluminación Urbana</div>
                <div className="flex items-center gap-2 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b] shrink-0" />
                  <span>Poste Activo (Con halo nocturno)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
                  <span>Apagado / Mantención</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. PANEL DESPLEGABLE DE TODAS LAS CAPAS */}
      <AnimatePresence>
        {showLayers && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3"
          >
            <div className="flex items-center justify-between text-xs font-black text-slate-900 uppercase tracking-wider">
              <span>Control Completo de Capas</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={onResetFilters}
                  className="text-[11px] text-brand-600 hover:text-brand-700 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw size={12} />
                  <span>Restablecer</span>
                </button>
                <button onClick={() => setShowLayers(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                  <X size={15} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
              {[
                { key: 'turismo', label: 'Lugares Turísticos', icon: Check },
                { key: 'viasEvacuacion', label: 'Vías de Evacuación', icon: Footprints },
                { key: 'puntosEncuentro', label: 'Puntos Seguros (Cota 30+)', icon: LifeBuoy },
                { key: 'zonasRiesgo', label: 'Zonas Inundación Tsunami', icon: AlertTriangle },
                { key: 'focosLuz', label: 'Focos de Luz Individuales', icon: SunMedium },
                { key: 'zonasIluminadas', label: 'Polígonos de Calles Iluminadas', icon: Flame },
                { key: 'emergencias', label: 'Hospitales y Emergencias', icon: Hospital }
              ].map(item => {
                const isVisible = layerVisibility[item.key];
                return (
                  <button
                    key={item.key}
                    onClick={() => onToggleLayer(item.key)}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                      isVisible
                        ? 'bg-brand-50 border-brand-300 text-brand-900 font-bold'
                        : 'bg-white border-slate-200 text-slate-500'
                    }`}
                  >
                    <span className="text-xs">{item.label}</span>
                    <span className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] ${
                      isVisible ? 'bg-brand-500 text-white' : 'bg-slate-200 text-transparent'
                    }`}>
                      ✓
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

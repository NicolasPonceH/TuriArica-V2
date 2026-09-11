import { motion } from 'framer-motion';
import {
  MapPin, Bell, Image, Database, Sparkles, Plus, ExternalLink,
  CheckCircle2, ArrowUpRight, Clock, ShieldCheck, Flame, Compass
} from 'lucide-react';
import { usePlaces } from '../../contexts/PlacesContext';
import { useEvents } from '../../contexts/EventsContext';
import { useAuth } from '../../contexts/AuthContext';
import { resolveMediaUrl } from '../../utils/constants';

export default function AdminDashboard({ onNavigate }) {
  const { places } = usePlaces();
  const { activeEvents, allEvents } = useEvents();
  const { adminUser, isBackendConnected } = useAuth();

  const categoriesCount = [...new Set(places.map(p => p.category))].length;
  const placesWithPhotos = places.filter(p => p.photos && p.photos.length > 0).length;
  const activePopups = activeEvents.filter(e => e.isPopup).length;

  const currentAdminName = adminUser?.username
    ? adminUser.username.charAt(0).toUpperCase() + adminUser.username.slice(1)
    : 'Administrador';

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 p-6 sm:p-9 text-white shadow-xl border border-sky-900/30">
        <div className="relative z-10 max-w-2xl text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-bold mb-3 border border-sky-500/30">
            <ShieldCheck size={14} />
            <span>Sesión Activa: {currentAdminName} ({adminUser?.role || 'Admin'})</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
            Panel de Control TuriArica V2
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
            Bienvenido, <strong className="text-white">{currentAdminName}</strong>. Gestiona los atractivos turísticos, optimiza fotos y videos en formato WebP, y sincroniza en tiempo real las vías de evacuación y zonas de seguridad de Arica.
          </p>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate('add')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-sky-600/25 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Plus size={16} />
              <span>Nuevo Lugar Turístico</span>
            </button>

            <button
              onClick={() => onNavigate('map-editor')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-700/90 hover:bg-cyan-600 text-white text-xs sm:text-sm font-bold shadow-lg shadow-cyan-700/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Compass size={16} />
              <span>Editor de Mapa & Seguridad</span>
            </button>

            <button
              onClick={() => onNavigate('events')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold border border-white/15 backdrop-blur-xs transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Bell size={16} />
              <span>Crear Anuncio o Alerta</span>
            </button>

            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-slate-300 hover:text-white text-xs sm:text-sm font-semibold transition-colors"
            >
              <span>Ver Web Pública</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-sky-500/20 to-transparent pointer-events-none" />
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
        {/* Total Places */}
        <div className="bg-white rounded-3xl p-5 border border-sky-100 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Atractivos</span>
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <MapPin size={20} />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mb-1">{places.length}</div>
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <span className="text-emerald-600 font-bold">{categoriesCount} categorías</span>
            <span>activas en el mapa</span>
          </div>
        </div>

        {/* Active Events & Popups */}
        <div className="bg-white rounded-3xl p-5 border border-sky-100 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Eventos Activos</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Bell size={20} />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mb-1">{activeEvents.length}</div>
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <span className="text-amber-600 font-bold">{activePopups} en modo popup</span>
            <span>para turistas</span>
          </div>
        </div>

        {/* Media & WebP Optimization */}
        <div className="bg-white rounded-3xl p-5 border border-sky-100 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Multimedia WebP</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Image size={20} />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mb-1">~92%</div>
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <span className="text-emerald-600 font-bold">Ahorro de peso</span>
            <span>con Sharp & WebP</span>
          </div>
        </div>

        {/* System & Database */}
        <div className="bg-white rounded-3xl p-5 border border-sky-100 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Base de Datos</span>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Database size={20} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mb-1 flex items-center gap-2">
            <span>SQLite 3</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-xs text-gray-500">
            {isBackendConnected ? 'Conectado · API puerto 5000' : 'Modo local offline'}
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent places & quick preview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-sky-100 shadow-xs p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Atractivos Registrados</h3>
                <p className="text-xs text-slate-500">Puntos de interés visibles en el mapa turístico de Arica</p>
              </div>
              <button
                onClick={() => onNavigate('list')}
                className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Ver todos ({places.length})</span>
                <ArrowUpRight size={14} />
              </button>
            </div>

            <div className="divide-y divide-sky-100/70">
              {places.slice(0, 5).map((place) => (
                <div key={place.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 relative">
                      {place.photos && place.photos.length > 0 ? (
                        <img
                          src={resolveMediaUrl(place.photos[0])}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-white"
                          style={{ backgroundColor: place.color || '#0ea5e9' }}
                        >
                          <Compass size={18} />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm truncate">{place.name}</h4>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-100">
                          {place.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate max-w-sm">
                        {place.shortDesc || place.fullDesc}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {place.transport?.lineas?.length > 0 && (
                      <span className="hidden sm:inline-block text-[11px] font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
                        Micros {place.transport.lineas.slice(0, 2).join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Active Announcements & AI Knowledge summary */}
        <div className="space-y-6">
          {/* Active Events Card */}
          <div className="bg-white rounded-3xl border border-sky-100 shadow-xs p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Flame className="text-amber-500" size={18} />
                <span>Avisos Activos</span>
              </h3>
              <button
                onClick={() => onNavigate('events')}
                className="text-xs font-bold text-sky-600 hover:text-sky-700 cursor-pointer"
              >
                Gestionar
              </button>
            </div>

            {activeEvents.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No hay anuncios activos actualmente.</p>
            ) : (
              <div className="space-y-3">
                {activeEvents.slice(0, 3).map((evt) => (
                  <div key={evt.id} className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-brand-50 text-brand-700">
                        {evt.type}
                      </span>
                      {evt.isPopup && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                          Popup
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-gray-900 text-xs">{evt.title}</h4>
                    <p className="text-[11px] text-gray-600 line-clamp-2">{evt.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Knowledge Base Tips Card */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50/50 rounded-2xl border border-purple-100 p-6 space-y-3">
            <div className="flex items-center gap-2 text-purple-900 font-extrabold text-sm">
              <Sparkles size={18} className="text-purple-600" />
              <span>Alimentación de la IA Turística</span>
            </div>
            <p className="text-xs text-purple-800/80 leading-relaxed">
              Toda la información que registres aquí se compila automáticamente en <code className="bg-purple-100/80 px-1.5 py-0.5 rounded text-purple-900 font-mono text-[11px]">/api/ai/context</code> para alimentar el asistente virtual turístico de Arica.
            </p>
            <ul className="text-xs text-purple-900/90 space-y-1.5 font-medium list-disc list-inside">
              <li>Incluye horarios claros para responder consultas de atención.</li>
              <li>Registra las líneas de microbús exactas.</li>
              <li>Añade etiquetas (#playa, #chinchorro, #historia).</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

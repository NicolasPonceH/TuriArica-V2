import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Edit2, Trash2, Search, MapPin, Plus, Bus, ExternalLink,
  CheckCircle2, Sparkles, Navigation, Clock, AlertTriangle, X
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { usePlaces } from '../../contexts/PlacesContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getCategoryMeta } from '../../data/categories';
import { resolveMediaUrl } from '../../utils/constants';

export default function PlacesList({ onEdit, onAddNew, notify }) {
  const { places, deletePlace } = usePlaces();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const categories = ['Todos', ...new Set(places.map(p => p.category))];

  const filtered = places.filter(p => {
    const matchesSearch = !search.trim() || (
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      (p.shortDesc && p.shortDesc.toLowerCase().includes(search.toLowerCase())) ||
      (p.directions && p.directions.toLowerCase().includes(search.toLowerCase()))
    );
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDelete = (id, name) => {
    if (confirmDelete === id) {
      deletePlace(id);
      setConfirmDelete(null);
      if (notify) {
        notify({ type: 'error', text: `Lugar "${name || 'Atractivo'}" eliminado del sistema.` });
      }
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3500);
    }
  };

  return (
    <div className="space-y-6 w-full text-left">
      {/* ============================================================
          BARRA DE CONTROL Y BÚSQUEDA INTEGRADA
         ============================================================ */}
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-sky-100 p-4 sm:p-5 shadow-sm space-y-3.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Input Buscador */}
          <div className="flex-1 flex items-center gap-2.5 bg-slate-50/80 rounded-2xl px-4 py-2.5 border border-slate-200/90 focus-within:border-sky-500 focus-within:bg-white transition-all">
            <Search size={18} className="text-sky-600 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, categoría, dirección o descripción..."
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

          {/* Contador y Botón Nuevo Lugar */}
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="text-xs font-bold text-sky-800 bg-sky-50 border border-sky-100 px-3.5 py-2.5 rounded-2xl">
              {filtered.length} de {places.length} lugares
            </span>
            <button
              onClick={onAddNew}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-sky-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Plus size={16} />
              <span>Nuevo Lugar</span>
            </button>
          </div>
        </div>

        {/* Chips de Categorías */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-sky-600 to-cyan-600 text-white shadow-xs'
                  : 'bg-slate-100/90 text-slate-600 hover:bg-sky-50 hover:text-sky-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ============================================================
          PRESENTACIÓN RESPONSIVA SIN SCROLL HORIZONTAL
          1. Modo Móvil / Tablet (< lg): Cuadrícula de Tarjetas Táctiles
          2. Modo Escritorio (>= lg): Tabla fluida de alta densidad
         ============================================================ */}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-sky-100 shadow-xs space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <MapPin size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-800">No se encontraron atractivos</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No hay lugares que coincidan con &quot;{search}&quot;. Prueba ajustando los términos de búsqueda o el filtro de categoría.
          </p>
          <button
            onClick={() => { setSearch(''); setSelectedCategory('Todos'); }}
            className="px-4 py-2 rounded-xl bg-sky-100 text-sky-700 text-xs font-bold hover:bg-sky-200 transition-colors cursor-pointer"
          >
            Restablecer Filtros
          </button>
        </div>
      ) : (
        <>
          {/* MODO TARJETAS (Móviles y Tablets) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-3.5">
            <AnimatePresence>
              {filtered.map(place => {
                const meta = getCategoryMeta(place.category);
                const Icon = LucideIcons[meta.icon] || LucideIcons.MapPin;

                return (
                  <motion.div
                    key={place.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white rounded-3xl p-4 border border-sky-100 shadow-xs flex flex-col justify-between gap-3 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      {/* Imagen / Miniatura */}
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/80 relative">
                        {place.photos && place.photos.length > 0 ? (
                          <img
                            src={resolveMediaUrl(place.photos[0])}
                            alt={place.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center text-white"
                            style={{ backgroundColor: place.color || '#0ea5e9' }}
                          >
                            <Icon size={20} />
                          </div>
                        )}
                      </div>

                      {/* Título & Categoría */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-extrabold text-slate-900 text-sm truncate">{place.name}</h4>
                          {place.is24h && (
                            <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black">
                              24h
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-50 text-sky-800 border border-sky-100">
                            <Icon size={11} style={{ color: place.color || '#0ea5e9' }} />
                            <span>{place.category}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Descripción corta */}
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {place.shortDesc || place.fullDesc || 'Sin descripción disponible.'}
                    </p>

                    {/* Meta info: Transporte y Coordenadas */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1 font-semibold truncate max-w-[60%]">
                        <Bus size={12} className="text-sky-600 shrink-0" />
                        <span className="truncate">
                          {place.transport?.lineas?.length > 0
                            ? `Micros ${place.transport.lineas.join(', ')}`
                            : 'Auto / A pie'}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 shrink-0">
                        {place.lat.toFixed(3)}, {place.lng.toFixed(3)}
                      </span>
                    </div>

                    {/* Botones de acción táctiles */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => onEdit(place)}
                        className="flex-1 py-2 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Edit2 size={13} />
                        <span>Editar</span>
                      </button>

                      <button
                        onClick={() => handleDelete(place.id, place.name)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          confirmDelete === place.id
                            ? 'bg-red-500 text-white animate-pulse'
                            : 'bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600'
                        }`}
                      >
                        {confirmDelete === place.id ? (
                          '¿Confirmar?'
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* MODO TABLA FLUIDA (Escritorio >= lg) */}
          <div className="hidden lg:block bg-white rounded-3xl border border-sky-100 shadow-xs overflow-hidden">
            <table className="w-full text-left table-auto">
              <thead>
                <tr className="border-b border-sky-100/80 bg-sky-50/50 text-slate-500 text-[11px] font-black uppercase tracking-wider">
                  <th className="px-6 py-4">Atractivo Turístico</th>
                  <th className="px-4 py-4">Categoría</th>
                  <th className="px-4 py-4">Transporte</th>
                  <th className="px-4 py-4">Coordenadas</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <AnimatePresence>
                  {filtered.map(place => {
                    const meta = getCategoryMeta(place.category);
                    const Icon = LucideIcons[meta.icon] || LucideIcons.MapPin;

                    return (
                      <motion.tr
                        key={place.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="hover:bg-sky-50/40 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3.5">
                            {/* Miniatura */}
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200/80 relative">
                              {place.photos && place.photos.length > 0 ? (
                                <img
                                  src={resolveMediaUrl(place.photos[0])}
                                  alt={place.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div
                                  className="w-full h-full flex items-center justify-center text-white"
                                  style={{ backgroundColor: place.color || '#0ea5e9' }}
                                >
                                  <Icon size={18} />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 max-w-sm">
                              <div className="flex items-center gap-2">
                                <p className="font-extrabold text-slate-900 text-sm truncate">{place.name}</p>
                                {place.is24h && (
                                  <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black shrink-0">
                                    24h
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 truncate mt-0.5">
                                {place.shortDesc || place.fullDesc || 'Sin descripción'}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-100">
                            <Icon size={12} style={{ color: place.color || '#0ea5e9' }} />
                            <span>{place.category}</span>
                          </span>
                        </td>

                        <td className="px-4 py-4 text-xs text-slate-600">
                          {place.transport?.lineas?.length > 0 ? (
                            <div className="flex items-center gap-1.5 font-semibold">
                              <Bus size={13} className="text-sky-600" />
                              <span>Micros {place.transport.lineas.join(', ')}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400">Auto / Taxi</span>
                          )}
                        </td>

                        <td className="px-4 py-4 text-xs font-mono text-slate-500">
                          {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onEdit(place)}
                              className="p-2.5 rounded-xl text-slate-500 hover:text-sky-700 hover:bg-sky-50 transition-colors cursor-pointer"
                              title="Editar atractivo"
                            >
                              <Edit2 size={16} />
                            </button>

                            <button
                              onClick={() => handleDelete(place.id, place.name)}
                              className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                                confirmDelete === place.id
                                  ? 'bg-red-500 text-white font-bold text-xs px-3.5'
                                  : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                              }`}
                              title="Eliminar atractivo"
                            >
                              {confirmDelete === place.id ? (
                                '¿Confirmar?'
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

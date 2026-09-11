import { useState } from 'react';
import { Save, Calendar, AlertTriangle, Sparkles, Upload, Image, Link, Check, Tag, MapPin, Store } from 'lucide-react';
import { useEvents } from '../../contexts/EventsContext';
import { usePlaces } from '../../contexts/PlacesContext';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL, resolveMediaUrl } from '../../utils/constants';

export default function EventForm({ event, onDone }) {
  const isEditing = !!event;
  const { createEvent, updateEvent } = useEvents();
  const { places = [] } = usePlaces();
  const { token } = useAuth();

  const [form, setForm] = useState({
    title: event?.title || '',
    message: event?.message || '',
    type: event?.type || 'evento',
    startDate: event?.startDate || new Date().toISOString().split('T')[0],
    endDate: event?.endDate || '',
    isActive: event?.isActive !== undefined ? event.isActive : true,
    isPopup: event?.isPopup !== undefined ? event.isPopup : true,
    bannerUrl: event?.bannerUrl || '',
    actionUrl: event?.actionUrl || '',
    priority: event?.priority || 1,
    placeId: event?.placeId || '',
    placeName: event?.placeName || '',
    discountBadge: event?.discountBadge || '',
  });

  const [uploading, setUploading] = useState(false);
  const [uploadStats, setUploadStats] = useState(null);

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Upload optimized banner
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadStats(null);

    const formData = new FormData();
    formData.append('photo', file);

    try {
      const res = await fetch(`${API_BASE_URL}/upload/photo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        updateField('bannerUrl', data.url);
        setUploadStats(data.stats);
      }
    } catch (err) {
      console.error('Error al subir imagen:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) return;

    if (isEditing) {
      await updateEvent(event.id, form);
    } else {
      await createEvent(form);
    }
    onDone();
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 focus:border-brand-500 focus:bg-white outline-none transition-colors text-sm";
  const labelClass = "block text-sm font-bold text-gray-700 mb-1.5";

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 max-w-2xl mx-auto">
      <h2 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-2">
        <Sparkles className="text-amber-500" size={22} />
        {isEditing ? 'Editar Anuncio / Evento' : 'Crear Nuevo Anuncio de Evento'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className={labelClass}>Título del Evento o Alerta *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => updateField('title', e.target.value)}
            className={inputClass}
            placeholder="Ej: Carnaval Andino con la Fuerza del Sol 2026"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Tipo de Anuncio</label>
            <select
              value={form.type}
              onChange={(e) => updateField('type', e.target.value)}
              className={inputClass}
            >
              <option value="evento">Evento General</option>
              <option value="promocion">Promoción / Oferta de Local</option>
              <option value="festival">Festival / Carnaval</option>
              <option value="cultural">Evento Cultural</option>
              <option value="alerta">Alerta / Aviso Preventivo</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Prioridad</label>
            <select
              value={form.priority}
              onChange={(e) => updateField('priority', Number(e.target.value))}
              className={inputClass}
            >
              <option value={1}>1 - Máxima Prioridad (Primero)</option>
              <option value={2}>2 - Prioridad Media</option>
              <option value={3}>3 - Prioridad Normal</option>
            </select>
          </div>
        </div>

        {/* Local / Venue Association */}
        <div className="p-4 bg-sky-50/70 rounded-2xl border border-sky-100 space-y-3">
          <div className="flex items-center gap-2 text-sky-800 font-bold text-xs uppercase tracking-wider">
            <Store size={15} className="text-sky-600" />
            <span>Vincular a Local, Restaurante o Atractivo</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lugar Asociado (Opcional)
              </label>
              <select
                value={form.placeId}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  const found = places.find(p => String(p.id) === String(selectedId));
                  setForm(prev => ({
                    ...prev,
                    placeId: selectedId,
                    placeName: found ? found.name : '',
                    type: prev.type === 'evento' && selectedId ? 'promocion' : prev.type
                  }));
                }}
                className={inputClass}
              >
                <option value="">-- Evento General (Sin local específico) --</option>
                {places.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                <Tag size={12} className="inline mr-1 text-sky-600" />
                Etiqueta / Descuento (Ej: 20% Dcto, 2x1)
              </label>
              <input
                type="text"
                value={form.discountBadge}
                onChange={(e) => updateField('discountBadge', e.target.value)}
                className={inputClass}
                placeholder="Ej: 20% Dcto, 2x1 en cócteles, Menú $5.990"
              />
            </div>
          </div>
          {form.placeName && (
            <p className="text-xs text-sky-700 font-medium flex items-center gap-1">
              <MapPin size={13} className="text-sky-600" />
              Asociado a: <strong className="font-bold">{form.placeName}</strong>. Aparecerá destacado en el mapa y ficha del local.
            </p>
          )}
        </div>

        <div>
          <label className={labelClass}>Mensaje o Descripción *</label>
          <textarea
            value={form.message}
            onChange={(e) => updateField('message', e.target.value)}
            className={`${inputClass} min-h-[100px] resize-y`}
            placeholder="Describe los detalles del evento, recomendaciones o aviso para turistas..."
            rows={3}
            required
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              <Calendar size={14} className="inline mr-1 text-gray-500" />
              Fecha de Inicio
            </label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => updateField('startDate', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>
              <Calendar size={14} className="inline mr-1 text-gray-500" />
              Fecha de Término
            </label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => updateField('endDate', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* Banner image with optimization */}
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
          <label className={labelClass}>Imagen de Banner / Afiche</label>

          {form.bannerUrl && (
            <div className="relative rounded-xl overflow-hidden border border-gray-200 h-40 bg-gray-900">
              <img
                src={resolveMediaUrl(form.bannerUrl)}
                alt="Banner preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => updateField('bannerUrl', '')}
                className="absolute top-2 right-2 px-2.5 py-1 bg-red-600/90 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Quitar imagen
              </button>
            </div>
          )}

          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={form.bannerUrl}
              onChange={(e) => updateField('bannerUrl', e.target.value)}
              className={`${inputClass} flex-1`}
              placeholder="https://... o sube una imagen optimizada"
            />
            <label className="cursor-pointer px-4 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold text-sm transition-colors flex items-center gap-1.5 shrink-0">
              <Upload size={16} />
              <span>{uploading ? 'Subiendo...' : 'Subir'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>

          {uploadStats && (
            <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <Check size={14} />
              Optimizada a WebP: {uploadStats.optimizedKb} KB ({uploadStats.savingsPercent} menos peso).
            </p>
          )}
        </div>

        {/* Action URL */}
        <div>
          <label className={labelClass}>
            <Link size={14} className="inline mr-1 text-gray-500" />
            Enlace de Acción / Sitio Web Oficial (Opcional)
          </label>
          <input
            type="url"
            value={form.actionUrl}
            onChange={(e) => updateField('actionUrl', e.target.value)}
            className={inputClass}
            placeholder="https://aricafuerzadelsol.cl"
          />
        </div>

        {/* Switches */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <label className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 bg-gray-50 cursor-pointer hover:bg-white transition-colors">
            <input
              type="checkbox"
              checked={form.isPopup}
              onChange={(e) => updateField('isPopup', e.target.checked)}
              className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500"
            />
            <div>
              <span className="text-sm font-bold text-gray-800 block">Mostrar como Popup</span>
              <span className="text-xs text-gray-500">Aparece a los turistas al entrar a la web</span>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 bg-gray-50 cursor-pointer hover:bg-white transition-colors">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => updateField('isActive', e.target.checked)}
              className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500"
            />
            <div>
              <span className="text-sm font-bold text-gray-800 block">Anuncio Activo</span>
              <span className="text-xs text-gray-500">Visible actualmente en la web</span>
            </div>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-100">
          <button
            type="submit"
            className="flex-1 py-3 px-6 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.98]"
          >
            <Save size={18} />
            <span>Guardar Anuncio</span>
          </button>
          <button
            type="button"
            onClick={onDone}
            className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

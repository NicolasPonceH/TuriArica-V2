import { useState } from 'react';
import {
  Save, X, Plus, Trash2, Image, Video, Upload, Check,
  Sparkles, Film, ArrowLeft, Loader2, MapPin
} from 'lucide-react';
import { usePlaces } from '../../contexts/PlacesContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { CATEGORIES } from '../../data/categories';
import { API_BASE_URL, resolveMediaUrl } from '../../utils/constants';

export default function PlaceForm({ place, onDone }) {
  const isEditing = !!place;
  const { addPlace, updatePlace } = usePlaces();
  const { t } = useLanguage();
  const { token } = useAuth();

  const [form, setForm] = useState({
    name: place?.name || '',
    category: place?.category || CATEGORIES[0].id,
    type: place?.type || CATEGORIES[0].type || 'turismo',
    shortDesc: place?.shortDesc || '',
    fullDesc: place?.fullDesc || '',
    lat: place?.lat ?? -18.4783,
    lng: place?.lng ?? -70.3126,
    hours: place?.hours || '',
    directions: place?.directions || '',
    phone: place?.phone || '',
    website: place?.website || '',
    priceRange: place?.priceRange || '',
    is24h: place?.is24h || false,
    photos: place?.photos || [],
    videos: place?.videos || [],
    aiTags: place?.aiTags || [],
    audioFile: place?.audioFile || '',
    transport: {
      lineas: place?.transport?.lineas || [],
      direccion: place?.transport?.direccion || '',
      letrero: place?.transport?.letrero || '',
      parada: place?.transport?.parada || '',
    },
  });

  const [photoUrl, setPhotoUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [busLine, setBusLine] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [photoOptimizedNotice, setPhotoOptimizedNotice] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const updateTransport = (field, value) => {
    setForm(prev => ({
      ...prev,
      transport: { ...prev.transport, [field]: value }
    }));
  };

  // Upload Photo to Backend (WebP Optimization)
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    setPhotoOptimizedNotice(null);

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
        setForm(prev => ({ ...prev, photos: [...prev.photos, data.url] }));
        setPhotoOptimizedNotice(`Foto optimizada a WebP (${data.stats?.savingsPercent || '90%'} menos peso).`);
        setTimeout(() => setPhotoOptimizedNotice(null), 5000);
      }
    } catch (err) {
      console.error('Error al subir foto:', err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Upload Video to Backend
  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVideo(true);

    const formData = new FormData();
    formData.append('video', file);

    try {
      const res = await fetch(`${API_BASE_URL}/upload/video`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setForm(prev => ({ ...prev, videos: [...prev.videos, data.url] }));
      }
    } catch (err) {
      console.error('Error al subir video:', err);
    } finally {
      setUploadingVideo(false);
    }
  };

  const addManualPhoto = () => {
    if (photoUrl.trim()) {
      setForm(prev => ({ ...prev, photos: [...prev.photos, photoUrl.trim()] }));
      setPhotoUrl('');
    }
  };

  const removePhoto = (index) => {
    setForm(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const addManualVideo = () => {
    if (videoUrl.trim()) {
      setForm(prev => ({ ...prev, videos: [...prev.videos, videoUrl.trim()] }));
      setVideoUrl('');
    }
  };

  const removeVideo = (index) => {
    setForm(prev => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index)
    }));
  };

  const addAiTag = () => {
    if (tagInput.trim() && !form.aiTags.includes(tagInput.trim().toLowerCase())) {
      setForm(prev => ({ ...prev, aiTags: [...prev.aiTags, tagInput.trim().toLowerCase()] }));
      setTagInput('');
    }
  };

  const removeAiTag = (tag) => {
    setForm(prev => ({
      ...prev,
      aiTags: prev.aiTags.filter(t => t !== tag)
    }));
  };

  const addBusLine = () => {
    if (busLine.trim()) {
      updateTransport('lineas', [...form.transport.lineas, busLine.trim()]);
      setBusLine('');
    }
  };

  const removeBusLine = (index) => {
    updateTransport('lineas', form.transport.lineas.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setIsSaving(true);
    try {
      if (isEditing) {
        await updatePlace(place.id, form);
        onDone(`¡Lugar "${form.name}" actualizado y sincronizado en el mapa público!`);
      } else {
        await addPlace(form);
        onDone(`¡Lugar "${form.name}" creado y visible en el mapa interactivo!`);
      }
    } catch (err) {
      console.error('Error al guardar lugar:', err);
      setIsSaving(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition-all text-xs sm:text-sm font-medium text-slate-800";
  const labelClass = "block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5";

  return (
    <div className="bg-white rounded-3xl border border-sky-100 shadow-xs p-5 sm:p-8 max-w-4xl mx-auto space-y-6 text-left">
      {/* ============================================================
          ENCABEZADO DE FORMULARIO
         ============================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sky-100/80 pb-5">
        <div>
          <button
            type="button"
            onClick={() => onDone()}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-900 mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Volver a la Lista de Atractivos</span>
          </button>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            {isEditing ? `Editar Atractivo: "${place.name}"` : 'Crear Nuevo Atractivo Turístico'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Los cambios se guardan de inmediato en la base de datos y se reflejan en el mapa interactivo.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onDone()}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
        >
          Cancelar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>{t('admin.name')} *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              className={inputClass}
              placeholder="Ej: Playa Chinchorro"
              required
            />
          </div>
          <div>
            <label className={labelClass}>{t('admin.category')} *</label>
            <select
              value={form.category}
              onChange={(e) => {
                const cat = CATEGORIES.find(c => c.id === e.target.value);
                setForm(prev => ({
                  ...prev,
                  category: e.target.value,
                  type: cat?.type || prev.type
                }));
              }}
              className={inputClass}
            >
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label} ({cat.type})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Descriptions */}
        <div>
          <label className={labelClass}>{t('admin.shortDesc')}</label>
          <input
            type="text"
            value={form.shortDesc}
            onChange={(e) => updateField('shortDesc', e.target.value)}
            className={inputClass}
            maxLength={140}
            placeholder="Resumen atractivo de 1-2 líneas para la tarjeta..."
          />
        </div>
        <div>
          <label className={labelClass}>Descripción Detallada (Recomendaciones e IA Turística)</label>
          <textarea
            value={form.fullDesc}
            onChange={(e) => updateField('fullDesc', e.target.value)}
            className={`${inputClass} min-h-[110px] resize-y`}
            placeholder="Incluye detalles históricos, servicios disponibles, atractivos cercanos y recomendaciones para visitantes..."
            rows={4}
          />
        </div>

        {/* AI Semantic Tags */}
        <div className="bg-sky-50/60 rounded-3xl p-4 sm:p-5 border border-sky-100 space-y-3">
          <label className="text-xs font-black text-sky-950 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={15} className="text-sky-600" />
            <span>Etiquetas Semánticas para Búsqueda e IA</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {form.aiTags.map((tag, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-sky-100 text-sky-800 text-xs font-bold rounded-xl">
                #{tag}
                <button type="button" onClick={() => removeAiTag(tag)} className="hover:text-red-500 cursor-pointer">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAiTag())}
              className={`${inputClass} bg-white flex-1`}
              placeholder="Ej: familiar, olas, atardecer, momias, gastronomia..."
            />
            <button
              type="button"
              onClick={addAiTag}
              className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer transition-colors shrink-0"
            >
              Añadir Tag
            </button>
          </div>
        </div>

        {/* Coordinates */}
        <div className="bg-slate-50/70 rounded-3xl p-4 sm:p-5 border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin size={15} className="text-sky-600" />
              <span>Coordenadas Geográficas (Arica)</span>
            </label>
            <span className="text-[11px] text-slate-500 font-mono">Formato decimal (WGS84)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t('admin.latitude')} (Latitud)</label>
              <input
                type="number"
                step="any"
                value={form.lat}
                onChange={(e) => updateField('lat', parseFloat(e.target.value) || 0)}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>{t('admin.longitude')} (Longitud)</label>
              <input
                type="number"
                step="any"
                value={form.lng}
                onChange={(e) => updateField('lng', parseFloat(e.target.value) || 0)}
                className={inputClass}
                required
              />
            </div>
          </div>
        </div>

        {/* Practical info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>{t('detail.hours')}</label>
            <input
              type="text"
              value={form.hours}
              onChange={(e) => updateField('hours', e.target.value)}
              className={inputClass}
              placeholder="09:00 - 19:00"
            />
          </div>
          <div>
            <label className={labelClass}>{t('detail.phone')}</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              className={inputClass}
              placeholder="+56 58 222 0000"
            />
          </div>
          <div>
            <label className={labelClass}>{t('detail.website')}</label>
            <input
              type="url"
              value={form.website}
              onChange={(e) => updateField('website', e.target.value)}
              className={inputClass}
              placeholder="https://..."
            />
          </div>
        </div>

        {/* 24 Horas Checkbox */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
          <input
            type="checkbox"
            id="is24h-toggle"
            checked={form.is24h}
            onChange={(e) => updateField('is24h', e.target.checked)}
            className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
          />
          <label htmlFor="is24h-toggle" className="text-xs font-bold text-slate-800 cursor-pointer select-none">
            Abierto o disponible las 24 horas continuas
          </label>
        </div>

        {/* Directions */}
        <div>
          <label className={labelClass}>{t('admin.directions')}</label>
          <textarea
            value={form.directions}
            onChange={(e) => updateField('directions', e.target.value)}
            className={`${inputClass} min-h-[60px] resize-y`}
            placeholder="Indicaciones de cómo llegar, calles de referencia o esquinas..."
            rows={2}
          />
        </div>

        {/* Transport */}
        <div className="bg-slate-50/70 rounded-3xl p-4 sm:p-5 border border-slate-200/80 space-y-4">
          <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <span>Transporte Público & Conectividad</span>
          </h3>

          <div>
            <label className={labelClass}>Líneas de Micro / Colectivos</label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {form.transport.lineas.map((line, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-sky-600 text-white text-xs font-black rounded-xl shadow-2xs">
                  {line}
                  <button type="button" onClick={() => removeBusLine(i)} className="hover:text-red-200 cursor-pointer">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={busLine}
                onChange={(e) => setBusLine(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addBusLine())}
                className={`${inputClass} bg-white flex-1`}
                placeholder="Ej: 12, 7, 10..."
              />
              <button
                type="button"
                onClick={addBusLine}
                className="px-4 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-700 transition-colors cursor-pointer shrink-0"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Letrero del micro</label>
              <input
                type="text"
                value={form.transport.letrero}
                onChange={(e) => updateTransport('letrero', e.target.value)}
                placeholder="Ej: Saucache - Chinchorro"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Paradero cercano</label>
              <input
                type="text"
                value={form.transport.parada}
                onChange={(e) => updateTransport('parada', e.target.value)}
                placeholder="Ej: Frente al acceso principal"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Photos (Optimized WebP Upload) */}
        <div className="bg-slate-50/70 rounded-3xl p-4 sm:p-5 border border-slate-200/80 space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
              <Image size={16} className="text-sky-600" />
              <span>Fotos del Atractivo (Optimización WebP)</span>
            </h3>
            {photoOptimizedNotice && (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <Check size={14} /> {photoOptimizedNotice}
              </span>
            )}
          </div>

          {form.photos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {form.photos.map((url, i) => (
                <div key={i} className="relative group aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                  <img
                    src={resolveMediaUrl(url)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-1.5 right-1.5 w-7 h-7 bg-red-600/90 text-white rounded-full flex items-center justify-center opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
                    title="Eliminar foto"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                className={`${inputClass} bg-white flex-1`}
                placeholder="https://ejemplo.com/foto.jpg"
              />
              <button
                type="button"
                onClick={addManualPhoto}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs cursor-pointer shrink-0 transition-colors"
              >
                Agregar URL
              </button>
            </div>

            <label className="cursor-pointer px-4 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl font-bold text-xs transition-colors flex items-center justify-center gap-2 shrink-0 shadow-sm">
              {uploadingPhoto ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              <span>{uploadingPhoto ? 'Optimizando a WebP...' : 'Subir y Optimizar a WebP'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={uploadingPhoto}
              />
            </label>
          </div>
        </div>

        {/* Videos (Web Optimized Video) */}
        <div className="bg-slate-50/70 rounded-3xl p-4 sm:p-5 border border-slate-200/80 space-y-3.5">
          <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
            <Film size={16} className="text-amber-500" />
            <span>Videos Turísticos (MP4 / WebM)</span>
          </h3>

          {form.videos.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {form.videos.map((vUrl, i) => (
                <div key={i} className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-black">
                  <video
                    src={resolveMediaUrl(vUrl)}
                    controls
                    preload="metadata"
                    className="w-full h-36 object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => removeVideo(i)}
                    className="absolute top-2 right-2 px-2.5 py-1 bg-red-600 text-white rounded-lg text-xs font-bold shadow cursor-pointer"
                  >
                    Eliminar Video
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className={`${inputClass} bg-white flex-1`}
                placeholder="https://... (URL de video MP4)"
              />
              <button
                type="button"
                onClick={addManualVideo}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs cursor-pointer shrink-0 transition-colors"
              >
                Agregar URL
              </button>
            </div>

            <label className="cursor-pointer px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold text-xs transition-colors flex items-center justify-center gap-2 shrink-0 shadow-sm">
              {uploadingVideo ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              <span>{uploadingVideo ? 'Subiendo video...' : 'Subir Video'}</span>
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="hidden"
                disabled={uploadingVideo}
              />
            </label>
          </div>
        </div>

        {/* Acciones principales de Guardar */}
        <div className="flex flex-col sm:flex-row gap-3 pt-5 border-t border-sky-100">
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-black text-sm transition-all shadow-lg shadow-sky-600/25 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-60"
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            <span>{isSaving ? 'Guardando en Base de Datos...' : isEditing ? 'Guardar Cambios' : 'Crear y Publicar Lugar'}</span>
          </button>

          <button
            type="button"
            onClick={() => onDone()}
            className="px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

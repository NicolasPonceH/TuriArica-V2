import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit2, Trash2, Bell, Sparkles, Calendar,
  ExternalLink, CheckCircle2, XCircle, AlertTriangle, Palette, Tag, Store
} from 'lucide-react';
import { useEvents } from '../../contexts/EventsContext';
import { resolveMediaUrl } from '../../utils/constants';
import EventForm from './EventForm';

export default function EventsManager({ notify }) {
  const { allEvents, deleteEvent, updateEvent } = useEvents();
  const [editingEvent, setEditingEvent] = useState(null);
  const [creatingNew, setCreatingNew] = useState(false);

  // Custom Confirm Modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    id: null,
    title: ''
  });

  const handleToggleActive = async (event) => {
    await updateEvent(event.id, {
      ...event,
      isActive: !event.isActive
    });
    if (notify) {
      notify({
        type: 'success',
        text: `Evento "${event.title}" ${!event.isActive ? 'activado' : 'pausado'}.`
      });
    }
  };

  const handleTogglePopup = async (event) => {
    await updateEvent(event.id, {
      ...event,
      isPopup: !event.isPopup
    });
    if (notify) {
      notify({
        type: 'info',
        text: `Modo popup ${!event.isPopup ? 'habilitado' : 'deshabilitado'} para "${event.title}".`
      });
    }
  };

  const requestDelete = (id, title) => {
    setConfirmModal({
      isOpen: true,
      id,
      title
    });
  };

  const executeDelete = async () => {
    if (confirmModal.id) {
      await deleteEvent(confirmModal.id);
      if (notify) {
        notify({
          type: 'error',
          text: `Anuncio "${confirmModal.title}" eliminado.`
        });
      }
      setConfirmModal({ isOpen: false, id: null, title: '' });
    }
  };

  if (creatingNew || editingEvent) {
    return (
      <EventForm
        event={editingEvent}
        onDone={() => {
          setEditingEvent(null);
          setCreatingNew(false);
          if (notify) {
            notify({
              type: 'success',
              text: editingEvent ? 'Anuncio actualizado con éxito.' : 'Nuevo anuncio publicado correctamente.'
            });
          }
        }}
      />
    );
  }

  const getTypeBadge = (type) => {
    switch (type) {
      case 'promocion':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Tag size={12} className="text-emerald-600" />
            <span>Promoción</span>
          </span>
        );
      case 'festival':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Sparkles size={12} className="text-amber-600" />
            <span>Festival</span>
          </span>
        );
      case 'alerta':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle size={12} className="text-rose-600" />
            <span>Alerta</span>
          </span>
        );
      case 'cultural':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Palette size={12} className="text-purple-600" />
            <span>Cultural</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
            <Calendar size={12} className="text-sky-600" />
            <span>Evento</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Custom Confirmation Modal */}
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
                <h3 className="font-bold text-slate-900 text-lg">Eliminar Anuncio</h3>
              </div>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                ¿Estás seguro de que deseas eliminar permanentemente el anuncio <strong className="text-slate-900">"{confirmModal.title}"</strong>? Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmModal({ isOpen: false, id: null, title: '' })}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={executeDelete}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-200 transition-colors"
                >
                  Sí, Eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/95 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-sky-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
            <Bell size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Avisos, Eventos y Notificaciones</h2>
            <p className="text-xs text-slate-500">Notificaciones emergentes para visitantes y alertas comunitarias</p>
          </div>
        </div>

        <button
          onClick={() => setCreatingNew(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-200 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
        >
          <Plus size={16} />
          <span>Nuevo Anuncio</span>
        </button>
      </div>

      {/* Events Grid */}
      {allEvents.length === 0 ? (
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-12 text-center border border-sky-100 shadow-sm">
          <div className="w-16 h-16 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-sky-600">
            <Bell size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">No hay anuncios configurados</h3>
          <p className="text-slate-500 text-xs mb-5 max-w-sm mx-auto">
            Crea tu primer evento o notificación emergente para informar a los turistas que visitan Arica.
          </p>
          <button
            onClick={() => setCreatingNew(true)}
            className="px-5 py-2.5 rounded-2xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-700 transition-colors shadow-sm"
          >
            Crear Primer Anuncio
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allEvents.map((evt) => (
            <div
              key={evt.id}
              className={`bg-white/95 backdrop-blur-xl rounded-3xl border transition-all overflow-hidden flex flex-col justify-between shadow-sm ${
                evt.isActive ? 'border-sky-100' : 'border-slate-200 opacity-60 bg-slate-50'
              }`}
            >
              {evt.bannerUrl && (
                <div className="h-36 overflow-hidden bg-slate-900 relative">
                  <img
                    src={resolveMediaUrl(evt.bannerUrl)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    {getTypeBadge(evt.type)}
                  </div>
                  {evt.isPopup && (
                    <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black tracking-wide shadow-md">
                      POPUP ACTIVO
                    </span>
                  )}
                </div>
              )}

              <div className="p-5 flex-1">
                {!evt.bannerUrl && (
                  <div className="flex items-center gap-2 mb-3">
                    {getTypeBadge(evt.type)}
                    {evt.isPopup && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black tracking-wide shadow-xs">
                        POPUP ACTIVO
                      </span>
                    )}
                  </div>
                )}

                <h3 className="text-sm font-bold text-slate-900 mb-1.5">{evt.title}</h3>

                {(evt.placeName || evt.discountBadge) && (
                  <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                    {evt.placeName && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 text-[11px] font-semibold">
                        <Store size={11} className="text-sky-600" />
                        <span>{evt.placeName}</span>
                      </span>
                    )}
                    {evt.discountBadge && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                        <Tag size={11} className="text-emerald-600" />
                        <span>{evt.discountBadge}</span>
                      </span>
                    )}
                  </div>
                )}

                <p className="text-xs text-slate-600 line-clamp-3 mb-3 leading-relaxed">{evt.message}</p>

                {(evt.startDate || evt.endDate) && (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium mb-3">
                    <Calendar size={13} className="text-sky-600" />
                    <span>
                      {evt.startDate || 'Inicio'} → {evt.endDate || 'Vigente'}
                    </span>
                  </div>
                )}

                {evt.actionUrl && (
                  <a
                    href={evt.actionUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-sky-600 hover:text-sky-700 font-semibold inline-flex items-center gap-1 mb-2"
                  >
                    <span>Enlace oficial</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="px-5 py-3 bg-slate-50/80 border-t border-sky-50 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(evt)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-xl font-bold transition-colors ${
                      evt.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {evt.isActive ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                    <span>{evt.isActive ? 'Activo' : 'Pausado'}</span>
                  </button>

                  <button
                    onClick={() => handleTogglePopup(evt)}
                    className={`px-2.5 py-1 rounded-xl font-bold transition-colors ${
                      evt.isPopup
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    Popup: {evt.isPopup ? 'Sí' : 'No'}
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingEvent(evt)}
                    className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-white rounded-xl transition-colors"
                    title="Editar"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => requestDelete(evt.id, evt.title)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-white rounded-xl transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

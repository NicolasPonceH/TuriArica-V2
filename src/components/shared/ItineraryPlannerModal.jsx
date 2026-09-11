import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Sparkles, MapPin, Clock, Bus, X, Check, ArrowRight, Compass, Sun } from 'lucide-react';

const ITINERARIES = {
  '1-playa': [
    { time: '09:30 AM', title: 'Playa El Laucho', desc: 'Comienza tu mañana en las aguas tranquilas y piscina natural de El Laucho. Disfruta de una caminata frente al mar.', transport: 'Micro 12, 14, 10 al sur' },
    { time: '01:00 PM', title: 'Almuerzo en Caleta Arica', desc: 'Disfruta de un ceviche de reineta o empanadas de marisco recién extraído.', transport: 'Caminar 10 min o micro hacia el centro' },
    { time: '03:30 PM', title: 'Playa Chinchorro', desc: 'Tarde de sol en la playa de aguas más cálidas del norte. Camina por la costanera con helados de mango.', transport: 'Micro 12 o 14 dirección norte' },
    { time: '07:00 PM', title: 'Paseo 21 de Mayo', desc: 'Cierre del día en el paseo peatonal para compras de recuerdos y cena en terrazas.', transport: 'Cualquier micro con letrero "Centro"' },
  ],
  '1-historia': [
    { time: '09:00 AM', title: 'Museo de Sitio Colón 10', desc: 'Conoce las momias Chinchorro, las más antiguas de la humanidad (más de 7.000 años de antigüedad).', transport: 'Calle Colón, pleno centro' },
    { time: '11:30 AM', title: 'Catedral San Marcos', desc: 'Admira la imponente iglesia diseñada en fierro fundido por Gustave Eiffel.', transport: 'Plaza Colón, a 3 cuadras' },
    { time: '01:30 PM', title: 'Almuerzo en Terminal Agropecuario', desc: 'Prueba un auténtico picante de guatita y degusta las aceitunas de Azapa.', transport: 'Micro 12, 14, 8 con letrero "Agro"' },
    { time: '05:00 PM', title: 'Cima del Morro de Arica', desc: 'Atardecer inolvidable con vista panorámica de 360° y recorrido por las trincheras históricas.', transport: 'Subir por calle Sotomayor o taxi' },
  ],
  '2-mix': [
    { time: 'Día 1 - Mañana', title: 'Centro Histórico & Morro', desc: 'Recorre Colón 10, Catedral Eiffel y sube al peñón del Morro de Arica para contemplar la bahía.', transport: 'Caminar por el casco histórico' },
    { time: 'Día 1 - Tarde', title: 'Playa El Laucho & La Lisera', desc: 'Tarde de relajo, natación y gastronomía marina junto al océano.', transport: 'Micros 12, 14' },
    { time: 'Día 2 - Mañana', title: 'Cuevas de Anzota', desc: 'Aventura por los acantilados costeros, avistamiento de lobos marinos y grutas milenarias.', transport: 'Vehículo o tour hacia el sur' },
    { time: 'Día 2 - Tarde', title: 'Humedal del Río Lluta & Chinchorro', desc: 'Avistamiento de aves migratorias en el santuario natural y atardecer en Chinchorro.', transport: 'Ruta 5 norte / Micro 12' },
  ]
};

export default function ItineraryPlannerModal({ isOpen, onClose }) {
  const [days, setDays] = useState('1');
  const [focus, setFocus] = useState('playa');
  const [generated, setGenerated] = useState(false);

  if (!isOpen) return null;

  const key = days === '2' ? '2-mix' : `1-${focus}`;
  const plan = ITINERARIES[key] || ITINERARIES['1-playa'];

  const handleGenerate = () => {
    setGenerated(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94 }}
        className="glass-modal rounded-3xl overflow-hidden shadow-2xl border border-white/80 max-w-2xl w-full max-h-[90vh] flex flex-col relative"
      >
        {/* Header */}
        <div className="p-6 pb-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center text-white shadow-md">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black">Planificador Inteligente de Itinerarios</h3>
              <p className="text-xs text-slate-400">Arma tu visita ideal a la Ciudad de la Eterna Primavera</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Options form */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
                1. ¿Cuántos días estarás en Arica?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDays('1')}
                  className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all ${
                    days === '1'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  ⚡ 1 Día Express
                </button>
                <button
                  type="button"
                  onClick={() => setDays('2')}
                  className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all ${
                    days === '2'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  🌴 Fin de Semana (2-3 Días)
                </button>
              </div>
            </div>

            {days === '1' && (
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
                  2. ¿Cuál es tu preferencia de viaje?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFocus('playa')}
                    className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all ${
                      focus === 'playa'
                        ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🏖️ Playas & Relajo Costero
                  </button>
                  <button
                    type="button"
                    onClick={() => setFocus('historia')}
                    className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all ${
                      focus === 'historia'
                        ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🏛️ Historia, Eiffel & Momias
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Result Itinerary */}
          <div className="border-t border-slate-200 pt-5">
            <h4 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
              <Compass size={16} className="text-brand-500" />
              <span>Tu Itinerario Sugerido Paso a Paso</span>
            </h4>

            <div className="space-y-3 relative before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
              {plan.map((step, idx) => (
                <div key={idx} className="relative pl-8 space-y-1">
                  <div className="absolute left-1.5 top-1.5 w-3.5 h-3.5 rounded-full bg-brand-500 border-2 border-white shadow-xs" />
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md">
                      {step.time}
                    </span>
                    <h5 className="font-extrabold text-slate-900 text-sm">{step.title}</h5>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                    <Bus size={12} className="text-accent-500 shrink-0" />
                    <span>{step.transport}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <a
            href="/#mapa"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span>Ver Rutas en el Mapa 3D</span>
            <ArrowRight size={14} />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

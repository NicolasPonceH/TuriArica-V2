import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  X,
  ShieldCheck,
  ExternalLink,
  Map,
  Compass,
  FileText,
  Lock,
  Heart
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function OpenDataModal({ isOpen, onClose }) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm cursor-pointer"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl bg-white/95 backdrop-blur-2xl rounded-3xl border border-sky-100 shadow-2xl p-6 sm:p-8 text-left z-10 max-h-[90vh] overflow-y-auto"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-500 to-sky-400 text-white flex items-center justify-center shadow-lg shadow-brand-500/25 shrink-0">
              <Database size={22} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-md mb-1">
                <ShieldCheck size={13} />
                <span>Transparencia & Bien Público Digital</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                Políticas de Datos Públicos y Fuentes Abiertas
              </h3>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
            TuriArica es una iniciativa comunitaria y pública sin fines de lucro desarrollada para la ciudad de Arica. Toda la información geográfica, de transporte y de emergencia se alimenta exclusivamente de <strong>fuentes públicas, abiertas y oficiales</strong>:
          </p>

          {/* Sources List */}
          <div className="space-y-3.5 mb-6">
            {/* 1. OSM */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-sky-100 text-sky-700 shrink-0 mt-0.5">
                  <Map size={16} />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    OpenStreetMap (OSM) & Rutas Abiertas (OSRM)
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    La cartografía base, calles, ciclovías y puntos de interés provienen de OpenStreetMap bajo licencia abierta <em>Open Database License (ODbL)</em>. Los cálculos de rutas a pie, bicicleta o vehículo se procesan con tecnología abierta sin límites comerciales.
                  </p>
                </div>
              </div>
            </div>

            {/* 2. SENAPRED & SHOA */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-rose-100 text-rose-700 shrink-0 mt-0.5">
                  <Compass size={16} />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    SENAPRED y SHOA (Armada de Chile)
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Las Zonas de Inundación por Tsunami y vías de escape se basan estrictamente en la <em>Cartografía Oficial de Inundación</em> emitida por el Servicio Hidrográfico y Oceanográfico de la Armada (SHOA) y los protocolos de SENAPRED.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Cota 30+ y Seguridad */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-teal-100 text-teal-700 shrink-0 mt-0.5">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Puntos Seguros Cota 30+ y Luminarias Urbanas
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Puntos de encuentro certificados por encima de la cota de seguridad de 30 metros sobre el nivel del mar en la Región de Arica y Parinacota, y catastro de iluminación pública para recorridos nocturnos seguros.
                  </p>
                </div>
              </div>
            </div>

            {/* 4. SERNATUR & Monumentos */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0 mt-0.5">
                  <FileText size={16} />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Patrimonio, SERNATUR y Municipalidad de Arica
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Catastro patrimonial, museos, monumentos nacionales (Cultura Chinchorro) y servicios turísticos verificados con registros públicos de la Ilustre Municipalidad de Arica y SERNATUR.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy & Ethics */}
          <div className="p-4 rounded-2xl bg-brand-50/60 border border-brand-200/60 flex items-start gap-3 mb-6">
            <Lock size={18} className="text-brand-600 shrink-0 mt-0.5" />
            <div className="text-xs text-brand-900 leading-relaxed">
              <strong>Privacidad garantizada:</strong> No almacenamos tu ubicación GPS en ningún servidor ni utilizamos rastreadores de publicidad comercial. La geolocalización solo se procesa de forma local en tu navegador para calcular distancias y mostrar la ruta al punto seguro más cercano.
            </div>
          </div>

          {/* Footer of modal */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
              <Heart size={13} className="text-rose-500 fill-rose-500" />
              <span>Proyecto Comunitario Arica · 2026</span>
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer transition-colors"
            >
              Entendido
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

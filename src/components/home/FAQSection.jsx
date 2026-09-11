import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle,
  ChevronDown,
  PlusCircle,
  HeartHandshake,
  Smartphone,
  Database,
  ExternalLink,
  Mail
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import OpenDataModal from '../shared/OpenDataModal';

export default function FAQSection() {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState(0);
  const [showDataModal, setShowDataModal] = useState(false);

  const FAQ_ITEMS = [
    {
      id: 'why',
      icon: HeartHandshake,
      question: t('faq.why.q'),
      answer: t('faq.why.a'),
      badge: t('faq.why.badge')
    },
    {
      id: 'manage',
      icon: PlusCircle,
      question: t('faq.manage.q'),
      answer: t('faq.manage.a'),
      badge: t('faq.manage.badge')
    },
    {
      id: 'cost',
      icon: HelpCircle,
      question: t('faq.cost.q'),
      answer: t('faq.cost.a'),
      badge: t('faq.cost.badge')
    },
    {
      id: 'pwa',
      icon: Smartphone,
      question: t('faq.pwa.q'),
      answer: t('faq.pwa.a'),
      badge: t('faq.pwa.badge')
    }
  ];

  return (
    <section id="faq" className="max-w-5xl mx-auto px-4 sm:px-6 py-20 relative">
      {/* Decorative ambient gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-tr from-brand-300/15 via-sky-200/20 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="text-center mb-12 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-50 text-sky-800 text-xs font-black uppercase tracking-wider mb-3 border border-sky-200/80 shadow-2xs">
          <HelpCircle size={14} className="text-sky-600" />
          <span>{t('faq.badge')}</span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
          {t('faq.title')}
        </h2>
        <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto mt-3">
          {t('faq.subtitle')}
        </p>
      </div>

      {/* FAQ Accordion */}
      <div className="space-y-3 relative z-10">
        {FAQ_ITEMS.map((item, index) => {
          const isOpen = openIndex === index;
          const Icon = item.icon;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className={`rounded-2xl sm:rounded-3xl border transition-all duration-300 overflow-hidden ${
                isOpen
                  ? 'bg-white/95 backdrop-blur-xl border-sky-200 shadow-xl shadow-sky-900/5'
                  : 'bg-white/75 backdrop-blur-md border-slate-200/70 hover:bg-white hover:border-slate-300 shadow-xs'
              }`}
            >
              <button
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
                className="w-full px-5 sm:px-7 py-4 sm:py-5 flex items-center justify-between gap-4 text-left cursor-pointer transition-colors"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-3.5 sm:gap-4 flex-1 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                      isOpen
                        ? 'bg-gradient-to-tr from-brand-500 to-sky-400 text-white shadow-md shadow-brand-500/25'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {item.badge}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 leading-snug">
                      {item.question}
                    </h3>
                  </div>
                </div>

                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    isOpen ? 'bg-brand-50 text-brand-600 rotate-180' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <ChevronDown size={16} />
                </div>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 sm:px-7 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100/80 space-y-2">
                      <p className="whitespace-pre-line">{item.answer}</p>
                      {item.id === 'manage' && (
                        <div className="pt-2">
                          <a
                            href="mailto:contacto.turiarica@gmail.com?subject=Solicitud%20de%20Lugar%20TuriArica"
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold text-xs border border-sky-200 transition-colors"
                          >
                            <Mail size={13} />
                            <span>Enviar correo a contacto.turiarica@gmail.com</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Banner de Políticas y Fuentes de Datos Abiertos */}
      <div className="mt-8 p-4 sm:p-5 rounded-3xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-sky-100 text-sky-700 shrink-0 hidden sm:flex">
            <Database size={18} />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-900">
              ¿Quieres conocer las fuentes oficiales y licencias de datos?
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              TuriArica opera exclusivamente con datos públicos y abiertos de OpenStreetMap, SENAPRED, SHOA y SERNATUR.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowDataModal(true)}
          className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-black text-xs border border-slate-300 shadow-2xs transition-colors shrink-0 cursor-pointer flex items-center gap-1.5"
        >
          <span>Políticas y Fuentes Abiertas</span>
          <ExternalLink size={13} />
        </button>
      </div>

      {/* Modal de Fuentes de Datos Abiertos */}
      <OpenDataModal
        isOpen={showDataModal}
        onClose={() => setShowDataModal(false)}
      />
    </section>
  );
}

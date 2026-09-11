import { useState } from 'react';
import { Type, Moon, Volume2, Mic, Settings, ZoomIn, ZoomOut, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';

export default function AccessibilityToolbar({ onAssistantClick, onReadPageClick }) {
  const [isOpen, setIsOpen] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const { t } = useLanguage();

  const adjustText = (delta) => {
    const newSize = Math.max(14, Math.min(24, fontSize + delta));
    setFontSize(newSize);
    document.documentElement.style.fontSize = `${newSize}px`;
  };

  const toggleContrast = () => {
    document.body.classList.toggle('high-contrast');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.94 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: 'bottom right' }}
            className="flex flex-col glass-card bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/80 p-5 w-72 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
              <h4 className="font-bold text-gray-800 flex items-center gap-2">
                <Settings size={18} className="text-accent-500" />
                {t('a11y.title')}
              </h4>
            </div>

            <div className="space-y-4">
              {/* Text size */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('a11y.textSize')}</p>
                <div className="flex bg-gray-100 rounded-2xl p-1">
                  <button onClick={() => adjustText(-2)} className="flex-1 py-2 flex justify-center items-center rounded-xl hover:bg-white hover:shadow-sm text-gray-700 btn-tactile active:scale-95 cursor-pointer">
                    <ZoomOut size={18} />
                  </button>
                  <div className="flex-1 py-2 flex justify-center items-center font-bold text-brand-600 text-sm">
                    {fontSize}px
                  </div>
                  <button onClick={() => adjustText(2)} className="flex-1 py-2 flex justify-center items-center rounded-xl hover:bg-white hover:shadow-sm text-gray-700 btn-tactile active:scale-95 cursor-pointer">
                    <ZoomIn size={18} />
                  </button>
                </div>
              </div>

              {/* Quick action buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={toggleContrast}
                  className="flex flex-col items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl border border-gray-100 text-gray-700 hover:text-brand-600 btn-tactile active:scale-95 cursor-pointer"
                >
                  <Moon size={20} />
                  <span className="text-xs font-bold">{t('a11y.contrast')}</span>
                </button>
                <button
                  onClick={onReadPageClick}
                  className="flex flex-col items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl border border-gray-100 text-gray-700 hover:text-brand-600 btn-tactile active:scale-95 cursor-pointer"
                >
                  <Volume2 size={20} />
                  <span className="text-xs font-bold">{t('a11y.readPage')}</span>
                </button>
              </div>

              {/* Assistant CTA */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  onAssistantClick();
                }}
                className="w-full flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white rounded-2xl shadow-[0_4px_15px_rgba(14,165,233,0.3)] hover:shadow-[0_4px_20px_rgba(14,165,233,0.5)] font-bold mt-2 btn-tactile hover:scale-[1.02] active:scale-[0.97] cursor-pointer"
              >
                <Bot size={22} />
                {t('assistant.title')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-4 bg-accent-500 text-white rounded-full shadow-[0_4px_25px_rgba(249,115,22,0.5)] hover:bg-accent-600 btn-tactile hover:scale-105 active:scale-95 cursor-pointer"
        aria-label="Herramientas de accesibilidad"
      >
        <Settings size={28} className={`transition-transform duration-300 ease-out ${isOpen ? "rotate-90" : "rotate-0"}`} />
      </button>
    </div>
  );
}

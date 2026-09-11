import { useState } from 'react';
import { Mountain, Accessibility, Menu, X, MapPin, Map, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-6 py-3 sm:py-4"
    >
      <div className="max-w-6xl mx-auto glass-panel rounded-2xl px-4 sm:px-6 py-2.5 sm:py-3 flex justify-between items-center bg-white/85 backdrop-blur-xl border border-white/60 shadow-lg shadow-black/5">
        <a href="#inicio" className="flex items-center gap-2 font-bold text-lg sm:text-xl text-gray-900">
          <img
            src="/logo.png"
            alt="TuriArica"
            className="h-14 sm:h-18 w-auto max-w-[200px] object-contain drop-shadow-sm"
          />
          <span className="sr-only">TuriArica</span>
        </a>
        
        {/* Desktop Links */}
        <ul className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <li><a href="#inicio" className="hover:text-brand-600 transition-colors">Inicio</a></li>
          <li><a href="#lugares" className="hover:text-brand-600 transition-colors">Lugares</a></li>
          <li><a href="#mapa" className="hover:text-brand-600 transition-colors">Mapa</a></li>
        </ul>

        <div className="flex items-center gap-2">
          <a
            href="#mapa"
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-brand-50 hover:bg-brand-100 text-brand-600 text-xs font-bold transition-all border border-brand-200/60"
          >
            <Map size={14} />
            <span>Ver Mapa</span>
          </a>

          {/* Hamburger button on mobile */}
          <button 
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            aria-label="Abrir menú"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="md:hidden mt-2 mx-auto max-w-6xl glass-panel rounded-2xl p-4 bg-white/95 backdrop-blur-2xl border border-gray-100 shadow-xl flex flex-col gap-2"
          >
            <a 
              href="#inicio" 
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-brand-50 text-gray-800 font-bold text-sm transition-colors"
            >
              <Home size={18} className="text-brand-500" />
              <span>Inicio</span>
            </a>
            <a 
              href="#lugares" 
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-brand-50 text-gray-800 font-bold text-sm transition-colors"
            >
              <MapPin size={18} className="text-accent-500" />
              <span>Lugares Turísticos</span>
            </a>
            <a 
              href="#mapa" 
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-brand-50 text-gray-800 font-bold text-sm transition-colors"
            >
              <Map size={18} className="text-brand-600" />
              <span>Mapa Interactivo & Rutas</span>
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

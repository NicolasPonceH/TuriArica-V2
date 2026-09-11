import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Map, MapPin, Accessibility, Mountain, Search, Menu, X, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePlaces } from '../../contexts/PlacesContext';
import { SUPPORTED_LANGUAGES } from '../../utils/constants';
import NotificationBell from '../shared/NotificationBell';

export default function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [langOpen, setLangOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { searchPlaces } = usePlaces();

  const searchResults = searchQuery.trim() ? searchPlaces(searchQuery).slice(0, 5) : [];

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-3 sm:py-4 pointer-events-none"
    >
      <div className="max-w-6xl mx-auto glass-panel rounded-2xl px-4 sm:px-6 py-3 flex justify-between items-center relative pointer-events-auto">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 font-extrabold text-xl text-gray-900 shrink-0 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-500 to-brand-500 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
            <Mountain size={18} />
          </div>
          <span className="hidden sm:inline tracking-tight font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            TuriArica
          </span>
        </Link>

        {/* Desktop Nav */}
        <ul className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-600">
          <li>
            <a href="/#inicio" className="hover:text-brand-600 transition-colors py-1 relative">
              {t('nav.home')}
            </a>
          </li>
          <li>
            <a href="/#lugares" className="hover:text-brand-600 transition-colors py-1 relative">
              {t('nav.places')}
            </a>
          </li>
          <li>
            <a href="/#mapa" className="hover:text-brand-600 transition-colors py-1 relative">
              {t('nav.map')}
            </a>
          </li>
        </ul>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <NotificationBell />

          {/* Search toggle */}
          <button
            onClick={() => { setSearchOpen(!searchOpen); setMobileOpen(false); setLangOpen(false); }}
            className="p-2.5 rounded-xl bg-brand-50/80 hover:bg-brand-100 text-brand-600 btn-tactile cursor-pointer"
            aria-label="Buscar"
          >
            <Search size={18} />
          </button>

          {/* Language selector */}
          <div className="relative">
            <button
              onClick={() => { setLangOpen(!langOpen); setSearchOpen(false); setMobileOpen(false); }}
              className="p-2.5 rounded-xl bg-brand-50/80 hover:bg-brand-100 text-brand-600 btn-tactile flex items-center gap-1.5 cursor-pointer"
              aria-label="Idioma"
            >
              <Globe size={18} />
              <span className="text-xs font-black hidden sm:inline">{language.toUpperCase()}</span>
            </button>

            <AnimatePresence>
              {langOpen && (
                <motion.div
                  style={{ transformOrigin: 'top right' }}
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute right-0 top-12 glass-modal rounded-2xl p-2 min-w-[190px] z-50 shadow-2xl"
                >
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => { setLanguage(lang.code); setLangOpen(false); }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-3 transition-colors cursor-pointer ${
                        language === lang.code
                          ? 'bg-brand-50 text-brand-600 font-extrabold'
                          : 'text-gray-700 hover:bg-gray-100/80'
                      }`}
                    >
                      <span className="text-base">{lang.flag}</span>
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => { setMobileOpen(!mobileOpen); setSearchOpen(false); setLangOpen(false); }}
            className="p-2.5 rounded-xl bg-brand-50/80 hover:bg-brand-100 text-brand-600 btn-tactile md:hidden cursor-pointer"
            aria-label="Menú"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Search dropdown */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            style={{ transformOrigin: 'top center' }}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-6xl mx-auto mt-2 pointer-events-auto"
          >
            <div className="glass-modal rounded-2xl px-5 py-3.5 shadow-2xl">
              <div className="flex items-center gap-3">
                <Search size={18} className="text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('nav.search')}
                  className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-400 text-sm font-medium"
                  autoFocus
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600 p-1">
                    <X size={16} />
                  </button>
                )}
              </div>

              {searchResults.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                  {searchResults.map(place => (
                    <a
                      key={place.id}
                      href="/#mapa"
                      onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50/90 transition-colors"
                    >
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
                        style={{ backgroundColor: place.color + '25' }}
                      >
                        <MapPin size={15} style={{ color: place.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-900 truncate">{place.name}</p>
                        <p className="text-xs text-gray-500">{place.category}</p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            style={{ transformOrigin: 'top center' }}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-6xl mx-auto mt-2 md:hidden pointer-events-auto"
          >
            <div className="glass-modal rounded-2xl px-6 py-4 shadow-2xl">
              <ul className="space-y-1.5">
                {[
                  { href: "/#inicio", label: t('nav.home') },
                  { href: "/#lugares", label: t('nav.places') },
                  { href: "/#mapa", label: t('nav.map') },
                ].map(item => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="block py-3 px-4 rounded-xl text-gray-800 hover:bg-brand-50 hover:text-brand-600 font-bold text-sm transition-colors"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

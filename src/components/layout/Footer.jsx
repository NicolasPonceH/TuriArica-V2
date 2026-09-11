import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mountain, Settings, Database } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import OpenDataModal from '../shared/OpenDataModal';

export default function Footer() {
  const { t } = useLanguage();
  const [dataModalOpen, setDataModalOpen] = useState(false);

  return (
    <footer className="bg-surface-900 py-12 text-center border-t border-gray-200">
      <div className="flex items-center justify-center gap-2 mb-4">
        <img src="/logo.png" alt="TuriArica" className="h-16 sm:h-20 w-auto object-contain drop-shadow-sm" />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs font-bold text-slate-500 mb-6">
        <a href="/#inicio" className="hover:text-brand-600 transition-colors">{t('nav.home')}</a>
        <a href="/#lugares" className="hover:text-brand-600 transition-colors">{t('nav.places')}</a>
        <a href="/#mapa" className="hover:text-brand-600 transition-colors">{t('nav.map')}</a>
        <Link to="/mapa" className="hover:text-brand-600 transition-colors">{t('nav.fullMap')}</Link>
        <a href="/#faq" className="hover:text-brand-600 transition-colors">{t('nav.faq')}</a>
        <button
          onClick={() => setDataModalOpen(true)}
          className="hover:text-brand-600 transition-colors cursor-pointer"
        >
          {t('footer.openData') || 'Fuentes & Datos Abiertos'}
        </button>
      </div>

      <div className="text-sm text-gray-400 mb-4">
        {t('footer.madeWith')}
      </div>

      {/* Admin & Open Data links */}
      <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-center gap-4">
        <button
          onClick={() => setDataModalOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
        >
          <Database size={12} />
          <span>Políticas de Datos Abiertos</span>
        </button>
        <span className="text-gray-300">·</span>
        <Link
          to="/admin"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Settings size={12} />
          <span>{t('footer.admin')}</span>
        </Link>
      </div>

      <OpenDataModal
        isOpen={dataModalOpen}
        onClose={() => setDataModalOpen(false)}
      />
    </footer>
  );
}

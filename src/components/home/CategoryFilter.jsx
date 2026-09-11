import { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CATEGORIES, CATEGORY_TYPES, getCategoriesByType } from '../../data/categories';
import { useLanguage } from '../../contexts/LanguageContext';

const FEATURED_IDS = ['Playa', 'Histórico', 'Museo', 'Naturaleza', 'Gastronomía'];

export default function CategoryFilter({ activeCategory, setActiveCategory, activeType, setActiveType }) {
  const { t } = useLanguage();
  const [showAll, setShowAll] = useState(false);

  // When activeType is 'todos', show featured categories unless showAll is toggled
  const typeCategories = activeType === 'todos'
    ? CATEGORIES
    : getCategoriesByType(activeType);

  const displayedCategories = activeType === 'todos' && !showAll
    ? typeCategories.filter(c => FEATURED_IDS.includes(c.id))
    : typeCategories;

  const hiddenCount = typeCategories.length - displayedCategories.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mb-10 space-y-3"
    >
      {/* Level 1: Sector / Domain Switcher */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-black uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline">
          Filtrar:
        </span>
        {CATEGORY_TYPES.map(type => {
          const Icon = LucideIcons[type.icon] || LucideIcons.MapPin;
          const isSelected = activeType === type.id;
          return (
            <motion.button
              key={type.id}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 450, damping: 25 }}
              onClick={() => {
                setActiveType(type.id);
                setActiveCategory('Todos');
                setShowAll(false);
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
                  : 'glass-pill text-slate-700 hover:bg-white hover:text-slate-950 border border-white/70 shadow-2xs'
              }`}
            >
              <Icon size={15} />
              <span>{t(`cat.${type.id}`) || type.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Level 2: Clean, curated subcategory chips (organized to avoid clutter) */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <motion.button
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 450, damping: 25 }}
          onClick={() => setActiveCategory('Todos')}
          className={`px-4 py-1.5 rounded-full font-black text-xs sm:text-sm cursor-pointer transition-colors ${
            activeCategory === 'Todos'
              ? 'bg-accent-500 text-white shadow-md shadow-orange-500/25'
              : 'glass-pill text-slate-700 hover:bg-white hover:text-slate-900 border border-white/70 shadow-2xs'
          }`}
        >
          {t('cat.all')}
        </motion.button>

        {displayedCategories.map(cat => {
          const Icon = LucideIcons[cat.icon] || LucideIcons.MapPin;
          const isSelected = activeCategory === cat.id;
          return (
            <motion.button
              key={cat.id}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 450, damping: 25 }}
              onClick={() => setActiveCategory(cat.id)}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full font-bold text-xs sm:text-sm cursor-pointer transition-all ${
                isSelected
                  ? 'text-white shadow-md'
                  : 'glass-pill text-slate-700 hover:bg-white hover:text-slate-900 border border-white/70 shadow-2xs'
              }`}
              style={isSelected ? { backgroundColor: cat.color } : {}}
            >
              <Icon size={14} />
              <span>{cat.label}</span>
            </motion.button>
          );
        })}

        {/* Toggle to expand/collapse secondary categories if on 'todos' */}
        {activeType === 'todos' && (
          <button
            onClick={() => setShowAll(prev => !prev)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-black text-brand-600 bg-brand-50/80 hover:bg-brand-100/90 border border-brand-200/70 btn-tactile cursor-pointer"
          >
            <LucideIcons.SlidersHorizontal size={12} />
            <span>{showAll ? 'Ver menos' : `+ Más categorías (${hiddenCount})`}</span>
          </button>
        )}
      </div>
    </motion.div>
  );
}

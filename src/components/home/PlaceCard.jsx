import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { resolveMediaUrl } from '../../utils/constants';
import { getGoogleMapsUrl } from '../../utils/navigation';

export default function PlaceCard({ place, onAudioClick, onRouteClick, onMoreClick }) {
  const IconComponent = LucideIcons[place.icon] || LucideIcons.MapPin;
  const { t } = useLanguage();
  const accessibility = place.accessibility || {};

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover={{ y: -5 }}
      className="glass-card rounded-2xl overflow-hidden flex flex-col h-full group hover:shadow-2xl transition-all duration-300 border border-white/80"
    >
      {/* Header with gradient and photo */}
      <div
        className="h-36 sm:h-40 relative overflow-hidden flex items-center justify-center bg-slate-900"
        style={{ background: `linear-gradient(135deg, ${place.color}40, ${place.color}80)` }}
      >
        {/* Photo if available */}
        {place.photos && place.photos.length > 0 ? (
          <img
            src={resolveMediaUrl(place.photos[0])}
            alt={place.name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : null}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

        <span className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-xs font-bold text-gray-800 shadow-sm flex items-center gap-1.5 border border-white/40">
          <IconComponent size={13} style={{ color: place.color }} />
          {place.category}
        </span>

        {place.is24h && (
          <span className="absolute top-3 right-3 px-2 py-0.5 bg-emerald-500/95 backdrop-blur-md rounded-full text-[10px] font-bold text-white shadow-xs">
            24h
          </span>
        )}

        {/* Brand Icon floating */}
        <div 
          className="absolute bottom-3 right-3 w-9 h-9 rounded-xl backdrop-blur-md border border-white/50 shadow-md flex items-center justify-center text-white"
          style={{ backgroundColor: `${place.color}e6` }}
        >
          <IconComponent size={18} />
        </div>
      </div>

      {/* Content */}
      <div className="p-5 sm:p-6 flex flex-col flex-grow">
        <h3 className="text-lg sm:text-xl font-bold mb-1.5 text-gray-900 group-hover:text-brand-600 transition-colors">
          {place.name}
        </h3>

        {/* Accessibility & Fee Badges */}
        <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
          {accessibility.wheelchair && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
              <LucideIcons.Accessibility size={11} /> Accesible
            </span>
          )}
          {place.entryFee && (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80 truncate max-w-[180px]">
              {place.entryFee}
            </span>
          )}
        </div>

        <p className="text-gray-600 text-xs sm:text-sm mb-4 flex-grow line-clamp-2 leading-relaxed">
          {place.shortDesc}
        </p>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-auto pt-2 border-t border-gray-100">
          <button
            onClick={() => onAudioClick(place)}
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-brand-600 transition-colors"
            title={`Escuchar descripción de ${place.name}`}
            aria-label={`Escuchar descripción de ${place.name}`}
          >
            <LucideIcons.Volume2 size={17} />
          </button>

          <button
            onClick={() => onRouteClick(place)}
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-brand-600 transition-colors"
            title={`Trazar ruta en mapa web hacia ${place.name}`}
            aria-label={`Cómo llegar a ${place.name}`}
          >
            <LucideIcons.Navigation size={17} />
          </button>

          <a
            href={getGoogleMapsUrl(place.lat, place.lng, place.name)}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-colors flex items-center justify-center border border-blue-100"
            title={`Abrir ${place.name} en Google Maps (Navegación GPS)`}
            aria-label={`Abrir en Google Maps`}
          >
            <LucideIcons.Compass size={17} />
          </a>

          <button
            onClick={() => onMoreClick(place)}
            className="flex-1 py-2 px-3.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-600 hover:text-brand-700 font-bold text-xs sm:text-sm transition-colors border border-brand-100 text-center"
          >
            {t('places.seeMore')}
          </button>
        </div>
      </div>
    </motion.article>
  );
}

import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { getGoogleMapsUrl } from '../utils/navigation';

export default function PlaceCard({ place, onAudioClick, onRouteClick, onMoreClick }) {
  const IconComponent = LucideIcons[place.icon] || LucideIcons.MapPin;

  return (
    <motion.article 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover={{ y: -5 }}
      className="glass-panel rounded-2xl overflow-hidden flex flex-col h-full group bg-white shadow-md hover:shadow-2xl transition-all border border-gray-100"
    >
      {/* Real Place Photo with Category and Icon Overlay */}
      <div className="h-44 sm:h-48 relative overflow-hidden bg-slate-900">
        <img 
          src={place.image} 
          alt={place.name} 
          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-black/25 pointer-events-none" />

        {/* Category Badge */}
        <span className="absolute top-3 left-3 px-3 py-1 bg-white/95 backdrop-blur-md rounded-full text-xs font-bold text-gray-900 shadow-md border border-white/60">
          {place.category}
        </span>

        {/* Floating Brand Color Icon */}
        <div 
          className="absolute bottom-3 right-3 w-10 h-10 rounded-2xl backdrop-blur-md border border-white/50 shadow-lg flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-110"
          style={{ backgroundColor: `${place.color}f0` }}
        >
          <IconComponent size={20} />
        </div>
      </div>

      <div className="p-5 sm:p-6 flex flex-col flex-grow">
        <h3 className="text-lg sm:text-xl font-extrabold mb-1.5 text-gray-900 group-hover:text-brand-600 transition-colors">
          {place.name}
        </h3>

        {/* Locomotion quick pill */}
        {place.transport?.lineas && (
          <div className="flex items-center gap-1.5 mb-2.5 text-[11px] font-semibold text-gray-500">
            <LucideIcons.Bus size={13} className="text-accent-500 shrink-0" />
            <span className="truncate">Micros: {place.transport.lineas.slice(0, 4).join(', ')}{place.transport.lineas.length > 4 ? '...' : ''}</span>
          </div>
        )}

        <p className="text-gray-600 text-xs sm:text-sm mb-5 flex-grow line-clamp-2 leading-relaxed">
          {place.shortDesc}
        </p>

        <div className="flex items-center gap-2 mt-auto pt-2 border-t border-gray-100">
          <button 
            onClick={() => onAudioClick(place)}
            className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-brand-600 transition-colors"
            title={`Escuchar descripción de ${place.name}`}
            aria-label={`Escuchar descripción de ${place.name}`}
          >
            <LucideIcons.Volume2 size={18} />
          </button>
          <button 
            onClick={() => onRouteClick(place)}
            className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-brand-600 transition-colors"
            title={`Trazar ruta en mapa web hacia ${place.name}`}
            aria-label={`Cómo llegar a ${place.name}`}
          >
            <LucideIcons.Navigation size={18} />
          </button>
          <a
            href={getGoogleMapsUrl(place.lat, place.lng, place.name)}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-colors flex items-center justify-center border border-blue-100"
            title={`Abrir ${place.name} en Google Maps (Navegación GPS)`}
            aria-label={`Abrir en Google Maps`}
          >
            <LucideIcons.Compass size={18} />
          </a>
          <button 
            onClick={() => onMoreClick(place)}
            className="flex-1 py-2.5 px-4 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-600 hover:text-brand-700 font-bold text-xs sm:text-sm transition-colors border border-brand-100 text-center"
          >
            Ver más
          </button>
        </div>
      </div>
    </motion.article>
  );
}

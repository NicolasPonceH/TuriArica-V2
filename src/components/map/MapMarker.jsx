import * as LucideIcons from 'lucide-react';
import { getCategoryMeta } from '../../data/categories';

export default function MapMarker({ place, isSelected, onClick, onMouseEnter, onMouseLeave, hasPromo, promoBadge }) {
  const meta = getCategoryMeta(place.category);
  const IconComponent = LucideIcons[meta.icon] || LucideIcons.MapPin;

  return (
    <div
      className={`relative group cursor-pointer transition-all duration-300 flex items-center justify-center ${
        isSelected ? 'scale-125 z-30' : 'hover:scale-110 z-10'
      }`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        className={`w-10 h-10 rounded-full border-[3px] shadow-[0_4px_18px_rgba(0,0,0,0.35)] flex items-center justify-center transition-all ${
          isSelected
            ? 'border-white ring-4 ring-accent-400 ring-offset-2 scale-110'
            : 'border-white group-hover:border-accent-200'
        }`}
        style={{ backgroundColor: place.color }}
      >
        <IconComponent size={16} className="text-white drop-shadow" />
      </div>

      {hasPromo && (
        <div className="absolute -top-2 -right-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-[9px] px-1.5 py-0.5 rounded-full shadow-md border border-white flex items-center gap-0.5 animate-pulse z-20 whitespace-nowrap">
          <LucideIcons.Tag size={9} />
          <span>{promoBadge || 'Promo'}</span>
        </div>
      )}

      <div className="absolute -bottom-1.5 w-2.5 h-2.5 rounded-full border border-gray-400 shadow-sm bg-white" />
    </div>
  );
}

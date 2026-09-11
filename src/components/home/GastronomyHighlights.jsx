import { Utensils, Sparkles, MapPin, ExternalLink, ArrowRight } from 'lucide-react';

const DISHES = [
  {
    title: 'Aceitunas del Valle de Azapa',
    subtitle: 'Denominación de Origen Protegida',
    desc: 'Famosas por su color morado intenso, textura carnosa y sabor inconfundible gracias al clima templado del valle.',
    placeName: 'Valle de Azapa / Terminal Agropecuario',
    badge: 'Patrimonio de Arica',
    bgGradient: 'from-amber-950/90 to-slate-900',
    img: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=600&auto=format&fit=crop'
  },
  {
    title: 'Mariscos y Pescados en la Caleta',
    subtitle: 'Pesca Artesanal del Pacífico',
    desc: 'Ceviches frescos, pailas marinas, empanadas de marisco y lenguado recién extraído junto al muelle de pescadores.',
    placeName: 'Caleta de Pescadores de Arica',
    badge: 'Fresco del Día',
    bgGradient: 'from-blue-950/90 to-slate-900',
    img: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop'
  },
  {
    title: 'Mangos y Maracuyá de Lluta',
    subtitle: 'Frutas Tropicales del Desierto',
    desc: 'Cultivadas en el oasis del Río Lluta, son la base de los mejores jugos naturales, helados artesanales y pisco sour.',
    placeName: 'Valle de Lluta & Paseo 21 de Mayo',
    badge: 'Cosecha Local',
    bgGradient: 'from-orange-950/90 to-slate-900',
    img: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop'
  },
  {
    title: 'Picante de Guatita y Cocinerías',
    subtitle: 'Tradición Andina y Criolla',
    desc: 'Plato emblemático con papas chuño, rocoto y sazón tradicional. El almuerzo por excelencia de los ariqueños.',
    placeName: 'Terminal Agropecuario ASOCAPEC',
    badge: 'Plato Típico',
    bgGradient: 'from-red-950/90 to-slate-900',
    img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop'
  }
];

export default function GastronomyHighlights({ onSelectPlace }) {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 my-16">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-800 text-xs font-black uppercase tracking-wider mb-2 border border-amber-200">
          <Utensils size={14} className="text-amber-600" />
          <span>Sabores de la Eterna Primavera</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Ruta Gastronómica Autóctona
        </h2>
        <p className="text-slate-500 text-sm sm:text-base max-w-xl mx-auto mt-2">
          Descubre los sabores únicos nacidos de la mezcla entre el Océano Pacífico, los valles fértiles y la tradición andina.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {DISHES.map((dish, i) => (
          <div
            key={i}
            className="group relative rounded-3xl overflow-hidden glass-card shadow-lg border border-white/80 bg-white/95 flex flex-col justify-between card-tactile hover:-translate-y-1.5"
          >
            <div className="h-48 overflow-hidden relative bg-slate-900">
              <img
                src={dish.img}
                alt={dish.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 uppercase tracking-wider shadow-sm">
                {dish.badge}
              </span>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-1">
                  {dish.subtitle}
                </p>
                <h3 className="text-base font-extrabold text-slate-900 mb-2 leading-snug">
                  {dish.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {dish.desc}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 truncate flex items-center gap-1">
                  <MapPin size={12} className="text-brand-500 shrink-0" />
                  <span className="truncate">{dish.placeName}</span>
                </span>
                <a
                  href="/#mapa"
                  className="text-xs font-black text-brand-600 hover:text-brand-700 flex items-center gap-0.5 shrink-0 btn-tactile hover:scale-[1.05] active:scale-[0.95]"
                >
                  <span>Ver</span>
                  <ArrowRight size={13} />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

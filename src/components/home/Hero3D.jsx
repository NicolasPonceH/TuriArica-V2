import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const VIDEOS = [
  "https://res.cloudinary.com/dirgawanf/video/upload/v1789048051/Aerial_view_of_coastline_1080p_20260910104702_znysl3.mp4",
  "https://res.cloudinary.com/dirgawanf/video/upload/v1789047168/Animating_Morro_de_Arica_image_20260910102927_ucuiqp.mp4",
  "https://res.cloudinary.com/dirgawanf/video/upload/v1789047390/Camera_moving_over_Lake_Chungar%C3%A1_20260910103602_sxonwf.mp4#t=1.2",
  "https://res.cloudinary.com/dirgawanf/video/upload/v1789047679/Drone_flying_over_Azapa_Valley_20260910104102_ccgtbt.mp4"
];

function VideoBackground() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % VIDEOS.length);
    }, 6000); // Cambia cada 6 segundos
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-black">
      {VIDEOS.map((src, index) => (
        <video
          key={src}
          src={src}
          autoPlay
          muted
          loop
          playsInline
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
      {/* Overlay oscuro muy sutil para que resalten los colores reales del video pero el texto blanco se lea */}
      <div className="absolute inset-0 bg-black/30"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-surface-900/90"></div>
    </div>
  );
}

import { Wind, Droplets, Sparkles, Map, List } from 'lucide-react';
import { getUvDetails, getWeatherVisuals } from '../../utils/weatherUtils';

export default function Hero3D({
  weatherData,
  activeCondition = 'clear',
  previewCondition = null,
  onSetPreviewCondition
}) {
  const fallbackWeather = {
    temp: 20.6,
    condition: 'Soleado',
    windSpeedKmH: 14.6,
    windDirection: 'SSE',
    humidity: 79,
    uvIndex: 1
  };

  const weather = weatherData || fallbackWeather;
  const visuals = getWeatherVisuals(activeCondition);
  const uv = getUvDetails(weather.uvIndex);

  return (
    <section id="inicio" className="relative min-h-[90vh] sm:h-screen w-full overflow-hidden flex items-center">
      <VideoBackground />

      {/* Soft atmospheric gradient on the left for maximum editorial text legibility */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/50 to-transparent dark:from-slate-950/90 dark:via-slate-950/60 dark:to-transparent pointer-events-none z-1" />

      {/* Main Left-Aligned Container matching reference image */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-20 pt-24 sm:pt-20 pb-16 flex flex-col items-start text-left">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="max-w-2xl"
        >
          {/* Top Left Floating Weather Capsule & Atmosphere Controls */}
          <div className="flex flex-wrap items-center gap-3 mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/75 dark:bg-slate-900/80 backdrop-blur-xl border border-white/80 dark:border-white/15 shadow-sm text-slate-900 dark:text-white text-xs sm:text-sm font-semibold">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-white/90 dark:bg-white/15 text-slate-700 dark:text-slate-200 shadow-2xs">
                <visuals.Icon size={14} className={visuals.accentColor} />
              </div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {weather.condition || visuals.label}
              </span>
              <span className="text-slate-400 dark:text-white/40">·</span>
              <span className="font-bold text-slate-950 dark:text-white">
                {weather.temp}°C
              </span>
              <span className="text-slate-400 dark:text-white/40">·</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-black shadow-xs ${uv.badgeBg}`}>
                UV {uv.value}
              </span>
            </div>

            {/* Atmosphere Preview Controls */}
            {onSetPreviewCondition && (
              <div className="hidden sm:inline-flex items-center gap-1 p-1 rounded-full bg-white/60 dark:bg-slate-900/70 backdrop-blur-md border border-white/60 dark:border-white/15 text-[11px] shadow-2xs">
                <button
                  onClick={() => onSetPreviewCondition(null)}
                  className={`px-2.5 py-1 rounded-full font-bold btn-tactile cursor-pointer ${
                    !previewCondition ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                  title="Restaurar clima en vivo"
                >
                  🔴 En vivo
                </button>
                <button
                  onClick={() => onSetPreviewCondition('clear')}
                  className={`px-2.5 py-1 rounded-full font-bold btn-tactile cursor-pointer ${
                    previewCondition === 'clear' ? 'bg-amber-400 text-slate-950 shadow-2xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  ☀️ Soleado
                </button>
                <button
                  onClick={() => onSetPreviewCondition('cloudy')}
                  className={`px-2.5 py-1 rounded-full font-bold btn-tactile cursor-pointer ${
                    previewCondition === 'cloudy' ? 'bg-slate-300 text-slate-950 shadow-2xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  ☁️ Nublado
                </button>
                <button
                  onClick={() => onSetPreviewCondition('sunset')}
                  className={`px-2.5 py-1 rounded-full font-bold btn-tactile cursor-pointer ${
                    previewCondition === 'sunset' ? 'bg-orange-500 text-white shadow-2xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  🌅 Atardecer
                </button>
                <button
                  onClick={() => onSetPreviewCondition('night')}
                  className={`px-2.5 py-1 rounded-full font-bold btn-tactile cursor-pointer ${
                    previewCondition === 'night' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  🌙 Noche
                </button>
              </div>
            )}
          </div>

          {/* Eyebrow Label matching reference image */}
          <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold uppercase tracking-widest text-slate-600/90 dark:text-slate-400 mb-3.5">
            <Sparkles size={15} className="text-slate-500 dark:text-slate-400" />
            <span>Descubre la Eterna Primavera</span>
          </div>

          {/* Main Title matching reference layout: 2 lines, authoritative editorial */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.2rem] font-black tracking-tight text-slate-950 dark:text-white leading-[1.03] mb-5">
            Arica, de forma <br />
            <span className="text-slate-600/95 dark:text-slate-400 font-extrabold">inclusiva</span>
          </h1>

          {/* Description paragraph matching reference */}
          <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 font-normal sm:font-medium leading-relaxed max-w-xl mb-8 sm:mb-9">
            Explora los atractivos turísticos de la ciudad con un mapa interactivo diseñado para todos. Accesibilidad total y sin barreras.
          </p>

          {/* Action Buttons matching reference image */}
          <div className="flex flex-wrap items-center gap-4">
            <a
              href="#mapa"
              className="px-7 py-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm tracking-wide shadow-lg shadow-slate-950/20 flex items-center gap-2.5 btn-tactile hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Map size={18} />
              <span>Explorar el Mapa</span>
            </a>
            <a
              href="#lugares"
              className="px-7 py-3.5 rounded-full bg-white/40 hover:bg-white/60 dark:bg-white/10 dark:hover:bg-white/20 text-slate-800 hover:text-slate-950 dark:text-white font-bold text-sm tracking-wide shadow-xs backdrop-blur-md border border-slate-400/50 dark:border-white/30 flex items-center gap-2.5 btn-tactile hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <List size={18} />
              <span>Ver Lugares</span>
            </a>
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div 
        animate={{ y: [0, 8, 0] }} 
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 opacity-75 hidden sm:block"
      >
        <div className="w-[28px] h-[46px] border-2 border-slate-600 dark:border-white/60 rounded-full flex justify-center p-1.5 bg-black/10 backdrop-blur-xs shadow-xs">
          <div className="w-1 h-2.5 bg-slate-700 dark:bg-white rounded-full shadow-xs" />
        </div>
      </motion.div>
    </section>
  );
}

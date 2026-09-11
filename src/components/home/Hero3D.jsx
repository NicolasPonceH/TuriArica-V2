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

import { Wind, Droplets, Sparkles } from 'lucide-react';
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
    <section id="inicio" className="relative h-screen min-h-[700px] w-full overflow-hidden flex items-center justify-center">
      <VideoBackground />

      {/* Content Overlay */}
      <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto mt-14 sm:mt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        >
          {/* Live Weather & UV Glass Capsule over Hero */}
          <div className="inline-flex flex-col items-center gap-2 mb-4">
            <div className="inline-flex flex-wrap items-center justify-center gap-2 sm:gap-3.5 px-4 py-2 rounded-2xl glass-card bg-slate-950/50 backdrop-blur-xl border border-white/30 text-white shadow-2xl">
              {/* Temperature & Live status */}
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-white/10 border border-white/20 shadow-inner ${visuals.accentColor}`}>
                  <visuals.Icon size={18} />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight">{weather.temp}°C</span>
                  <span className="text-xs font-bold text-white/90">{weather.condition}</span>
                </div>
              </div>

              <div className="hidden sm:block h-4 w-px bg-white/25" />

              {/* Exact UV Index Number & Standard Scale Transformation */}
              <div className="flex items-center gap-1.5" title={uv.recommendation}>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border backdrop-blur-md shadow-xs ${uv.badgeBg}`}>
                  <span className={`w-2 h-2 rounded-full ${uv.dotColor} animate-pulse`} />
                  <span>Índice UV {uv.value} · {uv.level}</span>
                </span>
                <span className="hidden md:inline text-[11px] text-white/80 font-medium">
                  ({uv.recommendation})
                </span>
              </div>

              <div className="hidden sm:block h-4 w-px bg-white/25" />

              {/* Marine Wind & Humidity */}
              <div className="hidden sm:flex items-center gap-3 text-xs text-white/90 font-semibold">
                <span className="flex items-center gap-1" title="Viento costero">
                  <Wind size={13} className="text-sky-300" />
                  <span>{weather.windSpeedKmH} km/h</span>
                </span>
                <span className="text-white/40">·</span>
                <span className="flex items-center gap-1" title="Humedad relativa">
                  <Droplets size={13} className="text-blue-300" />
                  <span>{weather.humidity}%</span>
                </span>
              </div>
            </div>

            {/* Atmosphere Preview Controls (Allows testing sunny, cloudy, sunset, night background styles) */}
            {onSetPreviewCondition && (
              <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-black/40 backdrop-blur-md border border-white/20 text-[11px]">
                <button
                  onClick={() => onSetPreviewCondition(null)}
                  className={`px-2.5 py-1 rounded-lg font-bold btn-tactile cursor-pointer ${
                    !previewCondition ? 'bg-white text-brand-600 shadow-xs scale-[1.02]' : 'text-white/80 hover:text-white'
                  }`}
                  title="Restaurar clima en vivo de Capitanía de Puerto"
                >
                  🔴 En vivo
                </button>
                <button
                  onClick={() => onSetPreviewCondition('clear')}
                  className={`px-2.5 py-1 rounded-lg font-bold btn-tactile cursor-pointer ${
                    previewCondition === 'clear' ? 'bg-amber-400 text-slate-950 shadow-xs scale-[1.02]' : 'text-white/80 hover:text-white'
                  }`}
                >
                  ☀️ Soleado
                </button>
                <button
                  onClick={() => onSetPreviewCondition('cloudy')}
                  className={`px-2.5 py-1 rounded-lg font-bold btn-tactile cursor-pointer ${
                    previewCondition === 'cloudy' ? 'bg-slate-200 text-slate-900 shadow-xs scale-[1.02]' : 'text-white/80 hover:text-white'
                  }`}
                >
                  ☁️ Nublado
                </button>
                <button
                  onClick={() => onSetPreviewCondition('sunset')}
                  className={`px-2.5 py-1 rounded-lg font-bold btn-tactile cursor-pointer ${
                    previewCondition === 'sunset' ? 'bg-orange-500 text-white shadow-xs scale-[1.02]' : 'text-white/80 hover:text-white'
                  }`}
                >
                  🌅 Atardecer
                </button>
                <button
                  onClick={() => onSetPreviewCondition('night')}
                  className={`px-2.5 py-1 rounded-lg font-bold btn-tactile cursor-pointer ${
                    previewCondition === 'night' ? 'bg-indigo-600 text-white shadow-xs scale-[1.02]' : 'text-white/80 hover:text-white'
                  }`}
                >
                  🌙 Noche
                </button>
              </div>
            )}
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight mb-5 text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]">
            Arica, de forma <span className="text-brand-300 drop-shadow-md">inclusiva</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-100 mb-8 max-w-2xl mx-auto font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-relaxed">
            Explora los atractivos turísticos de la ciudad con un mapa interactivo diseñado para todos. Accesibilidad universal y sin barreras.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#mapa"
              className="px-8 py-4 rounded-full bg-accent-500 hover:bg-accent-600 text-white font-black text-sm tracking-wide transition-all duration-150 ease-out shadow-[0_4px_20px_rgba(249,115,22,0.5)] hover:shadow-[0_4px_25px_rgba(249,115,22,0.7)] hover:scale-[1.03] active:scale-[0.97] btn-tactile cursor-pointer"
            >
              Explorar el Mapa
            </a>
            <a
              href="#lugares"
              className="px-8 py-4 rounded-full bg-white/15 hover:bg-white/25 text-white font-bold text-sm tracking-wide transition-all duration-150 ease-out shadow-lg backdrop-blur-md border border-white/40 hover:scale-[1.03] active:scale-[0.97] btn-tactile cursor-pointer"
            >
              Ver Lugares
            </a>
          </div>
        </motion.div>
      </div>
      
      {/* Scroll indicator */}
      <motion.div 
        animate={{ y: [0, 10, 0] }} 
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 opacity-90"
      >
        <div className="w-[30px] h-[50px] border-2 border-white/60 rounded-full flex justify-center p-2 bg-black/20 backdrop-blur-sm shadow-sm">
          <div className="w-1 h-3 bg-white rounded-full shadow-sm" />
        </div>
      </motion.div>
    </section>
  );
}

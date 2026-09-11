import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function VideoBackground() {
  const [videoSrc, setVideoSrc] = useState('/videos/Hero.mp4');

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-slate-900">
      <video
        key={videoSrc}
        src={videoSrc}
        autoPlay
        muted
        loop
        playsInline
        onError={() => setVideoSrc('http://localhost:5000/uploads/videos/Hero.mp4')}
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Overlay ultra ligero y natural sin degradados oscuros pesados */}
      <div className="absolute inset-0 bg-slate-950/15 pointer-events-none"></div>
    </div>
  );
}

import { Sparkles, Map, List, Sun, Cloud, Thermometer } from 'lucide-react';
import { getWeatherVisuals } from '../../utils/weatherUtils';
import { useLanguage } from '../../contexts/LanguageContext';

export default function Hero3D({
  weatherData,
  activeCondition = 'clear'
}) {
  const { t } = useLanguage();
  const fallbackWeather = {
    temp: 20.6,
    condition: 'Soleado',
    windSpeedKmH: 14.6,
    windDirection: 'SSE',
    humidity: 79
  };

  const weather = weatherData || fallbackWeather;
  const visuals = getWeatherVisuals(activeCondition);

  // Estilo dinámico, claro y translúcido adaptado a la temperatura de Arica
  const tempNum = typeof weather.temp === 'number' ? weather.temp : parseFloat(weather.temp) || 21;
  const getTempTheme = (t) => {
    if (t >= 23) {
      return {
        pillBg: 'bg-amber-100/35 hover:bg-amber-100/45 dark:bg-amber-950/25 border-amber-200/50 dark:border-amber-400/30 text-slate-900 dark:text-amber-100',
        iconBg: 'bg-amber-400/30 text-amber-700 dark:text-amber-300',
        dot: 'text-amber-500',
        badge: 'bg-amber-400/25 text-amber-950 dark:text-amber-200 border border-amber-300/40'
      };
    }
    if (t >= 19) {
      return {
        pillBg: 'bg-white/35 hover:bg-white/45 dark:bg-slate-900/30 border-white/50 dark:border-white/20 text-slate-900 dark:text-slate-100',
        iconBg: 'bg-sky-400/25 text-sky-700 dark:text-sky-300',
        dot: 'text-sky-400',
        badge: 'bg-sky-400/25 text-sky-950 dark:text-sky-200 border border-sky-300/40'
      };
    }
    return {
      pillBg: 'bg-cyan-100/30 hover:bg-cyan-100/40 dark:bg-cyan-950/25 border-cyan-200/50 dark:border-cyan-400/25 text-slate-900 dark:text-cyan-100',
      iconBg: 'bg-cyan-400/25 text-cyan-700 dark:text-cyan-300',
      dot: 'text-cyan-400',
      badge: 'bg-cyan-400/25 text-cyan-950 dark:text-cyan-200 border border-cyan-300/40'
    };
  };

  const tempTheme = getTempTheme(tempNum);

  return (
    <section id="inicio" className="relative min-h-[90vh] sm:h-screen w-full overflow-hidden flex items-center">
      <VideoBackground />

      {/* Main Left-Aligned Container matching reference layout */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-20 pt-32 sm:pt-36 lg:pt-40 pb-16 flex flex-col items-start text-left">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="max-w-2xl"
        >
          {/* Top Left Floating Weather Capsule: claro, transparente y dinámico según temperatura (Sin UV) */}
          <div className="mb-8 sm:mb-12">
            <motion.div
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-full backdrop-blur-xl border shadow-md text-xs sm:text-sm font-semibold transition-all duration-300 cursor-default ${tempTheme.pillBg}`}
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center shadow-2xs ${tempTheme.iconBg}`}>
                <visuals.Icon size={14} />
              </div>
              <span className="font-semibold text-slate-900 dark:text-slate-100 drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)] dark:drop-shadow-none">
                {weather.condition || visuals.label}
              </span>
              <span className={tempTheme.dot}>·</span>
              <span className="font-extrabold text-slate-950 dark:text-white drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)] dark:drop-shadow-none">
                {weather.temp}°C
              </span>
            </motion.div>
          </div>

          {/* Eyebrow Label con colores de marca */}
          <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold uppercase tracking-widest text-slate-800 dark:text-slate-200 drop-shadow-[0_1px_3px_rgba(255,255,255,0.8)] dark:drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] mb-3.5">
            <Sparkles size={15} className="text-accent-500" />
            <span>{t('hero.badge')}</span>
          </div>

          {/* Main Title: General, Inspirador y Turístico */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[5.2rem] font-black tracking-tight text-slate-950 dark:text-white leading-[1.05] sm:leading-[1.03] drop-shadow-[0_2px_8px_rgba(255,255,255,0.7)] dark:drop-shadow-[0_3px_10px_rgba(0,0,0,0.8)] mb-5">
            {t('hero.title')} <br />
            <span className="text-accent-500 font-extrabold drop-shadow-[0_2px_8px_rgba(249,115,22,0.25)]">{t('hero.titleHighlight')}</span>
          </h1>

          {/* Description paragraph turística y universal */}
          <p className="text-base sm:text-lg text-slate-800 dark:text-slate-200 font-medium leading-relaxed max-w-xl mb-8 sm:mb-9 drop-shadow-[0_1px_4px_rgba(255,255,255,0.8)] dark:drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
            {t('hero.subtitle')}
          </p>

          {/* Action Buttons matching reference image con micro-interacciones táctiles */}
          <div className="flex flex-wrap items-center gap-4">
            <motion.a
              href="#mapa"
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="px-7 py-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm tracking-wide shadow-lg shadow-slate-950/20 flex items-center gap-2.5 cursor-pointer"
            >
              <Map size={18} />
              <span>{t('hero.cta1')}</span>
            </motion.a>
            <motion.a
              href="#lugares"
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="px-7 py-3.5 rounded-full bg-white/70 hover:bg-white/90 dark:bg-white/15 dark:hover:bg-white/25 text-slate-900 dark:text-white font-bold text-sm tracking-wide shadow-md backdrop-blur-xl border border-white/80 dark:border-white/30 flex items-center gap-2.5 cursor-pointer"
            >
              <List size={18} />
              <span>{t('hero.cta2')}</span>
            </motion.a>
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div 
        animate={{ y: [0, 8, 0] }} 
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 opacity-75 hidden sm:block"
      >
        <div className="w-[28px] h-[46px] border-2 border-slate-700 dark:border-white/60 rounded-full flex justify-center p-1.5 bg-white/20 dark:bg-black/20 backdrop-blur-xs shadow-xs">
          <div className="w-1 h-2.5 bg-slate-800 dark:bg-white rounded-full shadow-xs" />
        </div>
      </motion.div>
    </section>
  );
}

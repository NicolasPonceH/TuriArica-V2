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

export default function Hero3D() {
  return (
    <section id="inicio" className="relative h-screen w-full overflow-hidden flex items-center justify-center">
      <VideoBackground />

      {/* Content Overlay */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto mt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        >
          <span className="inline-block py-1.5 px-4 rounded-full bg-accent-500/95 text-white text-xs sm:text-sm font-black mb-6 backdrop-blur-md shadow-[0_0_20px_rgba(249,115,22,0.45)] border border-accent-400/80 tracking-wide">
            Descubre la Eterna Primavera 🌸
          </span>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 text-white drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]">
            Arica, de forma <span className="text-brand-300 drop-shadow-md">inclusiva</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-100 mb-10 max-w-2xl mx-auto font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-relaxed">
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

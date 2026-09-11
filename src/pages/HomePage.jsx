import { useState, useEffect } from 'react';
import Navigation from '../components/layout/Navigation';
import Footer from '../components/layout/Footer';
import Hero3D from '../components/home/Hero3D';
import CategoryFilter from '../components/home/CategoryFilter';
import PlaceCard from '../components/home/PlaceCard';
import InteractiveMap from '../components/map/InteractiveMap';
import AccessibilityToolbar from '../components/shared/AccessibilityToolbar';
import AssistantModal from '../components/shared/AssistantModal';
import PlaceDetailModal from '../components/shared/PlaceDetailModal';
import PWAInstallPrompt from '../components/shared/PWAInstallPrompt';
import EventPopupModal from '../components/shared/EventPopupModal';
import GastronomyHighlights from '../components/home/GastronomyHighlights';
import FAQSection from '../components/home/FAQSection';
import ItineraryPlannerModal from '../components/shared/ItineraryPlannerModal';
import { usePlaces } from '../contexts/PlacesContext';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateHaversine } from '../utils/haversine';
import { API, FALLBACK_LOCATION, SERVER_URL } from '../utils/constants';
import { Link } from 'react-router-dom';
import { Sparkles, Compass, Map, ChevronDown, ChevronUp, Maximize2 } from 'lucide-react';

const CLIMATE_THEMES = {
  clear: {
    bgClass: 'bg-[#fdfbf7]',
    textColor: 'text-slate-800',
    titleColor: 'text-slate-900',
    ambientGradients: (
      <>
        {/* Sol radiante de la Eterna Primavera (Arica) */}
        <div className="absolute -top-32 right-0 w-[650px] h-[650px] bg-gradient-to-bl from-amber-300/25 via-orange-200/15 to-transparent rounded-full blur-3xl pointer-events-none transition-all duration-1000" />
        <div className="absolute top-96 -left-20 w-[500px] h-[500px] bg-gradient-to-tr from-sky-300/20 via-cyan-200/10 to-transparent rounded-full blur-3xl pointer-events-none transition-all duration-1000" />
        <div className="absolute top-[1800px] right-10 w-[600px] h-[600px] bg-gradient-to-bl from-amber-200/20 via-sky-100/15 to-transparent rounded-full blur-3xl pointer-events-none transition-all duration-1000" />
      </>
    )
  },
  cloudy: {
    bgClass: 'bg-[#f2f5f9]',
    textColor: 'text-slate-800',
    titleColor: 'text-slate-900',
    ambientGradients: (
      <>
        {/* Camanchaca y nubosidad costera del Pacífico */}
        <div className="absolute -top-20 inset-x-0 h-[700px] bg-gradient-to-b from-slate-300/35 via-slate-200/25 to-transparent pointer-events-none transition-all duration-1000" />
        <div className="absolute top-40 right-10 w-[600px] h-[600px] bg-gradient-to-bl from-slate-300/30 via-sky-200/20 to-transparent rounded-full blur-3xl pointer-events-none transition-all duration-1000" />
        <div className="absolute top-[1700px] left-0 w-[550px] h-[550px] bg-gradient-to-tr from-slate-200/40 via-blue-100/20 to-transparent rounded-full blur-3xl pointer-events-none transition-all duration-1000" />
      </>
    )
  },
  partlyCloudy: {
    bgClass: 'bg-[#f7f9fc]',
    textColor: 'text-slate-800',
    titleColor: 'text-slate-900',
    ambientGradients: (
      <>
        {/* Nubes dispersas y sol costero */}
        <div className="absolute -top-20 right-10 w-[600px] h-[600px] bg-gradient-to-bl from-sky-200/25 via-amber-100/20 to-transparent rounded-full blur-3xl pointer-events-none transition-all duration-1000" />
        <div className="absolute top-96 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-cyan-100/30 via-slate-100/20 to-transparent rounded-full blur-3xl pointer-events-none transition-all duration-1000" />
      </>
    )
  },
  sunset: {
    bgClass: 'bg-[#fff7f0]',
    textColor: 'text-slate-800',
    titleColor: 'text-slate-900',
    ambientGradients: (
      <>
        {/* Atardecer sobre el Morro y el mar */}
        <div className="absolute -top-20 right-0 w-[700px] h-[700px] bg-gradient-to-bl from-orange-400/30 via-rose-300/20 to-transparent rounded-full blur-3xl pointer-events-none transition-all duration-1000" />
        <div className="absolute top-72 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-amber-300/25 via-pink-200/15 to-transparent rounded-full blur-3xl pointer-events-none transition-all duration-1000" />
        <div className="absolute top-[1600px] right-10 w-[600px] h-[600px] bg-gradient-to-bl from-rose-300/20 via-orange-200/15 to-transparent rounded-full blur-3xl pointer-events-none transition-all duration-1000" />
      </>
    )
  },
  night: {
    bgClass: 'bg-[#0a1124]',
    textColor: 'text-slate-100',
    titleColor: 'text-white',
    ambientGradients: (
      <>
        {/* Noche estrellada sobre la bahía */}
        <div className="absolute -top-20 right-10 w-[650px] h-[650px] bg-gradient-to-bl from-indigo-500/25 via-sky-600/15 to-transparent rounded-full blur-3xl pointer-events-none transition-all duration-1000" />
        <div className="absolute top-80 left-0 w-[550px] h-[550px] bg-gradient-to-tr from-blue-900/35 via-indigo-950/20 to-transparent rounded-full blur-3xl pointer-events-none transition-all duration-1000" />
        <div className="absolute top-[1700px] right-0 w-[600px] h-[600px] bg-gradient-to-bl from-violet-900/25 via-sky-950/20 to-transparent rounded-full blur-3xl pointer-events-none transition-all duration-1000" />
      </>
    )
  }
};

export default function HomePage() {
  const { places, getPlacesByCategory, getPlacesByType } = usePlaces();
  const { t } = useLanguage();

  const [activeCategory, setActiveCategory] = useState('Todos');
  const [activeType, setActiveType] = useState('todos');
  const [routeCoords, setRouteCoords] = useState([]);
  const [routeColor, setRouteColor] = useState('');
  const [routeInfo, setRouteInfo] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [modalPlace, setModalPlace] = useState(null);
  const [showAssistant, setShowAssistant] = useState(false);
  const [showPlanner, setShowPlanner] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);

  // Clima en tiempo real y ambiente dinámico según RedMeteo
  const [liveWeather, setLiveWeather] = useState(null);
  const [previewCondition, setPreviewCondition] = useState(null);

  useEffect(() => {
    fetch(`${SERVER_URL}/api/weather/live`)
      .then(res => res.json())
      .then(data => {
        if (data && data.current) {
          setLiveWeather(data);
        }
      })
      .catch(() => {});
  }, []);

  const activeCondition = previewCondition || liveWeather?.current?.conditionType || 'clear';
  const climateTheme = CLIMATE_THEMES[activeCondition] || CLIMATE_THEMES.clear;

  // Filter places by type first, then by category
  const filteredByType = activeType === 'todos' ? places : getPlacesByType(activeType);
  const filteredPlaces = activeCategory === 'Todos'
    ? filteredByType
    : filteredByType.filter(p => p.category === activeCategory);

  // Paginación limpia: mostrar inicialmente 6 lugares para no saturar la vista
  const INITIAL_VISIBLE_COUNT = 6;
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, [activeCategory, activeType]);

  const displayedPlaces = filteredPlaces.slice(0, visibleCount);
  const hasMorePlaces = filteredPlaces.length > visibleCount;

  const handleAudioClick = (place) => {
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
    }
    window.speechSynthesis.cancel();

    if (place.audioFile) {
      const audio = new Audio(`/${place.audioFile}`);
      audio.play().catch(() => {
        const utterance = new SpeechSynthesisUtterance(place.fullDesc);
        utterance.lang = 'es-CL';
        window.speechSynthesis.speak(utterance);
      });
      setCurrentAudio(audio);
    } else if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(place.fullDesc);
      utterance.lang = 'es-CL';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleClearRoute = () => {
    setRouteCoords([]);
    setRouteColor('');
    setRouteInfo(null);
  };

  const handleRouteClick = (place) => {
    setSelectedPlace(place);

    const calculateForPosition = async (lat, lng) => {
      setUserLocation([lng, lat]);

      const url = `${API.GRAPHHOPPER}?point=${lat},${lng}&point=${place.lat},${place.lng}&vehicle=car&locale=es&instructions=false&points_encoded=false&key=${API.GRAPHHOPPER_KEY}`;

      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (data.paths && data.paths.length > 0) {
          const coords = data.paths[0].points.coordinates.map(c => [c[0], c[1]]);
          setRouteCoords(coords);
          setRouteColor(place.color);
          setRouteInfo({
            distanceKm: (data.paths[0].distance / 1000).toFixed(1),
            timeMin: Math.max(1, Math.round(data.paths[0].time / 60000))
          });
          document.getElementById('mapa')?.scrollIntoView({ behavior: 'smooth' });
        } else {
          throw new Error();
        }
      } catch {
        setRouteCoords([[lng, lat], [place.lng, place.lat]]);
        setRouteColor(place.color);
        const dist = calculateHaversine(lat, lng, place.lat, place.lng);
        setRouteInfo({
          distanceKm: dist.toFixed(1),
          timeMin: Math.max(1, Math.round((dist / 30) * 60))
        });
        document.getElementById('mapa')?.scrollIntoView({ behavior: 'smooth' });
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          calculateForPosition(position.coords.latitude, position.coords.longitude);
        },
        () => {
          calculateForPosition(FALLBACK_LOCATION.lat, FALLBACK_LOCATION.lng);
        }
      );
    } else {
      calculateForPosition(FALLBACK_LOCATION.lat, FALLBACK_LOCATION.lng);
    }
  };

  const handleReadPage = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      let texto = 'Bienvenido a TuriArica. ';
      texto += `Mostrando ${filteredPlaces.length} lugares. `;
      filteredPlaces.forEach((p, i) => {
        texto += `${i + 1}: ${p.name}. `;
      });
      const utterance = new SpeechSynthesisUtterance(texto);
      utterance.lang = 'es-CL';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className={`min-h-screen ${climateTheme.bgClass} ${climateTheme.textColor} ${activeCondition === 'night' ? 'theme-night' : ''} font-sans selection:bg-brand-500/30 selection:text-brand-600 transition-colors duration-1000 relative overflow-x-hidden`}>
      {/* Fondo ambiental dinámico según el clima de Arica (Soleado, Nublado, Atardecer, Noche) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {climateTheme.ambientGradients}
      </div>

      <div className="relative z-10">
        <Navigation />
        <Hero3D
          weatherData={liveWeather ? {
            temp: liveWeather.current.temp,
            condition: liveWeather.current.condition,
            conditionType: activeCondition,
            conditionDesc: liveWeather.current.conditionDesc,
            humidity: liveWeather.current.humidity,
            windSpeedKmH: liveWeather.current.windSpeedKmH,
            windDirection: liveWeather.current.windDirection,
            uvIndex: liveWeather.current.uvIndex,
            stationName: liveWeather.station?.name || 'Arica - Capitanía de Puerto'
          } : null}
          activeCondition={activeCondition}
        />

        <AccessibilityToolbar
          onAssistantClick={() => setShowAssistant(true)}
          onReadPageClick={handleReadPage}
        />

        <PWAInstallPrompt />

        {showAssistant && <AssistantModal onClose={() => setShowAssistant(false)} />}

        {/* Travel Hub Section (Itinerary Planner) */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-2">
          {/* Smart Itinerary Planner CTA Banner */}
          <div className="glass-card rounded-3xl p-6 sm:p-7 shadow-xl shadow-sky-950/5 border border-white/80 flex flex-col sm:flex-row items-center justify-between gap-5 relative overflow-hidden backdrop-blur-xl">
            <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-amber-100/30 via-sky-100/20 to-transparent pointer-events-none" />

            <div className="flex items-center gap-4 text-center sm:text-left z-10">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-brand-500 to-sky-600 flex items-center justify-center shrink-0 shadow-lg shadow-brand-500/25 text-white">
                <Compass size={26} />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-100/80 text-brand-600 text-[11px] font-bold uppercase tracking-wider mb-1.5 border border-sky-200">
                  <Sparkles size={12} className="text-accent-500" />
                  <span>Asistente de Viaje Inteligente</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                  ¿Planeando tu viaje a la Eterna Primavera?
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium max-w-xl">
                  Genera un itinerario inteligente personalizado hora a hora según tus días y preferencias.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowPlanner(true)}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-accent-500 to-amber-500 hover:from-accent-600 hover:to-amber-600 text-white font-black text-xs sm:text-sm shadow-lg shadow-orange-500/25 btn-tactile hover:scale-[1.03] active:scale-[0.97] shrink-0 flex items-center gap-2 z-10 cursor-pointer"
            >
              <Sparkles size={16} />
              <span>Armar Mi Itinerario</span>
            </button>
          </div>
        </section>

        {/* Places Section */}
        <main className="max-w-6xl mx-auto px-6 py-12 sm:py-20" id="lugares">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-4"
          >
            <h2 className={`text-3xl md:text-5xl font-bold mb-8 ${climateTheme.titleColor}`}>{t('places.title')}</h2>
          </motion.div>

        <CategoryFilter
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          activeType={activeType}
          setActiveType={setActiveType}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {displayedPlaces.map(place => (
              <PlaceCard
                key={place.id}
                place={place}
                onAudioClick={handleAudioClick}
                onRouteClick={handleRouteClick}
                onMoreClick={setModalPlace}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Barra de acción: Ver más lugares o explorar todos en el mapa completo */}
        {filteredPlaces.length > INITIAL_VISIBLE_COUNT && (
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            {hasMorePlaces ? (
              <button
                onClick={() => setVisibleCount(prev => prev + 6)}
                className="px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-sm shadow-md border border-slate-200 dark:border-slate-700 flex items-center gap-2.5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <ChevronDown size={18} className="text-brand-500" />
                <span>{t('places.showMore')}</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  +{Math.min(6, filteredPlaces.length - visibleCount)} de {filteredPlaces.length - visibleCount}
                </span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setVisibleCount(INITIAL_VISIBLE_COUNT);
                  document.getElementById('lugares')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm shadow-md border border-slate-200 dark:border-slate-700 flex items-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <ChevronUp size={18} className="text-slate-500" />
                <span>{t('places.showLess')}</span>
              </button>
            )}

            <a
              href="#mapa"
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 to-sky-600 hover:from-brand-500 hover:to-sky-500 text-white font-bold text-sm shadow-lg shadow-sky-500/20 flex items-center gap-2.5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Map size={18} />
              <span>{t('places.viewAllMap')} ({filteredPlaces.length})</span>
            </a>
          </div>
        )}

        {filteredPlaces.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">{t('places.empty')}</p>
          </div>
        )}
      </main>

      {/* Gastronomy Highlights Section */}
      <GastronomyHighlights />

      {/* Map Section */}
      <section id="mapa" className="bg-white py-24 relative overflow-hidden border-t border-gray-100">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-50/50 to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-3 text-slate-900">{t('map.title')}</h2>
            <p className="text-slate-500 text-base sm:text-lg max-w-2xl">{t('map.subtitle')}</p>
          </motion.div>

          <InteractiveMap
            places={places}
            activeCategory={activeCategory}
            routeCoords={routeCoords}
            routeColor={routeColor}
            userLocation={userLocation}
            selectedPlace={selectedPlace}
            setSelectedPlace={setSelectedPlace}
            routeInfo={routeInfo}
            onRouteClick={handleRouteClick}
            onAudioClick={handleAudioClick}
            onClearRoute={handleClearRoute}
          />
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection />

      <Footer />

      {/* Detail Modal */}
      <AnimatePresence>
        {modalPlace && (
          <PlaceDetailModal
            place={modalPlace}
            onClose={() => setModalPlace(null)}
            onAudioClick={handleAudioClick}
            onRouteClick={handleRouteClick}
          />
        )}
      </AnimatePresence>

      {/* Smart Itinerary Planner Modal */}
      <ItineraryPlannerModal
        isOpen={showPlanner}
        onClose={() => setShowPlanner(false)}
      />

      {/* Featured Event Popup Modal */}
      <EventPopupModal />
      </div>
    </div>
  );
}

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Map, { Marker, Popup, Source, Layer, NavigationControl, FullscreenControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as LucideIcons from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Supercluster from 'supercluster';
import { usePlaces } from '../contexts/PlacesContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useEvents } from '../contexts/EventsContext';
import MapMarker from '../components/map/MapMarker';
import { CATEGORIES } from '../data/categories';
import { MAP_CONFIG } from '../utils/constants';
import { MAP_STYLES } from '../utils/mapStyles';
import { getGoogleMapsUrl } from '../utils/navigation';
import {
  calcularRuta,
  isPointInPolygon,
  encontrarPuntoSeguroMasCercano
} from '../utils/mapRouting';
import {
  ZONAS_RIESGO_TSUNAMI,
  VIAS_EVACUACION,
  PUNTOS_ENCUENTRO,
  FOCOS_DE_LUZ,
  ZONAS_ILUMINADAS,
  SERVICIOS_EMERGENCIA,
  LINEAS_TRANSPORTE_PUBLICO,
  sanitizeHtml,
  getLiveRoutesGeoJSON,
  getLiveZonesGeoJSON,
  getLiveMeetingPoints,
  getLiveLightsGeoJSON,
  getLiveTransitLinesGeoJSON,
  GEODATA_UPDATED_EVENT
} from '../data/mapGeoData';

export default function MapPage() {
  const { places } = usePlaces();
  const { t } = useLanguage();
  const eventsContext = useEvents();
  const activeEvents = eventsContext?.activeEvents || [];
  const [searchParams] = useSearchParams();
  const mapRef = useRef(null);

  // Estados de control
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem('turiarica_map_mode');
    return saved || 'auto';
  });
  const [isEvacuationActive, setIsEvacuationActive] = useState(false);
  const [routingProfile, setRoutingProfile] = useState('foot');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('places'); // 'places' | 'safety'
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [genericPopup, setGenericPopup] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [internalRoute, setInternalRoute] = useState(null);

  // Estado de zoom y límites para agrupamiento dinámico (Supercluster)
  const [mapZoom, setMapZoom] = useState(MAP_CONFIG.zoom);
  const [mapBounds, setMapBounds] = useState(null);

  const handleMapMove = useCallback(() => {
    if (!mapRef.current) return;
    try {
      const map = mapRef.current.getMap();
      if (!map) return;
      const b = map.getBounds();
      if (b) {
        setMapBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
        setMapZoom(map.getZoom());
      }
    } catch (e) {
      // safe fallback
    }
  }, []);

  // Capas reactivas sincronizadas en vivo con el panel de administración
  const [liveTransitLines, setLiveTransitLines] = useState(() => getLiveTransitLinesGeoJSON() || LINEAS_TRANSPORTE_PUBLICO);
  const [liveRoutes, setLiveRoutes] = useState(() => getLiveRoutesGeoJSON());
  const [liveZones, setLiveZones] = useState(() => getLiveZonesGeoJSON());
  const [liveMeetingPoints, setLiveMeetingPoints] = useState(() => getLiveMeetingPoints());
  const [liveLights, setLiveLights] = useState(() => getLiveLightsGeoJSON());

  useEffect(() => {
    const handleGeoUpdate = () => {
      setLiveTransitLines(getLiveTransitLinesGeoJSON() || LINEAS_TRANSPORTE_PUBLICO);
      setLiveRoutes(getLiveRoutesGeoJSON());
      setLiveZones(getLiveZonesGeoJSON());
      setLiveMeetingPoints(getLiveMeetingPoints());
      setLiveLights(getLiveLightsGeoJSON());
    };
    window.addEventListener(GEODATA_UPDATED_EVENT, handleGeoUpdate);
    window.addEventListener('storage', handleGeoUpdate);
    return () => {
      window.removeEventListener(GEODATA_UPDATED_EVENT, handleGeoUpdate);
      window.removeEventListener('storage', handleGeoUpdate);
    };
  }, []);

  // Capas: turismo activo por defecto, capas de emergencia inactivas inicialmente
  const [layerVisibility, setLayerVisibility] = useState({
    turismo: true,
    focosLuz: false,
    zonasIluminadas: false,
    viasEvacuacion: false,
    puntosEncuentro: false,
    zonasRiesgo: false,
    emergencias: false
  });

  // Cálculo de modo dinámico según horario para 'auto'
  const isNightTime = () => {
    const hour = new Date().getHours();
    return hour >= 19 || hour < 6;
  };

  const effectiveMode = useMemo(() => {
    if (isEvacuationActive) return 'emergency';
    if (mode === 'auto') return isNightTime() ? 'night' : 'day';
    return mode;
  }, [mode, isEvacuationActive]);

  const currentMapStyle = useMemo(() => {
    if (effectiveMode === 'emergency') return MAP_STYLES.emergency.style;
    if (effectiveMode === 'night') return MAP_STYLES.night.style;
    return MAP_STYLES.day.style;
  }, [effectiveMode]);

  const handleSetMode = (newMode) => {
    setMode(newMode);
    localStorage.setItem('turiarica_map_mode', newMode);
    if (newMode !== 'evacuation' && isEvacuationActive) {
      handleToggleEvacuation();
    }
  };

  const handleToggleEvacuation = () => {
    setIsEvacuationActive(prev => {
      const next = !prev;
      if (next) {
        setLayerVisibility({
          turismo: true,
          focosLuz: false,
          zonasIluminadas: false,
          viasEvacuacion: true,
          puntosEncuentro: true,
          zonasRiesgo: true,
          emergencias: true
        });
        setActiveTab('safety');
      } else {
        setLayerVisibility({
          turismo: true,
          focosLuz: false,
          zonasIluminadas: false,
          viasEvacuacion: false,
          puntosEncuentro: false,
          zonasRiesgo: false,
          emergencias: false
        });
      }
      return next;
    });
  };

  const handleToggleLayer = (layerKey) => {
    setLayerVisibility(prev => ({
      ...prev,
      [layerKey]: !prev[layerKey]
    }));
  };

  // Geolocalización del usuario
  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.longitude, pos.coords.latitude];
        setUserLocation(coords);
        if (mapRef.current) {
          mapRef.current.flyTo({ center: coords, zoom: 15, duration: 1500 });
        }
      },
      (err) => alert('No se pudo obtener ubicación: ' + (err.message || 'Permiso denegado')),
      { enableHighAccuracy: true }
    );
  };

  // Trazar ruta OSRM a un destino
  const handleTraceRoute = async (destLng, destLat, name) => {
    const origin = userLocation || MAP_CONFIG.center;
    const route = await calcularRuta(origin, [destLng, destLat], routingProfile, isEvacuationActive);
    setInternalRoute(route);

    if (mapRef.current && route.coordinates) {
      const bounds = route.coordinates.reduce(
        (acc, c) => [
          [Math.min(acc[0][0], c[0]), Math.min(acc[0][1], c[1])],
          [Math.max(acc[1][0], c[0]), Math.max(acc[1][1], c[1])]
        ],
        [[Infinity, Infinity], [-Infinity, -Infinity]]
      );
      mapRef.current.fitBounds(bounds, { padding: 80, duration: 1500 });
    }
  };

  // Punto seguro más cercano
  const handleFindSafePoint = async () => {
    const origin = userLocation || MAP_CONFIG.center;
    const [origLng, origLat] = origin;
    const safePoint = encontrarPuntoSeguroMasCercano(origLat, origLng, PUNTOS_ENCUENTRO);
    if (!safePoint) return;

    await handleTraceRoute(safePoint.lng, safePoint.lat, safePoint.nombre);
    setGenericPopup({
      lng: safePoint.lng,
      lat: safePoint.lat,
      nombre: safePoint.nombre,
      categoria: 'Punto de Encuentro Seguro',
      descripcion: `${safePoint.descripcion} — Cota: ${safePoint.cota}. Capacidad: ${safePoint.capacidad}`
    });
  };

  // Sincronizar parámetro ?place=ID de URL
  useEffect(() => {
    const placeId = searchParams.get('place');
    if (placeId && places && places.length > 0) {
      const found = places.find(p => String(p.id) === String(placeId));
      if (found) {
        setSelectedPlace(found);
        setDrawerOpen(true);
        setActiveTab('places');
        if (mapRef.current) {
          mapRef.current.flyTo({ center: [found.lng, found.lat], zoom: 16, duration: 1200 });
        }
      }
    }
  }, [searchParams, places]);

  // Filtrado de lugares
  const filteredPlaces = useMemo(() => {
    let list = places || [];
    if (activeCategory !== 'Todos') {
      list = list.filter(p => p.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.directions && p.directions.toLowerCase().includes(q))
      );
    }
    return list;
  }, [places, activeCategory, searchQuery]);

  // Instancia de Supercluster para agrupar puntos al alejar el mapa
  const supercluster = useMemo(() => {
    const sc = new Supercluster({
      radius: 65,
      maxZoom: 15
    });

    const points = filteredPlaces
      .filter(p => typeof p.lng === 'number' && typeof p.lat === 'number')
      .map(p => ({
        type: 'Feature',
        properties: {
          cluster: false,
          placeId: p.id,
          place: p
        },
        geometry: {
          type: 'Point',
          coordinates: [p.lng, p.lat]
        }
      }));

    sc.load(points);
    return sc;
  }, [filteredPlaces]);

  // Agrupamiento dinámico según el nivel de zoom y límites visibles
  const clusters = useMemo(() => {
    if (!supercluster) return [];
    const b = mapBounds || [-70.50, -18.65, -70.15, -18.30];
    try {
      return supercluster.getClusters(b, Math.floor(mapZoom));
    } catch (e) {
      console.warn('Supercluster error:', e);
      return [];
    }
  }, [supercluster, mapBounds, mapZoom]);

  // GeoJSON de ruta activa
  const routeGeojson = useMemo(() => {
    if (!internalRoute?.coordinates) return null;
    return {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: internalRoute.coordinates
      }
    };
  }, [internalRoute]);

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100 overflow-hidden font-sans select-none">
      {/* 1. BARRA SUPERIOR DE NAVEGACIÓN COMPLETA */}
      <header className="h-16 bg-white/95 backdrop-blur-xl border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between z-30 shrink-0 shadow-xs">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <img
              src="/logo.png"
              alt="TuriArica"
              className="h-9 sm:h-10 w-auto object-contain group-hover:scale-105 transition-transform"
            />
          </Link>

          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          <Link
            to="/"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand-600 transition-colors"
          >
            <LucideIcons.ArrowLeft size={14} />
            <span>Volver al Inicio</span>
          </Link>

          <span className="hidden md:inline-block px-2.5 py-1 rounded-full text-xs font-black bg-brand-50 text-brand-700 border border-brand-200">
            Explorador Turístico & Seguridad
          </span>
        </div>

        {/* Controles de Modo & Evacuación */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Selector de Modo */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => handleSetMode('auto')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                mode === 'auto'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-white'
              }`}
              title="Modo Automático según la hora"
            >
              <LucideIcons.Clock size={13} />
              <span className="hidden sm:inline">Auto</span>
            </button>
            <button
              onClick={() => handleSetMode('day')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                mode === 'day'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-white'
              }`}
              title="Modo Día"
            >
              <LucideIcons.Sun size={13} />
              <span className="hidden sm:inline">Día</span>
            </button>
            <button
              onClick={() => handleSetMode('night')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                mode === 'night'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-white'
              }`}
              title="Modo Noche"
            >
              <LucideIcons.Moon size={13} />
              <span className="hidden sm:inline">Noche</span>
            </button>
          </div>

          {/* Botón de Evacuación */}
          <button
            onClick={handleToggleEvacuation}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all ${
              isEvacuationActive
                ? 'bg-red-600 text-white shadow-md animate-pulse'
                : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
            }`}
          >
            <LucideIcons.ShieldAlert size={14} />
            <span>Evacuación</span>
          </button>

          {/* Botón Drawer Toggle */}
          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              drawerOpen
                ? 'bg-brand-500 text-white border-brand-600'
                : 'bg-slate-100 hover:bg-white text-slate-700 border-slate-200'
            }`}
            title="Mostrar / Ocultar panel lateral"
          >
            <LucideIcons.PanelLeft size={16} />
            <span className="hidden sm:inline">{drawerOpen ? 'Ocultar' : 'Ver Panel'}</span>
          </button>
        </div>
      </header>

      {/* 2. CONTENIDO PRINCIPAL: SIDEBAR FLOTANTE + MAPA A PANTALLA COMPLETA */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* SIDEBAR / DRAWER DESLIZABLE */}
        <AnimatePresence mode="wait">
          {drawerOpen && (
            <motion.aside
              initial={{ x: -380, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -380, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="absolute sm:relative inset-y-0 left-0 z-20 w-full sm:w-96 md:w-[420px] bg-white/95 backdrop-blur-2xl border-r border-slate-200 flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Pestañas: Lugares / Seguridad */}
              <div className="p-3 border-b border-slate-200 flex gap-2 shrink-0 bg-slate-50/70">
                <button
                  onClick={() => { setActiveTab('places'); setSelectedPlace(null); }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'places'
                      ? 'bg-white text-brand-600 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:bg-white/60'
                  }`}
                >
                  <LucideIcons.MapPin size={14} />
                  <span>Lugares ({filteredPlaces.length})</span>
                </button>

                <button
                  onClick={() => { setActiveTab('safety'); setSelectedPlace(null); }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'safety'
                      ? 'bg-red-50 text-red-700 border border-red-200 shadow-xs'
                      : 'text-slate-600 hover:bg-white/60'
                  }`}
                >
                  <LucideIcons.ShieldAlert size={14} />
                  <span>Seguridad & Vías</span>
                </button>
              </div>

              {/* CONTENIDO DE PESTAÑA LUGARES */}
              {activeTab === 'places' && !selectedPlace && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Buscador & Categorías */}
                  <div className="p-3 space-y-2.5 border-b border-slate-100 shrink-0">
                    <div className="relative">
                      <LucideIcons.Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar atractivo, playa, museo..."
                        className="w-full pl-8 pr-7 py-2 rounded-xl text-xs font-medium bg-slate-100 border border-slate-200 text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-brand-500/20"
                      />
                      {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                          <LucideIcons.X size={13} />
                        </button>
                      )}
                    </div>

                    {/* Chips de Categorías */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                      {['Todos', ...CATEGORIES.map(c => c.id)].map(cat => {
                        const isSelected = activeCategory === cat;
                        return (
                          <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-3 py-1 rounded-full text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-brand-500 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {cat}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Lista de Lugares */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                    {filteredPlaces.map(place => (
                      <div
                        key={place.id}
                        onClick={() => {
                          setSelectedPlace(place);
                          if (mapRef.current) {
                            mapRef.current.flyTo({ center: [place.lng, place.lat], zoom: 16, duration: 1000 });
                          }
                        }}
                        className="p-3 rounded-2xl border border-slate-200/80 hover:border-brand-400 bg-white hover:bg-slate-50/80 transition-all cursor-pointer shadow-xs group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-accent-50 text-accent-700 mb-1">
                              {place.category}
                            </span>
                            <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-brand-600 transition-colors">
                              {place.name}
                            </h4>
                          </div>
                          {place.rating && (
                            <span className="text-xs font-bold text-amber-500 shrink-0">
                              ★ {place.rating}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                          {place.shortDesc || place.fullDesc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* DETALLE COMPLETO DEL LUGAR SELECCIONADO */}
              {activeTab === 'places' && selectedPlace && (
                <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-4 text-left">
                  <button
                    onClick={() => setSelectedPlace(null)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 cursor-pointer"
                  >
                    <LucideIcons.ArrowLeft size={13} />
                    <span>Volver al listado</span>
                  </button>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-accent-100 text-accent-800">
                        {selectedPlace.category}
                      </span>
                      {selectedPlace.rating && (
                        <span className="text-xs font-bold text-amber-500">★ {selectedPlace.rating}</span>
                      )}
                    </div>
                    <h3 className="text-xl font-black text-slate-900">{selectedPlace.name}</h3>
                  </div>

                  {/* Foto si existe */}
                  {selectedPlace.photos && selectedPlace.photos.length > 0 && (
                    <div className="h-44 rounded-2xl overflow-hidden shadow-sm">
                      <img
                        src={selectedPlace.photos[0]}
                        alt={selectedPlace.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Descripción completa */}
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {selectedPlace.fullDesc || selectedPlace.shortDesc}
                  </p>

                  {/* Instrucciones de Transporte */}
                  {selectedPlace.directions && (
                    <div className="p-3 bg-brand-50/80 rounded-xl border border-brand-100 text-xs text-brand-900 space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-brand-700">
                        <LucideIcons.Bus size={14} />
                        <span>Cómo llegar en transporte público:</span>
                      </div>
                      <p className="text-slate-600 font-medium">{selectedPlace.directions}</p>
                    </div>
                  )}

                  {/* Información de Ruta calculada */}
                  {internalRoute && (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center flex items-center justify-around">
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase">Distancia</div>
                        <div className="text-base font-black text-emerald-600">{internalRoute.distanceKm} km</div>
                      </div>
                      <div className="h-6 w-px bg-emerald-200" />
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase">Tiempo Est.</div>
                        <div className="text-base font-black text-emerald-600">~{internalRoute.timeMin} min</div>
                      </div>
                    </div>
                  )}

                  {/* Botones de acción del lugar */}
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => handleTraceRoute(selectedPlace.lng, selectedPlace.lat, selectedPlace.name)}
                      className="w-full py-2.5 px-4 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <LucideIcons.Navigation size={15} />
                      <span>Calcular Ruta en el Mapa</span>
                    </button>

                    <a
                      href={getGoogleMapsUrl(selectedPlace.lat, selectedPlace.lng, selectedPlace.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2"
                    >
                      <LucideIcons.Compass size={15} />
                      <span>Navegar con Google Maps</span>
                    </a>
                  </div>
                </div>
              )}

              {/* CONTENIDO DE PESTAÑA SEGURIDAD & EVACUACIÓN */}
              {activeTab === 'safety' && (
                <div className="flex-1 overflow-y-auto p-4 space-y-4 text-left">
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-red-700 font-black text-xs">
                      <LucideIcons.ShieldAlert size={16} />
                      <span>Protocolo Oficial SENAPRED</span>
                    </div>
                    <p className="text-xs text-red-900 leading-relaxed font-medium">
                      Ante un sismo de gran magnitud que dificulte mantenerse en pie, evacúa de inmediato hacia zonas seguras sobre la cota 30 msnm.
                    </p>
                    <button
                      onClick={handleFindSafePoint}
                      className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <LucideIcons.LifeBuoy size={14} />
                      <span>Ruta a Punto Seguro Más Cercano</span>
                    </button>
                  </div>

                  {/* Puntos Seguros Cota 30+ */}
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2">
                      Puntos de Encuentro Cota 30+
                    </h4>
                    <div className="space-y-2">
                      {PUNTOS_ENCUENTRO.map((pe, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            if (mapRef.current) {
                              mapRef.current.flyTo({ center: [pe.lng, pe.lat], zoom: 16 });
                            }
                          }}
                          className="p-2.5 rounded-xl border border-slate-200 hover:border-teal-500 bg-white cursor-pointer shadow-2xs"
                        >
                          <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                            <span>{pe.nombre}</span>
                            <span className="text-[10px] text-teal-700 font-black px-2 py-0.5 bg-teal-50 rounded-md">
                              {pe.cota}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{pe.direccion}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Números de Emergencia */}
                  <div className="p-3 bg-slate-100 rounded-xl space-y-1.5 text-xs">
                    <div className="font-black text-slate-900">Teléfonos de Emergencia:</div>
                    <div className="flex justify-between text-slate-600 font-bold">
                      <span>SAMU (Ambulancia):</span>
                      <a href="tel:131" className="text-brand-600">131</a>
                    </div>
                    <div className="flex justify-between text-slate-600 font-bold">
                      <span>Bomberos:</span>
                      <a href="tel:132" className="text-brand-600">132</a>
                    </div>
                    <div className="flex justify-between text-slate-600 font-bold">
                      <span>Carabineros:</span>
                      <a href="tel:133" className="text-brand-600">133</a>
                    </div>
                  </div>
                </div>
              )}
            </motion.aside>
          )}
        </AnimatePresence>

        {/* LIENZO DEL MAPA INTERACTIVO 100% PANTALLA COMPLETA */}
        <div className="flex-1 h-full relative">
          <Map
            ref={mapRef}
            initialViewState={{
              longitude: MAP_CONFIG.center[0],
              latitude: MAP_CONFIG.center[1],
              zoom: MAP_CONFIG.zoom,
              pitch: MAP_CONFIG.pitch,
              bearing: MAP_CONFIG.bearing
            }}
            maxBounds={MAP_CONFIG.bounds}
            mapStyle={currentMapStyle}
            style={{ width: '100%', height: '100%' }}
            onLoad={handleMapMove}
            onMoveEnd={handleMapMove}
          >
            <NavigationControl position="bottom-right" />
            <FullscreenControl position="bottom-right" />

            {/* Zonas de Riesgo Tsunami */}
            {layerVisibility.zonasRiesgo && (
              <Source id="zonas-riesgo-source" type="geojson" data={liveZones}>
                <Layer
                  id="zonas-riesgo-fill"
                  type="fill"
                  paint={{
                    'fill-color': ['coalesce', ['get', 'color'], '#ef4444'],
                    'fill-opacity': isEvacuationActive ? 0.35 : 0.22
                  }}
                />
                <Layer
                  id="zonas-riesgo-line"
                  type="line"
                  paint={{
                    'line-color': '#b91c1c',
                    'line-width': 2.5,
                    'line-dasharray': [3, 2]
                  }}
                />
              </Source>
            )}

            {/* Capa GeoJSON: TRANSPORTE PÚBLICO (Micros & Colectivos) */}
            <Source id="full-transporte-source" type="geojson" data={liveTransitLines}>
              <Layer
                id="full-transporte-hitbox"
                type="line"
                paint={{
                  'line-color': '#000000',
                  'line-opacity': 0.01,
                  'line-width': 20
                }}
              />
              <Layer
                id="full-transporte-line"
                type="line"
                layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                paint={{
                  'line-color': ['coalesce', ['get', 'color'], '#0284c7'],
                  'line-width': 5,
                  'line-opacity': 0.85
                }}
              />
            </Source>

            {/* Vías de Evacuación */}
            {layerVisibility.viasEvacuacion && (
              <Source id="vias-evacuacion-source" type="geojson" data={liveRoutes}>
                <Layer
                  id="vias-evacuacion-line"
                  type="line"
                  paint={{
                    'line-color': [
                      'coalesce',
                      ['get', 'color'],
                      [
                        'match',
                        ['get', 'estado'],
                        'activa', '#10b981',
                        'bloqueada', '#ef4444',
                        'en_revision', '#f59e0b',
                        '#10b981'
                      ]
                    ],
                    'line-width': 4.5,
                    'line-opacity': 0.95
                  }}
                />
              </Source>
            )}

            {/* Ruta Activa */}
            {routeGeojson && (
              <Source id="full-route-source" type="geojson" data={routeGeojson}>
                <Layer
                  id="full-route-casing"
                  type="line"
                  paint={{
                    'line-color': '#ffffff',
                    'line-width': 8,
                    'line-opacity': 0.9
                  }}
                />
                <Layer
                  id="full-route-layer"
                  type="line"
                  paint={{
                    'line-color': '#0ea5e9',
                    'line-width': 5,
                    'line-opacity': 1
                  }}
                />
              </Source>
            )}

            {/* Marcadores de Lugares Turísticos y Agrupamientos Dinámicos (Supercluster) */}
            {layerVisibility.turismo && clusters.map(item => {
              const [lng, lat] = item.geometry.coordinates;
              const { cluster: isCluster, point_count, cluster_id } = item.properties;

              if (isCluster) {
                return (
                  <Marker
                    key={`cluster-${item.id || cluster_id}`}
                    longitude={lng}
                    latitude={lat}
                    anchor="center"
                    onClick={(e) => {
                      e.originalEvent.stopPropagation();
                      const targetId = item.id !== undefined ? item.id : cluster_id;
                      const expansionZoom = Math.min(
                        supercluster.getClusterExpansionZoom(targetId),
                        17
                      );
                      if (mapRef.current) {
                        mapRef.current.flyTo({
                          center: [lng, lat],
                          zoom: expansionZoom,
                          duration: 750
                        });
                      }
                    }}
                  >
                    <div
                      className="relative group cursor-pointer flex items-center justify-center"
                      title={`${point_count} lugares en esta zona. Toca para explorar.`}
                    >
                      <div className="absolute -inset-1 rounded-full bg-sky-400 opacity-40 animate-ping" />
                      <div className="relative z-10 min-w-[42px] h-[42px] px-2.5 rounded-full bg-gradient-to-tr from-sky-600 via-sky-500 to-cyan-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-0.5 shadow-xl shadow-sky-600/40 border-2 border-white backdrop-blur-md group-hover:scale-115 active:scale-95 transition-transform duration-200">
                        <span className="text-white/90 text-sm font-black leading-none">+</span>
                        <span>{point_count}</span>
                      </div>
                    </div>
                  </Marker>
                );
              }

              const place = item.properties.place;
              if (!place) return null;
              const promoEvent = activeEvents.find(ev => String(ev.placeId) === String(place.id) && ev.isActive);

              return (
                <Marker
                  key={place.id}
                  longitude={place.lng}
                  latitude={place.lat}
                  anchor="bottom"
                  onClick={(e) => {
                    e.originalEvent.stopPropagation();
                    setSelectedPlace(place);
                    setDrawerOpen(true);
                    setActiveTab('places');
                  }}
                >
                  <MapMarker
                    place={place}
                    isSelected={selectedPlace?.id === place.id}
                    hasPromo={Boolean(promoEvent)}
                    promoBadge={promoEvent?.discountBadge || 'Promo'}
                  />
                </Marker>
              );
            })}

            {/* Marcadores de Puntos Seguros Cota 30+ */}
            {layerVisibility.puntosEncuentro && liveMeetingPoints.map((pe, idx) => (
              <Marker
                key={pe.id || `safe-point-${idx}`}
                longitude={pe.lng}
                latitude={pe.lat}
                anchor="center"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  setGenericPopup({
                    lng: pe.lng,
                    lat: pe.lat,
                    nombre: pe.nombre,
                    categoria: 'Punto de Encuentro Seguro',
                    descripcion: `${pe.descripcion} — Cota: ${pe.cota}. Capacidad: ${pe.capacidad}`,
                    direccion: pe.direccion
                  });
                }}
              >
                <div
                  className="w-8 h-8 rounded-full text-white flex items-center justify-center shadow-lg border-2 border-white hover:scale-110 transition-transform cursor-pointer"
                  style={{ backgroundColor: pe.color || '#0d9488' }}
                >
                  <LucideIcons.LifeBuoy size={16} />
                </div>
              </Marker>
            ))}

            {/* Paradas de Transporte Público (Micros & Colectivos) */}
            {liveTransitLines?.features?.flatMap((line) =>
              (line.properties?.paradas || []).map((stop, sIdx) => (
                <Marker
                  key={`full-stop-${line.properties.id}-${stop.id || sIdx}`}
                  longitude={stop.lng}
                  latitude={stop.lat}
                  anchor="center"
                  onClick={(e) => {
                    e.originalEvent.stopPropagation();
                    setGenericPopup({
                      lng: stop.lng,
                      lat: stop.lat,
                      nombre: stop.nombre,
                      categoria: line.properties.tipo === 'colectivo' ? '🚕 Parada Colectivo' : '🚌 Parada Microbús',
                      descripcion: `${line.properties.nombre} (${line.properties.tipo === 'colectivo' ? 'Colectivo' : 'Micro'} #${line.properties.numero}). Tarifa: ${line.properties.tarifa || '$500'}. Horario: ${line.properties.horario || '06:30 - 22:30'}. Frecuencia: ${line.properties.frecuencia || 'Cada 10 min'}.`
                    });
                  }}
                >
                  <div
                    style={{ backgroundColor: line.properties.color || '#0284c7' }}
                    className="w-5 h-5 rounded-full text-white flex items-center justify-center shadow-md border border-white hover:scale-125 transition-transform cursor-pointer"
                    title={`${stop.nombre} - ${line.properties.nombre}`}
                  >
                    <LucideIcons.Bus size={10} />
                  </div>
                </Marker>
              ))
            )}

            {/* Marcador del Usuario */}
            {userLocation && (
              <Marker longitude={userLocation[0]} latitude={userLocation[1]} anchor="center">
                <div className="relative flex items-center justify-center">
                  <div className="w-8 h-8 bg-sky-500 rounded-full animate-ping absolute inset-0 opacity-75" />
                  <div className="w-6 h-6 bg-sky-600 rounded-full border-2 border-white shadow-md relative z-10 flex items-center justify-center text-white text-[10px]">
                    📍
                  </div>
                </div>
              </Marker>
            )}

            {/* Popup genérico */}
            {genericPopup && (
              <Popup
                longitude={genericPopup.lng}
                latitude={genericPopup.lat}
                onClose={() => setGenericPopup(null)}
                className="rounded-2xl shadow-xl z-30"
                offset={20}
              >
                <div className="p-3 text-left max-w-xs space-y-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-100 text-teal-800">
                    {genericPopup.categoria}
                  </span>
                  <h4 className="font-black text-slate-900 text-sm">{genericPopup.nombre}</h4>
                  <p className="text-xs text-slate-600">{genericPopup.descripcion}</p>
                </div>
              </Popup>
            )}
          </Map>

          {/* Botón flotante Mi Ubicación en el mapa */}
          <button
            onClick={handleLocateUser}
            className="absolute bottom-24 right-3 z-10 p-3 bg-white hover:bg-slate-50 text-brand-600 rounded-2xl shadow-xl border border-slate-200 cursor-pointer hover:scale-105 active:scale-95 transition-all"
            title="Mi Ubicación GPS"
          >
            <LucideIcons.Navigation size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

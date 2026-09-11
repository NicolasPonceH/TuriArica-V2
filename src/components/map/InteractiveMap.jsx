import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Map, { Marker, Popup, Source, Layer, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as LucideIcons from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Supercluster from 'supercluster';
import MapMarker from './MapMarker';
import { CATEGORIES } from '../../data/categories';
import { useLanguage } from '../../contexts/LanguageContext';
import { useEvents } from '../../contexts/EventsContext';
import { getGoogleMapsUrl } from '../../utils/navigation';
import { MAP_CONFIG } from '../../utils/constants';
import { MAP_STYLES } from '../../utils/mapStyles';
import {
  calcularRuta,
  isPointInPolygon,
  encontrarPuntoSeguroMasCercano
} from '../../utils/mapRouting';
import {
  ZONAS_RIESGO_TSUNAMI,
  VIAS_EVACUACION,
  PUNTOS_ENCUENTRO,
  FOCOS_DE_LUZ,
  ZONAS_ILUMINADAS,
  SERVICIOS_EMERGENCIA,
  LINEAS_TRANSPORTE_PUBLICO,
  sanitizeHtml,
  DEMO_TAG,
  getLiveRoutesGeoJSON,
  getLiveZonesGeoJSON,
  getLiveMeetingPoints,
  getLiveLightsGeoJSON,
  getLiveTransitLinesGeoJSON,
  GEODATA_UPDATED_EVENT
} from '../../data/mapGeoData';

export default function InteractiveMap({
  places,
  activeCategory,
  routeCoords,
  routeColor,
  userLocation,
  selectedPlace,
  setSelectedPlace,
  routeInfo,
  onRouteClick,
  onAudioClick,
  onClearRoute
}) {
  const { t } = useLanguage();
  const eventsContext = useEvents();
  const activeEvents = eventsContext?.activeEvents || [];
  const mapRef = useRef(null);

  // 1. Estado de Modos: 'auto' por defecto (conmutable a 'day' y 'night')
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem('turiarica_map_mode');
    return saved || 'auto';
  });

  const [isEvacuationActive, setIsEvacuationActive] = useState(false);
  const [routingProfile, setRoutingProfile] = useState('foot');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOfficialOnly, setFilterOfficialOnly] = useState(false);
  const [userGpsLocation, setUserGpsLocation] = useState(userLocation || null);
  const [userRiskStatus, setUserRiskStatus] = useState(null);
  const [genericPopup, setGenericPopup] = useState(null);
  const [popupHover, setPopupHover] = useState(null);

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

  // Capas reactivas sincronizadas en tiempo real con el panel de administración
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

  // Capas visibles configurables: solo turismo activo inicialmente para mapa despejado
  const [layerVisibility, setLayerVisibility] = useState({
    turismo: true,
    focosLuz: false,
    zonasIluminadas: false,
    viasEvacuacion: false,
    puntosEncuentro: false,
    zonasRiesgo: false,
    emergencias: false
  });

  // Estado interno para ruta calculada con OSRM
  const [internalRoute, setInternalRoute] = useState(null);

  // Cálculo del modo efectivo según horario para modo 'auto'
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

  // Guardar preferencia manual en localStorage
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
        // En modo evacuación: mostrar zonas seguras, de peligro y rutas
        setLayerVisibility({
          turismo: true,
          focosLuz: false,
          zonasIluminadas: false,
          viasEvacuacion: true,
          puntosEncuentro: true,
          zonasRiesgo: true,
          emergencias: true
        });
      } else {
        // Al salir de evacuación: volver al mapa limpio de turismo
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

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterOfficialOnly(false);
    setLayerVisibility({
      turismo: true,
      focosLuz: false,
      zonasIluminadas: false,
      viasEvacuacion: false,
      puntosEncuentro: false,
      zonasRiesgo: false,
      emergencias: false
    });
  };

  // Filtrado de lugares turísticos y servicios
  const filteredPlaces = useMemo(() => {
    let list = places || [];

    if (activeCategory && activeCategory !== 'Todos') {
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

    if (filterOfficialOnly) {
      list = list.filter(p => p.oficial !== false);
    }

    return list;
  }, [places, activeCategory, searchQuery, filterOfficialOnly]);

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

  // Agrupamiento dinámico según el nivel de zoom y vista actual
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

  // Manejador de Geolocalización con verificación de riesgo
  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const userPt = [longitude, latitude];
        setUserGpsLocation(userPt);

        // Verificar si está dentro de una zona de riesgo de tsunami
        let inRisk = false;
        let riskZoneName = '';
        for (const feature of ZONAS_RIESGO_TSUNAMI.features) {
          if (isPointInPolygon(userPt, feature.geometry.coordinates[0])) {
            inRisk = true;
            riskZoneName = feature.properties.nombre;
            break;
          }
        }

        setUserRiskStatus({
          inRisk,
          zoneName: riskZoneName,
          accuracyMeters: Math.round(accuracy)
        });

        if (mapRef.current) {
          mapRef.current.flyTo({
            center: userPt,
            zoom: 15,
            duration: 1500
          });
        }
      },
      (err) => {
        alert('No se pudo obtener la ubicación GPS: ' + (err.message || 'Permiso denegado'));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Buscar el punto de encuentro seguro más cercano
  const handleFindSafePoint = async () => {
    const origin = userGpsLocation || MAP_CONFIG.center;
    const [origLng, origLat] = origin;
    const safePoint = encontrarPuntoSeguroMasCercano(origLat, origLng, PUNTOS_ENCUENTRO);

    if (!safePoint) {
      alert('No se encontraron puntos de encuentro registrados.');
      return;
    }

    // Calcular ruta OSRM hacia el punto de encuentro
    const route = await calcularRuta(origin, [safePoint.lng, safePoint.lat], routingProfile, true);
    setInternalRoute(route);

    setGenericPopup({
      lng: safePoint.lng,
      lat: safePoint.lat,
      nombre: safePoint.nombre,
      categoria: 'Punto de Encuentro Seguro',
      descripcion: `${safePoint.descripcion} — Capacidad: ${safePoint.capacidad}. Cota: ${safePoint.cota}`,
      direccion: safePoint.direccion,
      fuente: safePoint.fuente,
      fecha_actualizacion: safePoint.fecha_actualizacion,
      oficial: safePoint.oficial,
      esPuntoSeguro: true
    });

    if (mapRef.current && route.coordinates) {
      const bounds = route.coordinates.reduce(
        (acc, c) => [
          [Math.min(acc[0][0], c[0]), Math.min(acc[0][1], c[1])],
          [Math.max(acc[1][0], c[0]), Math.max(acc[1][1], c[1])]
        ],
        [[Infinity, Infinity], [-Infinity, -Infinity]]
      );
      mapRef.current.fitBounds(bounds, { padding: 90, duration: 1800 });
    }
  };

  // Calcular ruta hacia cualquier destino
  const handleTraceRouteTo = async (destLng, destLat, destName) => {
    const origin = userGpsLocation || [MAP_CONFIG.center[0], MAP_CONFIG.center[1]];
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
      mapRef.current.fitBounds(bounds, { padding: 90, duration: 1800 });
    }
  };

  // Escuchar clics en features de capas MapLibre
  const handleMapClick = (e) => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    const layersToQuery = [
      'transporte-publico-line',
      'focos-puntos-layer',
      'vias-evacuacion-layer',
      'zonas-iluminadas-layer',
      'zonas-riesgo-fill'
    ].filter(id => map.getLayer(id));

    const features = map.queryRenderedFeatures(e.point, { layers: layersToQuery });

    if (features && features.length > 0) {
      const feat = features[0];
      const props = feat.properties || {};

      if (feat.layer?.id === 'transporte-publico-line') {
        setGenericPopup({
          lng: e.lngLat.lng,
          lat: e.lngLat.lat,
          nombre: props.nombre || 'Línea de Transporte Público',
          categoria: props.tipo === 'colectivo' ? '🚕 Colectivo' : '🚌 Microbús Urbano',
          descripcion: `Tarifa: ${props.tarifa || '$500'} | Horario: ${props.horario || '06:30 - 22:30'} | Frecuencia: ${props.frecuencia || 'Cada 10 min'}.`,
          estado: 'En servicio activo'
        });
        return;
      }

      setGenericPopup({
        lng: e.lngLat.lng,
        lat: e.lngLat.lat,
        nombre: props.nombre || 'Elemento del Mapa',
        categoria: props.tipo_lampara ? 'Foco de Luz' : props.cota_maxima ? 'Zona de Riesgo Tsunami' : props.nivel_iluminacion ? 'Zona Iluminada' : 'Vía de Evacuación',
        descripcion: props.descripcion || (props.estado ? `Estado: ${props.estado}. ${props.intensidad ? `Intensidad: Nivel ${props.intensidad}. Radio aprox: ${props.radio_iluminacion}m.` : ''}` : ''),
        estado: props.estado,
        direccion: props.direccion || '',
        fuente: props.fuente || 'Gobierno Regional / SENAPRED',
        fecha_actualizacion: props.fecha_actualizacion || '',
        oficial: props.oficial,
        aviso: props.aviso
      });
    }
  };

  // Sincronizar ruta externa (si vino por prop)
  const activeRouteCoordinates = routeCoords && routeCoords.length > 0
    ? routeCoords
    : internalRoute?.coordinates || null;

  const activeRouteColor = routeColor || (internalRoute?.crossesRiskZone ? '#ef4444' : '#0ea5e9');

  const routeGeojson = useMemo(() => {
    if (!activeRouteCoordinates || activeRouteCoordinates.length === 0) return null;
    return {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: activeRouteCoordinates
      }
    };
  }, [activeRouteCoordinates]);

  return (
    <div className="w-full space-y-3 sm:space-y-4">
      {/* 1. Barra Minimalista: Solo Día, Noche, Auto y Evacuación + Acceso a Pantalla Completa */}
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white/95 backdrop-blur-xl p-2.5 sm:p-3 rounded-2xl border border-sky-100 shadow-md shadow-sky-950/5">
        {/* Modos de Mapa: Auto / Día / Noche */}
        <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 shrink-0">
          <button
            onClick={() => handleSetMode('auto')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              mode === 'auto'
                ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
            title="Modo Automático según horario local"
          >
            <LucideIcons.Clock size={14} />
            <span>Auto</span>
          </button>
          <button
            onClick={() => handleSetMode('day')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              mode === 'day'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
            title="Modo Día"
          >
            <LucideIcons.Sun size={14} />
            <span>Día</span>
          </button>
          <button
            onClick={() => handleSetMode('night')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              mode === 'night'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
            title="Modo Noche"
          >
            <LucideIcons.Moon size={14} />
            <span>Noche</span>
          </button>
        </div>

        {/* Acciones de Evacuación y Ver en Pantalla Completa */}
        <div className="flex items-center gap-2">
          {/* Botón de Evacuación ante Emergencias */}
          <button
            onClick={handleToggleEvacuation}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              isEvacuationActive
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-500/30 animate-pulse'
                : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
            }`}
            title="Activar Protocolo de Evacuación ante Tsunami"
          >
            <LucideIcons.ShieldAlert size={15} />
            <span>Evacuación</span>
          </button>

          {/* Enlace al Mapa en Pantalla Completa para ver todos los detalles */}
          <Link
            to="/mapa"
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 via-sky-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-sky-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer btn-tactile"
            title="Abrir mapa dedicado en pantalla completa con todos los lugares, rutas y detalles"
          >
            <LucideIcons.Maximize2 size={14} />
            <span>Ver Mapa Completo</span>
          </Link>
        </div>
      </div>

      {/* Banner de Evacuación Activa */}
      <AnimatePresence>
        {isEvacuationActive && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white p-3 sm:p-3.5 rounded-2xl shadow-lg border border-red-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-white/20 rounded-xl">
                <LucideIcons.ShieldAlert size={18} className="text-white animate-bounce" />
              </div>
              <div>
                <h4 className="font-black text-xs sm:text-sm">Protocolo de Evacuación por Tsunami Activado</h4>
                <p className="text-[11px] sm:text-xs text-red-100">
                  Mostrando zonas seguras (Cota 30+), zonas de peligro y vías de escape oficiales hacia cerros y zonas altas.
                </p>
              </div>
            </div>
            <Link
              to="/mapa"
              className="px-3 py-1.5 rounded-xl bg-white text-red-700 font-black text-xs hover:bg-red-50 transition-all shrink-0 shadow-xs flex items-center gap-1"
            >
              <span>Ver en Pantalla Completa</span>
              <LucideIcons.ArrowRight size={13} />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Contenedor del Mapa 100% LIMPIO (Solo mapa, marcadores y navegación) */}
      <div className={`h-[65vh] sm:h-[73vh] min-h-[500px] max-h-[820px] w-full rounded-2xl sm:rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-200/80 relative z-10 select-none ${
        effectiveMode === 'night' || effectiveMode === 'emergency' ? 'map-dark-filter' : ''
      }`}>
        {/* Mapa MapLibre GL */}
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
        onClick={handleMapClick}
        onLoad={handleMapMove}
        onMoveEnd={handleMapMove}
      >
        <NavigationControl position="bottom-right" />

        {/* Capa GeoJSON: ZONAS DE RIESGO TSUNAMI (Relleno con color dinámico o rojo) */}
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

        {/* Capa GeoJSON: ZONAS ILUMINADAS */}
        {layerVisibility.zonasIluminadas && (
          <Source id="zonas-iluminadas-source" type="geojson" data={ZONAS_ILUMINADAS}>
            <Layer
              id="zonas-iluminadas-layer"
              type="fill"
              paint={{
                'fill-color': '#fbbf24',
                'fill-opacity': effectiveMode === 'night' ? 0.25 : 0.12
              }}
            />
            <Layer
              id="zonas-iluminadas-line"
              type="line"
              paint={{
                'line-color': '#f59e0b',
                'line-width': 1.5,
                'line-opacity': 0.7
              }}
            />
          </Source>
        )}

        {/* Capa GeoJSON: TRANSPORTE PÚBLICO (Micros & Colectivos urbanos) */}
        <Source id="transporte-publico-source" type="geojson" data={liveTransitLines}>
          <Layer
            id="transporte-publico-hitbox"
            type="line"
            paint={{
              'line-color': '#000000',
              'line-opacity': 0.01,
              'line-width': 18
            }}
          />
          <Layer
            id="transporte-publico-line"
            type="line"
            layout={{ 'line-join': 'round', 'line-cap': 'round' }}
            paint={{
              'line-color': ['coalesce', ['get', 'color'], '#0284c7'],
              'line-width': 4.5,
              'line-opacity': 0.85
            }}
          />
        </Source>

        {/* Capa GeoJSON: VÍAS DE EVACUACIÓN (Líneas con color personalizado o estado) */}
        {layerVisibility.viasEvacuacion && (
          <Source id="vias-evacuacion-source" type="geojson" data={liveRoutes}>
            <Layer
              id="vias-evacuacion-layer"
              type="line"
              layout={{ 'line-join': 'round', 'line-cap': 'round' }}
              paint={{
                'line-color': [
                  'coalesce',
                  ['get', 'color'],
                  [
                    'match',
                    ['get', 'estado'],
                    'activa', '#10b981',      // Verde para vía oficial activa
                    'bloqueada', '#ef4444',   // Rojo para vía bloqueada
                    'en_revision', '#f59e0b', // Amarillo para en revisión
                    '#10b981'
                  ]
                ],
                'line-width': isEvacuationActive ? 6 : 4,
                'line-opacity': isEvacuationActive ? 1.0 : 0.85
              }}
            />
          </Source>
        )}

        {/* Capa GeoJSON: FOCOS DE LUZ (Halos amarillos y puntos de estado) */}
        {layerVisibility.focosLuz && (
          <Source id="focos-luz-source" type="geojson" data={liveLights}>
            {/* Halo de luz difusa para focos activos */}
            <Layer
              id="focos-halos-layer"
              type="circle"
              filter={['==', ['get', 'estado'], 'activo']}
              paint={{
                'circle-radius': [
                  'interpolate', ['linear'], ['zoom'],
                  12, 18,
                  16, 42
                ],
                'circle-color': '#fef08a',
                'circle-opacity': effectiveMode === 'night' ? 0.35 : 0.2,
                'circle-blur': 0.8
              }}
            />
            {/* Puntos centrales según estado */}
            <Layer
              id="focos-puntos-layer"
              type="circle"
              paint={{
                'circle-radius': [
                  'interpolate', ['linear'], ['zoom'],
                  12, 4.5,
                  16, 7
                ],
                'circle-color': [
                  'match',
                  ['get', 'estado'],
                  'activo', '#f59e0b',        // Amarillo
                  'apagado', '#64748b',       // Gris / apagado
                  'mantenimiento', '#f97316', // Naranja
                  'desconocido', '#38bdf8',   // Azul grisáceo
                  '#f59e0b'
                ],
                'circle-stroke-width': 1.5,
                'circle-stroke-color': '#ffffff'
              }}
            />
          </Source>
        )}

        {/* Capa GeoJSON: RUTA ACTIVA (Con halo backdrop) */}
        {routeGeojson && (
          <Source id="route-source" type="geojson" data={routeGeojson}>
            <Layer
              id="route-line-backdrop"
              type="line"
              layout={{ 'line-join': 'round', 'line-cap': 'round' }}
              paint={{
                'line-color': '#ffffff',
                'line-width': 10,
                'line-opacity': 0.9
              }}
            />
            <Layer
              id="route-line-main"
              type="line"
              layout={{ 'line-join': 'round', 'line-cap': 'round' }}
              paint={{
                'line-color': activeRouteColor,
                'line-width': 6
              }}
            />
          </Source>
        )}

        {/* Puntos de Encuentro Oficiales (Markers interactivos sincronizados) */}
        {layerVisibility.puntosEncuentro && liveMeetingPoints.map(pe => (
          <Marker
            key={pe.id}
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
                descripcion: `${pe.descripcion} — Capacidad: ${pe.capacidad}. Cota de seguridad: ${pe.cota}.`,
                direccion: pe.direccion,
                fuente: pe.fuente,
                fecha_actualizacion: pe.fecha_actualizacion,
                oficial: pe.oficial,
                esPuntoSeguro: true
              });
            }}
          >
            <div
              className="p-1.5 rounded-full text-white shadow-lg border-2 border-white hover:scale-110 transition-transform cursor-pointer"
              style={{ backgroundColor: pe.color || '#059669' }}
            >
              <LucideIcons.LifeBuoy size={18} />
            </div>
          </Marker>
        ))}

        {/* Paradas de Transporte Público (Micros & Colectivos) */}
        {liveTransitLines?.features?.flatMap((line) =>
          (line.properties?.paradas || []).map((stop, sIdx) => (
            <Marker
              key={`stop-${line.properties.id}-${stop.id || sIdx}`}
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

        {/* Servicios Críticos y Emergencias (Hospitales, Comisarías, Bomberos, Farmacias) */}
        {layerVisibility.emergencias && SERVICIOS_EMERGENCIA.map(srv => {
          const isHospital = srv.categoria === 'Hospitales' || srv.categoria === 'Centros de Salud';
          const isComisaria = srv.categoria === 'Comisarías';
          const isBomberos = srv.categoria === 'Bomberos';
          const isFarmacia = srv.categoria === 'Farmacias';

          const bgClass = isHospital
            ? 'bg-rose-600'
            : isComisaria
            ? 'bg-blue-700'
            : isBomberos
            ? 'bg-red-700'
            : 'bg-emerald-600';

          const IconComponent = isHospital
            ? LucideIcons.Hospital
            : isComisaria
            ? LucideIcons.ShieldAlert
            : isBomberos
            ? LucideIcons.Flame
            : LucideIcons.Pill;

          return (
            <Marker
              key={srv.id}
              longitude={srv.lng}
              latitude={srv.lat}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setGenericPopup({
                  lng: srv.lng,
                  lat: srv.lat,
                  nombre: srv.nombre,
                  categoria: srv.categoria,
                  descripcion: `Servicio oficial disponible. Teléfono: ${srv.telefono}. Horario: ${srv.horario}.`,
                  telefono: srv.telefono,
                  direccion: srv.direccion,
                  fuente: srv.fuente,
                  fecha_actualizacion: srv.fecha_actualizacion,
                  oficial: srv.oficial
                });
              }}
            >
              <div className={`p-1.5 rounded-xl ${bgClass} text-white shadow-md border-2 border-white hover:scale-110 transition-transform cursor-pointer`}>
                <IconComponent size={15} />
              </div>
            </Marker>
          );
        })}

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
          const isSelected = selectedPlace?.id === place.id;
          const isDimmed = isEvacuationActive || (effectiveMode === 'night' && place.type !== 'salud' && place.type !== 'servicio');
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
                setGenericPopup(null);
              }}
            >
              <div className={`transition-opacity duration-300 ${isDimmed ? 'opacity-40 hover:opacity-100 scale-90' : 'opacity-100'}`}>
                <MapMarker
                  place={place}
                  isSelected={isSelected}
                  hasPromo={Boolean(promoEvent)}
                  promoBadge={promoEvent?.discountBadge || 'Promo'}
                  onMouseEnter={() => setPopupHover(place)}
                  onMouseLeave={() => setPopupHover(null)}
                />
              </div>
            </Marker>
          );
        })}

        {/* Marcador de Ubicación del Usuario */}
        {userGpsLocation && (
          <Marker longitude={userGpsLocation[0]} latitude={userGpsLocation[1]} anchor="center">
            <div className="relative flex items-center justify-center">
              <div className="w-9 h-9 bg-sky-500 rounded-full border-4 border-white shadow-[0_0_20px_rgba(14,165,233,0.8)] animate-ping absolute inset-0 opacity-75" />
              <div className="w-6 h-6 bg-sky-600 rounded-full border-2 border-white shadow-md relative z-10 flex items-center justify-center text-white text-[10px]">
                📍
              </div>
            </div>
          </Marker>
        )}

        {/* Hover Tooltip para lugares */}
        {popupHover && !selectedPlace && !genericPopup && (
          <Popup
            anchor="top"
            longitude={popupHover.lng}
            latitude={popupHover.lat}
            closeButton={false}
            className="rounded-xl shadow-lg pointer-events-none"
            offset={15}
          >
            <div className="px-3 py-1.5 text-center min-w-[120px]">
              <h4 className="font-bold text-slate-900 text-xs leading-tight">{popupHover.name}</h4>
              <p className="text-[10px] text-accent-600 font-semibold">{t('map.touchForRoute')}</p>
            </div>
          </Popup>
        )}

        {/* Popup Genérico Sanitizado contra XSS con Botón "Cómo Llegar" */}
        {genericPopup && (
          <Popup
            anchor="bottom"
            longitude={genericPopup.lng}
            latitude={genericPopup.lat}
            onClose={() => setGenericPopup(null)}
            closeButton={true}
            className="rounded-2xl shadow-2xl z-30"
            offset={20}
          >
            <div className="p-3 text-left max-w-xs space-y-2">
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-800">
                    {genericPopup.categoria}
                  </span>
                  {genericPopup.oficial && (
                    <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                      <LucideIcons.ShieldCheck size={10} /> Oficial
                    </span>
                  )}
                  {genericPopup.estado && (
                    <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold ${
                      genericPopup.estado === 'activo' || genericPopup.estado === 'activa'
                        ? 'bg-emerald-100 text-emerald-800'
                        : genericPopup.estado === 'bloqueada' || genericPopup.estado === 'apagado'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {genericPopup.estado}
                    </span>
                  )}
                </div>
                <h4 className="font-black text-slate-900 text-sm mt-1 leading-snug">
                  {sanitizeHtml(genericPopup.nombre)}
                </h4>
              </div>

              {genericPopup.descripcion && (
                <p className="text-xs text-slate-600 leading-relaxed">
                  {sanitizeHtml(genericPopup.descripcion)}
                </p>
              )}

              {genericPopup.direccion && (
                <p className="text-[11px] text-slate-500">
                  <strong>Dirección:</strong> {sanitizeHtml(genericPopup.direccion)}
                </p>
              )}

              {genericPopup.telefono && (
                <p className="text-[11px] text-slate-500">
                  <strong>Teléfono:</strong>{' '}
                  <a href={`tel:${genericPopup.telefono}`} className="text-brand-600 font-bold hover:underline">
                    {genericPopup.telefono}
                  </a>
                </p>
              )}

              {genericPopup.aviso && (
                <div className="p-1.5 bg-rose-50 text-rose-800 rounded-lg text-[9px] font-bold border border-rose-200">
                  {genericPopup.aviso}
                </div>
              )}

              <div className="text-[9px] text-slate-400 border-t border-slate-100 pt-1 space-y-0.5">
                <div>Fuente: {sanitizeHtml(genericPopup.fuente || 'Oficial')}</div>
                {genericPopup.fecha_actualizacion && (
                  <div>Actualizado: {genericPopup.fecha_actualizacion}</div>
                )}
              </div>

              <div className="pt-1 flex gap-2">
                <button
                  onClick={() => handleTraceRouteTo(genericPopup.lng, genericPopup.lat, genericPopup.nombre)}
                  className="flex-1 py-1.5 px-3 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                >
                  <LucideIcons.Navigation size={13} />
                  <span>Cómo llegar</span>
                </button>

                <a
                  href={getGoogleMapsUrl(genericPopup.lat, genericPopup.lng, genericPopup.nombre)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center"
                  title="Abrir en Google Maps"
                >
                  <LucideIcons.Compass size={15} />
                </a>
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>

    {/* 3. Panel de Información del Lugar Seleccionado y Ruta (EXTERNO, ABAJO DEL MAPA) */}
    <AnimatePresence>
      {selectedPlace && (
        <motion.div
          key={selectedPlace.id}
          initial={{ opacity: 0, y: 15, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.25 }}
          className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl border border-sky-100 p-5 sm:p-6 text-left transition-all"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Información del Lugar */}
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
                  {selectedPlace.category}
                </span>
                {selectedPlace.oficial !== false && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <LucideIcons.ShieldCheck size={11} /> Sitio Verificado
                  </span>
                )}
                {selectedPlace.rating && (
                  <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                    ★ {selectedPlace.rating}
                  </span>
                )}
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                {sanitizeHtml(selectedPlace.name)}
              </h3>

              {selectedPlace.directions && (
                <p className="text-xs sm:text-sm text-slate-600 font-medium flex items-center gap-1.5">
                  <LucideIcons.Bus size={15} className="text-brand-500 shrink-0" />
                  <span>{selectedPlace.directions}</span>
                </p>
              )}
            </div>

            {/* Métricas de Ruta si existen */}
            {(routeInfo || internalRoute) && (
              <div className="flex items-center gap-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl p-3 px-5 shrink-0">
                <div className="text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Distancia</div>
                  <div className="text-base sm:text-lg font-black text-emerald-600">
                    {routeInfo?.distanceKm || internalRoute?.distanceKm} km
                  </div>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div className="text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Tiempo Est.</div>
                  <div className="text-base sm:text-lg font-black text-emerald-600">
                    ~{routeInfo?.timeMin || internalRoute?.timeMin} min
                  </div>
                </div>
              </div>
            )}

            {/* Botones de Acción */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <button
                onClick={() => handleTraceRouteTo(selectedPlace.lng, selectedPlace.lat, selectedPlace.name)}
                className="py-2.5 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-brand-500/20 transition-all active:scale-95 cursor-pointer"
              >
                <LucideIcons.Navigation size={15} />
                <span>Cómo llegar</span>
              </button>

              <Link
                to={`/mapa?place=${selectedPlace.id}`}
                className="p-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-sky-600 hover:from-brand-500 hover:to-sky-500 text-white transition-colors flex items-center gap-1.5 text-xs font-bold shadow-md shadow-brand-500/20 btn-tactile cursor-pointer"
                title="Abrir en mapa interactivo dedicado en pantalla completa"
              >
                <LucideIcons.Maximize2 size={15} />
                <span className="hidden sm:inline">Ver Ficha Completa en Mapa Grande</span>
              </Link>

              <a
                href={getGoogleMapsUrl(selectedPlace.lat, selectedPlace.lng, selectedPlace.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold"
                title="Abrir en Google Maps (Navegación GPS externa)"
              >
                <LucideIcons.Compass size={16} />
                <span className="hidden sm:inline">Google Maps</span>
              </a>

              {onAudioClick && (
                <button
                  onClick={() => onAudioClick(selectedPlace)}
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  title="Escuchar audio"
                >
                  <LucideIcons.Volume2 size={16} />
                </button>
              )}

              {(activeRouteCoordinates || internalRoute) && (
                <button
                  onClick={() => {
                    setInternalRoute(null);
                    if (onClearRoute) onClearRoute();
                  }}
                  className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                  title="Quitar ruta"
                >
                  <LucideIcons.Trash2 size={16} />
                </button>
              )}

              <button
                onClick={() => setSelectedPlace(null)}
                className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                title="Cerrar panel"
              >
                <LucideIcons.X size={16} />
              </button>
            </div>
          </div>

          {internalRoute?.avisoSeguridad && (
            <div className="mt-3 text-xs text-amber-800 font-bold bg-amber-50 p-2.5 rounded-xl border border-amber-200">
              {internalRoute.avisoSeguridad}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);
}

import { useState, useRef, useMemo, useEffect } from 'react';
import Map, { Marker, Popup, Source, Layer, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  MapPin, Plus, Save, Trash2, Undo2, Footprints,
  LifeBuoy, SunMedium, AlertTriangle, CheckCircle2,
  Layers, Info, Compass, ShieldAlert, Check, Edit3, X, Palette,
  Move, CornerDownRight, ShieldCheck, Sparkles, RefreshCw, Bus,
  Car, Clock, DollarSign, Loader2, Route, Upload, Image, Link as LinkIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlaces } from '../../contexts/PlacesContext';
import { useAuth } from '../../contexts/AuthContext';
import { CATEGORIES } from '../../data/categories';
import { MAP_CONFIG, API_BASE_URL, resolveMediaUrl } from '../../utils/constants';
import { MAP_STYLES } from '../../utils/mapStyles';
import { calcularRecorridoVial } from '../../utils/mapRouting';
import {
  ZONAS_RIESGO_TSUNAMI,
  VIAS_EVACUACION,
  PUNTOS_ENCUENTRO,
  FOCOS_DE_LUZ,
  LINEAS_TRANSPORTE_PUBLICO,
  getLiveRoutesGeoJSON,
  saveLiveRoutes,
  getLiveZonesGeoJSON,
  saveLiveZones,
  getLiveMeetingPoints,
  saveLiveMeetingPoints,
  getLiveLightsGeoJSON,
  saveLiveLights,
  getLiveTransitLinesGeoJSON,
  saveLiveTransitLines,
  GEODATA_UPDATED_EVENT
} from '../../data/mapGeoData';

// Paleta de colores rápidos y de alta visibilidad para trazados
const COLOR_PRESETS = [
  { name: 'Azul Tránsito / Micro', hex: '#0284c7' },
  { name: 'Cian Costero', hex: '#06b6d4' },
  { name: 'Verde Seguro', hex: '#10b981' },
  { name: 'Naranja Morro', hex: '#f97316' },
  { name: 'Rojo Peligro', hex: '#ef4444' },
  { name: 'Ámbar Sol', hex: '#f59e0b' },
  { name: 'Púrpura Colectivo', hex: '#8b5cf6' },
  { name: 'Rosa Express', hex: '#ec4899' },
  { name: 'Gris Neutro', hex: '#64748b' }
];

export default function AdminMapManager({ initialTransitId = null }) {
  const { places, addPlace, updatePlace, deletePlace } = usePlaces();
  const { token } = useAuth();
  const mapRef = useRef(null);

  // Pestaña activa: 'transit' | 'route' | 'zone' | 'meetingPoint' | 'place' | 'light'
  const [editorTab, setEditorTab] = useState(initialTransitId ? 'transit' : 'transit');
  const [notice, setNotice] = useState(null);

  // ID del elemento actualmente en edición (null si estamos en modo creación)
  const [selectedId, setSelectedId] = useState(initialTransitId);

  // Estado del modal de confirmación personalizado (sin alerts ni confirms del navegador)
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirmar',
    isDanger: true,
    onConfirm: null
  });

  // ============================================================
  // 1. ESTADO: TRANSPORTE PÚBLICO (MICROS & COLECTIVOS)
  // ============================================================
  const [customTransitLines, setCustomTransitLines] = useState(() => {
    const live = getLiveTransitLinesGeoJSON();
    return live?.features || LINEAS_TRANSPORTE_PUBLICO.features;
  });

  const [transitForm, setTransitForm] = useState({
    nombre: '',
    tipo: 'micro', // 'micro' | 'colectivo'
    numero: '12',
    color: '#0284c7',
    tarifa: '$500',
    horario: '06:30 - 22:30',
    frecuencia: 'Cada 10 min',
    foto: ''
  });

  const [uploadingTransitPhoto, setUploadingTransitPhoto] = useState(false);
  const [transitPhotoNotice, setTransitPhotoNotice] = useState(null);
  const [transitPhotoUrlInput, setTransitPhotoUrlInput] = useState('');

  // Paradas conectadas de la línea en edición/creación: [ { id, nombre, lat, lng } ]
  const [transitDrawingStops, setTransitDrawingStops] = useState([]);
  const [transitRouteGeometry, setTransitRouteGeometry] = useState(null);
  const [isSnappingRoute, setIsSnappingRoute] = useState(false);
  const transitDrawingStopsRef = useRef(transitDrawingStops);
  useEffect(() => {
    transitDrawingStopsRef.current = transitDrawingStops;
  }, [transitDrawingStops]);

  // Sincronizar datos reactivamente al recibir eventos de actualización o storage
  useEffect(() => {
    const handleGeoUpdate = () => {
      const liveTransit = getLiveTransitLinesGeoJSON();
      if (liveTransit?.features) setCustomTransitLines(liveTransit.features);
      const liveR = getLiveRoutesGeoJSON();
      if (liveR?.features) setCustomRoutes(liveR.features);
      const liveZ = getLiveZonesGeoJSON();
      if (liveZ?.features) setCustomZones(liveZ.features);
      const liveM = getLiveMeetingPoints();
      if (Array.isArray(liveM)) setCustomMeetingPoints(liveM);
      const liveL = getLiveLightsGeoJSON();
      if (liveL?.features) setCustomLights(liveL.features);
    };

    window.addEventListener(GEODATA_UPDATED_EVENT, handleGeoUpdate);
    window.addEventListener('storage', handleGeoUpdate);
    return () => {
      window.removeEventListener(GEODATA_UPDATED_EVENT, handleGeoUpdate);
      window.removeEventListener('storage', handleGeoUpdate);
    };
  }, []);

  // ============================================================
  // 2. ESTADO: VÍAS DE EVACUACIÓN (LÍNEAS)
  // ============================================================
  const [customRoutes, setCustomRoutes] = useState(() => {
    const live = getLiveRoutesGeoJSON();
    return live?.features || VIAS_EVACUACION.features;
  });
  const [routeForm, setRouteForm] = useState({
    nombre: '',
    direccion: 'Hacia cota de seguridad 30 msnm',
    estado: 'activa',
    color: '#10b981',
    oficial: true
  });
  const [routeDrawingPoints, setRouteDrawingPoints] = useState([]);

  // ============================================================
  // 3. ESTADO: ZONAS SEGURAS Y PELIGROSAS (POLÍGONOS)
  // ============================================================
  const [customZones, setCustomZones] = useState(() => {
    const live = getLiveZonesGeoJSON();
    return live?.features || ZONAS_RIESGO_TSUNAMI.features;
  });
  const [zoneForm, setZoneForm] = useState({
    nombre: '',
    tipo: 'peligro_tsunami',
    nivel_peligro: 'Alto',
    descripcion: 'Zona costera inundable ante tren de olas',
    cota_maxima: '15 msnm',
    color: '#ef4444',
    opacity: 0.35
  });
  const [zoneDrawingPoints, setZoneDrawingPoints] = useState([]);

  // ============================================================
  // 4. ESTADO: PUNTOS DE ENCUENTRO SEGUROS (COTA 30+ MSNM)
  // ============================================================
  const [customMeetingPoints, setCustomMeetingPoints] = useState(() => {
    return getLiveMeetingPoints() || PUNTOS_ENCUENTRO;
  });
  const [meetingForm, setMeetingForm] = useState({
    nombre: '',
    capacidad: '2.500 personas',
    cota: '45 msnm',
    direccion: '',
    descripcion: 'Zona segura sobre cota 30 msnm',
    color: '#10b981',
    lat: -18.4783,
    lng: -70.3126,
    oficial: true
  });

  // ============================================================
  // 5. ESTADO: LUGARES TURÍSTICOS / SERVICIOS (SQLITE)
  // ============================================================
  const [placeForm, setPlaceForm] = useState({
    name: '',
    category: 'Playa',
    type: 'turismo',
    shortDesc: '',
    fullDesc: '',
    lat: -18.4783,
    lng: -70.3126,
    directions: '',
    phone: '',
    hours: '10:00 - 20:00',
    photos: []
  });
  const [uploadingPlacePhoto, setUploadingPlacePhoto] = useState(false);
  const [placePhotoNotice, setPlacePhotoNotice] = useState(null);
  const [placePhotoUrlInput, setPlacePhotoUrlInput] = useState('');
  const [isSavingPlace, setIsSavingPlace] = useState(false);

  // Subida de fotos con optimización WebP para Transporte
  const handleTransitPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingTransitPhoto(true);
    setTransitPhotoNotice(null);
    const formData = new FormData();
    formData.append('photo', file);
    try {
      const res = await fetch(`${API_BASE_URL}/upload/photo`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setTransitForm(prev => ({ ...prev, foto: data.url }));
        setTransitPhotoNotice(`Foto procesada y optimizada a WebP (${data.stats?.savingsPercent || '85%'} menos peso).`);
        setTimeout(() => setTransitPhotoNotice(null), 4000);
      }
    } catch (err) {
      console.error('Error al subir foto de transporte:', err);
    } finally {
      setUploadingTransitPhoto(false);
    }
  };

  // Subida de fotos con optimización WebP para Lugares
  const handlePlacePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPlacePhoto(true);
    setPlacePhotoNotice(null);
    const formData = new FormData();
    formData.append('photo', file);
    try {
      const res = await fetch(`${API_BASE_URL}/upload/photo`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setPlaceForm(prev => ({ ...prev, photos: [...(prev.photos || []), data.url] }));
        setPlacePhotoNotice(`Foto agregada y optimizada a WebP (${data.stats?.savingsPercent || '85%'} ahorro).`);
        setTimeout(() => setPlacePhotoNotice(null), 4000);
      }
    } catch (err) {
      console.error('Error al subir foto de lugar:', err);
    } finally {
      setUploadingPlacePhoto(false);
    }
  };

  // ============================================================
  // 6. ESTADO: FOCOS DE LUZ URBANOS
  // ============================================================
  const [customLights, setCustomLights] = useState(() => {
    const live = getLiveLightsGeoJSON();
    return live?.features || FOCOS_DE_LUZ.features;
  });
  const [lightForm, setLightForm] = useState({
    nombre: '',
    estado: 'activo',
    intensidad: 3,
    tipo_lampara: 'LED Solar 150W',
    radio_iluminacion: 40,
    color: '#f59e0b',
    lat: -18.4783,
    lng: -70.3126
  });

  // Sincronizar líneas de transporte con backend SQLite al montar
  useEffect(() => {
    fetch(`${API_BASE_URL}/transit`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.features && data.features.length > 0) {
          setCustomTransitLines(data.features);
          saveLiveTransitLines(data.features);
        }
      })
      .catch(err => console.warn('[TRANSIT] Error cargando líneas de backend:', err));
  }, []);

  // Si se pasó initialTransitId, cargarlo de inmediato; si es null, reiniciar a creación limpia
  useEffect(() => {
    if (initialTransitId && customTransitLines.length > 0) {
      const found = customTransitLines.find(t => t.properties.id === initialTransitId);
      if (found) {
        handleSelectTransit(found);
      }
    } else if (initialTransitId === null) {
      setEditorTab('transit');
      handleResetSelection();
    }
  }, [initialTransitId, customTransitLines]);

  // Limpiar selecciones y volver a modo creación limpio
  const handleResetSelection = () => {
    setSelectedId(null);
    setTransitDrawingStops([]);
    setTransitRouteGeometry(null);
    setRouteDrawingPoints([]);
    setZoneDrawingPoints([]);

    if (editorTab === 'transit') {
      setTransitForm({
        nombre: '',
        tipo: 'micro',
        numero: '12',
        color: '#0284c7',
        tarifa: '$500',
        horario: '06:30 - 22:30',
        frecuencia: 'Cada 10 min',
        foto: ''
      });
      setTransitPhotoUrlInput('');
    } else if (editorTab === 'route') {
      setRouteForm({
        nombre: '',
        direccion: 'Hacia cota de seguridad 30 msnm',
        estado: 'activa',
        color: '#10b981',
        oficial: true
      });
    } else if (editorTab === 'zone') {
      setZoneForm({
        nombre: '',
        tipo: 'peligro_tsunami',
        nivel_peligro: 'Alto',
        descripcion: 'Zona costera inundable ante tren de olas',
        cota_maxima: '15 msnm',
        color: '#ef4444',
        opacity: 0.35
      });
    } else if (editorTab === 'meetingPoint') {
      setMeetingForm({
        nombre: '',
        capacidad: '2.500 personas',
        cota: '45 msnm',
        direccion: '',
        descripcion: 'Zona segura sobre cota 30 msnm',
        color: '#10b981',
        lat: -18.4783,
        lng: -70.3126,
        oficial: true
      });
    } else if (editorTab === 'place') {
      setPlaceForm({
        name: '',
        category: 'Playa',
        type: 'turismo',
        shortDesc: '',
        fullDesc: '',
        lat: -18.4783,
        lng: -70.3126,
        directions: '',
        phone: '',
        hours: '10:00 - 20:00',
        photos: []
      });
      setPlacePhotoUrlInput('');
    } else if (editorTab === 'light') {
      setLightForm({
        nombre: '',
        estado: 'activo',
        intensidad: 3,
        tipo_lampara: 'LED Solar 150W',
        radio_iluminacion: 40,
        color: '#f59e0b',
        lat: -18.4783,
        lng: -70.3126
      });
    }
  };

  const activeSelectedTransit = useMemo(() => {
    if (!selectedId || editorTab !== 'transit') return null;
    return customTransitLines.find(t => t.properties.id === selectedId) || null;
  }, [selectedId, editorTab, customTransitLines]);

  const activeSelectedRoute = useMemo(() => {
    if (!selectedId || editorTab !== 'route') return null;
    return customRoutes.find(r => r.properties.id === selectedId) || null;
  }, [selectedId, editorTab, customRoutes]);

  const activeSelectedZone = useMemo(() => {
    if (!selectedId || editorTab !== 'zone') return null;
    return customZones.find(z => z.properties.id === selectedId) || null;
  }, [selectedId, editorTab, customZones]);

  // ============================================================
  // AJUSTE DE RECORRIDO DE TRANSPORTE A CALLES (OSRM)
  // ============================================================
  const updateTransitStopsAndGeometry = async (newStops) => {
    setTransitDrawingStops(newStops);
    if (newStops.length >= 2) {
      setIsSnappingRoute(true);
      const waypoints = newStops.map(s => [s.lng, s.lat]);
      const res = await calcularRecorridoVial(waypoints);
      const coords = (res && res.coordinates) ? res.coordinates : waypoints;
      const geom = { type: "LineString", coordinates: coords };
      setTransitRouteGeometry(geom);
      setIsSnappingRoute(false);

      if (selectedId) {
        let updatedList = [];
        setCustomTransitLines(prev => {
          updatedList = prev.map(t => {
            if (t.properties.id === selectedId) {
              return {
                ...t,
                properties: {
                  ...t.properties,
                  paradas: newStops
                },
                geometry: geom
              };
            }
            return t;
          });
          saveLiveTransitLines(updatedList);
          return updatedList;
        });

        // Sincronizar en SQLite para persistencia al recargar
        try {
          const feat = updatedList.find(t => t.properties.id === selectedId);
          if (feat) {
            fetch(`${API_BASE_URL}/transit/${selectedId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {})
              },
              body: JSON.stringify(feat)
            }).catch(() => {});
          }
        } catch (e) {}
      }
    } else {
      setTransitRouteGeometry(null);
      if (selectedId) {
        const geom = newStops.length > 0
          ? { type: "LineString", coordinates: newStops.map(s => [s.lng, s.lat]) }
          : null;
        let updatedList = [];
        setCustomTransitLines(prev => {
          updatedList = prev.map(t => {
            if (t.properties.id === selectedId) {
              return {
                ...t,
                properties: {
                  ...t.properties,
                  paradas: newStops
                },
                geometry: geom
              };
            }
            return t;
          });
          saveLiveTransitLines(updatedList);
          return updatedList;
        });
      }
    }
  };

  // ============================================================
  // MANEJADOR DE CLIC EN EL MAPA (TRAZADO O SELECCIÓN)
  // ============================================================
  const handleMapClick = (e) => {
    const { lng, lat } = e.lngLat;
    const roundLat = parseFloat(lat.toFixed(6));
    const roundLng = parseFloat(lng.toFixed(6));

    // 1. TRANSPORTE PÚBLICO: colocar paradas que ajustan el recorrido por las calles
    // Prioridad absoluta: nunca debe ser bloqueado ni desviado por capas de zonas o vías
    if (editorTab === 'transit') {
      const currentStops = transitDrawingStopsRef.current || [];
      const stopIndex = currentStops.length + 1;
      const newStop = {
        id: `stop_${Date.now()}_${stopIndex}`,
        nombre: `Parada ${stopIndex}`,
        lat: roundLat,
        lng: roundLng
      };
      const nextStops = [...currentStops, newStop];
      updateTransitStopsAndGeometry(nextStops);
      return;
    }

    // 2. Si se hizo clic en una capa interactiva correspondiente a la pestaña actual
    if (e.features && e.features.length > 0) {
      const feat = e.features[0];
      const layerId = feat.layer?.id;

      if (editorTab === 'route' && (layerId === 'admin-routes-line' || layerId === 'admin-routes-hitbox')) {
        const found = customRoutes.find(r => r.properties.id === feat.properties.id);
        if (found) {
          handleSelectRoute(found);
          return;
        }
      }

      if (editorTab === 'zone' && (layerId === 'admin-zones-fill' || layerId === 'admin-zones-line')) {
        const found = customZones.find(z => z.properties.id === feat.properties.id);
        if (found) {
          handleSelectZone(found);
          return;
        }
      }

      if (editorTab === 'light' && layerId === 'admin-lights-circle') {
        const found = customLights.find(l => l.properties.id === feat.properties.id);
        if (found) {
          handleSelectLight(found);
          return;
        }
      }
    }

    // 3. Colocación de puntos según pestaña activa
    if (editorTab === 'route') {
      if (!selectedId) {
        setRouteDrawingPoints(prev => [...prev, [roundLng, roundLat]]);
      } else {
        setCustomRoutes(prev => prev.map(r => {
          if (r.properties.id === selectedId) {
            return {
              ...r,
              geometry: {
                ...r.geometry,
                coordinates: [...r.geometry.coordinates, [roundLng, roundLat]]
              }
            };
          }
          return r;
        }));
      }
    } else if (editorTab === 'zone') {
      if (!selectedId) {
        setZoneDrawingPoints(prev => [...prev, [roundLng, roundLat]]);
      } else {
        setCustomZones(prev => prev.map(z => {
          if (z.properties.id === selectedId) {
            const coords = [...z.geometry.coordinates[0]];
            coords.splice(coords.length - 1, 0, [roundLng, roundLat]);
            return {
              ...z,
              geometry: {
                ...z.geometry,
                coordinates: [coords]
              }
            };
          }
          return z;
        }));
      }
    } else if (editorTab === 'meetingPoint') {
      setMeetingForm(prev => ({ ...prev, lat: roundLat, lng: roundLng }));
    } else if (editorTab === 'place') {
      setPlaceForm(prev => ({ ...prev, lat: roundLat, lng: roundLng }));
    } else if (editorTab === 'light') {
      setLightForm(prev => ({ ...prev, lat: roundLat, lng: roundLng }));
    }
  };

  // ============================================================
  // ACTUALIZACIONES DE COLOR EN TIEMPO REAL
  // ============================================================
  const handleColorChangeTransit = (hex) => {
    setTransitForm(prev => ({ ...prev, color: hex }));
    if (selectedId) {
      setCustomTransitLines(prev => prev.map(t => {
        if (t.properties.id === selectedId) {
          return {
            ...t,
            properties: { ...t.properties, color: hex }
          };
        }
        return t;
      }));
    }
  };

  const handleColorChangeRoute = (hex) => {
    setRouteForm(prev => ({ ...prev, color: hex }));
    if (selectedId) {
      setCustomRoutes(prev => prev.map(r => {
        if (r.properties.id === selectedId) {
          return {
            ...r,
            properties: { ...r.properties, color: hex }
          };
        }
        return r;
      }));
    }
  };

  const handleColorChangeZone = (hex) => {
    setZoneForm(prev => ({ ...prev, color: hex }));
    if (selectedId) {
      setCustomZones(prev => prev.map(z => {
        if (z.properties.id === selectedId) {
          return {
            ...z,
            properties: { ...z.properties, color: hex }
          };
        }
        return z;
      }));
    }
  };

  const handleOpacityChangeZone = (val) => {
    setZoneForm(prev => ({ ...prev, opacity: val }));
    if (selectedId) {
      setCustomZones(prev => prev.map(z => {
        if (z.properties.id === selectedId) {
          return {
            ...z,
            properties: { ...z.properties, opacity: val }
          };
        }
        return z;
      }));
    }
  };

  const handleColorChangeMeeting = (hex) => {
    setMeetingForm(prev => ({ ...prev, color: hex }));
    if (selectedId) {
      setCustomMeetingPoints(prev => prev.map(p => {
        if (p.id === selectedId) return { ...p, color: hex };
        return p;
      }));
    }
  };

  // ============================================================
  // GESTIÓN DE PARADAS DE TRANSPORTE
  // ============================================================
  const handleDragTransitStop = (index, lng, lat) => {
    const roundLng = parseFloat(lng.toFixed(6));
    const roundLat = parseFloat(lat.toFixed(6));
    const nextStops = [...transitDrawingStops];
    nextStops[index] = { ...nextStops[index], lat: roundLat, lng: roundLng };
    updateTransitStopsAndGeometry(nextStops);
  };

  const handleDeleteTransitStop = (index) => {
    const nextStops = transitDrawingStops.filter((_, i) => i !== index);
    updateTransitStopsAndGeometry(nextStops);
  };

  const handleUpdateStopName = (index, newName) => {
    const nextStops = [...transitDrawingStops];
    nextStops[index] = { ...nextStops[index], nombre: newName };
    setTransitDrawingStops(nextStops);

    if (selectedId) {
      setCustomTransitLines(prev => {
        const updated = prev.map(t => {
          if (t.properties.id === selectedId) {
            return {
              ...t,
              properties: {
                ...t.properties,
                paradas: nextStops
              }
            };
          }
          return t;
        });
        saveLiveTransitLines(updated);
        return updated;
      });
    }
  };

  // ============================================================
  // ARRASTRE DE VÉRTICES (VÍAS & ZONAS)
  // ============================================================
  const handleDragRouteVertex = (index, lng, lat) => {
    const roundLng = parseFloat(lng.toFixed(6));
    const roundLat = parseFloat(lat.toFixed(6));
    if (selectedId) {
      setCustomRoutes(prev => {
        const next = prev.map(r => {
          if (r.properties.id === selectedId) {
            const newCoords = [...r.geometry.coordinates];
            newCoords[index] = [roundLng, roundLat];
            return {
              ...r,
              geometry: { ...r.geometry, coordinates: newCoords }
            };
          }
          return r;
        });
        saveLiveRoutes(next);
        return next;
      });
    } else {
      setRouteDrawingPoints(prev => {
        const next = [...prev];
        next[index] = [roundLng, roundLat];
        return next;
      });
    }
  };

  const handleDragZoneVertex = (index, lng, lat) => {
    const roundLng = parseFloat(lng.toFixed(6));
    const roundLat = parseFloat(lat.toFixed(6));
    if (selectedId) {
      setCustomZones(prev => {
        const next = prev.map(z => {
          if (z.properties.id === selectedId) {
            const coords = [...z.geometry.coordinates[0]];
            coords[index] = [roundLng, roundLat];
            if (index === 0) coords[coords.length - 1] = [roundLng, roundLat];
            if (index === coords.length - 1) coords[0] = [roundLng, roundLat];
            return {
              ...z,
              geometry: { ...z.geometry, coordinates: [coords] }
            };
          }
          return z;
        });
        saveLiveZones(next);
        return next;
      });
    } else {
      setZoneDrawingPoints(prev => {
        const next = [...prev];
        next[index] = [roundLng, roundLat];
        return next;
      });
    }
  };

  const handleDeleteRouteVertex = (index) => {
    if (selectedId) {
      setCustomRoutes(prev => {
        const next = prev.map(r => {
          if (r.properties.id === selectedId) {
            const newCoords = r.geometry.coordinates.filter((_, i) => i !== index);
            if (newCoords.length < 2) return r;
            return {
              ...r,
              geometry: { ...r.geometry, coordinates: newCoords }
            };
          }
          return r;
        });
        saveLiveRoutes(next);
        return next;
      });
    } else {
      setRouteDrawingPoints(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleDeleteZoneVertex = (index) => {
    if (selectedId) {
      setCustomZones(prev => {
        const next = prev.map(z => {
          if (z.properties.id === selectedId) {
            let coords = [...z.geometry.coordinates[0]];
            if (coords.length <= 4) return z; // mínimo para cerrar polígono
            coords = coords.filter((_, i) => i !== index);
            coords[coords.length - 1] = coords[0];
            return {
              ...z,
              geometry: { ...z.geometry, coordinates: [coords] }
            };
          }
          return z;
        });
        saveLiveZones(next);
        return next;
      });
    } else {
      setZoneDrawingPoints(prev => prev.filter((_, i) => i !== index));
    }
  };

  // ============================================================
  // SELECCIONES Y GUARDADO
  // ============================================================
  const handleSelectTransit = (transit) => {
    setSelectedId(transit.properties.id);
    setEditorTab('transit');
    setTransitForm({
      nombre: transit.properties.nombre || '',
      tipo: transit.properties.tipo || 'micro',
      numero: transit.properties.numero || '1',
      color: transit.properties.color || '#0284c7',
      tarifa: transit.properties.tarifa || '$500',
      horario: transit.properties.horario || '06:30 - 22:30',
      frecuencia: transit.properties.frecuencia || 'Cada 10 min',
      foto: transit.properties.foto || ''
    });
    const stops = transit.properties.paradas || [];
    setTransitDrawingStops(stops);
    setTransitRouteGeometry(transit.geometry || null);
    setNotice({
      type: 'info',
      text: `Editando ${transit.properties.tipo === 'colectivo' ? 'Colectivo' : 'Micro'} "${transit.properties.nombre}". Haz clic en el mapa para sumar paradas o arrastra las existentes.`
    });

    if (mapRef.current && stops.length > 0) {
      try {
        mapRef.current.flyTo({
          center: [stops[0].lng, stops[0].lat],
          zoom: 14,
          duration: 800
        });
      } catch (e) {}
    }
  };

  const handleSaveTransit = async () => {
    let stopsToSave = [...transitDrawingStops];

    // Si el usuario no colocó paradas, generar automáticamente 2 paradas iniciales en Arica
    if (stopsToSave.length === 0) {
      const center = mapRef.current ? mapRef.current.getMap()?.getCenter() : { lng: -70.3126, lat: -18.4783 };
      const cLng = center ? parseFloat(center.lng.toFixed(6)) : -70.3126;
      const cLat = center ? parseFloat(center.lat.toFixed(6)) : -18.4783;
      stopsToSave = [
        { id: `stop_${Date.now()}_1`, nombre: 'Parada Inicio (Centro)', lat: cLat, lng: parseFloat((cLng - 0.005).toFixed(6)) },
        { id: `stop_${Date.now()}_2`, nombre: 'Parada Destino', lat: cLat, lng: parseFloat((cLng + 0.005).toFixed(6)) }
      ];
    } else if (stopsToSave.length === 1) {
      const p1 = stopsToSave[0];
      stopsToSave.push({
        id: `stop_${Date.now()}_2`,
        nombre: 'Parada Término',
        lat: parseFloat((p1.lat + 0.004).toFixed(6)),
        lng: parseFloat((p1.lng + 0.004).toFixed(6))
      });
    }

    let geometry = transitRouteGeometry;
    if (!geometry || !geometry.coordinates || geometry.coordinates.length < 2) {
      try {
        const waypoints = stopsToSave.map(s => [s.lng, s.lat]);
        const res = await calcularRecorridoVial(waypoints);
        geometry = { type: 'LineString', coordinates: (res && res.coordinates) ? res.coordinates : waypoints };
      } catch (e) {
        geometry = { type: 'LineString', coordinates: stopsToSave.map(s => [s.lng, s.lat]) };
      }
    }

    const lineName = transitForm.nombre?.trim() || `Línea ${transitForm.numero || '1'} (${transitForm.tipo === 'colectivo' ? 'Colectivo' : 'Micro'})`;

    if (selectedId) {
      const updatedFeature = {
        type: "Feature",
        properties: {
          id: selectedId,
          ...transitForm,
          nombre: lineName,
          paradas: stopsToSave
        },
        geometry
      };
      const updated = customTransitLines.map(t => (t.properties.id === selectedId ? updatedFeature : t));
      setCustomTransitLines(updated);
      saveLiveTransitLines(updated);

      // Sincronizar en backend SQLite
      try {
        await fetch(`${API_BASE_URL}/transit/${selectedId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify(updatedFeature)
        });
      } catch (err) {
        console.warn('[TRANSIT] Falló actualización en backend, guardado en almacenamiento local:', err);
      }

      setNotice({ type: 'success', text: `Línea "${lineName}" guardada y sincronizada en el mapa público.` });
      handleResetSelection();
    } else {
      const newFeature = {
        type: "Feature",
        properties: {
          id: `linea-transporte-${Date.now()}`,
          ...transitForm,
          nombre: lineName,
          paradas: stopsToSave
        },
        geometry
      };
      const next = [...customTransitLines, newFeature];
      setCustomTransitLines(next);
      saveLiveTransitLines(next);

      // Sincronizar en backend SQLite
      try {
        await fetch(`${API_BASE_URL}/transit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify(newFeature)
        });
      } catch (err) {
        console.warn('[TRANSIT] Falló guardado en backend, guardado en almacenamiento local:', err);
      }

      setTransitDrawingStops([]);
      setTransitRouteGeometry(null);
      setNotice({ type: 'success', text: `Línea "${lineName}" agregada al mapa con éxito.` });
      handleResetSelection();
    }
    setTimeout(() => setNotice(null), 4000);
  };

  const promptDeleteTransit = (id) => {
    const t = customTransitLines.find(line => line.properties.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'Eliminar Línea de Transporte',
      message: `¿Estás seguro de que deseas eliminar permanentemente la línea "${t?.properties?.nombre || 'seleccionada'}" del mapa público?`,
      confirmText: 'Eliminar Línea',
      isDanger: true,
      onConfirm: async () => {
        const next = customTransitLines.filter(line => line.properties.id !== id);
        setCustomTransitLines(next);
        saveLiveTransitLines(next);
        try {
          await fetch(`${API_BASE_URL}/transit/${id}`, {
            method: 'DELETE',
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
        } catch (e) {
          console.warn('[TRANSIT] Falló borrado en backend:', e);
        }
        handleResetSelection();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setNotice({ type: 'success', text: 'Línea de transporte público eliminada con éxito.' });
        setTimeout(() => setNotice(null), 3000);
      }
    });
  };

  const handleSelectRoute = (route) => {
    setSelectedId(route.properties.id);
    setEditorTab('route');
    setRouteForm({
      nombre: route.properties.nombre || '',
      direccion: route.properties.direccion || 'Hacia cota de seguridad 30 msnm',
      estado: route.properties.estado || 'activa',
      color: route.properties.color || (route.properties.estado === 'bloqueada' ? '#ef4444' : '#10b981'),
      oficial: route.properties.oficial ?? true
    });
    setRouteDrawingPoints([]);
    setNotice({ type: 'info', text: `Editando vía: "${route.properties.nombre}". Arrastra los puntos en el mapa para ajustar curvas.` });
  };

  const handleSaveRoute = () => {
    if (selectedId) {
      const updated = customRoutes.map(r => {
        if (r.properties.id === selectedId) {
          return {
            ...r,
            properties: {
              ...r.properties,
              ...routeForm
            }
          };
        }
        return r;
      });
      setCustomRoutes(updated);
      saveLiveRoutes(updated);
      setNotice({ type: 'success', text: 'Vía de evacuación actualizada y reflejada en el mapa público.' });
      handleResetSelection();
    } else {
      if (routeDrawingPoints.length < 2) {
        setNotice({ type: 'warning', text: 'Debes marcar al menos 2 puntos en el mapa para conectar la vía.' });
        return;
      }
      const newFeature = {
        type: "Feature",
        properties: {
          id: `via-custom-${Date.now()}`,
          nombre: routeForm.nombre || `Vía de Evacuación #${customRoutes.length + 1}`,
          ...routeForm
        },
        geometry: {
          type: "LineString",
          coordinates: routeDrawingPoints
        }
      };
      const next = [...customRoutes, newFeature];
      setCustomRoutes(next);
      saveLiveRoutes(next);
      setRouteDrawingPoints([]);
      setNotice({ type: 'success', text: 'Nueva vía trazada, guardada y visible en el mapa público.' });
      handleResetSelection();
    }
    setTimeout(() => setNotice(null), 4000);
  };

  const promptDeleteRoute = (id) => {
    const r = customRoutes.find(item => item.properties.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'Eliminar Vía de Evacuación',
      message: `¿Estás seguro de que deseas eliminar la vía "${r?.properties?.nombre || 'seleccionada'}"?`,
      confirmText: 'Eliminar Vía',
      isDanger: true,
      onConfirm: () => {
        const next = customRoutes.filter(item => item.properties.id !== id);
        setCustomRoutes(next);
        saveLiveRoutes(next);
        handleResetSelection();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setNotice({ type: 'success', text: 'Vía de evacuación eliminada del mapa público.' });
        setTimeout(() => setNotice(null), 3000);
      }
    });
  };

  const handleSelectZone = (zone) => {
    setSelectedId(zone.properties.id);
    setEditorTab('zone');
    setZoneForm({
      nombre: zone.properties.nombre || '',
      tipo: zone.properties.tipo || 'peligro_tsunami',
      nivel_peligro: zone.properties.nivel_peligro || 'Alto',
      descripcion: zone.properties.descripcion || '',
      cota_maxima: zone.properties.cota_maxima || '15 msnm',
      color: zone.properties.color || '#ef4444',
      opacity: zone.properties.opacity || 0.35
    });
    setZoneDrawingPoints([]);
    setNotice({ type: 'info', text: `Editando zona: "${zone.properties.nombre}". Arrastra los vértices para reformar el área.` });
  };

  const handleSaveZone = () => {
    if (selectedId) {
      const updated = customZones.map(z => {
        if (z.properties.id === selectedId) {
          return {
            ...z,
            properties: {
              ...z.properties,
              ...zoneForm
            }
          };
        }
        return z;
      });
      setCustomZones(updated);
      saveLiveZones(updated);
      setNotice({ type: 'success', text: 'Zona guardada y actualizada en el mapa público.' });
      handleResetSelection();
    } else {
      if (zoneDrawingPoints.length < 3) {
        setNotice({ type: 'warning', text: 'Debes marcar al menos 3 puntos en el mapa para cerrar el polígono de la zona.' });
        return;
      }
      const closedCoords = [...zoneDrawingPoints, zoneDrawingPoints[0]];
      const newFeature = {
        type: "Feature",
        properties: {
          id: `zona-custom-${Date.now()}`,
          nombre: zoneForm.nombre || `Zona #${customZones.length + 1}`,
          ...zoneForm,
          fuente: "Plataforma Municipal TuriArica",
          fecha_actualizacion: new Date().toISOString().split('T')[0]
        },
        geometry: {
          type: "Polygon",
          coordinates: [closedCoords]
        }
      };
      const next = [...customZones, newFeature];
      setCustomZones(next);
      saveLiveZones(next);
      setZoneDrawingPoints([]);
      setNotice({ type: 'success', text: 'Nueva zona trazada y reflejada en el mapa público.' });
      handleResetSelection();
    }
    setTimeout(() => setNotice(null), 4000);
  };

  const promptDeleteZone = (id) => {
    const z = customZones.find(item => item.properties.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'Eliminar Zona',
      message: `¿Estás seguro de que deseas eliminar la zona "${z?.properties?.nombre || 'seleccionada'}"?`,
      confirmText: 'Eliminar Zona',
      isDanger: true,
      onConfirm: () => {
        const next = customZones.filter(item => item.properties.id !== id);
        setCustomZones(next);
        saveLiveZones(next);
        handleResetSelection();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setNotice({ type: 'success', text: 'Zona eliminada del mapa público.' });
        setTimeout(() => setNotice(null), 3000);
      }
    });
  };

  const handleSelectMeetingPoint = (pt) => {
    setSelectedId(pt.id);
    setEditorTab('meetingPoint');
    setMeetingForm({
      nombre: pt.nombre || '',
      capacidad: pt.capacidad || '',
      cota: pt.cota || '',
      direccion: pt.direccion || '',
      descripcion: pt.descripcion || '',
      color: pt.color || '#10b981',
      lat: pt.lat,
      lng: pt.lng,
      oficial: pt.oficial ?? true
    });
    setNotice({ type: 'info', text: `Editando punto seguro: "${pt.nombre}". Arrastra el icono para moverlo.` });
  };

  const handleSaveMeetingPoint = () => {
    if (!meetingForm.nombre.trim()) {
      setNotice({ type: 'warning', text: 'Ingresa el nombre del punto seguro antes de guardar.' });
      return;
    }
    if (selectedId) {
      const updated = customMeetingPoints.map(p => {
        if (p.id === selectedId) return { ...p, ...meetingForm };
        return p;
      });
      setCustomMeetingPoints(updated);
      saveLiveMeetingPoints(updated);
      setNotice({ type: 'success', text: 'Punto seguro actualizado en el mapa público.' });
      handleResetSelection();
    } else {
      const next = [...customMeetingPoints, { id: `pe-custom-${Date.now()}`, ...meetingForm }];
      setCustomMeetingPoints(next);
      saveLiveMeetingPoints(next);
      setNotice({ type: 'success', text: 'Punto seguro registrado y visible en el mapa público.' });
      handleResetSelection();
    }
    setTimeout(() => setNotice(null), 4000);
  };

  const promptDeleteMeetingPoint = (id) => {
    const p = customMeetingPoints.find(item => item.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'Eliminar Punto Seguro',
      message: `¿Estás seguro de que deseas eliminar el punto "${p?.nombre || 'seleccionado'}"?`,
      confirmText: 'Eliminar Punto',
      isDanger: true,
      onConfirm: () => {
        const next = customMeetingPoints.filter(item => item.id !== id);
        setCustomMeetingPoints(next);
        saveLiveMeetingPoints(next);
        handleResetSelection();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setNotice({ type: 'success', text: 'Punto seguro eliminado.' });
        setTimeout(() => setNotice(null), 3000);
      }
    });
  };

  const handleSelectPlace = (place) => {
    setSelectedId(place.id);
    setEditorTab('place');
    setPlaceForm({
      name: place.name || '',
      category: place.category || 'Playa',
      type: place.type || 'turismo',
      shortDesc: place.shortDesc || '',
      fullDesc: place.fullDesc || '',
      lat: place.lat,
      lng: place.lng,
      directions: place.directions || '',
      phone: place.phone || '',
      hours: place.hours || '10:00 - 20:00',
      photos: place.photos || []
    });
    setNotice({ type: 'info', text: `Editando lugar: "${place.name}". Puedes arrastrar su marcador en el mapa.` });
  };

  const handleSavePlace = async (e) => {
    if (e) e.preventDefault();
    if (!placeForm.name.trim()) {
      setNotice({ type: 'warning', text: 'Ingresa el nombre del lugar turístico.' });
      return;
    }
    setIsSavingPlace(true);
    try {
      if (selectedId) {
        await updatePlace(selectedId, placeForm);
        setNotice({ type: 'success', text: 'Lugar turístico actualizado en la base de datos.' });
      } else {
        await addPlace(placeForm);
        setNotice({ type: 'success', text: 'Nuevo lugar registrado exitosamente en la base de datos.' });
      }
      handleResetSelection();
    } catch (err) {
      setNotice({ type: 'error', text: 'Error al guardar lugar en la base de datos.' });
    } finally {
      setIsSavingPlace(false);
      setTimeout(() => setNotice(null), 4000);
    }
  };

  const promptDeletePlace = (id) => {
    const p = places.find(item => item.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'Eliminar Lugar Turístico',
      message: `¿Estás seguro de que deseas eliminar permanentemente "${p?.name || 'este lugar'}" de la base de datos?`,
      confirmText: 'Eliminar de Base de Datos',
      isDanger: true,
      onConfirm: async () => {
        try {
          await deletePlace(id);
          handleResetSelection();
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          setNotice({ type: 'success', text: 'Lugar eliminado de la base de datos.' });
          setTimeout(() => setNotice(null), 3000);
        } catch (err) {
          setNotice({ type: 'error', text: 'Error al eliminar el lugar.' });
        }
      }
    });
  };

  const handleSelectLight = (light) => {
    setSelectedId(light.properties.id);
    setEditorTab('light');
    setLightForm({
      nombre: light.properties.nombre || '',
      estado: light.properties.estado || 'activo',
      intensidad: light.properties.intensidad || 3,
      tipo_lampara: light.properties.tipo_lampara || 'LED Solar 150W',
      radio_iluminacion: light.properties.radio_iluminacion || 40,
      color: light.properties.color || '#f59e0b',
      lat: light.geometry.coordinates[1],
      lng: light.geometry.coordinates[0]
    });
    setNotice({ type: 'info', text: `Editando foco de luz: "${light.properties.nombre}". Arrastra el icono para moverlo.` });
  };

  const handleSaveLight = () => {
    if (!lightForm.nombre.trim()) {
      setNotice({ type: 'warning', text: 'Ingresa el nombre o ubicación del foco de iluminación.' });
      return;
    }
    if (selectedId) {
      const updated = customLights.map(l => {
        if (l.properties.id === selectedId) {
          return {
            ...l,
            properties: {
              ...l.properties,
              ...lightForm
            },
            geometry: {
              type: "Point",
              coordinates: [lightForm.lng, lightForm.lat]
            }
          };
        }
        return l;
      });
      setCustomLights(updated);
      saveLiveLights(updated);
      setNotice({ type: 'success', text: 'Foco de luz actualizado en el mapa público.' });
      handleResetSelection();
    } else {
      const newFeature = {
        type: "Feature",
        properties: {
          id: `foco-custom-${Date.now()}`,
          ...lightForm
        },
        geometry: {
          type: "Point",
          coordinates: [lightForm.lng, lightForm.lat]
        }
      };
      const next = [...customLights, newFeature];
      setCustomLights(next);
      saveLiveLights(next);
      setNotice({ type: 'success', text: 'Nuevo foco de luz registrado en el mapa público.' });
      handleResetSelection();
    }
    setTimeout(() => setNotice(null), 4000);
  };

  const promptDeleteLight = (id) => {
    const l = customLights.find(item => item.properties.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'Eliminar Foco de Luz',
      message: `¿Estás seguro de que deseas eliminar el foco "${l?.properties?.nombre || 'seleccionado'}"?`,
      confirmText: 'Eliminar Foco',
      isDanger: true,
      onConfirm: () => {
        const next = customLights.filter(item => item.properties.id !== id);
        setCustomLights(next);
        saveLiveLights(next);
        handleResetSelection();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setNotice({ type: 'success', text: 'Foco de luz eliminado del mapa.' });
        setTimeout(() => setNotice(null), 3000);
      }
    });
  };

  // ============================================================
  // GEOJSON SOURCES MEMOIZADOS
  // ============================================================
  const transitGeojson = useMemo(() => ({
    type: "FeatureCollection",
    features: customTransitLines
  }), [customTransitLines]);

  const activeDrawingTransitGeojson = useMemo(() => {
    if (transitRouteGeometry) {
      return {
        type: "Feature",
        properties: { color: transitForm.color },
        geometry: transitRouteGeometry
      };
    }
    if (transitDrawingStops.length < 2) return null;
    return {
      type: "Feature",
      properties: { color: transitForm.color },
      geometry: {
        type: "LineString",
        coordinates: transitDrawingStops.map(s => [s.lng, s.lat])
      }
    };
  }, [transitRouteGeometry, transitDrawingStops, transitForm.color]);

  const routesGeojson = useMemo(() => ({
    type: "FeatureCollection",
    features: customRoutes
  }), [customRoutes]);

  const activeDrawingRouteGeojson = useMemo(() => {
    if (routeDrawingPoints.length < 2) return null;
    return {
      type: "Feature",
      properties: { color: routeForm.color },
      geometry: { type: "LineString", coordinates: routeDrawingPoints }
    };
  }, [routeDrawingPoints, routeForm.color]);

  const zonesGeojson = useMemo(() => ({
    type: "FeatureCollection",
    features: customZones
  }), [customZones]);

  const activeDrawingZoneGeojson = useMemo(() => {
    if (zoneDrawingPoints.length < 3) return null;
    return {
      type: "Feature",
      properties: { color: zoneForm.color, opacity: zoneForm.opacity },
      geometry: { type: "Polygon", coordinates: [[...zoneDrawingPoints, zoneDrawingPoints[0]]] }
    };
  }, [zoneDrawingPoints, zoneForm.color, zoneForm.opacity]);

  const lightsGeojson = useMemo(() => ({
    type: "FeatureCollection",
    features: customLights
  }), [customLights]);

  const inputClass = "w-full text-xs font-semibold px-3 py-2.5 rounded-xl bg-slate-50/90 border border-sky-100 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 text-slate-800 outline-none transition-all shadow-2xs";
  const labelClass = "block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1";

  return (
    <div className="space-y-4 sm:space-y-5 text-left w-full">
      {/* NOTIFICACIÓN TOAST / PUSH ANIMADA */}
      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between shadow-sm ${notice.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : notice.type === 'info'
                  ? 'bg-sky-50 text-sky-800 border border-sky-200'
                  : notice.type === 'warning'
                    ? 'bg-amber-50 text-amber-900 border border-amber-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
          >
            <div className="flex items-center gap-2">
              {notice.type === 'success' && <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />}
              {notice.type === 'info' && <Sparkles size={16} className="text-sky-600 shrink-0" />}
              {notice.type === 'warning' && <AlertTriangle size={16} className="text-amber-600 shrink-0" />}
              {notice.type === 'error' && <AlertTriangle size={16} className="text-rose-600 shrink-0" />}
              <span>{notice.text}</span>
            </div>
            <button
              onClick={() => setNotice(null)}
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PESTAÑAS DE EDICIÓN CON ICONOS SVG (CERO EMOJIS) */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-white/95 backdrop-blur-xl border border-sky-100 shadow-xs">
        {/* 1. Transporte Público */}
        <button
          onClick={() => { setEditorTab('transit'); handleResetSelection(); }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${editorTab === 'transit'
              ? 'bg-gradient-to-r from-sky-600 to-cyan-600 text-white shadow-md shadow-sky-500/25'
              : 'text-slate-600 hover:text-sky-700 hover:bg-sky-50/70'
            }`}
        >
          <Bus size={15} />
          <span>Transporte Público ({customTransitLines.length})</span>
        </button>

        {/* 2. Vías de Evacuación */}
        <button
          onClick={() => { setEditorTab('route'); handleResetSelection(); }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${editorTab === 'route'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/25'
              : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/70'
            }`}
        >
          <Footprints size={15} />
          <span>Vías de Evacuación ({customRoutes.length})</span>
        </button>

        {/* 3. Zonas Seguras / Peligro */}
        <button
          onClick={() => { setEditorTab('zone'); handleResetSelection(); }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${editorTab === 'zone'
              ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-500/25'
              : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50/70'
            }`}
        >
          <AlertTriangle size={15} />
          <span>Zonas Seguras & Peligro ({customZones.length})</span>
        </button>

        {/* 4. Puntos Seguros */}
        <button
          onClick={() => { setEditorTab('meetingPoint'); handleResetSelection(); }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${editorTab === 'meetingPoint'
              ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md shadow-teal-500/25'
              : 'text-slate-600 hover:text-teal-700 hover:bg-teal-50/70'
            }`}
        >
          <LifeBuoy size={15} />
          <span>Puntos Seguros ({customMeetingPoints.length})</span>
        </button>

        {/* 5. Lugares SQLite */}
        <button
          onClick={() => { setEditorTab('place'); handleResetSelection(); }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${editorTab === 'place'
              ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/25'
              : 'text-slate-600 hover:text-sky-700 hover:bg-sky-50/70'
            }`}
        >
          <MapPin size={15} />
          <span>Lugares ({places.length})</span>
        </button>

        {/* 6. Iluminación */}
        <button
          onClick={() => { setEditorTab('light'); handleResetSelection(); }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${editorTab === 'light'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25'
              : 'text-slate-600 hover:text-amber-700 hover:bg-amber-50/70'
            }`}
        >
          <SunMedium size={15} />
          <span>Iluminación ({customLights.length})</span>
        </button>
      </div>

      {/* ============================================================
          LAYOUT PRINCIPAL: FORMULARIO LATERAL + MAPA INTERACTIVO
         ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
        {/* PANEL LATERAL DE CONTROLES (CALZA EXACTO CON EL MAPA) */}
        <div className="lg:col-span-4 bg-white/95 backdrop-blur-xl rounded-3xl p-4 sm:p-5 border border-sky-100 shadow-sm space-y-4 h-[540px] lg:h-[600px] overflow-y-auto">
          {/* BANNER DINÁMICO DE ESTADO */}
          {selectedId ? (
            <div className="p-3 bg-amber-50/90 rounded-2xl border border-amber-200 flex items-center justify-between text-xs font-bold text-amber-900">
              <div className="flex items-center gap-2 truncate">
                <Edit3 size={15} className="text-amber-600 shrink-0" />
                <span className="truncate">Editando elemento seleccionado</span>
              </div>
              <button
                onClick={handleResetSelection}
                className="px-2.5 py-1 rounded-lg bg-white text-amber-800 hover:bg-amber-100 text-[11px] font-extrabold cursor-pointer shadow-xs border border-amber-200 flex items-center gap-1"
              >
                <X size={12} />
                <span>Nuevo</span>
              </button>
            </div>
          ) : (
            <div className="p-2.5 bg-sky-50/80 rounded-2xl border border-sky-100 flex items-center gap-2 text-xs text-sky-900">
              <Sparkles size={14} className="text-sky-600 shrink-0" />
              <span>
                {editorTab === 'transit'
                  ? 'Modo creación: haz clic en el mapa para colocar las paradas de la línea. Se ajustarán automáticamente a las calles.'
                  : editorTab === 'route'
                    ? 'Modo creación: haz clic en el mapa para colocar puntos consecutivos de la vía de evacuación.'
                    : editorTab === 'zone'
                      ? 'Modo creación: haz clic en el mapa para marcar los vértices de la zona.'
                      : 'Modo creación: haz clic en el mapa para posicionar el punto o marcador.'}
              </span>
            </div>
          )}

          {/* ============================================================
              TAB 1: TRANSPORTE PÚBLICO (MICROS & COLECTIVOS)
             ============================================================ */}
          {editorTab === 'transit' && (
            <div className="space-y-3.5">
              <div className="border-b border-sky-100 pb-2.5 flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Bus size={16} className="text-sky-600" />
                  <span>{selectedId ? 'Editar Línea' : 'Nueva Línea de Transporte'}</span>
                </h3>
                {isSnappingRoute && (
                  <span className="text-[10px] font-extrabold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Loader2 size={11} className="animate-spin" />
                    <span>Ajustando a calles...</span>
                  </span>
                )}
              </div>

              {/* Selector de línea existente */}
              <div>
                <label className={labelClass}>Seleccionar línea para editar:</label>
                <select
                  value={selectedId || ''}
                  onChange={(e) => {
                    const t = customTransitLines.find(item => item.properties.id === e.target.value);
                    if (t) handleSelectTransit(t);
                    else handleResetSelection();
                  }}
                  className={inputClass}
                >
                  <option value="">-- Trazar Nueva Línea --</option>
                  {customTransitLines.map(t => (
                    <option key={t.properties.id} value={t.properties.id}>
                      {t.properties.tipo === 'colectivo' ? 'Colectivo' : 'Micro'} {t.properties.numero} - {t.properties.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo de vehículo y número */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className={labelClass}>Tipo de Vehículo</label>
                  <select
                    value={transitForm.tipo}
                    onChange={e => setTransitForm({ ...transitForm, tipo: e.target.value })}
                    className={inputClass}
                  >
                    <option value="micro">Microbús Urbano</option>
                    <option value="colectivo">Taxi Colectivo</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Número / Código</label>
                  <input
                    type="text"
                    value={transitForm.numero}
                    onChange={e => setTransitForm({ ...transitForm, numero: e.target.value })}
                    placeholder="Ej: 12, 7, 1-A"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Nombre / Trayecto Principal</label>
                <input
                  type="text"
                  value={transitForm.nombre}
                  onChange={e => setTransitForm({ ...transitForm, nombre: e.target.value })}
                  placeholder="Ej: Línea 12 - Costanera Norte / Chinchorro"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className={labelClass}>Tarifa</label>
                  <input
                    type="text"
                    value={transitForm.tarifa}
                    onChange={e => setTransitForm({ ...transitForm, tarifa: e.target.value })}
                    placeholder="Ej: $500"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Horario</label>
                  <input
                    type="text"
                    value={transitForm.horario}
                    onChange={e => setTransitForm({ ...transitForm, horario: e.target.value })}
                    placeholder="06:30 - 22:30"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Frecuencia</label>
                  <input
                    type="text"
                    value={transitForm.frecuencia}
                    onChange={e => setTransitForm({ ...transitForm, frecuencia: e.target.value })}
                    placeholder="Cada 10 min"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Selector de color interactivo */}
              <div className="bg-sky-50/60 p-3 rounded-2xl border border-sky-100 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Palette size={14} className="text-sky-600" />
                    <span>Color del Recorrido:</span>
                  </label>
                  <span className="font-mono text-[11px] font-bold text-slate-700">{transitForm.color}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {COLOR_PRESETS.map(cp => (
                    <button
                      key={cp.hex}
                      type="button"
                      onClick={() => handleColorChangeTransit(cp.hex)}
                      style={{ backgroundColor: cp.hex }}
                      className={`w-6 h-6 rounded-lg transition-transform hover:scale-110 shadow-xs cursor-pointer ${transitForm.color === cp.hex ? 'ring-2 ring-sky-600 scale-110' : ''
                        }`}
                      title={cp.name}
                    />
                  ))}
                  <input
                    type="color"
                    value={transitForm.color}
                    onChange={e => handleColorChangeTransit(e.target.value)}
                    className="w-7 h-7 rounded-lg border-0 cursor-pointer p-0 bg-transparent"
                    title="Color personalizado"
                  />
                </div>
              </div>

              {/* Foto de la Línea / Micro / Colectivo (WebP + URL) */}
              <div className="bg-sky-50/60 p-3 rounded-2xl border border-sky-100 space-y-2.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Image size={14} className="text-sky-600" />
                    <span>Foto de la Línea / Vehículo</span>
                  </span>
                  <span className="text-[10px] text-emerald-600 font-extrabold uppercase">Sharp WebP</span>
                </label>

                {transitForm.foto ? (
                  <div className="relative rounded-xl overflow-hidden border border-sky-200 bg-slate-100 h-28 group">
                    <img
                      src={resolveMediaUrl(transitForm.foto)}
                      alt="Línea de Transporte"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setTransitForm(prev => ({ ...prev, foto: '' }))}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold shadow-md hover:bg-rose-700 transition-colors flex items-center gap-1"
                      >
                        <Trash2 size={13} />
                        <span>Quitar Foto</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white hover:bg-sky-50 text-sky-700 font-bold text-xs border border-dashed border-sky-300 cursor-pointer transition-colors">
                      <Upload size={14} />
                      <span>{uploadingTransitPhoto ? 'Optimizando a WebP...' : 'Subir Imagen Local (WebP)'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleTransitPhotoUpload}
                        disabled={uploadingTransitPhoto}
                        className="hidden"
                      />
                    </label>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="url"
                        value={transitPhotoUrlInput}
                        onChange={e => setTransitPhotoUrlInput(e.target.value)}
                        placeholder="O pega URL de imagen..."
                        className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:border-sky-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (transitPhotoUrlInput.trim()) {
                            setTransitForm(prev => ({ ...prev, foto: transitPhotoUrlInput.trim() }));
                            setTransitPhotoUrlInput('');
                          }
                        }}
                        disabled={!transitPhotoUrlInput.trim()}
                        className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white font-bold text-xs shrink-0"
                      >
                        OK
                      </button>
                    </div>
                  </div>
                )}
                {transitPhotoNotice && (
                  <p className="text-[10px] text-emerald-700 font-bold">{transitPhotoNotice}</p>
                )}
              </div>

              {/* Listado de paradas consecutivas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <MapPin size={14} className="text-sky-600" />
                    <span>Paradas Conectadas:</span>
                  </label>
                  <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                    {transitDrawingStops.length} paradas
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-sky-100 text-[11px] text-slate-600 space-y-1">
                  <p className="font-bold text-slate-800 flex items-center gap-1">
                    <Route size={12} className="text-sky-600" />
                    <span>Ajuste Vial Automático (OSRM)</span>
                  </p>
                  <p className="text-slate-500">
                    Haz clic en el mapa para colocar paradas. El recorrido traza automáticamente la calzada real de las calles respetando sentidos y curvas.
                  </p>
                </div>

                {transitDrawingStops.length > 0 ? (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {transitDrawingStops.map((stop, sIdx) => (
                      <div
                        key={stop.id || sIdx}
                        className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-sky-100 text-xs text-slate-700"
                      >
                        <div
                          style={{ backgroundColor: transitForm.color || '#0284c7' }}
                          className="w-5 h-5 rounded-full text-white text-[10px] font-black flex items-center justify-center shrink-0"
                        >
                          {sIdx + 1}
                        </div>
                        <input
                          type="text"
                          value={stop.nombre}
                          onChange={(e) => handleUpdateStopName(sIdx, e.target.value)}
                          className="flex-1 bg-transparent border-none text-xs font-bold text-slate-800 outline-none"
                          placeholder={`Parada ${sIdx + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteTransitStop(sIdx)}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Eliminar parada"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 border border-dashed border-sky-200 text-center text-xs text-slate-400">
                    Aún no hay paradas. Haz clic en el mapa para colocar la primera parada.
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    let center = { lng: -70.3126, lat: -18.4783 };
                    if (mapRef.current) {
                      const c = mapRef.current.getMap()?.getCenter();
                      if (c) center = { lng: parseFloat(c.lng.toFixed(6)), lat: parseFloat(c.lat.toFixed(6)) };
                    }
                    const stopIndex = transitDrawingStops.length + 1;
                    const offset = (stopIndex - 1) * 0.003;
                    const newStop = {
                      id: `stop_${Date.now()}_${stopIndex}`,
                      nombre: `Parada ${stopIndex}`,
                      lat: parseFloat((center.lat + offset).toFixed(6)),
                      lng: parseFloat((center.lng + offset).toFixed(6))
                    };
                    updateTransitStopsAndGeometry([...transitDrawingStops, newStop]);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs flex items-center justify-center gap-1.5 border border-sky-200 transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Añadir Parada en Centro del Mapa</span>
                </button>
              </div>

              {/* Acciones */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveTransit}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-sky-600/20 active:scale-98 transition-all cursor-pointer"
                >
                  <Save size={15} />
                  <span>{selectedId ? 'Guardar Cambios de Línea' : 'Guardar Recorrido Público'}</span>
                </button>

                {selectedId && (
                  <button
                    type="button"
                    onClick={() => promptDeleteTransit(selectedId)}
                    className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center border border-rose-200 cursor-pointer"
                    title="Eliminar línea"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ============================================================
              TAB 2: VÍAS DE EVACUACIÓN (LÍNEAS)
             ============================================================ */}
          {editorTab === 'route' && (
            <div className="space-y-3.5">
              <div className="border-b border-sky-100 pb-2.5">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Footprints size={16} className="text-emerald-600" />
                  <span>{selectedId ? 'Editar Vía de Evacuación' : 'Trazar Vía de Evacuación'}</span>
                </h3>
              </div>

              <div>
                <label className={labelClass}>Seleccionar vía para editar:</label>
                <select
                  value={selectedId || ''}
                  onChange={(e) => {
                    const r = customRoutes.find(item => item.properties.id === e.target.value);
                    if (r) handleSelectRoute(r);
                    else handleResetSelection();
                  }}
                  className={inputClass}
                >
                  <option value="">-- Trazar Nueva Vía --</option>
                  {customRoutes.map(r => (
                    <option key={r.properties.id} value={r.properties.id}>
                      {r.properties.nombre} ({r.properties.estado})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Nombre de la Vía</label>
                <input
                  type="text"
                  value={routeForm.nombre}
                  onChange={e => setRouteForm({ ...routeForm, nombre: e.target.value })}
                  placeholder="Ej: Evacuación Maipú hacia Cerro La Cruz"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className={labelClass}>Estado de la Vía</label>
                  <select
                    value={routeForm.estado}
                    onChange={e => {
                      const newEstado = e.target.value;
                      const defaultColor = newEstado === 'activa' ? '#10b981' : newEstado === 'bloqueada' ? '#ef4444' : '#f59e0b';
                      setRouteForm({ ...routeForm, estado: newEstado });
                      handleColorChangeRoute(defaultColor);
                    }}
                    className={inputClass}
                  >
                    <option value="activa">Activa y Habilitada</option>
                    <option value="bloqueada">Bloqueada / Obras</option>
                    <option value="en_revision">En Revisión</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Dirección / Destino</label>
                  <input
                    type="text"
                    value={routeForm.direccion}
                    onChange={e => setRouteForm({ ...routeForm, direccion: e.target.value })}
                    placeholder="Hacia cota de seguridad 30 msnm"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Selector de color */}
              <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-100 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Palette size={14} className="text-emerald-600" />
                    <span>Color del trazo:</span>
                  </label>
                  <span className="font-mono text-[11px] font-bold text-slate-700">{routeForm.color}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {COLOR_PRESETS.map(cp => (
                    <button
                      key={cp.hex}
                      type="button"
                      onClick={() => handleColorChangeRoute(cp.hex)}
                      style={{ backgroundColor: cp.hex }}
                      className={`w-6 h-6 rounded-lg transition-transform hover:scale-110 shadow-xs cursor-pointer ${routeForm.color === cp.hex ? 'ring-2 ring-emerald-600 scale-110' : ''
                        }`}
                      title={cp.name}
                    />
                  ))}
                  <input
                    type="color"
                    value={routeForm.color}
                    onChange={e => handleColorChangeRoute(e.target.value)}
                    className="w-7 h-7 rounded-lg border border-emerald-200 cursor-pointer p-0.5 bg-white"
                  />
                </div>
              </div>

              {/* Puntos conectados */}
              <div className="p-3 bg-slate-50/80 rounded-2xl border border-sky-100 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                    <CornerDownRight size={14} className="text-emerald-600" />
                    <span>Puntos conectados:</span>
                  </span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                    {selectedId ? activeSelectedRoute?.geometry?.coordinates?.length || 0 : routeDrawingPoints.length} puntos
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Haz clic en el mapa para sumar puntos. Puedes arrastrar los círculos numerados en el mapa para ajustar curvas.
                </p>
              </div>

              {/* Acciones */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveRoute}
                  disabled={!selectedId && routeDrawingPoints.length < 2}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Save size={15} />
                  <span>{selectedId ? 'Guardar Cambios en Vía' : 'Guardar Vía Conectada'}</span>
                </button>

                {selectedId && (
                  <button
                    type="button"
                    onClick={() => promptDeleteRoute(selectedId)}
                    className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center border border-rose-200 cursor-pointer"
                    title="Eliminar vía"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ============================================================
              TAB 3: ZONAS SEGURAS / PELIGRO (POLÍGONOS)
             ============================================================ */}
          {editorTab === 'zone' && (
            <div className="space-y-3.5">
              <div className="border-b border-sky-100 pb-2.5">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-rose-600" />
                  <span>{selectedId ? 'Editar Zona' : 'Trazar Zona de Riesgo / Segura'}</span>
                </h3>
              </div>

              <div>
                <label className={labelClass}>Seleccionar zona para editar:</label>
                <select
                  value={selectedId || ''}
                  onChange={(e) => {
                    const z = customZones.find(item => item.properties.id === e.target.value);
                    if (z) handleSelectZone(z);
                    else handleResetSelection();
                  }}
                  className={inputClass}
                >
                  <option value="">-- Trazar Nueva Zona --</option>
                  {customZones.map(z => (
                    <option key={z.properties.id} value={z.properties.id}>
                      {z.properties.nombre} ({z.properties.tipo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Nombre de la Zona</label>
                <input
                  type="text"
                  value={zoneForm.nombre}
                  onChange={e => setZoneForm({ ...zoneForm, nombre: e.target.value })}
                  placeholder="Ej: Zona Roja Inundación Playa El Laucho"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className={labelClass}>Tipo de Zona</label>
                  <select
                    value={zoneForm.tipo}
                    onChange={e => {
                      const newTipo = e.target.value;
                      const defaultColor = newTipo === 'peligro_tsunami' ? '#ef4444' : newTipo === 'segura' ? '#10b981' : '#f97316';
                      setZoneForm({ ...zoneForm, tipo: newTipo });
                      handleColorChangeZone(defaultColor);
                    }}
                    className={inputClass}
                  >
                    <option value="peligro_tsunami">Peligro Inundación Tsunami</option>
                    <option value="segura">Zona Segura (Cota 30+)</option>
                    <option value="alerta">Zona de Alerta / Desborde</option>
                    <option value="refugio">Refugio / Albergue Temporal</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Cota / Altitud Máxima</label>
                  <input
                    type="text"
                    value={zoneForm.cota_maxima}
                    onChange={e => setZoneForm({ ...zoneForm, cota_maxima: e.target.value })}
                    placeholder="Ej: 15 msnm"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Selector de color y opacidad */}
              <div className="bg-rose-50/60 p-3 rounded-2xl border border-rose-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Palette size={14} className="text-rose-600" />
                    <span>Color del Polígono:</span>
                  </label>
                  <span className="font-mono text-[11px] font-bold text-slate-700">{zoneForm.color}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {COLOR_PRESETS.map(cp => (
                    <button
                      key={cp.hex}
                      type="button"
                      onClick={() => handleColorChangeZone(cp.hex)}
                      style={{ backgroundColor: cp.hex }}
                      className={`w-6 h-6 rounded-lg transition-transform hover:scale-110 shadow-xs cursor-pointer ${zoneForm.color === cp.hex ? 'ring-2 ring-rose-600 scale-110' : ''
                        }`}
                      title={cp.name}
                    />
                  ))}
                  <input
                    type="color"
                    value={zoneForm.color}
                    onChange={e => handleColorChangeZone(e.target.value)}
                    className="w-7 h-7 rounded-lg border border-rose-200 cursor-pointer p-0.5 bg-white"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                    <span>Opacidad de relleno</span>
                    <span>{Math.round(zoneForm.opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="0.8"
                    step="0.05"
                    value={zoneForm.opacity}
                    onChange={e => handleOpacityChangeZone(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
                  />
                </div>
              </div>

              {/* Vértices */}
              <div className="p-3 bg-slate-50/80 rounded-2xl border border-sky-100 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                    <Move size={14} className="text-rose-600" />
                    <span>Vértices del Polígono:</span>
                  </span>
                  <span className="text-xs font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-full">
                    {selectedId ? (activeSelectedZone?.geometry?.coordinates?.[0]?.length ? activeSelectedZone.geometry.coordinates[0].length - 1 : 0) : zoneDrawingPoints.length} vértices
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Marca al menos 3 puntos en el mapa para cerrar el área. Arrastra los círculos numerados para deformar el perímetro.
                </p>
              </div>

              {/* Acciones */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveZone}
                  disabled={!selectedId && zoneDrawingPoints.length < 3}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-rose-600/20 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Save size={15} />
                  <span>{selectedId ? 'Guardar Cambios en Zona' : 'Guardar Zona Conectada'}</span>
                </button>

                {selectedId && (
                  <button
                    type="button"
                    onClick={() => promptDeleteZone(selectedId)}
                    className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center border border-rose-200 cursor-pointer"
                    title="Eliminar zona"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ============================================================
              TAB 4: PUNTOS SEGUROS
             ============================================================ */}
          {editorTab === 'meetingPoint' && (
            <div className="space-y-3.5">
              <div className="border-b border-sky-100 pb-2.5">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <LifeBuoy size={16} className="text-teal-600" />
                  <span>{selectedId ? 'Editar Punto Seguro' : 'Nuevo Punto Seguro (Cota 30+)'}</span>
                </h3>
              </div>

              <div>
                <label className={labelClass}>Seleccionar punto existente:</label>
                <select
                  value={selectedId || ''}
                  onChange={(e) => {
                    const p = customMeetingPoints.find(item => item.id === e.target.value);
                    if (p) handleSelectMeetingPoint(p);
                    else handleResetSelection();
                  }}
                  className={inputClass}
                >
                  <option value="">-- Registrar Nuevo Punto --</option>
                  {customMeetingPoints.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre} ({p.cota})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Nombre del Punto Seguro</label>
                <input
                  type="text"
                  value={meetingForm.nombre}
                  onChange={e => setMeetingForm({ ...meetingForm, nombre: e.target.value })}
                  placeholder="Ej: Explanada Cerro La Cruz, Cancha 11 de Septiembre"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className={labelClass}>Cota de Altitud</label>
                  <input
                    type="text"
                    value={meetingForm.cota}
                    onChange={e => setMeetingForm({ ...meetingForm, cota: e.target.value })}
                    placeholder="Ej: 45 msnm"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Capacidad Estimada</label>
                  <input
                    type="text"
                    value={meetingForm.capacidad}
                    onChange={e => setMeetingForm({ ...meetingForm, capacidad: e.target.value })}
                    placeholder="Ej: 3.500 personas"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Selector de color para el punto */}
              <div className="bg-teal-50/60 p-3 rounded-2xl border border-teal-100 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Palette size={14} className="text-teal-600" />
                    <span>Color del Marcador:</span>
                  </label>
                  <span className="font-mono text-[11px] font-bold text-slate-700">{meetingForm.color}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {COLOR_PRESETS.slice(0, 6).map(cp => (
                    <button
                      key={cp.hex}
                      type="button"
                      onClick={() => handleColorChangeMeeting(cp.hex)}
                      style={{ backgroundColor: cp.hex }}
                      className={`w-6 h-6 rounded-lg transition-transform hover:scale-110 shadow-xs cursor-pointer ${meetingForm.color === cp.hex ? 'ring-2 ring-teal-600 scale-110' : ''
                        }`}
                    />
                  ))}
                  <input
                    type="color"
                    value={meetingForm.color}
                    onChange={e => handleColorChangeMeeting(e.target.value)}
                    className="w-7 h-7 rounded-lg border border-teal-200 cursor-pointer p-0.5 bg-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveMeetingPoint}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-teal-600/20 active:scale-98 transition-all cursor-pointer"
                >
                  <Save size={15} />
                  <span>{selectedId ? 'Guardar Cambios' : 'Registrar Punto Seguro'}</span>
                </button>

                {selectedId && (
                  <button
                    type="button"
                    onClick={() => promptDeleteMeetingPoint(selectedId)}
                    className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center border border-rose-200 cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ============================================================
              TAB 5: LUGARES TURÍSTICOS (SQLITE)
             ============================================================ */}
          {editorTab === 'place' && (
            <form onSubmit={handleSavePlace} className="space-y-3.5">
              <div className="border-b border-sky-100 pb-2.5">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <MapPin size={16} className="text-sky-600" />
                  <span>{selectedId ? 'Editar Lugar Turístico' : 'Nuevo Lugar Turístico'}</span>
                </h3>
              </div>

              <div>
                <label className={labelClass}>Seleccionar lugar existente:</label>
                <select
                  value={selectedId || ''}
                  onChange={(e) => {
                    const p = places.find(item => item.id === e.target.value);
                    if (p) handleSelectPlace(p);
                    else handleResetSelection();
                  }}
                  className={inputClass}
                >
                  <option value="">-- Crear Nuevo Lugar --</option>
                  {places.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Nombre del Lugar</label>
                <input
                  type="text"
                  value={placeForm.name}
                  onChange={e => setPlaceForm({ ...placeForm, name: e.target.value })}
                  placeholder="Ej: Restaurante El Morro, Playa Chinchorro"
                  className={inputClass}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className={labelClass}>Categoría</label>
                  <select
                    value={placeForm.category}
                    onChange={e => setPlaceForm({ ...placeForm, category: e.target.value })}
                    className={inputClass}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Tipo</label>
                  <select
                    value={placeForm.type}
                    onChange={e => setPlaceForm({ ...placeForm, type: e.target.value })}
                    className={inputClass}
                  >
                    <option value="turismo">Turismo & Ocio</option>
                    <option value="comida">Gastronomía</option>
                    <option value="hotel">Alojamiento</option>
                    <option value="seguridad">Seguridad / Asistencia</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>Descripción Breve</label>
                <input
                  type="text"
                  value={placeForm.shortDesc}
                  onChange={e => setPlaceForm({ ...placeForm, shortDesc: e.target.value })}
                  placeholder="Breve reseña turística"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className={labelClass}>Latitud</label>
                  <input
                    type="number"
                    step="any"
                    value={placeForm.lat}
                    onChange={e => setPlaceForm({ ...placeForm, lat: parseFloat(e.target.value) })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Longitud</label>
                  <input
                    type="number"
                    step="any"
                    value={placeForm.lng}
                    onChange={e => setPlaceForm({ ...placeForm, lng: parseFloat(e.target.value) })}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Fotos del Lugar Turístico (WebP + URL) */}
              <div className="bg-sky-50/60 p-3 rounded-2xl border border-sky-100 space-y-2.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Image size={14} className="text-sky-600" />
                    <span>Fotos del Atractivo / Local</span>
                  </span>
                  <span className="text-[10px] text-emerald-600 font-extrabold uppercase">Sharp WebP</span>
                </label>

                <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white hover:bg-sky-50 text-sky-700 font-bold text-xs border border-dashed border-sky-300 cursor-pointer transition-colors">
                  <Upload size={14} />
                  <span>{uploadingPlacePhoto ? 'Optimizando imagen...' : 'Subir Foto Local (WebP)'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePlacePhotoUpload}
                    disabled={uploadingPlacePhoto}
                    className="hidden"
                  />
                </label>

                <div className="flex items-center gap-1.5">
                  <input
                    type="url"
                    value={placePhotoUrlInput}
                    onChange={e => setPlacePhotoUrlInput(e.target.value)}
                    placeholder="O pega URL directa de imagen..."
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (placePhotoUrlInput.trim()) {
                        setPlaceForm(prev => ({ ...prev, photos: [...(prev.photos || []), placePhotoUrlInput.trim()] }));
                        setPlacePhotoUrlInput('');
                      }
                    }}
                    disabled={!placePhotoUrlInput.trim()}
                    className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white font-bold text-xs shrink-0"
                  >
                    Agregar
                  </button>
                </div>

                {placePhotoNotice && (
                  <p className="text-[10px] text-emerald-700 font-bold">{placePhotoNotice}</p>
                )}

                {placeForm.photos && placeForm.photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {placeForm.photos.map((photo, pIdx) => (
                      <div key={pIdx} className="relative rounded-xl overflow-hidden bg-slate-100 h-16 group border border-slate-200">
                        <img
                          src={resolveMediaUrl(photo)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setPlaceForm(prev => ({
                            ...prev,
                            photos: prev.photos.filter((_, i) => i !== pIdx)
                          }))}
                          className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isSavingPlace}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-sky-600/20 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Save size={15} />
                  <span>{isSavingPlace ? 'Guardando en SQLite...' : selectedId ? 'Actualizar Lugar' : 'Guardar en Base de Datos'}</span>
                </button>

                {selectedId && (
                  <button
                    type="button"
                    onClick={() => promptDeletePlace(selectedId)}
                    className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center border border-rose-200 cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </form>
          )}

          {/* ============================================================
              TAB 6: FOCOS DE LUZ URBANOS
             ============================================================ */}
          {editorTab === 'light' && (
            <div className="space-y-3.5">
              <div className="border-b border-sky-100 pb-2.5">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <SunMedium size={16} className="text-amber-500" />
                  <span>{selectedId ? 'Editar Foco' : 'Nuevo Foco de Iluminación'}</span>
                </h3>
              </div>

              <div>
                <label className={labelClass}>Seleccionar foco existente:</label>
                <select
                  value={selectedId || ''}
                  onChange={(e) => {
                    const l = customLights.find(item => item.properties.id === e.target.value);
                    if (l) handleSelectLight(l);
                    else handleResetSelection();
                  }}
                  className={inputClass}
                >
                  <option value="">-- Registrar Nuevo Foco --</option>
                  {customLights.map(l => (
                    <option key={l.properties.id} value={l.properties.id}>
                      {l.properties.nombre} ({l.properties.estado})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Nombre / Ubicación del Foco</label>
                <input
                  type="text"
                  value={lightForm.nombre}
                  onChange={e => setLightForm({ ...lightForm, nombre: e.target.value })}
                  placeholder="Ej: Foco Solar Costanera El Laucho"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className={labelClass}>Estado del Foco</label>
                  <select
                    value={lightForm.estado}
                    onChange={e => setLightForm({ ...lightForm, estado: e.target.value })}
                    className={inputClass}
                  >
                    <option value="activo">Activo / Encendido</option>
                    <option value="mantenimiento">En Mantenimiento</option>
                    <option value="apagado">Apagado / Falla</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Tipo de Luminaria</label>
                  <input
                    type="text"
                    value={lightForm.tipo_lampara}
                    onChange={e => setLightForm({ ...lightForm, tipo_lampara: e.target.value })}
                    placeholder="LED Solar 150W"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveLight}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 active:scale-98 transition-all cursor-pointer"
                >
                  <Save size={15} />
                  <span>{selectedId ? 'Actualizar Foco' : 'Registrar Foco'}</span>
                </button>

                {selectedId && (
                  <button
                    type="button"
                    onClick={() => promptDeleteLight(selectedId)}
                    className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center border border-rose-200 cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ============================================================
            MAPA INTERACTIVO: LIENZO LIMPIO (MISMO TAMAÑO DEL FORMULARIO)
           ============================================================ */}
        <div className="lg:col-span-8 h-[540px] lg:h-[600px] rounded-3xl overflow-hidden border border-sky-100 shadow-md relative">
          {/* Badge informativo sobre el mapa */}
          <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-sky-100 shadow-sm text-xs font-bold text-slate-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
            <span>
              {editorTab === 'transit'
                ? 'Haz clic en el mapa para colocar paradas. El recorrido se ajusta automáticamente a las calles.'
                : editorTab === 'route'
                  ? 'Haz clic en el mapa para colocar y conectar puntos.'
                  : editorTab === 'zone'
                    ? 'Haz clic en el mapa para colocar vértices del polígono.'
                    : 'Haz clic en el mapa o arrastra el marcador.'}
            </span>
          </div>

          <Map
            ref={mapRef}
            initialViewState={{
              longitude: MAP_CONFIG.center[0],
              latitude: MAP_CONFIG.center[1],
              zoom: MAP_CONFIG.zoom,
              pitch: 20
            }}
            mapStyle={MAP_STYLES.day.style}
            style={{ width: '100%', height: '100%' }}
            interactiveLayerIds={[
              'admin-transit-line',
              'admin-transit-hitbox',
              'admin-zones-fill',
              'admin-routes-hitbox',
              'admin-lights-circle'
            ]}
            onClick={handleMapClick}
          >
            <NavigationControl position="bottom-right" />

            {/* CAPA DE TRANSPORTE PÚBLICO */}
            <Source id="admin-transit-source" type="geojson" data={transitGeojson}>
              <Layer
                id="admin-transit-hitbox"
                type="line"
                paint={{
                  'line-color': '#000000',
                  'line-opacity': 0.01,
                  'line-width': 22
                }}
              />
              <Layer
                id="admin-transit-line"
                type="line"
                layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                paint={{
                  'line-color': ['coalesce', ['get', 'color'], '#0284c7'],
                  'line-width': 6,
                  'line-opacity': 0.9
                }}
              />
            </Source>

            {/* Recorrido de transporte en trazado activo */}
            {activeDrawingTransitGeojson && (
              <Source id="admin-active-transit" type="geojson" data={activeDrawingTransitGeojson}>
                <Layer
                  id="admin-active-transit-line"
                  type="line"
                  layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                  paint={{
                    'line-color': transitForm.color || '#0284c7',
                    'line-width': 6,
                    'line-dasharray': [2, 1]
                  }}
                />
              </Source>
            )}

            {/* CAPA DE ZONAS */}
            <Source id="admin-zones-source" type="geojson" data={zonesGeojson}>
              <Layer
                id="admin-zones-fill"
                type="fill"
                paint={{
                  'fill-color': ['coalesce', ['get', 'color'], '#ef4444'],
                  'fill-opacity': ['coalesce', ['get', 'opacity'], 0.35]
                }}
              />
              <Layer
                id="admin-zones-line"
                type="line"
                paint={{
                  'line-color': ['coalesce', ['get', 'color'], '#b91c1c'],
                  'line-width': 2.5
                }}
              />
            </Source>

            {/* Polígono de Zona en trazado activo */}
            {activeDrawingZoneGeojson && (
              <Source id="admin-active-zone" type="geojson" data={activeDrawingZoneGeojson}>
                <Layer
                  id="admin-active-zone-fill"
                  type="fill"
                  paint={{
                    'fill-color': zoneForm.color,
                    'fill-opacity': zoneForm.opacity
                  }}
                />
                <Layer
                  id="admin-active-zone-line"
                  type="line"
                  paint={{
                    'line-color': zoneForm.color,
                    'line-width': 3,
                    'line-dasharray': [2, 1]
                  }}
                />
              </Source>
            )}

            {/* CAPA DE VÍAS DE EVACUACIÓN */}
            <Source id="admin-routes-source" type="geojson" data={routesGeojson}>
              <Layer
                id="admin-routes-hitbox"
                type="line"
                paint={{
                  'line-color': '#000000',
                  'line-opacity': 0.01,
                  'line-width': 20
                }}
              />
              <Layer
                id="admin-routes-line"
                type="line"
                layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                paint={{
                  'line-color': ['coalesce', ['get', 'color'], '#10b981'],
                  'line-width': 5
                }}
              />
            </Source>

            {/* Línea en trazado activo */}
            {activeDrawingRouteGeojson && (
              <Source id="admin-active-route" type="geojson" data={activeDrawingRouteGeojson}>
                <Layer
                  id="admin-active-route-line"
                  type="line"
                  layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                  paint={{
                    'line-color': routeForm.color,
                    'line-width': 5,
                    'line-dasharray': [2, 1]
                  }}
                />
              </Source>
            )}

            {/* CAPA DE FOCOS DE LUZ */}
            <Source id="admin-lights-source" type="geojson" data={lightsGeojson}>
              <Layer
                id="admin-lights-circle"
                type="circle"
                paint={{
                  'circle-radius': 6,
                  'circle-color': [
                    'match', ['get', 'estado'],
                    'activo', '#f59e0b',
                    'apagado', '#64748b',
                    'mantenimiento', '#f97316',
                    '#38bdf8'
                  ],
                  'circle-stroke-width': 2,
                  'circle-stroke-color': '#ffffff'
                }}
              />
            </Source>

            {/* PARADAS DE TRANSPORTE PÚBLICO */}
            {editorTab === 'transit' && transitDrawingStops.map((stop, sIdx) => (
              <Marker
                key={`transit-stop-${stop.id || sIdx}`}
                longitude={stop.lng}
                latitude={stop.lat}
                draggable
                onDragEnd={(e) => handleDragTransitStop(sIdx, e.lngLat.lng, e.lngLat.lat)}
              >
                <div
                  style={{ backgroundColor: transitForm.color || '#0284c7' }}
                  className="relative group px-2 py-1 rounded-full text-white text-[11px] font-black flex items-center gap-1.5 border-2 border-white shadow-lg cursor-grab active:cursor-grabbing hover:scale-110 transition-transform"
                  title={`${stop.nombre}. Arrastra para mover o haz clic en la X para borrar`}
                >
                  <Bus size={11} />
                  <span>{sIdx + 1}</span>
                  {/* Pequeña X para borrar la parada directamente en el mapa */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTransitStop(sIdx);
                    }}
                    className="w-3.5 h-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center shadow hover:scale-125 transition-all cursor-pointer"
                    title="Eliminar parada del recorrido"
                  >
                    <X size={9} strokeWidth={3} />
                  </button>
                </div>
              </Marker>
            ))}

            {/* VÉRTICES DE VÍAS */}
            {selectedId && activeSelectedRoute && activeSelectedRoute.geometry.coordinates.map((pt, idx) => (
              <Marker
                key={`selected-route-pt-${idx}`}
                longitude={pt[0]}
                latitude={pt[1]}
                draggable
                onDragEnd={(e) => handleDragRouteVertex(idx, e.lngLat.lng, e.lngLat.lat)}
              >
                <div
                  style={{ backgroundColor: routeForm.color || '#10b981' }}
                  className="relative group w-7 h-7 rounded-full text-white text-xs font-black flex items-center justify-center border-2 border-white shadow-lg cursor-grab active:cursor-grabbing hover:scale-125 transition-transform"
                  title={`Punto #${idx + 1}`}
                >
                  {idx + 1}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteRouteVertex(idx);
                    }}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center shadow border border-white hover:scale-125 transition-all cursor-pointer z-30"
                    title="Eliminar punto"
                  >
                    <X size={9} strokeWidth={3} />
                  </button>
                </div>
              </Marker>
            ))}

            {!selectedId && editorTab === 'route' && routeDrawingPoints.map((pt, idx) => (
              <Marker
                key={`draw-route-pt-${idx}`}
                longitude={pt[0]}
                latitude={pt[1]}
                draggable
                onDragEnd={(e) => handleDragRouteVertex(idx, e.lngLat.lng, e.lngLat.lat)}
              >
                <div
                  style={{ backgroundColor: routeForm.color || '#10b981' }}
                  className="relative group w-6 h-6 rounded-full text-white text-[11px] font-black flex items-center justify-center border-2 border-white shadow-md cursor-grab hover:scale-125 transition-transform"
                  title={`Punto #${idx + 1}`}
                >
                  {idx + 1}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteRouteVertex(idx);
                    }}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center shadow border border-white hover:scale-125 transition-all cursor-pointer z-30"
                    title="Eliminar punto"
                  >
                    <X size={9} strokeWidth={3} />
                  </button>
                </div>
              </Marker>
            ))}

            {/* VÉRTICES DE ZONAS */}
            {selectedId && activeSelectedZone && activeSelectedZone.geometry.coordinates[0].slice(0, -1).map((pt, idx) => (
              <Marker
                key={`selected-zone-pt-${idx}`}
                longitude={pt[0]}
                latitude={pt[1]}
                draggable
                onDragEnd={(e) => handleDragZoneVertex(idx, e.lngLat.lng, e.lngLat.lat)}
              >
                <div
                  style={{ backgroundColor: zoneForm.color || '#ef4444' }}
                  className="relative group w-7 h-7 rounded-full text-white text-xs font-black flex items-center justify-center border-2 border-white shadow-lg cursor-grab active:cursor-grabbing hover:scale-125 transition-transform"
                  title={`Vértice #${idx + 1}`}
                >
                  {idx + 1}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteZoneVertex(idx);
                    }}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center shadow border border-white hover:scale-125 transition-all cursor-pointer z-30"
                    title="Eliminar vértice"
                  >
                    <X size={9} strokeWidth={3} />
                  </button>
                </div>
              </Marker>
            ))}

            {!selectedId && editorTab === 'zone' && zoneDrawingPoints.map((pt, idx) => (
              <Marker
                key={`draw-zone-pt-${idx}`}
                longitude={pt[0]}
                latitude={pt[1]}
                draggable
                onDragEnd={(e) => handleDragZoneVertex(idx, e.lngLat.lng, e.lngLat.lat)}
              >
                <div
                  style={{ backgroundColor: zoneForm.color || '#ef4444' }}
                  className="relative group w-6 h-6 rounded-full text-white text-[11px] font-black flex items-center justify-center border-2 border-white shadow-md cursor-grab hover:scale-125 transition-transform"
                  title={`Vértice #${idx + 1}`}
                >
                  {idx + 1}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteZoneVertex(idx);
                    }}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center shadow border border-white hover:scale-125 transition-all cursor-pointer z-30"
                    title="Eliminar vértice"
                  >
                    <X size={9} strokeWidth={3} />
                  </button>
                </div>
              </Marker>
            ))}

            {/* PUNTOS DE ENCUENTRO SEGUROS */}
            {editorTab === 'meetingPoint' && (
              <Marker
                longitude={meetingForm.lng}
                latitude={meetingForm.lat}
                anchor="center"
                draggable
                onDragEnd={(e) => setMeetingForm(prev => ({
                  ...prev,
                  lng: parseFloat(e.lngLat.lng.toFixed(6)),
                  lat: parseFloat(e.lngLat.lat.toFixed(6))
                }))}
              >
                <div
                  style={{ backgroundColor: meetingForm.color }}
                  className="p-2 rounded-full text-white shadow-2xl border-2 border-white animate-bounce cursor-grab"
                  title="Arrastra para reubicar este punto seguro"
                >
                  <LifeBuoy size={22} />
                </div>
              </Marker>
            )}

            {customMeetingPoints.map(pe => {
              const isSelected = selectedId === pe.id;
              return (
                <Marker
                  key={pe.id}
                  longitude={pe.lng}
                  latitude={pe.lat}
                  anchor="center"
                  onClick={(e) => {
                    e.originalEvent.stopPropagation();
                    handleSelectMeetingPoint(pe);
                  }}
                >
                  <div
                    style={{ backgroundColor: pe.color || '#10b981' }}
                    className={`relative group p-2 rounded-full text-white shadow-md border-2 border-white cursor-pointer transition-all hover:scale-125 ${
                      isSelected ? 'ring-4 ring-amber-400 scale-125 z-30' : ''
                    }`}
                    title={`Clic para editar: ${pe.nombre} (${pe.cota})`}
                  >
                    <LifeBuoy size={16} />
                    {/* Pequeña X para borrar directamente en el mapa */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        promptDeleteMeetingPoint(pe.id);
                      }}
                      className={`absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center shadow-md border border-white hover:scale-125 transition-all cursor-pointer z-40 ${
                        isSelected ? 'opacity-100 scale-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                      title={`Eliminar ${pe.nombre}`}
                    >
                      <X size={9} strokeWidth={3} />
                    </button>
                  </div>
                </Marker>
              );
            })}

            {/* LUGARES TURÍSTICOS (SQLITE) */}
            {editorTab === 'place' && (
              <Marker
                longitude={placeForm.lng}
                latitude={placeForm.lat}
                anchor="bottom"
                draggable
                onDragEnd={(e) => setPlaceForm(prev => ({
                  ...prev,
                  lng: parseFloat(e.lngLat.lng.toFixed(6)),
                  lat: parseFloat(e.lngLat.lat.toFixed(6))
                }))}
              >
                <div className="p-2 rounded-full bg-sky-600 text-white shadow-xl border-2 border-white animate-bounce cursor-grab" title="Arrastra para posicionar">
                  <MapPin size={22} />
                </div>
              </Marker>
            )}

            {places.map(p => {
              const isSelected = selectedId === p.id;
              return (
                <Marker
                  key={p.id}
                  longitude={p.lng}
                  latitude={p.lat}
                  anchor="bottom"
                  onClick={(e) => {
                    e.originalEvent.stopPropagation();
                    handleSelectPlace(p);
                  }}
                >
                  <div
                    className={`relative group px-2.5 py-1 rounded-xl text-white text-[11px] font-bold shadow-md cursor-pointer transition-all hover:scale-110 flex items-center gap-1.5 ${
                      isSelected ? 'bg-amber-500 ring-2 ring-white scale-110 z-30' : 'bg-slate-900/85 hover:bg-sky-600'
                    }`}
                    title={`Clic para editar: ${p.name}`}
                  >
                    <MapPin size={11} />
                    <span className="max-w-[120px] truncate">{p.name}</span>
                    {/* Pequeña X para borrar directamente en el mapa */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        promptDeletePlace(p.id);
                      }}
                      className={`w-4 h-4 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center shadow hover:scale-125 transition-all cursor-pointer shrink-0 ${
                        isSelected ? 'opacity-100 scale-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                      title={`Eliminar ${p.name}`}
                    >
                      <X size={10} strokeWidth={3} />
                    </button>
                  </div>
                </Marker>
              );
            })}

            {/* FOCOS DE LUZ */}
            {editorTab === 'light' && (
              <Marker
                longitude={lightForm.lng}
                latitude={lightForm.lat}
                anchor="center"
                draggable
                onDragEnd={(e) => setLightForm(prev => ({
                  ...prev,
                  lng: parseFloat(e.lngLat.lng.toFixed(6)),
                  lat: parseFloat(e.lngLat.lat.toFixed(6))
                }))}
              >
                <div className="p-2 rounded-full bg-amber-500 text-white shadow-xl border-2 border-white animate-bounce cursor-grab">
                  <SunMedium size={22} />
                </div>
              </Marker>
            )}

            {editorTab === 'light' && customLights.map(l => {
              const coords = l.geometry?.coordinates || [-70.3126, -18.4783];
              const isSelected = selectedId === l.properties?.id;
              return (
                <Marker
                  key={l.properties?.id || `light-${coords[0]}-${coords[1]}`}
                  longitude={coords[0]}
                  latitude={coords[1]}
                  anchor="center"
                  onClick={(e) => {
                    e.originalEvent.stopPropagation();
                    handleSelectLight(l);
                  }}
                >
                  <div
                    style={{ backgroundColor: l.properties?.color || '#f59e0b' }}
                    className={`relative group p-1.5 rounded-full text-white shadow-md border-2 border-white cursor-pointer transition-all hover:scale-125 ${
                      isSelected ? 'ring-4 ring-amber-400 scale-125 z-30' : ''
                    }`}
                    title={`Foco: ${l.properties?.nombre || 'Luz urbana'}`}
                  >
                    <SunMedium size={13} />
                    {/* Pequeña X para borrar directamente en el mapa */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        promptDeleteLight(l.properties?.id);
                      }}
                      className={`absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center shadow border border-white hover:scale-125 transition-all cursor-pointer z-40 ${
                        isSelected ? 'opacity-100 scale-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                      title="Eliminar foco"
                    >
                      <X size={9} strokeWidth={3} />
                    </button>
                  </div>
                </Marker>
              );
            })}
          </Map>
        </div>
      </div>

      {/* MODAL DE CONFIRMACIÓN MODERNO (REEMPLAZA WINDOW.CONFIRM) */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-sky-100 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl ${confirmModal.isDanger ? 'bg-rose-50 text-rose-600' : 'bg-sky-50 text-sky-600'}`}>
                  <AlertTriangle size={22} />
                </div>
                <h3 className="text-base font-black text-slate-900">
                  {confirmModal.title}
                </h3>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {confirmModal.message}
              </p>

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={confirmModal.onConfirm}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-white font-bold text-xs shadow-md transition-all cursor-pointer ${confirmModal.isDanger
                      ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                      : 'bg-sky-600 hover:bg-sky-700 shadow-sky-600/20'
                    }`}
                >
                  {confirmModal.confirmText}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

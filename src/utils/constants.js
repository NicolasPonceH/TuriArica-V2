// API endpoints and app-wide constants

export const API = {
  GRAPHHOPPER: 'https://graphhopper.com/api/1/route',
  GRAPHHOPPER_KEY: import.meta.env.VITE_GRAPHHOPPER_API_KEY || '',
  MYMEMORY: 'https://api.mymemory.translated.net/get',
  MYMEMORY_EMAIL: 'turiarica@gmail.com',
};

export const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
export const API_BASE_URL = `${SERVER_URL}/api`;

export const resolveMediaUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  if (url.startsWith('/uploads')) {
    return `${SERVER_URL}${url}`;
  }
  return url;
};

export const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'turiarica2026';

export const MAP_CENTER = {
  longitude: -70.3126,
  latitude: -18.4783,
  zoom: 12.8,
  pitch: 35,
  bearing: 0,
};

export const MAP_CONFIG = {
  center: [-70.3126, -18.4783],
  zoom: 12.8,
  pitch: 35,
  bearing: 0,
  minZoom: 10,
  maxZoom: 19,
  // Límites geográficos para la comuna de Arica
  bounds: [
    [-70.4500, -18.6000], // Suroeste
    [-70.2000, -18.3500]  // Noreste
  ]
};

export const FALLBACK_LOCATION = {
  lat: -18.4783,
  lng: -70.3126,
  name: 'Plaza Colón (Centro de Arica)',
};

export const SUPPORTED_LANGUAGES = [
  { code: 'es', label: 'Español', flag: '🇨🇱' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
];

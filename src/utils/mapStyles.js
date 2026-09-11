/**
 * Estilos base para MapLibre GL JS en TuriArica
 * - Modo Día: OpenStreetMap estándar claro (100% libre, sin límites de API)
 * - Modo Noche: OpenStreetMap Dark con procesamiento de contraste oscuro (100% libre, sin API key, sin límites)
 * - Modo Emergencia: Base oscura de alto contraste para destacar vías verdes/rojas y polígonos de tsunami
 * 
 * Atribuciones legales visibles correspondientes a OpenStreetMap.
 */

export const MAP_STYLES = {
  day: {
    id: 'day',
    name: 'Modo Día (OSM Claro)',
    style: {
      version: 8,
      sources: {
        'osm-tiles': {
          type: 'raster',
          tiles: [
            'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
          ],
          tileSize: 256,
          attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
        }
      },
      layers: [
        {
          id: 'osm-tiles-layer',
          type: 'raster',
          source: 'osm-tiles',
          minzoom: 0,
          maxzoom: 19
        }
      ]
    }
  },

  // Modo Noche Libre: Utiliza OpenStreetMap procesado en MapLibre con saturación y contraste oscuro
  // Elimina la necesidad de claves privadas de CARTO y evita bloqueos o límites de solicitudes.
  night: {
    id: 'night',
    name: 'Modo Noche (Ilimitado sin API Key)',
    style: {
      version: 8,
      sources: {
        'osm-tiles-night': {
          type: 'raster',
          tiles: [
            'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
          ],
          tileSize: 256,
          attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors | Modo Nocturno'
        }
      },
      layers: [
        {
          id: 'background-dark',
          type: 'background',
          paint: {
            'background-color': '#080f1d'
          }
        },
        {
          id: 'osm-tiles-night-layer',
          type: 'raster',
          source: 'osm-tiles-night',
          minzoom: 0,
          maxzoom: 19,
          paint: {
            'raster-saturation': -0.95,
            'raster-contrast': 0.5,
            'raster-brightness-max': 0.42,
            'raster-brightness-min': 0.05
          }
        }
      ]
    }
  },

  // Modo Emergencia Libre: Fondo obsidiana de alto contraste para visibilidad de vías y zonas de tsunami
  emergency: {
    id: 'emergency',
    name: 'Modo Emergencia (Alto Contraste Ilimitado)',
    style: {
      version: 8,
      sources: {
        'osm-tiles-emergency': {
          type: 'raster',
          tiles: [
            'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
          ],
          tileSize: 256,
          attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> | Red de Emergencia'
        }
      },
      layers: [
        {
          id: 'background-emergency',
          type: 'background',
          paint: {
            'background-color': '#0a0d14'
          }
        },
        {
          id: 'osm-tiles-emergency-layer',
          type: 'raster',
          source: 'osm-tiles-emergency',
          minzoom: 0,
          maxzoom: 19,
          paint: {
            'raster-saturation': -1.0,
            'raster-contrast': 0.6,
            'raster-brightness-max': 0.35,
            'raster-brightness-min': 0.02
          }
        }
      ]
    }
  }
};

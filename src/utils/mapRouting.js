/**
 * Motor de Cálculo de Rutas OSRM y Análisis Geoespacial de Seguridad
 * - Perfiles: foot (caminar), bike (bicicleta), car (automóvil)
 * - Verificación de cruce por zonas de riesgo de inundación por tsunami
 * - Cálculo de punto de encuentro seguro más cercano
 */

import { ZONAS_RIESGO_TSUNAMI } from '../data/mapGeoData';

// Ray-casting algorithm para verificar si un punto [lng, lat] está dentro de un polígono
export function isPointInPolygon(point, polygonCoords) {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = polygonCoords.length - 1; i < polygonCoords.length; j = i++) {
    const xi = polygonCoords[i][0], yi = polygonCoords[i][1];
    const xj = polygonCoords[j][0], yj = polygonCoords[j][1];

    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Verifica si algún punto de una ruta cruza polígonos de zonas de riesgo
export function checkRouteCrossesRisk(coordinates) {
  if (!coordinates || coordinates.length === 0) return false;
  
  for (const feature of ZONAS_RIESGO_TSUNAMI.features) {
    const polygon = feature.geometry.coordinates[0];
    for (const pt of coordinates) {
      if (isPointInPolygon(pt, polygon)) {
        return {
          crosses: true,
          zoneName: feature.properties.nombre,
          cota: feature.properties.cota_maxima
        };
      }
    }
  }
  return { crosses: false };
}

// Haversine para distancias rápidas en línea recta
export function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Encuentra el Punto de Encuentro Seguro más cercano a la ubicación dada
 */
export function encontrarPuntoSeguroMasCercano(userLat, userLng, puntosEncuentro) {
  if (!puntosEncuentro || puntosEncuentro.length === 0) return null;

  let masCercano = null;
  let minDist = Infinity;

  for (const punto of puntosEncuentro) {
    const dist = haversineDistanceKm(userLat, userLng, punto.lat, punto.lng);
    if (dist < minDist) {
      minDist = dist;
      masCercano = {
        ...punto,
        distanciaKm: dist.toFixed(2),
        tiempoCaminandoMin: Math.max(1, Math.round((dist / 4.5) * 60)) // ~4.5 km/h a pie
      };
    }
  }

  return masCercano;
}

/**
 * Calcula la ruta entre dos puntos utilizando el servicio público OSRM
 * @param {[number, number]} origen [lng, lat]
 * @param {[number, number]} destino [lng, lat]
 * @param {'foot'|'bike'|'car'} perfil
 * @param {boolean} isEvacuationRoute
 */
export async function calcularRuta(origen, destino, perfil = 'foot', isEvacuationRoute = false) {
  const [lng1, lat1] = origen;
  const [lng2, lat2] = destino;

  // Mapeo de perfiles de OSRM
  const profileMap = {
    foot: 'foot',
    bike: 'bike',
    car: 'driving'
  };

  const osrmProfile = profileMap[perfil] || 'foot';
  const url = `https://router.project-osrm.org/route/v1/${osrmProfile}/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`OSRM HTTP ${response.status}`);
    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const coords = route.geometry.coordinates;
      const riskCheck = checkRouteCrossesRisk(coords);

      return {
        success: true,
        coordinates: coords,
        distanceKm: (route.distance / 1000).toFixed(2),
        timeMin: Math.max(1, Math.round(route.duration / 60)),
        perfil: perfil,
        perfilLabel: perfil === 'foot' ? 'Caminando' : perfil === 'bike' ? 'Bicicleta' : 'Automóvil',
        crossesRiskZone: riskCheck.crosses,
        riskZoneName: riskCheck.zoneName,
        etiquetaRuta: isEvacuationRoute ? 'Ruta oficial de evacuación' : 'Ruta sugerida por el sistema',
        avisoSeguridad: riskCheck.crosses
          ? `⚠️ Advertencia: Esta ruta cruza la ${riskCheck.zoneName} (Cota de inundación ${riskCheck.cota}). Prefiera vías que asciendan sobre la cota 30 msnm.`
          : null
      };
    }
    throw new Error('No se encontraron rutas');
  } catch (err) {
    // Fallback con línea recta si el servicio OSRM no responde o no hay conexión
    const dist = haversineDistanceKm(lat1, lng1, lat2, lng2);
    const speedKmH = perfil === 'foot' ? 4.5 : perfil === 'bike' ? 14 : 35;
    const coords = [[lng1, lat1], [lng2, lat2]];
    const riskCheck = checkRouteCrossesRisk(coords);

    return {
      success: true,
      coordinates: coords,
      distanceKm: dist.toFixed(2),
      timeMin: Math.max(1, Math.round((dist / speedKmH) * 60)),
      perfil: perfil,
      perfilLabel: perfil === 'foot' ? 'Caminando' : perfil === 'bike' ? 'Bicicleta' : 'Automóvil',
      crossesRiskZone: riskCheck.crosses,
      riskZoneName: riskCheck.zoneName,
      etiquetaRuta: 'Ruta sugerida por el sistema (Línea directa estimada)',
      avisoSeguridad: riskCheck.crosses
        ? `Advertencia: El trayecto estimado atraviesa una zona con riesgo de tsunami.`
        : null
    };
  }
}

/**
 * Calcula el recorrido de transporte público siguiendo la red vial de Arica (OSRM driving)
 * Respeta el sentido de las calles, curvas, rotondas y avenidas en lugar de líneas rectas.
 * @param {Array<[number, number]>} waypoints Coordenadas de paradas en orden [ [lng, lat], ... ]
 */
export async function calcularRecorridoVial(waypoints) {
  if (!waypoints || waypoints.length < 2) {
    return {
      success: false,
      coordinates: waypoints || [],
      distanceKm: '0',
      durationMin: 0,
      snappedToStreets: false
    };
  }

  const coordsString = waypoints.map(([lng, lat]) => `${lng},${lat}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6500);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`OSRM HTTP ${response.status}`);
    const data = await response.json();
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      return {
        success: true,
        coordinates: route.geometry.coordinates,
        distanceKm: (route.distance / 1000).toFixed(2),
        durationMin: Math.max(1, Math.round(route.duration / 60)),
        snappedToStreets: true
      };
    }
  } catch (err) {
    console.warn('[ROUTING] Fallback a conexión directa por OSRM offline:', err.message);
  }

  return {
    success: false,
    coordinates: waypoints,
    distanceKm: '0',
    durationMin: 0,
    snappedToStreets: false
  };
}

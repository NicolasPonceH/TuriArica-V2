// Utilidades para navegación GPS externa (Google Maps, Waze, Apple Maps)

/**
 * Genera la URL universal de Google Maps para iniciar la navegación GPS hacia un destino
 * En teléfonos móviles abre directamente la aplicación nativa de Google Maps.
 * En computadores abre Google Maps en el navegador con la ruta y cálculo de tráfico.
 * @param {number} lat - Latitud del destino
 * @param {number} lng - Longitud del destino
 * @param {string} [name] - Nombre del lugar para la etiqueta
 * @returns {string} URL de navegación
 */
export function getGoogleMapsUrl(lat, lng, name = '') {
  if (lat === undefined || lng === undefined) return '';
  const queryParam = name ? encodeURIComponent(`${name}, Arica, Chile`) : `${lat},${lng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${queryParam}`;
}

/**
 * Genera la URL universal de Waze para navegación paso a paso
 * @param {number} lat - Latitud
 * @param {number} lng - Longitud
 * @returns {string} URL de Waze
 */
export function getWazeUrl(lat, lng) {
  if (lat === undefined || lng === undefined) return '';
  return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
}

/**
 * Abre Google Maps en una nueva pestaña o lanza la app nativa en móviles
 * @param {number} lat - Latitud
 * @param {number} lng - Longitud
 * @param {string} [name] - Nombre opcional
 */
export function openGoogleMaps(lat, lng, name = '') {
  const url = getGoogleMapsUrl(lat, lng, name);
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Abre Waze en una nueva pestaña o app nativa
 * @param {number} lat - Latitud
 * @param {number} lng - Longitud
 */
export function openWaze(lat, lng) {
  const url = getWazeUrl(lat, lng);
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

// localStorage helpers for TuriArica

const STORAGE_KEYS = {
  PLACES: 'turiarica_places',
  LANGUAGE: 'turiarica_language',
  ADMIN_AUTH: 'turiarica_admin_auth',
  ADMIN_TOKEN: 'turiarica_admin_token',
  TRANSLATION_CACHE: 'turiarica_translations',
  FAVORITES: 'turiarica_favorites',
  DISMISSED_POPUP: 'turiarica_dismissed_popup',
  DELETED_PLACES: 'turiarica_deleted_places',
};

export function getStoredData(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function setStoredData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function removeStoredData(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

// Places CRUD helpers
export function getStoredPlaces() {
  return getStoredData(STORAGE_KEYS.PLACES) || [];
}

export function setStoredPlaces(places) {
  return setStoredData(STORAGE_KEYS.PLACES, places);
}

// Deleted places tracking to prevent re-appearance on refresh
export function getDeletedPlaceIds() {
  return getStoredData(STORAGE_KEYS.DELETED_PLACES) || [];
}

export function addDeletedPlaceId(id) {
  const ids = getDeletedPlaceIds();
  if (!ids.includes(id)) {
    const updated = [...ids, id];
    setStoredData(STORAGE_KEYS.DELETED_PLACES, updated);
    return updated;
  }
  return ids;
}

export function clearDeletedPlaceIds() {
  return removeStoredData(STORAGE_KEYS.DELETED_PLACES);
}

// Language
export function getStoredLanguage() {
  return getStoredData(STORAGE_KEYS.LANGUAGE) || 'es';
}

export function setStoredLanguage(lang) {
  return setStoredData(STORAGE_KEYS.LANGUAGE, lang);
}

// Translation cache
export function getCachedTranslation(text, lang) {
  const cache = getStoredData(STORAGE_KEYS.TRANSLATION_CACHE) || {};
  const key = `${lang}:${text.substring(0, 50)}`;
  return cache[key] || null;
}

export function setCachedTranslation(text, lang, translation) {
  const cache = getStoredData(STORAGE_KEYS.TRANSLATION_CACHE) || {};
  const key = `${lang}:${text.substring(0, 50)}`;
  cache[key] = translation;
  // Limit cache size
  const keys = Object.keys(cache);
  if (keys.length > 500) {
    delete cache[keys[0]];
  }
  setStoredData(STORAGE_KEYS.TRANSLATION_CACHE, cache);
}

export { STORAGE_KEYS };

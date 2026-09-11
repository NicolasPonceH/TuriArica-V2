import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { defaultPlaces } from '../data/places';
import { getStoredPlaces, setStoredPlaces, getDeletedPlaceIds, addDeletedPlaceId } from '../utils/storage';
import { getCategoryMeta } from '../data/categories';
import { API_BASE_URL } from '../utils/constants';
import { GEODATA_UPDATED_EVENT } from '../data/mapGeoData';
import { useAuth } from './AuthContext';

const PlacesContext = createContext(null);

export function PlacesProvider({ children }) {
  const [places, setPlaces] = useState(() => {
    const deleted = getDeletedPlaceIds();
    return defaultPlaces.filter(p => !deleted.includes(p.id));
  });
  const [adminPlaces, setAdminPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSyncedWithBackend, setIsSyncedWithBackend] = useState(false);
  const { token } = useAuth();

  // 1. Fetch places from backend API on mount
  const fetchPlaces = useCallback(async () => {
    const deletedIds = getDeletedPlaceIds();
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/places`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          // Filtrar lugares que hayan sido eliminados
          const activePlaces = data.filter(p => !deletedIds.includes(p.id));
          // Normalize icons and colors
          const normalized = activePlaces.map(p => {
            const meta = getCategoryMeta(p.category);
            return {
              ...p,
              icon: p.icon || meta.icon,
              color: p.color || meta.color,
              type: p.type || meta.type,
              transport: p.transport || { lineas: [], direccion: '', letrero: '', parada: '' },
              photos: p.photos || [],
              videos: p.videos || []
            };
          });
          setPlaces(normalized);
          setIsSyncedWithBackend(true);
          return;
        }
      }
    } catch (err) {
      console.warn('[PLACES] Backend no disponible, cargando desde almacenamiento local.');
    } finally {
      setLoading(false);
    }

    // Fallback: Local storage + defaultPlaces (excluyendo eliminados)
    const stored = getStoredPlaces().filter(p => !deletedIds.includes(p.id));
    const activeDefaults = defaultPlaces.filter(p => !deletedIds.includes(p.id));
    if (stored && stored.length > 0) {
      setAdminPlaces(stored);
      setPlaces([...activeDefaults, ...stored]);
    } else {
      setPlaces(activeDefaults);
    }
    setIsSyncedWithBackend(false);
  }, []);

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  // Categories derived from active places
  const categories = [...new Set(places.map(p => p.category))];

  // 2. CRUD Operations
  const addPlace = useCallback(async (placeData) => {
    const meta = getCategoryMeta(placeData.category);
    const payload = {
      ...placeData,
      icon: meta.icon,
      color: meta.color,
      type: meta.type,
      transport: placeData.transport || { lineas: [], direccion: '', letrero: '', parada: '' },
      photos: placeData.photos || [],
      videos: placeData.videos || []
    };

    // Try backend
    try {
      const res = await fetch(`${API_BASE_URL}/places`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const resData = await res.json();
        const created = resData.place;
        setPlaces(prev => [...prev, created]);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent(GEODATA_UPDATED_EVENT));
        }
        return created;
      }
    } catch (e) {
      console.warn('[PLACES] Falló guardado en backend, usando fallback local.', e);
    }

    // Local fallback
    const newId = Math.max(0, ...places.map(p => p.id)) + 1;
    const localPlace = {
      ...payload,
      id: newId,
      isDefault: false
    };

    setAdminPlaces(prev => {
      const updated = [...prev, localPlace];
      setStoredPlaces(updated);
      return updated;
    });
    setPlaces(prev => [...prev, localPlace]);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(GEODATA_UPDATED_EVENT));
    }
    return localPlace;
  }, [places, token]);

  const updatePlace = useCallback(async (id, data) => {
    const meta = getCategoryMeta(data.category);
    const payload = {
      ...data,
      icon: meta.icon,
      color: meta.color,
      type: meta.type
    };

    try {
      const res = await fetch(`${API_BASE_URL}/places/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const resData = await res.json();
        setPlaces(prev => prev.map(p => (p.id === id ? resData.place : p)));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent(GEODATA_UPDATED_EVENT));
        }
        return true;
      }
    } catch (e) {
      console.warn('[PLACES] Falló actualización en backend, usando local.', e);
    }

    // Local fallback
    setPlaces(prev => prev.map(p => (p.id === id ? { ...p, ...payload } : p)));
    setAdminPlaces(prev => {
      const updated = prev.map(p => (p.id === id ? { ...p, ...payload } : p));
      setStoredPlaces(updated);
      return updated;
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(GEODATA_UPDATED_EVENT));
    }
    return true;
  }, [token]);

  const deletePlace = useCallback(async (id) => {
    // 1. Guardar permanentemente en lista local de eliminados para que NUNCA reaparezca al recargar
    addDeletedPlaceId(id);

    // 2. Intentar eliminar en la base de datos backend SQLite
    try {
      await fetch(`${API_BASE_URL}/places/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
    } catch (e) {
      console.warn('[PLACES] Falló eliminación en backend, pero fue registrado localmente como eliminado:', e);
    }

    // 3. Remover del estado React en memoria
    setPlaces(prev => prev.filter(p => p.id !== id));
    setAdminPlaces(prev => {
      const updated = prev.filter(p => p.id !== id);
      setStoredPlaces(updated);
      return updated;
    });

    // 4. Disparar evento para actualizar contadores y capas de mapa en tiempo real
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(GEODATA_UPDATED_EVENT));
    }
    return true;
  }, [token]);

  // Search places
  const searchPlaces = useCallback((query) => {
    if (!query || query.trim() === '') return places;
    const q = query.toLowerCase().trim();
    return places.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.shortDesc && p.shortDesc.toLowerCase().includes(q)) ||
      (p.type && p.type.toLowerCase().includes(q))
    );
  }, [places]);

  const getPlacesByCategory = useCallback((category) => {
    if (!category || category === 'Todos') return places;
    return places.filter(p => p.category === category);
  }, [places]);

  const getPlacesByType = useCallback((type) => {
    if (!type || type === 'todos') return places;
    return places.filter(p => p.type === type);
  }, [places]);

  const exportData = useCallback(() => {
    return JSON.stringify(places, null, 2);
  }, [places]);

  const importData = useCallback((jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data)) {
        setPlaces(data);
        setAdminPlaces(data.filter(p => !p.isDefault));
        setStoredPlaces(data.filter(p => !p.isDefault));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  return (
    <PlacesContext.Provider value={{
      places,
      adminPlaces,
      defaultPlaces,
      categories,
      loading,
      isSyncedWithBackend,
      fetchPlaces,
      addPlace,
      updatePlace,
      deletePlace,
      searchPlaces,
      getPlacesByCategory,
      getPlacesByType,
      exportData,
      importData,
    }}>
      {children}
    </PlacesContext.Provider>
  );
}

export function usePlaces() {
  const ctx = useContext(PlacesContext);
  if (!ctx) throw new Error('usePlaces must be used within PlacesProvider');
  return ctx;
}

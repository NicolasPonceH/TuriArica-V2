// Category definitions with Lucide icons and colors
// All icons reference lucide-react components (no emojis)

export const CATEGORIES = [
  // Turismo
  { id: "Playa", label: "Playa", icon: "Umbrella", color: "#0EA5E9", type: "turismo" },
  { id: "Museo", label: "Museo", icon: "Landmark", color: "#8B5CF6", type: "turismo" },
  { id: "Histórico", label: "Histórico", icon: "Church", color: "#F59E0B", type: "turismo" },
  { id: "Naturaleza", label: "Naturaleza", icon: "TreePine", color: "#10B981", type: "turismo" },
  { id: "Paseo", label: "Paseo", icon: "ShoppingBag", color: "#EC4899", type: "turismo" },
  { id: "Deporte", label: "Deporte", icon: "Trophy", color: "#22C55E", type: "turismo" },

  // Gastronomía
  { id: "Gastronomía", label: "Gastronomía", icon: "Utensils", color: "#C2714F", type: "gastronomia" },
  { id: "Restaurante", label: "Restaurante", icon: "UtensilsCrossed", color: "#E11D48", type: "gastronomia" },
  { id: "Botillería", label: "Botillería", icon: "Wine", color: "#7C3AED", type: "gastronomia" },

  // Servicios
  { id: "Farmacia", label: "Farmacia", icon: "Pill", color: "#16A34A", type: "servicio" },
  { id: "Alojamiento", label: "Alojamiento", icon: "Hotel", color: "#0369A1", type: "servicio" },
  { id: "Bencinera", label: "Bencinera", icon: "Fuel", color: "#CA8A04", type: "servicio" },
  { id: "Cajero/Banco", label: "Cajero / Banco", icon: "Building2", color: "#0F766E", type: "servicio" },
  { id: "Supermercado", label: "Supermercado", icon: "ShoppingCart", color: "#EA580C", type: "servicio" },
  { id: "Transporte", label: "Transporte", icon: "Bus", color: "#2563EB", type: "servicio" },

  // Salud y Emergencias
  { id: "Salud", label: "Salud", icon: "Hospital", color: "#DC2626", type: "salud" },
  { id: "Hospitales", label: "Hospitales", icon: "Hospital", color: "#DC2626", type: "emergencia" },
  { id: "Centros de Salud", label: "Centros de Salud", icon: "HeartPulse", color: "#E11D48", type: "emergencia" },
  { id: "Comisarías", label: "Comisarías", icon: "ShieldAlert", color: "#1E3A8A", type: "emergencia" },
  { id: "Bomberos", label: "Bomberos", icon: "Flame", color: "#B91C1C", type: "emergencia" },
  { id: "Puntos de Encuentro", label: "Puntos de Encuentro", icon: "LifeBuoy", color: "#059669", type: "emergencia" },
  { id: "Vías de Evacuación", label: "Vías de Evacuación", icon: "Footprints", color: "#10B981", type: "emergencia" },
  { id: "Zonas de Riesgo", label: "Zonas de Riesgo Tsunami", icon: "AlertTriangle", color: "#EF4444", type: "emergencia" },

  // Alumbrado e Iluminación
  { id: "Focos de Luz", label: "Focos de Luz", icon: "SunMedium", color: "#F59E0B", type: "iluminacion" },
  { id: "Zonas Iluminadas", label: "Zonas Iluminadas", icon: "Sparkles", color: "#FBBF24", type: "iluminacion" },
];

export const CATEGORY_TYPES = [
  { id: "todos", label: "Todos", icon: "MapPin" },
  { id: "turismo", label: "Turismo", icon: "Camera" },
  { id: "gastronomia", label: "Gastronomía", icon: "Utensils" },
  { id: "servicio", label: "Servicios", icon: "Building2" },
  { id: "salud", label: "Salud", icon: "Heart" },
  { id: "emergencia", label: "Emergencia / Evacuación", icon: "ShieldAlert" },
  { id: "iluminacion", label: "Alumbrado Público", icon: "SunMedium" },
];

/**
 * Get category metadata by ID
 */
export function getCategoryMeta(categoryId) {
  return CATEGORIES.find(c => c.id === categoryId) || {
    id: categoryId,
    label: categoryId,
    icon: "MapPin",
    color: "#6B7280",
    type: "turismo",
  };
}

/**
 * Get all category IDs
 */
export function getAllCategoryIds() {
  return CATEGORIES.map(c => c.id);
}

/**
 * Get categories filtered by type
 */
export function getCategoriesByType(type) {
  if (type === 'todos') return CATEGORIES;
  return CATEGORIES.filter(c => c.type === type);
}

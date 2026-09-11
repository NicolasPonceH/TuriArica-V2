import { Sun, Sunset, Cloud, CloudSun, Moon } from 'lucide-react';

/**
 * Escala estándar de Índice UV (OMS / RedMeteo)
 * 0 - 2: Bajo (Verde)
 * 3 - 5: Moderado (Ámbar)
 * 6 - 7: Alto (Naranja)
 * 8 - 10: Muy Alto (Rojo)
 * 11+: Extremo (Púrpura)
 */
export function getUvDetails(uv) {
  const num = Math.round(Number(uv) || 0);
  if (num <= 2) {
    return {
      value: num,
      level: 'Bajo',
      colorText: 'text-emerald-300',
      badgeBg: 'bg-emerald-500/25 border-emerald-400/40 text-emerald-200',
      dotColor: 'bg-emerald-400',
      recommendation: 'Exposición segura sin riesgo significativo'
    };
  }
  if (num <= 5) {
    return {
      value: num,
      level: 'Moderado',
      colorText: 'text-amber-300',
      badgeBg: 'bg-amber-500/25 border-amber-400/40 text-amber-200',
      dotColor: 'bg-amber-400',
      recommendation: 'Uso de sombrero, gafas y protector SPF 30+'
    };
  }
  if (num <= 7) {
    return {
      value: num,
      level: 'Alto',
      colorText: 'text-orange-300',
      badgeBg: 'bg-orange-500/25 border-orange-400/40 text-orange-200',
      dotColor: 'bg-orange-400',
      recommendation: 'Buscar sombra al mediodía y protector SPF 50+'
    };
  }
  if (num <= 10) {
    return {
      value: num,
      level: 'Muy Alto',
      colorText: 'text-rose-300',
      badgeBg: 'bg-rose-500/25 border-rose-400/40 text-rose-200',
      dotColor: 'bg-rose-400',
      recommendation: 'Evitar sol directo entre 11:00 y 16:00 hrs'
    };
  }
  return {
    value: num,
    level: 'Extremo',
    colorText: 'text-purple-300',
    badgeBg: 'bg-purple-500/25 border-purple-400/40 text-purple-200',
    dotColor: 'bg-purple-400',
    recommendation: '¡Peligro extremo de radiación! Protección máxima'
  };
}

export function getWeatherVisuals(type) {
  switch (type) {
    case 'sunset':
      return {
        Icon: Sunset,
        label: 'Atardecer',
        accentColor: 'text-orange-400'
      };
    case 'cloudy':
      return {
        Icon: Cloud,
        label: 'Nublado',
        accentColor: 'text-slate-300'
      };
    case 'partlyCloudy':
      return {
        Icon: CloudSun,
        label: 'Parcial',
        accentColor: 'text-sky-300'
      };
    case 'night':
      return {
        Icon: Moon,
        label: 'Noche',
        accentColor: 'text-indigo-300'
      };
    case 'clear':
    default:
      return {
        Icon: Sun,
        label: 'Soleado',
        accentColor: 'text-amber-400'
      };
  }
}

export const BEACH_MARITIME_DATA = {
  'playa el laucho': {
    status: 'Apta para Baño',
    flag: 'green',
    flagLabel: 'Bandera Verde · Apta para Baño',
    waves: '0.5 m',
    waterTemp: '19°C',
    type: 'Familiar & Natación',
    desc: 'Piscina natural de aguas calmas con rampas de accesibilidad universal'
  },
  'playa chinchorro': {
    status: 'Apta para Baño',
    flag: 'green',
    flagLabel: 'Bandera Verde · Apta para Baño',
    waves: '0.8 m',
    waterTemp: '20°C',
    type: 'Aguas Cálidas & Costanera',
    desc: 'Oleaje moderado y variada gastronomía frente al mar'
  },
  'playa las machas': {
    status: 'No Apta para Baño',
    flag: 'red',
    flagLabel: 'Bandera Roja · Peligro Marejadas',
    waves: '1.6 m',
    waterTemp: '18°C',
    type: 'Surf & Bodyboard',
    desc: 'Corrientes oceánicas y paraíso para surfistas locales'
  },
  'ex isla alacrán': {
    status: 'Solo Surfistas Expertos',
    flag: 'black',
    flagLabel: 'Bandera Negra · Expertos WSL',
    waves: '2.2 m',
    waterTemp: '17°C',
    type: 'Ola Tubular WSL',
    desc: 'Olas tubulares de nivel mundial (El Gringo)'
  },
  'el gringo': {
    status: 'Solo Surfistas Expertos',
    flag: 'black',
    flagLabel: 'Bandera Negra · Expertos WSL',
    waves: '2.2 m',
    waterTemp: '17°C',
    type: 'Ola Tubular WSL',
    desc: 'Olas tubulares de nivel mundial (El Gringo)'
  }
};

export function getBeachInfo(place) {
  if (!place) return null;
  if (place.beachInfo) return place.beachInfo;
  const name = (place.name || '').toLowerCase();
  for (const [key, data] of Object.entries(BEACH_MARITIME_DATA)) {
    if (name.includes(key)) {
      return data;
    }
  }
  if (place.category === 'Playa') {
    return {
      status: 'Apta con Precaución',
      flag: 'green',
      flagLabel: 'Bandera Verde · Monitoreo Costero',
      waves: '0.8 m',
      waterTemp: '19°C',
      type: 'Costa del Pacífico',
      desc: 'Balneario natural de la bahía de Arica'
    };
  }
  return null;
}

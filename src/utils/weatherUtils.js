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
      badgeBg: 'bg-emerald-400 text-slate-950 font-black shadow-xs',
      dotColor: 'bg-slate-950',
      recommendation: 'Exposición segura'
    };
  }
  if (num <= 5) {
    return {
      value: num,
      level: 'Moderado',
      badgeBg: 'bg-amber-400 text-slate-950 font-black shadow-xs',
      dotColor: 'bg-slate-950',
      recommendation: 'Usar bloqueador solar'
    };
  }
  if (num <= 7) {
    return {
      value: num,
      level: 'Alto',
      badgeBg: 'bg-orange-500 text-white font-black shadow-xs',
      dotColor: 'bg-white',
      recommendation: 'Buscar sombra y protector 50+'
    };
  }
  if (num <= 10) {
    return {
      value: num,
      level: 'Muy Alto',
      badgeBg: 'bg-red-600 text-white font-black shadow-xs',
      dotColor: 'bg-white',
      recommendation: 'Evitar sol directo'
    };
  }
  return {
    value: num,
    level: 'Extremo',
    badgeBg: 'bg-purple-600 text-white font-black shadow-xs',
    dotColor: 'bg-white',
    recommendation: '¡Radiación extrema!'
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

import { useState, useEffect } from 'react';
import { Waves, Sun, Cloud, CloudSun, Sunset, Moon, ShieldAlert, Wind, ChevronRight, Droplets, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BEACHES = [
  {
    name: 'Playa El Laucho',
    status: 'Apta para Baño',
    flag: 'green',
    waves: '0.5 m',
    temp: '19°C',
    type: 'Familiar & Natación',
    desc: 'Piscina natural de aguas calmas y templadas con rampas de accesibilidad universal.'
  },
  {
    name: 'Playa Chinchorro',
    status: 'Apta para Baño',
    flag: 'green',
    waves: '0.8 m',
    temp: '20°C',
    type: 'Aguas Cálidas',
    desc: 'Extensa costanera con oleaje moderado y variada gastronomía frente al mar.'
  },
  {
    name: 'Playa Las Machas',
    status: 'No Apta para Baño',
    flag: 'red',
    waves: '1.6 m',
    temp: '18°C',
    type: 'Surf & Bodyboard',
    desc: 'Corrientes oceánicas fuertes, arena oscura y el paraíso para surfistas locales.'
  },
  {
    name: 'Ex Isla Alacrán (El Gringo)',
    status: 'Solo Surfistas Expertos',
    flag: 'black',
    waves: '2.2 m',
    temp: '17°C',
    type: 'Ola Tubular de Nivel Mundial',
    desc: 'Fondo rocoso con olas tubulares peligrosas que albergan campeonatos mundiales WSL.'
  }
];

function getWeatherVisuals(type) {
  switch (type) {
    case 'sunset':
      return {
        Icon: Sunset,
        iconBg: 'bg-orange-100 text-orange-600',
        badgeBg: 'bg-orange-100 text-orange-800 border-orange-200',
        pillLabel: 'Atardecer'
      };
    case 'cloudy':
      return {
        Icon: Cloud,
        iconBg: 'bg-slate-200 text-slate-700',
        badgeBg: 'bg-slate-100 text-slate-700 border-slate-300',
        pillLabel: 'Nublado'
      };
    case 'partlyCloudy':
      return {
        Icon: CloudSun,
        iconBg: 'bg-sky-100 text-sky-600',
        badgeBg: 'bg-sky-100 text-sky-800 border-sky-200',
        pillLabel: 'Parcial'
      };
    case 'night':
      return {
        Icon: Moon,
        iconBg: 'bg-indigo-100 text-indigo-600',
        badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        pillLabel: 'Noche'
      };
    case 'clear':
    default:
      return {
        Icon: Sun,
        iconBg: 'bg-amber-100 text-amber-600',
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
        pillLabel: 'Soleado'
      };
  }
}

export default function CoastalSurfWidget({
  onSelectBeach,
  weatherData: externalWeather,
  activeCondition = 'clear',
  previewCondition = null,
  onSetPreviewCondition
}) {
  const [selectedBeach, setSelectedBeach] = useState(0);

  // Datos meteorológicos en tiempo real (Estación Capitanía de Puerto RMCL0114 - RedMeteo 3.0)
  const [internalWeather, setInternalWeather] = useState({
    temp: 20.6,
    condition: 'Soleado',
    conditionType: 'clear',
    conditionDesc: 'Sol radiante de Eterna Primavera',
    humidity: 79,
    windSpeedKmH: 14.6,
    windDirection: 'SSE',
    uvIndex: 1,
    stationName: 'Arica - Capitanía de Puerto (SERVIMET)',
    lastUpdate: 'En vivo'
  });

  useEffect(() => {
    if (externalWeather) return;

    fetch('http://localhost:5000/api/weather/live')
      .then(res => res.json())
      .then(data => {
        if (data && data.current) {
          setInternalWeather({
            temp: data.current.temp,
            condition: data.current.condition || 'Soleado',
            conditionType: data.current.conditionType || 'clear',
            conditionDesc: data.current.conditionDesc || 'Sol costero',
            humidity: data.current.humidity,
            windSpeedKmH: data.current.windSpeedKmH,
            windDirection: data.current.windDirection,
            uvIndex: data.current.uvIndex,
            stationName: data.station?.name || 'Arica - Capitanía de Puerto',
            lastUpdate: data.station?.lastUpdate
              ? new Date(data.station.lastUpdate).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
              : 'En vivo'
          });
        }
      })
      .catch(() => {});
  }, [externalWeather]);

  const activeWeather = externalWeather || internalWeather;
  const visuals = getWeatherVisuals(activeCondition || activeWeather.conditionType);

  const getFlagBadge = (flag) => {
    switch (flag) {
      case 'green':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Bandera Verde · Apta para Baño</span>
          </span>
        );
      case 'red':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-red-100 text-red-800 border border-red-300 flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>Bandera Roja · Peligro de Marejadas</span>
          </span>
        );
      case 'black':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Solo Surfistas Experimentados</span>
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5 shadow-2xs">
            <span>Precaución</span>
          </span>
        );
    }
  };

  const current = BEACHES[selectedBeach];

  const handleViewOnMap = () => {
    if (onSelectBeach) {
      onSelectBeach(current.name);
    } else {
      document.getElementById('mapa')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-xl border border-white/80 text-slate-800 relative overflow-hidden backdrop-blur-xl">
      {/* Header bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-brand-600 text-xs font-black uppercase tracking-wider mb-1">
            <Waves size={16} />
            <span>Condición Costera y Marítima en Tiempo Real</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Playas, Mareas y Surf en Arica
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {activeWeather.conditionDesc || 'Monitoreo de la bahía en tiempo real con datos de Capitanía de Puerto'}
          </p>
        </div>

        {/* Unified, Simple Horizontal Weather Capsule */}
        <div className="flex flex-col gap-2 shrink-0">
          <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl glass-panel shadow-xs text-slate-800">
            {/* Weather Icon Badge */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${visuals.iconBg}`}>
              <visuals.Icon size={22} />
            </div>

            {/* Main Temp & Condition */}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black text-slate-900 leading-none">
                  {activeWeather.temp}°C
                </span>
                <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${visuals.badgeBg}`}>
                  {activeWeather.condition || visuals.pillLabel}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="truncate">Capitanía de Puerto (RedMeteo)</span>
              </div>
            </div>

            {/* Vertical separator */}
            <div className="hidden sm:block h-8 w-px bg-slate-200 mx-1" />

            {/* Compact Inline Secondary Metrics */}
            <div className="hidden sm:flex items-center gap-3 text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1" title="Viento en la bahía">
                <Wind size={14} className="text-sky-500 shrink-0" />
                <span>{activeWeather.windSpeedKmH} km/h {activeWeather.windDirection}</span>
              </span>
              <span className="text-slate-300">·</span>
              <span className="flex items-center gap-1" title="Índice UV">
                <ShieldAlert size={14} className="text-orange-500 shrink-0" />
                <span>UV {activeWeather.uvIndex}</span>
              </span>
              <span className="text-slate-300">·</span>
              <span className="flex items-center gap-1" title="Humedad relativa">
                <Droplets size={14} className="text-blue-500 shrink-0" />
                <span>{activeWeather.humidity}%</span>
              </span>
            </div>
          </div>

          {/* Mobile secondary row */}
          <div className="flex sm:hidden items-center justify-between text-xs font-semibold text-slate-600 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200/70">
            <span className="flex items-center gap-1">
              <Wind size={13} className="text-sky-500" />
              {activeWeather.windSpeedKmH} km/h {activeWeather.windDirection}
            </span>
            <span className="text-slate-300">·</span>
            <span className="flex items-center gap-1">
              <ShieldAlert size={13} className="text-orange-500" />
              UV {activeWeather.uvIndex}
            </span>
            <span className="text-slate-300">·</span>
            <span className="flex items-center gap-1">
              <Droplets size={13} className="text-blue-500" />
              {activeWeather.humidity}%
            </span>
          </div>
        </div>
      </div>

      {/* Atmospheric Environment Control: Allows user to see how the website background changes with the city's climate */}
      {onSetPreviewCondition && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 pb-1 text-xs border-b border-slate-100 mb-2">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <Sparkles size={13} className="text-amber-500" />
            <span>Fondo ambiental de la ciudad:</span>
            <strong className="text-slate-800 font-bold">
              {!previewCondition
                ? `🔴 Tiempo real (${activeWeather.condition})`
                : (previewCondition === 'clear' ? '☀️ Soleado' : previewCondition === 'cloudy' ? '☁️ Nublado' : previewCondition === 'sunset' ? '🌅 Atardecer' : '🌙 Noche')}
            </strong>
          </div>

          <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80">
            <button
              onClick={() => onSetPreviewCondition(null)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold btn-tactile cursor-pointer ${
                !previewCondition ? 'bg-white text-brand-600 shadow-xs scale-[1.02]' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Volver a la observación en tiempo real de RedMeteo"
            >
              🔴 En vivo
            </button>
            <button
              onClick={() => onSetPreviewCondition('clear')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold btn-tactile cursor-pointer ${
                previewCondition === 'clear' ? 'bg-white text-amber-600 shadow-xs scale-[1.02]' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ☀️ Soleado
            </button>
            <button
              onClick={() => onSetPreviewCondition('cloudy')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold btn-tactile cursor-pointer ${
                previewCondition === 'cloudy' ? 'bg-white text-slate-700 shadow-xs scale-[1.02]' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ☁️ Nublado
            </button>
            <button
              onClick={() => onSetPreviewCondition('sunset')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold btn-tactile cursor-pointer ${
                previewCondition === 'sunset' ? 'bg-white text-orange-600 shadow-xs scale-[1.02]' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🌅 Atardecer
            </button>
            <button
              onClick={() => onSetPreviewCondition('night')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold btn-tactile cursor-pointer ${
                previewCondition === 'night' ? 'bg-white text-indigo-600 shadow-xs scale-[1.02]' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🌙 Noche
            </button>
          </div>
        </div>
      )}

      {/* Beach Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-6">
        {BEACHES.map((b, idx) => {
          const isSelected = selectedBeach === idx;
          return (
            <button
              key={b.name}
              onClick={() => setSelectedBeach(idx)}
              className={`text-left p-4 rounded-2xl btn-tactile border cursor-pointer ${
                isSelected
                  ? 'bg-brand-500 text-white border-brand-500 shadow-lg shadow-brand-500/25 scale-[1.02]'
                  : 'bg-slate-50 hover:bg-slate-100/80 text-slate-700 border-slate-200/70 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-black truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                  {b.name}
                </span>
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${b.flag === 'green' ? (isSelected ? 'bg-white' : 'bg-emerald-500') : b.flag === 'red' ? 'bg-red-500' : 'bg-amber-500'}`} />
              </div>
              <p className={`text-[11px] font-semibold truncate ${isSelected ? 'text-white/90' : 'text-slate-500'}`}>
                {b.type}
              </p>
            </button>
          );
        })}
      </div>

      {/* Selected Beach Details Card */}
      <div className="mt-5 glass-panel rounded-2xl p-5 sm:p-6 border border-white/70 flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-sm">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-3 flex-wrap">
            <h4 className="text-xl font-black text-slate-900">{current.name}</h4>
            {getFlagBadge(current.flag)}
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            {current.desc}
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0 border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-6">
          <div className="text-center px-2">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-black">Oleaje</span>
            <span className="text-2xl font-black text-brand-600">{current.waves}</span>
          </div>
          <div className="text-center px-2">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-black">Agua</span>
            <span className="text-2xl font-black text-emerald-600">{current.temp}</span>
          </div>
          <button
            onClick={handleViewOnMap}
            className="px-5 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-black shadow-md shadow-brand-500/20 flex items-center gap-1.5 btn-tactile hover:scale-[1.03] active:scale-[0.97] shrink-0 cursor-pointer"
          >
            <span>Ver en Mapa</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

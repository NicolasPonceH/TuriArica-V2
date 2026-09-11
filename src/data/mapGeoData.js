/**
 * Datos GeoJSON y Capas Especiales para TuriArica
 * - Focos de luz (activos, apagados, mantenimiento, desconocido)
 * - Zonas iluminadas (polígonos de iluminación urbana)
 * - Vías de evacuación ante tsunami
 * - Puntos de encuentro oficiales / de apoyo
 * - Zonas de riesgo de inundación por tsunami (DEMOSTRACIÓN)
 * - Servicios de emergencia (Hospitales, Bomberos, Comisarías, Farmacias)
 * 
 * NOTA LEGAL OBLIGATORIA:
 * Los datos de riesgo, vías y focos son de carácter ilustrativo y demostrativo.
 * Para situaciones de emergencia real, siga siempre las instrucciones oficiales de
 * SENAPRED, SHOA, la Municipalidad de Arica, Carabineros y las sirenas de evacuación.
 */

export const DEMO_TAG = "DATOS DE DEMOSTRACIÓN — REEMPLAZAR POR DATOS OFICIALES";

// 1. Zonas de Riesgo / Inundación por Tsunami (Cota de seguridad ~30 msnm aproximada costera)
export const ZONAS_RIESGO_TSUNAMI = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        id: "riesgo-costa-chinchorro",
        nombre: "Zona Costera Chinchorro - Las Machas",
        nivel_peligro: "Alto",
        descripcion: "Zona baja costera expuesta a inundación rápida en caso de tsunami mayor.",
        cota_maxima: "15 msnm",
        fuente: "SHOA / SENAPRED (Adaptación de referencia)",
        fecha_actualizacion: "2026-03-01",
        aviso: DEMO_TAG
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-70.3250, -18.4350],
            [-70.3080, -18.4350],
            [-70.3090, -18.4600],
            [-70.3220, -18.4620],
            [-70.3290, -18.4480],
            [-70.3250, -18.4350]
          ]
        ]
      }
    },
    {
      type: "Feature",
      properties: {
        id: "riesgo-puerto-centro",
        nombre: "Borde Costero Puerto y Centro Cívico",
        nivel_peligro: "Extremo",
        descripcion: "Sector portuario y costanera central por debajo de cota 30 metros.",
        cota_maxima: "10 msnm",
        fuente: "SHOA / SENAPRED (Adaptación de referencia)",
        fecha_actualizacion: "2026-03-01",
        aviso: DEMO_TAG
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-70.3320, -18.4680],
            [-70.3200, -18.4690],
            [-70.3180, -18.4840],
            [-70.3280, -18.4870],
            [-70.3340, -18.4750],
            [-70.3320, -18.4680]
          ]
        ]
      }
    },
    {
      type: "Feature",
      properties: {
        id: "riesgo-la-lisera-arenillas",
        nombre: "Sector Playas La Lisera y El Laucho",
        nivel_peligro: "Alto",
        descripcion: "Balnearios y costanera sur en zona de inundación directa.",
        cota_maxima: "12 msnm",
        fuente: "SHOA / SENAPRED (Adaptación de referencia)",
        fecha_actualizacion: "2026-03-01",
        aviso: DEMO_TAG
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-70.3320, -18.4900],
            [-70.3240, -18.4910],
            [-70.3230, -18.5120],
            [-70.3330, -18.5120],
            [-70.3340, -18.5000],
            [-70.3320, -18.4900]
          ]
        ]
      }
    }
  ]
};

// 2. Vías de Evacuación ante Tsunami
export const VIAS_EVACUACION = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        id: "via-01-general-velasquez",
        nombre: "Vía de Evacuación Av. General Velásquez",
        oficial: true,
        direccion: "Hacia Cota 30 msnm (Cerro La Cruz)",
        estado: "activa", // activa (verde), bloqueada (rojo), en_revision (amarillo)
        fuente: "Dirección de Tránsito Municipal / SENAPRED",
        fecha_actualizacion: "2026-02-15"
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [-70.3210, -18.4780],
          [-70.3150, -18.4770],
          [-70.3080, -18.4760],
          [-70.3010, -18.4750]
        ]
      }
    },
    {
      type: "Feature",
      properties: {
        id: "via-02-diego-portales",
        nombre: "Vía de Evacuación Av. Diego Portales",
        oficial: true,
        direccion: "Desde Playa Chinchorro hacia Rotonda Tucapel",
        estado: "activa",
        fuente: "Dirección de Tránsito Municipal / SENAPRED",
        fecha_actualizacion: "2026-02-15"
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [-70.3140, -18.4620],
          [-70.3050, -18.4650],
          [-70.2980, -18.4680],
          [-70.2900, -18.4700]
        ]
      }
    },
    {
      type: "Feature",
      properties: {
        id: "via-03-san-marcos-morro",
        nombre: "Subida al Morro por Calle Sotomayor",
        oficial: true,
        direccion: "Hacia Explanada del Morro (Cota de Seguridad)",
        estado: "activa",
        fuente: "SENAPRED Arica",
        fecha_actualizacion: "2026-01-20"
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [-70.3200, -18.4790],
          [-70.3220, -18.4810],
          [-70.3235, -18.4830],
          [-70.3248, -18.4855]
        ]
      }
    },
    {
      type: "Feature",
      properties: {
        id: "via-04-costanera-norte-obras",
        nombre: "Paso Peatonal Raúl Pey",
        oficial: false,
        direccion: "Hacia Av. Antártica",
        estado: "en_revision", // amarillo
        fuente: "MOP Obras Portuarias (Trabajos de mantención)",
        fecha_actualizacion: "2026-02-28"
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [-70.3180, -18.4500],
          [-70.3130, -18.4510],
          [-70.3080, -18.4520]
        ]
      }
    },
    {
      type: "Feature",
      properties: {
        id: "via-05-antartica-temporal",
        nombre: "Acceso Muelle Prat",
        oficial: false,
        direccion: "Zona Portuaria Sur",
        estado: "bloqueada", // rojo
        fuente: "Capitanía de Puerto Arica",
        fecha_actualizacion: "2026-03-05"
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [-70.3260, -18.4740],
          [-70.3240, -18.4750]
        ]
      }
    }
  ]
};

// 3. Puntos de Encuentro Oficiales (Zonas Seguras sobre Cota 30 msnm)
export const PUNTOS_ENCUENTRO = [
  {
    id: "pe-01-morro",
    nombre: "Punto Seguro Cima del Morro de Arica",
    lat: -18.4862,
    lng: -70.3255,
    cota: "139 msnm",
    oficial: true,
    capacidad: "5.000 personas",
    descripcion: "Cima del Morro histórica, punto de máxima seguridad con helipuerto y amplias explanadas.",
    direccion: "Camino al Morro s/n",
    fuente: "Municipalidad de Arica / SENAPRED",
    fecha_actualizacion: "2026-01-15"
  },
  {
    id: "pe-02-estadio-carlos-dittborn",
    nombre: "Estadio Carlos Dittborn (Zona Alta)",
    lat: -18.4735,
    lng: -70.2980,
    cota: "45 msnm",
    oficial: true,
    capacidad: "12.000 personas",
    descripcion: "Complejo deportivo municipal, punto seguro de reunión y albergue primario.",
    direccion: "Av. 18 de Septiembre 2000",
    fuente: "SENAPRED / DIDECO",
    fecha_actualizacion: "2026-01-15"
  },
  {
    id: "pe-03-rotonda-azapa",
    nombre: "Rotonda Manuel Castillo (Acceso Azapa)",
    lat: -18.4880,
    lng: -70.2920,
    cota: "55 msnm",
    oficial: true,
    capacidad: "3.500 personas",
    descripcion: "Punto de encuentro alto con conexión abierta hacia el Valle de Azapa.",
    direccion: "Av. Diego Portales con Azapa",
    fuente: "SENAPRED Región de Arica y Parinacota",
    fecha_actualizacion: "2026-02-01"
  },
  {
    id: "pe-04-parque-vicuna-mackenna-alto",
    nombre: "Cerro La Cruz (Plaza Mirador)",
    lat: -18.4815,
    lng: -70.3120,
    cota: "40 msnm",
    oficial: true,
    capacidad: "2.000 personas",
    descripcion: "Zona segura elevada a 5 minutos a pie desde el centro histórico.",
    direccion: "Mirador Cerro La Cruz",
    fuente: "Plan Comunal de Evacuación",
    fecha_actualizacion: "2026-02-01"
  },
  {
    id: "pe-05-villa-frontera",
    nombre: "Punto de Encuentro Villa Frontera (Norte)",
    lat: -18.4200,
    lng: -70.3050,
    cota: "35 msnm",
    oficial: true,
    capacidad: "1.500 personas",
    descripcion: "Zona segura para pobladores y turistas del sector norte y desembocadura Lluta.",
    direccion: "Ruta 5 Norte km 2070",
    fuente: "SENAPRED Arica",
    fecha_actualizacion: "2026-02-10"
  }
];

// 4. Red de Alumbrado Público y Focos de Luz
// Intensidades: 1 (baja/peatonal), 2 (media/avenida), 3 (alta/foco LED masivo)
export const FOCOS_DE_LUZ = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        id: "foco-01",
        nombre: "Luminaria LED Paseo 21 de Mayo",
        estado: "activo", // activo, apagado, mantenimiento, desconocido
        intensidad: 3,
        tipo_lampara: "LED Solar 150W",
        radio_iluminacion: 45, // metros aproximados
        ultima_revision: "2026-02-20",
        fuente: "Dpto. Alumbrado Municipalidad de Arica",
        fecha_actualizacion: "2026-03-01"
      },
      geometry: { type: "Point", coordinates: [-70.3195, -18.4778] }
    },
    {
      type: "Feature",
      properties: {
        id: "foco-02",
        nombre: "Torre de Iluminación Plaza Colón",
        estado: "activo",
        intensidad: 3,
        tipo_lampara: "Reflector Haluro 400W",
        radio_iluminacion: 60,
        ultima_revision: "2026-02-25",
        fuente: "Dpto. Alumbrado Municipalidad de Arica",
        fecha_actualizacion: "2026-03-01"
      },
      geometry: { type: "Point", coordinates: [-70.3205, -18.4792] }
    },
    {
      type: "Feature",
      properties: {
        id: "foco-03",
        nombre: "Poste Peatonal Parque Vicuña Mackenna",
        estado: "activo",
        intensidad: 2,
        tipo_lampara: "LED Cálido 100W",
        radio_iluminacion: 35,
        ultima_revision: "2026-02-18",
        fuente: "Dpto. Alumbrado Municipalidad de Arica",
        fecha_actualizacion: "2026-03-01"
      },
      geometry: { type: "Point", coordinates: [-70.3218, -18.4805] }
    },
    {
      type: "Feature",
      properties: {
        id: "foco-04",
        nombre: "Luminaria Costanera Comandante San Martín",
        estado: "mantenimiento", // naranja
        intensidad: 2,
        tipo_lampara: "LED 120W",
        radio_iluminacion: 25,
        ultima_revision: "2026-03-05",
        fuente: "CGE Distribución / Mantención",
        fecha_actualizacion: "2026-03-06"
      },
      geometry: { type: "Point", coordinates: [-70.3235, -18.4830] }
    },
    {
      type: "Feature",
      properties: {
        id: "foco-05",
        nombre: "Foco Balneario El Laucho",
        estado: "activo",
        intensidad: 3,
        tipo_lampara: "LED Marino Antisalino 200W",
        radio_iluminacion: 55,
        ultima_revision: "2026-02-28",
        fuente: "Municipalidad de Arica",
        fecha_actualizacion: "2026-03-01"
      },
      geometry: { type: "Point", coordinates: [-70.3275, -18.4935] }
    },
    {
      type: "Feature",
      properties: {
        id: "foco-06",
        nombre: "Poste Curva La Lisera",
        estado: "apagado", // gris / rojo oscuro
        intensidad: 1,
        tipo_lampara: "Sodio 70W",
        radio_iluminacion: 0,
        ultima_revision: "2026-03-08",
        fuente: "Reporte Vecinal #4412",
        fecha_actualizacion: "2026-03-09"
      },
      geometry: { type: "Point", coordinates: [-70.3305, -18.5020] }
    },
    {
      type: "Feature",
      properties: {
        id: "foco-07",
        nombre: "Torre Borde Costero Chinchorro Sur",
        estado: "activo",
        intensidad: 3,
        tipo_lampara: "Focos LED 300W",
        radio_iluminacion: 65,
        ultima_revision: "2026-02-22",
        fuente: "Capitanía de Puerto / Municipalidad",
        fecha_actualizacion: "2026-03-01"
      },
      geometry: { type: "Point", coordinates: [-70.3160, -18.4550] }
    },
    {
      type: "Feature",
      properties: {
        id: "foco-08",
        nombre: "Luminaria Av. Diego Portales / Terminal",
        estado: "desconocido", // azul grisáceo
        intensidad: 2,
        tipo_lampara: "LED Estándar",
        radio_iluminacion: 20,
        ultima_revision: "2025-12-10",
        fuente: "Censo Lumínico Preliminar",
        fecha_actualizacion: "2026-01-05"
      },
      geometry: { type: "Point", coordinates: [-70.3080, -18.4630] }
    }
  ]
};

// 5. Polígonos de Sectores Iluminados (Zonas Iluminadas)
export const ZONAS_ILUMINADAS = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        id: "zona-ilum-centro-historico",
        nombre: "Paseo Peatonal 21 de Mayo y Paseo Bolognesi",
        nivel_iluminacion: "alta", // alta, media, baja, desconocida
        horario_inicio: "19:30",
        horario_fin: "06:30",
        fuente: "Municipalidad de Arica - Seguridad Ciudadana",
        fecha_actualizacion: "2026-02-20"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-70.3210, -18.4765],
            [-70.3175, -18.4768],
            [-70.3180, -18.4800],
            [-70.3215, -18.4795],
            [-70.3210, -18.4765]
          ]
        ]
      }
    },
    {
      type: "Feature",
      properties: {
        id: "zona-ilum-paseo-el-laucho",
        nombre: "Bulevar y Costanera El Laucho",
        nivel_iluminacion: "alta",
        horario_inicio: "19:00",
        horario_fin: "06:00",
        fuente: "Concesión Balneario El Laucho",
        fecha_actualizacion: "2026-02-15"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-70.3285, -18.4910],
            [-70.3255, -18.4915],
            [-70.3265, -18.4960],
            [-70.3295, -18.4955],
            [-70.3285, -18.4910]
          ]
        ]
      }
    },
    {
      type: "Feature",
      properties: {
        id: "zona-ilum-costanera-chinchorro",
        nombre: "Ciclovía y Borde Playa Chinchorro",
        nivel_iluminacion: "media",
        horario_inicio: "19:45",
        horario_fin: "05:45",
        fuente: "Municipalidad de Arica",
        fecha_actualizacion: "2026-02-10"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-70.3185, -18.4520],
            [-70.3140, -18.4525],
            [-70.3150, -18.4610],
            [-70.3195, -18.4600],
            [-70.3185, -18.4520]
          ]
        ]
      }
    },
    {
      type: "Feature",
      properties: {
        id: "zona-ilum-morro-explanada",
        nombre: "Mirador Cima del Morro de Arica",
        nivel_iluminacion: "alta",
        horario_inicio: "19:00",
        horario_fin: "07:00",
        fuente: "Ejército de Chile / Sernatur",
        fecha_actualizacion: "2026-01-20"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-70.3270, -18.4845],
            [-70.3235, -18.4848],
            [-70.3245, -18.4880],
            [-70.3280, -18.4875],
            [-70.3270, -18.4845]
          ]
        ]
      }
    }
  ]
};

// 6. Servicios Críticos y de Emergencia (Salud, Comisarías, Bomberos, Farmacias de Turno)
export const SERVICIOS_EMERGENCIA = [
  {
    id: "emerg-01-hospital",
    nombre: "Hospital Regional de Arica Dr. Juan Noé Crevani",
    categoria: "Hospitales",
    tipo: "emergencia",
    telefono: "+56 58 220 4000 / 131 (SAMU)",
    direccion: "18 de Septiembre 1000, Arica",
    horario: "Urgencias 24 horas",
    lat: -18.4772,
    lng: -70.3060,
    oficial: true,
    fuente: "Servicio de Salud Arica (SSA)",
    fecha_actualizacion: "2026-01-10"
  },
  {
    id: "emerg-02-sar-iris-veliz",
    nombre: "SAR Dra. Iris Véliz Hume (Centro de Salud de Alta Resolutividad)",
    categoria: "Centros de Salud",
    tipo: "emergencia",
    telefono: "+56 58 238 6800",
    direccion: "Barros Luco 2345, Arica",
    horario: "Atención de urgencia 17:00 a 08:00 (Fines de semana 24h)",
    lat: -18.4680,
    lng: -70.2915,
    oficial: true,
    fuente: "DESAMU Arica",
    fecha_actualizacion: "2026-01-10"
  },
  {
    id: "emerg-03-carabineros-1ra",
    nombre: "1ª Comisaría de Carabineros Arica",
    categoria: "Comisarías",
    tipo: "emergencia",
    telefono: "133 / +56 58 258 4000",
    direccion: "Alberdi 850, Arica",
    horario: "24 horas",
    lat: -18.4760,
    lng: -70.3150,
    oficial: true,
    fuente: "Carabineros de Chile - XV Zona",
    fecha_actualizacion: "2026-01-10"
  },
  {
    id: "emerg-04-carabineros-3ra",
    nombre: "3ª Comisaría de Carabineros Arica (Norte)",
    categoria: "Comisarías",
    tipo: "emergencia",
    telefono: "133 / +56 58 258 4120",
    direccion: "Av. Santa María 2250, Arica",
    horario: "24 horas",
    lat: -18.4610,
    lng: -70.3010,
    oficial: true,
    fuente: "Carabineros de Chile - XV Zona",
    fecha_actualizacion: "2026-01-10"
  },
  {
    id: "emerg-05-bomberos-1ra",
    nombre: "Cuerpo de Bomberos de Arica - 1ª Compañía 'O'Higgins'",
    categoria: "Bomberos",
    tipo: "emergencia",
    telefono: "132 / +56 58 223 1111",
    direccion: "Sotomayor 345, Centro",
    horario: "Guardia activa 24 horas",
    lat: -18.4785,
    lng: -70.3185,
    oficial: true,
    fuente: "Junta Nacional de Cuerpos de Bomberos",
    fecha_actualizacion: "2026-01-10"
  },
  {
    id: "emerg-06-bomberos-3ra",
    nombre: "Cuerpo de Bomberos de Arica - 3ª Compañía",
    categoria: "Bomberos",
    tipo: "emergencia",
    telefono: "132 / +56 58 222 2222",
    direccion: "Av. Loa con Conrado Ríos",
    horario: "Guardia activa 24 horas",
    lat: -18.4710,
    lng: -70.3015,
    oficial: true,
    fuente: "Junta Nacional de Cuerpos de Bomberos",
    fecha_actualizacion: "2026-01-10"
  },
  {
    id: "emerg-07-farmacia-turno-centro",
    nombre: "Farmacia Ahumada (Turno Permanente)",
    categoria: "Farmacias",
    tipo: "servicio",
    telefono: "+56 600 222 4000",
    direccion: "Paseo 21 de Mayo 398, Centro",
    horario: "Turno oficial 24 horas",
    lat: -18.4777,
    lng: -70.3182,
    oficial: true,
    fuente: "SEREMI de Salud Arica y Parinacota",
    fecha_actualizacion: "2026-03-01"
  },
  {
    id: "emerg-08-farmacia-cruz-verde",
    nombre: "Farmacia Cruz Verde Rotonda",
    categoria: "Farmacias",
    tipo: "servicio",
    telefono: "+56 800 802 800",
    direccion: "Av. Diego Portales 1200",
    horario: "08:30 a 22:00",
    lat: -18.4650,
    lng: -70.3040,
    oficial: true,
    fuente: "SEREMI de Salud Arica y Parinacota",
    fecha_actualizacion: "2026-03-01"
  }
];

// Helper para sanitizar strings y prevenir ataques XSS al renderizar texto dinámico
export function sanitizeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================================
// 6. LÍNEAS DE TRANSPORTE PÚBLICO (MICROS & COLECTIVOS DE ARICA)
// ============================================================
export const LINEAS_TRANSPORTE_PUBLICO = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        id: "linea-micro-12",
        nombre: "Línea 12 (Saucache - Chinchorro)",
        tipo: "micro",
        numero: "12",
        color: "#0284c7",
        tarifa: "$500 adulto / $160 estudiante",
        horario: "06:00 a 23:00",
        frecuencia: "Cada 8-10 min",
        paradas: [
          { id: "p1", nombre: "Terminal Asoagro", lat: -18.5020, lng: -70.2950 },
          { id: "p2", nombre: "Campus Saucache UTA", lat: -18.4900, lng: -70.2980 },
          { id: "p3", nombre: "Rotonda Tucapel", lat: -18.4680, lng: -70.3010 },
          { id: "p4", nombre: "Costanera Las Machas", lat: -18.4480, lng: -70.3150 }
        ]
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [-70.2950, -18.5020],
          [-70.2980, -18.4900],
          [-70.3010, -18.4680],
          [-70.3150, -18.4480]
        ]
      }
    },
    {
      type: "Feature",
      properties: {
        id: "linea-micro-07",
        nombre: "Línea 7 (Cerro La Cruz - Puerto)",
        tipo: "micro",
        numero: "7",
        color: "#f97316",
        tarifa: "$500 adulto",
        horario: "06:30 a 22:30",
        frecuencia: "Cada 12 min",
        paradas: [
          { id: "p1", nombre: "Mirador Cerro La Cruz", lat: -18.4850, lng: -70.3080 },
          { id: "p2", nombre: "Av. Santa María", lat: -18.4790, lng: -70.3140 },
          { id: "p3", nombre: "Paseo 21 de Mayo (Centro)", lat: -18.4770, lng: -70.3180 },
          { id: "p4", nombre: "Puerto de Arica", lat: -18.4760, lng: -70.3240 }
        ]
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [-70.3080, -18.4850],
          [-70.3140, -18.4790],
          [-70.3180, -18.4770],
          [-70.3240, -18.4760]
        ]
      }
    },
    {
      type: "Feature",
      properties: {
        id: "linea-colectivo-01",
        nombre: "Colectivo Línea 1 (Azapa - Centro)",
        tipo: "colectivo",
        numero: "1",
        color: "#10b981",
        tarifa: "$800 general",
        horario: "06:00 a 00:00",
        frecuencia: "Salida continua",
        paradas: [
          { id: "p1", nombre: "Acceso Valle de Azapa (Km 1)", lat: -18.5100, lng: -70.2850 },
          { id: "p2", nombre: "Rotonda Manuel Castillo", lat: -18.4950, lng: -70.2970 },
          { id: "p3", nombre: "Paseo 21 de Mayo", lat: -18.4780, lng: -70.3170 }
        ]
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [-70.2850, -18.5100],
          [-70.2970, -18.4950],
          [-70.3170, -18.4780]
        ]
      }
    }
  ]
};

// ============================================================
// PERSISTENCIA DINÁMICA & SINCRONIZACIÓN EN TIEMPO REAL
// Permite que las modificaciones hechas en el panel de administrador
// se reflejen inmediatamente en el mapa público.
// ============================================================
const STORAGE_KEYS = {
  ROUTES: 'turiarica_custom_routes',
  ZONES: 'turiarica_custom_zones',
  MEETING_POINTS: 'turiarica_custom_meeting_points',
  LIGHTS: 'turiarica_custom_lights',
  TRANSIT_LINES: 'turiarica_custom_transit_lines'
};

export const GEODATA_UPDATED_EVENT = 'turiarica_geodata_updated';

function notifyGeoDataChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(GEODATA_UPDATED_EVENT));
  }
}

export function getLiveRoutesGeoJSON() {
  if (typeof window === 'undefined') return VIAS_EVACUACION;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ROUTES);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return { type: "FeatureCollection", features: parsed };
      if (parsed && parsed.type === "FeatureCollection") return parsed;
    }
  } catch (e) {
    console.warn('Error reading stored routes:', e);
  }
  return VIAS_EVACUACION;
}

export function saveLiveRoutes(features) {
  if (typeof window === 'undefined') return;
  try {
    const list = Array.isArray(features) ? features : (features?.features || []);
    localStorage.setItem(STORAGE_KEYS.ROUTES, JSON.stringify(list));
    notifyGeoDataChange();
  } catch (e) {
    console.error('Error saving routes:', e);
  }
}

export function getLiveZonesGeoJSON() {
  if (typeof window === 'undefined') return ZONAS_RIESGO_TSUNAMI;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ZONES);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return { type: "FeatureCollection", features: parsed };
      if (parsed && parsed.type === "FeatureCollection") return parsed;
    }
  } catch (e) {
    console.warn('Error reading stored zones:', e);
  }
  return ZONAS_RIESGO_TSUNAMI;
}

export function saveLiveZones(features) {
  if (typeof window === 'undefined') return;
  try {
    const list = Array.isArray(features) ? features : (features?.features || []);
    localStorage.setItem(STORAGE_KEYS.ZONES, JSON.stringify(list));
    notifyGeoDataChange();
  } catch (e) {
    console.error('Error saving zones:', e);
  }
}

export function getLiveMeetingPoints() {
  if (typeof window === 'undefined') return PUNTOS_ENCUENTRO;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MEETING_POINTS);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Error reading stored meeting points:', e);
  }
  return PUNTOS_ENCUENTRO;
}

export function saveLiveMeetingPoints(points) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.MEETING_POINTS, JSON.stringify(points));
    notifyGeoDataChange();
  } catch (e) {
    console.error('Error saving meeting points:', e);
  }
}

export function getLiveLightsGeoJSON() {
  if (typeof window === 'undefined') return FOCOS_DE_LUZ;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LIGHTS);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return { type: "FeatureCollection", features: parsed };
      if (parsed && parsed.type === "FeatureCollection") return parsed;
    }
  } catch (e) {
    console.warn('Error reading stored lights:', e);
  }
  return FOCOS_DE_LUZ;
}

export function saveLiveLights(features) {
  if (typeof window === 'undefined') return;
  try {
    const list = Array.isArray(features) ? features : (features?.features || []);
    localStorage.setItem(STORAGE_KEYS.LIGHTS, JSON.stringify(list));
    notifyGeoDataChange();
  } catch (e) {
    console.error('Error saving lights:', e);
  }
}

export function getLiveTransitLinesGeoJSON() {
  if (typeof window === 'undefined') return LINEAS_TRANSPORTE_PUBLICO;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSIT_LINES);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return { type: "FeatureCollection", features: parsed };
      if (parsed && parsed.type === "FeatureCollection") return parsed;
    }
  } catch (e) {
    console.warn('Error reading stored transit lines:', e);
  }
  return LINEAS_TRANSPORTE_PUBLICO;
}

export function saveLiveTransitLines(features) {
  if (typeof window === 'undefined') return;
  try {
    const list = Array.isArray(features) ? features : (features?.features || []);
    localStorage.setItem(STORAGE_KEYS.TRANSIT_LINES, JSON.stringify(list));
    notifyGeoDataChange();
  } catch (e) {
    console.error('Error saving transit lines:', e);
  }
}

export function resetAllGeoDataToDefault() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.ROUTES);
  localStorage.removeItem(STORAGE_KEYS.ZONES);
  localStorage.removeItem(STORAGE_KEYS.MEETING_POINTS);
  localStorage.removeItem(STORAGE_KEYS.LIGHTS);
  localStorage.removeItem(STORAGE_KEYS.TRANSIT_LINES);
  notifyGeoDataChange();
}



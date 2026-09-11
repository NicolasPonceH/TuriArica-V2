import mysql from 'mysql2/promise';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorios de almacenamiento local de medios
const dbDir = path.resolve(__dirname, '../database');
const uploadPhotosDir = path.resolve(__dirname, '../uploads/photos');
const uploadVideosDir = path.resolve(__dirname, '../uploads/videos');

[dbDir, uploadPhotosDir, uploadVideosDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configuración de MySQL / MariaDB (XAMPP / phpMyAdmin)
const DB_TYPE = (process.env.DB_TYPE || 'mysql').toLowerCase();
const MYSQL_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'turiarica'
};

let activeEngine = 'sqlite';
let mysqlPool = null;
let sqliteDb = null;

// Inicialización SQLite como respaldo siempre disponible
const sqlitePath = path.join(dbDir, 'turiarica.db');
try {
  sqliteDb = new DatabaseSync(sqlitePath);
  sqliteDb.exec('PRAGMA journal_mode = WAL;');
} catch (err) {
  console.warn('[SQLITE INIT]', err.message);
}

export function getActiveEngine() {
  return activeEngine;
}

// Helpers de migración de esquema segura (Agrega columnas si no existen sin perder datos)
async function ensureMySQLColumns(pool) {
  try {
    const [cols] = await pool.query(`SHOW COLUMNS FROM places`);
    const colNames = cols.map(c => c.Field);

    if (!colNames.includes('accessibility_json')) {
      await pool.query(`ALTER TABLE places ADD COLUMN accessibility_json TEXT AFTER ai_tags_json`);
    }
    if (!colNames.includes('tips')) {
      await pool.query(`ALTER TABLE places ADD COLUMN tips TEXT AFTER accessibility_json`);
    }
    if (!colNames.includes('entry_fee')) {
      await pool.query(`ALTER TABLE places ADD COLUMN entry_fee VARCHAR(255) AFTER tips`);
    }
    if (!colNames.includes('best_time')) {
      await pool.query(`ALTER TABLE places ADD COLUMN best_time VARCHAR(255) AFTER entry_fee`);
    }
  } catch (err) {
    console.warn('[DB MIGRATION MYSQL]', err.message);
  }
}

function ensureSQLiteColumns(db) {
  try {
    const tableInfo = db.prepare(`PRAGMA table_info(places)`).all();
    const colNames = tableInfo.map(c => c.name);
    if (!colNames.includes('accessibility_json')) {
      db.exec(`ALTER TABLE places ADD COLUMN accessibility_json TEXT;`);
    }
    if (!colNames.includes('tips')) {
      db.exec(`ALTER TABLE places ADD COLUMN tips TEXT;`);
    }
    if (!colNames.includes('entry_fee')) {
      db.exec(`ALTER TABLE places ADD COLUMN entry_fee TEXT;`);
    }
    if (!colNames.includes('best_time')) {
      db.exec(`ALTER TABLE places ADD COLUMN best_time TEXT;`);
    }
  } catch (err) {
    console.warn('[DB MIGRATION SQLITE]', err.message);
  }
}

// 1. Inicialización del Motor de Base de Datos
export async function initDatabase() {
  if (DB_TYPE === 'mysql') {
    try {
      // Conectar a MySQL sin BD para asegurar que 'turiarica' exista en phpMyAdmin
      const rootConn = await mysql.createConnection({
        host: MYSQL_CONFIG.host,
        port: MYSQL_CONFIG.port,
        user: MYSQL_CONFIG.user,
        password: MYSQL_CONFIG.password
      });
      await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${MYSQL_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
      await rootConn.end();

      // Crear Pool de conexiones
      mysqlPool = mysql.createPool({
        host: MYSQL_CONFIG.host,
        port: MYSQL_CONFIG.port,
        user: MYSQL_CONFIG.user,
        password: MYSQL_CONFIG.password,
        database: MYSQL_CONFIG.database,
        waitForConnections: true,
        connectionLimit: 15,
        queueLimit: 0
      });

      // Crear Tablas en MySQL
      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS admins (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(100) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'admin',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS places (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          category VARCHAR(100) NOT NULL,
          type VARCHAR(50) DEFAULT 'turismo',
          icon VARCHAR(100),
          color VARCHAR(50),
          short_desc TEXT,
          full_desc TEXT,
          lat DECIMAL(10, 6) NOT NULL,
          lng DECIMAL(10, 6) NOT NULL,
          hours VARCHAR(255),
          directions TEXT,
          phone VARCHAR(100),
          website VARCHAR(255),
          price_range VARCHAR(50),
          entry_fee VARCHAR(255),
          best_time VARCHAR(255),
          tips TEXT,
          is_24h TINYINT(1) DEFAULT 0,
          audio_file VARCHAR(255),
          transport_json TEXT,
          photos_json TEXT,
          videos_json TEXT,
          ai_tags_json TEXT,
          accessibility_json TEXT,
          is_default TINYINT(1) DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS events (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          type VARCHAR(50) DEFAULT 'evento',
          start_date VARCHAR(50),
          end_date VARCHAR(50),
          is_active TINYINT(1) DEFAULT 1,
          is_popup TINYINT(1) DEFAULT 1,
          banner_url TEXT,
          action_url TEXT,
          priority INT DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // Asegurar columnas añadidas
      await ensureMySQLColumns(mysqlPool);

      activeEngine = 'mysql';
      console.log(`[DB] 🐬 Conectado exitosamente a MySQL (XAMPP phpMyAdmin: bd '${MYSQL_CONFIG.database}')`);
      return;
    } catch (err) {
      console.warn(`[DB WARNING] No se pudo conectar a MySQL en ${MYSQL_CONFIG.host}:${MYSQL_CONFIG.port}: ${err.message}`);
      console.warn(`[DB WARNING] Activando modo de respaldo con SQLite local.`);
      activeEngine = 'sqlite';
    }
  }

  // Esquema para SQLite (fallback)
  if (sqliteDb) {
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS places (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        type TEXT DEFAULT 'turismo',
        icon TEXT,
        color TEXT,
        short_desc TEXT,
        full_desc TEXT,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        hours TEXT,
        directions TEXT,
        phone TEXT,
        website TEXT,
        price_range TEXT,
        entry_fee TEXT,
        best_time TEXT,
        tips TEXT,
        is_24h INTEGER DEFAULT 0,
        audio_file TEXT,
        transport_json TEXT,
        photos_json TEXT,
        videos_json TEXT,
        ai_tags_json TEXT,
        accessibility_json TEXT,
        is_default INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'evento',
        start_date TEXT,
        end_date TEXT,
        is_active INTEGER DEFAULT 1,
        is_popup INTEGER DEFAULT 1,
        banner_url TEXT,
        action_url TEXT,
        priority INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    ensureSQLiteColumns(sqliteDb);
    activeEngine = 'sqlite';
    console.log('[DB] 🗄️ Base de datos SQLite activa.');
  }
}

// 2. Helpers de Formato
function formatPlace(r) {
  if (!r) return null;

  let parsedAccessibility = { wheelchair: false, ramps: false, adaptedBathrooms: false, notes: '' };
  try {
    if (typeof r.accessibility_json === 'string' && r.accessibility_json.trim()) {
      parsedAccessibility = JSON.parse(r.accessibility_json);
    } else if (typeof r.accessibility_json === 'object' && r.accessibility_json !== null) {
      parsedAccessibility = r.accessibility_json;
    }
  } catch (e) {
    // fallback
  }

  return {
    id: r.id,
    name: r.name,
    category: r.category,
    type: r.type,
    icon: r.icon,
    color: r.color,
    shortDesc: r.short_desc,
    fullDesc: r.full_desc,
    lat: Number(r.lat),
    lng: Number(r.lng),
    hours: r.hours,
    directions: r.directions,
    phone: r.phone,
    website: r.website,
    priceRange: r.price_range,
    entryFee: r.entry_fee || '',
    bestTime: r.best_time || '',
    tips: r.tips || '',
    accessibility: parsedAccessibility,
    is24h: Boolean(r.is_24h),
    audioFile: r.audio_file,
    transport: typeof r.transport_json === 'string' ? JSON.parse(r.transport_json || '{}') : (r.transport_json || {}),
    photos: typeof r.photos_json === 'string' ? JSON.parse(r.photos_json || '[]') : (r.photos_json || []),
    videos: typeof r.videos_json === 'string' ? JSON.parse(r.videos_json || '[]') : (r.videos_json || []),
    aiTags: typeof r.ai_tags_json === 'string' ? JSON.parse(r.ai_tags_json || '[]') : (r.ai_tags_json || []),
    isDefault: Boolean(r.is_default),
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

function formatEvent(e) {
  if (!e) return null;
  return {
    id: e.id,
    title: e.title,
    message: e.message,
    type: e.type,
    startDate: e.start_date,
    endDate: e.end_date,
    isActive: Boolean(e.is_active),
    isPopup: Boolean(e.is_popup),
    bannerUrl: e.banner_url,
    actionUrl: e.action_url,
    priority: e.priority,
    createdAt: e.created_at
  };
}

function formatAdmin(a) {
  if (!a) return null;
  return {
    id: a.id,
    username: a.username,
    password_hash: a.password_hash,
    role: a.role,
    createdAt: a.created_at
  };
}

// 13 Lugares Oficiales y Emblemáticos de Arica y Parinacota
export const initialPlaces = [
  {
    name: "Playa El Laucho", category: "Playa", type: "turismo", icon: "Umbrella", color: "#0EA5E9",
    shortDesc: "La playa más popular, cálida y 100% accesible de Arica.",
    fullDesc: "Playa El Laucho es el balneario por excelencia de Arica. Sus aguas turquesas son excepcionalmente calmas y de temperatura agradable, asemejando una piscina natural ideal para el baño seguro de niños y adultos. Cuenta con una destacada infraestructura inclusiva con rampas de madera hasta la orilla del mar, baños adaptados, duchas, arriendo de sombrillas y locales gastronómicos para contemplar el atardecer frente al Pacífico.",
    lat: -18.4879, lng: -70.3267, hours: "Abierta todo el año · 24 horas",
    directions: "Desde el centro, tomar Av. Comandante San Martín al sur por 2 km. Micros 12, 14, 10, 8 (letrero 'Centro/Mall' en ida).",
    phone: "+56 58 220 6000", website: "https://www.arica.cl", priceRange: "Gratis",
    entryFee: "Acceso libre y público gratuito",
    bestTime: "11:00 a 19:30 para sol pleno y baño tranquilo",
    tips: "El mejor balneario para nadar con niños porque casi no tiene olas. Hay arriendo de reposeras y sombrillas.",
    accessibility: { wheelchair: true, ramps: true, adaptedBathrooms: true, notes: "Playa inclusiva con pasarela de madera hasta el mar y personal de apoyo en verano." },
    is24h: 1, audioFile: "audios/laucho_audio.mp3",
    transport: { lineas: ["12", "14", "10", "8"], direccion: "sur", letrero: "Centro / Mall", parada: "Av. Comandante San Martín" },
    photos: ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop"],
    videos: [],
    aiTags: ["playa", "turismo", "inclusivo", "familiar", "mar", "laucho", "silla de ruedas"]
  },
  {
    name: "Museo de Sitio Colón 10", category: "Museo", type: "turismo", icon: "Landmark", color: "#8B5CF6",
    shortDesc: "Hogar in situ de las momias Chinchorro, las más antiguas de la humanidad.",
    fullDesc: "Construido literalmente sobre un cementerio prehispánico descubierto en el corazón de la ciudad, el Museo de Sitio Colón 10 resguarda in situ a las momias de la Cultura Chinchorro, reconocidas por la UNESCO como Patrimonio de la Humanidad. Tienen más de 7.000 años de antigüedad, superando en milenios a las egipcias. A través de un suelo de cristal y pasarelas accesibles, los visitantes observan los cuerpos y ofrendas tal como fueron depositados.",
    lat: -18.4806, lng: -70.3216, hours: "Martes a Domingo · 09:00 - 18:00",
    directions: "Calle Colón 10, a 3 cuadras de la Plaza Colón. Micros 1,2,3,5,7,10,11,16,113 (letrero 'Centro'). Bajas en calle Colón y caminas 3 cuadras.",
    phone: "+56 58 220 5410", website: "https://uta.cl/museos", priceRange: "$",
    entryFee: "Adultos: $2.000 CLP · Escolares y 3ra edad: $1.000 CLP",
    bestTime: "Martes a domingo por la mañana (10:00 - 13:00)",
    tips: "El recorrido toma unos 40 minutos con audioguía incluida; está prohibido tomar fotos con flash para preservar los restos orgánicos.",
    accessibility: { wheelchair: true, ramps: true, adaptedBathrooms: true, notes: "Pasarelas elevadas y suelo de cristal totalmente nivelados para sillas de ruedas." },
    is24h: 0, audioFile: "audios/Museo_audio.mp3",
    transport: { lineas: ["1", "2", "3", "5", "7", "10", "11", "16", "113"], direccion: "centro", letrero: "Centro", parada: "Calle Colón" },
    photos: ["https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop"],
    videos: [],
    aiTags: ["museo", "cultura", "patrimonio", "chinchorro", "momias", "historia", "unesco"]
  },
  {
    name: "Iglesia San Marcos", category: "Histórico", type: "turismo", icon: "Church", color: "#F59E0B",
    shortDesc: "Joya arquitectónica de fierro fundido diseñada por Gustave Eiffel en 1876.",
    fullDesc: "Declarada Monumento Nacional, la Iglesia San Marcos es un tesoro arquitectónico diseñado en París por los talleres del legendario ingeniero francés Gustave Eiffel. Su estructura completa de hierro fundido fue traída en barco y ensamblada en Arica para resistir los sismos de la región. Su estilo neogótico, coloridos vitrales franceses y su campanario la convierten en la postal patrimonial por excelencia de la Plaza Colón.",
    lat: -18.4789, lng: -70.3207, hours: "Lunes a Sábado 08:00 - 20:00 · Domingo 09:00 - 13:00",
    directions: "Plaza Colón, centro histórico de Arica. Cualquier micro con letrero 'Centro' te deja en la plaza.",
    phone: "+56 58 223 1860", website: "", priceRange: "Gratis",
    entryFee: "Entrada liberada y gratuita",
    bestTime: "Mañanas despejadas para apreciar la luz a través de los vitrales góticos",
    tips: "Tómate una fotografía frente a su fachada y observa los remaches de fierro forjado originales de la casa Eiffel.",
    accessibility: { wheelchair: true, ramps: true, adaptedBathrooms: false, notes: "Rampa en acceso lateral para ingresar a la nave central." },
    is24h: 0, audioFile: "audios/Catedral_audio.mp3",
    transport: { lineas: ["1", "2", "3", "5", "7", "10", "11", "16", "113"], direccion: "centro", letrero: "Centro", parada: "Plaza Colón" },
    photos: ["https://images.unsplash.com/photo-1548625361-195fe210b484?w=800&auto=format&fit=crop"],
    videos: [],
    aiTags: ["eiffel", "catedral", "iglesia", "san marcos", "monumento", "centro", "patrimonio"]
  },
  {
    name: "El Morro de Arica", category: "Histórico", type: "turismo", icon: "Mountain", color: "#EF4444",
    shortDesc: "Cerro icónico de 139 m con museo de armas y panorámica 360° de la ciudad y el mar.",
    fullDesc: "El Morro de Arica es el emblema geográfico e histórico indiscutible de la ciudad. Este imponente acantilado costero de 139 metros fue el teatro de la célebre toma del Morro en 1880 durante la Guerra del Pacífico. Su cima alberga la gran explanada con el monumento al Cristo de la Paz, trincheras históricas y el Museo Histórico y de Armas, brindando una vista 360 grados inigualable del puerto, las playas y el valle.",
    lat: -18.4803, lng: -70.3236, hours: "Martes a Domingo · 08:00 - 18:00 (Explanada 24h)",
    directions: "Acceso peatonal por calle Colón o vehicular por calle Sotomayor. Estacionamiento gratuito. En micro: 12, 14, 10, 8 hasta los pies del Morro.",
    phone: "+56 58 225 1550", website: "", priceRange: "$",
    entryFee: "Explanada y mirador: Gratis · Museo Histórico de Armas: $1.000 CLP",
    bestTime: "18:00 a 19:45 para presenciar la puesta de sol sobre el Océano Pacífico",
    tips: "Llevar gorro o sombrero y protector solar; suele correr viento fresco en la cumbre. Ideal para fotografías panorámicas.",
    accessibility: { wheelchair: true, ramps: true, adaptedBathrooms: true, notes: "Explanada del mirador y Cristo de la Paz son planos y accesibles; acceso en vehículo hasta la cima." },
    is24h: 0, audioFile: "audios/Morro_audio.mp3",
    transport: { lineas: ["12", "14", "10", "8"], direccion: "sur", letrero: "Centro / Mall", parada: "Pies del Morro" },
    photos: ["https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop"],
    videos: [],
    aiTags: ["morro", "mirador", "guerra del pacifico", "museo", "panorama", "emblema", "atardecer"]
  },
  {
    name: "Humedal del Río Lluta", category: "Naturaleza", type: "turismo", icon: "Bird", color: "#10B981",
    shortDesc: "Santuario de la Naturaleza y paraíso de aves migratorias frente al Pacífico.",
    fullDesc: "Un oasis donde el desierto se encuentra con el océano. El Humedal de la desembocadura del Río Lluta abarca más de 300 hectáreas protegidas como Santuario de la Naturaleza. Es una escala vital en la ruta migratoria de más de 160 especies de aves, incluyendo flamencos chilenos, gaviotas de Franklin, patos jergón y chorlos. Dispone de pasarelas de madera y miradores para observar fauna sin perturbar el ecosistema.",
    lat: -18.416128, lng: -70.322369, hours: "Abierto todo el año · 08:00 - 18:30",
    directions: "Sector norte de Arica, por Ruta 5 Norte o Av. Las Dunas hacia la desembocadura del río Lluta. Taxi o auto particular.",
    phone: "", website: "", priceRange: "Gratis",
    entryFee: "Entrada liberada (Santuario protegido)",
    bestTime: "08:30 a 11:00 hrs cuando la avifauna se alimenta activamente",
    tips: "Llevar binoculares o cámara con teleobjetivo. Está estrictamente prohibido ingresar con perros o hacer ruidos molestos.",
    accessibility: { wheelchair: true, ramps: true, adaptedBathrooms: false, notes: "Pasarelas de madera planas con miradores aptos para personas con movilidad reducida." },
    is24h: 0, audioFile: "audios/Humedal_audio.mp3",
    transport: { lineas: ["taxi", "auto"], direccion: "norte", letrero: "No hay micros", parada: "Estacionamiento Humedal Lluta" },
    photos: ["https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop"],
    videos: [],
    aiTags: ["humedal", "rio lluta", "aves", "santuario", "naturaleza", "flamencos", "ecoturismo"]
  },
  {
    name: "Cuevas de Anzota", category: "Naturaleza", type: "turismo", icon: "Compass", color: "#6366F1",
    shortDesc: "Espectacular sendero en acantilados costeros con cavernas milenarias y lobos marinos.",
    fullDesc: "Las Cuevas de Anzota presentan uno de los paisajes marinos más sobrecogedores de Chile. Esculpidas durante milenios por el oleaje contra los acantilados de la Cordillera de la Costa, estas cavernas sirvieron como refugio y sitio de recolección para la cultura Chinchorro. Un moderno sendero peatonal interpretativo permite recorrer las grutas, contemplar colonias de lobos marinos y aves guaneras, y sentir la energía del océano.",
    lat: -18.5498, lng: -70.3312, hours: "Martes a Domingo · 09:00 - 18:00 (último ingreso 17:30)",
    directions: "12 km al sur de Arica por la costanera Ruta 1. Solo accesible en vehículo particular, tour o taxi.",
    phone: "+56 58 220 6000", website: "https://cuevasdeanzota.cl", priceRange: "Gratis",
    entryFee: "Acceso liberado (Administrado por Corporación Costa Chinchorro)",
    bestTime: "10:00 a 16:00, preferentemente en marea baja",
    tips: "Uso de casco obligatorio entregado gratuitamente en portería. Llevar calzado cerrado con buena suela para caminar en roca húmeda.",
    accessibility: { wheelchair: false, ramps: false, adaptedBathrooms: true, notes: "Primer tramo pavimentado; ingreso a cavernas con escaleras de roca no aptas para silla de ruedas." },
    is24h: 0, audioFile: "audios/CuevasDeAnzota_audio.mp3",
    transport: { lineas: ["taxi", "auto", "tours"], direccion: "sur", letrero: "No hay micros", parada: "Portería Cuevas de Anzota" },
    photos: ["https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop"],
    videos: [],
    aiTags: ["anzota", "cuevas", "fauna", "senderismo", "acantilados", "lobos marinos", "geologia"]
  },
  {
    name: "Terminal Agropecuario ASOCAPEC", category: "Gastronomía", type: "gastronomia", icon: "Utensils", color: "#C2714F",
    shortDesc: "El corazón gastronómico y agrícola: frutas tropicales, aceitunas de Azapa y cocina local.",
    fullDesc: "Visitar el 'Agro' es sumergirse en una fiesta de colores, olores y sabores auténticos del norte chileno. Es el gran centro de abastecimiento donde los agricultores de los valles de Azapa y Lluta ofrecen aceitunas moradas y amargas, mangos, maracuyás, guayabas y hortalizas frescas. Además, sus cocinerías tradicionales sirven platos típicos como picante de guata, caldillo de congrio y jugos naturales recién exprimidos a precios económicos.",
    lat: -18.4964, lng: -70.2861, hours: "Lunes a Domingo · 06:00 - 18:00",
    directions: "Entrada norte de Arica, Panamericana Norte. Micros que indiquen 'Agro' en letrero: 12, 14, 8, 16, 113.",
    phone: "", website: "", priceRange: "$",
    entryFee: "Acceso libre · Platos de almuerzo desde $3.500 a $6.000 CLP",
    bestTime: "08:00 a 13:30 para comprar frutas frescas y almorzar en cocinerías",
    tips: "Llevar dinero en efectivo para puestos pequeños; prueba los mangos de Pica/Azapa y el pan batido caliente con aceitunas.",
    accessibility: { wheelchair: true, ramps: true, adaptedBathrooms: true, notes: "Pasillos centrales anchos y nivelados sin desniveles pronunciados." },
    is24h: 0, audioFile: "audios/terminal_audio.mp3",
    transport: { lineas: ["12", "14", "8", "16", "113"], direccion: "norte", letrero: "Agro", parada: "Terminal ASOCAPEC" },
    photos: ["https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&auto=format&fit=crop"],
    videos: [],
    aiTags: ["agro", "comida", "aceitunas", "frutas", "mercado", "azapa", "almuerzo", "gastronomia"]
  },
  {
    name: "Playa Chinchorro", category: "Playa", type: "turismo", icon: "Waves", color: "#38BDF8",
    shortDesc: "Extensa playa de aguas templadas, gran costanera familiar y deportes náuticos.",
    fullDesc: "Playa Chinchorro es una de las costas más extensas y concurridas de Arica. Destaca por sus aguas inusualmente cálidas y su oleaje suave, convirtiéndola en el lugar perfecto para nadar, practicar surf principiante, caminar en familia o patinar. Su amplia costanera cuenta con palmeras, ciclovías, juegos infantiles, heladerías artesanales y terrazas con vista al mar.",
    lat: -18.4630, lng: -70.3052, hours: "Abierta todo el año · 24 horas",
    directions: "Sector norte de Arica, Av. Raúl Pey Casado. Toma micro 12 o 14 (letrero 'Centro/Mall' en ida) hasta España con Buenos Aires y camina 1 cuadra.",
    phone: "", website: "", priceRange: "Gratis",
    entryFee: "Acceso público y gratuito",
    bestTime: "Tardes de 15:30 a 20:30 para caminatas y puestas de sol",
    tips: "Excelente para salir a correr o pasear en bicicleta por su costanera iluminada.",
    accessibility: { wheelchair: true, ramps: true, adaptedBathrooms: true, notes: "Paseo peatonal y costanera completamente planos y pavimentados para sillas de ruedas y coches." },
    is24h: 1, audioFile: "audios/chinchorro_audio.mp3",
    transport: { lineas: ["12", "14"], direccion: "norte", letrero: "Centro / Mall", parada: "España con Buenos Aires" },
    photos: ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop"],
    videos: [],
    aiTags: ["chinchorro", "playa", "costanera", "atardecer", "familiar", "surf", "deportes"]
  },
  {
    name: "Museo Arqueológico San Miguel de Azapa", category: "Museo", type: "turismo", icon: "Landmark", color: "#9333EA",
    shortDesc: "Principal museo antropológico del norte grande y cuna de las Momias Chinchorro.",
    fullDesc: "Perteneciente a la Universidad de Tarapacá y emplazado en el fértil Valle de Azapa (Km 12), este célebre museo alberga la colección antropológica más importante del norte chileno. Custodia a las momias de la cultura Chinchorro declaradas Patrimonio de la Humanidad por la UNESCO, junto a impresionantes vestigios textiles prehispánicos, cestería, cerámica tiwanaku y la historia viva de los agricultores afrodescendientes e indígenas del valle.",
    lat: -18.5204, lng: -70.2017, hours: "Martes a Domingo · 10:00 - 17:30",
    directions: "Valle de Azapa Km 12. Tomar micro rural o taxi colectivo verde en terminal Rodoviario de Arica.",
    phone: "+56 58 220 5555", website: "https://masma.uta.cl", priceRange: "$",
    entryFee: "Adultos: $2.000 CLP · Estudiantes y 3ra edad: $1.000 CLP · Menores de 6 años: Gratis",
    bestTime: "Mañanas de 10:30 a 14:00 con el clima templado y soleado de Azapa",
    tips: "Aprovecha de visitar los olivares contiguos para comprar aceitunas y aceite de oliva extra virgen prensado en el valle.",
    accessibility: { wheelchair: true, ramps: true, adaptedBathrooms: true, notes: "Salas de exhibición y senderos exteriores con rampas para sillas de ruedas." },
    is24h: 0, audioFile: "",
    transport: { lineas: ["Rural Azapa", "Colectivo Azapa"], direccion: "este", letrero: "San Miguel de Azapa", parada: "Frontis Museo Arqueológico UTA" },
    photos: ["https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop"],
    videos: [],
    aiTags: ["museo", "azapa", "chinchorro", "momias", "arqueologia", "unesco", "valle", "patrimonio"]
  },
  {
    name: "Terminal Pesquero de Arica", category: "Gastronomía", type: "gastronomia", icon: "Utensils", color: "#0284C7",
    shortDesc: "Ceviches frescos, empanadas de mariscos y avistamiento cercano de lobos marinos y pelícanos.",
    fullDesc: "Ubicado en el puerto histórico a pocos pasos de la Plaza Colón, el Terminal Pesquero es un punto neurálgico de la cultura costera ariqueña. Aquí puedes almorzar mariscos y pescados recién desembarcados: ceviches de reineta y corvina, peroles marinos y empanadas recién fritas. En los muelles contiguos es clásico observar de cerca a lobos marinos descansando al sol y pelícanos esperando la faena de los pescadores artesanales.",
    lat: -18.4756, lng: -70.3228, hours: "Lunes a Domingo · 08:00 - 17:00",
    directions: "Costanera Máximo Lira frente al Puerto de Arica, a 2 cuadras al norte de Plaza Colón.",
    phone: "", website: "", priceRange: "$$",
    entryFee: "Acceso libre · Platos de ceviche y pescado desde $5.000 a $9.000 CLP",
    bestTime: "Almuerzo de 12:00 a 14:30 para comer pescado recién preparado y ver lobos marinos",
    tips: "No te pierdas las empanadas de jaiba queso y lleva tu cámara para fotografiar a los lobos marinos junto a los botes pesqueros.",
    accessibility: { wheelchair: true, ramps: true, adaptedBathrooms: false, notes: "Acceso nivelado desde la vereda de la costanera con piso de concreto." },
    is24h: 0, audioFile: "",
    transport: { lineas: ["1", "2", "3", "7", "8", "10", "12", "14"], direccion: "centro", letrero: "Centro / Puerto", parada: "Av. Máximo Lira frente al Puerto" },
    photos: ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop"],
    videos: [],
    aiTags: ["pesquero", "ceviche", "mariscos", "lobos marinos", "puerto", "almuerzo", "gastronomia"]
  },
  {
    name: "Poblado Artesanal de Arica", category: "Cultura", type: "turismo", icon: "Palette", color: "#D97706",
    shortDesc: "Aldea réplica del pueblo de Parinacota con artesanía andina viva, orfebrería y talleres.",
    fullDesc: "Edificado como réplica de los pueblos andinos de la precordillera (con muros de adobe encalado, vigas de madera y piedras volcánicas similares a Parinacota), el Poblado Artesanal reúne a creadores y artesanos locales. En sus talleres abiertos encontrarás orfebrería en plata, alfarería en greda con réplicas Chinchorro, tejidos en lana de alpaca y luthería de instrumentos tradicionales como charangos y zampoñas.",
    lat: -18.5034, lng: -70.2818, hours: "Martes a Domingo · 10:30 - 19:00",
    directions: "Calle Hualles 2825, sector Saucache / Rotonda Hualles. Micros 1, 8, 9, 10, 14 con letrero Saucache o Agro.",
    phone: "+56 58 222 4110", website: "", priceRange: "Gratis",
    entryFee: "Entrada libre y gratuita",
    bestTime: "Tardes de 15:00 a 18:30 para conversar con los artesanos en sus talleres",
    tips: "El mejor lugar en Arica para comprar recuerdos y artesanías auténticas sin intermediarios; cuenta con cafetería en el patio interior.",
    accessibility: { wheelchair: true, ramps: true, adaptedBathrooms: true, notes: "Patios y accesos en planta baja con senderos pavimentados accesibles." },
    is24h: 0, audioFile: "",
    transport: { lineas: ["1", "8", "9", "10", "14"], direccion: "sur-este", letrero: "Saucache / Agro", parada: "Hualles con 18 de Septiembre" },
    photos: ["https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&auto=format&fit=crop"],
    videos: [],
    aiTags: ["artesania", "poblado artesanal", "chinchorro", "alpaca", "cultura", "talleres", "recuerdos"]
  },
  {
    name: "Ex-Aduana de Arica (Casa de la Cultura)", category: "Histórico", type: "turismo", icon: "Building2", color: "#475569",
    shortDesc: "Monumento Nacional diseñado por Gustave Eiffel en París y ensamblado en 1874.",
    fullDesc: "Una joya arquitectónica del siglo XIX construida por los talleres franceses de Gustave Eiffel en París. Encargada por el gobierno peruano antes de la Guerra del Pacífico, sus piezas metálicas fueron embarcadas a Arica y ensambladas para servir como Aduana Mayor. Su estructura de hierro sobrevivió a grandes terremotos y hoy funciona como la Casa de la Cultura de la Municipalidad de Arica, acogiendo exposiciones artísticas, recitales y muestras culturales.",
    lat: -18.4772, lng: -70.3204, hours: "Lunes a Viernes · 09:00 - 19:00 | Sábado 10:00 - 14:00",
    directions: "Av. Máximo Lira con Baquedano, frente al Parque Vicuña Mackenna y puerto de Arica.",
    phone: "+56 58 220 6000", website: "https://www.muniarica.cl", priceRange: "Gratis",
    entryFee: "Entrada liberada",
    bestTime: "Mañanas o tardes para combinar con el Parque Vicuña Mackenna y la Iglesia San Marcos",
    tips: "Observa los pilares y remaches franceses originales idénticos a las técnicas constructivas de la Torre Eiffel.",
    accessibility: { wheelchair: true, ramps: true, adaptedBathrooms: true, notes: "Rampa en acceso principal directo desde la explanada del parque." },
    is24h: 0, audioFile: "",
    transport: { lineas: ["1", "2", "3", "7", "8", "10", "12", "14"], direccion: "centro", letrero: "Centro", parada: "Parque Vicuña Mackenna" },
    photos: ["https://images.unsplash.com/photo-1548625361-195fe210b484?w=800&auto=format&fit=crop"],
    videos: [],
    aiTags: ["aduana", "eiffel", "casa de la cultura", "patrimonio", "historia", "monumento", "centro"]
  },
  {
    name: "Parque Nacional Lauca y Lago Chungará", category: "Naturaleza", type: "turismo", icon: "MountainSnow", color: "#059669",
    shortDesc: "Reserva Mundial de la Biósfera a 4.500 msnm con el lago más alto del mundo y volcanes gemelos.",
    fullDesc: "Declarado Reserva de la Biósfera por la UNESCO, el Parque Nacional Lauca es una de las grandes maravillas naturales de Chile. Ubicado en el altiplano de la región a 4.500 msnm, acoge al deslumbrante Lago Chungará, rodeado por los imponentes volcanes gemelos Parinacota y Pomerape (los Payachatas). Es el hogar de una asombrosa fauna andina: vicuñas silvestres, vizcachas, llamas, alpacas y bandadas de flamencos andinos.",
    lat: -18.2505, lng: -69.1558, hours: "Abierto todo el año · 08:30 - 17:00",
    directions: "Ruta 11-CH (Carretera Internacional a Bolivia), a 180 km al este de Arica (aprox. 3,5 horas en vehículo). Se recomienda tour guiado o 4x4.",
    phone: "+56 58 225 0570", website: "https://www.conaf.cl", priceRange: "Gratis",
    entryFee: "Ingreso al parque regulado por CONAF (generalmente liberado)",
    bestTime: "Entre marzo y diciembre; salir muy temprano desde Arica (06:30 AM)",
    tips: "Imprescindible aclimatarse en Putre para evitar la puna (mal de altura); llevar ropa térmica cortaviento, abundante agua, frutos secos y protección solar.",
    accessibility: { wheelchair: false, ramps: false, adaptedBathrooms: true, notes: "Senderos de tierra volcánica; extremar precaución por la altitud extrema (4.500 msnm)." },
    is24h: 0, audioFile: "",
    transport: { lineas: ["Tours guiados", "Buses a Putre / Bolivia"], direccion: "cordillera", letrero: "Putre / Tambo Quemado", parada: "Refugio CONAF Chungará" },
    photos: ["https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop"],
    videos: [],
    aiTags: ["chungara", "lauca", "altiplano", "volcan", "parinacota", "vicuñas", "flamencos", "reserva"]
  }
];

// 3. Inicialización y Siembra de Datos Iniciales
export async function seedDatabase(adminUser = 'admin', adminPass = 'turiarica2026') {
  const defaultAdmins = [
    { username: 'jorell', role: 'administrador' },
    { username: 'nicolas', role: 'administrador' },
    { username: adminUser || 'admin', role: 'superadmin' }
  ];
  const hash = bcrypt.hashSync(adminPass, 10);

  if (activeEngine === 'mysql' && mysqlPool) {
    try {
      // Admins
      for (const adm of defaultAdmins) {
        await mysqlPool.query(
          'INSERT IGNORE INTO admins (username, password_hash, role) VALUES (?, ?, ?)',
          [adm.username, hash, adm.role]
        );
      }

      // Events
      const [eventCountRows] = await mysqlPool.query('SELECT COUNT(*) as count FROM events');
      if (Number(eventCountRows[0]?.count) === 0) {
        await mysqlPool.query(`
          INSERT INTO events (title, message, type, start_date, end_date, is_active, is_popup, banner_url, action_url, priority)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          'Carnaval Andino con la Fuerza del Sol 2026',
          '¡El evento cultural y de danzas más grande del norte de Chile! Vive 3 días de emoción, comparsas y tradición andina a los pies del Morro de Arica. Más de 16.000 bailarines y músicos.',
          'festival', '2026-01-23', '2026-02-15', 1, 1,
          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop',
          'https://aricafuerzadelsol.cl', 1
        ]);

        await mysqlPool.query(`
          INSERT INTO events (title, message, type, start_date, end_date, is_active, is_popup, banner_url, action_url, priority)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          'Aviso Preventivo: Oleaje y Bandera Amarilla en Playas',
          'Capitanía de Puerto de Arica informa aviso preventivo de marejadas moderadas en el sector costero. Se recomienda máxima precaución a bañistas en playas El Laucho y Chinchorro.',
          'alerta', '2026-03-01', '2026-03-31', 1, 0, '', '', 2
        ]);
      }

      // Places Upsert (Inserta los nuevos y actualiza con los campos enriquecidos a los existentes)
      for (const p of initialPlaces) {
        const [existing] = await mysqlPool.query('SELECT id FROM places WHERE name = ? LIMIT 1', [p.name]);
        if (existing.length === 0) {
          await mysqlPool.query(`
            INSERT INTO places (
              name, category, type, icon, color, short_desc, full_desc, lat, lng,
              hours, directions, phone, website, price_range, entry_fee, best_time, tips, is_24h, audio_file,
              transport_json, photos_json, videos_json, ai_tags_json, accessibility_json, is_default
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
          `, [
            p.name, p.category, p.type, p.icon, p.color, p.shortDesc, p.fullDesc,
            p.lat, p.lng, p.hours, p.directions, p.phone, p.website, p.priceRange,
            p.entryFee || '', p.bestTime || '', p.tips || '',
            p.is24h ? 1 : 0, p.audioFile || '',
            JSON.stringify(p.transport || {}),
            JSON.stringify(p.photos || []),
            JSON.stringify(p.videos || []),
            JSON.stringify(p.aiTags || []),
            JSON.stringify(p.accessibility || {}),
          ]);
        } else {
          await mysqlPool.query(`
            UPDATE places SET
              category = ?, type = ?, icon = ?, color = ?, short_desc = ?, full_desc = ?,
              lat = ?, lng = ?, hours = ?, directions = ?, phone = ?, website = ?,
              price_range = ?, entry_fee = ?, best_time = ?, tips = ?, is_24h = ?,
              audio_file = ?, transport_json = ?, photos_json = ?, videos_json = ?,
              ai_tags_json = ?, accessibility_json = ?
            WHERE id = ?
          `, [
            p.category, p.type, p.icon, p.color, p.shortDesc, p.fullDesc,
            p.lat, p.lng, p.hours, p.directions, p.phone, p.website,
            p.priceRange, p.entryFee || '', p.bestTime || '', p.tips || '',
            p.is24h ? 1 : 0, p.audioFile || '',
            JSON.stringify(p.transport || {}),
            JSON.stringify(p.photos || []),
            JSON.stringify(p.videos || []),
            JSON.stringify(p.aiTags || []),
            JSON.stringify(p.accessibility || {}),
            existing[0].id
          ]);
        }
      }
      console.log(`[DB] 🐬 MySQL: 13 lugares turísticos de Arica y Parinacota sincronizados.`);
      return;
    } catch (err) {
      console.error('[DB SEED MYSQL ERROR]', err);
    }
  }

  // Fallback SQLite
  if (sqliteDb) {
    try {
      const insertAdmin = sqliteDb.prepare('INSERT OR IGNORE INTO admins (username, password_hash, role) VALUES (?, ?, ?)');
      for (const adm of defaultAdmins) {
        insertAdmin.run(adm.username, hash, adm.role);
      }

      const eventCount = sqliteDb.prepare('SELECT COUNT(*) as count FROM events').get().count;
      if (eventCount === 0) {
        const insertEvent = sqliteDb.prepare(`
          INSERT INTO events (title, message, type, start_date, end_date, is_active, is_popup, banner_url, action_url, priority)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        insertEvent.run(
          'Carnaval Andino con la Fuerza del Sol 2026',
          '¡El evento cultural y de danzas más grande del norte de Chile! Vive 3 días de emoción, comparsas y tradición andina a los pies del Morro de Arica. Más de 16.000 bailarines y músicos.',
          'festival', '2026-01-23', '2026-02-15', 1, 1,
          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop',
          'https://aricafuerzadelsol.cl', 1
        );
        insertEvent.run(
          'Aviso Preventivo: Oleaje y Bandera Amarilla en Playas',
          'Capitanía de Puerto de Arica informa aviso preventivo de marejadas moderadas en el sector costero. Se recomienda máxima precaución a bañistas en playas El Laucho y Chinchorro.',
          'alerta', '2026-03-01', '2026-03-31', 1, 0, '', '', 2
        );
      }

      for (const p of initialPlaces) {
        const existing = sqliteDb.prepare('SELECT id FROM places WHERE name = ?').get(p.name);
        if (!existing) {
          sqliteDb.prepare(`
            INSERT INTO places (
              name, category, type, icon, color, short_desc, full_desc, lat, lng,
              hours, directions, phone, website, price_range, entry_fee, best_time, tips, is_24h, audio_file,
              transport_json, photos_json, videos_json, ai_tags_json, accessibility_json, is_default
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
          `).run(
            p.name, p.category, p.type, p.icon, p.color, p.shortDesc, p.fullDesc,
            p.lat, p.lng, p.hours, p.directions, p.phone, p.website, p.priceRange,
            p.entryFee || '', p.bestTime || '', p.tips || '',
            p.is24h ? 1 : 0, p.audioFile || '',
            JSON.stringify(p.transport || {}),
            JSON.stringify(p.photos || []),
            JSON.stringify(p.videos || []),
            JSON.stringify(p.aiTags || []),
            JSON.stringify(p.accessibility || {})
          );
        } else {
          sqliteDb.prepare(`
            UPDATE places SET
              category = ?, type = ?, icon = ?, color = ?, short_desc = ?, full_desc = ?,
              lat = ?, lng = ?, hours = ?, directions = ?, phone = ?, website = ?,
              price_range = ?, entry_fee = ?, best_time = ?, tips = ?, is_24h = ?,
              audio_file = ?, transport_json = ?, photos_json = ?, videos_json = ?,
              ai_tags_json = ?, accessibility_json = ?
            WHERE id = ?
          `).run(
            p.category, p.type, p.icon, p.color, p.shortDesc, p.fullDesc,
            p.lat, p.lng, p.hours, p.directions, p.phone, p.website,
            p.priceRange, p.entryFee || '', p.bestTime || '', p.tips || '',
            p.is24h ? 1 : 0, p.audioFile || '',
            JSON.stringify(p.transport || {}),
            JSON.stringify(p.photos || []),
            JSON.stringify(p.videos || []),
            JSON.stringify(p.aiTags || []),
            JSON.stringify(p.accessibility || {}),
            existing.id
          );
        }
      }
      console.log('[DB] 🗄️ SQLite: 13 lugares sincronizados.');
    } catch (err) {
      console.error('[DB SEED SQLITE ERROR]', err);
    }
  }
}

// 4. Operaciones Asíncronas
export const dbOperations = {
  // --- Admins ---
  async findAdminByUsername(username) {
    if (activeEngine === 'mysql' && mysqlPool) {
      const [rows] = await mysqlPool.query('SELECT * FROM admins WHERE username = ? LIMIT 1', [username]);
      return formatAdmin(rows[0]);
    }
    if (sqliteDb) {
      const r = sqliteDb.prepare('SELECT * FROM admins WHERE username = ?').get(username);
      return formatAdmin(r);
    }
    return null;
  },

  async findAdminById(id) {
    if (activeEngine === 'mysql' && mysqlPool) {
      const [rows] = await mysqlPool.query('SELECT id, username, role, created_at FROM admins WHERE id = ? LIMIT 1', [id]);
      return rows[0] || null;
    }
    if (sqliteDb) {
      return sqliteDb.prepare('SELECT id, username, role, created_at FROM admins WHERE id = ?').get(id) || null;
    }
    return null;
  },

  async updateAdminPassword(id, newHash) {
    if (activeEngine === 'mysql' && mysqlPool) {
      return await mysqlPool.query('UPDATE admins SET password_hash = ? WHERE id = ?', [newHash, id]);
    }
    if (sqliteDb) {
      return sqliteDb.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(newHash, id);
    }
  },

  // --- Places ---
  async getAllPlaces() {
    if (activeEngine === 'mysql' && mysqlPool) {
      const [rows] = await mysqlPool.query('SELECT * FROM places ORDER BY id ASC');
      return rows.map(formatPlace);
    }
    if (sqliteDb) {
      const rows = sqliteDb.prepare('SELECT * FROM places ORDER BY id ASC').all();
      return rows.map(formatPlace);
    }
    return [];
  },

  async getPlaceById(id) {
    if (activeEngine === 'mysql' && mysqlPool) {
      const [rows] = await mysqlPool.query('SELECT * FROM places WHERE id = ? LIMIT 1', [id]);
      return formatPlace(rows[0]);
    }
    if (sqliteDb) {
      const r = sqliteDb.prepare('SELECT * FROM places WHERE id = ?').get(id);
      return formatPlace(r);
    }
    return null;
  },

  async createPlace(data) {
    const params = [
      data.name,
      data.category,
      data.type || 'turismo',
      data.icon || 'MapPin',
      data.color || '#0ea5e9',
      data.shortDesc || '',
      data.fullDesc || '',
      Number(data.lat),
      Number(data.lng),
      data.hours || '',
      data.directions || '',
      data.phone || '',
      data.website || '',
      data.priceRange || '',
      data.entryFee || '',
      data.bestTime || '',
      data.tips || '',
      data.is24h ? 1 : 0,
      data.audioFile || '',
      JSON.stringify(data.transport || {}),
      JSON.stringify(data.photos || []),
      JSON.stringify(data.videos || []),
      JSON.stringify(data.aiTags || []),
      JSON.stringify(data.accessibility || {})
    ];

    if (activeEngine === 'mysql' && mysqlPool) {
      const [res] = await mysqlPool.query(`
        INSERT INTO places (
          name, category, type, icon, color, short_desc, full_desc, lat, lng,
          hours, directions, phone, website, price_range, entry_fee, best_time, tips, is_24h, audio_file,
          transport_json, photos_json, videos_json, ai_tags_json, accessibility_json, is_default
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
      `, params);
      return await this.getPlaceById(res.insertId);
    }

    if (sqliteDb) {
      const stmt = sqliteDb.prepare(`
        INSERT INTO places (
          name, category, type, icon, color, short_desc, full_desc, lat, lng,
          hours, directions, phone, website, price_range, entry_fee, best_time, tips, is_24h, audio_file,
          transport_json, photos_json, videos_json, ai_tags_json, accessibility_json, is_default
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
      `);
      const res = stmt.run(...params);
      return await this.getPlaceById(res.lastInsertRowid);
    }
    return null;
  },

  async updatePlace(id, data) {
    const params = [
      data.name,
      data.category,
      data.type || 'turismo',
      data.icon || 'MapPin',
      data.color || '#0ea5e9',
      data.shortDesc || '',
      data.fullDesc || '',
      Number(data.lat),
      Number(data.lng),
      data.hours || '',
      data.directions || '',
      data.phone || '',
      data.website || '',
      data.priceRange || '',
      data.entryFee || '',
      data.bestTime || '',
      data.tips || '',
      data.is24h ? 1 : 0,
      data.audioFile || '',
      JSON.stringify(data.transport || {}),
      JSON.stringify(data.photos || []),
      JSON.stringify(data.videos || []),
      JSON.stringify(data.aiTags || []),
      JSON.stringify(data.accessibility || {}),
      id
    ];

    if (activeEngine === 'mysql' && mysqlPool) {
      await mysqlPool.query(`
        UPDATE places SET
          name = ?, category = ?, type = ?, icon = ?, color = ?,
          short_desc = ?, full_desc = ?, lat = ?, lng = ?,
          hours = ?, directions = ?, phone = ?, website = ?, price_range = ?,
          entry_fee = ?, best_time = ?, tips = ?,
          is_24h = ?, audio_file = ?, transport_json = ?, photos_json = ?,
          videos_json = ?, ai_tags_json = ?, accessibility_json = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, params);
      return await this.getPlaceById(id);
    }

    if (sqliteDb) {
      const stmt = sqliteDb.prepare(`
        UPDATE places SET
          name = ?, category = ?, type = ?, icon = ?, color = ?,
          short_desc = ?, full_desc = ?, lat = ?, lng = ?,
          hours = ?, directions = ?, phone = ?, website = ?, price_range = ?,
          entry_fee = ?, best_time = ?, tips = ?,
          is_24h = ?, audio_file = ?, transport_json = ?, photos_json = ?,
          videos_json = ?, ai_tags_json = ?, accessibility_json = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      stmt.run(...params);
      return await this.getPlaceById(id);
    }
    return null;
  },

  async deletePlace(id) {
    if (activeEngine === 'mysql' && mysqlPool) {
      return await mysqlPool.query('DELETE FROM places WHERE id = ?', [id]);
    }
    if (sqliteDb) {
      return sqliteDb.prepare('DELETE FROM places WHERE id = ?').run(id);
    }
  },

  // --- Events ---
  async getAllEvents() {
    if (activeEngine === 'mysql' && mysqlPool) {
      const [rows] = await mysqlPool.query('SELECT * FROM events ORDER BY priority ASC, created_at DESC');
      return rows.map(formatEvent);
    }
    if (sqliteDb) {
      return sqliteDb.prepare('SELECT * FROM events ORDER BY priority ASC, created_at DESC').all().map(formatEvent);
    }
    return [];
  },

  async getActiveEvents() {
    if (activeEngine === 'mysql' && mysqlPool) {
      const [rows] = await mysqlPool.query('SELECT * FROM events WHERE is_active = 1 ORDER BY priority ASC, created_at DESC');
      return rows.map(formatEvent);
    }
    if (sqliteDb) {
      return sqliteDb.prepare('SELECT * FROM events WHERE is_active = 1 ORDER BY priority ASC, created_at DESC').all().map(formatEvent);
    }
    return [];
  },

  async createEvent(data) {
    const params = [
      data.title,
      data.message,
      data.type || 'evento',
      data.startDate || '',
      data.endDate || '',
      data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1,
      data.isPopup !== undefined ? (data.isPopup ? 1 : 0) : 0,
      data.bannerUrl || '',
      data.actionUrl || '',
      data.priority || 1
    ];

    if (activeEngine === 'mysql' && mysqlPool) {
      const [res] = await mysqlPool.query(`
        INSERT INTO events (title, message, type, start_date, end_date, is_active, is_popup, banner_url, action_url, priority)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, params);
      const [rows] = await mysqlPool.query('SELECT * FROM events WHERE id = ?', [res.insertId]);
      return formatEvent(rows[0]);
    }

    if (sqliteDb) {
      const stmt = sqliteDb.prepare(`
        INSERT INTO events (title, message, type, start_date, end_date, is_active, is_popup, banner_url, action_url, priority)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const res = stmt.run(...params);
      return formatEvent(sqliteDb.prepare('SELECT * FROM events WHERE id = ?').get(res.lastInsertRowid));
    }
    return null;
  },

  async updateEvent(id, data) {
    const params = [
      data.title,
      data.message,
      data.type || 'evento',
      data.startDate || '',
      data.endDate || '',
      data.isActive ? 1 : 0,
      data.isPopup ? 1 : 0,
      data.bannerUrl || '',
      data.actionUrl || '',
      data.priority || 1,
      id
    ];

    if (activeEngine === 'mysql' && mysqlPool) {
      await mysqlPool.query(`
        UPDATE events SET
          title = ?, message = ?, type = ?, start_date = ?, end_date = ?,
          is_active = ?, is_popup = ?, banner_url = ?, action_url = ?, priority = ?
        WHERE id = ?
      `, params);
      const [rows] = await mysqlPool.query('SELECT * FROM events WHERE id = ?', [id]);
      return formatEvent(rows[0]);
    }

    if (sqliteDb) {
      const stmt = sqliteDb.prepare(`
        UPDATE events SET
          title = ?, message = ?, type = ?, start_date = ?, end_date = ?,
          is_active = ?, is_popup = ?, banner_url = ?, action_url = ?, priority = ?
        WHERE id = ?
      `);
      stmt.run(...params);
      return formatEvent(sqliteDb.prepare('SELECT * FROM events WHERE id = ?').get(id));
    }
    return null;
  },

  async deleteEvent(id) {
    if (activeEngine === 'mysql' && mysqlPool) {
      return await mysqlPool.query('DELETE FROM events WHERE id = ?', [id]);
    }
    if (sqliteDb) {
      return sqliteDb.prepare('DELETE FROM events WHERE id = ?').run(id);
    }
  }
};

export default { initDatabase, seedDatabase, dbOperations, getActiveEngine, initialPlaces };

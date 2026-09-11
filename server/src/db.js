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

// 1. Inicialización del Motor de Base de Datos
export async function initDatabase() {
  if (DB_TYPE === 'mysql') {
    try {
      // Conectar a MySQL sin BD para asegurar que la base de datos 'turiarica' exista en phpMyAdmin
      const rootConn = await mysql.createConnection({
        host: MYSQL_CONFIG.host,
        port: MYSQL_CONFIG.port,
        user: MYSQL_CONFIG.user,
        password: MYSQL_CONFIG.password
      });
      await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${MYSQL_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
      await rootConn.end();

      // Crear Pool de conexiones hacia la base de datos 'turiarica'
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

      // Crear Tablas en MySQL compatibles con phpMyAdmin
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
          is_24h TINYINT(1) DEFAULT 0,
          audio_file VARCHAR(255),
          transport_json TEXT,
          photos_json TEXT,
          videos_json TEXT,
          ai_tags_json TEXT,
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
        is_24h INTEGER DEFAULT 0,
        audio_file TEXT,
        transport_json TEXT,
        photos_json TEXT,
        videos_json TEXT,
        ai_tags_json TEXT,
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
    activeEngine = 'sqlite';
    console.log('[DB] 🗄️ Base de datos SQLite activa.');
  }
}

// 2. Helpers de Formato
function formatPlace(r) {
  if (!r) return null;
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

// 8 Lugares Iniciales de Arica
const initialPlaces = [
  {
    name: "Playa El Laucho", category: "Playa", type: "turismo", icon: "Umbrella", color: "#0EA5E9",
    shortDesc: "La playa más popular y accesible de Arica.",
    fullDesc: "Playa El Laucho es el balneario por excelencia de Arica. Sus aguas de color turquesa son inusualmente tranquilas y de temperatura agradable, lo que la convierte en una piscina natural ideal para el baño seguro de niños y adultos. Cuenta con una excelente infraestructura inclusiva, incluyendo rampas que llegan casi hasta la orilla del mar, baños adaptados, duchas y arriendo de sombrillas. En su entorno encontrarás una vibrante oferta gastronómica para disfrutar de un hermoso atardecer frente al Pacífico.",
    lat: -18.4879, lng: -70.3267, hours: "Abierta todo el año · 24 horas",
    directions: "Desde el centro, tomar Av. Comandante San Martín al sur por 2 km. Micros 12, 14, 10, 8 (letrero 'Centro/Mall' en ida).",
    phone: "+56 58 220 6000", website: "https://www.arica.cl", priceRange: "", is24h: 1, audioFile: "audios/laucho_audio.mp3",
    transport: { lineas: ["12", "14", "10", "8"], direccion: "sur", letrero: "Centro / Mall", parada: "Av. Comandante San Martín" },
    photos: ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop"],
    videos: [],
    aiTags: ["playa", "turismo", "inclusivo", "familiar", "mar", "laucho"]
  },
  {
    name: "Museo de Sitio Colón 10", category: "Museo", type: "turismo", icon: "Landmark", color: "#8B5CF6",
    shortDesc: "Hogar de las momias Chinchorro, las más antiguas del mundo.",
    fullDesc: "Este asombroso museo está construido literalmente sobre un cementerio prehispánico. El Museo de Sitio Colón 10 resguarda in situ a las momias de la Cultura Chinchorro, reconocidas por la UNESCO como Patrimonio de la Humanidad. Estas momias tienen más de 7.000 años de antigüedad, superando en milenios a las momias egipcias. A través de un suelo de cristal y pasarelas totalmente accesibles, los visitantes pueden observar los cuerpos y ofrendas exactamente como fueron descubiertos.",
    lat: -18.4806, lng: -70.3216, hours: "Martes a Domingo · 09:00 - 18:00",
    directions: "Calle Colón 10, a 3 cuadras de la Plaza Colón. Micros 1,2,3,5,7,10,11,16,113 (letrero 'Centro'). Bajas en calle Colón y caminas 3 cuadras.",
    phone: "+56 58 220 5410", website: "https://uta.cl/museos", priceRange: "$", is24h: 0, audioFile: "audios/Museo_audio.mp3",
    transport: { lineas: ["1", "2", "3", "5", "7", "10", "11", "16", "113"], direccion: "centro", letrero: "Centro", parada: "Calle Colón" },
    photos: ["https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop"],
    videos: [],
    aiTags: ["museo", "cultura", "patrimonio", "chinchorro", "momias", "historia"]
  },
  {
    name: "Iglesia San Marcos", category: "Histórico", type: "turismo", icon: "Church", color: "#F59E0B",
    shortDesc: "Diseñada por Gustave Eiffel, ícono de Arica.",
    fullDesc: "Declarada Monumento Nacional, la Iglesia San Marcos es una joya arquitectónica diseñada en 1876 por los talleres del famoso ingeniero francés Gustave Eiffel. Lo más sorprendente es que su estructura es completamente de fierro fundido, traída en barco desde Francia y ensamblada en Arica para resistir los terremotos de la zona. Su estilo gótico, sus coloridos vitrales y su asimétrica torre la convierten en una parada obligatoria.",
    lat: -18.4789, lng: -70.3207, hours: "Lunes a Sábado 08-20h · Domingo 09-13h",
    directions: "Plaza Colón, centro histórico. Cualquier micro con letrero 'Centro' te deja en la plaza.",
    phone: "", website: "", priceRange: "", is24h: 0, audioFile: "audios/Catedral_audio.mp3",
    transport: { lineas: ["1", "2", "3", "5", "7", "10", "11", "16", "113"], direccion: "centro", letrero: "Centro", parada: "Plaza Colón" },
    photos: ["https://images.unsplash.com/photo-1548625361-195fe210b484?w=800&auto=format&fit=crop"],
    videos: [],
    aiTags: ["eiffel", "catedral", "iglesia", "san marcos", "monumento", "centro"]
  },
  {
    name: "El Morro de Arica", category: "Histórico", type: "turismo", icon: "Mountain", color: "#EF4444",
    shortDesc: "Cerro con museo histórico y vistas panorámicas.",
    fullDesc: "El Morro de Arica es el símbolo indiscutido de la ciudad. Este imponente peñón costero de 139 metros de altura fue el escenario de una de las batallas más decisivas de la Guerra del Pacífico en 1880. Hoy en día, su cima funciona como un gran balcón natural que ofrece las mejores vistas panorámicas de la ciudad, el puerto y el Océano Pacífico. En la cumbre podrás visitar el Museo Histórico y de Armas.",
    lat: -18.4803, lng: -70.3236, hours: "Martes a Domingo · 08:00 - 18:00",
    directions: "Acceso por Av. Colón o calle Rafael Sotomayor. Estacionamiento gratuito. En micro, toma 12,14,10,8 con letrero 'Centro/Mall' y baja en los pies del Morro.",
    phone: "+56 58 225 1550", website: "", priceRange: "$", is24h: 0, audioFile: "audios/Morro_audio.mp3",
    transport: { lineas: ["12", "14", "10", "8"], direccion: "sur", letrero: "Centro / Mall", parada: "Pies del Morro" },
    photos: ["https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop"],
    videos: [],
    aiTags: ["morro", "mirador", "guerra del pacifico", "museo", "panorama", "emblema"]
  },
  {
    name: "Humedal del Río Lluta", category: "Naturaleza", type: "turismo", icon: "Bird", color: "#10B981",
    shortDesc: "Santuario natural y refugio de aves migratorias.",
    fullDesc: "Un oasis de vida donde el desierto se encuentra con el mar. El Humedal de la desembocadura del Río Lluta es un Santuario de la Naturaleza de más de 300 hectáreas. Es un punto de descanso y alimentación crucial en la ruta migratoria de más de 160 especies de aves, incluyendo flamencos, patos jergón y gaviotas. Ofrece senderos planos y miradores de madera diseñados para observar la fauna sin perturbar el ecosistema.",
    lat: -18.416128, lng: -70.322369, hours: "Abierto todo el año · 08:00 - 18:30",
    directions: "Norte de Arica, por Ruta 5 o Av. Las Dunas. No hay micros directas. Solo taxi o auto particular.",
    phone: "", website: "", priceRange: "", is24h: 0, audioFile: "audios/Humedal_audio.mp3",
    transport: { lineas: ["taxi", "auto"], direccion: "norte", letrero: "No hay micros", parada: "Solo vehículo particular" },
    photos: ["https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop"],
    videos: [],
    aiTags: ["humedal", "rio lluta", "aves", "santuario", "naturaleza", "flamencos"]
  },
  {
    name: "Cuevas de Anzota", category: "Naturaleza", type: "turismo", icon: "Compass", color: "#6366F1",
    shortDesc: "Sistema de grutas en acantilados, lobos marinos.",
    fullDesc: "Las Cuevas de Anzota ofrecen uno de los paisajes más dramáticos y hermosos de la región. Talladas durante milenios por el fuerte oleaje del océano contra los acantilados de la Cordillera de la Costa, estas cavernas naturales fueron utilizadas hace miles de años por la cultura Chinchorro. Hoy, un sendero interpretativo te permite caminar dentro de las grutas, observar la rica fauna marina y sentir la imponente fuerza de la naturaleza.",
    lat: -18.5498, lng: -70.3312, hours: "Abierto todo el año · mejor con marea baja",
    directions: "12 km al sur por Ruta 1. No hay micros. Solo taxi o auto particular.",
    phone: "", website: "https://cuevasdeanzota.cl", priceRange: "", is24h: 0, audioFile: "audios/CuevasDeAnzota_audio.mp3",
    transport: { lineas: ["taxi", "auto"], direccion: "sur", letrero: "No hay micros", parada: "Solo vehículo particular" },
    photos: ["https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop"],
    videos: [],
    aiTags: ["anzota", "cuevas", "fauna", "senderismo", "acantilados", "lobos marinos"]
  },
  {
    name: "Terminal Agropecuario ASOCAPEC", category: "Gastronomía", type: "gastronomia", icon: "Utensils", color: "#C2714F",
    shortDesc: "Corazón gastronómico: aceitunas, frutas, tradición.",
    fullDesc: "Visitar el 'Agro' es sumergirse en una explosión de colores, aromas y sabores auténticos del norte de Chile. Este inmenso mercado es el punto neurálgico donde los agricultores de los valles de Azapa y Lluta traen sus mejores productos frescos. Aquí podrás degustar las famosas aceitunas de Azapa, frutas tropicales como mangos y maracuyá, y disfrutar de cocinerías tradicionales.",
    lat: -18.4964, lng: -70.2861, hours: "Todos los días 06:00 - 18:00",
    directions: "Entrada norte, Panamericana Norte. Micros que digan 'Agro' en el letrero: 12, 14, 8, 16, 113 (líneas naranja y roja).",
    phone: "", website: "", priceRange: "$", is24h: 0, audioFile: "audios/terminal_audio.mp3",
    transport: { lineas: ["12", "14", "8", "16", "113"], direccion: "norte", letrero: "Agro", parada: "Terminal ASOCAPEC" },
    photos: ["https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&auto=format&fit=crop"],
    videos: [],
    aiTags: ["agro", "comida", "aceitunas", "frutas", "mercado", "azapa", "almuerzo"]
  },
  {
    name: "Playa Chinchorro", category: "Playa", type: "turismo", icon: "Waves", color: "#38BDF8",
    shortDesc: "Extensa playa de aguas cálidas, ideal para familias y caminatas.",
    fullDesc: "Playa Chinchorro es una de las playas más extensas y concurridas de Arica. Destaca por sus aguas inusualmente cálidas y su oleaje moderado, lo que la hace perfecta para la natación y para disfrutar en familia. Su amplia costanera está llena de vida, rodeada de palmeras, parques infantiles, heladerías y restaurantes.",
    lat: -18.4630, lng: -70.3052, hours: "Abierta todo el año · 24 horas",
    directions: "Sector norte de Arica, Av. Raúl Pey Casado. Toma micro 12 o 14 (letrero 'Centro/Mall' en ida), baja en España con Buenos Aires, camina 1 cuadra hacia el oeste.",
    phone: "", website: "", priceRange: "", is24h: 1, audioFile: "audios/chinchorro_audio.mp3",
    transport: { lineas: ["12", "14"], direccion: "norte", letrero: "Centro / Mall", parada: "España con Buenos Aires (luego caminar 1 cuadra)" },
    photos: ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop"],
    videos: [],
    aiTags: ["chinchorro", "playa", "costanera", "atardecer", "familiar"]
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
      console.log('[DB] 🐬 MySQL: Usuarios administradores verificados: jorell, nicolas, admin.');

      // Events
      const [eventCountRows] = await mysqlPool.query('SELECT COUNT(*) as count FROM events');
      if (Number(eventCountRows[0]?.count) === 0) {
        await mysqlPool.query(`
          INSERT INTO events (title, message, type, start_date, end_date, is_active, is_popup, banner_url, action_url, priority)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          'Carnaval Andino con la Fuerza del Sol 2026',
          '¡El evento cultural y de danzas más grande del norte de Chile! Vive 3 días de emoción, comparsas y tradición andina a los pies del Morro de Arica. Más de 16.000 bailarines y músicos.',
          'festival',
          '2026-01-23',
          '2026-02-15',
          1,
          1,
          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop',
          'https://aricafuerzadelsol.cl',
          1
        ]);

        await mysqlPool.query(`
          INSERT INTO events (title, message, type, start_date, end_date, is_active, is_popup, banner_url, action_url, priority)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          'Aviso Preventivo: Oleaje y Bandera Amarilla en Playas',
          'Capitanía de Puerto de Arica informa aviso preventivo de marejadas moderadas en el sector costero. Se recomienda máxima precaución a bañistas en playas El Laucho y Chinchorro.',
          'alerta',
          '2026-03-01',
          '2026-03-31',
          1,
          0,
          '',
          '',
          2
        ]);
        console.log('[DB] 🐬 MySQL: Eventos y notificaciones inicializados.');
      }

      // Places
      const [placeCountRows] = await mysqlPool.query('SELECT COUNT(*) as count FROM places');
      if (Number(placeCountRows[0]?.count) === 0) {
        for (const p of initialPlaces) {
          await mysqlPool.query(`
            INSERT INTO places (
              name, category, type, icon, color, short_desc, full_desc, lat, lng,
              hours, directions, phone, website, price_range, is_24h, audio_file,
              transport_json, photos_json, videos_json, ai_tags_json, is_default
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
          `, [
            p.name, p.category, p.type, p.icon, p.color, p.shortDesc, p.fullDesc,
            p.lat, p.lng, p.hours, p.directions, p.phone, p.website, p.priceRange,
            p.is24h, p.audioFile || '',
            JSON.stringify(p.transport || {}),
            JSON.stringify(p.photos || []),
            JSON.stringify(p.videos || []),
            JSON.stringify(p.aiTags || [])
          ]);
        }
        console.log(`[DB] 🐬 MySQL: ${initialPlaces.length} lugares turísticos de Arica inicializados.`);
      }
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

      const placeCount = sqliteDb.prepare('SELECT COUNT(*) as count FROM places').get().count;
      if (placeCount === 0) {
        const insertPlace = sqliteDb.prepare(`
          INSERT INTO places (
            name, category, type, icon, color, short_desc, full_desc, lat, lng,
            hours, directions, phone, website, price_range, is_24h, audio_file,
            transport_json, photos_json, videos_json, ai_tags_json, is_default
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `);
        for (const p of initialPlaces) {
          insertPlace.run(
            p.name, p.category, p.type, p.icon, p.color, p.shortDesc, p.fullDesc,
            p.lat, p.lng, p.hours, p.directions, p.phone, p.website, p.priceRange,
            p.is24h, p.audioFile || '',
            JSON.stringify(p.transport || {}),
            JSON.stringify(p.photos || []),
            JSON.stringify(p.videos || []),
            JSON.stringify(p.aiTags || [])
          );
        }
      }
      console.log('[DB] 🗄️ SQLite: Datos iniciales verificados.');
    } catch (err) {
      console.error('[DB SEED SQLITE ERROR]', err);
    }
  }
}

// 4. Operaciones Asíncronas (MySQL con Fallback SQLite)
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
      data.is24h ? 1 : 0,
      data.audioFile || '',
      JSON.stringify(data.transport || {}),
      JSON.stringify(data.photos || []),
      JSON.stringify(data.videos || []),
      JSON.stringify(data.aiTags || [])
    ];

    if (activeEngine === 'mysql' && mysqlPool) {
      const [res] = await mysqlPool.query(`
        INSERT INTO places (
          name, category, type, icon, color, short_desc, full_desc, lat, lng,
          hours, directions, phone, website, price_range, is_24h, audio_file,
          transport_json, photos_json, videos_json, ai_tags_json, is_default
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
      `, params);
      return await this.getPlaceById(res.insertId);
    }

    if (sqliteDb) {
      const stmt = sqliteDb.prepare(`
        INSERT INTO places (
          name, category, type, icon, color, short_desc, full_desc, lat, lng,
          hours, directions, phone, website, price_range, is_24h, audio_file,
          transport_json, photos_json, videos_json, ai_tags_json, is_default
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
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
      data.is24h ? 1 : 0,
      data.audioFile || '',
      JSON.stringify(data.transport || {}),
      JSON.stringify(data.photos || []),
      JSON.stringify(data.videos || []),
      JSON.stringify(data.aiTags || []),
      id
    ];

    if (activeEngine === 'mysql' && mysqlPool) {
      await mysqlPool.query(`
        UPDATE places SET
          name = ?, category = ?, type = ?, icon = ?, color = ?,
          short_desc = ?, full_desc = ?, lat = ?, lng = ?,
          hours = ?, directions = ?, phone = ?, website = ?, price_range = ?,
          is_24h = ?, audio_file = ?, transport_json = ?, photos_json = ?,
          videos_json = ?, ai_tags_json = ?, updated_at = CURRENT_TIMESTAMP
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
          is_24h = ?, audio_file = ?, transport_json = ?, photos_json = ?,
          videos_json = ?, ai_tags_json = ?, updated_at = CURRENT_TIMESTAMP
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

export default { initDatabase, seedDatabase, dbOperations, getActiveEngine };

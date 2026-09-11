import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

const dbPath = path.resolve(__dirname, '../../database/turiarica.db');

// Download raw SQLite .db file
router.get('/db', (req, res) => {
  if (!fs.existsSync(dbPath)) {
    return res.status(404).json({ error: 'Base de datos no encontrada.' });
  }
  const dateStr = new Date().toISOString().slice(0, 10);
  res.download(dbPath, `turiarica_backup_${dateStr}.db`, (err) => {
    if (err) {
      console.error('Error enviando archivo de BD:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'No se pudo descargar la base de datos.' });
      }
    }
  });
});

export default router;

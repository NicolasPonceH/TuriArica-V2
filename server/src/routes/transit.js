import { Router } from 'express';
import { dbOperations } from '../db.js';

const router = Router();

// GET /api/transit - Obtener todas las líneas de transporte público
router.get('/', (req, res) => {
  try {
    const lines = dbOperations.getAllTransit();
    res.json({
      type: "FeatureCollection",
      features: lines
    });
  } catch (err) {
    console.error('[TRANSIT API GET]', err);
    res.status(500).json({ error: 'Error al obtener líneas de transporte.' });
  }
});

// GET /api/transit/:id - Obtener una línea específica
router.get('/:id', (req, res) => {
  try {
    const line = dbOperations.getTransitById(req.params.id);
    if (!line) {
      return res.status(404).json({ error: 'Línea de transporte no encontrada.' });
    }
    res.json(line);
  } catch (err) {
    console.error('[TRANSIT API GET ID]', err);
    res.status(500).json({ error: 'Error al consultar línea.' });
  }
});

// POST /api/transit - Crear o actualizar una línea
router.post('/', (req, res) => {
  try {
    const lineData = req.body;
    if (!lineData) {
      return res.status(400).json({ error: 'Datos de línea requeridos.' });
    }
    const saved = dbOperations.upsertTransit(lineData);
    res.status(201).json(saved);
  } catch (err) {
    console.error('[TRANSIT API POST]', err);
    res.status(500).json({ error: 'Error al guardar línea de transporte.' });
  }
});

// PUT /api/transit/:id - Actualizar una línea existente
router.put('/:id', (req, res) => {
  try {
    const lineData = { ...req.body, id: req.params.id };
    const updated = dbOperations.upsertTransit(lineData);
    res.json(updated);
  } catch (err) {
    console.error('[TRANSIT API PUT]', err);
    res.status(500).json({ error: 'Error al actualizar línea de transporte.' });
  }
});

// DELETE /api/transit/:id - Eliminar una línea
router.delete('/:id', (req, res) => {
  try {
    dbOperations.deleteTransit(req.params.id);
    res.json({ success: true, message: 'Línea de transporte eliminada exitosamente.' });
  } catch (err) {
    console.error('[TRANSIT API DELETE]', err);
    res.status(500).json({ error: 'Error al eliminar línea de transporte.' });
  }
});

export default router;

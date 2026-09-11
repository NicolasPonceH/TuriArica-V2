import { Router } from 'express';
import { dbOperations } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// 1. Obtener eventos y anuncios activos (Público - para modal emergente y campana)
router.get('/active', (req, res) => {
  try {
    const events = dbOperations.getActiveEvents();
    res.json(events);
  } catch (error) {
    console.error('Error al obtener eventos activos:', error);
    res.status(500).json({ error: 'Error al consultar eventos activos.' });
  }
});

// 2. Obtener todos los eventos (Protegido - panel de administración)
router.get('/', requireAuth, (req, res) => {
  try {
    const events = dbOperations.getAllEvents();
    res.json(events);
  } catch (error) {
    console.error('Error al obtener lista de eventos:', error);
    res.status(500).json({ error: 'Error al consultar eventos.' });
  }
});

// 3. Crear nuevo evento o anuncio (Protegido)
router.post('/', requireAuth, (req, res) => {
  try {
    const {
      title, message, type, startDate, endDate, isActive, isPopup,
      bannerUrl, actionUrl, priority, placeId, placeName, discountBadge
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Título y mensaje son obligatorios.' });
    }

    const newEvent = dbOperations.createEvent({
      title,
      message,
      type: type || 'evento',
      startDate,
      endDate,
      isActive,
      isPopup,
      bannerUrl,
      actionUrl,
      priority: Number(priority) || 1,
      placeId: placeId || null,
      placeName: placeName || null,
      discountBadge: discountBadge || null
    });

    res.status(201).json({
      message: 'Evento creado exitosamente.',
      event: newEvent
    });
  } catch (error) {
    console.error('Error al crear evento:', error);
    res.status(500).json({ error: 'Error al registrar el evento en la base de datos.' });
  }
});

// 4. Actualizar evento existente (Protegido)
router.put('/:id', requireAuth, (req, res) => {
  try {
    const id = Number(req.params.id);
    const updated = dbOperations.updateEvent(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Evento no encontrado.' });
    }

    res.json({
      message: 'Evento actualizado exitosamente.',
      event: updated
    });
  } catch (error) {
    console.error('Error al actualizar evento:', error);
    res.status(500).json({ error: 'Error al actualizar el evento.' });
  }
});

// 5. Eliminar evento (Protegido)
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const id = Number(req.params.id);
    dbOperations.deleteEvent(id);
    res.json({ message: 'Evento eliminado correctamente.' });
  } catch (error) {
    console.error('Error al eliminar evento:', error);
    res.status(500).json({ error: 'Error al eliminar el evento.' });
  }
});

export default router;

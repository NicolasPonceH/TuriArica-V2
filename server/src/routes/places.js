import { Router } from 'express';
import { dbOperations } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// 1. Obtener todos los lugares (Público)
router.get('/', async (req, res) => {
  try {
    const places = await dbOperations.getAllPlaces();
    res.json(places);
  } catch (error) {
    console.error('Error al obtener lugares:', error);
    res.status(500).json({ error: 'Error al consultar lugares en la base de datos.' });
  }
});

// 2. Obtener un lugar por ID (Público)
router.get('/:id', async (req, res) => {
  try {
    const place = await dbOperations.getPlaceById(Number(req.params.id));
    if (!place) {
      return res.status(404).json({ error: 'Lugar no encontrado.' });
    }
    res.json(place);
  } catch (error) {
    res.status(500).json({ error: 'Error al consultar el lugar.' });
  }
});

// 3. Crear un nuevo lugar (Protegido Admin)
router.post('/', requireAuth, async (req, res) => {
  try {
    const data = req.body;
    if (!data.name || !data.category || data.lat === undefined || data.lng === undefined) {
      return res.status(400).json({ error: 'Nombre, categoría, latitud y longitud son campos obligatorios.' });
    }

    const newPlace = await dbOperations.createPlace(data);
    res.status(201).json({
      message: 'Lugar creado exitosamente.',
      place: newPlace
    });
  } catch (error) {
    console.error('Error al crear lugar:', error);
    res.status(500).json({ error: 'Error al registrar el lugar en la base de datos.' });
  }
});

// 4. Actualizar un lugar existente (Protegido Admin)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await dbOperations.getPlaceById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Lugar no encontrado.' });
    }

    const updated = await dbOperations.updatePlace(id, req.body);
    res.json({
      message: 'Lugar actualizado exitosamente.',
      place: updated
    });
  } catch (error) {
    console.error('Error al actualizar lugar:', error);
    res.status(500).json({ error: 'Error al actualizar el lugar en la base de datos.' });
  }
});

// 5. Eliminar un lugar (Protegido Admin)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await dbOperations.getPlaceById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Lugar no encontrado.' });
    }

    await dbOperations.deletePlace(id);
    res.json({ message: 'Lugar eliminado correctamente.' });
  } catch (error) {
    console.error('Error al eliminar lugar:', error);
    res.status(500).json({ error: 'Error al eliminar el lugar.' });
  }
});

export default router;

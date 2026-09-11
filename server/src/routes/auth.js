import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { dbOperations } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'turiarica_jwt_secret_token_key_morro_2026';

// 1. Iniciar sesión
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos.' });
    }

    const admin = await dbOperations.findAdminByUsername(username.trim());
    if (!admin) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const isMatch = bcrypt.compareSync(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    // Generar Token JWT (7 días)
    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Inicio de sesión exitoso',
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno al procesar el inicio de sesión.' });
  }
});

// 2. Verificar sesión activa
router.get('/me', requireAuth, async (req, res) => {
  try {
    const admin = await dbOperations.findAdminById(req.admin.id);
    if (!admin) {
      return res.status(404).json({ error: 'Administrador no encontrado.' });
    }
    res.json({ admin });
  } catch (error) {
    console.error('Error al verificar sesión:', error);
    res.status(500).json({ error: 'Error interno al verificar sesión.' });
  }
});

// 3. Cambiar contraseña
router.put('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Debe ingresar la contraseña actual y la nueva contraseña.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
    }

    const admin = await dbOperations.findAdminByUsername(req.admin.username);
    if (!admin || !bcrypt.compareSync(currentPassword, admin.password_hash)) {
      return res.status(400).json({ error: 'La contraseña actual no es correcta.' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    await dbOperations.updateAdminPassword(admin.id, newHash);

    res.json({ message: 'Contraseña actualizada correctamente.' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ error: 'Error interno al actualizar contraseña.' });
  }
});

export default router;

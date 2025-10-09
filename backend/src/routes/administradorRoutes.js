const express = require('express');
const router = express.Router();
const administradorController = require('../controllers/administradorController');
const authMiddleware = require('../middleware/authMiddleware');
const { adminAuth } = require('../middleware/authorizationMiddleware');

// Rota para POST administrador
router.post('/', administradorController.createAdministrador);
// Rota para GET administrador
router.get('/', administradorController.getAllAdministradores);
// Rota para PUT administrador
router.put('/:id', administradorController.updateAdministrador);
// Rota para DELETE administrador
router.delete('/:id', administradorController.deleteAdministrador);
// Rota para GET estatísticas do dashboard
router.get(
  '/dashboard-stats',
  authMiddleware,
  adminAuth,
  administradorController.getDashboardStats
);

module.exports = router;

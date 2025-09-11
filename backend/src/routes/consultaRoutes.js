const express = require('express');
const router = express.Router();
const consultaController = require('../controllers/consultaController');
const authMiddleware = require('../middleware/authMiddleware');

// Rota para POST consultas
router.post('/', authMiddleware, consultaController.createConsulta);
// Rota para GET consultas
router.get('/', authMiddleware, consultaController.getAllConsultas);
// Rota para PUT consultas
router.put('/:id', authMiddleware, consultaController.updateConsulta);
// Rota para DELETE consultas
router.delete('/:id', authMiddleware, consultaController.deleteConsulta);

module.exports = router;
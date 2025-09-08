const express = require('express');
const router = express.Router();
const consultaController = require('../controllers/consultaController');

// Rota para POST consultas
router.post('/', consultaController.createConsulta);
// Rota para GET consultas
router.get('/', consultaController.getAllConsultas);
// Rota para PUT consultas
router.put('/:id', consultaController.updateConsulta);
// Rota para DELETE consultas
router.delete('/:id', consultaController.deleteConsulta);

module.exports = router;
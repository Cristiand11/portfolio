const express = require('express');
const router = express.Router();
const consultaController = require('../controllers/consultaController');
const authMiddleware = require('../middleware/authMiddleware');
const { pacienteAuth } = require('../middleware/authorizationMiddleware');
const { medicoOuAuxiliarAuth } = require('../middleware/authorizationMiddleware');

// Rota para POST consultas
router.post('/', authMiddleware, consultaController.createConsulta);
// Rota para GET consultas
router.get('/', authMiddleware, consultaController.getAllConsultas);
// Rota para PUT consultas
router.put('/:id', authMiddleware, consultaController.updateConsulta);
// Rota para DELETE consultas
router.delete('/:id', authMiddleware, consultaController.deleteConsulta);
// Rota para CANCELAR consultas
router.post('/:id/cancelar', authMiddleware, pacienteAuth, consultaController.cancelarConsulta);
// Rota para o médico/auxiliar marcar uma consulta como concluída
router.post('/:id/concluir', authMiddleware, medicoOuAuxiliarAuth, consultaController.concluirConsulta);

module.exports = router;
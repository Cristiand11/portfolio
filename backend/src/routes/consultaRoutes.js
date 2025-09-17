const express = require('express');
const router = express.Router();
const consultaController = require('../controllers/consultaController');
const authMiddleware = require('../middleware/authMiddleware');

const { consultaViewAuth, medicoOuAuxiliarAuth, medicoOuSeuAuxiliarAuth, pacienteAuth } = require('../middleware/authorizationMiddleware');

// Rota para POST consultas
router.post('/', authMiddleware, consultaController.createConsulta);
// Rota para GET consultas
router.get('/', authMiddleware, consultaViewAuth, consultaController.getAllConsultas);
// Rota para PUT consultas
router.put('/:id', authMiddleware, consultaController.updateConsulta);
// Rota para DELETE consultas
router.delete('/:id', authMiddleware, consultaController.deleteConsulta);
// Rota para o paciente cancelar uma consulta
router.post('/:id/cancelar', authMiddleware, pacienteAuth, consultaController.cancelarConsulta);
// Rota para o médico/auxiliar marcar uma consulta como concluída
router.post('/:id/concluir', authMiddleware, medicoOuAuxiliarAuth, consultaController.concluirConsulta);
// Rota para o médico/auxiliar/paciente confirmar uma solicitação de consulta
router.post('/:id/confirmar', authMiddleware, consultaViewAuth, consultaController.confirmarConsulta);
// Rota para o médico/auxiliar/paciente reprovar uma solicitação de consulta
router.post('/:id/reprovar', authMiddleware, consultaViewAuth, consultaController.reprovarConsulta);
// Rota para solicitar a remarcação de uma consulta
router.post('/:id/solicitar-remarcacao', authMiddleware, consultaViewAuth, consultaController.solicitarRemarcacao);

module.exports = router;
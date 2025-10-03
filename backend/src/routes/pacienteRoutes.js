const express = require('express');
const router = express.Router();
const pacienteController = require('../controllers/pacienteController');
const authMiddleware = require('../middleware/authMiddleware');
const checkAuthMiddleware = require('../middleware/checkAuthMiddleware');

const { adminAuth, pacienteAuth } = require('../middleware/authorizationMiddleware');

// Rota para POST pacientes
router.post('/', checkAuthMiddleware, pacienteController.createPaciente);

// Rota para GET pacientes
// router.get('/', authMiddleware, adminAuth, pacienteController.getAllPacientes);

// Rota para um paciente ver seus próprios dados
router.get('/me', authMiddleware, pacienteAuth, pacienteController.getMe);

// Rota para PUT pacientes
router.put('/:id', authMiddleware, pacienteController.updatePaciente);

// Rota para DELETE pacientes
router.delete('/:id', authMiddleware, adminAuth, pacienteController.deletePaciente);

// Rota para o paciente ver seu histórico de médicos
router.get('/me/medicos', authMiddleware, pacienteAuth, pacienteController.getMedicosConsultados);

module.exports = router;

const express = require('express');
const router = express.Router();
const pacienteController = require('../controllers/pacienteController');
const authMiddleware = require('../middleware/authMiddleware');

const { adminAuth, pacienteAuth } = require('../middleware/authorizationMiddleware');

// Rota para POST pacientes
router.post('/', authMiddleware, pacienteController.createPaciente);

// Rota para GET pacientes
router.get('/', authMiddleware, adminAuth, pacienteController.getAllPacientes);

// Rota para PUT pacientes
router.put('/:id', authMiddleware, pacienteAuth, pacienteController.updatePaciente);

// Rota para DELETE pacientes
router.delete('/:id', authMiddleware, pacienteController.deletePaciente);

module.exports = router;
const express = require('express');
const router = express.Router();
const pacienteController = require('../controllers/pacienteController');

// Rota para POST pacientes
router.post('/', pacienteController.createPaciente);
// Rota para GET pacientes
router.get('/', pacienteController.getAllPacientes);
// Rota para PUT pacientes
router.put('/:id', pacienteController.updatePaciente);
// Rota para DELETE pacientes
router.delete('/:id', pacienteController.deletePaciente);

module.exports = router;
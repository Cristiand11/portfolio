const express = require('express');
const router = express.Router();
const medicoController = require('../controllers/medicoController');

// Rota para GET Medicos
router.get('/', medicoController.getAllMedicos);

// Rota para POST /api/medicos
router.post('/', medicoController.createMedico);

// Rota PUT para atualizar um médico por ID
router.put('/:id', medicoController.updateMedico);

// Rota DELETE para remover um médico por ID
router.delete('/:id', medicoController.deleteMedico);

module.exports = router;
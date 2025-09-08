const express = require('express');
const router = express.Router();
const medicoController = require('../controllers/medicoController');
const authMiddleware = require('../middleware/authMiddleware');

// Rota para GET Medicos
router.get('/', authMiddleware, medicoController.getAllMedicos);

// Rota para POST /api/medicos
router.post('/', authMiddleware, medicoController.createMedico);

// Rota PUT para atualizar um médico por ID
router.put('/:id', authMiddleware, medicoController.updateMedico);

// Rota DELETE para remover um médico por ID
router.delete('/:id',authMiddleware, medicoController.deleteMedico);

module.exports = router;
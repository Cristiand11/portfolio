const express = require('express');
const router = express.Router();
const medicoController = require('../controllers/medicoController');
const authMiddleware = require('../middleware/authMiddleware');

const { adminAuth } = require('../middleware/authorizationMiddleware');

// Rota GET Medicos
router.get('/', authMiddleware, medicoController.getAllMedicos);

// Rota POST /api/medicos
router.post('/', authMiddleware, medicoController.createMedico);

// Rota PUT para atualizar um médico por ID
router.put('/:id', authMiddleware, medicoController.updateMedico);

// Rota DELETE para remover um médico por ID
router.delete('/:id',authMiddleware, medicoController.deleteMedico);

// Rota POST para um admin solicitar a inativação de um médico por ID
router.post('/:id/solicitar-inativacao', authMiddleware, adminAuth, medicoController.solicitarInativacao);

// Rota POST para um admin reverter a solicitação de inativação de um médico
router.post('/:id/reverter-inativacao', authMiddleware, adminAuth, medicoController.reverterInativacao);

module.exports = router;
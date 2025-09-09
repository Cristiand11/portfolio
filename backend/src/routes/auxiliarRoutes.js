const express = require('express');
const router = express.Router();
const auxiliarController = require('../controllers/auxiliarController');
const authMiddleware = require('../middleware/authMiddleware');
const { medicoAuth } = require('../middleware/authorizationMiddleware');

// Rota para POST Auxiliares
router.post('/', authMiddleware, medicoAuth, auxiliarController.createAuxiliar);
// Rota para GET Auxiliares
router.get('/', authMiddleware, medicoAuth, auxiliarController.getAllAuxiliares);
// Rota para PUT Auxiliares
router.put('/:id', authMiddleware, medicoAuth, auxiliarController.updateAuxiliar);
// Rota para DELETE Auxiliares
router.delete('/:id', authMiddleware, medicoAuth, auxiliarController.deleteAuxiliar);

module.exports = router;
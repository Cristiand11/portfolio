const express = require('express');
const router = express.Router();
const auxiliarController = require('../controllers/auxiliarController');
const authMiddleware = require('../middleware/authMiddleware');

const {
  auxiliarAuth,
  auxiliarUpdateAuth,
  medicoAuth,
  pacienteAuth,
} = require('../middleware/authorizationMiddleware');

// Rota para POST Auxiliares
router.post('/', authMiddleware, medicoAuth, auxiliarController.createAuxiliar);
// Rota para o auxiliar logado buscar seus próprios dados
router.get('/me', authMiddleware, auxiliarAuth, auxiliarController.getMe);
// Rota para GET Auxiliares
router.get('/', authMiddleware, pacienteAuth, auxiliarController.getAllAuxiliares);
// Rota para PUT Auxiliares
router.put('/:id', authMiddleware, auxiliarUpdateAuth, auxiliarController.updateAuxiliar);
// Rota para deletar um único auxiliar
router.delete('/:id', authMiddleware, auxiliarUpdateAuth, auxiliarController.deleteAuxiliar);
// Rota para deletar múltiplos auxiliares
router.delete('/', authMiddleware, medicoAuth, auxiliarController.deleteVariosAuxiliares);

module.exports = router;

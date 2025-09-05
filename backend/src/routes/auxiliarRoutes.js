const express = require('express');
const router = express.Router();
const auxiliarController = require('../controllers/auxiliarController');

// Rota para POST Auxiliares
router.post('/', auxiliarController.createAuxiliar);
// Rota para GET Auxiliares
router.get('/', auxiliarController.getAllAuxiliares);
// Rota para PUT Auxiliares
router.put('/:id', auxiliarController.updateAuxiliar);
// Rota para DELETE Auxiliares
router.delete('/:id', auxiliarController.deleteAuxiliar);

module.exports = router;
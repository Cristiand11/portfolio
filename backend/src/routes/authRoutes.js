const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Rota para o usuário fazer o login
router.post('/login', authController.login);

// Rota para o usuário solicitar a redefinição de senha
router.post('/forgot-password', authController.forgotPassword);

// Rota para o usuário enviar a nova senha com o token
router.post('/reset-password', authController.resetPassword);

module.exports = router;
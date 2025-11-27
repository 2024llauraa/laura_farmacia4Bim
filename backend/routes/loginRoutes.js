const express = require('express');
const router = express.Router();
// const authController = require('../controllers/authController');
const loginController = require('../controllers/loginController');

// Rotas de autenticação
//router.post('/verificarEmail', authController.verificarEmail);
//router.post('/login', authController.login);
//router.post('/verificarLogin', authController.verificarLogin);
router.post('/registro', loginController.registro);
//router.post('/verificarSenha', authController.login);

// Rotas de logout e CRUD
//router.post('/logout', authController.logout);
router.get('/', loginController.listarPessoas);
router.post('/', loginController.criarPessoa);
router.get('/:id', loginController.obterPessoa);
//router.put('/:id', loginController.atualizarPessoa);
//router.delete('/:id', loginController.deletarPessoa);

module.exports = router;
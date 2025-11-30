const express = require('express');
const router = express.Router();
// const authController = require('../controllers/authController');
const loginController = require('../controllers/loginController');


router.post('/login', loginController.login);
router.post('/registro', loginController.registro);
router.post('/verificarLogin', loginController.verificarLogin);
//router.post('/verificarSenha', authController.login);

// Rotas de logout e CRUD
router.post('/logout', loginController.logout);
router.get('/', loginController.listarPessoas);
router.post('/', loginController.criarPessoa);
//router.get('/:id', loginController.obterPessoa);
//router.put('/:id', loginController.atualizarPessoa);
//router.delete('/:id', loginController.deletarPessoa);

module.exports = router;
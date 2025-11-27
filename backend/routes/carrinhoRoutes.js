const express = require('express');
const router = express.Router();
const carrinhoController = require('../controllers/carrinhoController');
const path = require('path');

// Rota para abrir a página do carrinho
router.get('/abrirCarrinho', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/carrinho/carrinho.html'));
});

// Rotas da API do carrinho
router.get('/formas-pagamento', carrinhoController.getFormasPagamento);
router.get('/usuario', carrinhoController.getCpfUsuario);
router.get('/historico-pedidos', carrinhoController.getHistoricoPedidos);
router.post('/finalizar', carrinhoController.finalizarPedido);
router.post('/pagamento', carrinhoController.processarPagamento);
router.get('/pedido/:id', carrinhoController.getPedido);
router.get('/pedidos', carrinhoController.listarPedidos);

module.exports = router;
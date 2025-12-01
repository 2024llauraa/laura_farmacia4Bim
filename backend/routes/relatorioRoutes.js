const express = require('express');
const router = express.Router();
const relatorioController = require('../controllers/relatorioController');

// Rota para o relatório de vendas do mês (altas e baixas)
router.get('/vendas-mes', relatorioController.getRelatorioVendasMes);

// Rota para os produtos mais vendidos com filtro de período
// Exemplo: /relatorio/produtos-mais-vendidos?periodo=semana
router.get('/produtos-mais-vendidos', relatorioController.getProdutosMaisVendidos);

module.exports = router;
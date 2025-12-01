// controllers/carrinhoController.js
const db = require('../database.js');

// ================================
// Buscar todas as formas de pagamento
// ================================
exports.getFormasPagamento = async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id_forma_pagamento, nome_forma_pagamento FROM forma_pagamento ORDER BY nome_forma_pagamento'
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar formas de pagamento:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            message: 'Não foi possível carregar as formas de pagamento'
        });
    }
};

// ================================
// Obter CPF do usuário logado via cookie
// ================================
exports.getCpfUsuario = (req, res) => {
    const cpf = req.cookies.cpfUsuario;
    const nome = req.cookies.usuarioLogado;
    
    if (cpf && nome) {
        res.json({ status: 'ok', cpf, nome });
    } else {
        res.json({ status: 'nao_logado' });
    }
};

// ================================
// Listar histórico de pedidos do usuário logado
// ================================
exports.getHistoricoPedidos = async (req, res) => {
    const cpf = req.cookies.cpfUsuario;

    if (!cpf) {
        return res.status(401).json({
            error: 'Não autorizado',
            message: 'Usuário não logado'
        });
    }

    try {
        const result = await db.query(
            `SELECT 
                p.id_pedido,
                p.data_pedido,
                SUM(php.quantidade * php.preco_unitario) AS valor_total,
                CASE 
                    WHEN pg.pedido_id_pedido IS NOT NULL THEN 'Pago'
                    ELSE 'Pendente'
                END as status_pagamento
             FROM pedido p
             JOIN pedido_has_produto php ON p.id_pedido = php.pedido_id_pedido
             LEFT JOIN pagamento pg ON p.id_pedido = pg.pedido_id_pedido
             WHERE p.cliente_pessoa_cpf_pessoa = $1
             GROUP BY p.id_pedido, p.data_pedido, pg.pedido_id_pedido
             ORDER BY p.data_pedido DESC, p.id_pedido DESC`,
            [cpf]
        );

        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar histórico de pedidos:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            message: 'Não foi possível buscar o histórico de pedidos'
        });
    }
};
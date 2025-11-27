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
// Finalizar pedido: criar pedido e salvar itens
// ================================
exports.finalizarPedido = async (req, res) => {
    try {
        const { cpf, itens, valor_total } = req.body;

        if (!cpf || !itens || itens.length === 0) {
            return res.status(400).json({
                error: 'Dados incompletos',
                message: 'CPF e itens são obrigatórios'
            });
        }

        const id_pedido = await db.transaction(async (client) => {
            // 1. Cria o pedido
            const pedidoResult = await client.query(
                'INSERT INTO pedido (data_pedido, cliente_pessoa_cpf_pessoa) VALUES (CURRENT_DATE, $1) RETURNING id_pedido',
                [cpf]
            );
            const id = pedidoResult.rows[0].id_pedido;

            // 2. Insere os itens do pedido na tabela pedido_has_produto
            for (const item of itens) {
                await client.query(
                    'INSERT INTO pedido_has_produto (produto_id_produto, pedido_id_pedido, quantidade, preco_unitario) VALUES ($1, $2, $3, $4)',
                    [item.id_produto, id, item.quantidade, item.preco_unitario]
                );
            }
            return id;
        });

        res.status(201).json({
            success: true,
            message: 'Pedido criado com sucesso',
            id_pedido
        });
    } catch (error) {
        console.error('Erro ao finalizar pedido:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            message: 'Não foi possível finalizar o pedido'
        });
    }
};

// ================================
// Processar pagamento
// ================================
exports.processarPagamento = async (req, res) => {
    try {
        const { id_pedido, id_forma_pagamento, valor_total } = req.body;

        if (!id_pedido || !id_forma_pagamento || !valor_total) {
            return res.status(400).json({
                error: 'Dados incompletos',
                message: 'ID do pedido, forma de pagamento e valor são obrigatórios'
            });
        }

        await db.transaction(async (client) => {
            // 1. Insere pagamento
            await client.query(
                'INSERT INTO pagamento (pedido_id_pedido, data_pagamento, valor_total_pagamento) VALUES ($1, CURRENT_TIMESTAMP, $2)',
                [id_pedido, valor_total]
            );

            // 2. Insere relacionamento com forma de pagamento
            await client.query(
                'INSERT INTO pagamento_has_forma_pagamento (pagamento_id_pedido, forma_pagamento_id_forma_pagamento, valor_pago) VALUES ($1, $2, $3)',
                [id_pedido, id_forma_pagamento, valor_total]
            );
        });

        res.status(201).json({
            success: true,
            message: 'Pagamento processado com sucesso',
            id_pedido,
            valor_pago: valor_total
        });
    } catch (error) {
        console.error('Erro ao processar pagamento:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            message: 'Não foi possível processar o pagamento'
        });
    }
};

// ================================
// Buscar detalhes de um pedido
// ================================
exports.getPedido = async (req, res) => {
    try {
        const { id } = req.params;

        const pedidoResult = await db.query(
            'SELECT id_pedido, cliente_pessoa_cpf_pessoa, data_pedido FROM pedido WHERE id_pedido = $1',
            [id]
        );

        if (pedidoResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Pedido não encontrado',
                message: 'O pedido solicitado não existe'
            });
        }

        const itensResult = await db.query(
            `SELECT php.produto_id_produto, php.quantidade, php.preco_unitario, pr.nome_produto
             FROM pedido_has_produto php
             LEFT JOIN produto pr ON php.produto_id_produto = pr.id_produto
             WHERE php.pedido_id_pedido = $1`,
            [id]
        );

        res.status(200).json({
            ...pedidoResult.rows[0],
            itens: itensResult.rows
        });
    } catch (error) {
        console.error('Erro ao buscar pedido:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            message: 'Não foi possível buscar o pedido'
        });
    }
};

// ================================
// Listar todos os pedidos
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

// ================================
// Listar todos os pedidos
// ================================
exports.listarPedidos = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT 
                p.id_pedido,
                p.cliente_pessoa_cpf_pessoa,
                p.data_pedido,
                CASE 
                    WHEN pg.pedido_id_pedido IS NOT NULL THEN 'Pago'
                    ELSE 'Pendente'
                END as status_pagamento
             FROM pedido p
             LEFT JOIN pagamento pg ON p.id_pedido = pg.pedido_id_pedido
             ORDER BY p.data_pedido DESC, p.id_pedido DESC`
        );

        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao listar pedidos:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            message: 'Não foi possível listar os pedidos'
        });
    }
};
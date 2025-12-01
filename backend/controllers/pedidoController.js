//import { query } from '../database.js';
const { pool, query } = require('../database');
// Funções do controller

const path = require('path');

exports.abrirCrudPedido = (req, res) => {
  // console.log('pedidoController - Rota /abrirCrudPedido - abrir o crudPedido');
  res.sendFile(path.join(__dirname, '../../frontend/pedido/pedido.html'));
}

exports.listarPedidos = async (req, res) => {
  try {
    const result = await query('SELECT * FROM pedido ORDER BY id_pedido');
    //  console.log('Resultado do SELECT:', result.rows);//verifica se está retornando algo
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}


exports.criarPedido = async (req, res) => {
  console.log('Criando pedido com dados:', req.body);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { valor_total, id_forma_pagamento, itens } = req.body;
    const cpfCliente = req.cookies.cpfUsuario; // Assume que o CPF do cliente está no cookie
    const data_pedido = new Date().toISOString();

    if (!cpfCliente) {
      await client.query('ROLLBACK');
      return res.status(401).json({ error: 'Usuário não logado ou CPF não encontrado.' });
    }

    // 1. Inserir o Pedido
    const pedidoSql = `
      INSERT INTO pedido (data_pedido, cliente_pessoa_cpf_pessoa)
      VALUES ($1, $2) RETURNING id_pedido;
    `;
    const pedidoResult = await client.query(pedidoSql, [data_pedido, cpfCliente]);
    const id_pedido = pedidoResult.rows[0].id_pedido;

    // 2. Inserir os Itens do Pedido
    for (const item of itens) {
      const itemSql = `
        INSERT INTO pedido_has_produto (pedido_id_pedido, produto_id_produto, quantidade, preco_unitario)
        VALUES ($1, $2, $3, $4);
      `;
      await client.query(itemSql, [id_pedido, item.id_produto, item.quantidade, item.preco_unitario]);
    }
    
    // 3. Inserir o Pagamento
    const pagamentoSql = `
      INSERT INTO pagamento (pedido_id_pedido, data_pagamento, valor_total_pagamento)
      VALUES ($1, CURRENT_TIMESTAMP, $2);
    `;
    await client.query(pagamentoSql, [id_pedido, valor_total]);

    // 4. Inserir o relacionamento Pagamento_has_Forma_Pagamento
    const pagFormaSql = `
      INSERT INTO pagamento_has_forma_pagamento (pagamento_id_pedido, forma_pagamento_id_forma_pagamento, valor_pago)
      VALUES ($1, $2, $3);
    `;
    await client.query(pagFormaSql, [id_pedido, id_forma_pagamento, valor_total]);

    await client.query('COMMIT');
    res.status(201).json({ id_pedido, message: 'Pedido criado com sucesso.' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar pedido:', error);

    if (error.code === '23502') {
      return res.status(400).json({
        error: 'Dados obrigatórios não fornecidos'
      });
    }
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Chave estrangeira inválida (cliente, forma de pagamento ou produto não existe).'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor ao processar pedido.' });
  } finally {
    client.release();
  }
}

exports.obterPedido = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // console.log("estou no obter pedido id="+ id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    const result = await query(
      'SELECT * FROM pedido WHERE id_pedido = $1',
      [id]
    );

    //console.log(result)

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.atualizarPedido = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

    const { data_pedido, cliente_pessoa_cpf_pessoa, funcionario_pessoa_cpf_pessoa } = req.body;

    // Verifica se o pedido existe
    const existing = await query('SELECT * FROM pedido WHERE id_pedido = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    // Atualiza o pedido
    const sql = `
      UPDATE pedido
      SET data_pedido = $1,
          cliente_pessoa_cpf_pessoa = $2,
          funcionario_pessoa_cpf_pessoa = $3
      WHERE id_pedido = $4
      RETURNING *
    `;
    const values = [data_pedido, cliente_pessoa_cpf_pessoa, funcionario_pessoa_cpf_pessoa, id];

    const updateResult = await query(sql, values);
    return res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};


exports.deletarPedido = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Verifica se a pedido existe
    const existingPersonResult = await query(
      'SELECT * FROM pedido WHERE id_pedido = $1',
      [id]
    );

    if (existingPersonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrada' });
    }

    // Deleta a pedido (as constraints CASCADE cuidarão das dependências)
    await query(
      'DELETE FROM pedido WHERE id_pedido = $1',
      [id]
    );

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar pedido:', error);

    // Verifica se é erro de violação de foreign key (dependências)
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Não é possível deletar pedido com dependências associadas'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
//import { query } from '../database.js';
const { query } = require('../database');
// Funções do controller

const path = require('path');

exports.abrirCrudProduto = (req, res) => {
 // console.log('produtoController - Rota /abrirCrudProduto - abrir o crudProduto');
  res.sendFile(path.join(__dirname, '../../frontend/produto/produto.html'));
}

exports.listarProdutos = async (req, res) => {
  try {
    const result = await query('SELECT * FROM produto ORDER BY id_produto');
   //  console.log('Resultado do SELECT:', result.rows);//verifica se está retornando algo
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}


exports.criarProduto = async (req, res) => {
  try {
    const { id_produto, nome_produto, quantidade_estoque_produto, preco_unitario_produto, categoria_id_categoria} = req.body;

    if (!nome_produto) {
      return res.status(400).json({ error: 'O nome do produto é obrigatório' });
    }

    const result = await query(
      `INSERT INTO produto 
       (id_produto, nome_produto, quantidade_estoque_produto, preco_unitario_produto, categoria_id_categoria)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id_produto, nome_produto, quantidade_estoque_produto, preco_unitario_produto, categoria_id_categoria]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.obterProduto = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

   // console.log("estou no obter produto id="+ id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    const result = await query(
      'SELECT * FROM produto WHERE id_produto = $1',
      [id]
    );

    //console.log(result)

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.atualizarProduto = async (req, res) => {
  console.log("produtoController - Rota /produto/:id - atualizar produto");

  try {
    const id = parseInt(req.params.id);
    const {
      nome_produto,
      quantidade_estoque_produto,
      preco_unitario_produto,
      categoria_id_categoria// 👈 campo da categoria adicionado
    } = req.body;

    // Verificação básica de dados obrigatórios
    if (!nome_produto) {
      return res.status(400).json({ error: 'O nome do produto é obrigatório' });
    }

    // Atualiza o produto no banco de dados
    const result = await query(
      `UPDATE produto
       SET nome_produto = $1,
           quantidade_estoque_produto = $2,
           preco_unitario_produto = $3,
           categoria_id_categoria= $4
       WHERE id_produto = $5
       RETURNING *`,
      [nome_produto, quantidade_estoque_produto, preco_unitario_produto, categoria_id_categoria, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    console.log("Produto atualizado com sucesso:", result.rows[0]);
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};



exports.deletarProduto = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Verifica se a produto existe
    const existingPersonResult = await query(
      'SELECT * FROM produto WHERE id_produto = $1',
      [id]
    );

    if (existingPersonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrada' });
    }

    // Deleta a produto (as constraints CASCADE cuidarão das dependências)
    await query(
      'DELETE FROM produto WHERE id_produto = $1',
      [id]
    );

    // Fazemos isso APÓS a exclusão do DB. Se o DB falhar, não apagamos o arquivo.
    // Usamos o ID do produto para encontrar o arquivo nomeado como 'id.png'
    await deletarImagemProduto(id);

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar produto:', error);

    // Verifica se é erro de violação de foreign key (dependências)
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Não é possível deletar produto com dependências associadas'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

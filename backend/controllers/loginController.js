const db = require('../database.js');
const bcrypt = require('bcryptjs');

// Funções do controller
exports.listarPessoas = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM pessoa ORDER BY id_pessoa');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar pessoas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};


exports.criarPessoa = async (req, res) => {
  console.log('Criando pessoa com dados:', req.body);
  try {
    const { cpf_pessoa, nome_pessoa, email_pessoa, senha_pessoa, data_nascimento_pessoa, endereco_pessoa } = req.body;
    
    // Criptografar a senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(senha_pessoa, salt);

    // Validação básica
    if (!cpf_pessoa || !nome_pessoa || !email_pessoa || !senha_pessoa) {
      return res.status(400).json({
        error: 'CPF, nome, email e senha são obrigatórios'
      });
    }

    // Validação de email básica
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email_pessoa)) {
      return res.status(400).json({
        error: 'Formato de email inválido'
      });
    }

    const result = await db.query(
      'INSERT INTO pessoa (cpf_pessoa, nome_pessoa, email_pessoa, senha_pessoa, data_nascimento_pessoa, endereco_pessoa) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [cpf_pessoa, nome_pessoa, email_pessoa, hashedPassword, data_nascimento_pessoa, endereco_pessoa]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar pessoa:', error);

    // Verifica se é erro de email duplicado (constraint unique violation)
    if (error.code === '23505' && error.constraint === 'pessoa_email_pessoa_key') {
      return res.status(400).json({
        error: 'Email já está em uso'
      });
    }

    // Verifica se é erro de violação de constraint NOT NULL
    if (error.code === '23502') {
      return res.status(400).json({
        error: 'Dados obrigatórios não fornecidos'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.obterPessoa = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'loginController-obterPessoa - ID deve ser um número válido' });
    }

    const result = await db.query(
      'SELECT * FROM pessoa WHERE id_pessoa = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter pessoa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
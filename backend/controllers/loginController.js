const db = require('../database.js');
const bcrypt = require('bcryptjs');

exports.registro = async (req, res) => {
  console.log("vai - loginController -> registro")
  console.log(req.body)
  const {
    cpf_pessoa, nome_pessoa,data_nascimento_pessoa, endereco_pessoa, email_pessoa, senha_pessoa
  } = req.body;

  console.log('📝 Tentativa de registro:', { email_pessoa, cpf_pessoa });

  // Validações básicas
  if (!nome_pessoa || !email_pessoa || !senha_pessoa) {
    return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
  }

  if (!cpf_pessoa || cpf_pessoa.length !== 11) {
    return res.status(400).json({ error: 'CPF deve ter 11 dígitos.' });
  }

  if (senha_pessoa.length > 20) {
    return res.status(400).json({ error: 'Senha deve ter no máximo 20 caracteres.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email_pessoa)) {
    return res.status(400).json({ error: 'Formato de email inválido.' });
  }

  try {
    // Verificar se CPF ou email já existem
    const checkUser = await db.query(
      'SELECT cpf_pessoa, email_pessoa FROM pessoa WHERE cpf_pessoa = $1 OR email_pessoa = $2',
      [cpf_pessoa, email_pessoa]
    );

    if (checkUser.rows.length > 0) {
      if (checkUser.rows[0].cpf_pessoa === cpf_pessoa) {
        return res.status(400).json({ error: 'CPF já cadastrado.' });
      }
      if (checkUser.rows[0].email_pessoa === email_pessoa) {
        return res.status(400).json({ error: 'E-mail já cadastrado.' });
      }
    }

    // Criptografar a senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(senha_pessoa, salt);

    // Inserir pessoa
    const resultPessoa = await db.query(
      `INSERT INTO pessoa (cpf_pessoa, nome_pessoa,email_pessoa, senha_pessoa)
       VALUES ($1, $2, $3, $4)
       RETURNING cpf_pessoa, nome_pessoa, email_pessoa`,
      [cpf_pessoa, nome_pessoa, email_pessoa, hashedPassword] // Usar a senha criptografada
    );

    const user = resultPessoa.rows[0];

    // Inserir cliente
    await db.query(
      'INSERT INTO cliente (cpf_pessoa) VALUES ($1)',
      [cpf_pessoa]
    );

    console.log('✅ Usuário registrado:', user.email_pessoa);

    // Criar cookie de sessão
    res.cookie('usuarioLogado', user.nome_pessoa, {
      sameSite: 'None',
      secure: true,
      httpOnly: true,
      path: '/',
      maxAge: 24 * 60 * 60 * 1000, // 1 dia
    });

    res.cookie('usuarioCpf', user.cpf_pessoa, {
      sameSite: 'None',
      secure: true,
      httpOnly: true,
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      message: 'Usuário registrado com sucesso.',
      user: {
        cpf: user.cpf_pessoa,
        nome: user.nome_pessoa,
        email: user.email_pessoa
      },
      logged: true
    });

  } catch (err) {
    console.error('❌ Erro no registro:', err);
    res.status(500).json({ error: 'Erro ao registrar usuário.' });
  }
}


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
const db = require('../database.js');
// const bcrypt = require('bcryptjs'); // Removido conforme solicitação do usuário

// Função de Login
exports.login = async (req, res) => {
  const { email_cpf, senha_pessoa } = req.body;

  if (!email_cpf || !senha_pessoa) {
    return res.status(400).json({ error: 'E-mail/CPF e senha são obrigatórios.' });
  }

  try {
    // Tenta encontrar a pessoa por email ou CPF
    const result = await db.query(
      'SELECT p.cpf_pessoa, p.nome_pessoa, p.email_pessoa, p.senha_pessoa, CASE WHEN f.pessoa_cpf_pessoa IS NOT NULL THEN TRUE ELSE FALSE END AS is_funcionario FROM pessoa p LEFT JOIN funcionario f ON p.cpf_pessoa = f.pessoa_cpf_pessoa WHERE p.email_pessoa = $1 OR p.cpf_pessoa = $1',
      [email_cpf]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const user = result.rows[0];

    // Compara a senha fornecida com a senha no banco de dadoso
    const isMatch = senha_pessoa === user.senha_pessoa;

    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    // Configura os cookies de sessão
    res.cookie('usuarioLogado', user.nome_pessoa, {
      httpOnly: true,
      path: '/',
      maxAge: 24 * 60 * 60 * 1000, // 1 dia
    });

    res.cookie('cpfUsuario', user.cpf_pessoa, {
      httpOnly: true,
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      message: 'Login bem-sucedido.',
      user: {
        cpf: user.cpf_pessoa,
        nome: user.nome_pessoa,
        email: user.email_pessoa, is_funcionario: user.is_funcionario
      },
      logged: true
    });

  } catch (err) {
    console.error('❌ Erro no login:', err);
    res.status(500).json({ error: 'Erro ao realizar login.' });
  }
};

// Função para verificar se o usuário está logado
exports.verificarLogin = (req, res) => {
  if (req.cookies.usuarioLogado && req.cookies.cpfUsuario) {
    res.json({
      logged: true,
      nome: req.cookies.usuarioLogado,
      cpf: req.cookies.cpfUsuario
    });
  } else {
    res.json({ logged: false });
  }
};

// Função de Logout
exports.logout = (req, res) => {
  res.clearCookie('usuarioLogado', { path: '/' });
  res.clearCookie('cpfUsuario', { path: '/' });
  res.json({ message: 'Logout bem-sucedido.' });
};

exports.registro = async (req, res) => {
  console.log("vai - loginController -> registro");
  console.log("Dados que vieram via requisição");
  console.log(req.body);



  const {
    cpf_pessoa, nome_pessoa,data_nascimento_pessoa, endereco_pessoa, email_pessoa, senha_pessoa
  } = req.body;

 
  // Validações básicas
  if (!nome_pessoa || !email_pessoa || !senha_pessoa) {
    return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
  }

  // Validação de CPF (11 dígitos)
    const cpfLimpo = cpf_pessoa ? cpf_pessoa.replace(/[^0-9]/g, '') : '';
    if (cpfLimpo.length !== 11) {
      return res.status(400).json({ error: 'CPF incorreto. Deve conter 11 dígitos.' });
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

   // Senha não hasheada, conforme solicitado pelo usuário // Inserir pessoa
    const resultPessoa = await db.query(
      `INSERT INTO pessoa (cpf_pessoa, nome_pessoa,email_pessoa, senha_pessoa,data_nascimento_pessoa,endereco_pessoa)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING cpf_pessoa, nome_pessoa,email_pessoa, senha_pessoa,data_nascimento_pessoa,endereco_pessoa`,
      [cpf_pessoa, nome_pessoa,email_pessoa, senha_pessoa,data_nascimento_pessoa,endereco_pessoa] // Usar a senha não hasheada
    );

    console.log("chegou aqui");
    
    const user = resultPessoa.rows[0];

    // Inserir cliente
    await db.query(
      'INSERT INTO cliente (pessoa_cpf_pessoa) VALUES ($1)',
      [cpf_pessoa]
    );

    console.log('✅ Usuário registrado:', user.email_pessoa);

    // Criar cookie de sessão
    res.cookie('usuarioLogado', user.nome_pessoa, {
      httpOnly: true,
      path: '/',
      maxAge: 24 * 60 * 60 * 1000, // 1 dia
    });

    res.cookie('cpfUsuario', user.cpf_pessoa, {
      httpOnly: true,
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      message: 'Usuário registrado com sucesso.',
      user: {
        cpf: user.cpf_pessoa,
        nome: user.nome_pessoa,
        email: user.email_pessoa, is_funcionario: user.is_funcionario
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
// Senha não hasheada, conforme solicitado pelo usuário
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
      [cpf_pessoa, nome_pessoa, email_pessoa, senha_pessoa, data_nascimento_pessoa, endereco_pessoa]
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
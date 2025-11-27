const db = require('../database');
const bcrypt = require('bcryptjs');
// No início do arquivo authController.js, adicione esta linha:

// ======================================
// REGISTRO DE NOVO USUÁRIO
// ======================================
exports.registro = async (req, res) => {

  console.log("authController -> registro ----------------------------------------");
  // const {
  //   cpf_pessoa, nome_pessoa, email_pessoa, senha_pessoa, data_nascimento_pessoa, endereco_pessoa
  // } = req.body;

  // console.log('📝 Tentativa de registro:', { email_pessoa, cpf_pessoa });

  // // Validações básicas
  // if (!nome_pessoa || !email_pessoa || !senha_pessoa) {
  //   return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
  // }

  // if (!cpf_pessoa || cpf_pessoa.length !== 11) {
  //   return res.status(400).json({ error: 'CPF deve ter 11 dígitos.' });
  // }

  // if (senha_pessoa.length > 20) {
  //   return res.status(400).json({ error: 'Senha deve ter no máximo 20 caracteres.' });
  // }

  // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // if (!emailRegex.test(email_pessoa)) {
  //   return res.status(400).json({ error: 'Formato de email inválido.' });
  // }

  // try {
  //   // Verificar se CPF ou email já existem
  //   const checkUser = await db.query(
  //     'SELECT cpf_pessoa, email_pessoa FROM pessoa WHERE cpf_pessoa = $1 OR email_pessoa = $2',
  //     [cpf_pessoa, email_pessoa]
  //   );

  //   if (checkUser.rows.length > 0) {
  //     if (checkUser.rows[0].cpf_pessoa === cpf_pessoa) {
  //       return res.status(400).json({ error: 'CPF já cadastrado.' });
  //     }
  //     if (checkUser.rows[0].email_pessoa === email_pessoa) {
  //       return res.status(400).json({ error: 'E-mail já cadastrado.' });
  //     }
  //   }

  //   // Criptografar a senha
  //   const salt = await bcrypt.genSalt(10);
  //   const hashedPassword = await bcrypt.hash(senha_pessoa, salt);

  //   // Inserir pessoa
  //   const resultPessoa = await db.query(
  //     `INSERT INTO pessoa (cpf_pessoa, nome_pessoa,email_pessoa, senha_pessoa)
  //      VALUES ($1, $2, $3, $4)
  //      RETURNING cpf_pessoa, nome_pessoa, email_pessoa`,
  //     [cpf_pessoa, nome_pessoa, email_pessoa, hashedPassword] // Usar a senha criptografada
  //   );

  //   const user = resultPessoa.rows[0];

  //   // Inserir cliente
  //   await db.query(
  //     'INSERT INTO cliente (cpf_pessoa) VALUES ($1)',
  //     [cpf_pessoa]
  //   );

  //   console.log('✅ Usuário registrado:', user.email_pessoa);

  //   // Criar cookie de sessão
  //   res.cookie('usuarioLogado', user.nome_pessoa, {
  //     sameSite: 'None',
  //     secure: true,
  //     httpOnly: true,
  //     path: '/',
  //     maxAge: 24 * 60 * 60 * 1000, // 1 dia
  //   });

  //   res.cookie('usuarioCpf', user.cpf_pessoa, {
  //     sameSite: 'None',
  //     secure: true,
  //     httpOnly: true,
  //     path: '/',
  //     maxAge: 24 * 60 * 60 * 1000,
  //   });

  //   res.json({
  //     message: 'Usuário registrado com sucesso.',
  //     user: {
  //       cpf: user.cpf_pessoa,
  //       nome: user.nome_pessoa,
  //       email: user.email_pessoa
  //     },
  //     logged: true
  //   });

  // } catch (err) {
  //   console.error('❌ Erro no registro:', err);
  //   res.status(500).json({ error: 'Erro ao registrar usuário.' });
  // }
};

// ======================================
// LOGIN
// ======================================
exports.login = async (req, res) => {
  const { email_usuario, senha_usuario } = req.body;

  console.log('🔐 Tentativa de login:', email_usuario);

  if (!email_usuario || !senha_usuario) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  try {
    // Buscar pessoa e verificar se é funcionário
    const resultPessoa = await db.query(
      `SELECT p.cpf_pessoa, p.nome_pessoa, p.email_pessoa, p.senha_pessoa,
              f.cpf_pessoa as is_funcionario, c.nome_cargo
       FROM pessoa p
       LEFT JOIN funcionario f ON p.cpf_pessoa = f.cpf_pessoa
       LEFT JOIN cargo c ON f.id_cargo = c.id_cargo
       WHERE p.email_pessoa = $1`,
      [email_usuario]
    );

    if (resultPessoa.rows.length === 0) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }

    const user = resultPessoa.rows[0];

    // Verificar senha (agora com bcrypt)
    const isMatch = await bcrypt.compare(senha_usuario, user.senha_pessoa);

    if (!isMatch) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }

    console.log('✅ Login bem-sucedido:', user.email_pessoa);

    // Criar cookies
    res.cookie('usuarioLogado', user.nome_pessoa, {
      sameSite: 'None',
      secure: true,
      httpOnly: true,
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.cookie('usuarioCpf', user.cpf_pessoa, {
      sameSite: 'None',
      secure: true,
      httpOnly: true,
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      message: 'Login efetuado com sucesso.',
      user: {
        cpf: user.cpf_pessoa,
        nome: user.nome_pessoa,
        email: user.email_pessoa,
        is_funcionario: !!user.is_funcionario,
        cargo: user.nome_cargo || null
      },
      logged: true
    });

  } catch (err) {
    console.error('❌ Erro no login:', err);
    res.status(500).json({ error: 'Erro ao efetuar login.' });
  }
};

// ======================================
// VERIFICAR SE ESTÁ LOGADO
// ======================================
exports.verificarLogin = async (req, res) => {
  const nome_pessoa = req.cookies.usuarioLogado;
  const cpf_pessoa = req.cookies.usuarioCpf;

  console.log('🔍 Verificando login:', { nome, cpf_pessoa });

  if (!nome_pessoa || !cpf_pessoa) {
    return res.json({ logged: false });
  }

  try {
    // Verificar se o usuário ainda existe no banco
    const result = await db.query(
      `SELECT p.cpf_pessoa, p.nome_pessoa, p.email_pessoa,
              f.cpf_pessoa as is_funcionario, c.nome_cargo
       FROM pessoa p
       LEFT JOIN funcionario f ON p.cpf_pessoa = f.cpf_pessoa
       LEFT JOIN cargo c ON f.id_cargo = c.id_cargo
       WHERE p.cpf_pessoa = $1`,
      [cpf_pessoa]
    );

    if (result.rows.length === 0) {
      // Usuário não existe mais, limpar cookies
      res.clearCookie('usuarioLogado', {
        sameSite: 'None',
        secure: true,
        httpOnly: true,
        path: '/',
      });
      res.clearCookie('usuarioCpf', {
        sameSite: 'None',
        secure: true,
        httpOnly: true,
        path: '/',
      });
      return res.json({ logged: false });
    }

    const user = result.rows[0];

    res.json({
      logged: true,
      cpf_pessoa: user.cpf_pessoa,
      nome: user.nome_pessoa,
      email: user.email_pessoa,
      is_funcionario: !!user.is_funcionario,
      cargo: user.nome_cargo || null
    });

  } catch (err) {
    console.error('❌ Erro ao verificar login:', err);
    res.status(500).json({ error: 'Erro ao verificar sessão.' });
  }
};

// ======================================
// LOGOUT - VERSÃO ROBUSTA E CORRIGIDA
// ======================================
exports.logout = (req, res) => {
  console.log('\n👋 [LOGOUT] Iniciando processo de logout...');
  console.log('════════════════════════════════════════');

  // Configurações comuns dos cookies
  const cookieOptions = {
    sameSite: 'None',
    secure: true,
    httpOnly: true,
    path: '/',
  };

  // Lista completa de cookies para limpar
  const cookiesParaLimpar = [
    'usuarioLogado',
    'usuarioCpf',
    'token',
    'userId',
    'userNome',
    'userEmail',
    'userType',
    'userCargo'
  ];

  // Limpar todos os cookies
  cookiesParaLimpar.forEach(cookieName => {
    res.clearCookie(cookieName, cookieOptions);
    console.log(`   🗑️ Cookie limpo: ${cookieName}`);
  });

  console.log('✅ [LOGOUT] Todos os cookies removidos');
  console.log('════════════════════════════════════════\n');

  res.json({
    status: 'deslogado',
    message: 'Logout realizado com sucesso.',
    logged: false
  });
};

// ======================================
// SOLICITAR RECUPERAÇÃO DE SENHA
// ======================================
const codigosRecuperacao = new Map(); // Armazenamento temporário em memória

exports.solicitarRecuperacao = async (req, res) => {
  const { email_pessoa } = req.body;

  if (!email_pessoa) {
    return res.status(400).json({ success: false, error: 'Email é obrigatório' });
  }

  try {
    // 1. Verificar se o email existe no banco
    const result = await db.query(
      'SELECT nome_pessoa FROM pessoa WHERE email_pessoa = $1',
      [email_pessoa]
    );

    if (result.rows.length === 0) {
      // Por segurança, não informamos se o email existe ou não
      console.log('⚠️ Tentativa de recuperação para email não encontrado:', email);
      return res.json({ success: true, message: 'Se o email estiver cadastrado, você receberá um código de recuperação.' });
    }

    const nome = result.rows[0].nome_pessoa;
    const codigo = Math.floor(100000 + Math.random() * 900000).toString(); // Código de 6 dígitos
    const dataExpiracao = Date.now() + 10 * 60 * 1000; // Expira em 10 minutos

    // 2. Armazenar o código
    codigosRecuperacao.set(email_pessoa, {
      codigo,
      dataExpiracao,
      tentativas: 0,
      dataCriacao: Date.now()
    });

    // 3. Enviar o email (simulação, pois a função não está definida aqui)
    // if (enviarEmailRecuperacao) {
    //   await enviarEmailRecuperacao(email, nome, codigo);
    // } else {
    //   console.warn('⚠️ Função enviarEmailRecuperacao não definida. Código:', codigo);
    // }
    console.log(`✉️ Código de recuperação para ${email_pessoa}: ${codigo}`);

    res.json({
      success: true,
      message: 'Código de recuperação enviado para o seu email.'
    });

  } catch (err) {
    console.error('❌ Erro ao solicitar recuperação:', err);
    res.status(500).json({ success: false, error: 'Erro ao solicitar recuperação de senha.' });
  }
};

// ======================================
// VERIFICAR CÓDIGO DE RECUPERAÇÃO
// ======================================
exports.verificarCodigo = async (req, res) => {
  const { email_pessoa, code } = req.body;

  if (!email_pessoa || !code) {
    return res.status(400).json({ success: false, error: 'Email e código são obrigatórios' });
  }

  try {
    const codigoData = codigosRecuperacao.get(email_pessoa);

    if (!codigoData) {
      return res.status(400).json({
        success: false,
        error: 'Código inválido ou expirado. Solicite um novo código.'
      });
    }

    // Verificar expiração (10 minutos)
    const minutosDecorridos = (Date.now() - codigoData.dataCriacao) / (1000 * 60);
    if (minutosDecorridos > 10) {
      codigosRecuperacao.delete(email_pessoa);
      console.log('❌ Código expirado para:', email_pessoa);
      return res.status(400).json({
        success: false,
        error: 'Código expirado. Solicite um novo código.'
      });
    }

    console.log(`⏰ Tempo decorrido: ${minutosDecorridos} minuto(s)`);

    // Limitar tentativas
    if (codigoData.tentativas >= 5) {
      codigosRecuperacao.delete(email_pessoa);
      console.log('❌ Muitas tentativas para:', email_pessoa);
      return res.status(429).json({
        success: false,
        error: 'Muitas tentativas. Solicite um novo código.'
      });
    }

    // Verificar se o código está correto
    if (codigoData.codigo !== code) {
      codigoData.tentativas++;
      const tentativasRestantes = 5 - codigoData.tentativas;
      console.log(`❌ Código incorreto (Tentativa ${codigoData.tentativas}/5)`);
      return res.status(400).json({
        success: false,
        error: `Código incorreto. ${tentativasRestantes} tentativa(s) restante(s).`
      });
    }

    console.log('✅ Código verificado com sucesso!');

    res.json({
      success: true,
      message: 'Código verificado com sucesso'
    });

  } catch (err) {
    console.error('❌ Erro ao verificar código:', err);
    res.status(500).json({
      success: false,
      error: 'Erro ao verificar código'
    });
  }
};

// ======================================
// REDEFINIR SENHA
// ======================================
exports.redefinirSenha = async (req, res) => {
  const { email_pessoa, code, nova_senha } = req.body;

  console.log('\n🔑 [REDEFINIR] Alterando senha para:', email_pessoa);

  if (!email_pessoa || !code || !nova_senha) {
    return res.status(400).json({
      success: false,
      error: 'Email, código e nova senha são obrigatórios'
    });
  }

  // Validar senha
  if (nova_senha.length < 6 || nova_senha.length > 20) {
    return res.status(400).json({
      success: false,
      error: 'A senha deve ter entre 6 e 20 caracteres'
    });
  }

  try {
    // Verificar código novamente (segurança)
    const codigoData = codigosRecuperacao.get(email_pessoa);

    if (!codigoData || codigoData.codigo !== code) {
      console.log('❌ Código inválido ao redefinir senha');
      return res.status(400).json({
        success: false,
        error: 'Código inválido ou expirado'
      });
    }

    // Verificar se o usuário existe
    const checkUser = await db.query(
      'SELECT cpf_pessoa, nome_pessoa FROM pessoa WHERE email_pessoa = $1',
      [email_pessoa]
    );

    if (checkUser.rows.length === 0) {
      console.log('❌ Usuário não encontrado');
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    const user = checkUser.rows[0];

    // Criptografar a nova senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(nova_senha, salt);

    // Atualizar senha no banco
    await db.query(
      'UPDATE pessoa SET senha_pessoa = $1 WHERE email_pessoa = $2',
      [hashedPassword, email_pessoa]
    );

    // Remover código usado
    codigosRecuperacao.delete(email_pessoa);

    console.log('✅ Senha redefinida com sucesso para:', user.nome_pessoa);

    res.json({
      success: true,
      message: 'Senha alterada com sucesso'
    });

  } catch (err) {
    console.error('❌ Erro ao redefinir senha:', err);
    res.status(500).json({
      success: false,
      error: 'Erro ao redefinir senha'
    });
  }
};

// ======================================
// VERIFICAR EMAIL (para fluxo de login em etapas)
// ======================================
exports.verificarEmail = async (req, res) => {
  const { email_pessoa } = req.body;

  if (!email_pessoa) {
    return res.status(400).json({ error: 'Email é obrigatório' });
  }

  try {
    const result = await db.query(
      'SELECT nome_pessoa FROM pessoa WHERE email_pessoa = $1',
      [email_pessoa]
    );

    if (result.rows.length > 0) {
      return res.json({
        status: 'existe',
        nome: result.rows[0].nome_pessoa
      });
    }

    res.json({ status: 'nao_encontrado' });
  } catch (err) {
    console.error('❌ Erro ao verificar email:', err);
    res.status(500).json({ error: 'Erro ao verificar email.' });
  }
};

// ======================================
// ATUALIZAR SENHA
// ======================================
exports.atualizarSenha = async (req, res) => {
  const cpf_pessoa = req.cookies.usuarioCpf;
  const { senha_atual, nova_senha } = req.body;

  if (!cpf_pessoa) {
    return res.status(401).json({ error: 'Usuário não autenticado.' });
  }

  if (!senha_atual || !nova_senha) {
    return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias.' });
  }

  if (nova_senha.length > 20) {
    return res.status(400).json({ error: 'Nova senha deve ter no máximo 20 caracteres.' });
  }

  try {
    // Verificar senha atual
    const checkPassword = await db.query(
      'SELECT senha_pessoa FROM pessoa WHERE cpf_pessoa = $1',
      [cpf_pessoa]
    );

    if (checkPassword.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // Verificar senha atual com bcrypt
    const isMatch = await bcrypt.compare(senha_atual, checkPassword.rows[0].senha_pessoa);

    if (!isMatch) {
      return res.status(400).json({ error: 'Senha atual incorreta.' });
    }

    // Criptografar a nova senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(nova_senha, salt);

    // Atualizar senha
    await db.query(
      'UPDATE pessoa SET senha_pessoa = $1 WHERE cpf_pessoa = $2',
      [hashedPassword, cpf_pessoa]
    );

    console.log('✅ Senha atualizada para CPF:', cpf_pessoa);

    res.json({ message: 'Senha atualizada com sucesso.' });

  } catch (err) {
    console.error('❌ Erro ao atualizar senha:', err);
    res.status(500).json({ error: 'Erro ao atualizar senha.' });
  }
};
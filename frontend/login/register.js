const form = document.getElementById('registerForm');
const API_BASE_URL = 'http://localhost:3001';

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nome = document.getElementById('nome').value.trim();
  const cpf = document.getElementById('cpf').value.trim();
  const cpfLimpo = cpf.replace(/[^0-9]/g, '');
  // Validação de CPF (11 dígitos) no frontend
  if (cpfLimpo.length !== 11) {
    alert('CPF incorreto. Deve conter 11 dígitos.');
    return;
  }
  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value.trim();
  const data_nascimento = document.getElementById('data_nascimento').value;
  const endereco = document.getElementById('endereco').value.trim();
  

  // Validações básicas
  if  ( !nome || !cpf || !email || !senha || !endereco) {
    alert('Por favor, preencha todos os campos obrigatórios.');
    return;
  }

  if (senha.length < 6) {
    alert('A senha deve ter no mínimo 6 caracteres.');
    return;
  }

  try {
    const body = {
      nome_pessoa: nome,
      cpf_pessoa: cpf.replace(/\D/g, ''),
      email_pessoa: email,
      senha_pessoa: senha,
      data_nascimento_pessoa: data_nascimento || null,
      endereco_pessoa: endereco
    };

    const res = await fetch(API_BASE_URL + '/login/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (res.ok) {
      alert('Cadastro realizado com sucesso! Faça login para continuar.');
      window.location.href = './login.html';
    } else {
      alert(data.error || 'Erro ao cadastrar. Tente novamente.');
    }
  } catch (error) {
    console.error('Erro ao cadastrar:', error);
    alert('Erro de conexão com o servidor.');
  }
});

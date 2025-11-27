// Seleciona o formulário
const form = document.getElementById('loginForm');

// Evento de envio do formulário
form.addEventListener('submit', async (e) => {
  e.preventDefault(); // evita recarregar a página

  // Coleta os valores dos campos
  const email_usuario = document.getElementById('email').value.trim();
  const senha_usuario = document.getElementById('senha').value.trim();

  if (!email_usuario || !senha_usuario) {
    alert('Preencha todos os campos!');
    return;
  }

  try {
    // Envia para o backend
    const response = await fetch('http://localhost:3001//login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email_usuario, senha_usuario })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || data.message || 'Erro ao fazer login');
      return;
    }

    // Salva token e dados do usuário no localStorage
    // localStorage.setItem('userToken', data.token); // Não há token no novo controller
    localStorage.setItem('userCPF', data.user.cpf);
    localStorage.setItem('userName', data.user.nome);
    localStorage.setItem('userEmail', data.user.email);
    localStorage.setItem('isFuncionario', data.user.is_funcionario);
    localStorage.setItem('userCargo', data.user.cargo || 'Cliente');

    alert('Login realizado com sucesso! 👏');

    // Redireciona para a página de menu/produtos
    window.location.href = '../menu/menu.html';
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao conectar ao servidor.');
  }
});
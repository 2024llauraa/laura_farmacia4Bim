// Seleciona o formulário
const form = document.getElementById('registerForm');

form.addEventListener('submit', async (e) => {
  e.preventDefault(); // evita recarregar a página

  // Coleta os valores dos campos
  const nome = document.getElementById('nome').value.trim();
  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value.trim();
  const telefone = document.getElementById('telefone').value.trim();
  const data_nascimento = document.getElementById('data_nascimento').value;
  const endereco = document.getElementById('endereco').value.trim();

  if (!nome || !email || !senha || !endereco) {
    alert('Preencha todos os campos obrigatórios!');
    return;
  }

  try {
    // Envia os dados para o backend
    const response = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome,
        email,
        senha,
        telefone,
        data_nascimento,
        endereco
      })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || 'Erro ao cadastrar');
      return;
    }

    alert('Cadastro realizado com sucesso! 🎉 Agora faça login.');
    window.location.href = 'login.html'; // redireciona para login
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao conectar ao servidor.');
  }
});
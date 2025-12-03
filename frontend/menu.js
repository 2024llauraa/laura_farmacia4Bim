// Função para logout (limpa o cookie)
async function logout() {
  const API_BASE_URL = 'http://localhost:3001';
  try {
   const response = await fetch(API_BASE_URL + 
      '/login/logout', {      method: 'POST',
      credentials: 'include' // Envia o cookie
    });

    const data = await response.json();

    if (response.ok) {
      // Limpa o localStorage também, por segurança
      localStorage.removeItem('userCPF');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('isFuncionario');
      localStorage.removeItem('userCargo');
      
      alert('Logout realizado com sucesso!');
      // Recarrega a mesma página — mais seguro para evitar redirecionamentos
      // relativos que podem resultar em "Cannot GET /menu.html" quando o
      // site é servido por um backend que não expõe esse arquivo nessa rota.
      window.location.reload();
    } else {
      alert(data.message || 'Erro ao fazer logout.');
    }
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    alert('Erro de conexão ao tentar fazer logout.');
  }
}

// Função para verificar se o usuário está logado e atualizar a UI
async function verificarLogin() {
  const API_BASE_URL = 'http://localhost:3001';
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const userNameDisplay = document.getElementById('userNameDisplay');

  try {
    const response = await fetch(API_BASE_URL +
      '/login/verificarLogin', {     method: 'POST',
      credentials: 'include' // Envia o cookie
    });

    const data = await response.json();

    // O backend tenta validar via cookie, mas em muitos cenários (dev/local) o cookie
    // HTTP-only/secure pode não estar presente. Usamos localStorage como fallback
    // para manter a exibição do nome e do papel do usuário.
    const logged = data.logged || Boolean(localStorage.getItem('userName'));
    const nome = data.nome || localStorage.getItem('userName');
    // Precisamos buscar se é funcionário — login.js grava isso no localStorage
    const isFuncionario = localStorage.getItem('isFuncionario') === 'true';

    const menuCadastros = document.getElementById('menuCadastros');
    const menuRelatorios = document.getElementById('menuRelatorios');

    if (logged) {
      loginBtn.style.display = 'none';
      logoutBtn.style.display = 'block';
     const nomeExibicao = nome || localStorage.getItem('userName');
      userNameDisplay.textContent = `Olá, ${nomeExibicao}!`;
      
      // Controle de acesso ao menu de cadastros e relatorios: somente funcionários devem ver o menu
      if (isFuncionario) {
        menuCadastros.style.display = 'block';
        if (menuRelatorios) {
          menuRelatorios.style.display = 'block';
        }
      } else {
        menuCadastros.style.display = 'none';
        if (menuRelatorios) {
          menuRelatorios.style.display = 'none';
        }
      }
    } else {
      loginBtn.style.display = 'block';
      logoutBtn.style.display = 'none';
      userNameDisplay.textContent = '';
      localStorage.removeItem('userCPF');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('isFuncionario');
      localStorage.removeItem('userCargo');
      menuCadastros.style.display = 'none'; // Garante que o menu está oculto se não estiver logado
      if (menuRelatorios) {
        menuRelatorios.style.display = 'none';
      }
    }
  } catch (error) {
    console.error('Erro ao verificar login:', error);
    loginBtn.style.display = 'block';
    logoutBtn.style.display = 'none';
    userNameDisplay.textContent = '';
  }
}

// Função para adicionar produto ao carrinho
function addToCart(produtoId) {
  // Buscar informações do produto
  fetch(`http://localhost:3001/produto/${produtoId}`)
    .then(response => response.json())
    .then(produto => {
      // Carregar carrinho do localStorage
      let carrinho = JSON.parse(localStorage.getItem('carrinho') || '[]');
      
      // Verificar se o produto já está no carrinho
      const itemExistente = carrinho.find(item => item.id_produto === produto.id_produto);
      
      if (itemExistente) {
        itemExistente.quantidade += 1;
      } else {
        carrinho.push({
          id_produto: produto.id_produto,
          nome_produto: produto.nome_produto,
          preco_unitario: produto.preco_unitario_produto,
          quantidade: 1
        });
      }
      
      // Salvar no localStorage
      localStorage.setItem('carrinho', JSON.stringify(carrinho));
      
      // Atualizar contador do carrinho
      atualizarContadorCarrinho();
      
      // Mostrar mensagem de sucesso
      alert(`${produto.nome_produto} adicionado ao carrinho!`);
    })
    .catch(error => {
      console.error('Erro ao adicionar produto:', error);
      alert('Erro ao adicionar produto ao carrinho');
    });
}

// Função para atualizar contador do carrinho
function atualizarContadorCarrinho() {
  const carrinho = JSON.parse(localStorage.getItem('carrinho') || '[]');
  const totalItens = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
  const contador = document.getElementById('carrinhoCount');
  if (contador) {
    contador.textContent = totalItens;
  }
}

// Carrega os produtos e verifica o login ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  verificarLogin();
  atualizarContadorCarrinho();
});

// Função para carregar os produtos dinamicamente
async function loadProducts() {
  try {
    // Rota para listar produtos (assumindo que existe no backend)
    const response = await fetch('http://localhost:3001/produto/');
    
    if (!response.ok) {
        throw new Error('Erro ao buscar produtos: ' + response.statusText);
    }

    const produtos = await response.json();

    const productGrid = document.querySelector('.product-grid');
    productGrid.innerHTML = ''; // Limpa o conteúdo estático

    produtos.forEach(produto => {
      const card = document.createElement('div');
      card.className = 'product-card';
      
      // Tenta criar um nome de arquivo de imagem amigável
      const imageName = produto.nome_produto.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      
      card.innerHTML = `
        <div class="product-price">R$ ${produto.preco_unitario_produto.toFixed(2).replace('.', ',')}</div>
        <img src="http://localhost:3001/imagens/${produto.id_produto}.jpg" alt="${produto.nome_produto}" class="product-image">
        <div class="product-name">${produto.nome_produto}</div>
        <button class="add-to-cart-btn" onclick="addToCart(${produto.id_produto})">+</button>
      `;
      productGrid.appendChild(card);
    });

  } catch (error) {
    console.log('deu certo?');
  }
}

// Funções antigas removidas ou substituídas pela lógica em menu.html e auth.js
// function handleUserAction(action) { ... }
// function nomeUsuario() { ... }
// async function usuarioAutorizado() { ... }
// async function logout2()
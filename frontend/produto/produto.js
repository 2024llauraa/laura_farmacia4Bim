// =============================================
// produto.js - CRUD com Imagem e Categoria
// =============================================

// Configuração da API
const API_BASE_URL = 'http://localhost:3001';
let currentPersonId = null;
let operacao = null;

// Elementos do DOM
const form = document.getElementById('produtoForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const produtosTableBody = document.getElementById('produtosTableBody');
const messageContainer = document.getElementById('messageContainer');

// Elementos da Imagem
const imgProdutoVisualizacao = document.getElementById('imgProdutoVisualizacao');
const imgProdutoInput = document.getElementById('imgProdutoInput');
const imgURL = document.getElementById('imgURL');
const btnCarregarImagem = document.getElementById('btnCarregarImagem');

// Mapeamento de categorias
const categoriasMap = {
    1: 'Analgésico',
    2: 'Antibiótico', 
    3: 'Antialérgico',
    4: 'Antigripal',
    5: 'Antiinflamatório'
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    carregarProdutos();
    carregarCategorias();
    imgProdutoVisualizacao.src = '/imagens-produtos/000.png';
});

// Eventos
btnBuscar.addEventListener('click', buscarProduto);
btnIncluir.addEventListener('click', incluirProduto);
btnAlterar.addEventListener('click', alterarProduto);
btnExcluir.addEventListener('click', excluirProduto);
btnCancelar.addEventListener('click', cancelarOperacao);
btnSalvar.addEventListener('click', salvarOperacao);
btnCarregarImagem.addEventListener('click', handleImageUpload);

// Estado inicial
mostrarBotoes(true, false, false, false, false, false);
bloquearCampos(false);

// ===============================
// UTILITÁRIOS
// ===============================

function mostrarMensagem(texto, tipo = 'info') {
    messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    setTimeout(() => (messageContainer.innerHTML = ''), 3000);
}

function bloquearCampos(bloquearPrimeiro) {
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach((input, index) => {
        input.disabled = index === 0 ? bloquearPrimeiro : !bloquearPrimeiro;
    });
}

function limparFormulario() {
    form.reset();
    imgProdutoVisualizacao.src = '/imagens-produtos/000.png';
    imgProdutoVisualizacao.alt = 'Imagem Padrão';
}

function mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar) {
    btnBuscar.style.display = btBuscar ? 'inline-block' : 'none';
    btnIncluir.style.display = btIncluir ? 'inline-block' : 'none';
    btnAlterar.style.display = btAlterar ? 'inline-block' : 'none';
    btnExcluir.style.display = btExcluir ? 'inline-block' : 'none';
    btnSalvar.style.display = btSalvar ? 'inline-block' : 'none';
    btnCancelar.style.display = btCancelar ? 'inline-block' : 'none';
}

// ===============================
// BUSCAR PRODUTO
// ===============================

async function buscarProduto() {
    const id = searchId.value.trim();
    if (!id) {
        mostrarMensagem('Digite um ID para buscar', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/produto/${id}`);

        if (response.ok) {
            const produto = await response.json();
            await preencherFormulario(produto);
            mostrarBotoes(true, false, true, true, false, false);
            mostrarMensagem('Produto encontrado!', 'success');
        } else if (response.status === 404) {
            limparFormulario();
            searchId.value = id;
            mostrarBotoes(true, true, false, false, false, false);
            mostrarMensagem('Produto não encontrado. Você pode incluir um novo.', 'info');
            bloquearCampos(false);
        } else {
            throw new Error('Erro ao buscar produto');
        }
    } catch (error) {
        console.error('Erro ao buscar produto:', error);
        mostrarMensagem('Erro ao buscar produto', 'error');
    }
}

// ===============================
// PREENCHER FORMULÁRIO
// ===============================

async function preencherFormulario(produto) {
    currentPersonId = produto.id_produto;
    searchId.value = produto.id_produto;
    document.getElementById('nome_produto').value = produto.nome_produto || '';
    document.getElementById('quantidade_estoque_produto').value = produto.quantidade_estoque_produto || 0;
    document.getElementById('preco_unitario_produto').value = produto.preco_unitario_produto || 0;

    // Usar categoria_id_categoria se disponível, caso contrário usar id_categoria
    const categoriaId = produto.categoria_id_categoria || produto.id_categoria;
    await carregarCategorias(categoriaId);

    // Carregar imagem do produto
    const img = document.getElementById('imgProdutoVisualizacao');
    img.style.width = '200px';
    img.style.height = '200px';
    img.onerror = () => {
        img.src = '/imagens-produtos/000.png';
        img.alt = 'Imagem Padrão';
    };
    img.src = `/imagens-produtos/${produto.id_produto}.png?t=${Date.now()}`;
}

// ===============================
// CARREGAR CATEGORIAS
// ===============================

async function carregarCategorias(idSelecionado = null) {
    try {
        const response = await fetch(`${API_BASE_URL}/categoria`);
        if (!response.ok) throw new Error('Erro ao buscar categorias');
        const categorias = await response.json();

        const select = document.getElementById('id_categoria');
        if (!select) return;
        select.innerHTML = '';

        const optionVazia = document.createElement('option');
        optionVazia.value = '';
        optionVazia.textContent = 'Selecione uma categoria';
        select.appendChild(optionVazia);

        categorias.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id_categoria;
            option.textContent = cat.nome_categoria;
            if (idSelecionado && idSelecionado == cat.id_categoria) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        mostrarMensagem('Erro ao carregar categorias', 'error');
    }
}

// ===============================
// INCLUIR / ALTERAR / EXCLUIR
// ===============================

async function incluirProduto() {
    mostrarMensagem('Digite os dados!', 'success');
    currentPersonId = searchId.value;
    limparFormulario();
    searchId.value = currentPersonId;
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('nome_produto').focus();
    operacao = 'incluir';
    await carregarCategorias();
}

function alterarProduto() {
    mostrarMensagem('Edite os dados!', 'info');
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('nome_produto').focus();
    operacao = 'alterar';
}

function excluirProduto() {
    mostrarMensagem('Confirme a exclusão clicando em Salvar.', 'warning');
    currentPersonId = searchId.value;
    searchId.disabled = true;
    bloquearCampos(false);
    mostrarBotoes(false, false, false, false, true, true);
    operacao = 'excluir';
}

// ===============================
// SALVAR OPERAÇÃO
// ===============================

async function salvarOperacao() {
    const formData = new FormData(form);
    const produto = {
        id_produto: searchId.value,
        nome_produto: formData.get('nome_produto'),
        quantidade_estoque_produto: formData.get('quantidade_estoque_produto'),
        preco_unitario_produto: formData.get('preco_unitario_produto'),
        categoria_id_categoria: formData.get('id_categoria')
    };

    let response;
    try {
        if (operacao === 'incluir') {
            response = await fetch(`${API_BASE_URL}/produto`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(produto)
            });
        } else if (operacao === 'alterar') {
            response = await fetch(`${API_BASE_URL}/produto/${currentPersonId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(produto)
            });
        } else if (operacao === 'excluir') {
            response = await fetch(`${API_BASE_URL}/produto/${currentPersonId}`, { method: 'DELETE' });
        }

        if (response.ok) {
            mostrarMensagem(`Operação ${operacao} realizada com sucesso!`, 'success');
            limparFormulario();
            carregarProdutos();
        } else {
            const erro = await response.json().catch(() => ({}));
            mostrarMensagem(erro.error || 'Erro na operação', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao realizar operação', 'error');
    }

    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
    searchId.focus();
}

// ===============================
// CANCELAR OPERAÇÃO
// ===============================

function cancelarOperacao() {
    limparFormulario();
    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
    searchId.focus();
    mostrarMensagem('Operação cancelada', 'info');
}

// ===============================
// UPLOAD DE IMAGEM
// ===============================

async function handleImageUpload() {
    const id = searchId.value.trim();
    if (!id || (operacao !== 'alterar' && operacao !== 'incluir')) {
        mostrarMensagem('Busque ou inclua o produto e esteja no modo de edição/inclusão.', 'warning');
        return;
    }

    const file = imgProdutoInput.files[0];
    const url = imgURL.value.trim();
    if (!file && !url) {
        mostrarMensagem('Selecione um arquivo local OU insira uma URL.', 'warning');
        return;
    }

    const formData = new FormData();
    formData.append('produtoId', id);
    if (file) {
        formData.append('imageSource', 'local');
        formData.append('imageFile', file);
    } else if (url) {
        formData.append('imageSource', 'url');
        formData.append('imageUrl', url);
    }

    try {
        const response = await fetch(`${API_BASE_URL}/upload-image`, { method: 'POST', body: formData });
        if (response.ok) {
            imgProdutoVisualizacao.src = `/imagens-produtos/${id}.png?t=${Date.now()}`;
            mostrarMensagem('Imagem salva com sucesso!', 'success');
            imgProdutoInput.value = '';
            imgURL.value = '';
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Falha ao salvar a imagem.');
        }
    } catch (error) {
        console.error('Erro upload:', error);
        mostrarMensagem('Erro ao salvar imagem: ' + error.message, 'error');
    }
}

// ===============================
// LISTAGEM DE PRODUTOS
// ===============================

async function carregarProdutos() {
    try {
        const response = await fetch(`${API_BASE_URL}/produto`);
        if (response.ok) {
            const produtos = await response.json();
            console.log('Dados dos produtos:', produtos); // Para debug
            renderizarTabelaProdutos(produtos);
        } else {
            throw new Error('Erro ao carregar produtos');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao carregar lista de produtos', 'error');
    }
}

function renderizarTabelaProdutos(produtos) {
    produtosTableBody.innerHTML = '';
    produtos.forEach(produto => {
        const row = document.createElement('tr');
        
        // Obter o nome da categoria
        const categoriaId = produto.categoria_id_categoria || produto.id_categoria;
        const categoriaNome = categoriasMap[categoriaId] || `ID: ${categoriaId}`;
        
        row.innerHTML = `
            <td><button class="btn-id" onclick="selecionarProduto(${produto.id_produto})">${produto.id_produto}</button></td>
            <td>${produto.nome_produto}</td>
            <td>${produto.quantidade_estoque_produto}</td>
            <td>R$ ${produto.preco_unitario_produto}</td>
            <td>${categoriaNome}</td>
        `;
        produtosTableBody.appendChild(row);
    });
}

async function selecionarProduto(id) {
    searchId.value = id;
    await buscarProduto();
}
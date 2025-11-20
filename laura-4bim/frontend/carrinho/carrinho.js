// Configuração da API
const API_BASE_URL = 'http://localhost:3001';

// Variáveis globais
let carrinho = [];
let formasPagamento = [];
let idPedidoAtual = null;
let codigoPixGerado = '';

// ================================
// Inicialização
// ================================
document.addEventListener('DOMContentLoaded', () => {
    carregarCarrinho();
    carregarFormasPagamento();
    renderizarCarrinho();
    carregarHistoricoPedidos(); // <-- Nova função
    
    // Event listeners
    document.getElementById('btnLimparCarrinho').addEventListener('click', limparCarrinho);
    document.getElementById('btnFinalizarPagamento').addEventListener('click', abrirModalPagamento);
    
    // Máscaras para campos de cartão
    document.getElementById('numeroCartao')?.addEventListener('input', mascaraNumeroCartao);
    document.getElementById('validadeCartao')?.addEventListener('input', mascaraValidadeCartao);
    document.getElementById('cvvCartao')?.addEventListener('input', mascaraCVV);
});

// ================================
// Gerenciamento do LocalStorage
// ================================
function carregarCarrinho() {
    const carrinhoSalvo = localStorage.getItem('carrinho');
    if (carrinhoSalvo) {
        carrinho = JSON.parse(carrinhoSalvo);
    }
}

function salvarCarrinho() {
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
}

function limparCarrinhoStorage() {
    localStorage.removeItem('carrinho');
    carrinho = [];
}

// ================================
// Renderização do carrinho
// ================================
function renderizarCarrinho() {
    const carrinhoVazio = document.getElementById('carrinhoVazio');
    const carrinhoConteudo = document.getElementById('carrinhoConteudo');
    const itensCarrinho = document.getElementById('itensCarrinho');

    if (carrinho.length === 0) {
        carrinhoVazio.style.display = 'block';
        carrinhoConteudo.style.display = 'none';
        return;
    }

    carrinhoVazio.style.display = 'none';
    carrinhoConteudo.style.display = 'grid';

    // Renderizar itens
    itensCarrinho.innerHTML = '';
    carrinho.forEach((item, index) => {
        const itemCard = criarItemCard(item, index);
        itensCarrinho.appendChild(itemCard);
    });

    // Atualizar totais
    atualizarTotais();
}

function criarItemCard(item, index) {
    const card = document.createElement('div');
    card.className = 'item-card';

    const total = item.preco_unitario * item.quantidade;

    card.innerHTML = `
        <div class="item-info">
            <div class="item-nome">${item.nome_produto}</div>
            <div class="item-preco">R$ ${item.preco_unitario.toFixed(2).replace('.', ',')}</div>
        </div>
        <div class="item-quantidade">
            <button class="quantidade-btn" onclick="alterarQuantidade(${index}, -1)">-</button>
            <span class="quantidade-valor">${item.quantidade}</span>
            <button class="quantidade-btn" onclick="alterarQuantidade(${index}, 1)">+</button>
        </div>
        <div class="item-total">R$ ${total.toFixed(2).replace('.', ',')}</div>
        <button class="item-remover" onclick="removerItem(${index})">🗑️</button>
    `;

    return card;
}

function atualizarTotais() {
    const subtotal = carrinho.reduce((acc, item) => acc + (item.preco_unitario * item.quantidade), 0);
    const total = subtotal;

    document.getElementById('subtotal').textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    document.getElementById('total').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

// ================================
// Manipulação de itens
// ================================
function alterarQuantidade(index, delta) {
    carrinho[index].quantidade += delta;
    
    if (carrinho[index].quantidade <= 0) {
        carrinho.splice(index, 1);
    }
    
    salvarCarrinho();
    renderizarCarrinho();
}

function removerItem(index) {
    if (confirm('Deseja remover este item do carrinho?')) {
        carrinho.splice(index, 1);
        salvarCarrinho();
        renderizarCarrinho();
    }
}

function limparCarrinho() {
    if (confirm('Deseja limpar todo o carrinho?')) {
        limparCarrinhoStorage();
        renderizarCarrinho();
        mostrarMensagem('Carrinho limpo com sucesso!', 'info');
    }
}

// ================================
// Formas de pagamento
// ================================
async function carregarFormasPagamento() {
    try {
        const response = await fetch(`${API_BASE_URL}/carrinho/formas-pagamento`);
        
        if (!response.ok) {
            throw new Error('Erro ao carregar formas de pagamento');
        }

        formasPagamento = await response.json();
        preencherSelectFormasPagamento();
    } catch (error) {
        console.error('Erro ao carregar formas de pagamento:', error);
        mostrarMensagem('Erro ao carregar formas de pagamento', 'error');
    }
}

function preencherSelectFormasPagamento() {
    const select = document.getElementById('formaPagamento');
    select.innerHTML = '<option value="">Selecione...</option>';
    
    formasPagamento.forEach(forma => {
        const option = document.createElement('option');
        option.value = forma.id_forma_pagamento;
        option.textContent = forma.nome_forma_pagamento;
        option.dataset.nome = forma.nome_forma_pagamento.toLowerCase();
        select.appendChild(option);
    });
}

// ================================
// Mostrar campos específicos por forma de pagamento
// ================================
function mostrarCamposFormaPagamento() {
    const select = document.getElementById('formaPagamento');
    const selectedOption = select.options[select.selectedIndex];
    const nomeForma = selectedOption.dataset.nome || '';
    
    // Esconder todos os campos
    document.getElementById('campoDinheiro').style.display = 'none';
    document.getElementById('campoCartao').style.display = 'none';
    document.getElementById('campoPix').style.display = 'none';
    
    // Mostrar campos específicos
    if (nomeForma.includes('dinheiro')) {
        document.getElementById('campoDinheiro').style.display = 'block';
    } else if (nomeForma.includes('cartão') || nomeForma.includes('cartao') || nomeForma.includes('crédito') || nomeForma.includes('credito') || nomeForma.includes('débito') || nomeForma.includes('debito')) {
        document.getElementById('campoCartao').style.display = 'block';
        gerarOpcoesParcelamento();
    } else if (nomeForma.includes('pix')) {
        document.getElementById('campoPix').style.display = 'block';
        gerarQRCodePix();
    }
}

// ================================
// DINHEIRO - Troco
// ================================
function mostrarCampoTroco() {
    document.getElementById('campoValorTroco').style.display = 'block';
}

function esconderCampoTroco() {
    document.getElementById('campoValorTroco').style.display = 'none';
    document.getElementById('valorTroco').value = '';
}

function validarPagamentoDinheiro() {
    const precisaTroco = document.querySelector('input[name="precisaTroco"]:checked');
    
    if (!precisaTroco) {
        mostrarMensagem('Selecione se precisa de troco', 'error');
        return false;
    }
    
    if (precisaTroco.value === 'sim') {
        const valorTroco = parseFloat(document.getElementById('valorTroco').value);
        const total = carrinho.reduce((acc, item) => acc + (item.preco_unitario * item.quantidade), 0);
        
        if (!valorTroco || isNaN(valorTroco)) {
            mostrarMensagem('Digite o valor para o troco', 'error');
            return false;
        }
        
        if (valorTroco < total) {
            mostrarMensagem(`O valor informado (R$ ${valorTroco.toFixed(2)}) é menor que o total da compra (R$ ${total.toFixed(2)})`, 'error');
            return false;
        }
        
        const troco = valorTroco - total;
        if (confirm(`O entregador levará seu troco de R$ ${troco.toFixed(2)}. Confirmar?`)) {
            return true;
        }
        return false;
    }
    
    return true;
}

// ================================
// CARTÃO - Validação
// ================================
function mascaraNumeroCartao(e) {
    let valor = e.target.value.replace(/\D/g, '');
    valor = valor.replace(/(\d{4})(?=\d)/g, '$1 ');
    e.target.value = valor;
}

function mascaraValidadeCartao(e) {
    let valor = e.target.value.replace(/\D/g, '');
    if (valor.length >= 2) {
        valor = valor.substring(0, 2) + '/' + valor.substring(2, 4);
    }
    e.target.value = valor;
}

function mascaraCVV(e) {
    e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
}

function gerarOpcoesParcelamento() {
    const select = document.getElementById('parcelasCartao');
    const total = carrinho.reduce((acc, item) => acc + (item.preco_unitario * item.quantidade), 0);
    
    select.innerHTML = '<option value="1">1x de R$ ' + total.toFixed(2).replace('.', ',') + ' sem juros</option>';
    
    if (total >= 50) {
        const valor2x = total / 2;
        select.innerHTML += `<option value="2">2x de R$ ${valor2x.toFixed(2).replace('.', ',')} sem juros</option>`;
    }
    if (total >= 100) {
        const valor3x = total / 3;
        select.innerHTML += `<option value="3">3x de R$ ${valor3x.toFixed(2).replace('.', ',')} sem juros</option>`;
    }
    if (total >= 150) {
        const valor4x = total / 4;
        select.innerHTML += `<option value="4">4x de R$ ${valor4x.toFixed(2).replace('.', ',')} sem juros</option>`;
    }
}

function validarPagamentoCartao() {
    const nome = document.getElementById('nomeCartao').value.trim();
    const numero = document.getElementById('numeroCartao').value.replace(/\D/g, '');
    const validade = document.getElementById('validadeCartao').value;
    const cvv = document.getElementById('cvvCartao').value;
    
    if (!nome || !/^[A-Za-zÀ-ÿ\s]+$/.test(nome)) {
        mostrarMensagem('Nome no cartão inválido. Use apenas letras.', 'error');
        return false;
    }
    
    if (numero.length !== 16) {
        mostrarMensagem('Número do cartão deve ter 16 dígitos', 'error');
        return false;
    }
    
    if (!/^\d{2}\/\d{2}$/.test(validade)) {
        mostrarMensagem('Validade inválida. Use o formato MM/AA', 'error');
        return false;
    }
    
    const [mes, ano] = validade.split('/').map(Number);
    const anoCompleto = 2000 + ano;
    const dataValidade = new Date(anoCompleto, mes - 1);
    const hoje = new Date();
    
    if (dataValidade < hoje) {
        mostrarMensagem('Cartão vencido', 'error');
        return false;
    }
    
    if (cvv.length < 3 || cvv.length > 4) {
        mostrarMensagem('CVV deve ter 3 ou 4 dígitos', 'error');
        return false;
    }
    
    return true;
}

// ================================
// PIX - Geração de QR Code
// ================================
function gerarQRCodePix() {
    const total = carrinho.reduce((acc, item) => acc + (item.preco_unitario * item.quantidade), 0);
    const valor = total.toFixed(2);
    
    // Dados do PIX (ajuste conforme necessário)
    const chavePix = '+5544999585963'; // Chave PIX (telefone)
    const nomeRecebedor = 'Farmacia Sem Volta';
    const cidade = 'SAO PAULO';
    const descricao = 'Pagamento Farmacia';
    
    function formatField(id, value) {
        const length = value.length.toString().padStart(2, '0');
        return id + length + value;
    }
    
    // Monta o payload do Pix
    let payloadSemCRC =
        formatField("00", "01") +
        formatField("26",
            formatField("00", "BR.GOV.BCB.PIX") +
            formatField("01", chavePix) +
            formatField("02", descricao)
        ) +
        formatField("52", "0000") +
        formatField("53", "986") +
        formatField("54", valor) +
        formatField("58", "BR") +
        formatField("59", nomeRecebedor) +
        formatField("60", cidade) +
        formatField("62", formatField("05", "***")) +
        "6304";
    
    // Gera o CRC16
    function crc16(str) {
        let crc = 0xFFFF;
        for (let c = 0; c < str.length; c++) {
            crc ^= str.charCodeAt(c) << 8;
            for (let i = 0; i < 8; i++) {
                if ((crc & 0x8000) !== 0) {
                    crc = (crc << 1) ^ 0x1021;
                } else {
                    crc <<= 1;
                }
                crc &= 0xFFFF;
            }
        }
        return crc.toString(16).toUpperCase().padStart(4, '0');
    }
    
    const crc = crc16(payloadSemCRC);
    codigoPixGerado = payloadSemCRC + crc;
    
    // Gera QR Code
    const qrCodeDiv = document.getElementById('qrcodePix');
    qrCodeDiv.innerHTML = '';
    
    new QRCode(qrCodeDiv, {
        text: codigoPixGerado,
        width: 250,
        height: 250,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });
    
    // Mostra informações
    const pixInfo = document.getElementById('pixInfo');
    pixInfo.innerHTML = `
        <p><strong>Beneficiário:</strong> ${nomeRecebedor}</p>
        <p><strong>Chave PIX:</strong> ${chavePix}</p>
        <p><strong>Valor:</strong> R$ ${valor.replace('.', ',')}</p>
    `;
}

function copiarCodigoPix() {
    if (!codigoPixGerado) {
        mostrarMensagem('Código PIX não gerado', 'error');
        return;
    }
    
    navigator.clipboard.writeText(codigoPixGerado).then(() => {
        mostrarMensagem('Código PIX copiado!', 'success');
    }).catch(err => {
        console.error('Erro ao copiar:', err);
        mostrarMensagem('Erro ao copiar código', 'error');
    });
}

// ================================
// Modal de pagamento
// ================================
function abrirModalPagamento() {
    if (carrinho.length === 0) {
        mostrarMensagem('Carrinho vazio!', 'error');
        return;
    }

    const total = carrinho.reduce((acc, item) => acc + (item.preco_unitario * item.quantidade), 0);
    document.getElementById('totalPagamento').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    document.getElementById('modalPagamento').style.display = 'flex';
}

function fecharModalPagamento() {
    document.getElementById('modalPagamento').style.display = 'none';
    document.getElementById('formaPagamento').value = '';
    
    // Limpar campos
    document.getElementById('campoDinheiro').style.display = 'none';
    document.getElementById('campoCartao').style.display = 'none';
    document.getElementById('campoPix').style.display = 'none';
}

// ================================
// Histórico de Pedidos
// ================================
async function carregarHistoricoPedidos() {
    const historicoSection = document.getElementById('historicoPedidos');
    const listaHistorico = document.getElementById('listaHistorico');
    
    try {
        const response = await fetch(`${API_BASE_URL}/carrinho/historico-pedidos`, {
            credentials: 'include'
        });
        
        if (response.status === 401) {
            // Usuário não logado, apenas oculta a seção
            historicoSection.style.display = 'none';
            return;
        }
        
        if (!response.ok) {
            throw new Error('Erro ao buscar histórico de pedidos');
        }

        const pedidos = await response.json();
        
        if (pedidos.length === 0) {
            listaHistorico.innerHTML = '<p>Você ainda não realizou nenhum pedido.</p>';
            historicoSection.style.display = 'block';
            return;
        }
        
        listaHistorico.innerHTML = '';
        pedidos.forEach(pedido => {
            const card = criarPedidoCard(pedido);
            listaHistorico.appendChild(card);
        });
        
        historicoSection.style.display = 'block';

    } catch (error) {
        console.error('Erro ao carregar histórico de pedidos:', error);
        historicoSection.style.display = 'none';
    }
}

function criarPedidoCard(pedido) {
    const card = document.createElement('div');
    card.className = 'pedido-card';
    
    const dataFormatada = new Date(pedido.data_pedido).toLocaleDateString('pt-BR');
    const valorFormatado = parseFloat(pedido.valor_total).toFixed(2).replace('.', ',');
    const statusClass = pedido.status_pagamento === 'Pago' ? 'status-pago' : 'status-pendente';
    card.innerHTML = `
        <div class="pedido-info">
            <div class="pedido-id">Pedido #${pedido.id_pedido}</div>
            <div class="pedido-data">Data: ${dataFormatada}</div>
        </div>
        <div class="pedido-valor">R$ ${valorFormatado}</div>
        <div class="pedido-status ${statusClass}">${pedido.status_pagamento}</div>
    `;
    
    return card;
}
    
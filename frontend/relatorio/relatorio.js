const API_BASE_URL = ''; // Ajuste conforme a porta do seu backend

// Função para imprimir o conteúdo de um elemento
function imprimirRelatorio(elementId) {
    const printContents = document.getElementById(elementId).innerHTML;
    const originalContents = document.body.innerHTML;

    // Cria uma nova janela/aba para impressão
    const printWindow = window.open('', '_blank');
    printWindow.document.write('<html><head><title>Relatório de Impressão</title>');
    // Inclui os estilos CSS
    printWindow.document.write('<link rel="stylesheet" href="../menu.css">');
    printWindow.document.write('<link rel="stylesheet" href="relatorio.css">');
    printWindow.document.write('</head><body>');
    
    // Remove o botão de impressão do conteúdo a ser impresso
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = printContents;
    const btnImprimir = tempDiv.querySelector('.btn-imprimir');
    if (btnImprimir) {
        btnImprimir.remove();
    }
    
    printWindow.document.write(tempDiv.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    
    // Espera um pouco para o conteúdo carregar e então imprime
    printWindow.onload = function() {
        printWindow.print();
        printWindow.close();
    };
}

// Função para formatar valores monetários
const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

// Função para carregar o relatório de vendas do mês
const carregarRelatorioVendasMes = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/relatorio/vendas-mes`);
        if (!response.ok) {
            throw new Error('Erro ao carregar relatório de vendas do mês');
        }
        const data = await response.json();

        // Atualizar Vendas do Mês Atual
        document.getElementById('mes-atual-periodo').textContent = `(${data.mesAtual.dataInicio} a ${data.mesAtual.dataFim})`;
        document.getElementById('vendas-mes-atual').textContent = formatCurrency(parseFloat(data.mesAtual.totalVendas));

        // Atualizar Comparação com Mês Anterior
        document.getElementById('mes-anterior-periodo').textContent = `(${data.mesAnterior.dataInicio} a ${data.mesAnterior.dataFim})`;
        document.getElementById('vendas-mes-anterior').textContent = formatCurrency(parseFloat(data.mesAnterior.totalVendas));

        const statusElement = document.getElementById('status-vendas');
        const diferencaElement = document.getElementById('diferenca-vendas');
        const percentualElement = document.getElementById('percentual-vendas');

        // Limpar classes de status
        statusElement.classList.remove('status-alta', 'status-baixa', 'status-estavel');

        // Atualizar Status e Diferença
        statusElement.textContent = data.analise.status;
        diferencaElement.textContent = formatCurrency(Math.abs(parseFloat(data.analise.diferenca)));
        percentualElement.textContent = `${Math.abs(parseFloat(data.analise.percentual)).toFixed(2)}%`;

        if (data.analise.status === 'Alta') {
            statusElement.classList.add('status-alta');
        } else if (data.analise.status === 'Baixa') {
            statusElement.classList.add('status-baixa');
        } else {
            statusElement.classList.add('status-estavel');
        }

    } catch (error) {
        console.error('Erro:', error);
        alert('Não foi possível carregar o relatório de vendas do mês.');
    }
};

// Função para carregar os produtos mais vendidos
const carregarProdutosMaisVendidos = async (periodo) => {
    const tabelaBody = document.getElementById('tabela-produtos-body');
    tabelaBody.innerHTML = '<tr><td colspan="2">Carregando...</td></tr>';

    try {
        const response = await fetch(`${API_BASE_URL}/relatorio/produtos-mais-vendidos?periodo=${periodo}`);
        if (!response.ok) {
            throw new Error('Erro ao carregar produtos mais vendidos');
        }
        const data = await response.json();

        tabelaBody.innerHTML = ''; // Limpar o "Carregando..."

        if (data.produtos.length === 0) {
            tabelaBody.innerHTML = `<tr><td colspan="2">Nenhum produto vendido no período de ${data.periodo}.</td></tr>`;
            return;
        }

        data.produtos.forEach(produto => {
            const row = tabelaBody.insertRow();
            const cellProduto = row.insertCell();
            const cellQuantidade = row.insertCell();

            cellProduto.textContent = produto.nome_produto;
            cellQuantidade.textContent = produto.total_vendido;
        });

    } catch (error) {
        console.error('Erro:', error);
        tabelaBody.innerHTML = '<tr><td colspan="2">Erro ao carregar produtos mais vendidos.</td></tr>';
    }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Carregar o relatório de vendas do mês ao carregar a página
    carregarRelatorioVendasMes();

    // Carregar produtos mais vendidos (padrão: mês)
    const filtroSelect = document.getElementById('filtro-periodo');
    carregarProdutosMaisVendidos(filtroSelect.value);

    // Adicionar evento ao botão de filtrar
    document.getElementById('btn-filtrar').addEventListener('click', () => {
        carregarProdutosMaisVendidos(filtroSelect.value);
    });
});
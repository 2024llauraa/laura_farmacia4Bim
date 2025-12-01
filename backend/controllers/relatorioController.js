const db = require('../database');

// Função auxiliar para obter o primeiro e último dia do mês
const getMonthBounds = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return { firstDay, lastDay };
};

// Função para obter o relatório de vendas do mês
const getRelatorioVendasMes = async (req, res) => {
    try {
        // Data atual para o mês de referência
        const dataAtual = new Date();
        const { firstDay: inicioMesAtual, lastDay: fimMesAtual } = getMonthBounds(dataAtual);

        // Data para o mês anterior
        const dataMesAnterior = new Date(dataAtual.getFullYear(), dataAtual.getMonth() - 1, 1);
        const { firstDay: inicioMesAnterior, lastDay: fimMesAnterior } = getMonthBounds(dataMesAnterior);

        // 1. Vendas do Mês Atual
        const queryMesAtual = `
            SELECT SUM(p.quantidade * p.preco_unitario) AS total_vendas
            FROM pedido_has_produto p
            JOIN pedido pe ON p.pedido_id_pedido = pe.id_pedido
            WHERE pe.data_pedido BETWEEN $1 AND $2;
        `;
        const resultMesAtual = await db.query(queryMesAtual, [inicioMesAtual.toISOString().split('T')[0], fimMesAtual.toISOString().split('T')[0]]);
        const vendasMesAtual = parseFloat(resultMesAtual.rows[0].total_vendas || 0);

        // 2. Vendas do Mês Anterior
        const queryMesAnterior = `
            SELECT SUM(p.quantidade * p.preco_unitario) AS total_vendas
            FROM pedido_has_produto p
            JOIN pedido pe ON p.pedido_id_pedido = pe.id_pedido
            WHERE pe.data_pedido BETWEEN $1 AND $2;
        `;
        const resultMesAnterior = await db.query(queryMesAnterior, [inicioMesAnterior.toISOString().split('T')[0], fimMesAnterior.toISOString().split('T')[0]]);
        const vendasMesAnterior = parseFloat(resultMesAnterior.rows[0].total_vendas || 0);

        // 3. Análise (Altas e Baixas)
        let status = 'Estável';
        let diferenca = vendasMesAtual - vendasMesAnterior;
        let percentual = 0;

        if (vendasMesAnterior > 0) {
            percentual = (diferenca / vendasMesAnterior) * 100;
            if (diferenca > 0) {
                status = 'Alta';
            } else if (diferenca < 0) {
                status = 'Baixa';
            }
        } else if (vendasMesAtual > 0) {
            status = 'Alta'; // Se o mês anterior foi zero e o atual não, é alta
            percentual = 100;
        }

        res.status(200).json({
            mesAtual: {
                dataInicio: inicioMesAtual.toISOString().split('T')[0],
                dataFim: fimMesAtual.toISOString().split('T')[0],
                totalVendas: vendasMesAtual.toFixed(2)
            },
            mesAnterior: {
                dataInicio: inicioMesAnterior.toISOString().split('T')[0],
                dataFim: fimMesAnterior.toISOString().split('T')[0],
                totalVendas: vendasMesAnterior.toFixed(2)
            },
            analise: {
                status: status,
                diferenca: diferenca.toFixed(2),
                percentual: percentual.toFixed(2)
            }
        });

    } catch (error) {
        console.error('Erro ao gerar relatório de vendas do mês:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao gerar relatório de vendas.' });
    }
};

module.exports = {
    getRelatorioVendasMes,
};
// Função para obter os produtos mais vendidos com filtro de período
const getProdutosMaisVendidos = async (req, res) => {
    try {
        const { periodo } = req.query; // 'dia', 'semana', 'mes', 'ano'
        let whereClause = '';
        const params = [];
        const dataAtual = new Date();

        switch (periodo) {
            case 'dia':
                // Filtra por pedidos feitos hoje
                const hoje = dataAtual.toISOString().split('T')[0];
                whereClause = `WHERE pe.data_pedido = $1`;
                params.push(hoje);
                break;
            case 'semana':
                // Filtra por pedidos feitos nos últimos 7 dias
                const dataSemana = new Date(dataAtual);
                dataSemana.setDate(dataAtual.getDate() - 7);
                whereClause = `WHERE pe.data_pedido >= $1`;
                params.push(dataSemana.toISOString().split('T')[0]);
                break;
            case 'mes':
                // Filtra por pedidos feitos no mês atual
                const { firstDay, lastDay } = getMonthBounds(dataAtual);
                whereClause = `WHERE pe.data_pedido BETWEEN $1 AND $2`;
                params.push(firstDay.toISOString().split('T')[0], lastDay.toISOString().split('T')[0]);
                break;
            case 'ano':
                // Filtra por pedidos feitos no ano atual
                const ano = dataAtual.getFullYear();
                whereClause = `WHERE EXTRACT(YEAR FROM pe.data_pedido) = $1`;
                params.push(ano);
                break;
            default:
                // Padrão: Mês
                const { firstDay: defaultFirstDay, lastDay: defaultLastDay } = getMonthBounds(dataAtual);
                whereClause = `WHERE pe.data_pedido BETWEEN $1 AND $2`;
                params.push(defaultFirstDay.toISOString().split('T')[0], defaultLastDay.toISOString().split('T')[0]);
                break;
        }

        const query = `
            SELECT
                p.nome_produto,
                SUM(php.quantidade) AS total_vendido
            FROM
                produto p
            JOIN
                pedido_has_produto php ON p.id_produto = php.produto_id_produto
            JOIN
                pedido pe ON php.pedido_id_pedido = pe.id_pedido
            ${whereClause}
            GROUP BY
                p.nome_produto
            ORDER BY
                total_vendido DESC
            LIMIT 10; -- Limita aos 10 mais vendidos
        `;

        const result = await db.query(query, params);

        res.status(200).json({
            periodo: periodo || 'mes',
            produtos: result.rows
        });

    } catch (error) {
        console.error('Erro ao obter produtos mais vendidos:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao obter produtos mais vendidos.' });
    }
};

module.exports = {
    getRelatorioVendasMes,
    getProdutosMaisVendidos
};
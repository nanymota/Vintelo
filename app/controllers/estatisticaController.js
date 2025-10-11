const pool = require('../config/pool_conexoes');

const estatisticaController = {
    async exibirEstatisticas(req, res) {
        try {
            const usuarioId = req.session.autenticado?.id;
            
            if (!usuarioId) {
                return res.redirect('/entrar');
            }

            // Buscar dados do brechó
            const [brecho] = await pool.execute(
                'SELECT * FROM BRECHOS WHERE ID_USUARIO = ?',
                [usuarioId]
            );

            if (!brecho.length) {
                return res.redirect('/criarbrecho');
            }

            const brechoId = brecho[0].ID_BRECHO || brecho[0].id;

            // Estatísticas gerais
            const [produtos] = await pool.execute(
                'SELECT COUNT(*) as total_produtos FROM PRODUTOS WHERE ID_USUARIO = ?',
                [usuarioId]
            );

            const [vendas] = await pool.execute(
                `SELECT 
                    COUNT(*) as total_vendas,
                    COALESCE(SUM(p.PRECO), 0) as receita_total
                FROM PEDIDOS ped 
                JOIN PRODUTOS p ON ped.ID_PRODUTO = p.ID_PRODUTO 
                WHERE p.ID_USUARIO = ? AND ped.STATUS_PEDIDO = 'confirmado'`,
                [usuarioId]
            );

            const [visualizacoes] = await pool.execute(
                'SELECT COALESCE(COUNT(*), 0) as total_visualizacoes FROM PRODUTOS WHERE ID_USUARIO = ?',
                [usuarioId]
            );

            // Vendas por categoria
            const [vendasCategoria] = await pool.execute(
                `SELECT 
                    p.TIPO_PRODUTO as categoria,
                    COUNT(*) as quantidade,
                    COALESCE(SUM(p.PRECO), 0) as receita
                FROM PEDIDOS ped 
                JOIN PRODUTOS p ON ped.ID_PRODUTO = p.ID_PRODUTO 
                WHERE p.ID_USUARIO = ? AND ped.STATUS_PEDIDO = 'confirmado'
                GROUP BY p.TIPO_PRODUTO
                ORDER BY quantidade DESC`,
                [usuarioId]
            );

            // Produtos mais vendidos
            const [produtosMaisVendidos] = await pool.execute(
                `SELECT 
                    p.NOME_PRODUTO,
                    img.URL_IMG,
                    COUNT(*) as vendas,
                    p.PRECO
                FROM PEDIDOS ped 
                JOIN PRODUTOS p ON ped.ID_PRODUTO = p.ID_PRODUTO 
                LEFT JOIN IMG_PRODUTOS img ON p.ID_PRODUTO = img.ID_PRODUTO
                WHERE p.ID_USUARIO = ? AND ped.STATUS_PEDIDO = 'confirmado'
                GROUP BY p.ID_PRODUTO
                ORDER BY vendas DESC
                LIMIT 5`,
                [usuarioId]
            );

            // Vendas dos últimos 7 dias
            const [vendasRecentes] = await pool.execute(
                `SELECT 
                    DATE(ped.DATA_PEDIDO) as data,
                    COUNT(*) as vendas,
                    COALESCE(SUM(p.PRECO), 0) as receita
                FROM PEDIDOS ped 
                JOIN PRODUTOS p ON ped.ID_PRODUTO = p.ID_PRODUTO 
                WHERE p.ID_USUARIO = ? 
                AND ped.STATUS_PEDIDO = 'confirmado'
                AND ped.DATA_PEDIDO >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                GROUP BY DATE(ped.DATA_PEDIDO)
                ORDER BY data DESC`,
                [usuarioId]
            );

            const estatisticas = {
                brecho: brecho[0],
                totalProdutos: produtos[0].total_produtos,
                totalVendas: vendas[0].total_vendas,
                receitaTotal: vendas[0].receita_total,
                totalVisualizacoes: visualizacoes[0].total_visualizacoes,
                taxaConversao: visualizacoes[0].total_visualizacoes > 0 
                    ? ((vendas[0].total_vendas / visualizacoes[0].total_visualizacoes) * 100).toFixed(1)
                    : 0,
                vendasCategoria: vendasCategoria,
                produtosMaisVendidos: produtosMaisVendidos,
                vendasRecentes: vendasRecentes
            };

            res.render('pages/estatistica', {
                autenticado: req.session.autenticado,
                estatisticas: estatisticas
            });

        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
            res.status(500).render('pages/erro', {
                autenticado: req.session.autenticado,
                erro: 'Erro interno do servidor'
            });
        }
    }
};

module.exports = estatisticaController;
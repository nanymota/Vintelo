var pool = require("../config/pool_conexoes");

const categoriaModel = {
    findAll: async () => {
        try {
            const [resultados] = await pool.execute(
                'SELECT * FROM CATEGORIAS_PRODUTOS ORDER BY NOME_CATEGORIA_PRODUTO'
            );
            return resultados || [];
        } catch (error) {
            console.log('Erro ao buscar categorias:', error);
            return [];
        }
    },

    findById: async (id) => {
        try {
            const [resultados] = await pool.execute(
                'SELECT * FROM CATEGORIAS_PRODUTOS WHERE ID_CATEGORIA_PRODUTO = ?',
                [id]
            );
            return resultados;
        } catch (error) {
            return error;
        }
    },

    findProductsByCategory: async (categoryId, filters = {}) => {
        try {
            let query = `
                SELECT DISTINCT p.*, u.NOME_USUARIO, img.URL_IMG
                FROM PRODUTOS p
                INNER JOIN PRODUTOS_CATEGORIAS pc ON p.ID_PRODUTO = pc.ID_PRODUTO
                INNER JOIN USUARIOS u ON p.ID_USUARIO = u.ID_USUARIO
                LEFT JOIN IMG_PRODUTOS img ON p.ID_PRODUTO = img.ID_PRODUTO
                WHERE pc.ID_CATEGORIA_PRODUTO = ?
            `;
            
            let params = [categoryId];
            
            if (filters.tamanho) {
                query += ' AND p.TAMANHO_PRODUTO = ?';
                params.push(filters.tamanho);
            }
            
            if (filters.cor) {
                query += ' AND p.COR_PRODUTO LIKE ?';
                params.push(`%${filters.cor}%`);
            }
            
            if (filters.condicao) {
                query += ' AND p.CONDICAO_PRODUTO = ?';
                params.push(filters.condicao);
            }
            
            if (filters.precoMin) {
                query += ' AND p.PRECO_PRODUTO >= ?';
                params.push(filters.precoMin);
            }
            
            if (filters.precoMax) {
                query += ' AND p.PRECO_PRODUTO <= ?';
                params.push(filters.precoMax);
            }
            
            query += ' ORDER BY p.DATA_CADASTRO DESC';
            
            const [resultados] = await pool.execute(query, params);
            return resultados;
        } catch (error) {
            return error;
        }
    },

    getFilters: async () => {
        try {
            const [tamanhos] = await pool.execute(
                'SELECT DISTINCT TAMANHO_PRODUTO FROM PRODUTOS WHERE TAMANHO_PRODUTO IS NOT NULL ORDER BY TAMANHO_PRODUTO'
            );
            
            const [cores] = await pool.execute(
                'SELECT DISTINCT COR_PRODUTO FROM PRODUTOS ORDER BY COR_PRODUTO'
            );
            
            const [condicoes] = await pool.execute(
                'SELECT DISTINCT CONDICAO_PRODUTO FROM PRODUTOS ORDER BY CONDICAO_PRODUTO'
            );
            
            return {
                tamanho_produto: (tamanhos || []).map(t => t.TAMANHO_PRODUTO),
                cor_produto: (cores || []).map(c => c.COR_PRODUTO),
                condicao_produto: (condicoes || []).map(c => c.CONDICAO_PRODUTO)
            };
        } catch (error) {
            console.log('Erro ao buscar filtros:', error);
            return {
                tamanho_produto: [],
                cor_produto: [],
                condicao_produto: []
            };
        }
    }
};

module.exports = categoriaModel;
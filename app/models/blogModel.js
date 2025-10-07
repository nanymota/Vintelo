var pool = require("../../config/pool_conexoes");

const blogModel = {
    // Buscar todos os posts do blog
    findAll: async function() {
        try {
            const [resultados] = await pool.execute(
                `SELECT * FROM ARTIGOS_BLOG ORDER BY DT_PUBLICACAO DESC`
            );
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    // Buscar post por ID
    findById: async function(id) {
        try {
            const [resultados] = await pool.execute(
                `SELECT * FROM ARTIGOS_BLOG WHERE ID_ARTIGO = ?`,
                [id]
            );
            return resultados[0];
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    // Criar novo post
    create: async function(dadosBlog) {
        try {
            const [resultado] = await pool.execute(
                `INSERT INTO ARTIGOS_BLOG (TITULO, CONTEUDO, AUTOR, DT_PUBLICACAO, ID_ADM) 
                 VALUES (?, ?, ?, CURDATE(), ?)`,
                [
                    dadosBlog.titulo,
                    dadosBlog.conteudo,
                    dadosBlog.autor || 'Vintélo Fashion',
                    1 // ID_ADM padrão
                ]
            );
            return resultado;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    // Atualizar post
    update: async function(id, dadosBlog) {
        try {
            const [resultado] = await pool.execute(
                `UPDATE ARTIGOS_BLOG SET 
                 TITULO = ?, CONTEUDO = ?, AUTOR = ?, 
                 DT_ULTIMA_EDICAO = NOW(), ID_ADM_EDICAO = ?
                 WHERE ID_ARTIGO = ?`,
                [
                    dadosBlog.titulo,
                    dadosBlog.conteudo,
                    dadosBlog.autor || 'Vintélo Fashion',
                    1, // ID_ADM_EDICAO
                    id
                ]
            );
            return resultado;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    // Deletar post
    delete: async function(id) {
        try {
            const [resultado] = await pool.execute(
                `DELETE FROM ARTIGOS_BLOG WHERE ID_ARTIGO = ?`,
                [id]
            );
            return resultado;
        } catch (error) {
            console.log(error);
            return error;
        }
    }
};

module.exports = blogModel;
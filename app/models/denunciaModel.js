var pool = require('../config/pool_conexoes');

const denunciaModel = {
    listarDenuncias: async function() {
        try {
            const [resultados] = await pool.execute(`
                SELECT 
                    d.ID_DENUNCIA,
                    d.TIPO_ALVO,
                    d.ID_ALVO,
                    d.MOTIVO,
                    d.DESCRICAO,
                    d.DATA_DENUNCIA,
                    COALESCE(d.STATUS, 'pendente') as STATUS,
                    d.RESOLUCAO,
                    u.NOME_USUARIO as DENUNCIANTE,
                    u.USER_USUARIO as USER_DENUNCIANTE,
                    CASE 
                        WHEN d.TIPO_ALVO = 'Brecho' THEN b.NOME_FANTASIA
                        WHEN d.TIPO_ALVO = 'Produto' THEN p.NOME_PRODUTO
                    END as NOME_ALVO,
                    CASE 
                        WHEN d.TIPO_ALVO = 'Brecho' THEN ub.USER_USUARIO
                        WHEN d.TIPO_ALVO = 'Produto' THEN up.USER_USUARIO
                    END as USER_ALVO
                FROM DENUNCIAS d
                JOIN USUARIOS u ON d.ID_USUARIO = u.ID_USUARIO
                LEFT JOIN BRECHOS b ON d.TIPO_ALVO = 'Brecho' AND d.ID_ALVO = b.ID_USUARIO
                LEFT JOIN USUARIOS ub ON b.ID_USUARIO = ub.ID_USUARIO
                LEFT JOIN PRODUTOS p ON d.TIPO_ALVO = 'Produto' AND d.ID_ALVO = p.ID_PRODUTO
                LEFT JOIN USUARIOS up ON p.ID_USUARIO = up.ID_USUARIO
                ORDER BY d.DATA_DENUNCIA DESC
            `);
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    criarDenuncia: async function(dadosDenuncia) {
        try {
            const [resultado] = await pool.execute(
                'INSERT INTO DENUNCIAS (ID_USUARIO, TIPO_ALVO, ID_ALVO, MOTIVO, DESCRICAO) VALUES (?, ?, ?, ?, ?)',
                [dadosDenuncia.idUsuario, dadosDenuncia.tipoAlvo, dadosDenuncia.idAlvo, dadosDenuncia.motivo, dadosDenuncia.descricao]
            );
            return resultado;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    buscarDenunciaPorId: async function(id) {
        try {
            const [resultado] = await pool.execute(
                'SELECT * FROM DENUNCIAS WHERE ID_DENUNCIA = ?',
                [id]
            );
            return resultado[0];
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    atualizarStatus: async function(id, status, resolucao = null) {
        try {
            let query = 'UPDATE DENUNCIAS SET STATUS = ?';
            let params = [status, id];
            
            if (resolucao) {
                query += ', RESOLUCAO = ?';
                params = [status, resolucao, id];
            }
            
            query += ' WHERE ID_DENUNCIA = ?';
            
            const [resultado] = await pool.execute(query, params);
            return resultado;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    excluirDenuncia: async function(id) {
        try {
            const [resultado] = await pool.execute(
                'DELETE FROM DENUNCIAS WHERE ID_DENUNCIA = ?',
                [id]
            );
            return resultado;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    registrarAcao: async function(idDenuncia, acao, adminId) {
        try {
            const [resultado] = await pool.execute(
                'INSERT INTO HISTORICO_DENUNCIAS (ID_DENUNCIA, ACAO, ID_ADMIN, DATA_ACAO) VALUES (?, ?, ?, NOW())',
                [idDenuncia, acao, adminId]
            );
            return resultado;
        } catch (error) {
            console.log(error);
            return error;
        }
    }
};

module.exports = denunciaModel;
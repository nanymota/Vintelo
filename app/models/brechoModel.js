var pool = require("../config/pool_conexoes");

const brechoModel = {
    findAll: async () => {
        try {
            const [resultados] = await pool.query(
                `SELECT b.ID_USUARIO, b.CNPJ_BRECHO, b.RAZAO_SOCIAL, b.NOME_FANTASIA, 
                 u.NOME_USUARIO, u.EMAIL_USUARIO, u.CELULAR_USUARIO, u.LOGRADOURO_USUARIO, 
                 u.BAIRRO_USUARIO, u.CIDADE_USUARIO, u.UF_USUARIO, u.CEP_USUARIO, 
                 u.IMG_URL, u.DESCRICAO_USUARIO
                 FROM BRECHOS b 
                 INNER JOIN USUARIOS u ON b.ID_USUARIO = u.ID_USUARIO 
                 WHERE u.STATUS_USUARIO = a`,
                [1]
            );
            return resultados;
        } catch (error) {
            console.error('Erro no brechoModel.findAll:', error);
            throw error;
        }
    },

    findId: async (id) => {
        try {
            const [resultados] = await pool.query(
                "SELECT b.ID_USUARIO, b.CNPJ_BRECHO, b.RAZAO_SOCIAL, b.NOME_FANTASIA, " +
                "u.NOME_USUARIO, u.EMAIL_USUARIO, u.CELULAR_USUARIO, u.CEP_USUARIO " +
                "FROM BRECHOS b INNER JOIN USUARIOS u ON b.ID_USUARIO = u.ID_USUARIO " +
                "WHERE b.ID_USUARIO = ? AND u.STATUS_USUARIO = ? ",
                [id, 1]
            );
            return resultados;
        } catch (error) {
            console.error('Erro no brechoModel.findId:', error);
            throw error;
        }
    },

    findByCnpj: async (cnpj) => {
        try {
            if (!cnpj) return [];
            const [resultados] = await pool.query(
                "SELECT * FROM BRECHOS WHERE CNPJ_BRECHO = ?",
                [cnpj]
            );
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    findByRazaoSocial: async (razaoSocial) => {
        try {
            const [resultados] = await pool.query(
                "SELECT * FROM BRECHOS WHERE RAZAO_SOCIAL = ?",
                [razaoSocial]
            );
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    findByNomeFantasia: async (nomeFantasia) => {
        try {
            const [resultados] = await pool.query(
                "SELECT * FROM BRECHOS WHERE NOME_FANTASIA = ?",
                [nomeFantasia]
            );
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    findByUserId: async (userId) => {
        try {
            const [resultados] = await pool.query(
                "SELECT * FROM BRECHOS WHERE ID_USUARIO = ?",
                [userId]
            );
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    create: async (camposForm) => {
        try {
            if (!camposForm.ID_USUARIO || !camposForm.NOME_FANTASIA) {
                throw new Error('Campos obrigatórios não foram preenchidos');
            }
            
            const [resultados] = await pool.query(
                'INSERT INTO BRECHOS (ID_USUARIO, CNPJ_BRECHO, RAZAO_SOCIAL, NOME_FANTASIA) VALUES (?, ?, ?, ?)', 
                [camposForm.ID_USUARIO, camposForm.CNPJ_BRECHO, camposForm.RAZAO_SOCIAL, camposForm.NOME_FANTASIA]
            );
            return resultados;
        } catch (error) {
            console.error('Erro no brechoModel.create:', error);
            throw error;
        }
    },

    update: async (camposForm, id) => {
        try {
            const [resultados] = await pool.query(
                "UPDATE BRECHOS SET ? WHERE ID_USUARIO = ?",
                [camposForm, id]
            );
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    delete: async (id) => {
        try {
            const [resultados] = await pool.query(
                "UPDATE USUARIOS SET STATUS_USUARIO = 'inativo' WHERE ID_USUARIO = ?",
                [id]
            );
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    }
};

module.exports = brechoModel;
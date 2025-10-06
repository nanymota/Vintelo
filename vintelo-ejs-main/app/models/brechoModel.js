var pool = require("../config/pool_conexoes");

const brechoModel = {
    findAll: async () => {
        try {
            const [resultados] = await pool.query(
                "SELECT b.ID_USUARIO, b.CNPJ_BRECHO, b.RAZAO_SOCIAL, b.NOME_FANTASIA, " +
                "u.NOME_USUARIO, u.EMAIL_USUARIO, u.CELULAR_USUARIO, u.LOGRADOURO_USUARIO, u.BAIRRO_USUARIO" +
                "u.CIDADE_USUARIO, u.UF_USUARIO, u.CEP_USUARIO, u.IMG_URL, u.DESCRICAO_USUARIO" +
                "FROM BRECHOS b INNER JOIN USUARIOS u ON b.ID_USUARIO = u.ID_USUARIO " +
                "WHERE u.STATUS_USUARIO = 'ativo' "
            );
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    findId: async (id) => {
        try {
            const [resultados] = await pool.query(
                "SELECT b.ID_USUARIO, b.CNPJ_BRECHO, b.RAZAO_SOCIAL, b.NOME_FANTASIA, " +
                "u.NOME_USUARIO, u.EMAIL_USUARIO, u.CELULAR_USUARIO, u.CEP_USUARIO " +
                "FROM BRECHOS b INNER JOIN USUARIOS u ON b.ID_USUARIO = u.ID_USUARIO " +
                "WHERE b.ID_USUARIO = ? AND u.STATUS_USUARIO = 'ativo' ",
                [id]
            );
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
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

    create: async (camposForm) => {
        try {
            if (camposForm.CNPJ_BRECHO && camposForm.CNPJ_BRECHO.length !== 14) {
                throw new Error('CNPJ deve ter 14 caracteres');
            }
            if (!camposForm.ID_USUARIO || !camposForm.RAZAO_SOCIAL || !camposForm.NOME_FANTASIA) {
                throw new Error('Campos obrigatórios não foram preenchidos');
            }
            const [resultados] = await pool.query('INSERT INTO BRECHOS SET ?', [camposForm]);
            return resultados;

        } catch (error) {
            console.log(error);
            return null;
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
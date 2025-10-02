var pool = require("../config/pool_conexoes");

const tipoUsuarioModel = {
    findAll: async () => {
        try {
            const [resultados] = await pool.query(
                "SELECT * FROM TIPO_USUARIO WHERE STATUS_TIPO_USUARIO = 'ATIVO'"
            );
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    findById: async (id) => {
        try {
            const [resultados] = await pool.query(
                "SELECT * FROM TIPO_USUARIO WHERE ID_TIPO_USUARIO = ? AND STATUS_TIPO_USUARIO = 'ATIVO'",
                [id]
            );
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    findByTipo: async (tipo) => {
        try {
            const [resultados] = await pool.query(
                "SELECT * FROM TIPO_USUARIO WHERE TIPO_USUARIO = ? AND STATUS_TIPO_USUARIO = 'ATIVO'",
                [tipo]
            );
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    }
};

module.exports = tipoUsuarioModel;
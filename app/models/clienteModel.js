var pool = require("../config/pool_conexoes");

const clienteModel = {
    findAll: async () => {
        try {
            const [resultados] = await pool.query(
                "SELECT c.ID_USUARIO, c.DATA_NASC, c.CPF_CLIENTE, " +
                "u.NOME_USUARIO, u.EMAIL_USUARIO, u.CELULAR_USUARIO " +
                "FROM CLIENTES c INNER JOIN USUARIOS u ON c.ID_USUARIO = u.ID_USUARIO " +
                "WHERE u.STATUS_USUARIO = 'ativo' OR u.STATUS_USUARIO = 'a' OR u.STATUS_USUARIO = 1"
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
                "SELECT c.ID_USUARIO, c.DATA_NASC, c.CPF_CLIENTE, " +
                "u.NOME_USUARIO, u.EMAIL_USUARIO, u.CELULAR_USUARIO " +
                "FROM CLIENTES c INNER JOIN USUARIOS u ON c.ID_USUARIO = u.ID_USUARIO " +
                "WHERE c.ID_USUARIO = ? AND (u.STATUS_USUARIO = 'ativo' OR u.STATUS_USUARIO = 'a' OR u.STATUS_USUARIO = 1)",
                [id]
            );
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    findByCpf: async (cpf) => {
        try {
            const [resultados] = await pool.query(
                "SELECT * FROM CLIENTES WHERE CPF_CLIENTE = ?",
                [cpf]
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
                "SELECT * FROM CLIENTES WHERE ID_USUARIO = ?",
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
            const [resultados] = await pool.query(
                "INSERT INTO CLIENTES SET ?",
                [camposForm]
            );
            return resultados;
        } catch (error) {
            console.log(error);
            return null;
        }
    },

    update: async (camposForm, id) => {
        try {
            const [resultados] = await pool.query(
                "UPDATE CLIENTES SET ? WHERE ID_USUARIO = ?",
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
                "DELETE FROM CLIENTES WHERE ID_USUARIO = ?",
                [id]
            );
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    }
};

module.exports = clienteModel;
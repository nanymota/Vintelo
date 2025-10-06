var pool = require("../config/pool_conexoes");

const sacolaModel = {
    findByUserId: async (idUsuario) => {
        try {
            const [resultados] = await pool.query(
                "SELECT s.*, is.*, p.NOME_PRODUTO, p.PRECO FROM SACOLA s " +
                "LEFT JOIN ITENS_SACOLA is ON s.ID_SACOLA = is.ID_SACOLA " +
                "LEFT JOIN PRODUTOS p ON is.ID_PRODUTO = p.ID_PRODUTO " +
                "WHERE s.ID_USUARIO = ?",
                [idUsuario]
            );
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    createSacola: async (idUsuario) => {
        try {
            const [resultados] = await pool.query(
                "INSERT INTO SACOLA (ID_USUARIO) VALUES (?)",
                [idUsuario]
            );
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    addItem: async (idSacola, idProduto, quantidade = 1) => {
        try {
            const [resultados] = await pool.query(
                "INSERT INTO ITENS_SACOLA (ID_SACOLA, ID_PRODUTO, QUANTIDADE) VALUES (?, ?, ?) " +
                "ON DUPLICATE KEY UPDATE QUANTIDADE = QUANTIDADE + ?",
                [idSacola, idProduto, quantidade, quantidade]
            );
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    updateQuantidade: async (idItem, quantidade) => {
        try {
            const [resultados] = await pool.query(
                "UPDATE ITENS_SACOLA SET QUANTIDADE = ? WHERE ID_ITEM_SACOLA = ?",
                [quantidade, idItem]
            );
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    removeItem: async (idItem) => {
        try {
            const [resultados] = await pool.query(
                "DELETE FROM ITENS_SACOLA WHERE ID_ITEM_SACOLA = ?",
                [idItem]
            );
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    limparSacola: async (idUsuario) => {
        try {
            const [resultados] = await pool.query(
                "DELETE is FROM ITENS_SACOLA is " +
                "INNER JOIN SACOLA s ON is.ID_SACOLA = s.ID_SACOLA " +
                "WHERE s.ID_USUARIO = ?",
                [idUsuario]
            );
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    getTotalItens: async (idUsuario) => {
        try {
            const [resultados] = await pool.query(
                "SELECT SUM(is.QUANTIDADE) as total FROM ITENS_SACOLA is " +
                "INNER JOIN SACOLA s ON is.ID_SACOLA = s.ID_SACOLA " +
                "WHERE s.ID_USUARIO = ?",
                [idUsuario]
            );
            return resultados[0].total || 0;
        } catch (error) {
            console.log(error);
            return 0;
        }
    },

    getValorTotal: async (idUsuario) => {
        try {
            const [resultados] = await pool.query(
                "SELECT SUM(is.QUANTIDADE * p.PRECO) as VALOR_TOTAL FROM ITENS_SACOLA is " +
                "INNER JOIN SACOLA s ON is.ID_SACOLA = s.ID_SACOLA " +
                "INNER JOIN PRODUTOS p ON is.ID_PRODUTO = p.ID_PRODUTO " +
                "WHERE s.ID_USUARIO = ?",
                [idUsuario]
            );
            return resultados[0].valor_total || 0;
        } catch (error) {
            console.log(error);
            return 0;
        }
    }
};

module.exports = sacolaModel;
var pool = require("../config/pool_conexoes");

const categoriaModel = {
    findAll: async () => {
        try {
            const [resultados] = await pool.query(
                "SELECT * FROM CATEGORIAS_PRODUTOS"
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
                "SELECT * FROM CATEGORIAS_PRODUTOS WHERE ID_CATEGORIA_PROD = ?",
                [id]
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
                "INSERT INTO CATEGORIAS_PRODUTOS SET ?",
                [camposForm]
            );
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    update: async (camposForm, id) => {
        try {
            const [resultados] = await pool.query(
                "UPDATE CATEGORIAS_PRODUTOS SET ? WHERE ID_CATEGORIA_PROD = ?",
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
                "DELETE FROM CATEGORIAS_PRODUTOS WHERE ID_CATEGORIA_PROD = ?",
                [id]
            );
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    addProdutoCategoria: async (idProduto, idCategoria) => {
        try {
            const [resultados] = await pool.query(
                "INSERT INTO PRODUTOS_CATEGORIAS (ID_PROD, ID_CATEGORIA_PROD) VALUES (?, ?)",
                [idProduto, idCategoria]
            );
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    removeProdutoCategoria: async (idProduto, idCategoria) => {
        try {
            const [resultados] = await pool.query(
                "DELETE FROM PRODUTOS_CATEGORIAS WHERE ID_PROD = ? AND ID_CATEGORIA_PROD = ?",
                [idProduto, idCategoria]
            );
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    findProdutosPorCategoria: async (idCategoria) => {
        try {
            const [resultados] = await pool.query(
                "SELECT p.* FROM PRODUTOS p " +
                "INNER JOIN PRODUTOS_CATEGORIAS pc ON p.ID_PROD = pc.ID_PROD " +
                "WHERE pc.ID_CATEGORIA_PROD = ?",
                [idCategoria]
            );
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    }
};

module.exports = categoriaModel;
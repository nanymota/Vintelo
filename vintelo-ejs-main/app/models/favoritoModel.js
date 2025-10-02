const moment = require("moment");
var pool = require("../config/pool_conexoes");

const favoritoModel = {
    findAll: async () => {
        try {
            const [resultados] = await pool.query("SELECT * FROM FAVORITOS");
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    findID: async (idProduto, idUsuario) => {
        try {
            const [resultados] = await pool.query(
                "SELECT * FROM FAVORITOS WHERE PRODUTO_ID_PRODUTO = ? AND USUARIO_ID_USUARIO = ?",
                [idProduto, idUsuario]);
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    create: async (camposJson) => {
        try {
            const [resultados] = await pool.query("INSERT INTO FAVORITOS SET ?", camposJson);
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    update: async (camposJson, idProduto, idUsuario) => {
        try {
            const [resultados] = await pool.query(
                "UPDATE FAVORITOS SET ? WHERE PRODUTO_ID_PRODUTO = ? AND USUARIO_ID_USUARIO = ?", 
                [camposJson, idProduto, idUsuario])
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }

    },

    delete: async (idProduto, idUsuario) => {
        try {
            const [resultados] = await pool.query(
                "UPDATE FAVORITOS SET STATUS_FAVORITO = 0 WHERE PRODUTO_ID_PRODUTO = ? AND USUARIO_ID_USUARIO = ?", 
                [idProduto, idUsuario]);
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    favoritar: async (dadosFavorito) => {
        try {
            if (dadosFavorito.situacao == "favorito") {
                return await favoritoModel.update(
                    { STATUS_FAVORITO: 0 }, dadosFavorito.idProduto, dadosFavorito.idUsuario
                );
            } else if (dadosFavorito.situacao == "favoritar") {
                const result = await favoritoModel.findID(
                    dadosFavorito.idProduto, dadosFavorito.idUsuario
                );
                if (result.length === 0) {
                    let obj = {
                        PRODUTO_ID_PRODUTO: dadosFavorito.idProduto,
                        USUARIO_ID_USUARIO: dadosFavorito.idUsuario,
                        DT_INCLUSAO_FAVORITO: moment().format("YYYY-MM-DD"),
                        STATUS_FAVORITO: 1
                    }
                    return await favoritoModel.create(obj);
                } else {
                    return await favoritoModel.update(
                        { STATUS_FAVORITO: 1, DT_INCLUSAO_FAVORITO: moment().format("YYYY/MM/DD") }, dadosFavorito.idProduto, dadosFavorito.idUsuario
                    );
                }

            }
        } catch (error) {
            console.log(error);
            return error;
        }
    }

}

module.exports = { favoritoModel };
var pool = require("../config/pool_conexoes");

const bannerModel = {
    findAll: async () => {
        try {
            const [resultados] = await pool.query("SELECT * FROM BANNERS ORDER BY POSICAO, ID_BANNER");
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    findByPosition: async (posicao) => {
        try {
            const [resultados] = await pool.query("SELECT * FROM BANNERS WHERE POSICAO = ? ORDER BY ID_BANNER", [posicao]);
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    create: async (camposJson) => {
        try {
            const [resultados] = await pool.query("INSERT INTO BANNERS SET ?", camposJson);
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    update: async (camposJson, id) => {
        try {
            const [resultados] = await pool.query("UPDATE BANNERS SET ? WHERE ID_BANNER = ?", [camposJson, id]);
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    updateOrCreate: async (url_imagem, posicao, ordem, id_adm) => {
        try {
            // Primeiro tenta atualizar
            const [existing] = await pool.query(
                "SELECT ID_BANNER FROM BANNERS WHERE POSICAO = ? ORDER BY ID_BANNER LIMIT ?, 1",
                [posicao, ordem - 1]
            );
            
            if (existing.length > 0) {
                // Atualiza existente
                const [resultados] = await pool.query(
                    "UPDATE BANNERS SET URL_IMAGEM = ? WHERE ID_BANNER = ?",
                    [url_imagem, existing[0].ID_BANNER]
                );
                return resultados;
            } else {
                // Cria novo
                const [resultados] = await pool.query(
                    "INSERT INTO BANNERS (URL_IMAGEM, POSICAO, ID_ADM) VALUES (?, ?, ?)",
                    [url_imagem, posicao, id_adm || 1]
                );
                return resultados;
            }
        } catch (error) {
            console.log(error);
            return error;
        }
    }
};

module.exports = { bannerModel };
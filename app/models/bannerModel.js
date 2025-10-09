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
            console.log('updateOrCreate chamado:', { url_imagem, posicao, ordem, id_adm });
            
            // Busca banner específico por posição e ordem
            const [existing] = await pool.query(
                "SELECT ID_BANNER FROM BANNERS WHERE POSICAO = ? AND ID_BANNER = ?",
                [posicao, ordem]
            );
            
            if (existing.length > 0) {
                // Atualiza existente
                console.log('Atualizando banner existente:', existing[0].ID_BANNER);
                const [resultados] = await pool.query(
                    "UPDATE BANNERS SET URL_IMAGEM = ? WHERE ID_BANNER = ?",
                    [url_imagem, existing[0].ID_BANNER]
                );
                return resultados;
            } else {
                // Cria novo com ID específico
                console.log('Criando novo banner com ID:', ordem);
                const [resultados] = await pool.query(
                    "INSERT INTO BANNERS (ID_BANNER, URL_IMAGEM, POSICAO, ID_ADM) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE URL_IMAGEM = VALUES(URL_IMAGEM)",
                    [ordem, url_imagem, posicao, id_adm || 1]
                );
                return resultados;
            }
        } catch (error) {
            console.log('Erro no updateOrCreate:', error);
            return error;
        }
    }
};

module.exports = { bannerModel };
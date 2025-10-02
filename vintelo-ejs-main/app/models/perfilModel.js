var pool = require("../config/pool_conexoes");

const perfilModel = {
    findAll: async () => {
        try {
            const [resultados] = await pool.query(
                "SELECT p.*, u.NOME_USUARIO, u.IMAGEM_USUARIO FROM PERFIS p " +
                "INNER JOIN USUARIOS u ON p.ID_USUARIO = u.ID_USUARIO"
            );
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    findByUserId: async (idUsuario) => {
        try {
            const [resultados] = await pool.query(
                "SELECT p.*, u.NOME_USUARIO, u.IMAGEM_USUARIO FROM PERFIS p " +
                "INNER JOIN USUARIOS u ON p.ID_USUARIO = u.ID_USUARIO " +
                "WHERE p.ID_USUARIO = ?",
                [idUsuario]
            );
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    findById: async (idPerfil) => {
        try {
            const [resultados] = await pool.query(
                "SELECT * FROM PERFIS WHERE ID_PERFIL = ?",
                [idPerfil]
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
                "INSERT INTO PERFIS SET ?",
                [camposForm]
            );
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    update: async (camposForm, idPerfil) => {
        try {
            const [resultados] = await pool.query(
                "UPDATE PERFIS SET ? WHERE ID_PERFIL = ?",
                [camposForm, idPerfil]
            );
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    updateByUserId: async (camposForm, idUsuario) => {
        try {
            const [resultados] = await pool.query(
                "UPDATE PERFIS SET ? WHERE ID_USUARIO = ?",
                [camposForm, idUsuario]
            );
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    delete: async (idPerfil) => {
        try {
            const [resultados] = await pool.query(
                "DELETE FROM PERFIS WHERE ID_PERFIL = ?",
                [idPerfil]
            );
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    incrementarSeguidores: async (idUsuario) => {
        try {
            const [resultados] = await pool.query(
                "UPDATE PERFIS SET SEGUIDORES = SEGUIDORES + 1 WHERE ID_USUARIO = ?",
                [idUsuario]
            );
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    incrementarVendidas: async (idUsuario) => {
        try {
            const [resultados] = await pool.query(
                "UPDATE PERFIS SET VENDIDAS = VENDIDAS + 1 WHERE ID_USUARIO = ?",
                [idUsuario]
            );
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    }
};

module.exports = perfilModel;
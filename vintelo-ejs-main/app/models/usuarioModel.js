
var pool = require("../config/pool_conexoes");
 
const usuarioModel = {
    findAll: async () => {
        try {
            const [resultados] = await pool.query(
                "SELECT u.ID_USUARIO, u.NOME_USUARIO, u.USER_USUARIO, " +
                "u.SENHA_USUARIO, u.EMAIL_USUARIO, u.CELULAR_USUARIO, u.TIPO_USUARIO, " +
                "u.STATUS_USUARIO, t.TIPO_USUARIO as NOME_TIPO, t.DESCRICAO_USUARIO " +
                "FROM USUARIOS u INNER JOIN TIPO_USUARIO t ON u.TIPO_USUARIO = t.ID_TIPO_USUARIO " +
                "WHERE u.STATUS_USUARIO = 1"
            );
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },
    findUserEmail: async (camposForm) => {
        try {
            const [resultados] = await pool.query (
                "SELECT * FROM USUARIOS WHERE USER_USUARIO = ? or EMAIL_USUARIO =? ", 
                [camposForm.user_usuario, camposForm.user_usuario]
            )
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },
 
    findCampoCustom: async (campo, valor) => {
        try {
            const [resultados] = await pool.query(
                `SELECT count(*) as totalReg FROM USUARIOS WHERE ${campo} = ?`,
                [valor]
            )
            return resultados[0].totalReg;
        } catch (error) {
            console.log (error);
            return 0;
        }
    },
 
    findId: async (id) => {
        try {
            const [resultados] = await pool.query(
                "SELECT u.ID_USUARIO, u.NOME_USUARIO, u.USER_USUARIO, " + 
                "u.SENHA_USUARIO, u.EMAIL_USUARIO, u.CELULAR_USUARIO, u.TIPO_USUARIO, " +
                "u.STATUS_USUARIO, u.NUMERO_USUARIO, u.CEP_USUARIO, u.IMAGEM_USUARIO, " + 
                "t.ID_TIPO_USUARIO, t.DESCRICAO_USUARIO " +
                "FROM USUARIOS u INNER JOIN TIPO_USUARIO t ON u.TIPO_USUARIO = t.ID_TIPO_USUARIO " +
                "WHERE u.STATUS_USUARIO = 1 AND u.ID_USUARIO = ?", [id]
            )
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },
 
    create: async (camposForm) => {
        try {
            const [resultados] = await pool.query(
                "INSERT INTO USUARIOS SET ?",
                [camposForm]
            )
            return resultados;
        } catch (error) {
            console.log(error);
            return null;
        }
    },

    createBrecho: async (camposForm) => {
        try {
            const [resultados] = await pool.query(
                "INSERT INTO BRECHOS (ID_BRECHO, CNPJ_BRECHO, RAZAO_SOCIAL, NOME_FANTASIA) VALUES (?, ?, ?, ?)",
                [camposForm.ID_BRECHO, camposForm.CNPJ_BRECHO, camposForm.RAZAO_SOCIAL, camposForm.NOME_FANTASIA]
            )
            return resultados;
        } catch (error) {
            console.log(error);
            return null;
        }
    },
 
    update: async ( camposForm, id) => {
        try {
            const [resultados] = await pool.query(
                "UPDATE USUARIOS SET ?" +
                " WHERE ID_USUARIO = ?",
                [camposForm, id]
            )
            return resultados;
        }catch (error) {
            console.log(error);
            return error;
        }
    },
 
    delete: async (id) => {
        try {
            const [resultados] = await pool.query(
                "UPDATE USUARIOS SET STATUS_USUARIO = 0 WHERE ID_USUARIO = ? ", [id] 
            )
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },
};
 
module.exports = usuarioModel
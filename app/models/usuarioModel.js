
var pool = require("../config/pool_conexoes");
 
const usuarioModel = {
    findAll: async () => {
        try {
            const [resultados] = await pool.query(
                "SELECT ID_USUARIO, NOME_USUARIO, USER_USUARIO, EMAIL_USUARIO, " +
                "CELULAR_USUARIO, TIPO_USUARIO, STATUS_USUARIO " +
                "FROM USUARIOS WHERE STATUS_USUARIO = 'ativo'"
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
            // Validar nome do campo para evitar SQL injection
            const camposPermitidos = ['email_usuario', 'user_usuario', 'google_id', 'instagram_id'];
            if (!camposPermitidos.includes(campo.toLowerCase())) {
                throw new Error('Campo não permitido');
            }
            
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

    findUserByGoogleId: async (googleId) => {
        try {
            const [resultados] = await pool.query(
                "SELECT * FROM USUARIOS WHERE GOOGLE_ID = ?",
                [googleId]
            )
            return resultados;
        } catch (error) {
            console.log(error);
            return [];
        }
    },

    findUserByInstagramId: async (instagramId) => {
        try {
            const [resultados] = await pool.query(
                "SELECT * FROM USUARIOS WHERE INSTAGRAM_ID = ?",
                [instagramId]
            )
            return resultados;
        } catch (error) {
            console.log(error);
            return [];
        }
    },
 
    findId: async (id) => {
        try {
            const [resultados] = await pool.query(
                "SELECT ID_USUARIO, NOME_USUARIO, USER_USUARIO, EMAIL_USUARIO, " + 
                "CELULAR_USUARIO, TIPO_USUARIO, STATUS_USUARIO, LOGRADOURO_USUARIO, " +
                "NUMERO_USUARIO, BAIRRO_USUARIO, CIDADE_USUARIO, UF_USUARIO, " +
                "CEP_USUARIO, IMG_URL, DESCRICAO_USUARIO " +
                "FROM USUARIOS WHERE ID_USUARIO = ?", [id]
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
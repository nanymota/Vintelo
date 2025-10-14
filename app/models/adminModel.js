var pool = require("../config/pool_conexoes");

const adminModel = {
    // Buscar todos os administradores
    findAll: async () => {
        try {
            const [resultados] = await pool.query(`
                SELECT u.ID_USUARIO, u.NOME_USUARIO, u.USER_USUARIO, u.EMAIL_USUARIO, 
                       u.CELULAR_USUARIO, u.DATA_CADASTRO, u.STATUS_USUARIO,
                       a.CPF_ADM
                FROM USUARIOS u
                JOIN ADMINISTRADORES a ON u.ID_USUARIO = a.ID_USUARIO
                WHERE u.TIPO_USUARIO = 'a'
                ORDER BY u.DATA_CADASTRO DESC
            `);
            return resultados;
        } catch (error) {
            console.log(error);
            return [];
        }
    },

    // Buscar administrador por ID
    findById: async (id) => {
        try {
            const [resultados] = await pool.query(`
                SELECT u.*, a.CPF_ADM
                FROM USUARIOS u
                JOIN ADMINISTRADORES a ON u.ID_USUARIO = a.ID_USUARIO
                WHERE u.ID_USUARIO = ? AND u.TIPO_USUARIO = 'a'
            `, [id]);
            return resultados;
        } catch (error) {
            console.log(error);
            return [];
        }
    },

    // Buscar administrador por email para login (versão simplificada)
    findByEmail: async (email) => {
        try {
            // Primeiro tentar com JOIN
            const [resultados] = await pool.query(`
                SELECT u.ID_USUARIO, u.NOME_USUARIO, u.EMAIL_USUARIO, u.SENHA_USUARIO, 
                       u.TIPO_USUARIO, u.STATUS_USUARIO
                FROM USUARIOS u
                LEFT JOIN ADMINISTRADORES a ON u.ID_USUARIO = a.ID_USUARIO
                WHERE u.EMAIL_USUARIO = ? AND u.TIPO_USUARIO = 'a'
            `, [email]);
            
            console.log('Busca admin por email:', email, 'Resultados:', resultados.length);
            if (resultados.length > 0) {
                console.log('Admin encontrado:', {
                    id: resultados[0].ID_USUARIO,
                    nome: resultados[0].NOME_USUARIO,
                    tipo: resultados[0].TIPO_USUARIO,
                    status: resultados[0].STATUS_USUARIO
                });
            }
            
            return resultados;
        } catch (error) {
            console.log('Erro ao buscar admin por email:', error);
            // Fallback: buscar apenas na tabela USUARIOS
            try {
                const [fallback] = await pool.query(`
                    SELECT ID_USUARIO, NOME_USUARIO, EMAIL_USUARIO, SENHA_USUARIO, 
                           TIPO_USUARIO, STATUS_USUARIO
                    FROM USUARIOS 
                    WHERE EMAIL_USUARIO = ? AND TIPO_USUARIO = 'a'
                `, [email]);
                console.log('Fallback - Admin encontrado:', fallback.length);
                return fallback;
            } catch (fallbackError) {
                console.log('Erro no fallback:', fallbackError);
                return [];
            }
        }
    },

    // Verificar se nome de usuário já existe
    checkUserExists: async (username) => {
        try {
            const [resultados] = await pool.query(
                'SELECT COUNT(*) as count FROM USUARIOS WHERE USER_USUARIO = ?',
                [username]
            );
            return resultados[0].count > 0;
        } catch (error) {
            console.log(error);
            return false;
        }
    },

    // Verificar se email já existe
    checkEmailExists: async (email) => {
        try {
            const [resultados] = await pool.query(
                'SELECT COUNT(*) as count FROM USUARIOS WHERE EMAIL_USUARIO = ?',
                [email]
            );
            return resultados[0].count > 0;
        } catch (error) {
            console.log(error);
            return false;
        }
    },

    // Criar novo administrador
    create: async (dadosUsuario, cpfAdmin = '00000000000') => {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // Inserir na tabela USUARIOS
            const [resultadoUsuario] = await connection.query(
                'INSERT INTO USUARIOS SET ?',
                [dadosUsuario]
            );
            
            // Inserir na tabela ADMINISTRADORES
            await connection.query(
                'INSERT INTO ADMINISTRADORES (ID_USUARIO, CPF_ADM) VALUES (?, ?)',
                [resultadoUsuario.insertId, cpfAdmin]
            );
            
            await connection.commit();
            return resultadoUsuario;
        } catch (error) {
            await connection.rollback();
            console.log(error);
            throw error;
        } finally {
            connection.release();
        }
    },

    // Atualizar dados do administrador
    update: async (dadosUsuario, id) => {
        try {
            const [resultados] = await pool.query(
                'UPDATE USUARIOS SET ? WHERE ID_USUARIO = ? AND TIPO_USUARIO = "a"',
                [dadosUsuario, id]
            );
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    // Desativar administrador (soft delete)
    deactivate: async (id) => {
        try {
            const [resultados] = await pool.query(
                'UPDATE USUARIOS SET STATUS_USUARIO = "i" WHERE ID_USUARIO = ? AND TIPO_USUARIO = "a"',
                [id]
            );
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    // Reativar administrador
    activate: async (id) => {
        try {
            const [resultados] = await pool.query(
                'UPDATE USUARIOS SET STATUS_USUARIO = "a" WHERE ID_USUARIO = ? AND TIPO_USUARIO = "a"',
                [id]
            );
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    // Contar total de administradores ativos
    countActive: async () => {
        try {
            const [resultados] = await pool.query(
                'SELECT COUNT(*) as total FROM USUARIOS WHERE TIPO_USUARIO = "a" AND STATUS_USUARIO = "a"'
            );
            return resultados[0].total;
        } catch (error) {
            console.log(error);
            return 0;
        }
    }
};

module.exports = adminModel;
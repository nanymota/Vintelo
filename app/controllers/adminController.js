const usuario = require("../models/usuarioModel");
const adminModel = require("../models/adminModel");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");

const adminController = {
    // Validações específicas para administradores
    regrasValidacaoAdmin: [
        body("user_usuario")
            .notEmpty().withMessage("Nome de usuário é obrigatório!")
            .isLength({ min: 3, max: 20 }).withMessage("Nome de usuário deve ter de 3 a 20 caracteres!")
            .matches(/^[a-zA-Z0-9_]+$/).withMessage("Nome de usuário deve conter apenas letras, números e _")
            .custom(async value => {
                const userExists = await adminModel.checkUserExists(value);
                if (userExists) {
                    throw new Error('Nome de usuário já está em uso!');
                }
            }),
        body("nome_usuario")
            .notEmpty().withMessage("Nome completo é obrigatório!")
            .isLength({ min: 2, max: 70 }).withMessage("Nome deve ter de 2 a 70 caracteres!")
            .matches(/^[a-zA-ZÀ-ÿ\s]+$/).withMessage("Nome deve conter apenas letras e espaços"),
        body("email_usuario")
            .notEmpty().withMessage("E-mail é obrigatório!")
            .isEmail().withMessage("Digite um e-mail válido!")
            .custom(async value => {
                const emailExists = await adminModel.checkEmailExists(value);
                if (emailExists) {
                    throw new Error('E-mail já cadastrado!');
                }
            }),
        body("senha_usuario")
            .notEmpty().withMessage("Senha é obrigatória!")
            .isLength({ min: 6 }).withMessage("Senha deve ter pelo menos 6 caracteres")
    ],

    // Cadastrar novo administrador
    cadastrarAdmin: async (req, res) => {
        const erros = validationResult(req);
        
        if (!erros.isEmpty()) {
            return res.render("pages/cadastroadm", { 
                listaErros: erros, 
                dadosNotificacao: null, 
                valores: req.body
            });
        }

        try {
            const { 
                user_usuario, 
                nome_usuario, 
                email_usuario, 
                celular_usuario, 
                cep_usuario, 
                logradouro_usuario, 
                numero_usuario, 
                bairro_usuario, 
                cidade_usuario, 
                uf_usuario, 
                senha_usuario 
            } = req.body;

            const senhaHash = bcrypt.hashSync(senha_usuario, 10);
            
            // Preparar dados do usuário
            const dadosUsuario = {
                USER_USUARIO: user_usuario.trim(),
                NOME_USUARIO: nome_usuario.trim(),
                EMAIL_USUARIO: email_usuario.trim(),
                CELULAR_USUARIO: celular_usuario?.replace(/\D/g, ''),
                SENHA_USUARIO: senhaHash,
                TIPO_USUARIO: 'a',
                CEP_USUARIO: cep_usuario?.replace(/\D/g, ''),
                LOGRADOURO_USUARIO: logradouro_usuario?.trim(),
                NUMERO_USUARIO: numero_usuario,
                BAIRRO_USUARIO: bairro_usuario?.trim(),
                CIDADE_USUARIO: cidade_usuario?.trim(),
                UF_USUARIO: uf_usuario?.toUpperCase(),
                STATUS_USUARIO: 'a'
            };
            
            // Criar administrador usando o model
            const resultado = await adminModel.create(dadosUsuario);
            
            // Criar sessão
            req.session.autenticado = {
                autenticado: nome_usuario,
                id: resultado.insertId,
                tipo: 'a',
                nome: nome_usuario,
                email: email_usuario
            };
            
            res.redirect('/homeadm');
        } catch (error) {
            console.log('Erro ao cadastrar admin:', error);
            res.render('pages/cadastroadm', {
                listaErros: null,
                dadosNotificacao: { 
                    titulo: 'Erro do Sistema', 
                    mensagem: 'Falha ao criar administrador. Tente novamente.', 
                    tipo: 'error' 
                },
                valores: req.body
            });
        }
    },

    // Validações para login de administradores
    regrasValidacaoLogin: [
        body("email_usu")
            .notEmpty().withMessage("E-mail é obrigatório!")
            .isEmail().withMessage("Digite um e-mail válido!"),
        body("senha_usu")
            .notEmpty().withMessage("Senha é obrigatória!")
            .isLength({ min: 1 }).withMessage("Senha não pode estar vazia")
    ],

    // Login específico para administradores
    loginAdmin: async (req, res) => {
        const erros = validationResult(req);
        
        if (!erros.isEmpty()) {
            return res.render("pages/cadastroadm", { 
                listaErros: erros, 
                dadosNotificacao: null, 
                valores: req.body
            });
        }

        try {
            const { email_usu, senha_usu } = req.body;
            
            console.log('=== LOGIN ADMIN DEBUG ===');
            console.log('Email:', email_usu);
            console.log('Senha fornecida:', senha_usu ? 'SIM' : 'NÃO');
            
            const admin = await adminModel.findByEmail(email_usu);
            console.log('Admins encontrados:', admin.length);
            
            if (admin.length === 0) {
                console.log('Nenhum admin encontrado com este email');
                return res.render('pages/cadastroadm', {
                    listaErros: null,
                    dadosNotificacao: { 
                        titulo: 'Erro!', 
                        mensagem: 'Email não encontrado ou não é administrador', 
                        tipo: 'error' 
                    },
                    valores: { email_usu }
                });
            }
            
            const senhaCorreta = bcrypt.compareSync(senha_usu, admin[0].SENHA_USUARIO);
            console.log('Senha correta:', senhaCorreta);
            console.log('Hash no banco:', admin[0].SENHA_USUARIO?.substring(0, 10) + '...');
            
            if (!senhaCorreta) {
                console.log('Senha incorreta');
                return res.render('pages/cadastroadm', {
                    listaErros: null,
                    dadosNotificacao: { 
                        titulo: 'Erro!', 
                        mensagem: 'Senha incorreta', 
                        tipo: 'error' 
                    },
                    valores: { email_usu }
                });
            }
            
            console.log('Login bem-sucedido para:', admin[0].NOME_USUARIO);
            
            req.session.autenticado = {
                autenticado: admin[0].NOME_USUARIO,
                id: admin[0].ID_USUARIO,
                tipo: admin[0].TIPO_USUARIO,
                nome: admin[0].NOME_USUARIO,
                email: admin[0].EMAIL_USUARIO
            };
            
            console.log('Sessão criada:', req.session.autenticado);
            res.redirect('/homeadm');
        } catch (error) {
            console.log('Erro no login admin:', error);
            res.render('pages/cadastroadm', {
                listaErros: null,
                dadosNotificacao: { 
                    titulo: 'Erro!', 
                    mensagem: 'Erro interno do servidor', 
                    tipo: 'error' 
                },
                valores: {}
            });
        }
    }
};

module.exports = adminController;
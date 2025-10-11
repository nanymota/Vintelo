const brechoModel = require("../models/brechoModel");
const usuario = require("../models/usuarioModel");
const { body, validationResult } = require("express-validator");
const validator = require('validator');
const bcrypt = require("bcryptjs");

const sanitizeInput = (input) => {
    if (typeof input === 'string') {
        return validator.escape(input.trim());
    }
    return input;
};

const sanitizeObject = (obj) => {
    const sanitized = {};
    for (const key in obj) {
        sanitized[key] = sanitizeInput(obj[key]);
    }
    return sanitized;
};

const brechoController = {

    regrasValidacaoBrecho: [
        body("cnpj_brecho")
            .optional({ checkFalsy: true })
            .isLength({ min: 14, max: 18 }).withMessage("CNPJ deve ter 14 dígitos!")
            .custom(async (value) => {
                if (value && value.trim()) {
                    const cnpjLimpo = value.replace(/\D/g, '');
                    if (cnpjLimpo.length === 14) {
                        const existe = await brechoModel.findByCnpj(cnpjLimpo);
                        if (existe.length > 0) throw new Error('CNPJ já cadastrado');
                    }
                }
                return true;
            }),
        body("razao_social")
            .optional({ checkFalsy: true })
            .isLength({ min: 3, max: 100 }).withMessage("Razão social deve ter de 3 a 100 caracteres!")
    ],

    regrasValidacaoUsuario: [
        body("nomeusu_usu")
            .isLength({ min: 3, max: 45 }).withMessage("Nome do brechó deve ter de 3 a 45 caracteres!")
            .custom(async (value) => {
                const existe = await usuario.findCampoCustom('USER USUARIO', value);
                if (existe > 0) throw new Error('Nome de usuário já existe');
                return true;
            }),
        body("email_usu")
            .isEmail().withMessage("Digite um e-mail válido!")
            .custom(async (value, { req }) => {
                const existe = await usuario.findCampoCustom('email_usuario', value);
                if (existe > 0) {
                    // Permitir se for o próprio usuário autenticado
                    if (req.session && req.session.autenticado && req.session.autenticado.email === value) {
                        return true;
                    }
                    throw new Error('E-mail já cadastrado');
                }
                return true;
            }),
        body("nome_usu")
            .isLength({ min: 3, max: 100 }).withMessage("Nome completo deve ter de 3 a 100 caracteres!"),
        body("senha_usu")
            .isLength({ min: 6 }).withMessage("Senha deve ter no mínimo 6 caracteres!"),
        body("confirmar_senha")
            .custom((value, { req }) => {
                if (value !== req.body.senha_usu) {
                    throw new Error('Confirmação de senha não confere');
                }
                return true;
            }),
        body("fone_usu")
            .notEmpty().withMessage("Telefone é obrigatório!")
            .isLength({ min: 10, max: 15 }).withMessage("Telefone inválido!"),
        body("cep")
            .notEmpty().withMessage("CEP é obrigatório!")
            .matches(/^\d{5}-?\d{3}$/).withMessage("CEP inválido!"),
        body("endereco")
            .notEmpty().withMessage("Endereço é obrigatório!")
            .isLength({ min: 3, max: 100 }).withMessage("Endereço deve ter de 3 a 100 caracteres!"),
        body("bairro")
            .notEmpty().withMessage("Bairro é obrigatório!")
            .isLength({ min: 2, max: 50 }).withMessage("Bairro deve ter de 2 a 50 caracteres!"),
        body("cidade")
            .notEmpty().withMessage("Cidade é obrigatória!")
            .isLength({ min: 2, max: 50 }).withMessage("Cidade deve ter de 2 a 50 caracteres!"),
        body("uf")
            .notEmpty().withMessage("UF é obrigatório!")
            .isLength({ min: 2, max: 2 }).withMessage("UF deve ter 2 caracteres!")
            .isAlpha().withMessage("UF deve conter apenas letras"),
        body("numero")
            .trim()
            .notEmpty().withMessage("Número é obrigatório!")
            .isLength({ min: 1, max: 10 }).withMessage("Número deve ter de 1 a 10 caracteres!")
    ],

    mostrarPerfil: async (req, res) => {
        try {
            const results = await brechoModel.findId(req.session.autenticado.id);
            const brecho = results.length > 0 ? results[0] : null;
            
            // Buscar produtos do usuário
            const pool = require('../config/pool_conexoes');
            const [produtos] = await pool.query(
                `SELECT p.*, i.URL_IMG, u.NOME_USUARIO as VENDEDOR 
                 FROM PRODUTOS p 
                 LEFT JOIN IMG_PRODUTOS i ON p.ID_PRODUTO = i.ID_PRODUTO 
                 JOIN USUARIOS u ON p.ID_USUARIO = u.ID_USUARIO 
                 WHERE p.ID_USUARIO = ? AND p.STATUS_PRODUTO = 'd'
                 ORDER BY p.DATA_CADASTRO DESC`,
                [req.session.autenticado.id]
            );
            
            res.render("pages/perfilvender", {
                brecho: brecho,
                produtos: produtos || [],
                dadosNotificacao: null
            });
        } catch (error) {
            console.error('Erro ao carregar perfil do brechó:', {
                userId: req.session?.autenticado?.id,
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
            res.render("pages/perfilvender", {
                brecho: null,
                produtos: [],
                dadosNotificacao: {
                    titulo: sanitizeInput("Erro!"),
                    mensagem: sanitizeInput("Erro interno do servidor"),
                    tipo: "error"
                }
            });
        }
    },

    mostrarFormulario: async (req, res) => {
        try {
            let valores = {};
            
            if (req.session && req.session.autenticado && req.session.autenticado.id) {
                const userDetails = await usuario.findId(req.session.autenticado.id);
                if (userDetails && userDetails.length > 0) {
                    const user = userDetails[0];
                    valores = {
                        nome_usu: user.NOME_USUARIO || '',
                        email_usu: user.EMAIL_USUARIO || '',
                        fone_usu: user.CELULAR_USUARIO || '',
                        cep: user.CEP_USUARIO || '',
                        endereco: user.LOGRADOURO_USUARIO || '',
                        numero: user.NUMERO_USUARIO || '',
                        bairro: user.BAIRRO_USUARIO || '',
                        cidade: user.CIDADE_USUARIO || '',
                        uf: user.UF_USUARIO || '',
                        nomeusu_usu: user.USER_USUARIO || ''
                    };
                }
            }
            
            res.render("pages/criarbrecho", {
                listaErros: null,
                dadosNotificacao: null,
                valores: valores
            });
        } catch (error) {
            console.error('Erro ao carregar formulário:', error);
            res.render("pages/criarbrecho", {
                listaErros: null,
                dadosNotificacao: null,
                valores: {}
            });
        }
    },

    mostrarInformacoes: async (req, res) => {
        try {
            const results = await brechoModel.findId(req.session.autenticado.id);
            const brecho = results.length > 0 ? results[0] : null;
            
            res.render("pages/perfilvender", {
                brecho: brecho,
                dadosNotificacao: null,
                valores: brecho || {}
            });
        } catch (error) {
            console.error('Erro ao carregar informações:', {
                userId: req.session?.autenticado?.id,
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
            res.render("pages/informacao", {
                brecho: null,
                dadosNotificacao: {
                    titulo: sanitizeInput("Erro!"),
                    mensagem: sanitizeInput("Erro interno do servidor"),
                    tipo: "error"
                },
                valores: {}
            });
        }
    },

    criarBrecho: async (req, res) => {
        console.log('=== INÍCIO CRIAR BRECHÓ ===');
        console.log('Dados recebidos:', req.body);
        
        const erros = validationResult(req);
        console.log('Erros de validação:', erros.array());
        
        if (!erros.isEmpty()) {
            console.log('Retornando com erros de validação');
            return res.render("pages/criarbrecho", {
                listaErros: erros,
                dadosNotificacao: null,
                valores: sanitizeObject(req.body)
            });
        }
        
        const dadosUsuario = {
            USER_USUARIO: req.body.nomeusu_usu.trim(),
            SENHA_USUARIO: bcrypt.hashSync(req.body.senha_usu, 12),
            NOME_USUARIO: req.body.nome_usu.trim(),
            EMAIL_USUARIO: req.body.email_usu.toLowerCase().trim(),
            CELULAR_USUARIO: req.body.fone_usu.replace(/\D/g, ''),
            LOGRADOURO_USUARIO: req.body.endereco.trim(),
            NUMERO_USUARIO: req.body.numero.trim(),
            BAIRRO_USUARIO: req.body.bairro.trim(),
            CIDADE_USUARIO: req.body.cidade.trim(),
            UF_USUARIO: req.body.uf.toUpperCase().trim(),
            CEP_USUARIO: req.body.cep.replace(/\D/g, ''),
            TIPO_USUARIO: 'b',
            STATUS_USUARIO: 'a'
        };

        try {
            let userId;
            
            if (req.session && req.session.autenticado && req.session.autenticado.id) {
                // Usuário já autenticado - atualizar para tipo brechó
                userId = req.session.autenticado.id;
                console.log('Atualizando usuário existente ID:', userId);
                
                const dadosAtualizacao = {
                    TIPO_USUARIO: 'b',
                    USER_USUARIO: req.body.nomeusu_usu.trim(),
                    NOME_USUARIO: req.body.nome_usu.trim(),
                    CELULAR_USUARIO: req.body.fone_usu.replace(/\D/g, ''),
                    LOGRADOURO_USUARIO: req.body.endereco.trim(),
                    NUMERO_USUARIO: req.body.numero.trim(),
                    BAIRRO_USUARIO: req.body.bairro.trim(),
                    CIDADE_USUARIO: req.body.cidade.trim(),
                    UF_USUARIO: req.body.uf.toUpperCase().trim(),
                    CEP_USUARIO: req.body.cep.replace(/\D/g, '')
                };
                
                await usuario.update(dadosAtualizacao, userId);
                req.session.autenticado.tipo = 'b';
            } else {
                // Criar novo usuário
                console.log('Criando novo usuário com dados:', dadosUsuario);
                const createUsuario = await usuario.create(dadosUsuario);
                userId = createUsuario.insertId;
                
                req.session.autenticado = {
                    id: userId,
                    nome: dadosUsuario.NOME_USUARIO,
                    email: dadosUsuario.EMAIL_USUARIO,
                    username: dadosUsuario.USER_USUARIO,
                    tipo: dadosUsuario.TIPO_USUARIO,
                    imagem: null
                };
            }
            
            const dadosBrecho = {
                ID_USUARIO: userId,
                CNPJ_BRECHO: req.body.cnpj_brecho ? req.body.cnpj_brecho.replace(/\D/g, '') : '',
                RAZAO_SOCIAL: req.body.razao_social ? sanitizeInput(req.body.razao_social.trim()) : sanitizeInput(req.body.nomeusu_usu.trim()),
                NOME_FANTASIA: sanitizeInput(req.body.nomeusu_usu.trim())
            };
            
            console.log('Criando brechó com dados:', dadosBrecho);
            const createBrecho = await brechoModel.create(dadosBrecho);
            console.log('Resultado criação brechó:', createBrecho);
            
            console.log('Redirecionando para /homevendedor');
            res.redirect('/homevendedor');
        } catch (error) {
            console.error('Erro ao criar brechó:', {
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
            res.render("pages/criarbrecho", {
                listaErros: null,
                dadosNotificacao: {
                    titulo: sanitizeInput("Erro!"),
                    mensagem: error.message.includes('Duplicate') ? 
                        sanitizeInput("E-mail ou nome de usuário já cadastrado!") : 
                        sanitizeInput("Erro interno do servidor"),
                    tipo: "error"
                },
                valores: sanitizeObject(req.body)
            });
        }
    },

    atualizarInformacoes: async (req, res) => {
        const erros = validationResult(req);
        
        if (!erros.isEmpty()) {
            return res.render("pages/informacao", {
                listaErros: erros,
                dadosNotificacao: null,
                valores: req.body
            });
        }

        const dadosUsuario = {
            NOME_USUARIO: req.body.nome_usu,
            EMAIL_USUARIO: req.body.email,
            CELULAR_USUARIO: req.body.telefone || null,
            CEP_USUARIO: req.body.cep ? req.body.cep.replace("-", "") : null,
            NUMERO_USUARIO: req.body.numero || null
        };

        const dadosBrecho = {
            ID_USUARIO: createUsuario.insertId,
            CNPJ_BRECHO: req.body.cnpj || null,
            RAZAO_SOCIAL: req.body.razao_social || null,
            NOME_FANTASIA: req.body.nome_fantasia || null
        };

        try {
            await usuario.update(dadosUsuario, req.session.autenticado.id);
            await brechoModel.update(dadosBrecho, req.session.autenticado.id);
            
            res.render("pages/informacao", {
                listaErros: null,
                dadosNotificacao: {
                    titulo: "Sucesso!",
                    mensagem: "Informações atualizadas com sucesso!",
                    tipo: "success"
                },
                valores: req.body
            });
        } catch (error) {
            console.error('Erro ao atualizar informações:', {
                userId: req.session?.autenticado?.id,
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
            res.render("pages/informacao", {
                listaErros: null,
                dadosNotificacao: {
                    titulo: sanitizeInput("Erro!"),
                    mensagem: sanitizeInput("Erro interno do servidor"),
                    tipo: "error"
                },
                valores: sanitizeObject(req.body)
            });
        }
    },

    excluirBrecho: async (req, res) => {
        try {
            await brechoModel.delete(req.session.autenticado.id);
            await usuario.update({ STATUS_USUARIO: 'i' }, req.session.autenticado.id);
            
            req.session.destroy();
            res.redirect('/homevendedor');
        } catch (error) {
            console.error('Erro ao excluir brechó:', {
                userId: req.session?.autenticado?.id,
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
            res.render("pages/perfilvender", {
                dadosNotificacao: {
                    titulo: sanitizeInput("Erro!"),
                    mensagem: sanitizeInput("Erro interno do servidor"),
                    tipo: "error"
                }
            });
        }
    }
};

module.exports = brechoController;
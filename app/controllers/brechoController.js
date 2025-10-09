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
                const existe = await usuario.findCampoCustom('user_usuario', value);
                if (existe > 0) throw new Error('Nome de usuário já existe');
                return true;
            }),
        body("email_usu")
            .isEmail().withMessage("Digite um e-mail válido!")
            .custom(async (value) => {
                const existe = await usuario.findCampoCustom('email_usuario', value);
                if (existe > 0) throw new Error('E-mail já cadastrado');
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
            
            res.render("pages/perfilvender", {
                brecho: brecho,
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
                dadosNotificacao: {
                    titulo: sanitizeInput("Erro!"),
                    mensagem: sanitizeInput("Erro interno do servidor"),
                    tipo: "error"
                }
            });
        }
    },

    mostrarFormulario: (req, res) => {
        res.render("pages/criarbrecho", {
            listaErros: null,
            dadosNotificacao: null,
            valores: {}
        });
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
            console.log('Criando usuário com dados:', dadosUsuario);
            const createUsuario = await usuario.create(dadosUsuario);
            console.log('Resultado criação usuário:', createUsuario);
            
            if (createUsuario && createUsuario.insertId) {
                console.log('Usuário criado com ID:', createUsuario.insertId);
                
                const dadosBrecho = {
                    ID_USUARIO: createUsuario.insertId,
                    CNPJ_BRECHO: req.body.cnpj_brecho ? req.body.cnpj_brecho.replace(/\D/g, '') : '',
                    RAZAO_SOCIAL: req.body.razao_social ? sanitizeInput(req.body.razao_social.trim()) : sanitizeInput(req.body.nomeusu_usu.trim()),
                    NOME_FANTASIA: sanitizeInput(req.body.nomeusu_usu.trim())
                };
                
                console.log('Criando brechó com dados:', dadosBrecho);
                const createBrecho = await brechoModel.create(dadosBrecho);
                console.log('Resultado criação brechó:', createBrecho);
                
                req.session.autenticado = {
                    autenticado: dadosUsuario.NOME_USUARIO,
                    id: createUsuario.insertId,
                    tipo: dadosUsuario.TIPO_USUARIO,
                    nome: dadosUsuario.NOME_USUARIO,
                    email: dadosUsuario.EMAIL_USUARIO
                };
                
                console.log('Sessão criada:', req.session.autenticado);
                
                console.log('Redirecionando para /homevendedor');
                res.redirect('/homevendedor');
            } else {
                console.log('Falha na criação do usuário - sem insertId');
                throw new Error('Falha ao criar usuário');
            }
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
            await usuario.update({ STATUS_USUARIO: 0 }, req.session.autenticado.id);
            
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
const brechoModel = require("../models/brechoModel");
const usuario = require("../models/usuarioModel");
const tipoUsuario = require("../models/tipoUsuarioModel");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
var salt = bcrypt.genSaltSync(12);

const brechoController = {

    regrasValidacaoBrecho: [
        body("cnpj_brecho")
            .optional({ checkFalsy: true })
            .isLength({ min: 14, max: 18 }).withMessage("CNPJ deve ter 14 dígitos!"),
        body("razao_social")
            .optional({ checkFalsy: true })
            .isLength({ min: 3, max: 100 }).withMessage("Razão social deve ter de 3 a 100 caracteres!"),
        body("nome_fantasia")
            .optional({ checkFalsy: true })
            .isLength({ min: 3, max: 100 }).withMessage("Nome fantasia deve ter de 3 a 100 caracteres!")
    ],

    regrasValidacaoUsuario: [
        body("nomeusu_usu")
            .isLength({ min: 3, max: 45 }).withMessage("Nome do brechó deve ter de 3 a 45 caracteres!"),
        body("email_usu")
            .isEmail().withMessage("Digite um e-mail válido!"),
        body("nome_usu")
            .isLength({ min: 3, max: 100 }).withMessage("Nome completo deve ter de 3 a 100 caracteres!"),
        body("senha_usu")
            .isLength({ min: 6 }).withMessage("Senha deve ter no mínimo 6 caracteres!"),
        body("fone_usu")
            .optional({ checkFalsy: true })
            .isLength({ min: 10, max: 15 }).withMessage("Telefone deve ter entre 10 e 15 dígitos!"),
        body("cep")
            .optional({ checkFalsy: true })
            .isLength({ min: 8, max: 9 }).withMessage("CEP deve ter 8 dígitos!")
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
            console.log(error);
            res.render("pages/perfilvender", {
                brecho: null,
                dadosNotificacao: {
                    titulo: "Erro!",
                    mensagem: "Erro ao carregar perfil do brechó!",
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
            
            res.render("pages/informacao", {
                brecho: brecho,
                dadosNotificacao: null,
                valores: brecho || {}
            });
        } catch (error) {
            console.log(error);
            res.render("pages/informacao", {
                brecho: null,
                dadosNotificacao: {
                    titulo: "Erro!",
                    mensagem: "Erro ao carregar informações!",
                    tipo: "error"
                },
                valores: {}
            });
        }
    },

    criarBrecho: async (req, res) => {
        const erros = validationResult(req);
        
        if (!erros.isEmpty()) {
            return res.render("pages/criarbrecho", {
                listaErros: erros,
                dadosNotificacao: null,
                valores: req.body
            });
        }

        const tipoVendedor = await tipoUsuario.findByTipo('vendedor');
        
        const dadosUsuario = {
            USER_USUARIO: req.body.nomeusu_usu,
            SENHA_USUARIO: bcrypt.hashSync(req.body.senha_usu, salt),
            NOME_USUARIO: req.body.nome_usu,
            EMAIL_USUARIO: req.body.email_usu,
            CELULAR_USUARIO: req.body.fone_usu || null,
            CEP_USUARIO: req.body.cep ? req.body.cep.replace("-", "") : null,
            NUMERO_USUARIO: req.body.numero || null,
            TIPO_USUARIO: tipoVendedor.length > 0 ? tipoVendedor[0].ID_TIPO_USUARIO : 3,
            STATUS_USUARIO: 1
        };

        try {
            const createUsuario = await usuario.create(dadosUsuario);
            if (createUsuario && createUsuario.insertId) {
                const dadosBrecho = {
                    ID_BRECHO: createUsuario.insertId,
                    CNPJ_BRECHO: req.body.cnpj_brecho || null,
                    RAZAO_SOCIAL: req.body.razao_social || null,
                    NOME_FANTASIA: req.body.nomeusu_usu
                };
                
                await brechoModel.create(dadosBrecho);
                
                req.session.autenticado = {
                    autenticado: dadosUsuario.NOME_USUARIO,
                    id: createUsuario.insertId,
                    tipo: dadosUsuario.TIPO_USUARIO,
                    nome: dadosUsuario.NOME_USUARIO,
                    email: dadosUsuario.EMAIL_USUARIO
                };
                
                res.redirect('/perfilvender');
            }
        } catch (error) {
            console.log(error);
            res.render("pages/criarbrecho", {
                listaErros: null,
                dadosNotificacao: {
                    titulo: "Erro!",
                    mensagem: "Erro ao criar brechó!",
                    tipo: "error"
                },
                valores: req.body
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
            console.log(error);
            res.render("pages/informacao", {
                listaErros: null,
                dadosNotificacao: {
                    titulo: "Erro!",
                    mensagem: "Erro ao atualizar informações!",
                    tipo: "error"
                },
                valores: req.body
            });
        }
    },

    excluirBrecho: async (req, res) => {
        try {
            await brechoModel.delete(req.session.autenticado.id);
            await usuario.update({ STATUS_USUARIO: 0 }, req.session.autenticado.id);
            
            req.session.destroy();
            res.redirect('/login');
        } catch (error) {
            console.log(error);
            res.render("pages/informacao", {
                dadosNotificacao: {
                    titulo: "Erro!",
                    mensagem: "Erro ao excluir brechó!",
                    tipo: "error"
                }
            });
        }
    }
};

module.exports = brechoController;
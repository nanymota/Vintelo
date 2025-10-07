const { validationResult } = require("express-validator");
const usuario = require("./usuarioModel");
const bcrypt = require("bcryptjs");

carregarDadosUsuario = async (req, res, next) => {
    if (req.session && req.session.autenticado && req.session.autenticado.id) {
        try {
            const userData = await usuario.findId(req.session.autenticado.id);
            if (userData && userData.length > 0) {
                const user = userData[0];
                req.session.autenticado.nome = user.NOME_USUARIO;
                req.session.autenticado.email = user.EMAIL_USUARIO;
                req.session.autenticado.imagem = user.IMG_URL;
                req.session.autenticado.user_usuario = user.USER_USUARIO;
            }
        } catch (error) {
            console.log('Erro ao carregar dados do usuário:', error);
        }
    }
    next();
}

verificarUsuAutenticado = (req, res, next) => {
    if (req.session.autenticado) {
        var autenticado = req.session.autenticado;
    } else {
        var autenticado = { autenticado: null, id: null, tipo: null };
    }
    req.session.autenticado = autenticado;
    next();
}

limparSessao = (req, res, next) => {
    req.session.destroy();
    next()
}

gravarUsuAutenticado = async (req, res, next) => {
    var autenticado =  { autenticado: null, id: null, tipo: null };
    erros = validationResult(req)
    if (erros.isEmpty()) {
        var dadosForm = {
            USER_USUARIO: req.body.nome_usu,
            SENHA_USUARIO: req.body.senha_usu,
        };
        var results = await usuario.findUserEmail(dadosForm);
        var total = Object.keys(results).length;
        if (total == 1) {
            if (bcrypt.compareSync(dadosForm.SENHA_USUARIO, results[0].SENHA_USUARO)) {
                var autenticado = {
                    autenticado: results[0].USER_USUARIO,
                    id: results[0].ID_USUARIO,
                    tipo: results[0].TIPO_USUARIO
                };
            }
        } 
    } 
    req.session.autenticado = autenticado;
    next();
}

verificarUsuAutorizado = (tipoPermitido, destinoFalha) => {
    return (req, res, next) => {
        if (req.session.autenticado.autenticado != null &&
            tipoPermitido.find(function (element) { return element == req.session.autenticado.tipo }) != undefined) {
            next();
        } else {
            res.render(destinoFalha, req.session.autenticado);
        }
    };
}

module.exports = {
    verificarUsuAutenticado,
    limparSessao,
    gravarUsuAutenticado,
    verificarUsuAutorizado,
    carregarDadosUsuario
}
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
                req.session.autenticado.tipo_usuario = user.TIPO_USUARIO;
            }
        } catch (error) {
            console.log('Erro ao carregar dados do usuário:', error);
        }
    }
    next();
}

verificarUsuAutenticado = (req, res, next) => {
    if (req.session && req.session.autenticado && req.session.autenticado.id) {
        next();
    } else {
        return res.redirect('/cadastro');
    }
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
            if (bcrypt.compareSync(dadosForm.SENHA_USUARIO, results[0].SENHA_USUARIO)) {
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
        console.log('=== VERIFICAR AUTORIZAÇÃO ===');
        console.log('Sessão autenticada:', req.session?.autenticado);
        console.log('Tipos permitidos:', tipoPermitido);
        console.log('Tipo do usuário:', req.session?.autenticado?.tipo);
        
        if (!req.session?.autenticado?.autenticado) {
            console.log('Usuário não autenticado');
            return res.redirect('/login');
        }
        
        const userType = req.session.autenticado.tipo;
        const isAuthorized = Array.isArray(tipoPermitido) ? 
            tipoPermitido.includes(userType) : 
            tipoPermitido === userType;
        
        console.log('Autorizado:', isAuthorized);
        
        if (isAuthorized) {
            next();
        } else {
            console.log('Acesso negado - redirecionando para:', destinoFalha);
            if (destinoFalha.includes('/')) {
                res.redirect(destinoFalha);
            } else {
                res.render(destinoFalha, { autenticado: req.session.autenticado });
            }
        }
    };
}

// Middleware específico para verificar se é admin
verificarAdmin = (req, res, next) => {
    console.log('=== VERIFICAR ADMIN ===');
    console.log('Sessão:', req.session?.autenticado);
    
    if (!req.session?.autenticado?.autenticado) {
        console.log('Usuário não autenticado');
        return res.redirect('/login');
    }
    
    if (req.session.autenticado.tipo !== 'a') {
        console.log('Usuário não é admin:', req.session.autenticado.tipo);
        return res.redirect('/homecomprador');
    }
    
    console.log('✅ Usuário é admin');
    next();
};

module.exports = {
    verificarUsuAutenticado,
    limparSessao,
    gravarUsuAutenticado,
    verificarUsuAutorizado,
    carregarDadosUsuario,
    verificarAdmin
}
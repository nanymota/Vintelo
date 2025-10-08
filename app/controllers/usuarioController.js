const usuario = require("../models/usuarioModel");
const tipoUsuario = require("../models/tipoUsuarioModel");
const cliente = require("../models/clienteModel"); // cria os registros da tabela clientes -nany
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
var salt = bcrypt.genSaltSync(12);
const {removeImg} = require("../util/removeImg");
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const https = require('https');

const usuarioController = {

    regrasValidacaoFormLogin: [
        body("nome_usu")
            .isLength({ min: 3, max: 45 }).withMessage("Nome deve ter de 3 a 45 caracteres!"),
        body("nomeusu_usu")
            .isLength({ min: 8, max: 45 }).withMessage("Nome de usuário deve ter de 8 a 45 caracteres!")
            .custom(async value => {
                const nomeUsu = await usuario.findCampoCustom({ 'user_usuario': value });
                if (nomeUsu > 0) {
                    throw new Error('Nome de usuário em uso!');
                }
            }),
        body("email_usu")
            .isEmail().withMessage("Digite um e-mail válido!")
            .custom(async value => {
                const nomeUsu = await usuario.findCampoCustom({ 'email_usuario': value });
                if (nomeUsu > 0) {
                    throw new Error('E-mail em uso!');
                }
            }),
        body("senha_usu")
            .isStrongPassword()
            .withMessage("A senha deve ter no mínimo 8 caracteres (mínimo 1 letra maiúscula, 1 caractere especial e 1 número)")
    ],

    regrasValidacaoFormCad: [
        body("nome_usu")
            .notEmpty().withMessage("Nome completo é obrigatório!")
            .isLength({ min: 3, max: 70 }).withMessage("Nome deve ter de 3 a 70 caracteres!"),
        body("nomeusu_usu")
            .notEmpty().withMessage("Nome de usuário é obrigatório!")
            .isLength({ min: 3, max: 50 }).withMessage("Nome de usuário deve ter de 3 a 50 caracteres!")
            .custom(async value => {
                const nomeUsu = await usuario.findCampoCustom('USER_USUARIO', value);
                if (nomeUsu > 0) {
                    throw new Error('Nome de usuário em uso!');
                }
            }),
        body("email_usu")
            .notEmpty().withMessage("E-mail é obrigatório!")
            .isEmail().withMessage("Digite um e-mail válido!")
            .custom(async value => {
                const emailUsu = await usuario.findCampoCustom('EMAIL_USUARIO', value);
                if (emailUsu > 0) {
                    throw new Error('E-mail em uso!');
                }
            }),
        body("senha_usu")
            .notEmpty().withMessage("Senha é obrigatória!")
            .isStrongPassword()
            .withMessage("A senha deve ter no mínimo 8 caracteres (mínimo 1 letra maiúscula, 1 caractere especial e 1 número)"),
        body("cpf_cliente")
            .notEmpty().withMessage("CPF é obrigatório!")
            .isLength({ min: 11, max: 14 }).withMessage("CPF deve ter 11 dígitos!")
            .matches(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/).withMessage("CPF inválido!")
            .custom(async value => {
                const cpfLimpo = value.replace(/\D/g, '');
                const cpfExistente = await cliente.findByCpf(cpfLimpo);
                if (cpfExistente.length > 0) {
                    throw new Error('CPF já cadastrado!');
                }
            }),
        body("data_nasc")
            .notEmpty().withMessage("Data de nascimento é obrigatória!")
            .isDate().withMessage("Data de nascimento inválida!"),
        body("celular_usuario")
            .notEmpty().withMessage("Telefone é obrigatório!")
            .isLength({ min: 10, max: 15 }).withMessage("Telefone deve ter entre 10 e 15 dígitos!")
            .custom(async value => {
                const telefoneExistente = await usuario.findCampoCustom('CELULAR_USUARIO', value);
                if (telefoneExistente > 0) {
                    throw new Error('Telefone já cadastrado!');
                }
            }),
        body("cep_usuario")
            .notEmpty().withMessage("CEP é obrigatório!")
            .isPostalCode('BR').withMessage("CEP inválido!"),
        body("logradouro_usuario")
            .notEmpty().withMessage("Logradouro é obrigatório!")
            .isLength({ min: 5, max: 100 }).withMessage("Logradouro deve ter de 5 a 100 caracteres!"),
        body("bairro_usuario")
            .notEmpty().withMessage("Bairro é obrigatório!")
            .isLength({ min: 2, max: 30 }).withMessage("Bairro deve ter de 2 a 30 caracteres!"),
        body("cidade_usuario")
            .notEmpty().withMessage("Cidade é obrigatória!")
            .isLength({ min: 2, max: 30 }).withMessage("Cidade deve ter de 2 a 30 caracteres!"),
        body("uf_usuario")
            .notEmpty().withMessage("UF é obrigatória!")
            .isLength({ min: 2, max: 2 }).withMessage("UF deve ter 2 caracteres!"),
        body("numero_usuario")
            .notEmpty().withMessage("Número é obrigatório!")
            .isLength({ min: 1, max: 4 }).withMessage("Número deve ter de 1 a 4 caracteres!")
    ],


    regrasValidacaoPerfil: [
        body("nome_usu")
            .isLength({ min: 3, max: 45 }).withMessage("Nome deve ter de 3 a 45 caracteres!"),
        body("nomeusu_usu")
            .isLength({ min: 8, max: 45 }).withMessage("Nome de usuário deve ter de 8 a 45 caracteres!"),
        body("email_usu")
            .isEmail().withMessage("Digite um e-mail válido!"),
        body("celular_usuario")
            .isLength({ min: 12, max: 15 }).withMessage("Digite um telefone válido!"),
        body("cep_usuario")
            .isPostalCode('BR').withMessage("Digite um CEP válido!"),
        body("numero")
            .isNumeric().withMessage("Digite um número para o endereço!"),
    ],

    logar: (req, res) => {
        const erros = validationResult(req);
        if (!erros.isEmpty()) {
            return res.render("pages/perfilcliente", { listaErros: erros, dadosNotificacao: null })
        }
        if (req.session.autenticado.autenticado != null) {
            res.redirect("/");
        } else {
            res.render("pages/login", {
                listaErros: null,
                dadosNotificacao: { titulo: "Falha ao logar!", mensagem: "Usuário e/ou senha inválidos!", tipo: "error" }
            })
        }
    },


    cadastrar: async (req, res) => {
        console.log('Dados recebidos:', req.body);
        const erros = validationResult(req);
        
        if (!erros.isEmpty()) {
            return res.render("pages/cadastro", { 
                listaErros: erros, 
                dadosNotificacao: null, 
                valores: req.body
            })
        }
        
        if (!req.body.senha_usu || req.body.senha_usu.trim() === '') {
            return res.render("pages/cadastro", {
                listaErros: null,
                dadosNotificacao: {
                    titulo: "Erro!",
                    mensagem: "Senha é obrigatória!",
                    tipo: "error"
                },
                valores: req.body
            });
        }
        
        var dadosForm = {
            USER_USUARIO: req.body.nomeusu_usu,
            SENHA_USUARIO: req.body.senha_usu,
            NOME_USUARIO: req.body.nome_usu,
            EMAIL_USUARIO: req.body.email_usu,
            CELULAR_USUARIO: req.body.celular_usuario,
            CEP_USUARIO: req.body.cep_usuario ? req.body.cep_usuario.replace(/\D/g, "") : "",
            LOGRADOURO_USUARIO: req.body.logradouro_usuario,
            NUMERO_USUARIO: req.body.numero_usuario,
            BAIRRO_USUARIO: req.body.bairro_usuario,
            CIDADE_USUARIO: req.body.cidade_usuario,
            UF_USUARIO: req.body.uf_usuario ? req.body.uf_usuario.toUpperCase() : '',
            TIPO_USUARIO: 'c',
            STATUS_USUARIO: 'a'
        };
        
        try {
            console.log('Dados para criar usuário:', dadosForm);
            console.log('Senha original:', req.body.senha_usu);
            console.log('Senha criptografada:', dadosForm.SENHA_USUARIO);
            let create = await usuario.create(dadosForm);
            console.log('Resultado da criação:', create);
            if (create && create.insertId) {
                // Criar registro na tabela CLIENTES (obrigatório)
                const dadosCliente = {
                    ID_USUARIO: create.insertId,
                    CPF_CLIENTE: req.body.cpf_cliente.replace(/\D/g, ''),
                    DATA_NASC: req.body.data_nasc
                };
                
                console.log('Dados para criar cliente:', dadosCliente);
                await cliente.create(dadosCliente);
                console.log('Cliente criado com sucesso');
                
                req.session.autenticado = {
                    autenticado: dadosForm.NOME_USUARIO,
                    id: create.insertId,
                    tipo: dadosForm.TIPO_USUARIO,
                    nome: dadosForm.NOME_USUARIO,
                    email: dadosForm.EMAIL_USUARIO
                };
                
                // Se for requisição AJAX, retornar JSON
                if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                    return res.json({
                        success: true,
                        userData: {
                            nome: dadosForm.NOME_USUARIO,
                            email: dadosForm.EMAIL_USUARIO,
                            imagem: null
                        }
                    });
                }
                
                console.log('Redirecionando para homecomprador');
                res.redirect('/homecomprador');
            }
        } catch (e) {
            console.log(e);
            res.render("pages/cadastro", {
                listaErros: null, 
                dadosNotificacao: {
                    titulo: "Erro ao cadastrar!", 
                    mensagem: "Verifique os valores digitados!", 
                    tipo: "error"
                }, 
                valores: req.body
            })
        }
    },


    mostrarPerfil: async (req, res) => {
        try {
            let results = await usuario.findId(req.session.autenticado.id);
            if (results[0].CEP_USUARIO != null) {
                const httpsAgent = new https.Agent({
                    rejectUnauthorized: false,
                });
                const response = await fetch(`https://viacep.com.br/ws/${results[0].cep_usuario}/json/`,
                    { method: 'GET', headers: null, body: null, agent: httpsAgent, });
                var viaCep = await response.json();
                var cep = results[0].cep_usuario.slice(0,5)+ "-"+results[0].cep_usuario.slice(5)
            }else{
                var viaCep = {logradouro:"", bairro:"", localidade:"", uf:""}
                var cep = null;
            }

            let campos = {
                nome_usu: results[0].NOME_USUARIO, 
                EMAIL_USUARIO: results[0].EMAIL_USUARIO,
                cep: cep, 
                numero: results[0].NUMERO_USUARIO,
                logradouro: viaCep.logradouro,
                bairro: viaCep.bairro, 
                localidade: viaCep.localidade, 
                uf: viaCep.uf,
                img_perfil_pasta: results[0].IMAGEM_USUARIO,
                nomeusu_usu: results[0].USER_USUARIO, 
                celular_usuario: results[0].CELULAR_USUARIO, 
                senha_usu: ""
            }

            res.render("pages/perfilvender", { listaErros: null, dadosNotificacao: null, valores: campos })
        } catch (e) {
            console.log(e);
            res.render("pages/informacao", {
                listaErros: null, dadosNotificacao: null, valores: {
                    img_perfil_banco: "", img_perfil_pasta: "", nome_usu: "", email_usu: "",
                    nomeusu_usu: "", celular_usuario: "", senha_usu: "", cep: "", numero: "", complemento: "",
                    logradouro: "", bairro: "", localidade: "", uf: ""
                }
            })
        }
    },

    gravarPerfil: async (req, res) => {

        const erros = validationResult(req);
        const erroMulter = req.session.erroMulter;
        if (!erros.isEmpty() || erroMulter != null ) {
            lista =  !erros.isEmpty() ? erros : {formatter:null, errors:[]};
            if(erroMulter != null ){
                lista.errors.push(erroMulter);
            } 
            return res.render("pages/perfil", { listaErros: lista, dadosNotificacao: null, valores: req.body })
        }
        try {
            var dadosForm = {
                USER_USUARIO: req.body.nomeusu_usu,
                NOME_USUARIO: req.body.nome_usu,
                EMAIL_USUARIO: req.body.email_usu,
                CELULAR_USUARIO: req.body.celular_usuario,
                CEP_USUARIO: req.body.cep.replace("-",""),
                NUMERO_USUARIO: req.body.numero,
                COMPLEMENTO_USUARIO: req.body.complemento,
                IMAGEM_USUARIO: req.session.autenticado.imagem_usuario || null,
            };
            if (req.body.senha_usu != "") {
                dadosForm.SENHA_USUARIO = bcrypt.hashSync(req.body.senha_usu, salt);
            }
            if (!req.file) {
                console.log("Falha no carregamento");
            } else {
               
                caminhoArquivo = "imagem/perfil/" + req.file.filename;
              
                if(dadosForm.IMAGEM_USUARIO != caminhoArquivo ){
                    removeImg(dadosForm.IMAGEM_USUARIO);
                }
                dadosForm.IMAGEM_USUARIO = caminhoArquivo;

            }
            let resultUpdate = await usuario.update(dadosForm, req.session.autenticado.id);
            if (!resultUpdate.isEmpty) {
                if (resultUpdate.changedRows == 1) {
                    var result = await usuario.findId(req.session.autenticado.id);
                    var autenticado = {
                        autenticado: result[0].NOME_USUARIO,
                        id: result[0].ID_USUARIO,
                        tipo: result[0].TIPO_USUARIO,
                        imagem_usuario: result[0].IMAGEM_USUARIO
                    };
                    req.session.autenticado = autenticado;
                    var campos = {
                        nome_usu: result[0].NOME_USUARIO, 
                        EMAIL_USUARIO: result[0].EMAIL_USUARIO,
                        imagem_usuario: result[0].IMAGEM_USUARIO,
                        nomeusu_usu: result[0].USER_USUARIO, 
                        celular_usuario: result[0].CELULAR_USUARIO, 
                        senha_usu: ""
                    }
                    res.render("pages/homecomprador", { listaErros: null, dadosNotificacao: { titulo: "Perfil! atualizado com sucesso", mensagem: "Alterações Gravadas", tipo: "success" }, valores: campos });
                }else{
                    res.render("pages/homecomprador", { listaErros: null, dadosNotificacao: { titulo: "Perfil! atualizado com sucesso", mensagem: "Sem alterações", tipo: "success" }, valores: dadosForm });
                }
            }
        } catch (e) {
            console.log(e)
            res.render("pages/perfilcliente", { listaErros: erros, dadosNotificacao: { titulo: "Erro ao atualizar o perfil!", mensagem: "Verifique os valores digitados!", tipo: "error" }, valores: req.body })
        }
    }
}

module.exports = usuarioController
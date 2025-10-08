var express = require("express");
var router = express.Router();
const bcrypt = require('bcryptjs');

const {
  verificarUsuAutenticado,
  limparSessao,
  verificarUsuAutorizado,
  carregarDadosUsuario
} = require("../models/autenticador_middleware");

const usuarioController = require("../controllers/usuarioController");
const brechoController = require("../controllers/brechoController");
const carrinhoController = require("../controllers/carrinhoController");
const produtoController = require("../controllers/produtoController");
const compraController = require('../controllers/compraController');
const { adicionarController } = require("../controllers/adicionarController");
const categoriaController = require("../controllers/categoriaController");
const denunciaController = require("../controllers/denunciaController");
const { atualizarPlano, alternarStatusPlano } = require("../controllers/premiumController");
const pedidoController = require("../controllers/pedidoController");
const { bannerController } = require("../controllers/bannerController");
const usuarioModel = require('../models/usuarioModel');
const tipoUsuarioModel = require('../models/tipoUsuarioModel');
const cliente = require('../models/clienteModel');
const pool = require('../config/pool_conexoes');

const uploadFile = require("../util/uploader");
const uploadProduto = require("../util/uploaderProduto");

const { MercadoPagoConfig, Preference } = require('mercadopago');
const client = new MercadoPagoConfig({
  accessToken: process.env.accessToken
});
const pagamentoController = require('../controllers/pagamentoController');

router.get("/addItem", function (req, res) {
  carrinhoController.addItem(req, res);
});

router.get("/removeItem", function (req, res) {
  carrinhoController.removeItem(req, res);
});

router.get("/excluirItem", function (req, res) {
  carrinhoController.excluirItem(req, res);
});

router.get("/listar-carrinho", function (req, res) {
  carrinhoController.listarcarrinho(req, res);
});

router.get(
  "/perfil",
  verificarUsuAutorizado([1, 2, 3], "pages/adm"),
  async function (req, res) {
    usuarioController.mostrarPerfil(req, res);
  }
);

router.post(
  "/adm",
  uploadFile("imagem-perfil_usu"),
  usuarioController.regrasValidacaoPerfil,
  verificarUsuAutorizado([1, 2, 3], "pages/restrito"),
  async function (req, res) {
    usuarioController.gravarPerfil(req, res);
  }
);

router.get("/", async function (req, res) {
  try {
    const { bannerModel } = require('../models/bannerModel');
    const banners = await bannerModel.findByPosition('Home');
    res.render('pages/index', {
      autenticado: req.session ? req.session.autenticado : null,
      banners: banners || []
    });
  } catch (error) {
    res.render('pages/index', {
      autenticado: req.session ? req.session.autenticado : null,
      banners: []
    });
  }
});

router.get("/index", async function (req, res) {
  try {
    const { bannerModel } = require('../models/bannerModel');
    const banners = await bannerModel.findByPosition('Home');
    res.render('pages/index', {
      autenticado: req.session ? req.session.autenticado : null,
      banners: banners || []
    });
  } catch (error) {
    res.render('pages/index', {
      autenticado: req.session ? req.session.autenticado : null,
      banners: []
    });
  }
});

router.get("/favoritar", verificarUsuAutenticado, function (req, res) {
  produtoController.favoritar(req, res);
});

router.get("/sair", limparSessao, function (req, res) {
  res.redirect("/");
});

router.get("/login", function (req, res) {
  res.render("pages/login", { 
    listaErros: null, 
    dadosNotificacao: null,
    valores: {},
    avisoErro: {}
  });
});



router.post("/login", async function (req, res) {
    const { email_usu, senha_usu } = req.body;
    
    console.log('Dados de login recebidos:', { email_usu, senha_usu });
    
    if (!email_usu || !senha_usu) {
        return res.render('pages/login', {
            listaErros: null,
            dadosNotificacao: { titulo: 'Erro!', mensagem: 'Todos os campos são obrigatórios', tipo: 'error' },
            valores: req.body,
            avisoErro: {}
        });
    }
    
    try {
        const usuarios = await usuarioModel.findUserEmail({ user_usuario: email_usu });
        console.log('Usuários encontrados:', usuarios);
        
        if (usuarios.length > 0) {
            const usuario = usuarios[0];
            console.log('Verificando senha para usuário:', usuario.NOME_USUARIO);
            const senhaValida = bcrypt.compareSync(senha_usu, usuario.SENHA_USUARIO);
            console.log('Senha válida:', senhaValida);
            
            if (senhaValida) {
                req.session.autenticado = {
                    autenticado: usuario.NOME_USUARIO,
                    id: usuario.ID_USUARIO,
                    tipo: usuario.TIPO_USUARIO,
                    nome: usuario.NOME_USUARIO,
                    email: usuario.EMAIL_USUARIO
                };
                
                console.log('Sessão criada:', req.session.autenticado);
                console.log('Redirecionando para:', usuario.TIPO_USUARIO == 'brecho' ? '/homevendedor' : '/homecomprador');
                return res.redirect(usuario.TIPO_USUARIO == 'brecho' ? '/homevendedor' : '/homecomprador');
            }
        }
        
        res.render('pages/login', {
            listaErros: null,
            dadosNotificacao: { titulo: 'Falha ao logar!', mensagem: usuarios.length > 0 ? 'Senha inválida!' : 'Usuário não encontrado!', tipo: 'error' },
            valores: req.body,
            avisoErro: {}
        });
    } catch (error) {
        console.log('Erro no login:', error);
        res.render('pages/login', {
            listaErros: null,
            dadosNotificacao: { titulo: 'Erro no sistema!', mensagem: 'Tente novamente mais tarde!', tipo: 'error' },
            valores: req.body,
            avisoErro: {}
        });
    }
});

router.get("/cadastro", function (req, res) {
  res.render("pages/cadastro", {
    listaErros: null,
    dadosNotificacao: null,
    valores: {
      nome_usu: "",
      nomeusu_usu: "",
      email_usu: "",
      senha_usu: "",
      celular_usuario: "",
      cpf_cliente: "",
      data_nasc: "",
      cep_usuario: "",
      logradouro_usuario: "",
      numero_usuario: "",
      bairro_usuario: "",
      cidade_usuario: "",
      uf_usuario: ""
    },
  });
});

router.post("/cadastro", usuarioController.regrasValidacaoFormCad, usuarioController.cadastrar);

// Remover a rota POST /login conflitante - o form já aponta para /cadastro

router.get('/cadastroadm', function(req, res){ res.render('pages/cadastroadm'); });

router.get("/adm", verificarUsuAutenticado, verificarUsuAutorizado([2, 3], "pages/restrito"), function (req, res) {
    res.render("pages/adm", {
        autenticado: req.session.autenticado
    });
});

// router.post("/create-preference", function (req, res) {
//   const preference = new Preference(client);
//   console.log(req.body.items);
//   preference.create({
//     body: {
//       items: req.body.items,
//       back_urls: {
//         "success": process.env.URL_BASE + "/feedback",
//         "failure": process.env.URL_BASE + "/feedback",
//         "pending": process.env.URL_BASE + "/feedback"
//       },
//       auto_return: "approved",
//     }
//   })
//     .then((value) => {
//       res.json(value)
//     })
//     .catch(console.log)
// });

router.get('/produto1', (req, res) => res.render('pages/produto1'));
router.get('/produto2', (req, res) => res.render('pages/produto2'));
router.get('/produto3', (req, res) => res.render('pages/produto3'));
router.get('/produto4', (req, res) => res.render('pages/produto4'));

router.get('/carrinho', function(req, res){
    res.render('pages/carrinho', {
        carrinho: req.session.carrinho || [],
        autenticado: req.session.autenticado || { autenticado: false }
    });
});

router.get('/perfil1', (req, res) => res.render('pages/perfil1'));
router.get('/perfil2', (req, res) => res.render('pages/perfil2'));
router.get('/perfil3', (req, res) => res.render('pages/perfil3'));

router.get('/homecomprador', carregarDadosUsuario, async function(req, res){
    try {
        const { produtoModel } = require('../models/produtoModel');
        const { bannerModel } = require('../models/bannerModel');
        const produtos = await produtoModel.findRecent(8) || [];
        const banners = await bannerModel.findByPosition('Home') || [];
        
        res.render('pages/homecomprador', {
            autenticado: req.session.autenticado,
            produtos: produtos,
            banners: banners
        });
    } catch (error) {
        console.log('Erro ao buscar dados:', error);
        res.render('pages/homecomprador', {
            autenticado: req.session.autenticado,
            produtos: [],
            banners: []
        });
    }
});

router.get('/homevendedor', carregarDadosUsuario, async function(req, res){
    try {
        const { bannerModel } = require('../models/bannerModel');
        const banners = await bannerModel.findByPosition('Home') || [];
        const brechoData = req.session.brecho || {
            nome: 'Meu Brechó',
            proprietario: 'Vendedor',
            avaliacao: '0.0',
            itens_venda: '0',
            vendidos: '0',
            seguidores: '0'
        };
        
        res.render('pages/homevendedor', {
            brecho: brechoData,
            autenticado: req.session.autenticado,
            banners: banners
        });
    } catch (error) {
        const brechoData = req.session.brecho || {
            nome: 'Meu Brechó',
            proprietario: 'Vendedor',
            avaliacao: '0.0',
            itens_venda: '0',
            vendidos: '0',
            seguidores: '0'
        };
        
        res.render('pages/homevendedor', {
            brecho: brechoData,
            autenticado: req.session.autenticado,
            banners: []
        });
    }
});


router.get('/adicionar', verificarUsuAutenticado, adicionarController.mostrarFormulario);

router.post('/adicionar', 
    uploadProduto.array('fotos', 5),
    adicionarController.regrasValidacao,
    adicionarController.criarProduto
);

router.get('/blog', (req, res) => res.render('pages/blog'));
router.get('/artigo', (req, res) => res.render('pages/artigo'));
router.get('/bossartigo', (req, res) => res.render('pages/bossartigo'));
router.get('/gucciartigo', (req, res) => res.render('pages/gucciartigo'));
router.get('/ecologicoartigo', (req, res) => res.render('pages/ecologicoartigo'));
router.get('/tensustentavel', (req, res) => res.render('pages/tensustentavel'));
router.get('/sweer', (req, res) => res.render('pages/sweer'));

router.get('/pedidoconf', function(req, res){
    res.render('pages/pedidoconf', {
        pedido_id: Math.floor(Math.random() * 1000000),
        metodo_pagamento: 'PIX',
        total: '59,99',
        autenticado: req.session.autenticado || { autenticado: false }
    });
});
router.get('/finalizandocompra1', (req, res) => res.render('pages/finalizandocompra1'));
router.get('/finalizandocompra2', function(req, res){
    const carrinho = req.session.carrinho || [];
    let subtotal = 0;
    
    carrinho.forEach(item => {
        subtotal += (item.preco * item.quantidade);
    });
    
    const frete = subtotal > 0 ? 10 : 0;
    const total = subtotal + frete;
    
    res.render('pages/finalizandocompra2', {
        carrinho: carrinho,
        subtotal: subtotal.toFixed(2),
        frete: frete.toFixed(2),
        total: total.toFixed(2),
        autenticado: req.session.autenticado || { autenticado: false }
    });
});
router.get('/favoritos', function(req, res){
    const favoritos = req.session.favoritos || [];
    res.render('pages/favoritos', {
        favoritos: favoritos,
        autenticado: req.session.autenticado || { autenticado: false }
    });
});
router.get('/sacola1', (req, res) => res.render('pages/sacola1'));
router.get('/avaliasao', (req, res) => res.render('pages/avaliasao'));

router.get('/perfilvender', carregarDadosUsuario, function(req, res){
    const brechoData = {
        nome: (req.session.autenticado && req.session.autenticado.nome) || 'Nome do Brechó',
        imagem: (req.session.autenticado && req.session.autenticado.imagem) || null,
        avaliacao: '5.0',
        itens_venda: '0',
        vendidos: '0',
        seguidores: '0'
    };
    
    res.render('pages/perfilvender', {
        brecho: brechoData,
        autenticado: req.session.autenticado
    });
})

router.get('/criarbrecho', brechoController.mostrarFormulario);

router.post('/criarbrecho', 
    brechoController.regrasValidacaoUsuario,
    brechoController.criarBrecho
);

router.get('/entrar', function(req, res){
    res.render('pages/entrar', { listaErros: null, dadosNotificacao: null,
        valores: {}
     });
});

router.post('/entrar', async function(req, res){
    const { email_usu, senha_usu } = req.body;
    
    console.log('Tentativa de login na página entrar:', { email_usu, senha_usu });
    
    if (!email_usu || !senha_usu) {
        return res.render('pages/entrar', {
            listaErros: null,
            dadosNotificacao: {
                titulo: 'Erro!',
                mensagem: 'Todos os campos são obrigatórios',
                tipo: 'error'
            },
            valores: req.body
        });
    }
    
    try {
        const usuarios = await usuarioModel.findUserEmail({ user_usuario: email_usu });
        console.log('Usuários encontrados na página entrar:', usuarios);
        
        if (usuarios.length > 0) {
            const usuario = usuarios[0];
            console.log('Verificando senha para usuário:', usuario.NOME_USUARIO);
            const senhaValida = senha_usu === usuario.SENHA_USUARIO;
            console.log('Senha válida:', senhaValida);
            
            if (senhaValida) {
                req.session.autenticado = {
                    autenticado: usuario.NOME_USUARIO,
                    id: usuario.ID_USUARIO,
                    tipo: usuario.TIPO_USUARIO,
                    nome: usuario.NOME_USUARIO,
                    email: usuario.EMAIL_USUARIO
                };
                
                console.log('Sessão criada na página entrar:', req.session.autenticado);
                
                if (usuario.TIPO_USUARIO == 'brecho') {
                    req.session.brecho = {
                        nome: 'Meu Brechó',
                        proprietario: usuario.NOME_USUARIO,
                        avaliacao: '4.5',
                        itens_venda: '15',
                        vendidos: '8',
                        seguidores: '25'
                    };
                    console.log('Redirecionando para /homevendedor');
                    return res.redirect('/homevendedor');
                } else {
                    console.log('Redirecionando para /homecomprador');
                    return res.redirect('/homecomprador');
                }
            } else {
                res.render('pages/entrar', {
                    listaErros: null,
                    dadosNotificacao: {
                        titulo: 'Falha ao logar!',
                        mensagem: 'Senha inválida!',
                        tipo: 'error'
                    },
                    valores: req.body
                });
            }
        } else {
            res.render('pages/entrar', {
                listaErros: null,
                dadosNotificacao: {
                    titulo: 'Falha ao logar!',
                    mensagem: 'Usuário não encontrado!',
                    tipo: 'error'
                },
                valores: req.body
            });
        }
    } catch (error) {
        console.log('Erro no login:', error);
        res.render('pages/entrar', {
            listaErros: null,
            dadosNotificacao: {
                titulo: 'Erro no sistema!',
                mensagem: 'Tente novamente mais tarde!',
                tipo: 'error'
            },
            valores: req.body
        });
    }
});

router.get('/esqueceusenha', function(req, res){
    res.render('pages/esqueceusenha', {
        etapa: 'email',
        dadosNotificacao: null,
        valores: { email_usu: '' },
        avisoErro: {}
    });
});

router.post('/esqueceusenha', async function(req, res){
    const { email_usu } = req.body;
    
    if (!email_usu) {
        return res.render('pages/esqueceusenha', {
            etapa: 'email',
            dadosNotificacao: {
                mensagem: 'E-mail é obrigatório',
                tipo: 'error'
            },
            valores: req.body,
            avisoErro: { email_usu: 'Campo obrigatório' }
        });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email_usu)) {
        return res.render('pages/esqueceusenha', {
            etapa: 'email',
            dadosNotificacao: {
                mensagem: 'E-mail inválido',
                tipo: 'error'
            },
            valores: req.body,
            avisoErro: { email_usu: 'E-mail inválido' }
        });
    }
    
    try {
        const usuarios = await usuarioModel.findUserEmail({ user_usuario: email_usu });
        
        if (usuarios.length > 0) {
            
            const codigo = Math.floor(100000 + Math.random() * 900000).toString();
            
            req.session.codigoRecuperacao = {
                email: email_usu,
                codigo: codigo,
                expira: Date.now() + 10 * 60 * 1000
            };
            
            console.log('Código de recuperação:', codigo, 'para:', email_usu);
            
            res.render('pages/esqueceusenha', {
                etapa: 'codigo',
                email_usu: email_usu,
                dadosNotificacao: {
                    mensagem: 'Código de verificação enviado para seu e-mail!',
                    tipo: 'success'
                },
                valores: {},
                avisoErro: {}
            });
        } else {
            res.render('pages/esqueceusenha', {
                etapa: 'email',
                dadosNotificacao: {
                    mensagem: 'E-mail não encontrado em nossa base de dados',
                    tipo: 'error'
                },
                valores: req.body,
                avisoErro: { email_usu: 'E-mail não cadastrado' }
            });
        }
    } catch (error) {
        console.log('Erro ao processar recuperação:', error);
        res.render('pages/esqueceusenha', {
            etapa: 'email',
            dadosNotificacao: {
                mensagem: 'Erro interno. Tente novamente mais tarde.',
                tipo: 'error'
            },
            valores: req.body,
            avisoErro: {}
        });
    }
})

router.post('/esqueceusenha/verificar', function(req, res){
    const { email_usu, codigo } = req.body;
    
    if (!req.session.codigoRecuperacao) {
        return res.render('pages/esqueceusenha', {
            etapa: 'email',
            dadosNotificacao: {
                mensagem: 'Sessão expirada. Solicite um novo código.',
                tipo: 'error'
            },
            valores: {},
            avisoErro: {}
        });
    }
    
    const { email: emailSessao, codigo: codigoSessao, expira } = req.session.codigoRecuperacao;
    
    if (Date.now() > expira) {
        delete req.session.codigoRecuperacao;
        return res.render('pages/esqueceusenha', {
            etapa: 'email',
            dadosNotificacao: {
                mensagem: 'Código expirado. Solicite um novo código.',
                tipo: 'error'
            },
            valores: {},
            avisoErro: {}
        });
    }
    
    if (email_usu !== emailSessao || codigo !== codigoSessao) {
        return res.render('pages/esqueceusenha', {
            etapa: 'codigo',
            email_usu: email_usu,
            dadosNotificacao: {
                mensagem: 'Código inválido',
                tipo: 'error'
            },
            valores: req.body,
            avisoErro: { codigo: 'Código incorreto' }
        });
    }
    
    res.render('pages/esqueceusenha', {
        etapa: 'senha',
        email_usu: email_usu,
        codigo: codigo,
        dadosNotificacao: {
            mensagem: 'Código verificado! Defina sua nova senha.',
            tipo: 'success'
        },
        valores: {},
        avisoErro: {}
    });
})

router.post('/esqueceusenha/redefinir', async function(req, res){
    const { email_usu, codigo, nova_senha, confirmar_senha } = req.body;
    
    if (!nova_senha || !confirmar_senha) {
        return res.render('pages/esqueceusenha', {
            etapa: 'senha',
            email_usu: email_usu,
            codigo: codigo,
            dadosNotificacao: {
                mensagem: 'Todos os campos são obrigatórios',
                tipo: 'error'
            },
            valores: req.body,
            avisoErro: { 
                nova_senha: !nova_senha ? 'Campo obrigatório' : '',
                confirmar_senha: !confirmar_senha ? 'Campo obrigatório' : ''
            }
        });
    }
    
    if (nova_senha !== confirmar_senha) {
        return res.render('pages/esqueceusenha', {
            etapa: 'senha',
            email_usu: email_usu,
            codigo: codigo,
            dadosNotificacao: {
                mensagem: 'As senhas não coincidem',
                tipo: 'error'
            },
            valores: req.body,
            avisoErro: { confirmar_senha: 'Senhas não coincidem' }
        });
    }
    
    if (nova_senha.length < 8) {
        return res.render('pages/esqueceusenha', {
            etapa: 'senha',
            email_usu: email_usu,
            codigo: codigo,
            dadosNotificacao: {
                mensagem: 'A senha deve ter pelo menos 8 caracteres',
                tipo: 'error'
            },
            valores: req.body,
            avisoErro: { nova_senha: 'Mínimo 8 caracteres' }
        });
    }
    
    try {
        
        const usuarios = await usuarioModel.findUserEmail({ user_usuario: email_usu });
        
        if (usuarios.length > 0) {
            const senhaHash = bcrypt.hashSync(nova_senha, 10);
            await usuarioModel.updatePassword(usuarios[0].ID_USUARIO, senhaHash);
            
            delete req.session.codigoRecuperacao;
            
            res.render('pages/esqueceusenha', {
                etapa: 'email',
                dadosNotificacao: {
                    mensagem: 'Senha redefinida com sucesso! Faça login com sua nova senha.',
                    tipo: 'success'
                },
                valores: {},
                avisoErro: {}
            });
        } else {
            res.render('pages/esqueceusenha', {
                etapa: 'email',
                dadosNotificacao: {
                    mensagem: 'Erro ao redefinir senha. Tente novamente.',
                    tipo: 'error'
                },
                valores: {},
                avisoErro: {}
            });
        }
    } catch (error) {
        console.log('Erro ao redefinir senha:', error);
        res.render('pages/esqueceusenha', {
            etapa: 'senha',
            email_usu: email_usu,
            codigo: codigo,
            dadosNotificacao: {
                mensagem: 'Erro interno. Tente novamente mais tarde.',
                tipo: 'error'
            },
            valores: req.body,
            avisoErro: {}
        });
    }
})

router.get('/estatistica', (req, res) => res.render('pages/estatistica'));
router.get('/estatistica-mobile', (req, res) => res.render('pages/estatistica-mobile'));
router.get('/estatistica-desktop', (req, res) => res.render('pages/estatistica-desktop'));

router.get('/categorias', categoriaController.mostrarCategorias);
router.get('/categorias/filtrar/:categoryId', categoriaController.filtrarProdutos);

router.get('/editarbanners', bannerController.mostrarFormulario);
router.post('/editarbanners', uploadFile('banners'), bannerController.atualizarBanners);
router.get('/minhascompras', (req, res) => res.render('pages/minhascompras'));
router.get('/finalizandopagamento', function(req, res){
    const carrinho = req.session.carrinho || [];
    let subtotal = 0;
    
    carrinho.forEach(item => {
        subtotal += (item.preco * item.quantidade);
    });
    
    const frete = subtotal > 0 ? 10 : 0;
    const total = subtotal + frete;
    
    res.render('pages/finalizandopagamento', {
        carrinho: carrinho,
        subtotal: subtotal.toFixed(2),
        frete: frete.toFixed(2),
        total: total.toFixed(2),
        autenticado: req.session.autenticado || { autenticado: false }
    });
});
router.get('/pedidos', (req, res) => res.render('pages/pedidos'));
router.get('/enviopedido', (req, res) => res.render('pages/enviopedido'));
router.get('/menu', carregarDadosUsuario, (req, res) => {
    res.render('pages/menu', {
        autenticado: req.session.autenticado || null
    });
});
router.get('/minhascomprasdesktop', (req, res) => res.render('pages/minhascomprasdesktop'));
router.get('/menuvendedor', carregarDadosUsuario, (req, res) => {
    res.render('pages/menuvendedor', {
        autenticado: req.session.autenticado || null
    });
});
router.get('/informacao', carregarDadosUsuario, async (req, res) => {
    try {
        let userData = {
            nome: 'Usuário',
            email: 'email@exemplo.com',
            telefone: '(11) 99999-9999',
            imagem: null,
            user_usuario: 'usuario',
            cnpj: '',
            razao_social: '',
            nome_fantasia: ''
        };
        
        if (req.session && req.session.autenticado && req.session.autenticado.id) {
            const userDetails = await usuarioModel.findId(req.session.autenticado.id);
            if (userDetails && userDetails.length > 0) {
                const user = userDetails[0];
                userData.nome = user.NOME_USUARIO || 'Usuário';
                userData.email = user.EMAIL_USUARIO || 'email@exemplo.com';
                userData.telefone = user.CELULAR_USUARIO || '(11) 99999-9999';
                userData.imagem = user.IMG_URL || null;
                userData.user_usuario = user.USER_USUARIO || 'usuario';
                
                // Se for brechó, buscar dados específicos
                if (user.TIPO_USUARIO === 'brechó') {
                    const brechoModel = require('../models/brechoModel');
                    const brechoData = await brechoModel.findByUserId(req.session.autenticado.id);
                    if (brechoData && brechoData.length > 0) {
                        userData.cnpj = brechoData[0].CNPJ_BRECHO || '';
                        userData.razao_social = brechoData[0].RAZAO_SOCIAL || '';
                        userData.nome_fantasia = brechoData[0].NOME_FANTASIA || '';
                    }
                }
            }
        }
        
        res.render('pages/informacao', {
            autenticado: req.session ? req.session.autenticado : null,
            usuario: userData,
            favoritos: req.session.favoritos || []
        });
    } catch (error) {
        console.log('Erro ao carregar informações:', error);
        res.render('pages/informacao', {
            autenticado: req.session ? req.session.autenticado : null,
            usuario: {
                nome: 'Usuário',
                email: 'email@exemplo.com',
                telefone: '(11) 99999-9999',
                imagem: null,
                user_usuario: 'usuario',
                cnpj: '',
                razao_social: '',
                nome_fantasia: ''
            },
            favoritos: req.session.favoritos || []
        });
    }
});
router.get('/menufavoritos', (req, res) => res.render('pages/menufavoritos'));
router.get('/menucompras', (req, res) => res.render('pages/menucompras'));
router.get('/planos', (req, res) => res.render('pages/planos'));

router.post('/perfilcliente/foto', uploadFile('profile-photo'), async function(req, res){
    try {
        if (req.session && req.session.autenticado && req.session.autenticado.id && req.file) {
            const imagePath = 'imagem/perfil/' + req.file.filename;
            const dadosUsuario = {
                IMG_URL: imagePath
            };
            
            await usuarioModel.update(dadosUsuario, req.session.autenticado.id);
            req.session.autenticado.imagem = imagePath;
            
            res.json({
                success: true,
                imagePath: imagePath
            });
        } else {
            res.json({ success: false, error: 'Arquivo não enviado' });
        }
    } catch (error) {
        console.log('Erro ao salvar foto:', error);
        res.json({ success: false, error: 'Erro ao fazer upload da foto' });
    }
});

router.post('/upload-foto', uploadFile('foto'), async function(req, res){
    try {
        if (req.session && req.session.autenticado && req.session.autenticado.id && req.file) {
            const imagePath = 'imagem/perfil/' + req.file.filename;
            const dadosUsuario = {
                IMG_URL: imagePath
            };
            
            await usuarioModel.update(dadosUsuario, req.session.autenticado.id);
            req.session.autenticado.imagem = imagePath;
            
            res.json({
                success: true,
                imagePath: imagePath
            });
        } else {
            res.json({ success: false, error: 'Arquivo não enviado' });
        }
    } catch (error) {
        console.log('Erro ao salvar foto:', error);
        res.json({ success: false, error: error.message });
    }
});

router.post('/perfilcliente', async function(req, res){
    try {
        const { nome, email, telefone, cep, logradouro, numero, bairro, cidade, uf, cpf, data_nasc, bio } = req.body;
        
        if (req.session && req.session.autenticado && req.session.autenticado.id) {
            // Atualizar dados do usuário
            const dadosUsuario = {
                NOME_USUARIO: nome,
                EMAIL_USUARIO: email,
                CELULAR_USUARIO: telefone,
                CEP_USUARIO: cep ? cep.replace(/\D/g, '') : '',
                LOGRADOURO_USUARIO: logradouro,
                NUMERO_USUARIO: numero,
                BAIRRO_USUARIO: bairro,
                CIDADE_USUARIO: cidade,
                UF_USUARIO: uf
            };
            
            if (bio) {
                dadosUsuario.DESCRICAO_USUARIO = bio;
            }
            
            await usuarioModel.update(dadosUsuario, req.session.autenticado.id);
            
            // Atualizar dados do cliente
            if (cpf || data_nasc) {
                const clienteData = await cliente.findByUserId(req.session.autenticado.id);
                if (clienteData && clienteData.length > 0) {
                    const dadosCliente = {};
                    if (cpf) dadosCliente.CPF_CLIENTE = cpf.replace(/\D/g, '');
                    if (data_nasc) dadosCliente.DATA_NASC = data_nasc;
                    
                    await cliente.update(dadosCliente, req.session.autenticado.id);
                }
            }
        }
        
        res.redirect('/perfilcliente');
    } catch (error) {
        console.log('Erro ao salvar perfil:', error);
        res.redirect('/perfilcliente');
    }
});

router.get('/perfilcliente', async function(req, res){
    try {
        console.log('Acessando perfil cliente');
        
        let userData = {
            nome: 'Usuário',
            email: 'email@exemplo.com',
            telefone: '(11) 99999-9999',
            imagem: null,
            user_usuario: 'usuario',
            data_cadastro: 'Janeiro 2024',
            compras: 0,
            favoritos: 0,
            avaliacoes: 0,
            cep: '',
            logradouro: '',
            numero: '',
            bairro: '',
            cidade: '',
            uf: '',
            cpf: '',
            data_nasc: ''
        };
        
        if (req.session && req.session.autenticado && req.session.autenticado.id) {
            console.log('Usuário autenticado, buscando dados');
            const userDetails = await usuarioModel.findId(req.session.autenticado.id);
            
            if (userDetails && userDetails.length > 0) {
                const user = userDetails[0];
                userData.nome = user.NOME_USUARIO || 'Usuário';
                userData.email = user.EMAIL_USUARIO || 'email@exemplo.com';
                userData.telefone = user.CELULAR_USUARIO || '(11) 99999-9999';
                userData.imagem = user.IMG_URL || null;
                userData.user_usuario = user.USER_USUARIO || 'usuario';
                userData.cep = user.CEP_USUARIO || '';
                userData.logradouro = user.LOGRADOURO_USUARIO || '';
                userData.numero = user.NUMERO_USUARIO || '';
                userData.bairro = user.BAIRRO_USUARIO || '';
                userData.cidade = user.CIDADE_USUARIO || '';
                userData.uf = user.UF_USUARIO || '';
                
                // Buscar dados do cliente
                const clienteData = await cliente.findByUserId(req.session.autenticado.id);
                if (clienteData && clienteData.length > 0) {
                    userData.cpf = clienteData[0].CPF_CLIENTE || '';
                    if (clienteData[0].DATA_NASC) {
                        const date = new Date(clienteData[0].DATA_NASC);
                        userData.data_nasc = date.toISOString().split('T')[0];
                    }
                }
            }
        }
        
        console.log('Renderizando página');
        res.render('pages/perfilcliente', {
            usuario: userData,
            favoritos: [],
            autenticado: req.session ? req.session.autenticado : null
        });
    } catch (error) {
        console.log('Erro ao carregar perfil:', error);
        res.status(500).send('Erro interno do servidor');
    }
});

router.get('/homeadm', async (req, res) => {
    try {
        const { bannerModel } = require('../models/bannerModel');
        const banners = await bannerModel.findByPosition('Home') || [];
        res.render('pages/homeadm', { banners: banners });
    } catch (error) {
        res.render('pages/homeadm', { banners: [] });
    }
});
router.get('/vistoriaprodutos', (req, res) => res.render('pages/vistoriaprodutos'));

router.get('/denuncias', function(req, res) {
    res.render('pages/denuncias', {
        denuncias: [],
        autenticado: req.session.autenticado || null
    });
});

router.post('/denuncias/criar', denunciaController.criarDenuncia);

router.post('/denuncias/analisar/:id', denunciaController.analisarDenuncia);

router.post('/denuncias/resolver/:id', denunciaController.resolverDenuncia);

router.post('/denuncias/rejeitar/:id', denunciaController.rejeitarDenuncia);

router.get('/denuncias/analisar/:id', denunciaController.analisarDenunciaDetalhada);

router.get('/analisardenuncia', (req, res) => res.render('pages/analisardenuncia'));
router.get('/perfilpremium', (req, res) => res.render('pages/perfilpremium'));
router.get('/blogadm', (req, res) => {
    const posts = [
        {
            ID_ARTIGO: 1,
            TITULO: 'METALIZADO: 7 LOOKS PARA VOCÊ SE INSPIRAR',
            CONTEUDO: 'O metalizado se destaca em 2024 como uma tendência versátil...',
            AUTOR: 'Vintélo Fashion',
            DT_PUBLICACAO: '2024-11-05'
        },
        {
            ID_ARTIGO: 2,
            TITULO: 'BOSS | Milão Verão 2024',
            CONTEUDO: 'A marca alemã BOSS apresentou em Milão...',
            AUTOR: 'Vintélo Fashion',
            DT_PUBLICACAO: '2024-11-03'
        },
        {
            ID_ARTIGO: 3,
            TITULO: 'Gucci | Milão Verão 2024',
            CONTEUDO: 'Sob a direção criativa de Sabato De Sarno...',
            AUTOR: 'Vintélo Fashion',
            DT_PUBLICACAO: '2024-10-25'
        }
    ];
    res.render('pages/blogadm', { posts: posts });
});

router.post('/blogadm', function(req, res){
    console.log('Novo post criado:', req.body);
    res.redirect('/blogadm');
});

router.get('/editarpost', (req, res) => res.render('pages/editarpost'));
router.get('/editarboss', (req, res) => res.render('pages/editarboss'));
router.get('/editargucci', (req, res) => res.render('pages/editargucci'));
router.get('/editarsweet', (req, res) => res.render('pages/editarsweet'));
router.get('/editarsustentavel', (req, res) => res.render('pages/editarsustentavel'));
router.get('/editarecologico', (req, res) => res.render('pages/editarecologico'));
router.post('/editarpost', function(req, res){ res.redirect('/blogadm'); });
router.post('/editarboss', function(req, res){ res.redirect('/blogadm'); });
router.post('/editargucci', function(req, res){ res.redirect('/blogadm'); });
router.post('/editarsweet', function(req, res){ res.redirect('/blogadm'); });
router.post('/editarsustentavel', function(req, res){ res.redirect('/blogadm'); });
router.post('/editarecologico', function(req, res){ res.redirect('/blogadm'); });

router.get('/avaliacaoadm', (req, res) => res.render('pages/avaliacaoadm'));
router.get('/editarpost', (req, res) => res.render('pages/editarpost'));

router.post('/editarpost', function(req, res){ console.log('Post editado:', req.body); res.redirect('/blogadm'); });

router.get('/brechoadm', (req, res) => res.render('pages/brechoadm'));
router.get('/usuariosadm', (req, res) => res.render('pages/usuariosadm'));

router.post('/premium/atualizar-plano', atualizarPlano);
router.post('/premium/alternar-status', alternarStatusPlano);

// Rotas de Compra
router.post('/adicionar-carrinho', compraController.adicionarAoCarrinho);
router.get('/carrinho', compraController.mostrarCarrinho);
router.post('/atualizar-quantidade', compraController.atualizarQuantidade);
router.post('/remover-item', compraController.removerItem);
router.get('/finalizar-compra', compraController.finalizarCompra);
router.post('/limpar-carrinho', compraController.limparCarrinho);
router.get('/confirmar-pedido', compraController.confirmarPedido);

// Rotas do Mercado Pago
router.post('/processar-pagamento', pagamentoController.processarPagamento);
router.get('/pagamento-sucesso', pagamentoController.pagamentoSucesso);
router.get('/pagamento-falha', pagamentoController.pagamentoFalha);
router.get('/pagamento-pendente', pagamentoController.pagamentoPendente);
router.post('/webhook-mercadopago', pagamentoController.webhookMercadoPago);

// Rotas de Favoritos
router.post('/favoritar', verificarUsuAutenticado, async function(req, res){
    try {
        const { produto_id } = req.body;
        const userId = req.session.autenticado.id;
        
        // Verificar se já está favoritado
        const [existing] = await pool.query(
            'SELECT * FROM FAVORITOS WHERE ID_PRODUTO = ? AND ID_USUARIO = ?',
            [produto_id, userId]
        );
        
        if (existing.length > 0) {
            // Se existe, alternar status
            const newStatus = existing[0].STATUS_FAVORITO === 1 ? 0 : 1;
            await pool.query(
                'UPDATE FAVORITOS SET STATUS_FAVORITO = ? WHERE ID_PRODUTO = ? AND ID_USUARIO = ?',
                [newStatus, produto_id, userId]
            );
            res.json({ success: true, favorited: newStatus === 1 });
        } else {
            // Se não existe, criar novo
            await pool.query(
                'INSERT INTO FAVORITOS (ID_PRODUTO, ID_USUARIO, STATUS_FAVORITO, DT_INCLUSAO_FAVORITO) VALUES (?, ?, 1, NOW())',
                [produto_id, userId]
            );
            res.json({ success: true, favorited: true });
        }
    } catch (error) {
        console.log('Erro ao favoritar:', error);
        res.json({ success: false, error: error.message });
    }
});

router.get('/verificar-favorito/:produto_id', async function(req, res){
    try {
        const { produto_id } = req.params;
        
        if (!req.session.autenticado) {
            return res.json({ favorited: false });
        }
        
        const [favorito] = await pool.query(
            'SELECT STATUS_FAVORITO FROM FAVORITOS WHERE ID_PRODUTO = ? AND ID_USUARIO = ?',
            [produto_id, req.session.autenticado.id]
        );
        
        const isFavorited = favorito.length > 0 && favorito[0].STATUS_FAVORITO === 1;
        res.json({ favorited: isFavorited });
    } catch (error) {
        console.log('Erro ao verificar favorito:', error);
        res.json({ favorited: false });
    }
});

module.exports = router;
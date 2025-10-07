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
const { adicionarController } = require("../controllers/adicionarController");
const categoriaController = require("../controllers/categoriaController");
const denunciaController = require("../controllers/denunciaController");
const { atualizarPlano, alternarStatusPlano } = require("../controllers/premiumController");
const pedidoController = require("../controllers/pedidoController");
const { bannerController } = require("../controllers/bannerController");
const usuarioModel = require('../models/usuarioModel');
const tipoUsuarioModel = require('../models/tipoUsuarioModel');
const cliente = require('../models/clienteModel');

const uploadFile = require("../util/uploader");
const uploadProduto = require("../util/uploaderProduto");

const { MercadoPagoConfig, Preference } = require('mercadopago');
const client = new MercadoPagoConfig({
  accessToken: process.env.accessToken
});

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
        
        if (usuarios.length > 0) {
            const usuario = usuarios[0];
            const senhaValida = bcrypt.compareSync(senha_usu, usuario.SENHA_USUARIO);
            
            if (senhaValida) {
                req.session.autenticado = {
                    autenticado: usuario.NOME_USUARIO,
                    id: usuario.ID_USUARIO,
                    tipo: usuario.TIPO_USUARIO,
                    nome: usuario.NOME_USUARIO,
                    email: usuario.EMAIL_USUARIO
                };
                
                return res.redirect(usuario.TIPO_USUARIO == 2 ? '/homevendedor' : '/homecomprador');
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
    res.render("pages/adm", req.session.autenticado);
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


router.get('/adicionar', adicionarController.mostrarFormulario);

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

router.get('/pedidoconf', (req, res) => res.render('pages/pedidoconf'));
router.get('/finalizandocompra1', (req, res) => res.render('pages/finalizandocompra1'));
router.get('/finalizandocompra2', (req, res) => res.render('pages/finalizandocompra2'));
router.get('/favoritos', (req, res) => res.render('pages/favoritos'));
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
    
    console.log('Tentativa de login:', { email_usu, senha_usu });
    
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
        
        if (usuarios.length > 0) {
            const usuario = usuarios[0];
            const senhaValida = bcrypt.compareSync(senha_usu, usuario.SENHA_USUARIO);
            
            if (senhaValida) {
                req.session.autenticado = {
                    autenticado: usuario.NOME_USUARIO,
                    id: usuario.ID_USUARIO,
                    tipo: usuario.TIPO_USUARIO,
                    nome: usuario.NOME_USUARIO,
                    email: usuario.EMAIL_USUARIO
                };
                
                if (usuario.TIPO_USUARIO == 2) {
                    req.session.brecho = {
                        nome: 'Meu Brechó',
                        proprietario: usuario.NOME_USUARIO,
                        avaliacao: '4.5',
                        itens_venda: '15',
                        vendidos: '8',
                        seguidores: '25'
                    };
                    res.redirect('/homevendedor');
                } else {
                    res.redirect('/homecomprador');
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
router.get('/finalizandopagamento', (req, res) => res.render('pages/finalizandopagamento'));
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
            usuario: userData
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
            }
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
        console.log('Dados recebidos:', req.body);
        console.log('Sessão:', req.session.autenticado);
        
        const { firstName, lastName, email, phone, 'birth-date': birthDate, bio } = req.body;
        
        if (req.session && req.session.autenticado && req.session.autenticado.id) {
            const dadosUsuario = {
                NOME_USUARIO: `${firstName} ${lastName}`,
                EMAIL_USUARIO: email,
                CELULAR_USUARIO: phone
            };
            
            // Salvar bio separadamente se existir campo na tabela
            if (bio) {
                dadosUsuario.DESCRICAO_USUARIO = bio;
            }
            

            
            console.log('Atualizando usuário:', dadosUsuario);
            await usuarioModel.update(dadosUsuario, req.session.autenticado.id);
            
            // Se for cliente, atualizar data de nascimento
            if (birthDate) {
                const clienteData = await cliente.findByUserId(req.session.autenticado.id);
                if (clienteData && clienteData.length > 0) {
                    const dadosCliente = {
                        DATA_NASC: birthDate
                    };
                    console.log('Atualizando cliente:', dadosCliente);
                    await cliente.update(dadosCliente, req.session.autenticado.id);
                }
            }
            
            console.log('Dados atualizados com sucesso');
        }
        
        res.redirect('/perfilcliente');
    } catch (error) {
        console.log('Erro ao salvar perfil:', error);
        res.redirect('/perfilcliente');
    }
});

router.get('/perfilcliente', async function(req, res){
    try {
        console.log('Sessão autenticado:', req.session.autenticado);
        
        let userData = {
            nome: 'Usuário',
            email: 'email@exemplo.com',
            telefone: '(11) 99999-9999',
            imagem: null,
            user_usuario: 'usuario',
            data_cadastro: 'Janeiro 2024',
            compras: 12,
            favoritos: 5,
            avaliacoes: 3,
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
            console.log('Buscando dados do usuário ID:', req.session.autenticado.id);
            const userDetails = await usuarioModel.findId(req.session.autenticado.id);
            console.log('Dados encontrados:', userDetails);
            
            if (userDetails && userDetails.length > 0) {
                const user = userDetails[0];
                userData = {
                    nome: user.NOME_USUARIO || 'Usuário',
                    email: user.EMAIL_USUARIO || 'email@exemplo.com',
                    telefone: user.CELULAR_USUARIO || '(11) 99999-9999',
                    imagem: user.IMG_URL || null,
                    user_usuario: user.USER_USUARIO || 'usuario',
                    tipo_usuario: user.TIPO_USUARIO || 'cliente',
                    bio: user.DESCRICAO_USUARIO || '',
                    data_cadastro: 'Janeiro 2024',
                    compras: 12,
                    favoritos: 5,
                    avaliacoes: 3,
                    cep: user.CEP_USUARIO || '',
                    logradouro: user.LOGRADOURO_USUARIO || '',
                    numero: user.NUMERO_USUARIO || '',
                    bairro: user.BAIRRO_USUARIO || '',
                    cidade: user.CIDADE_USUARIO || '',
                    uf: user.UF_USUARIO || '',
                    cpf: '',
                    data_nasc: ''
                };
                
                // Buscar dados específicos do cliente apenas se for tipo 'cliente'
                if (user.TIPO_USUARIO === 'cliente') {
                    const clienteData = await cliente.findByUserId(req.session.autenticado.id);
                    console.log('Dados do cliente:', clienteData);
                    if (clienteData && clienteData.length > 0) {
                        userData.cpf = clienteData[0].CPF_CLIENTE || '';
                        userData.data_nasc = clienteData[0].DATA_NASC || '';
                    }
                }
            }
        }
        
        console.log('userData final:', userData);
        res.render('pages/perfilcliente', {
            usuario: userData,
            autenticado: req.session ? req.session.autenticado : null
        });
    } catch (error) {
        console.log('Erro ao carregar perfil:', error);
        res.render('pages/perfilcliente', {
            usuario: {
                nome: 'Usuário',
                email: 'email@exemplo.com',
                telefone: '(11) 99999-9999',
                imagem: null,
                user_usuario: 'usuario',
                data_cadastro: 'Janeiro 2024',
                compras: 12,
                favoritos: 5,
                avaliacoes: 3,
                cep: '',
                logradouro: '',
                numero: '',
                bairro: '',
                cidade: '',
                uf: '',
                cpf: '',
                data_nasc: ''
            },
            autenticado: req.session ? req.session.autenticado : null
        });
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

router.get('/denuncias', denunciaController.listarDenuncias);

router.post('/denuncias/criar', denunciaController.criarDenuncia);

router.post('/denuncias/analisar/:id', denunciaController.analisarDenuncia);

router.post('/denuncias/resolver/:id', denunciaController.resolverDenuncia);

router.post('/denuncias/rejeitar/:id', denunciaController.rejeitarDenuncia);

router.get('/denuncias/analisar/:id', denunciaController.analisarDenunciaDetalhada);

router.get('/analisardenuncia', (req, res) => res.render('pages/analisardenuncia'));
router.get('/perfilpremium', (req, res) => res.render('pages/perfilpremium'));
router.get('/blogadm', (req, res) => res.render('pages/blogadm'));

router.post('/blogadm', function(req, res){
    const { titulo, categoria, conteudo, data } = req.body;
    console.log('Novo post criado:', { titulo, categoria, conteudo, data: data || new Date().toLocaleDateString('pt-BR') });
    res.redirect('/blogadm');
});

router.get('/avaliacaoadm', (req, res) => res.render('pages/avaliacaoadm'));
router.get('/editarpost', (req, res) => res.render('pages/editarpost'));

router.post('/editarpost', function(req, res){ console.log('Post editado:', req.body); res.redirect('/blogadm'); });

router.get('/brechoadm', (req, res) => res.render('pages/brechoadm'));
router.get('/usuariosadm', (req, res) => res.render('pages/usuariosadm'));

router.post('/premium/atualizar-plano', atualizarPlano);
router.post('/premium/alternar-status', alternarStatusPlano);

module.exports = router;
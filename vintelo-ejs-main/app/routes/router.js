var express = require("express");
var router = express.Router();
const bcrypt = require('bcryptjs');

const {
  verificarUsuAutenticado,
  limparSessao,
  verificarUsuAutorizado
} = require("../models/autenticador_middleware");

const usuarioController = require("../controllers/usuarioController");
const carrinhoController = require("../controllers/carrinhoController");
const produtoController = require("../controllers/produtoController");
const { adicionarController } = require("../controllers/adicionarController");
const categoriaController = require("../controllers/categoriaController");
const denunciaController = require("../controllers/denunciaController");
const { atualizarPlano, alternarStatusPlano } = require("../controllers/premiumController");
const pedidoController = require("../controllers/pedidoController");
const usuarioModel = require('../models/usuarioModel');
const tipoUsuarioModel = require('../models/tipoUsuarioModel');

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

router.get("/", function (req, res) {
  res.render('pages/index', {
    autenticado: req.session ? req.session.autenticado : null
  });
});

router.get("/index", function (req, res) {
  res.render('pages/index', {
    autenticado: req.session ? req.session.autenticado : null
  });
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
    valores: { nome_usu: "", nomeusu_usu: "", email_usu: "", senha_usu: "" },
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

// Produtos
router.get('/produto1', (req, res) => res.render('pages/produto1'));
router.get('/produto2', (req, res) => res.render('pages/produto2'));
router.get('/produto3', (req, res) => res.render('pages/produto3'));
router.get('/produto4', (req, res) => res.render('pages/produto4'));

// Carrinho e Perfis
router.get('/carrinho', function(req, res){
    res.render('pages/carrinho', {
        carrinho: req.session.carrinho || [],
        autenticado: req.session.autenticado || { autenticado: false }
    });
});

router.get('/perfil1', (req, res) => res.render('pages/perfil1'));
router.get('/perfil2', (req, res) => res.render('pages/perfil2'));
router.get('/perfil3', (req, res) => res.render('pages/perfil3'));

router.get('/homecomprador', async function(req, res){
    try {
        const { produtoModel } = require('../models/produtoModel');
        const produtos = await produtoModel.findRecent(8) || [];
        
        res.render('pages/homecomprador', {
            autenticado: req.session.autenticado,
            produtos: produtos
        });
    } catch (error) {
        console.log('Erro ao buscar produtos:', error);
        res.render('pages/homecomprador', {
            autenticado: req.session.autenticado,
            produtos: []
        });
    }
});

router.get('/homevendedor', function(req, res){
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
        autenticado: req.session.autenticado
    });
});


router.get('/adicionar', adicionarController.mostrarFormulario);

router.post('/adicionar', 
    uploadProduto.array('fotos', 5),
    adicionarController.regrasValidacao,
    adicionarController.criarProduto
);

// Blog e Artigos
router.get('/blog', (req, res) => res.render('pages/blog'));
router.get('/artigo', (req, res) => res.render('pages/artigo'));
router.get('/bossartigo', (req, res) => res.render('pages/bossartigo'));
router.get('/gucciartigo', (req, res) => res.render('pages/gucciartigo'));
router.get('/ecologicoartigo', (req, res) => res.render('pages/ecologicoartigo'));
router.get('/tensustentavel', (req, res) => res.render('pages/tensustentavel'));
router.get('/sweer', (req, res) => res.render('pages/sweer'));

// Compras e Avaliações
router.get('/pedidoconf', (req, res) => res.render('pages/pedidoconf'));
router.get('/finalizandocompra1', (req, res) => res.render('pages/finalizandocompra1'));
router.get('/finalizandocompra2', (req, res) => res.render('pages/finalizandocompra2'));
router.get('/favoritos', (req, res) => res.render('pages/favoritos'));
router.get('/sacola1', (req, res) => res.render('pages/sacola1'));
router.get('/avaliasao', (req, res) => res.render('pages/avaliasao'));

router.get('/perfilvender', function(req, res){
    const brechoData = {
        nome: (req.session.autenticado && req.session.autenticado.nome) || 'Nome do Brechó',
        imagem: (req.session.autenticado && req.session.autenticado.imagem_usuario) || null,
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

router.get('/criarbrecho', (req, res) => res.render('pages/criarbrecho'));

router.post('/criarbrecho', async function(req, res){
    const { nomeusu_usu, email_usu, nome_usu, senha_usu, fone_usu, cep, endereco, bairro, cidade, uf } = req.body;
    
    console.log('Dados do brechó recebidos:', req.body);
    
    if (!nomeusu_usu || !email_usu || !nome_usu || !senha_usu || !fone_usu) {
        return res.render('pages/criarbrecho', {
            erro: 'Todos os campos obrigatórios devem ser preenchidos',
            valores: req.body
        });
    }
    
    if (senha_usu !== confirmar_senha) {
        return res.render('pages/criarbrecho', {
            erro: 'As senhas não coincidem',
            valores: req.body
        });
    }
    
    try {
        
        const tipoBrecho = await tipoUsuarioModel.findByTipo('brecho');
        
        const dadosUsuario = {
            NOME_USUARIO: nome_usu,
            USER_USUARIO: nomeusu_usu,
            EMAIL_USUARIO: email_usu,
            SENHA_USUARIO: bcrypt.hashSync(senha_usu, 10),
            CELULAR_USUARIO: fone_usu,
            CEP_USUARIO: cep,
            TIPO_USUARIO: tipoBrecho.length > 0 ? tipoBrecho[0].ID_TIPO_USUARIO : 3,
            STATUS_USUARIO: 1
        };
        
        console.log('Tentando criar usuário vendedor:', dadosUsuario);
        
        const resultadoUsuario = await usuarioModel.create(dadosUsuario);
        
        if (resultadoUsuario && resultadoUsuario.insertId) {
            
            req.session.autenticado = {
                autenticado: nome_usu,
                id: resultadoUsuario.insertId,
                tipo: tipoBrecho.length > 0 ? tipoBrecho[0].ID_TIPO_USUARIO : 3,
                nome: nome_usu,
                email: email_usu
            };
            
            req.session.brecho = {
                USER_USUARIO: nomeusu_usu,
                EMAIL_USUARIO: email_usu,
                NOME_USUARIO: nome_usu,
                CELULAR_USUARIO: fone_usu,
                endereco: endereco ? `${endereco}, ${bairro}, ${cidade} - ${uf}, ${cep}` : null,
                NOTA: '5.0',
                ID_ITEM_PEDIDO: '0',
                VENDIDAS: '0',
                SEGUIDORES: '0'
            };
            
            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.json({
                    success: true,
                    userData: {
                        nome: nome_usu,
                        email: email_usu,
                        imagem: null
                    }
                });
            }
            
            console.log('Brechó criado com sucesso:', resultadoUsuario.insertId);
            res.redirect('/homevendedor');
        } else {
            throw new Error('Falha ao criar usuário');
        }
    } catch (error) {
        console.log('Erro ao criar brechó:', error);
        res.render('pages/criarbrecho', {
            erro: 'Erro ao criar brechó. Tente novamente.',
            valores: req.body
        });
    }
});

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
            // Gerar código de 6 dígitos
            const codigo = Math.floor(100000 + Math.random() * 900000).toString();
            
            // Salvar código na sessão (em produção, salvar no banco com expiração)
            req.session.codigoRecuperacao = {
                email: email_usu,
                codigo: codigo,
                expira: Date.now() + 10 * 60 * 1000 // 10 minutos
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

// Estatísticas
router.get('/estatistica', (req, res) => res.render('pages/estatistica'));
router.get('/estatistica-mobile', (req, res) => res.render('pages/estatistica-mobile'));
router.get('/estatistica-desktop', (req, res) => res.render('pages/estatistica-desktop'));

router.get('/categorias', categoriaController.mostrarCategorias);
router.get('/categorias/filtrar/:categoryId', categoriaController.filtrarProdutos);

// Páginas Administrativas e Menus
router.get('/editarbanners', (req, res) => res.render('pages/editarbanners'));
router.post('/editarbanners', function(req, res){ console.log('Banners atualizados:', req.files); res.redirect('/homeadm'); });
router.get('/minhascompras', (req, res) => res.render('pages/minhascompras'));
router.get('/finalizandopagamento', (req, res) => res.render('pages/finalizandopagamento'));
router.get('/pedidos', (req, res) => res.render('pages/pedidos'));
router.get('/enviopedido', (req, res) => res.render('pages/enviopedido'));
router.get('/menu', (req, res) => res.render('pages/menu'));
router.get('/minhascomprasdesktop', (req, res) => res.render('pages/minhascomprasdesktop'));
router.get('/menuvendedor', (req, res) => res.render('pages/menuvendedor'));
router.get('/informacao', (req, res) => res.render('pages/informacao'));
router.get('/menufavoritos', (req, res) => res.render('pages/menufavoritos'));
router.get('/menucompras', (req, res) => res.render('pages/menucompras'));
router.get('/planos', (req, res) => res.render('pages/planos'));

router.get('/perfilcliente', function(req, res){
   
    
    const userData = {
        nome: (req.session && req.session.autenticado && req.session.autenticado.nome) ? req.session.autenticado.nome : 'Maria Silva',
        email: (req.session && req.session.autenticado && req.session.autenticado.email) ? req.session.autenticado.email : 'maria.silva@email.com',
        telefone: (req.session && req.session.autenticado && req.session.autenticado.telefone) ? req.session.autenticado.telefone : '(11) 99999-9999',
        imagem: (req.session && req.session.autenticado && req.session.autenticado.imagem) ? req.session.autenticado.imagem : null,
        data_cadastro: (req.session && req.session.autenticado && req.session.autenticado.data_cadastro) ? req.session.autenticado.data_cadastro : 'Janeiro 2024',
        compras: (req.session && req.session.autenticado && req.session.autenticado.compras) ? req.session.autenticado.compras : 12,
        favoritos: (req.session && req.session.autenticado && req.session.autenticado.favoritos) ? req.session.autenticado.favoritos : 5,
        avaliacoes: (req.session && req.session.autenticado && req.session.autenticado.avaliacoes) ? req.session.autenticado.avaliacoes : 3
    };
    
    res.render('pages/perfilcliente', {
        usuario: userData,
        autenticado: req.session ? req.session.autenticado : null
    });
});


// Administração
router.get('/homeadm', (req, res) => res.render('pages/homeadm'));
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
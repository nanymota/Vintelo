var express = require("express");
var router = express.Router();

const {
  verificarUsuAutenticado,
  limparSessao,
  gravarUsuAutenticado,
} = require("../models/autenticador_middleware");

const usuarioController = require("../controllers/usuarioController");
const { carrinhoController } = require("../controllers/carrinhoController");
const { produtoController } = require("../controllers/produtoController");
const { adicionarController } = require("../controllers/adicionarController");
const denunciaController = require("../controllers/denunciaController");

const uploadFile = require("../util/uploader")("./app/public/imagem/perfil/");
const uploadProduto = require("../util/uploaderProduto");

const { MercadoPagoConfig, Preference } = require('mercadopago');
const { pedidoController } = require("../controllers/pedidoController");

const client = new MercadoPagoConfig({
  accessToken: process.env.accessToken
});

/*router.get("/adicionar", function (req, res) {
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
});*/

/*router.get(
  "/perfil",
  verificarUsuAutorizado([1, 2, 3], "pages/restrito"),
  async function (req, res) {
    usuarioController.mostrarPerfil(req, res);
  }
);*/

/*router.post(
  "/perfil",
  uploadFile("imagem-perfil_usu"),
  usuarioController.regrasValidacaoPerfil,
  verificarUsuAutorizado([1, 2, 3], "pages/restrito"),
  async function (req, res) {
    usuarioController.gravarPerfil(req, res);
  }
);*/

router.get("/", verificarUsuAutenticado, function (req, res) {
  produtoController.listar(req, res);
});

router.get("/favoritar", verificarUsuAutenticado, function (req, res) {
  produtoController.favoritar(req, res);
});

router.get("/sair", limparSessao, function (req, res) {
  res.redirect("/");
});





/*router.get(
  "/adm",
  verificarUsuAutenticado,
  verificarUsuAutorizado([2, 3], "pages/restrito"),
  function (req, res) {
    res.render("pages/adm", req.session.autenticado);
  }
);*/

/*router.post("/create-preference", function (req, res) {
  const preference = new Preference(client);
  console.log(req.body.items);
  preference.create({
    body: {
      items: req.body.items,
      back_urls: {
        "success": process.env.URL_BASE + "/feedback",
        "failure": process.env.URL_BASE + "/feedback",
        "pending": process.env.URL_BASE + "/feedback"
      },
      auto_return: "approved",
    }
  })
    .then((value) => {
      res.json(value)
    })
    .catch(console.log)
});
*/
router.get("/feedback", function (req, res) {
  pedidoController.gravarPedido(req, res);
});

router.get('/index', function(req, res){
    res.render('pages/index');
})

router.get('/produto1', function(req, res){
    res.render('pages/produto1');
})

router.get('/produto2', function(req, res){
    res.render('pages/produto2');
})

router.get('/produto3', function(req, res){
    res.render('pages/produto3');
})

router.get('/produto4', function(req, res){
    res.render('pages/produto4');
})

router.get('/login', function(req, res){
    res.render('pages/login', {
        valores: {},
        avisoErro: {}
    });
});

router.get('/cadastro', function(req, res){
    res.render('pages/cadastro', {
        valores: {},
        avisoErro: {}
    });
});

router.post('/login', usuarioController.regrasValidacaoFormLogin, async function(req, res){
    usuarioController.cadastrar(req, res);
});

router.post("/cadastro", usuarioController.regrasValidacaoFormCad, async function(req, res){
    usuarioController.cadastrar(req, res);
});

router.get('/carrinho', function(req, res){
    res.render('pages/carrinho');
})

router.get('/perfil1', function(req, res){
    res.render('pages/perfil1');
})

router.get('/perfil2', function(req, res){
    res.render('pages/perfil2');
})

router.get('/perfil3', function(req, res){
    res.render('pages/perfil3');
})

router.get('/homecomprador', function(req, res){
    res.render('pages/homecomprador', {
        autenticado: req.session.autenticado
    });
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

router.get('/blog', function(req, res){
    res.render('pages/blog');
})

router.get('/bossartigo', function(req, res){
    res.render('pages/bossartigo');
})

router.get('/gucciartigo', function(req, res){
    res.render('pages/gucciartigo');
})

router.get('/ecologicoartigo', function(req, res){
    res.render('pages/ecologicoartigo');
})

router.get('/tensustentavel', function(req, res){
    res.render('pages/tensustentavel');
})

router.get('/sweer', function(req, res){
    res.render('pages/sweer');
})

router.get('/pedidoconf', function(req, res){
    res.render('pages/pedidoconf');
})

router.get('/finalizandocompra1', function(req, res){
    res.render('pages/finalizandocompra1');
})

router.get('/finalizandocompra2', function(req, res){
    res.render('pages/finalizandocompra2');
})

router.get('/favoritos', function(req, res){
    res.render('pages/favoritos');
})

router.get('/sacola1', function(req, res){
    res.render('pages/sacola1');
})

router.get('/avaliasao', function(req, res){
    res.render('pages/avaliasao');
})

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

router.get('/criarbrecho', function(req, res){
    res.render('pages/criarbrecho');
});

router.post('/criarbrecho', async function(req, res){
    console.log(req);
    const bcrypt = require('bcryptjs');
    const usuarioModel = require('../models/usuarioModel');
    const tipoUsuarioModel = require('../models/tipoUsuarioModel');
    const { nomeusu_usu, email_usu, nome_usu, senha_usu, confirmar_senha, fone_usu, cep, endereco, bairro, cidade, uf } = req.body;
    
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
        // Buscar ID do tipo brecho
        const tipoBrecho = await tipoUsuarioModel.findByTipo('brecho');
        
        // 1. Criar usuário vendedor
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
            // Salvar na sessão
            req.session.autenticado = {
                autenticado: nome_usu,
                id: resultadoUsuario.insertId,
                tipo: tipoBrecho.length > 0 ? tipoBrecho[0].ID_TIPO_USUARIO : 3,
                nome: nome_usu,
                email: email_usu
            };
            
            req.session.brecho = {
                nome: nomeusu_usu,
                email: email_usu,
                proprietario: nome_usu,
                telefone: fone_usu,
                endereco: endereco ? `${endereco}, ${bairro}, ${cidade} - ${uf}, ${cep}` : null,
                avaliacao: '5.0',
                itens_venda: '0',
                vendidos: '0',
                seguidores: '0'
            };
            
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
    res.render('pages/entrar', {
        listaErros: null,
        dadosNotificacao: null
    });
});

router.post('/entrar', async function(req, res){
    const bcrypt = require('bcryptjs');
    const usuarioModel = require('../models/usuarioModel');
    const { nome_usu, senha_usu } = req.body;
    
    console.log('Tentativa de login:', { nome_usu, senha_usu });
    
    if (!nome_usu || !senha_usu) {
        return res.render('pages/entrar', {
            listaErros: null,
            dadosNotificacao: {
                titulo: 'Erro!',
                mensagem: 'Todos os campos são obrigatórios',
                tipo: 'error'
            }
        });
    }
    
    try {
        const usuarios = await usuarioModel.findUserEmail({ user_usuario: nome_usu });
        
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
                    }
                });
            }
        } else {
            res.render('pages/entrar', {
                listaErros: null,
                dadosNotificacao: {
                    titulo: 'Falha ao logar!',
                    mensagem: 'Usuário não encontrado!',
                    tipo: 'error'
                }
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
            }
        });
    }
});

router.get('/esqueceusenha', function(req, res){
    res.render('pages/esqueceusenha');
})

router.get('/estatistica', function(req, res){
    res.render('pages/estatistica');
})

router.get('/categorias', function(req, res){
    res.render('pages/categorias');
})

router.get('/editarbanners', function(req, res){
    res.render('pages/editarbanners');
})

router.post('/editarbanners', function(req, res){
    console.log('Banners atualizados:', req.files);
    res.redirect('/homeadm');
})

router.get('/minhascompras', function(req, res){
    res.render('pages/minhascompras');
})

router.get('/finalizandopagamento', function(req, res){
    res.render('pages/finalizandopagamento');
})

router.get('/pedidos', function(req, res){
    res.render('pages/pedidos');
})

router.get('/enviopedido', function(req, res){
    res.render('pages/enviopedido');
})

router.get('/menu', function(req, res){
    res.render('pages/menu');
})

router.get('/minhascomprasdesktop', function(req, res){
    res.render('pages/minhascomprasdesktop');
})

router.get('/menuvendedor', function(req, res){
    res.render('pages/menuvendedor');
})

router.get('/informacao', function(req, res){
    res.render('pages/informacao');
})

router.get('/perfilcliente', function(req, res){
    res.render('pages/perfilcliente');
})

router.get('/menufavoritos', function(req, res){
    res.render('pages/menufavoritos');
})

router.get('/menucompras', function(req, res){
    res.render('pages/menucompras');
})

router.get('/planos', function(req, res){
    res.render('pages/planos');
})

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


// home adm de teste //

router.get('/home-adm',function(req, res){
    res.render('pages/home-adm');
})

router.get('/homeadm', function(req, res){
    res.render('pages/homeadm');
})

router.get('/vistoriapedidos', function(req, res){
    res.render('pages/vistoriapedidos');
})

router.get('/vistoriaprodutos', function(req, res){
    res.render('pages/vistoriaprodutos');
})

router.get('/administradorperfis', function(req, res){
    res.render('pages/administradorperfis');
})

router.get('/denuncias', denunciaController.listarDenuncias);

router.post('/denuncias/criar', denunciaController.criarDenuncia);

router.post('/denuncias/analisar/:id', denunciaController.analisarDenuncia);

router.post('/denuncias/resolver/:id', denunciaController.resolverDenuncia);

router.post('/denuncias/rejeitar/:id', denunciaController.rejeitarDenuncia);

router.get('/denuncias/analisar/:id', denunciaController.analisarDenunciaDetalhada);

router.get('/perfilpremium', function(req, res){
    res.render('pages/perfilpremium');
})

router.get('/blogadm', function(req, res){
    res.render('pages/blogadm');
})

router.post('/blogadm', function(req, res){
    const { titulo, categoria, conteudo, data } = req.body;
    
    // Simular salvamento do post
    console.log('Novo post criado:', {
        titulo,
        categoria,
        conteudo,
        data: data || new Date().toLocaleDateString('pt-BR')
    });
    
    res.redirect('/blogadm');
})

router.get('/avaliacaoadm', function(req, res){
    res.render('pages/avaliacaoadm');
})

router.get('/editarpost', function(req, res){
    res.render('pages/editarpost');
})

router.post('/editarpost', function(req, res){
    console.log('Post editado:', req.body);
    res.redirect('/blogadm');
})

router.get('/brechoadm', function(req, res){
    res.render('pages/brechoadm');
})

router.get('/usuariosadm', function(req, res){
    res.render('pages/usuariosadm');
})

// Rotas para Premium
const premiumController = require('../controllers/premiumController');

router.post('/premium/atualizar-plano', premiumController.atualizarPlano);
router.post('/premium/alternar-status', premiumController.alternarStatusPlano);

module.exports = router;
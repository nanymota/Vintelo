var express = require("express");
var router = express.Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');

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

router.get("/", carregarDadosUsuario, async function (req, res) {
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
        const resultado = await usuarioController.autenticarUsuario(email_usu, senha_usu);
        
        if (resultado.success) {
            const usuario = resultado.usuario;
            req.session.autenticado = {
                autenticado: usuario.NOME_USUARIO,
                id: usuario.ID_USUARIO,
                tipo: usuario.TIPO_USUARIO,
                nome: usuario.NOME_USUARIO,
                email: usuario.EMAIL_USUARIO
            };
            
            console.log('Sessão criada:', req.session.autenticado);
            return res.redirect('/homecomprador');
        }
        
        res.render('pages/login', {
            listaErros: null,
            dadosNotificacao: { titulo: 'Falha ao logar!', mensagem: 'Usuário ou senha inválidos!', tipo: 'error' },
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



router.get('/cadastroadm', function(req, res){ res.render('pages/cadastroadm'); });

router.get("/adm", verificarUsuAutenticado, verificarUsuAutorizado([2, 3], "pages/restrito"), function (req, res) {
    res.render("pages/adm", {
        autenticado: req.session.autenticado
    });
});




router.get('/produto/:id', carregarDadosUsuario, async function(req, res){
    try {
        const { id } = req.params;
        
        // Buscar dados do produto
        const [produtos] = await pool.query(
            `SELECT p.*, u.NOME_USUARIO as VENDEDOR 
             FROM PRODUTOS p 
             JOIN USUARIOS u ON p.ID_USUARIO = u.ID_USUARIO 
             WHERE p.ID_PRODUTO = ? AND p.STATUS_PRODUTO = 'd'`,
            [id]
        );
        
        if (produtos.length === 0) {
            return res.render('pages/produto', {
                produto: null,
                autenticado: req.session.autenticado || null
            });
        }
        
        // Buscar imagens do produto
        const [imagens] = await pool.query(
            'SELECT URL_IMG FROM IMG_PRODUTOS WHERE ID_PRODUTO = ?',
            [id]
        );
        
        console.log('Produto encontrado:', produtos[0]);
        console.log('Imagens encontradas:', imagens);
        
        const produto = produtos[0];
        produto.imagens = imagens;
        
        res.render('pages/produto', {
            produto: produto,
            autenticado: req.session.autenticado || null
        });
    } catch (error) {
        console.log('Erro ao carregar produto:', error);
        res.render('pages/produto', {
            produto: null,
            autenticado: req.session.autenticado || null
        });
    }
});

router.get('/produto1', (req, res) => res.render('pages/produto1'));
router.get('/produto2', (req, res) => res.render('pages/produto2'));
router.get('/produto3', (req, res) => res.render('pages/produto3'));
router.get('/produto4', (req, res) => res.render('pages/produto4'));

router.get('/carrinho', verificarUsuAutenticado, async function(req, res){
    try {
        const [itensSacola] = await pool.query(`
            SELECT 
                is.QUANTIDADE,
                is.VALOR_TOTAL,
                p.ID_PRODUTO,
                p.NOME_PRODUTO,
                p.PRECO,
                p.TAMANHO_PRODUTO,
                p.COR_PRODUTO,
                p.ESTILO_PRODUTO,
                p.ESTAMPA_PRODUTO,
                img.URL_IMG
            FROM ITENS_SACOLA is
            JOIN SACOLA s ON is.ID_SACOLA = s.ID_SACOLA
            JOIN PRODUTOS p ON is.ID_PRODUTO = p.ID_PRODUTO
            LEFT JOIN IMG_PRODUTOS img ON p.ID_PRODUTO = img.ID_PRODUTO
            WHERE s.ID_USUARIO = ?
            GROUP BY is.ID_ITEM_SACOLA, p.ID_PRODUTO
        `, [req.session.autenticado.id]);
        
        const carrinho = itensSacola.map(item => ({
            produto_id: item.ID_PRODUTO,
            nome: item.NOME_PRODUTO,
            preco: parseFloat(item.PRECO),
            quantidade: item.QUANTIDADE,
            imagem: item.URL_IMG ? '/' + item.URL_IMG : '/imagens/produto-default.png',
            cor: item.COR_PRODUTO,
            estilo: item.ESTILO_PRODUTO,
            estampa: item.ESTAMPA_PRODUTO,
            tamanho: item.TAMANHO_PRODUTO
        }));
        
        const subtotal = carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
        const frete = subtotal > 0 ? 10 : 0;
        const total = subtotal + frete;
        
        res.render('pages/carrinho', {
            carrinho: carrinho,
            subtotal: subtotal.toFixed(2),
            frete: frete.toFixed(2),
            total: total.toFixed(2),
            autenticado: req.session.autenticado
        });
    } catch (error) {
        res.render('pages/carrinho', {
            carrinho: [],
            subtotal: '0,00',
            frete: '0,00',
            total: '0,00',
            autenticado: req.session.autenticado
        });
    }
});


router.get('/brecho/:id', carregarDadosUsuario, async function(req, res){
    try {
        const { id } = req.params;
        console.log('Acessando perfil do brechó ID:', id);
        
        // Buscar dados do usuário/brechó
        const [usuario] = await pool.query(
            'SELECT * FROM USUARIOS WHERE ID_USUARIO = ? AND TIPO_USUARIO = "b"',
            [id]
        );
        
        if (usuario.length === 0) {
            console.log('Brechó não encontrado');
            return res.render('pages/perfilbrecho', {
                brecho: null,
                produtos: [],
                autenticado: req.session.autenticado || null
            });
        }
        
        // Buscar produtos do brechó
        const [produtos] = await pool.query(
            `SELECT p.*, img.URL_IMG 
             FROM PRODUTOS p 
             LEFT JOIN IMG_PRODUTOS img ON p.ID_PRODUTO = img.ID_PRODUTO
             WHERE p.ID_USUARIO = ? AND p.STATUS_PRODUTO = 'd'
             GROUP BY p.ID_PRODUTO
             ORDER BY p.DATA_CADASTRO DESC`,
            [id]
        );
        
        const brechoData = {
            ID_USUARIO: usuario[0].ID_USUARIO,
            NOME_USUARIO: usuario[0].NOME_USUARIO,
            IMG_URL: usuario[0].IMG_URL,
            DESCRICAO_USUARIO: usuario[0].DESCRICAO_USUARIO || 'Descrição não disponível',
            avaliacao: '4.5',
            itens_venda: produtos.length,
            vendidos: '0',
            seguidores: '0'
        };
        
        console.log('Dados do brechó:', brechoData);
        console.log('Produtos encontrados:', produtos.length);
        
        res.render('pages/perfilbrecho', {
            brecho: brechoData,
            produtos: produtos,
            autenticado: req.session.autenticado || null
        });
    } catch (error) {
        console.log('Erro ao carregar perfil do brechó:', error);
        res.render('pages/perfilbrecho', {
            brecho: null,
            produtos: [],
            autenticado: req.session.autenticado || null
        });
    }
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
        const { produtoModel } = require('../models/produtoModel');
        const { bannerModel } = require('../models/bannerModel');
        const produtos = await produtoModel.findRecent(8) || [];
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
            produtos: produtos || [],
            banners: banners
        });
    } catch (error) {
        console.log('Erro ao buscar dados:', error);
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
            produtos: [],
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

router.get('/blog', verificarUsuAutenticado, carregarDadosUsuario, (req, res) => res.render('pages/blog', { autenticado: req.session.autenticado }));
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

router.get('/finalizandocompra', verificarUsuAutenticado, async function(req, res){
    try {
        let produto = null;
        let subtotal = 0;
        const produtoId = req.query.produto;
        
        if (produtoId) {
            console.log('=== FINALIZANDO COMPRA - BUSCANDO PRODUTO ===');
            console.log('Produto ID recebido:', produtoId);
            
            const [produtos] = await pool.query(`
                SELECT p.ID_PRODUTO, p.NOME_PRODUTO, p.PRECO, p.DETALHES_PRODUTO,
                       p.TAMANHO_PRODUTO, p.COR_PRODUTO, p.ESTILO_PRODUTO, p.ESTAMPA_PRODUTO,
                       p.TIPO_PRODUTO, p.CONDICAO_PRODUTO,
                       u.NOME_USUARIO as VENDEDOR
                FROM PRODUTOS p 
                JOIN USUARIOS u ON p.ID_USUARIO = u.ID_USUARIO 
                WHERE p.ID_PRODUTO = ? AND p.STATUS_PRODUTO = 'd'
            `, [produtoId]);
            
            console.log('Produtos encontrados:', produtos.length);
            if (produtos.length > 0) {
                console.log('Dados do produto:', JSON.stringify(produtos[0], null, 2));
            }
            
            if (produtos.length > 0) {
                const [imagens] = await pool.query(
                    'SELECT URL_IMG FROM IMG_PRODUTOS WHERE ID_PRODUTO = ? ORDER BY ID_IMG LIMIT 1',
                    [produtoId]
                );
                
                produto = {
                    produto_id: produtos[0].ID_PRODUTO,
                    nome: produtos[0].NOME_PRODUTO,
                    preco: parseFloat(produtos[0].PRECO),
                    quantidade: 1,
                    imagem: imagens[0]?.URL_IMG ? '/' + imagens[0].URL_IMG : '/imagens/produto-default.png',
                    cor: produtos[0].COR_PRODUTO,
                    estilo: produtos[0].ESTILO_PRODUTO,
                    estampa: produtos[0].ESTAMPA_PRODUTO,
                    tamanho: produtos[0].TAMANHO_PRODUTO,
                    descricao: produtos[0].DETALHES_PRODUTO,
                    categoria: produtos[0].TIPO_PRODUTO,
                    condicao: produtos[0].CONDICAO_PRODUTO,
                    vendedor: produtos[0].VENDEDOR
                };
                
                console.log('Produto mapeado para template:', JSON.stringify(produto, null, 2));
                subtotal = produto.preco;
                
                subtotal = produto.preco;
            }
        }
        
        const frete = subtotal > 0 ? 10 : 0;
        const total = subtotal + frete;
        
        // Buscar produtos sugeridos
        const [produtosSugeridos] = await pool.query(`
            SELECT p.ID_PRODUTO, p.NOME_PRODUTO, p.PRECO, img.URL_IMG
            FROM PRODUTOS p
            LEFT JOIN IMG_PRODUTOS img ON p.ID_PRODUTO = img.ID_PRODUTO
            WHERE p.STATUS_PRODUTO = 'd' AND p.ID_PRODUTO != ?
            ORDER BY RAND()
            LIMIT 4
        `, [produtoId || 0]);
        
        const sugestoes = produtosSugeridos.map(item => ({
            ID_PRODUTO: item.ID_PRODUTO,
            NOME_PRODUTO: item.NOME_PRODUTO,
            PRECO: item.PRECO,
            imagem: item.URL_IMG ? '/' + item.URL_IMG : '/imagens/produto-default.png'
        }));
        
        res.render('pages/finalizandocompra', {
            carrinho: produto ? [produto] : [],
            produto: produto,
            produtosSugeridos: sugestoes,
            subtotal: subtotal.toFixed(2),
            frete: frete.toFixed(2),
            total: total.toFixed(2),
            autenticado: req.session.autenticado
        });
    } catch (error) {
        console.log('Erro ao carregar finalizandocompra:', error);
        res.render('pages/finalizandocompra', {
            carrinho: [],
            produto: null,
            subtotal: '0,00',
            frete: '0,00',
            total: '0,00',
            autenticado: req.session.autenticado || null
        });
    }
});

router.get('/finalizandocompra2', async function(req, res){
    try {
        console.log('=== FINALIZANDO COMPRA 2 ===');
        console.log('Sessão completa:', req.session);
        console.log('Usuário autenticado:', req.session?.autenticado);
        
        let carrinho = [];
        let subtotal = 0;
        let produtoExemplo = null;
        
        if (req.session && req.session.autenticado && req.session.autenticado.id) {
            console.log('Buscando itens da sacola para usuário:', req.session.autenticado.id);
            
            // Primeiro verificar se existe sacola
            const [sacolaExiste] = await pool.query('SELECT ID_SACOLA FROM SACOLA WHERE ID_USUARIO = ?', [req.session.autenticado.id]);
            console.log('Sacola existe:', sacolaExiste);
            
            const [itensSacola] = await pool.query(`
                SELECT 
                    is.QUANTIDADE,
                    is.VALOR_TOTAL,
                    p.ID_PRODUTO,
                    p.NOME_PRODUTO,
                    p.PRECO,
                    p.TAMANHO_PRODUTO,
                    p.COR_PRODUTO,
                    p.ESTILO_PRODUTO,
                    p.ESTAMPA_PRODUTO,
                    p.DESCRICAO_PRODUTO,
                    p.CATEGORIA_PRODUTO,
                    p.MARCA_PRODUTO,
                    p.CONDICAO_PRODUTO,
                    img.URL_IMG,
                    u.NOME_USUARIO as VENDEDOR
                FROM ITENS_SACOLA is
                JOIN SACOLA s ON is.ID_SACOLA = s.ID_SACOLA
                JOIN PRODUTOS p ON is.ID_PRODUTO = p.ID_PRODUTO
                LEFT JOIN IMG_PRODUTOS img ON p.ID_PRODUTO = img.ID_PRODUTO
                LEFT JOIN USUARIOS u ON p.ID_USUARIO = u.ID_USUARIO
                WHERE s.ID_USUARIO = ?
                GROUP BY is.ID_ITEM_SACOLA, p.ID_PRODUTO
            `, [req.session.autenticado.id]);
            console.log('Itens encontrados na sacola:', itensSacola.length);
            console.log('Dados dos itens:', JSON.stringify(itensSacola, null, 2));
            
            carrinho = itensSacola.map(item => ({
                produto_id: item.ID_PRODUTO,
                nome: item.NOME_PRODUTO,
                preco: parseFloat(item.PRECO),
                quantidade: item.QUANTIDADE,
                imagem: item.URL_IMG ? '/' + item.URL_IMG : '/imagens/produto-default.png',
                cor: item.COR_PRODUTO,
                estilo: item.ESTILO_PRODUTO,
                estampa: item.ESTAMPA_PRODUTO,
                tamanho: item.TAMANHO_PRODUTO,
                descricao: item.DESCRICAO_PRODUTO,
                categoria: item.CATEGORIA_PRODUTO,
                marca: item.MARCA_PRODUTO,
                condicao: item.CONDICAO_PRODUTO,
                vendedor: item.VENDEDOR
            }));
            console.log('Carrinho mapeado:', carrinho);
            
            subtotal = carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
        }
        
        // Se não há itens na sacola, buscar um produto exemplo do banco
        if (carrinho.length === 0) {
            try {
                const [produtosBanco] = await pool.query(`
                    SELECT 
                        p.ID_PRODUTO,
                        p.NOME_PRODUTO,
                        p.PRECO,
                        p.COR_PRODUTO,
                        p.ESTILO_PRODUTO,
                        p.ESTAMPA_PRODUTO,
                        p.DESCRICAO_PRODUTO,
                        p.TAMANHO_PRODUTO,
                        p.MARCA_PRODUTO,
                        p.CONDICAO_PRODUTO,
                        img.URL_IMG,
                        u.NOME_USUARIO as VENDEDOR
                    FROM PRODUTOS p
                    LEFT JOIN IMG_PRODUTOS img ON p.ID_PRODUTO = img.ID_PRODUTO
                    LEFT JOIN USUARIOS u ON p.ID_USUARIO = u.ID_USUARIO
                    WHERE p.STATUS_PRODUTO = 'd'
                    ORDER BY p.ID_PRODUTO DESC
                    LIMIT 1
                `);
                
                if (produtosBanco.length > 0) {
                    const produto = produtosBanco[0];
                    produtoExemplo = {
                        id: produto.ID_PRODUTO,
                        nome: produto.NOME_PRODUTO,
                        preco: parseFloat(produto.PRECO).toFixed(2),
                        cor: produto.COR_PRODUTO,
                        estilo: produto.ESTILO_PRODUTO,
                        estampa: produto.ESTAMPA_PRODUTO,
                        descricao: produto.DESCRICAO_PRODUTO,
                        tamanho: produto.TAMANHO_PRODUTO,
                        marca: produto.MARCA_PRODUTO,
                        condicao: produto.CONDICAO_PRODUTO,
                        vendedor: produto.VENDEDOR,
                        imagem: produto.URL_IMG ? '/' + produto.URL_IMG : '/imagens/produto-default.png'
                    };
                    subtotal = parseFloat(produto.PRECO);
                }
            } catch (error) {
                console.log('Erro ao buscar produto exemplo:', error);
            }
        }
        
        const frete = subtotal > 0 ? 10 : 0;
        const total = subtotal + frete;
        
        console.log('Dados finais enviados para o template:');
        console.log('- Carrinho:', JSON.stringify(carrinho, null, 2));
        console.log('- Produto Exemplo:', produtoExemplo);
        console.log('- Subtotal:', subtotal.toFixed(2));
        console.log('- Frete:', frete.toFixed(2));
        console.log('- Total:', total.toFixed(2));
        
        res.render('pages/finalizandocompra2', {
            carrinho: carrinho,
            produtoExemplo: produtoExemplo,
            subtotal: subtotal.toFixed(2),
            frete: frete.toFixed(2),
            total: total.toFixed(2),
            autenticado: req.session.autenticado || { autenticado: false }
        });
    } catch (error) {
        console.log('Erro ao carregar finalizandocompra2:', error);
        res.render('pages/finalizandocompra2', {
            carrinho: [],
            produtoExemplo: null,
            subtotal: '0,00',
            frete: '0,00',
            total: '0,00',
            autenticado: req.session.autenticado || { autenticado: false }
        });
    }
});

router.get('/finalizandopagamento', verificarUsuAutenticado, async function(req, res){
    try {
        let produto = null;
        let subtotal = 0;
        const produtoId = req.query.produto;
        
        if (produtoId) {
            const [produtos] = await pool.query(`
                SELECT p.*, u.NOME_USUARIO as VENDEDOR
                FROM PRODUTOS p 
                JOIN USUARIOS u ON p.ID_USUARIO = u.ID_USUARIO 
                WHERE p.ID_PRODUTO = ? AND p.STATUS_PRODUTO = 'd'
            `, [produtoId]);
            
            if (produtos.length > 0) {
                const [imagens] = await pool.query(
                    'SELECT URL_IMG FROM IMG_PRODUTOS WHERE ID_PRODUTO = ? ORDER BY ID_IMG LIMIT 1',
                    [produtoId]
                );
                
                produto = {
                    produto_id: produtos[0].ID_PRODUTO,
                    nome: produtos[0].NOME_PRODUTO,
                    preco: parseFloat(produtos[0].PRECO),
                    quantidade: 1,
                    imagem: imagens[0]?.URL_IMG ? '/' + imagens[0].URL_IMG : '/imagens/produto-default.png',
                    cor: produtos[0].COR_PRODUTO,
                    estilo: produtos[0].ESTILO_PRODUTO,
                    estampa: produtos[0].ESTAMPA_PRODUTO,
                    tamanho: produtos[0].TAMANHO_PRODUTO,
                    descricao: produtos[0].DETALHES_PRODUTO || produtos[0].DESCRICAO_PRODUTO,
                    categoria: produtos[0].TIPO_PRODUTO,
                    condicao: produtos[0].CONDICAO_PRODUTO,
                    vendedor: produtos[0].VENDEDOR
                };
                
                subtotal = produto.preco;
            }
        }
        
        const frete = subtotal > 0 ? 10 : 0;
        const total = subtotal + frete;
        
        res.render('pages/finalizandopagamento', {
            produto: produto,
            subtotal: subtotal.toFixed(2),
            frete: frete.toFixed(2),
            total: total.toFixed(2),
            autenticado: req.session.autenticado
        });
    } catch (error) {
        console.log('Erro ao carregar finalizandopagamento:', error);
        res.render('pages/finalizandopagamento', {
            produto: null,
            subtotal: '0,00',
            frete: '0,00',
            total: '0,00',
            autenticado: req.session.autenticado || null
        });
    }
});

router.post('/atualizar-quantidade-sacola', verificarUsuAutenticado, async function(req, res){
    try {
        const { produto_id, quantidade } = req.body;
        const userId = req.session.autenticado.id;
        
        if (quantidade <= 0) {
            return res.json({ success: false, message: 'Quantidade deve ser maior que zero' });
        }
        
        // Buscar preço do produto
        const [produto] = await pool.query('SELECT PRECO FROM PRODUTOS WHERE ID_PRODUTO = ?', [produto_id]);
        if (produto.length === 0) {
            return res.json({ success: false, message: 'Produto não encontrado' });
        }
        
        const preco = parseFloat(produto[0].PRECO);
        const valorTotal = preco * quantidade;
        
        // Atualizar quantidade na sacola
        await pool.query(`
            UPDATE ITENS_SACOLA is
            JOIN SACOLA s ON is.ID_SACOLA = s.ID_SACOLA
            SET is.QUANTIDADE = ?, is.VALOR_TOTAL = ?
            WHERE s.ID_USUARIO = ? AND is.ID_PRODUTO = ?
        `, [quantidade, valorTotal, userId, produto_id]);
        
        res.json({ success: true, message: 'Quantidade atualizada' });
    } catch (error) {
        console.log('Erro ao atualizar quantidade:', error);
        res.json({ success: false, message: 'Erro interno' });
    }
});


router.post('/remover-item-sacola', verificarUsuAutenticado, async function(req, res){
    try {
        const { produto_id } = req.body;
        const userId = req.session.autenticado.id;
        
        await pool.query(`
            DELETE is FROM ITENS_SACOLA is
            JOIN SACOLA s ON is.ID_SACOLA = s.ID_SACOLA
            WHERE s.ID_USUARIO = ? AND is.ID_PRODUTO = ?
        `, [userId, produto_id]);
        
        res.json({ success: true, message: 'Item removido' });
    } catch (error) {
        console.log('Erro ao remover item:', error);
        res.json({ success: false, message: 'Erro interno' });
    }
});

router.get('/finalizandocompra2', async function(req, res){
    try {
        console.log('=== FINALIZANDO COMPRA 2 ===');
        console.log('Sessão completa:', req.session);
        console.log('Usuário autenticado:', req.session?.autenticado);
        
        let carrinho = [];
        let subtotal = 0;
        let produtoExemplo = null;
        
        if (req.session && req.session.autenticado && req.session.autenticado.id) {
            console.log('Buscando itens da sacola para usuário:', req.session.autenticado.id);
            
            // Primeiro verificar se existe sacola
            const [sacolaExiste] = await pool.query('SELECT ID_SACOLA FROM SACOLA WHERE ID_USUARIO = ?', [req.session.autenticado.id]);
            console.log('Sacola existe:', sacolaExiste);
            
            const [itensSacola] = await pool.query(`
                SELECT 
                    is.QUANTIDADE,
                    is.VALOR_TOTAL,
                    p.ID_PRODUTO,
                    p.NOME_PRODUTO,
                    p.PRECO,
                    p.TAMANHO_PRODUTO,
                    p.COR_PRODUTO,
                    p.ESTILO_PRODUTO,
                    p.ESTAMPA_PRODUTO,
                    p.DESCRICAO_PRODUTO,
                    p.CATEGORIA_PRODUTO,
                    p.MARCA_PRODUTO,
                    p.CONDICAO_PRODUTO,
                    img.URL_IMG,
                    u.NOME_USUARIO as VENDEDOR
                FROM ITENS_SACOLA is
                JOIN SACOLA s ON is.ID_SACOLA = s.ID_SACOLA
                JOIN PRODUTOS p ON is.ID_PRODUTO = p.ID_PRODUTO
                LEFT JOIN IMG_PRODUTOS img ON p.ID_PRODUTO = img.ID_PRODUTO
                LEFT JOIN USUARIOS u ON p.ID_USUARIO = u.ID_USUARIO
                WHERE s.ID_USUARIO = ?
                GROUP BY is.ID_ITEM_SACOLA, p.ID_PRODUTO
            `, [req.session.autenticado.id]);
            console.log('Itens encontrados na sacola:', itensSacola.length);
            console.log('Dados dos itens:', JSON.stringify(itensSacola, null, 2));
            
            carrinho = itensSacola.map(item => ({
                produto_id: item.ID_PRODUTO,
                nome: item.NOME_PRODUTO,
                preco: parseFloat(item.PRECO),
                quantidade: item.QUANTIDADE,
                imagem: item.URL_IMG ? '/' + item.URL_IMG : '/imagens/produto-default.png',
                cor: item.COR_PRODUTO,
                estilo: item.ESTILO_PRODUTO,
                estampa: item.ESTAMPA_PRODUTO,
                tamanho: item.TAMANHO_PRODUTO,
                descricao: item.DESCRICAO_PRODUTO,
                categoria: item.CATEGORIA_PRODUTO,
                marca: item.MARCA_PRODUTO,
                condicao: item.CONDICAO_PRODUTO,
                vendedor: item.VENDEDOR
            }));
            console.log('Carrinho mapeado:', carrinho);
            
            subtotal = carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
        }
        
        // Se não há itens na sacola, buscar um produto exemplo do banco
        if (carrinho.length === 0) {
            try {
                const [produtosBanco] = await pool.query(`
                    SELECT 
                        p.ID_PRODUTO,
                        p.NOME_PRODUTO,
                        p.PRECO,
                        p.COR_PRODUTO,
                        p.ESTILO_PRODUTO,
                        p.ESTAMPA_PRODUTO,
                        p.DESCRICAO_PRODUTO,
                        p.TAMANHO_PRODUTO,
                        p.MARCA_PRODUTO,
                        p.CONDICAO_PRODUTO,
                        img.URL_IMG,
                        u.NOME_USUARIO as VENDEDOR
                    FROM PRODUTOS p
                    LEFT JOIN IMG_PRODUTOS img ON p.ID_PRODUTO = img.ID_PRODUTO
                    LEFT JOIN USUARIOS u ON p.ID_USUARIO = u.ID_USUARIO
                    WHERE p.STATUS_PRODUTO = 'd'
                    ORDER BY p.ID_PRODUTO DESC
                    LIMIT 1
                `);
                
                if (produtosBanco.length > 0) {
                    const produto = produtosBanco[0];
                    produtoExemplo = {
                        id: produto.ID_PRODUTO,
                        nome: produto.NOME_PRODUTO,
                        preco: parseFloat(produto.PRECO).toFixed(2),
                        cor: produto.COR_PRODUTO,
                        estilo: produto.ESTILO_PRODUTO,
                        estampa: produto.ESTAMPA_PRODUTO,
                        descricao: produto.DESCRICAO_PRODUTO,
                        tamanho: produto.TAMANHO_PRODUTO,
                        marca: produto.MARCA_PRODUTO,
                        condicao: produto.CONDICAO_PRODUTO,
                        vendedor: produto.VENDEDOR,
                        imagem: produto.URL_IMG ? '/' + produto.URL_IMG : '/imagens/produto-default.png'
                    };
                    subtotal = parseFloat(produto.PRECO);
                }
            } catch (error) {
                console.log('Erro ao buscar produto exemplo:', error);
            }
        }
        
        const frete = subtotal > 0 ? 10 : 0;
        const total = subtotal + frete;
        
        console.log('Dados finais enviados para o template:');
        console.log('- Carrinho:', JSON.stringify(carrinho, null, 2));
        console.log('- Produto Exemplo:', produtoExemplo);
        console.log('- Subtotal:', subtotal.toFixed(2));
        console.log('- Frete:', frete.toFixed(2));
        console.log('- Total:', total.toFixed(2));
        
        res.render('pages/finalizandocompra2', {
            carrinho: carrinho,
            produtoExemplo: produtoExemplo,
            subtotal: subtotal.toFixed(2),
            frete: frete.toFixed(2),
            total: total.toFixed(2),
            autenticado: req.session.autenticado || { autenticado: false }
        });
    } catch (error) {
        console.log('Erro ao carregar finalizandocompra2:', error);
        res.render('pages/finalizandocompra2', {
            carrinho: [],
            produtoExemplo: null,
            subtotal: '0,00',
            frete: '0,00',
            total: '0,00',
            autenticado: req.session.autenticado || { autenticado: false }
        });
    }
});
router.get('/favoritos', verificarUsuAutenticado, carregarDadosUsuario, async function(req, res){
    try {
        let favoritosList = [];
        const [favoritos] = await pool.query(`
            SELECT p.ID_PRODUTO, p.NOME_PRODUTO, p.PRECO as PRECO_PRODUTO, p.COR_PRODUTO, p.ESTILO_PRODUTO, 
                   p.ESTAMPA_PRODUTO, p.TIPO_PRODUTO, img.URL_IMG as IMG_PRODUTO_1
            FROM FAVORITOS f 
            JOIN PRODUTOS p ON f.ID_ITEM = p.ID_PRODUTO
            LEFT JOIN IMG_PRODUTOS img ON p.ID_PRODUTO = img.ID_PRODUTO
            WHERE f.ID_USUARIO = ? AND f.STATUS_FAVORITO = 'favoritado' AND f.TIPO_ITEM = 'produto'
            GROUP BY p.ID_PRODUTO
        `, [req.session.autenticado.id]);
        favoritosList = favoritos;
        
        res.render('pages/favoritos', {
            favoritos: favoritosList,
            autenticado: req.session.autenticado
        });
    } catch (error) {
        res.render('pages/favoritos', {
            favoritos: [],
            autenticado: req.session.autenticado
        });
    }
});
router.get('/sacola1', carregarDadosUsuario, async function(req, res){
    try {
        let carrinho = [];
        let subtotal = 0;
        
        if (req.session && req.session.autenticado && req.session.autenticado.id) {
            const [itensSacola] = await pool.query(`
                SELECT 
                    is.QUANTIDADE,
                    is.VALOR_TOTAL,
                    p.ID_PRODUTO,
                    p.NOME_PRODUTO,
                    p.PRECO,
                    p.TAMANHO_PRODUTO,
                    p.COR_PRODUTO,
                    p.ESTILO_PRODUTO,
                    p.ESTAMPA_PRODUTO,
                    img.URL_IMG
                FROM ITENS_SACOLA is
                JOIN SACOLA s ON is.ID_SACOLA = s.ID_SACOLA
                JOIN PRODUTOS p ON is.ID_PRODUTO = p.ID_PRODUTO
                LEFT JOIN IMG_PRODUTOS img ON p.ID_PRODUTO = img.ID_PRODUTO
                WHERE s.ID_USUARIO = ?
                GROUP BY is.ID_ITEM_SACOLA, p.ID_PRODUTO
            `, [req.session.autenticado.id]);
            
            carrinho = itensSacola.map(item => ({
                produto_id: item.ID_PRODUTO,
                nome: item.NOME_PRODUTO,
                preco: parseFloat(item.PRECO),
                quantidade: item.QUANTIDADE,
                imagem: item.URL_IMG ? '/' + item.URL_IMG : '/imagens/produto-default.png',
                cor: item.COR_PRODUTO,
                estilo: item.ESTILO_PRODUTO,
                estampa: item.ESTAMPA_PRODUTO,
                tamanho: item.TAMANHO_PRODUTO
            }));
            
            subtotal = carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
        }
        
        const frete = subtotal > 0 ? 10 : 0;
        const total = subtotal + frete;
        
        res.render('pages/sacola1', {
            carrinho: carrinho,
            subtotal: subtotal.toFixed(2),
            frete: frete.toFixed(2),
            total: total.toFixed(2),
            autenticado: req.session.autenticado || null
        });
    } catch (error) {
        console.log('Erro ao carregar sacola1:', error);
        res.render('pages/sacola1', {
            carrinho: [],
            subtotal: '0,00',
            frete: '0,00',
            total: '0,00',
            autenticado: req.session.autenticado || null
        });
    }
});
router.get('/avaliasao', (req, res) => res.render('pages/avaliasao'));

router.get('/perfilvender', carregarDadosUsuario, async function(req, res){
    try {
        let userData = {
            nome: 'Usuário',
            email: 'email@exemplo.com',
            telefone: '(11) 99999-9999',
            imagem: null,
            user_usuario: 'usuario',
            compras: 0,
            favoritos: 0,
            avaliacoes: 0,
            itens_venda: 0,
            vendidos: 0,
            seguidores: 0
        };
        
        let produtos = [];
        
        if (req.session && req.session.autenticado && req.session.autenticado.id) {
            const userDetails = await usuarioModel.findId(req.session.autenticado.id);
            
            if (userDetails && userDetails.length > 0) {
                const user = userDetails[0];
                userData.nome = user.NOME_USUARIO || 'Usuário';
                userData.email = user.EMAIL_USUARIO || 'email@exemplo.com';
                userData.telefone = user.CELULAR_USUARIO || '(11) 99999-9999';
                userData.imagem = user.IMG_URL || null;
                userData.user_usuario = user.USER_USUARIO || 'usuario';
            }
            
            // Buscar produtos do usuário
            console.log('Buscando produtos para usuário ID:', req.session.autenticado.id);
            const [produtosUsuario] = await pool.query(`
                SELECT p.*, 
                       COALESCE(img.URL_IMG, CONCAT('imagem/produtos/', p.ID_PRODUTO, '.jpg')) as URL_IMG
                FROM PRODUTOS p
                LEFT JOIN IMG_PRODUTOS img ON p.ID_PRODUTO = img.ID_PRODUTO
                WHERE p.ID_USUARIO = ?
                GROUP BY p.ID_PRODUTO
                ORDER BY p.ID_PRODUTO DESC
            `, [req.session.autenticado.id]);
            
            console.log('Produtos encontrados:', produtosUsuario.length);
            if (produtosUsuario.length > 0) {
                console.log('Primeiro produto:', JSON.stringify(produtosUsuario[0], null, 2));
            }
            produtos = produtosUsuario;
            userData.itens_venda = produtos.length;
        }
        
        const brechoData = {
            nome: userData.nome,
            imagem: userData.imagem,
            avaliacao: '0.0',
            itens_venda: userData.itens_venda,
            vendidos: userData.vendidos,
            seguidores: userData.seguidores
        };
        
        res.render('pages/perfilvender', {
            brecho: brechoData,
            usuario: userData,
            produtos: produtos,
            autenticado: req.session.autenticado
        });
    } catch (error) {
        console.log('Erro ao carregar perfil vendedor:', error);
        res.render('pages/perfilvender', {
            brecho: {
                nome: 'Nome do Brechó',
                imagem: null,
                avaliacao: '0.0',
                itens_venda: 0,
                vendidos: 0,
                seguidores: 0
            },
            usuario: {
                nome: 'Usuário',
                email: 'email@exemplo.com',
                telefone: '(11) 99999-9999',
                imagem: null,
                compras: 0,
                favoritos: 0,
                avaliacoes: 0
            },
            produtos: [],
            autenticado: req.session.autenticado
        });
    }
})

router.get('/perfilvendedor', carregarDadosUsuario, async function(req, res){
    try {
        let userData = {
            nome: 'Usuário',
            email: 'email@exemplo.com',
            telefone: '',
            imagem: null,
            user_usuario: 'usuario',
            cep: '',
            logradouro: '',
            numero: '',
            bairro: '',
            cidade: '',
            uf: '',
            cnpj: '',
            razao_social: '',
            nome_fantasia: '',
            descricao: ''
        };
        
        if (req.session && req.session.autenticado && req.session.autenticado.id) {
            try {
                const userDetails = await usuarioModel.findId(req.session.autenticado.id);
                if (userDetails && userDetails.length > 0) {
                    const user = userDetails[0];
                    userData.nome = user.NOME_USUARIO || 'Usuário';
                    userData.email = user.EMAIL_USUARIO || 'email@exemplo.com';
                    userData.telefone = user.CELULAR_USUARIO || '';
                    userData.imagem = user.IMG_URL || null;
                    userData.user_usuario = user.USER_USUARIO || 'usuario';
                    userData.cep = user.CEP_USUARIO || '';
                    userData.logradouro = user.LOGRADOURO_USUARIO || '';
                    userData.numero = user.NUMERO_USUARIO || '';
                    userData.bairro = user.BAIRRO_USUARIO || '';
                    userData.cidade = user.CIDADE_USUARIO || '';
                    userData.uf = user.UF_USUARIO || '';
                    userData.descricao = user.DESCRICAO_USUARIO || '';
                }
                
                // Buscar dados do brechó se existir
                const [brechos] = await pool.query(
                    'SELECT * FROM BRECHOS WHERE ID_USUARIO = ?',
                    [req.session.autenticado.id]
                );
                if (brechos.length > 0) {
                    const brecho = brechos[0];
                    userData.cnpj = brecho.CNPJ_BRECHO || '';
                    userData.razao_social = brecho.RAZAO_SOCIAL || '';
                    userData.nome_fantasia = brecho.NOME_FANTASIA || '';
                }
            } catch (error) {
                console.log('Erro ao buscar dados do usuário:', error);
            }
        }
        
        res.render('pages/perfilvendedor', {
            autenticado: req.session.autenticado || null,
            usuario: userData
        });
    } catch (error) {
        console.log('Erro ao carregar perfilvendedor:', error);
        res.render('pages/perfilvendedor', {
            autenticado: req.session.autenticado || null,
            usuario: {
                nome: 'Usuário',
                email: 'email@exemplo.com',
                telefone: '',
                imagem: null,
                user_usuario: 'usuario',
                cep: '',
                logradouro: '',
                numero: '',
                bairro: '',
                cidade: '',
                uf: '',
                cnpj: '',
                razao_social: '',
                nome_fantasia: '',
                descricao: ''
            }
        });
    }
});

router.get('/criarbrecho', carregarDadosUsuario, brechoController.mostrarFormulario);

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
        const resultado = await usuarioController.autenticarUsuario(email_usu, senha_usu);
        
        if (resultado.success) {
            const usuario = resultado.usuario;
            req.session.autenticado = {
                autenticado: usuario.NOME_USUARIO,
                id: usuario.ID_USUARIO,
                tipo: usuario.TIPO_USUARIO,
                nome: usuario.NOME_USUARIO,
                email: usuario.EMAIL_USUARIO
            };
            
            console.log('Sessão criada na página entrar:', req.session.autenticado);
            
            if (usuario.TIPO_USUARIO == 'b') {
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
                    mensagem: 'Usuário ou senha inválidos!',
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
            
            res.redirect(`/verificarsenha?email=${encodeURIComponent(email_usu)}`);
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

router.get('/verificarsenha', function(req, res){
    res.render('pages/verificarsenha', {
        email_usu: req.query.email || '',
        dadosNotificacao: req.query.email ? {
            mensagem: 'Código de verificação enviado para seu e-mail!',
            tipo: 'success'
        } : null,
        avisoErro: {}
    });
});

router.post('/verificarsenha', function(req, res){
    const { email_usu, codigo } = req.body;
    
    if (!req.session.codigoRecuperacao) {
        return res.render('pages/verificarsenha', {
            email_usu: email_usu,
            dadosNotificacao: {
                mensagem: 'Sessão expirada. Solicite um novo código.',
                tipo: 'error'
            },
            avisoErro: {}
        });
    }
    
    const { email: emailSessao, codigo: codigoSessao, expira } = req.session.codigoRecuperacao;
    
    if (Date.now() > expira) {
        delete req.session.codigoRecuperacao;
        return res.render('pages/verificarsenha', {
            email_usu: email_usu,
            dadosNotificacao: {
                mensagem: 'Código expirado. Solicite um novo código.',
                tipo: 'error'
            },
            avisoErro: {}
        });
    }
    
    if (email_usu !== emailSessao || codigo !== codigoSessao) {
        return res.render('pages/verificarsenha', {
            email_usu: email_usu,
            dadosNotificacao: {
                mensagem: 'Código inválido',
                tipo: 'error'
            },
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

router.get('/estatistica', carregarDadosUsuario, async (req, res) => {
    try {
        let estatisticas = {
            brecho: { NOME_BRECHO: 'Meu Brechó', IMAGEM_BRECHO: null },
            totalProdutos: 0,
            totalVendas: 0,
            receitaTotal: 0,
            totalVisualizacoes: 0,
            taxaConversao: 0,
            vendasCategoria: [],
            produtosMaisVendidos: [],
            vendasRecentes: [],
            produtosPorCategoria: {},
            receitaPorCategoria: {},
            produtosDetalhes: []
        };
        
        if (req.session.autenticado && req.session.autenticado.id) {
            const userId = req.session.autenticado.id;
            
            // Buscar produtos do usuário
            const [produtos] = await pool.query(
                'SELECT COUNT(*) as total FROM PRODUTOS WHERE ID_USUARIO = ?',
                [userId]
            );
            
            // Buscar produtos por categoria
            const [produtosCategorias] = await pool.query(
                `SELECT TIPO_PRODUTO, COUNT(*) as quantidade, 
                        AVG(PRECO) as preco_medio, SUM(PRECO) as receita_total
                 FROM PRODUTOS WHERE ID_USUARIO = ? 
                 GROUP BY TIPO_PRODUTO`,
                [userId]
            );
            
            // Buscar detalhes dos produtos
            const [produtosDetalhes] = await pool.query(
                `SELECT NOME_PRODUTO, PRECO, TIPO_PRODUTO, 
                        DATE(DATA_CADASTRO) as data_cadastro
                 FROM PRODUTOS WHERE ID_USUARIO = ? 
                 ORDER BY DATA_CADASTRO DESC LIMIT 10`,
                [userId]
            );
            
            estatisticas.totalProdutos = produtos[0]?.total || 0;
            estatisticas.brecho.NOME_BRECHO = req.session.autenticado.nome + ' Brechó';
            estatisticas.produtosDetalhes = produtosDetalhes;
            
            // Processar dados por categoria
            let totalReceita = 0;
            produtosCategorias.forEach(cat => {
                totalReceita += parseFloat(cat.receita_total || 0);
                estatisticas.produtosPorCategoria[cat.TIPO_PRODUTO] = cat.quantidade;
                estatisticas.receitaPorCategoria[cat.TIPO_PRODUTO] = parseFloat(cat.receita_total || 0);
            });
            
            estatisticas.receitaTotal = totalReceita;
            estatisticas.totalVisualizacoes = estatisticas.totalProdutos;
            estatisticas.totalVendas = 0;
            estatisticas.taxaConversao = estatisticas.totalVisualizacoes > 0 
                ? ((estatisticas.totalVendas / estatisticas.totalVisualizacoes) * 100).toFixed(1)
                : 0;
            
            estatisticas.vendasCategoria = produtosCategorias.map(cat => ({
                categoria: cat.TIPO_PRODUTO || 'Outros',
                quantidade: cat.quantidade,
                receita: parseFloat(cat.receita_total || 0)
            }));
        }
        
        res.render('pages/estatistica', { autenticado: req.session.autenticado, estatisticas });
    } catch (error) {
        console.log('Erro ao carregar estatísticas:', error);
        const estatisticas = {
            brecho: { NOME_BRECHO: 'Meu Brechó', IMAGEM_BRECHO: null },
            totalProdutos: 0,
            totalVendas: 0,
            receitaTotal: 0,
            totalVisualizacoes: 0,
            taxaConversao: 0,
            vendasCategoria: [],
            produtosMaisVendidos: [],
            vendasRecentes: [],
            produtosPorCategoria: {},
            receitaPorCategoria: {},
            produtosDetalhes: []
        };
        res.render('pages/estatistica', { autenticado: req.session.autenticado, estatisticas });
    }
});

router.get('/estatisticaadm', async (req, res) => {
    try {
        // Buscar estatísticas gerais da plataforma
        const [totalUsuarios] = await pool.query('SELECT COUNT(*) as total FROM USUARIOS');
        const [totalBrechos] = await pool.query('SELECT COUNT(*) as total FROM BRECHOS');
        const [totalProdutos] = await pool.query('SELECT COUNT(*) as total FROM PRODUTOS');
        const [totalVendas] = await pool.query('SELECT COUNT(*) as total FROM PEDIDOS WHERE STATUS_PEDIDO = "finalizado"');
        const [receitaTotal] = await pool.query('SELECT SUM(VALOR_TOTAL) as receita FROM PEDIDOS WHERE STATUS_PEDIDO = "finalizado"');
        const [denunciasPendentes] = await pool.query('SELECT COUNT(*) as total FROM DENUNCIAS WHERE STATUS_DENUNCIA = "pendente"');
        
        const estatisticas = {
            totalUsuarios: totalUsuarios[0]?.total || 0,
            totalBrechos: totalBrechos[0]?.total || 0,
            totalProdutos: totalProdutos[0]?.total || 0,
            totalVendas: totalVendas[0]?.total || 0,
            receitaTotal: receitaTotal[0]?.receita || 0,
            denunciasPendentes: denunciasPendentes[0]?.total || 0
        };
        
        res.render('pages/estatisticaadm', { estatisticas });
    } catch (error) {
        console.log('Erro ao carregar estatísticas admin:', error);
        const estatisticas = {
            totalUsuarios: 0,
            totalBrechos: 0,
            totalProdutos: 0,
            totalVendas: 0,
            receitaTotal: 0,
            denunciasPendentes: 0
        };
        res.render('pages/estatisticaadm', { estatisticas });
    }
});
router.get('/estatistica-mobile', (req, res) => res.render('pages/estatistica-mobile'));
router.get('/estatistica-desktop', (req, res) => res.render('pages/estatistica-desktop'));

router.get('/categorias', carregarDadosUsuario, async function(req, res){
    try {
        const [produtos] = await pool.query(`
            SELECT p.ID_PRODUTO, p.NOME_PRODUTO, p.PRECO, p.TIPO_PRODUTO, 
                   p.TAMANHO_PRODUTO, p.COR_PRODUTO, p.CONDICAO_PRODUTO,
                   p.ESTAMPA_PRODUTO, p.QUANTIDADE_ESTOQUE,
                   img.URL_IMG,
                   u.NOME_USUARIO as VENDEDOR
            FROM PRODUTOS p 
            LEFT JOIN IMG_PRODUTOS img ON p.ID_PRODUTO = img.ID_PRODUTO
            LEFT JOIN USUARIOS u ON p.ID_USUARIO = u.ID_USUARIO
            WHERE p.STATUS_PRODUTO = 'd'
            GROUP BY p.ID_PRODUTO
            ORDER BY p.DATA_CADASTRO DESC
        `);
        
        res.render('pages/categorias', {
            autenticado: req.session.autenticado || null,
            produtos: produtos || []
        });
    } catch (error) {
        console.log('Erro ao buscar produtos para categorias:', error);
        res.render('pages/categorias', {
            autenticado: req.session.autenticado || null,
            produtos: []
        });
    }
});
router.get('/categorias/filtrar/:categoryId', categoriaController.filtrarProdutos);

router.get('/editarbanners', bannerController.mostrarFormulario);
router.post('/editarbanners', 
    multer({
        storage: multer.diskStorage({
            destination: './app/public/imagem/banners/',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
            }
        }),
        limits: { fileSize: 10 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
            const allowedExtensions = /jpeg|jpg|png/;
            const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
            const mimetype = allowedExtensions.test(file.mimetype);
            if (extname && mimetype) {
                cb(null, true);
            } else {
                cb(new Error('Apenas arquivos de imagem são permitidos!'));
            }
        }
    }).fields([
        { name: 'banner_desk_1', maxCount: 1 },
        { name: 'banner_desk_2', maxCount: 1 },
        { name: 'banner_desk_3', maxCount: 1 },
        { name: 'banner_mobile_1', maxCount: 1 },
        { name: 'banner_mobile_2', maxCount: 1 },
        { name: 'banner_mobile_3', maxCount: 1 }
    ]), 
    bannerController.atualizarBanners);
router.get('/minhascompras', (req, res) => res.render('pages/minhascompras'));
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
            compras: 0,
            favoritos: 0,
            avaliacoes: 0,
            cep: '',
            logradouro: '',
            numero: '',
            bairro: '',
            cidade: '',
            uf: '',
            cnpj: '',
            razao_social: '',
            nome_fantasia: ''
        };
        
        let favoritosList = [];
        
        if (req.session && req.session.autenticado && req.session.autenticado.id) {
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
                
                // Buscar dados do brechó se for vendedor
                if (user.TIPO_USUARIO === 'b') {
                    try {
                        const [brechos] = await pool.query(
                            'SELECT * FROM BRECHOS WHERE ID_USUARIO = ?',
                            [req.session.autenticado.id]
                        );
                        if (brechos.length > 0) {
                            const brecho = brechos[0];
                            userData.cnpj = brecho.CNPJ_BRECHO || '';
                            userData.razao_social = brecho.RAZAO_SOCIAL || '';
                            userData.nome_fantasia = brecho.NOME_FANTASIA || '';
                        }
                    } catch (error) {
                        console.log('Erro ao buscar dados do brechó:', error);
                    }
                }
                
                // Buscar favoritos reais do banco
                try {
                    const [favoritos] = await pool.query(
                        'SELECT * FROM FAVORITOS WHERE ID_USUARIO = ? AND STATUS_FAVORITO = "favoritado"',
                        [req.session.autenticado.id]
                    );
                    favoritosList = favoritos;
                    userData.favoritos = favoritos.length;
                } catch (error) {
                    console.log('Erro ao buscar favoritos:', error);
                }
            }
        }
        
        res.render('pages/informacao', {
            autenticado: req.session ? req.session.autenticado : null,
            usuario: userData,
            favoritos: favoritosList
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
                compras: 0,
                favoritos: 0,
                avaliacoes: 0
            },
            favoritos: []
        });
    }
});
router.get('/menufavoritos', (req, res) => res.render('pages/menufavoritos'));
router.get('/menucompras', carregarDadosUsuario, (req, res) => {
    res.render('pages/menucompras', {
        autenticado: req.session.autenticado || null,
        pedidos: []
    });
});
router.get('/planos', carregarDadosUsuario, (req, res) => res.render('pages/planos', { autenticado: req.session.autenticado || null }));

router.post('/perfilcliente/foto', uploadFile('profile-photo'), async function(req, res){
    try {
        console.log('Rota /perfilcliente/foto chamada');
        console.log('Arquivo recebido:', req.file);
        console.log('Sessão:', req.session?.autenticado);
        
        if (req.session && req.session.autenticado && req.session.autenticado.id && req.file) {
            const imagePath = 'imagem/perfil/' + req.file.filename;
            const dadosUsuario = {
                IMG_URL: imagePath
            };
            
            console.log('Atualizando usuário com:', dadosUsuario);
            await usuarioModel.update(dadosUsuario, req.session.autenticado.id);
            req.session.autenticado.imagem = imagePath;
            
            console.log('Upload realizado com sucesso:', imagePath);
            res.json({
                success: true,
                imagePath: imagePath
            });
        } else {
            console.log('Falha na validação:', {
                session: !!req.session,
                autenticado: !!req.session?.autenticado,
                id: req.session?.autenticado?.id,
                file: !!req.file
            });
            res.json({ success: false, error: 'Arquivo não enviado ou usuário não autenticado' });
        }
    } catch (error) {
        console.log('Erro ao salvar foto:', error);
        res.json({ success: false, error: 'Erro ao fazer upload da foto: ' + error.message });
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

router.get('/menuadm', (req, res) => res.render('pages/menuadm'));
router.get('/usuariosadm', (req, res) => res.render('pages/usuariosadm'));
router.get('/brechosadm', (req, res) => res.render('pages/brechosadm'));
router.get('/produtosadm', (req, res) => res.render('pages/produtosadm'));
router.get('/pedidosadm', (req, res) => res.render('pages/pedidosadm'));
router.get('/relatorioadm', (req, res) => res.render('pages/relatorioadm'));
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


router.post('/adicionar-carrinho', compraController.adicionarAoCarrinho);
router.get('/carrinho', compraController.mostrarCarrinho);
router.post('/atualizar-quantidade', compraController.atualizarQuantidade);
router.post('/remover-item', compraController.removerItem);
router.get('/finalizar-compra', compraController.finalizarCompra);
router.post('/limpar-carrinho', compraController.limparCarrinho);
router.get('/confirmar-pedido', compraController.confirmarPedido);


router.post('/processar-pagamento', pagamentoController.processarPagamento);
router.get('/pagamento-sucesso', pagamentoController.pagamentoSucesso);
router.get('/pagamento-falha', pagamentoController.pagamentoFalha);
router.get('/pagamento-pendente', pagamentoController.pagamentoPendente);

router.post('/webhook-mercadopago', pagamentoController.webhookMercadoPago);


router.post('/adicionar-sacola', verificarUsuAutenticado, async function(req, res){
    console.log('=== ADICIONAR À SACOLA ===');
    console.log('Body recebido:', req.body);
    console.log('Usuário autenticado:', req.session.autenticado);
    console.log('Headers:', req.headers);
    
    try {
        const { produto_id } = req.body;
        
        if (!produto_id) {
            console.log('Produto ID não fornecido');
            return res.json({ success: false, message: 'ID do produto é obrigatório' });
        }
        
        const userId = req.session.autenticado.id;
        console.log('User ID:', userId, 'Produto ID:', produto_id);
        
        // Buscar preço do produto primeiro
        const [produto] = await pool.query(
            'SELECT PRECO FROM PRODUTOS WHERE ID_PRODUTO = ?',
            [produto_id]
        );
        
        if (produto.length === 0) {
            console.log('Produto não encontrado no banco');
            return res.json({ success: false, message: 'Produto não encontrado' });
        }
        
        const precoProduto = parseFloat(produto[0].PRECO);
        console.log('Preço do produto:', precoProduto);
        
        // Verificar se o usuário já tem uma sacola
        let [sacola] = await pool.query(
            'SELECT ID_SACOLA FROM SACOLA WHERE ID_USUARIO = ?',
            [userId]
        );
        
        let sacolaId;
        if (sacola.length === 0) {
            console.log('Criando nova sacola para o usuário');
            const [novaSacola] = await pool.query(
                'INSERT INTO SACOLA (ID_USUARIO) VALUES (?)',
                [userId]
            );
            sacolaId = novaSacola.insertId;
        } else {
            sacolaId = sacola[0].ID_SACOLA;
        }
        
        console.log('Sacola ID:', sacolaId);
        
        // Verificar se o item já existe na sacola
        const [itemExistente] = await pool.query(
            'SELECT * FROM ITENS_SACOLA WHERE ID_SACOLA = ? AND ID_PRODUTO = ?',
            [sacolaId, produto_id]
        );
        
        if (itemExistente.length > 0) {
            console.log('Item já existe, atualizando quantidade');
            const novaQuantidade = itemExistente[0].QUANTIDADE + 1;
            const novoValorTotal = precoProduto * novaQuantidade;
            
            const [updateResult] = await pool.query(
                'UPDATE ITENS_SACOLA SET QUANTIDADE = ?, VALOR_TOTAL = ? WHERE ID_SACOLA = ? AND ID_PRODUTO = ?',
                [novaQuantidade, novoValorTotal, sacolaId, produto_id]
            );
            console.log('Update result:', updateResult);
        } else {
            console.log('Adicionando novo item à sacola');
            const [insertResult] = await pool.query(
                'INSERT INTO ITENS_SACOLA (ID_SACOLA, ID_PRODUTO, QUANTIDADE, VALOR_TOTAL) VALUES (?, ?, 1, ?)',
                [sacolaId, produto_id, precoProduto]
            );
            console.log('Insert result:', insertResult);
        }
        
        // Verificar se o item foi realmente adicionado
        const [verificacao] = await pool.query(
            'SELECT * FROM ITENS_SACOLA WHERE ID_SACOLA = ? AND ID_PRODUTO = ?',
            [sacolaId, produto_id]
        );
        console.log('Verificação final - item na sacola:', verificacao.length > 0 ? 'SIM' : 'NÃO');
        console.log('Dados do item:', verificacao[0]);
        
        console.log('=== PRODUTO ADICIONADO COM SUCESSO! ===');
        res.json({ success: true, message: 'Produto adicionado à sacola com sucesso!' });
    } catch (error) {
        console.log('ERRO COMPLETO ao adicionar à sacola:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor: ' + error.message });
    }
});


router.post('/favoritar', verificarUsuAutenticado, async function(req, res){
    try {
        const { produto_id } = req.body;
        const userId = req.session.autenticado.id;
        
        // Verificar se já está favoritado
        const [existing] = await pool.query(
            'SELECT * FROM FAVORITOS WHERE ID_ITEM = ? AND ID_USUARIO = ? AND TIPO_ITEM = "produto"',
            [produto_id, userId]
        );
        
        if (existing.length > 0) {
            // Se existe, alternar status
            const newStatus = existing[0].STATUS_FAVORITO === 'favoritado' ? 'nulo' : 'favoritado';
            await pool.query(
                'UPDATE FAVORITOS SET STATUS_FAVORITO = ? WHERE ID_ITEM = ? AND ID_USUARIO = ? AND TIPO_ITEM = "produto"',
                [newStatus, produto_id, userId]
            );
            res.json({ success: true, favorited: newStatus === 'favoritado' });
        } else {
            // Se não existe, criar novo
            await pool.query(
                'INSERT INTO FAVORITOS (ID_ITEM, ID_USUARIO, STATUS_FAVORITO, TIPO_ITEM, DATA_FAVORITO) VALUES (?, ?, "favoritado", "produto", NOW())',
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
            'SELECT STATUS_FAVORITO FROM FAVORITOS WHERE ID_ITEM = ? AND ID_USUARIO = ? AND TIPO_ITEM = "produto"',
            [produto_id, req.session.autenticado.id]
        );
        
        const isFavorited = favorito.length > 0 && favorito[0].STATUS_FAVORITO === 'favoritado';
        res.json({ favorited: isFavorited });
    } catch (error) {
        console.log('Erro ao verificar favorito:', error);
        // Se for erro de conexão, retornar resposta padrão sem tentar novamente
        if (error.code === 'ER_USER_LIMIT_REACHED' || error.code === 'ER_CON_COUNT_ERROR') {
            return res.json({ favorited: false });
        }
        res.json({ favorited: false });
    }
});


router.get('/buscar', carregarDadosUsuario, async function(req, res){
    try {
        const termo = req.query.q || '';
        let produtos = [];
        let brechos = [];
        
        if (termo.trim()) {
            // Buscar produtos
            const [produtosResult] = await pool.query(`
                SELECT p.*, img.URL_IMG, u.NOME_USUARIO as VENDEDOR
                FROM PRODUTOS p
                LEFT JOIN IMG_PRODUTOS img ON p.ID_PRODUTO = img.ID_PRODUTO
                LEFT JOIN USUARIOS u ON p.ID_USUARIO = u.ID_USUARIO
                WHERE p.STATUS_PRODUTO = 'd' AND (
                    p.NOME_PRODUTO LIKE ? OR 
                    p.TIPO_PRODUTO LIKE ? OR 
                    p.COR_PRODUTO LIKE ? OR
                    p.ESTILO_PRODUTO LIKE ?
                )
                GROUP BY p.ID_PRODUTO
                LIMIT 20
            `, [`%${termo}%`, `%${termo}%`, `%${termo}%`, `%${termo}%`]);
            
            // Buscar brechós
            const [brechosResult] = await pool.query(`
                SELECT u.NOME_USUARIO, u.IMG_URL, u.ID_USUARIO,
                       COUNT(p.ID_PRODUTO) as total_produtos
                FROM USUARIOS u
                LEFT JOIN PRODUTOS p ON u.ID_USUARIO = p.ID_USUARIO AND p.STATUS_PRODUTO = 'd'
                WHERE u.TIPO_USUARIO = 'b' AND u.NOME_USUARIO LIKE ?
                GROUP BY u.ID_USUARIO
                LIMIT 10
            `, [`%${termo}%`]);
            
            produtos = produtosResult;
            brechos = brechosResult;
        }
        
        res.render('pages/buscar', {
            termo: termo,
            produtos: produtos,
            brechos: brechos,
            autenticado: req.session.autenticado || null
        });
    } catch (error) {
        console.log('Erro na busca:', error);
        res.render('pages/buscar', {
            termo: req.query.q || '',
            produtos: [],
            brechos: [],
            autenticado: req.session.autenticado || null
        });
    }
});




router.post('/api/seguir-brecho', verificarUsuAutenticado, async function(req, res){
    try {
        const { brechoId, action } = req.body;
        const userId = req.session.autenticado.id;

        if (action === 'follow') {
            const [existing] = await pool.query(
                'SELECT * FROM SEGUINDO_BRECHO WHERE ID_USUARIO = ? AND ID_BRECHO = ?',
                [userId, brechoId]
            );
            
            if (existing.length === 0) {
                await pool.query(
                    'INSERT INTO SEGUINDO_BRECHO (ID_USUARIO, ID_BRECHO, DATA_SEGUINDO) VALUES (?, ?, NOW())',
                    [userId, brechoId]
                );
            }
        } else {
            await pool.query(
                'DELETE FROM SEGUINDO_BRECHO WHERE ID_USUARIO = ? AND ID_BRECHO = ?',
                [userId, brechoId]
            );
        }
        
        res.json({ success: true });
    } catch (error) {
        console.log('Erro ao seguir brechó:', error);
        res.json({ success: false, message: 'Erro interno' });
    }
});

router.post('/api/favoritar-brecho', verificarUsuAutenticado, async function(req, res){
    try {
        const { brechoId, action } = req.body;
        const userId = req.session.autenticado.id;

        if (action === 'favorite') {
            const [existing] = await pool.query(
                'SELECT * FROM FAVORITOS WHERE ID_ITEM = ? AND ID_USUARIO = ? AND TIPO_ITEM = "brecho"',
                [brechoId, userId]
            );
            
            if (existing.length === 0) {
                await pool.query(
                    'INSERT INTO FAVORITOS (ID_ITEM, ID_USUARIO, STATUS_FAVORITO, TIPO_ITEM, DATA_FAVORITO) VALUES (?, ?, "favoritado", "brecho", NOW())',
                    [brechoId, userId]
                );
            } else {
                await pool.query(
                    'UPDATE FAVORITOS SET STATUS_FAVORITO = "favoritado" WHERE ID_ITEM = ? AND ID_USUARIO = ? AND TIPO_ITEM = "brecho"',
                    [brechoId, userId]
                );
            }
        } else {
            await pool.query(
                'UPDATE FAVORITOS SET STATUS_FAVORITO = "nulo" WHERE ID_ITEM = ? AND ID_USUARIO = ? AND TIPO_ITEM = "brecho"',
                [brechoId, userId]
            );
        }
        
        res.json({ success: true });
    } catch (error) {
        console.log('Erro ao favoritar brechó:', error);
        res.json({ success: false, message: 'Erro interno' });
    }
});

module.exports = router;
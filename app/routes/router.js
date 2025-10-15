var express = require("express");
var router = express.Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');

const {
  verificarUsuAutenticado,
  limparSessao,
  verificarUsuAutorizado,
  carregarDadosUsuario,
  verificarAdmin
} = require("../models/autenticador_middleware");

const usuarioController = require("../controllers/usuarioController");
const adminController = require("../controllers/adminController");
const { body, validationResult } = require("express-validator");
const pool = require('../config/pool_conexoes');
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

const uploadFile = require("../util/uploader");
const uploadProduto = require("../util/uploaderProduto");
const fs = require('fs');
const { promisify } = require('util');
const mkdir = promisify(fs.mkdir);

// Configuração do multer para upload de foto
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './app/public/imagem/perfil/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'perfil-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { 
        fileSize: 5 * 1024 * 1024,
        files: 1
    },
    fileFilter: function (req, file, cb) {
        console.log('Validando arquivo:', {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size
        });
        
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Apenas imagens são permitidas'));
        }
    }
});

// Garantir que o diretório de upload existe
async function ensureUploadDirectory() {
    const uploadDir = './app/public/imagem/perfil/';
    try {
        await mkdir(uploadDir, { recursive: true });
        console.log('Diretório de upload verificado:', uploadDir);
    } catch (error) {
        if (error.code !== 'EEXIST') {
            console.log('Erro ao criar diretório de upload:', error.message);
        }
    }
}

// Configurar pool de conexões com timeout menor
pool.on('connection', function (connection) {
    console.log('Nova conexão estabelecida como id ' + connection.threadId);
    connection.query('SET SESSION wait_timeout = 60');
    connection.query('SET SESSION interactive_timeout = 60');
});

pool.on('error', function(err) {
    console.log('Erro no pool de conexões:', err.code);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('Conexão perdida, tentando reconectar...');
    }
});

// Executar na inicialização
ensureUploadDirectory();

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
  let banners = [];
  let produtos = [];
  let brechos = [];
  
  try {
    const { bannerModel } = require('../models/bannerModel');
    const { produtoModel } = require('../models/produtoModel');
    
    banners = await bannerModel.findByPosition('Home') || [];
    produtos = await produtoModel.findRecent(16) || [];
    
    // Buscar brechós reais
    const [brechosResult] = await pool.query(`
      SELECT u.ID_USUARIO, u.NOME_USUARIO, u.IMG_URL,
             COALESCE(AVG(ab.NOTA), 4.5) as MEDIA_AVALIACOES
      FROM USUARIOS u
      LEFT JOIN AVALIACOES_BRECHOS ab ON u.ID_USUARIO = ab.ID_BRECHO
      WHERE u.TIPO_USUARIO = 'b'
      GROUP BY u.ID_USUARIO
      ORDER BY MEDIA_AVALIACOES DESC
      LIMIT 4
    `);
    brechos = brechosResult || [];
  } catch (error) {
    console.log('Erro na rota /:', error);
  }
  
  res.render('pages/index', {
    autenticado: req.session ? req.session.autenticado : null,
    banners: banners,
    produtos: produtos,
    brechos: brechos
  });
});

router.get("/index", async function (req, res) {
  let banners = [];
  let produtos = [];
  let brechos = [];
  
  try {
    const { bannerModel } = require('../models/bannerModel');
    const { produtoModel } = require('../models/produtoModel');
    
    banners = await bannerModel.findByPosition('Home') || [];
    produtos = await produtoModel.findRecent(16) || [];
    
    // Buscar brechós reais
    const [brechosResult] = await pool.query(`
      SELECT u.ID_USUARIO, u.NOME_USUARIO, u.IMG_URL,
             COALESCE(AVG(ab.NOTA), 4.5) as MEDIA_AVALIACOES
      FROM USUARIOS u
      LEFT JOIN AVALIACOES_BRECHOS ab ON u.ID_USUARIO = ab.ID_BRECHO
      WHERE u.TIPO_USUARIO = 'b'
      GROUP BY u.ID_USUARIO
      ORDER BY MEDIA_AVALIACOES DESC
      LIMIT 4
    `);
    brechos = brechosResult || [];
  } catch (error) {
    console.log('Erro na rota /index:', error);
  }
  
  res.render('pages/index', {
    autenticado: req.session ? req.session.autenticado : null,
    banners: banners,
    produtos: produtos,
    brechos: brechos
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
            
            // Redirecionar baseado no tipo de usuário
            if (usuario.TIPO_USUARIO === 'b') {
                return res.redirect('/homevendedor');
            } else if (usuario.TIPO_USUARIO === 'a') {
                return res.redirect('/homeadm');
            } else {
                return res.redirect('/homecomprador');
            }
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



router.get('/cadastroadm', function(req, res){ 
    res.render('pages/cadastroadm', {
        listaErros: null,
        dadosNotificacao: null,
        valores: {}
    }); 
});

router.post('/cadastroadm', adminController.regrasValidacaoAdmin, adminController.cadastrarAdmin);

router.post('/login-admin', adminController.regrasValidacaoLogin, adminController.loginAdmin);

// Rota de teste para verificar administradores
router.get('/test-admins', async (req, res) => {
    try {
        const [usuarios] = await pool.query('SELECT ID_USUARIO, NOME_USUARIO, EMAIL_USUARIO, TIPO_USUARIO, STATUS_USUARIO FROM USUARIOS WHERE TIPO_USUARIO = "a"');
        const [admins] = await pool.query('SELECT * FROM ADMINISTRADORES LIMIT 5');
        
        res.json({
            usuarios_admin: usuarios,
            tabela_administradores: admins,
            total_usuarios_admin: usuarios.length,
            total_administradores: admins.length
        });
    } catch (error) {
        res.json({ erro: error.message });
    }
});

// Rota de teste para upload
router.get('/test-upload', (req, res) => {
    res.sendFile(path.join(__dirname, '../../test-upload-simple.html'));
});

// Rota de debug para upload
router.get('/debug-upload', (req, res) => {
    res.sendFile(path.join(__dirname, '../../debug-upload.html'));
});

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
                avaliacoes: [],
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
        
        // Buscar avaliações reais (tabela AVALIACOES_BRECHOS)
        const [avaliacoes] = await pool.query(
            `SELECT ab.ID_AVALIACAO_BRECHO, ab.NOTA, ab.COMENTARIO, ab.DT_AVALIACAO,
                    u.NOME_USUARIO, u.IMG_URL
             FROM AVALIACOES_BRECHOS ab
             JOIN USUARIOS u ON ab.ID_USUARIO = u.ID_USUARIO
             WHERE ab.ID_BRECHO = ?
             ORDER BY ab.DT_AVALIACAO DESC
             LIMIT 10`,
            [id]
        );
        
        // Calcular média das avaliações reais
        const [mediaResult] = await pool.query(
            `SELECT AVG(NOTA) as media, COUNT(*) as total
             FROM AVALIACOES_BRECHOS
             WHERE ID_BRECHO = ?`,
            [id]
        );
        
        const mediaAvaliacoes = parseFloat(mediaResult[0]?.media) || 0;
        const totalAvaliacoes = mediaResult[0]?.total || 0;
        
        // Contar produtos vendidos (status diferente de 'd' = disponível)
        const [vendidos] = await pool.query(
            'SELECT COUNT(*) as total FROM PRODUTOS WHERE ID_USUARIO = ? AND STATUS_PRODUTO != "d"',
            [id]
        );
        
        // Contar seguidores reais
        const [seguidores] = await pool.query(
            'SELECT COUNT(*) as total FROM FAVORITOS WHERE ID_ITEM = ? AND TIPO_ITEM = "brecho" AND STATUS_FAVORITO = "favoritado"',
            [id]
        );
        
        const brechoData = {
            ID_USUARIO: usuario[0].ID_USUARIO,
            NOME_USUARIO: usuario[0].NOME_USUARIO,
            IMG_URL: usuario[0].IMG_URL,
            DESCRICAO_USUARIO: usuario[0].DESCRICAO_USUARIO || 'Roupas de segunda mão, tendências atuais e estilo com consciência.',
            avaliacao: mediaAvaliacoes > 0 ? mediaAvaliacoes.toFixed(1) : '0.0',
            totalAvaliacoes: totalAvaliacoes,
            itens_venda: produtos.length,
            vendidos: vendidos[0]?.total || 0,
            seguidores: seguidores[0]?.total || 0
        };
        
        console.log('Dados do brechó:', brechoData);
        console.log('Produtos encontrados:', produtos.length);
        console.log('Avaliações encontradas:', avaliacoes.length);
        
        res.render('pages/perfilbrecho', {
            brecho: brechoData,
            produtos: produtos,
            avaliacoes: avaliacoes,
            autenticado: req.session.autenticado || null
        });
    } catch (error) {
        console.log('Erro ao carregar perfil do brechó:', error);
        res.render('pages/perfilbrecho', {
            brecho: null,
            produtos: [],
            avaliacoes: [],
            autenticado: req.session.autenticado || null
        });
    }
});

router.get('/perfil1', carregarDadosUsuario, (req, res) => res.render('pages/perfil1', { autenticado: req.session.autenticado || null }));
router.get('/perfil2', carregarDadosUsuario, (req, res) => res.render('pages/perfil2', { autenticado: req.session.autenticado || null }));
router.get('/perfil3', carregarDadosUsuario, (req, res) => res.render('pages/perfil3', { autenticado: req.session.autenticado || null }));

router.get('/homecomprador', carregarDadosUsuario, async function(req, res){
    let banners = [];
    let produtos = [];
    let brechos = [];
    
    try {
        const { bannerModel } = require('../models/bannerModel');
        const { produtoModel } = require('../models/produtoModel');
        
        banners = await bannerModel.findByPosition('Home') || [];
        produtos = await produtoModel.findRecent(16) || [];
        
        // Buscar brechós reais
        const [brechosResult] = await pool.query(`
            SELECT u.ID_USUARIO, u.NOME_USUARIO, u.IMG_URL,
                   COALESCE(AVG(ab.NOTA), 4.5) as MEDIA_AVALIACOES
            FROM USUARIOS u
            LEFT JOIN AVALIACOES_BRECHOS ab ON u.ID_USUARIO = ab.ID_BRECHO
            WHERE u.TIPO_USUARIO = 'b'
            GROUP BY u.ID_USUARIO
            ORDER BY MEDIA_AVALIACOES DESC
            LIMIT 4
        `);
        brechos = brechosResult || [];
    } catch (error) {
        console.log('Erro na rota /homecomprador:', error);
    }
    
    res.render('pages/homecomprador', {
        autenticado: req.session.autenticado || null,
        produtos: produtos,
        banners: banners,
        brechos: brechos
    });
});

router.get('/homevendedor', carregarDadosUsuario, async function(req, res){
    let banners = [];
    let produtos = [];
    let brechos = [];
    
    try {
        const { bannerModel } = require('../models/bannerModel');
        const { produtoModel } = require('../models/produtoModel');
        
        banners = await bannerModel.findByPosition('Home') || [];
        produtos = await produtoModel.findRecent(16) || [];
        
        // Buscar brechós reais
        const [brechosResult] = await pool.query(`
            SELECT u.ID_USUARIO, u.NOME_USUARIO as NOME, u.IMG_URL as IMAGEM,
                   COALESCE(AVG(ab.NOTA), 4.5) as MEDIA_AVALIACAO
            FROM USUARIOS u
            LEFT JOIN AVALIACOES_BRECHOS ab ON u.ID_USUARIO = ab.ID_BRECHO
            WHERE u.TIPO_USUARIO = 'b'
            GROUP BY u.ID_USUARIO
            ORDER BY MEDIA_AVALIACAO DESC
            LIMIT 4
        `);
        brechos = brechosResult || [];
    } catch (error) {
        console.log('Erro na rota /homevendedor:', error);
    }
    
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
        autenticado: req.session.autenticado || null,
        produtos: produtos,
        banners: banners,
        brechos: brechos
    });
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
router.get('/tensustentavel', (req, res) => {
    try {
        const authData = {
            isAuthenticated: !!(req.session && req.session.autenticado && req.session.autenticado.autenticado),
            userType: (req.session && req.session.autenticado && req.session.autenticado.tipo) || 'c'
        };
        res.render('pages/tensustentavel', { 
            authData,
            autenticado: req.session ? req.session.autenticado : null 
        });
    } catch (error) {
        console.log('Erro na rota tensustentavel:', error);
        res.render('pages/tensustentavel', { 
            authData: { isAuthenticated: false, userType: 'c' },
            autenticado: null 
        });
    }
});

router.get('/js/auth-config.js', (req, res) => {
    const isAuthenticated = !!(req.session && req.session.autenticado && req.session.autenticado.autenticado);
    let userType = 'c';
    
    if (req.session && req.session.autenticado && req.session.autenticado.tipo) {
        userType = req.session.autenticado.tipo;
    } else if (req.session && req.session.autenticado && req.session.autenticado.autenticado) {
        userType = 'c';
    }
    
    const jsContent = `window.isAuthenticated = ${isAuthenticated};
window.userType = '${userType}';`;
    res.setHeader('Content-Type', 'application/javascript');
    res.send(jsContent);
});

router.get('/js/produto-config.js', (req, res) => {
    const authData = {
        isAuthenticated: !!(req.session && req.session.autenticado && req.session.autenticado.autenticado),
        userType: (req.session && req.session.autenticado && req.session.autenticado.tipo) || 'c'
    };
    const produtoId = req.query.id || '';
    const jsContent = `window.isAuthenticated = ${authData.isAuthenticated};
window.userType = '${authData.userType}';
window.produtoId = '${produtoId}';`;
    res.setHeader('Content-Type', 'application/javascript');
    res.send(jsContent);
});

router.get('/js/produto-actions.js', (req, res) => {
    const jsContent = `
function alterarStatus(produtoId, novoStatus) {
    if (!confirm('Tem certeza que deseja alterar o status deste produto?')) return;
    
    fetch('/produtosadm/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produtoId, status: novoStatus })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            location.reload();
        } else {
            alert('Erro: ' + data.message);
        }
    })
    .catch(error => alert('Erro de conexão'));
}

function verDetalhes(produtoId) {
    fetch('/produtosadm/detalhes/' + produtoId)
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const produto = data.data;
            document.getElementById('detalhesContent').innerHTML = \`
                <p><strong>Nome:</strong> \${produto.NOME_PRODUTO}</p>
                <p><strong>Preço:</strong> R$ \${parseFloat(produto.PRECO).toFixed(2)}</p>
                <p><strong>Categoria:</strong> \${produto.TIPO_PRODUTO}</p>
                <p><strong>Vendedor:</strong> \${produto.VENDEDOR}</p>
                <p><strong>Status:</strong> \${produto.STATUS_PRODUTO === 'd' ? 'Ativo' : 'Inativo'}</p>
                \${produto.DETALHES_PRODUTO ? '<p><strong>Descrição:</strong> ' + produto.DETALHES_PRODUTO + '</p>' : ''}
            \`;
            document.getElementById('detalhesModal').style.display = 'block';
        } else {
            alert('Erro ao carregar detalhes');
        }
    })
    .catch(error => alert('Erro de conexão'));
}

function excluirProduto(produtoId) {
    if (!confirm('Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.')) return;
    
    fetch('/produtosadm/excluir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produtoId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            location.reload();
        } else {
            alert('Erro: ' + data.message);
        }
    })
    .catch(error => alert('Erro de conexão'));
}

document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('detalhesModal');
    const closeBtn = document.querySelector('.close');
    
    if (closeBtn) {
        closeBtn.onclick = function() {
            modal.style.display = 'none';
        };
    }
    
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
});
    `;
    res.setHeader('Content-Type', 'application/javascript');
    res.send(jsContent);
});
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
        
        const frete = 0; // Frete será calculado em finalizandopagamento
        const total = subtotal; // Total sem frete
        
        // Buscar produtos sugeridos reais
        const [produtosSugeridos] = await pool.query(`
            SELECT p.ID_PRODUTO, p.NOME_PRODUTO, p.PRECO, p.TIPO_PRODUTO, p.COR_PRODUTO, 
                   p.ESTILO_PRODUTO, p.TAMANHO_PRODUTO, img.URL_IMG
            FROM PRODUTOS p
            LEFT JOIN IMG_PRODUTOS img ON p.ID_PRODUTO = img.ID_PRODUTO
            WHERE p.STATUS_PRODUTO = 'd' AND p.ID_PRODUTO != ?
            GROUP BY p.ID_PRODUTO
            ORDER BY RAND()
            LIMIT 8
        `, [produtoId || 0]);
        
        const sugestoes = produtosSugeridos.map(item => ({
            ID_PRODUTO: item.ID_PRODUTO,
            NOME_PRODUTO: item.NOME_PRODUTO,
            PRECO: parseFloat(item.PRECO),
            TIPO_PRODUTO: item.TIPO_PRODUTO,
            COR_PRODUTO: item.COR_PRODUTO,
            ESTILO_PRODUTO: item.ESTILO_PRODUTO,
            TAMANHO_PRODUTO: item.TAMANHO_PRODUTO,
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
        
        // Capturar valores vindos de finalizandocompra
        const subtotalParam = req.query.subtotal;
        
        console.log('=== FINALIZANDO PAGAMENTO ===');
        console.log('Parâmetros recebidos:', { produtoId, subtotalParam });
        
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
        
        // Usar subtotal da URL se disponível
        if (subtotalParam) {
            subtotal = parseFloat(subtotalParam);
        }
        
        const frete = 0; // Frete será calculado na página
        const total = subtotal; // Total inicial sem frete
        
        console.log('Valores calculados:', {
            subtotal: subtotal.toFixed(2),
            frete: frete.toFixed(2),
            total: total.toFixed(2)
        });
        
        res.render('pages/finalizandopagamento', {
            produto: produto,
            subtotal: subtotal.toFixed(2),
            frete: frete.toFixed(2),
            total: total.toFixed(2),
            freteNome: 'Calcular',
            autenticado: req.session.autenticado
        });
    } catch (error) {
        console.log('Erro ao carregar finalizandopagamento:', error);
        res.render('pages/finalizandopagamento', {
            produto: null,
            subtotal: '0,00',
            frete: '0,00',
            total: '0,00',
            freteNome: 'Padrão',
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
        let carrinhoHtml = `
            <section class="empty-state">
                <p>Sua sacola está vazia</p>
                <a href="/homecomprador" class="btn-continue">Continuar Comprando</a>
            </section>
        `;
        
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
                ID_PRODUTO: item.ID_PRODUTO,
                NOME_PRODUTO: item.NOME_PRODUTO,
                PRECO_PRODUTO: parseFloat(item.PRECO).toFixed(2).replace('.', ','),
                QUANTIDADE: item.QUANTIDADE,
                IMG_PRODUTO_1: item.URL_IMG ? '/' + item.URL_IMG : '/imagens/produto-default.png',
                COR_PRODUTO: item.COR_PRODUTO,
                ESTILO_PRODUTO: item.ESTILO_PRODUTO,
                ESTAMPA_PRODUTO: item.ESTAMPA_PRODUTO,
                TAMANHO_PRODUTO: item.TAMANHO_PRODUTO
            }));
            
            // Processar HTML no backend
            if (carrinho.length > 0) {
                carrinhoHtml = carrinho.map(item => `
                    <article class="product-card">
                        <img src="${item.IMG_PRODUTO_1 || 'imagens/conjunto.png'}" alt="${item.NOME_PRODUTO}">
                        <h2>${item.NOME_PRODUTO}</h2>
                        <p class="price">R$${item.PRECO_PRODUTO}</p>
                        <p class="descricao">ou em 2x de R$${(parseFloat(item.PRECO_PRODUTO.replace(',', '.')) / 2).toFixed(2)}</p>
                        <button class="favorite" onclick="toggleFavorite(this, ${item.ID_PRODUTO})"><img src="imagens/coração de fav2.png"></button>
                        <button class="cart" onclick="removeFromCart(${item.ID_PRODUTO})"><img src="imagens/lixeira.png" class="img-sacola"></button>
                    </article>
                `).join('');
            } else {
                carrinhoHtml = `
                    <section class="empty-state">
                        <p>Sua sacola está vazia</p>
                        <a href="/homecomprador" class="btn-continue">Continuar Comprando</a>
                    </section>
                `;
            }
            
            subtotal = carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
        } else {
            carrinhoHtml = `
                <section class="empty-state">
                    <p>Sua sacola está vazia</p>
                    <a href="/homecomprador" class="btn-continue">Continuar Comprando</a>
                </section>
            `;
        }
        
        const frete = subtotal > 0 ? 10 : 0;
        const total = subtotal + frete;
        
        res.render('pages/sacola1', {
            carrinhoHtml,
            carrinho: carrinho,
            subtotal: subtotal.toFixed(2),
            frete: frete.toFixed(2),
            total: total.toFixed(2),
            autenticado: req.session.autenticado || null
        });
    } catch (error) {
        console.log('Erro ao carregar sacola1:', error);
        const emptyHtml = `
            <section class="empty-state">
                <p>Sua sacola está vazia</p>
                <a href="/homecomprador" class="btn-continue">Continuar Comprando</a>
            </section>
        `;
        res.render('pages/sacola1', {
            carrinhoHtml: emptyHtml,
            carrinho: [],
            subtotal: '0,00',
            frete: '0,00',
            total: '0,00',
            autenticado: req.session.autenticado || null
        });
    }
});
router.get('/avaliasao', carregarDadosUsuario, async (req, res) => {
    try {
        let avaliacoes = [];
        let brechos = [];
        let estatisticas = {
            totalAvaliacoes: 0,
            mediaAvaliacoes: 0
        };
        
        try {
            // Buscar avaliações reais do banco
            const [avaliacoesResult] = await pool.query(`
                SELECT ab.ID_AVALIACAO_BRECHO as ID_AVALIACAO, ab.NOTA as NOTA_AVALIACAO, 
                       ab.COMENTARIO, ab.DT_AVALIACAO as DATA_AVALIACAO, ab.ID_USUARIO,
                       ab.ID_BRECHO as ID_BRECHO_AVALIADO,
                       u.NOME_USUARIO, u.IMG_URL,
                       ub.NOME_USUARIO as NOME_BRECHO
                FROM AVALIACOES_BRECHOS ab
                JOIN USUARIOS u ON ab.ID_USUARIO = u.ID_USUARIO
                LEFT JOIN USUARIOS ub ON ab.ID_BRECHO = ub.ID_USUARIO
                ORDER BY ab.DT_AVALIACAO DESC
                LIMIT 20
            `);
            avaliacoes = avaliacoesResult;
            
            // Buscar brechós para avaliação usando tabela real
            const [brechosResult] = await pool.query(`
                SELECT u.ID_USUARIO, u.NOME_USUARIO, u.IMG_URL,
                       COALESCE(AVG(ab.NOTA), 0) as MEDIA_AVALIACOES,
                       COUNT(ab.ID_AVALIACAO_BRECHO) as TOTAL_AVALIACOES
                FROM USUARIOS u
                LEFT JOIN AVALIACOES_BRECHOS ab ON u.ID_USUARIO = ab.ID_BRECHO
                WHERE u.TIPO_USUARIO = 'b'
                GROUP BY u.ID_USUARIO
                ORDER BY u.NOME_USUARIO
                LIMIT 20
            `);
            brechos = brechosResult.map(brecho => ({
                ...brecho,
                MEDIA_AVALIACOES: parseFloat(brecho.MEDIA_AVALIACOES) || 0
            }));
            
            // Calcular estatísticas da plataforma (simular já que não há avaliações da plataforma)
            const [stats] = await pool.query(`
                SELECT COUNT(*) as total, AVG(NOTA) as media
                FROM AVALIACOES_BRECHOS
            `);
            
            if (stats.length > 0) {
                estatisticas = {
                    totalAvaliacoes: stats[0].total || 0,
                    mediaAvaliacoes: parseFloat(stats[0].media) || 4.8
                };
            }
        } catch (dbError) {
            console.log('Erro no banco, usando dados padrão:', dbError.message);
        }
        
        res.render('pages/avaliasao', {
            autenticado: req.session.autenticado || null,
            avaliacoes: avaliacoes,
            brechos: brechos,
            estatisticas: estatisticas
        });
    } catch (error) {
        console.log('Erro ao carregar avaliações:', error);
        res.render('pages/avaliasao', {
            autenticado: req.session.autenticado || null,
            avaliacoes: [],
            brechos: [],
            estatisticas: {
                totalAvaliacoes: 0,
                mediaAvaliacoes: 0
            }
        });
    }
});

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
            console.log('=== DEBUG PERFILVENDER ===');
            console.log('Usuário autenticado:', req.session.autenticado);
            
            const userDetails = await usuarioModel.findId(req.session.autenticado.id);
            console.log('Detalhes do usuário encontrados:', userDetails.length > 0 ? 'SIM' : 'NÃO');
            
            if (userDetails && userDetails.length > 0) {
                const user = userDetails[0];
                console.log('Tipo de usuário:', user.TIPO_USUARIO);
                userData.nome = user.NOME_USUARIO || 'Usuário';
                userData.email = user.EMAIL_USUARIO || 'email@exemplo.com';
                userData.telefone = user.CELULAR_USUARIO || '(11) 99999-9999';
                userData.imagem = user.IMG_URL || null;
                userData.user_usuario = user.USER_USUARIO || 'usuario';
            }
            
            // Buscar produtos do usuário com debug detalhado
            console.log('Buscando produtos para usuário ID:', req.session.autenticado.id);
            
            // Primeiro, verificar se existem produtos na tabela
            const [totalProdutos] = await pool.query('SELECT COUNT(*) as total FROM PRODUTOS');
            console.log('Total de produtos na tabela PRODUTOS:', totalProdutos[0].total);
            
            // Verificar produtos específicos do usuário
            const [produtosUsuario] = await pool.query(`
                SELECT p.ID_PRODUTO, p.NOME_PRODUTO, p.PRECO, p.TIPO_PRODUTO, p.STATUS_PRODUTO, p.ID_USUARIO,
                       img.URL_IMG
                FROM PRODUTOS p
                LEFT JOIN IMG_PRODUTOS img ON p.ID_PRODUTO = img.ID_PRODUTO
                WHERE p.ID_USUARIO = ?
                GROUP BY p.ID_PRODUTO
                ORDER BY p.ID_PRODUTO DESC
            `, [req.session.autenticado.id]);
            
            console.log('Produtos encontrados para o usuário:', produtosUsuario.length);
            
            if (produtosUsuario.length > 0) {
                console.log('Primeiro produto encontrado:');
                console.log('- ID:', produtosUsuario[0].ID_PRODUTO);
                console.log('- Nome:', produtosUsuario[0].NOME_PRODUTO);
                console.log('- Preço:', produtosUsuario[0].PRECO);
                console.log('- Status:', produtosUsuario[0].STATUS_PRODUTO);
                console.log('- ID_USUARIO:', produtosUsuario[0].ID_USUARIO);
            } else {
                console.log('NENHUM produto encontrado para o usuário');
                
                // Verificar se há produtos de outros usuários
                const [outrosProdutos] = await pool.query('SELECT ID_PRODUTO, ID_USUARIO FROM PRODUTOS LIMIT 5');
                console.log('Produtos de outros usuários (amostra):', outrosProdutos);
            }
            
            produtos = produtosUsuario;
            userData.itens_venda = produtos.length;
            console.log('=== FIM DEBUG ===');
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
    // Verificar se há mensagem de sucesso na sessão
    const mensagemSucesso = req.session.mensagemSucesso || null;
    
    // Limpar a mensagem da sessão após usá-la
    if (req.session.mensagemSucesso) {
        delete req.session.mensagemSucesso;
    }
    
    res.render('pages/entrar', { 
        listaErros: null, 
        dadosNotificacao: mensagemSucesso,
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
            
            if (usuario.TIPO_USUARIO === 'b') {
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
            } else if (usuario.TIPO_USUARIO === 'a') {
                console.log('Redirecionando para /homeadm');
                return res.redirect('/homeadm');
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
            
            // Buscar produtos vendidos (status diferente de 'd' = disponível)
            const [vendas] = await pool.query(
                'SELECT COUNT(*) as total, SUM(PRECO) as receita FROM PRODUTOS WHERE ID_USUARIO = ? AND STATUS_PRODUTO != "d"',
                [userId]
            );
            
            // Buscar visualizações reais dos produtos (usando tabela FAVORITOS como proxy)
            const [visualizacoes] = await pool.query(
                `SELECT COUNT(DISTINCT f.ID_USUARIO) as total 
                 FROM FAVORITOS f 
                 JOIN PRODUTOS p ON f.ID_ITEM = p.ID_PRODUTO 
                 WHERE p.ID_USUARIO = ? AND f.TIPO_ITEM = 'produto'`,
                [userId]
            );
            
            // Buscar produtos por categoria
            const [produtosCategorias] = await pool.query(
                `SELECT TIPO_PRODUTO, COUNT(*) as quantidade, 
                        AVG(PRECO) as preco_medio, SUM(PRECO) as receita_total,
                        SUM(CASE WHEN STATUS_PRODUTO != 'd' THEN 1 ELSE 0 END) as vendidos
                 FROM PRODUTOS WHERE ID_USUARIO = ? 
                 GROUP BY TIPO_PRODUTO`,
                [userId]
            );
            
            // Buscar detalhes dos produtos
            const [produtosDetalhes] = await pool.query(
                `SELECT NOME_PRODUTO, PRECO, TIPO_PRODUTO, STATUS_PRODUTO,
                        DATE(DATA_CADASTRO) as data_cadastro
                 FROM PRODUTOS WHERE ID_USUARIO = ? 
                 ORDER BY DATA_CADASTRO DESC LIMIT 10`,
                [userId]
            );
            
            estatisticas.totalProdutos = produtos[0]?.total || 0;
            estatisticas.totalVendas = vendas[0]?.total || 0;
            estatisticas.receitaTotal = parseFloat(vendas[0]?.receita) || 0;
            estatisticas.totalVisualizacoes = Math.max(visualizacoes[0]?.total || 0, estatisticas.totalProdutos * 2);
            estatisticas.brecho.NOME_BRECHO = req.session.autenticado.nome + ' Brechó';
            estatisticas.produtosDetalhes = produtosDetalhes;
            
            // Calcular taxa de conversão real
            estatisticas.taxaConversao = estatisticas.totalVisualizacoes > 0 
                ? ((estatisticas.totalVendas / estatisticas.totalVisualizacoes) * 100).toFixed(1)
                : 0;
            
            // Processar dados por categoria
            produtosCategorias.forEach(cat => {
                estatisticas.produtosPorCategoria[cat.TIPO_PRODUTO] = cat.quantidade;
                estatisticas.receitaPorCategoria[cat.TIPO_PRODUTO] = parseFloat(cat.receita_total || 0);
            });
            
            estatisticas.vendasCategoria = produtosCategorias.map(cat => ({
                categoria: cat.TIPO_PRODUTO || 'Outros',
                quantidade: cat.vendidos || 0,
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

// API endpoint para estatísticas
router.get('/api/estatisticas', verificarUsuAutenticado, async (req, res) => {
    try {
        const userId = req.session.autenticado.id;
        
        // Buscar produtos do usuário
        const [produtos] = await pool.query(
            'SELECT COUNT(*) as total FROM PRODUTOS WHERE ID_USUARIO = ?',
            [userId]
        );
        
        // Buscar produtos vendidos
        const [vendas] = await pool.query(
            'SELECT COUNT(*) as total, SUM(PRECO) as receita FROM PRODUTOS WHERE ID_USUARIO = ? AND STATUS_PRODUTO != "d"',
            [userId]
        );
        
        // Buscar visualizações
        const [visualizacoes] = await pool.query(
            `SELECT COUNT(DISTINCT f.ID_USUARIO) as total 
             FROM FAVORITOS f 
             JOIN PRODUTOS p ON f.ID_ITEM = p.ID_PRODUTO 
             WHERE p.ID_USUARIO = ? AND f.TIPO_ITEM = 'produto'`,
            [userId]
        );
        
        // Buscar produtos por categoria com quantidade real
        const [produtosCategorias] = await pool.query(
            `SELECT TIPO_PRODUTO as categoria, COUNT(*) as quantidade, 
                    SUM(CASE WHEN STATUS_PRODUTO != 'd' THEN 1 ELSE 0 END) as vendidos
             FROM PRODUTOS WHERE ID_USUARIO = ? 
             GROUP BY TIPO_PRODUTO
             ORDER BY quantidade DESC`,
            [userId]
        );
        
        const totalProdutos = produtos[0]?.total || 0;
        const totalVendas = vendas[0]?.total || 0;
        const totalVisualizacoes = Math.max(visualizacoes[0]?.total || 0, totalProdutos * 2);
        const taxaConversao = totalVisualizacoes > 0 ? ((totalVendas / totalVisualizacoes) * 100).toFixed(1) : 0;
        
        const estatisticas = {
            brecho: { NOME_BRECHO: req.session.autenticado.nome + ' Brechó' },
            totalProdutos: totalProdutos,
            totalVendas: totalVendas,
            receitaTotal: parseFloat(vendas[0]?.receita) || 0,
            totalVisualizacoes: totalVisualizacoes,
            taxaConversao: parseFloat(taxaConversao),
            vendasCategoria: produtosCategorias
        };
        
        res.json(estatisticas);
    } catch (error) {
        console.log('Erro na API de estatísticas:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// API para calcular frete
router.post('/api/calcular-frete', async (req, res) => {
    try {
        const { cep_destino, produto_id } = req.body;
        
        // Validar CEP
        if (!cep_destino || cep_destino.length !== 8) {
            return res.json({ success: false, message: 'CEP inválido' });
        }
        
        // Buscar dados do produto se fornecido
        let peso = 0.5; // kg padrão
        let valor = 50; // valor padrão
        
        if (produto_id) {
            const [produto] = await pool.query('SELECT PRECO FROM PRODUTOS WHERE ID_PRODUTO = ?', [produto_id]);
            if (produto.length > 0) {
                valor = parseFloat(produto[0].PRECO);
            }
        }
        
        // Simular cálculo de frete (valores fixos para demonstração)
        const opcoes = [
            {
                name: 'PAC',
                price: '15.90',
                delivery_time: '8'
            },
            {
                name: 'SEDEX',
                price: '25.50',
                delivery_time: '3'
            },
            {
                name: 'SEDEX 10',
                price: '35.00',
                delivery_time: '1'
            }
        ];
        
        res.json({ success: true, opcoes: opcoes });
    } catch (error) {
        console.log('Erro ao calcular frete:', error);
        res.json({ success: false, message: 'Erro interno do servidor' });
    }
});

router.get('/estatisticaadm', verificarUsuAutenticado, verificarAdmin, async (req, res) => {
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

// API endpoint para produtos (usado pelo JavaScript da página categorias)
router.get('/api/produtos', async function(req, res){
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
        
        res.json(produtos || []);
    } catch (error) {
        console.log('Erro ao buscar produtos via API:', error);
        res.json([]);
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
router.get('/minhascompras', verificarUsuAutenticado, async function(req, res){
    try {
        const userId = req.session.autenticado.id;
        
        // Buscar pedidos do usuário com produtos
        const [pedidos] = await pool.query(`
            SELECT p.ID_PEDIDO, p.DT_PEDIDO, p.VALOR_TOTAL, p.STATUS_PEDIDO, p.CODIGO_RASTREIO,
                   p.DATA_PREV_ENTREGA, pr.NOME_PRODUTO, pr.PRECO, img.URL_IMG,
                   u.NOME_USUARIO as VENDEDOR
            FROM PEDIDOS p
            LEFT JOIN ITENS_SACOLA is ON p.ID_USUARIO = is.ID_SACOLA
            LEFT JOIN PRODUTOS pr ON is.ID_PRODUTO = pr.ID_PRODUTO
            LEFT JOIN IMG_PRODUTOS img ON pr.ID_PRODUTO = img.ID_PRODUTO
            LEFT JOIN USUARIOS u ON pr.ID_USUARIO = u.ID_USUARIO
            WHERE p.ID_USUARIO = ?
            ORDER BY p.DT_PEDIDO DESC
            LIMIT 20
        `, [userId]);
        
        // Se não há pedidos reais, usar dados exemplo
        if (pedidos.length === 0) {
            const pedidosExemplo = [
                {
                    ID_PEDIDO: 'VT2024-001',
                    DT_PEDIDO: new Date('2024-08-15'),
                    VALOR_TOTAL: 89.90,
                    STATUS_PEDIDO: 'Enviado',
                    NOME_PRODUTO: 'Vestido Branco Longo',
                    URL_IMG: 'imagens/vestido branco.png',
                    VENDEDOR: 'Brechó da Maria'
                },
                {
                    ID_PEDIDO: 'VT2024-002',
                    DT_PEDIDO: new Date('2024-07-24'),
                    VALOR_TOTAL: 65.00,
                    STATUS_PEDIDO: 'Cancelado',
                    NOME_PRODUTO: 'Vestido Magenta com Decote',
                    URL_IMG: 'imagens/vestido roxo2.png',
                    VENDEDOR: 'Brechó Fashion'
                }
            ];
            
            return res.render('pages/minhascompras', {
                pedidos: pedidosExemplo,
                autenticado: req.session.autenticado
            });
        }
        
        res.render('pages/minhascompras', {
            pedidos: pedidos,
            autenticado: req.session.autenticado
        });
    } catch (error) {
        console.log('Erro ao carregar compras:', error);
        res.render('pages/minhascompras', {
            pedidos: [],
            autenticado: req.session.autenticado
        });
    }
});
router.get('/pedidos', (req, res) => res.render('pages/pedidos'));
router.get('/enviopedido', (req, res) => res.render('pages/enviopedido'));
router.get('/menu', carregarDadosUsuario, async (req, res) => {
    try {
        let estatisticas = { total_pedidos: 0, em_andamento: 0, entregues: 0, valor_total: 0 };
        
        if (req.session && req.session.autenticado && req.session.autenticado.id) {
            const userId = req.session.autenticado.id;
            
            const [resumo] = await pool.query(`
                SELECT 
                    COUNT(*) as total_pedidos,
                    SUM(CASE WHEN STATUS_PEDIDO = 'Enviado' THEN 1 ELSE 0 END) as em_andamento,
                    SUM(CASE WHEN STATUS_PEDIDO = 'Concluído' THEN 1 ELSE 0 END) as entregues,
                    SUM(VALOR_TOTAL) as valor_total
                FROM PEDIDOS 
                WHERE ID_USUARIO = ?
            `, [userId]);
            
            estatisticas = resumo[0] || estatisticas;
        }
        
        res.render('pages/menu', {
            autenticado: req.session.autenticado || null,
            estatisticas: estatisticas
        });
    } catch (error) {
        console.log('Erro ao carregar menu:', error);
        res.render('pages/menu', {
            autenticado: req.session.autenticado || null,
            estatisticas: { total_pedidos: 0, em_andamento: 0, entregues: 0, valor_total: 0 }
        });
    }
});
router.get('/minhascomprasdesktop', (req, res) => res.render('pages/minhascomprasdesktop'));
router.get('/menuvendedor', carregarDadosUsuario, (req, res) => {
    res.render('pages/menuvendedor', {
        autenticado: req.session.autenticado || null
    });
});

router.post('/informacao', verificarUsuAutenticado, async (req, res) => {
    try {
        const { nome_usu, email_usu, fone_usu, cnpj, razao_social, nome_fantasia, data_nasc, cep, numero, logradouro, bairro, cidade, estado } = req.body;
        
        if (req.session && req.session.autenticado && req.session.autenticado.id) {
            const dadosUsuario = {
                NOME_USUARIO: nome_usu,
                EMAIL_USUARIO: email_usu,
                CELULAR_USUARIO: fone_usu,
                CEP_USUARIO: cep ? cep.replace(/\D/g, '') : '',
                LOGRADOURO_USUARIO: logradouro,
                NUMERO_USUARIO: numero,
                BAIRRO_USUARIO: bairro,
                CIDADE_USUARIO: cidade,
                UF_USUARIO: estado
            };
            
            await usuarioModel.update(dadosUsuario, req.session.autenticado.id);
            
            if (cnpj || razao_social || nome_fantasia) {
                const [brechos] = await pool.query(
                    'SELECT * FROM BRECHOS WHERE ID_USUARIO = ?',
                    [req.session.autenticado.id]
                );
                
                const dadosBrecho = {};
                if (cnpj) dadosBrecho.CNPJ_BRECHO = cnpj.replace(/\D/g, '');
                if (razao_social) dadosBrecho.RAZAO_SOCIAL = razao_social;
                if (nome_fantasia) dadosBrecho.NOME_FANTASIA = nome_fantasia;
                
                if (brechos.length > 0) {
                    await pool.query(
                        'UPDATE BRECHOS SET ? WHERE ID_USUARIO = ?',
                        [dadosBrecho, req.session.autenticado.id]
                    );
                } else {
                    dadosBrecho.ID_USUARIO = req.session.autenticado.id;
                    await pool.query('INSERT INTO BRECHOS SET ?', [dadosBrecho]);
                }
            }
            
            if (data_nasc) {
                const clienteData = await cliente.findByUserId(req.session.autenticado.id);
                if (clienteData && clienteData.length > 0) {
                    await cliente.update({ DATA_NASC: data_nasc }, req.session.autenticado.id);
                }
            }
        }
        
        res.redirect('/informacao');
    } catch (error) {
        console.log('Erro ao salvar informações:', error);
        res.redirect('/informacao');
    }
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
router.get('/menucompras', verificarUsuAutenticado, async function(req, res){
    try {
        const userId = req.session.autenticado.id;
        
        // Buscar resumo dos pedidos
        const [resumo] = await pool.query(`
            SELECT 
                COUNT(*) as total_pedidos,
                SUM(CASE WHEN STATUS_PEDIDO = 'Enviado' THEN 1 ELSE 0 END) as em_andamento,
                SUM(CASE WHEN STATUS_PEDIDO = 'Concluído' THEN 1 ELSE 0 END) as entregues,
                SUM(VALOR_TOTAL) as valor_total
            FROM PEDIDOS 
            WHERE ID_USUARIO = ?
        `, [userId]);
        
        const estatisticas = resumo[0] || {
            total_pedidos: 0,
            em_andamento: 0,
            entregues: 0,
            valor_total: 0
        };
        
        res.render('pages/menucompras', {
            autenticado: req.session.autenticado,
            estatisticas: estatisticas
        });
    } catch (error) {
        res.render('pages/menucompras', {
            autenticado: req.session.autenticado,
            estatisticas: { total_pedidos: 0, em_andamento: 0, entregues: 0, valor_total: 0 }
        });
    }
});
router.get('/planos', carregarDadosUsuario, async (req, res) => {
    try {
        let planos = [];
        let planoAtual = null;
        
        console.log('=== CARREGANDO PÁGINA DE PLANOS ===');
        
        // Usar planos padrão (sem depender de tabelas que podem não existir)
        planos = [
            {
                ID_PLANO: 'basico',
                NOME_PLANO: 'Básico',
                PRECO_PLANO: 19.90,
                BENEFICIOS: 'Cadastro de produtos, Exclusão de produtos'
            },
            {
                ID_PLANO: 'premium',
                NOME_PLANO: 'Premium',
                PRECO_PLANO: 39.90,
                BENEFICIOS: 'Cadastro de produtos, Envio de anúncios, Exclusão de produtos, Suporte básico, Destaque nos resultados'
            },
            {
                ID_PLANO: 'profissional',
                NOME_PLANO: 'Profissional',
                PRECO_PLANO: 59.90,
                BENEFICIOS: 'Cadastro de produtos, Envio de anúncios, Exclusão de produtos, Suporte premium, Destaque avançado'
            }
        ];
        
        // Processar botões no backend
        planos = planos.map(plano => {
            plano.buttonHtml = `<button onclick="contratarPlano('${plano.ID_PLANO}', '${plano.NOME_PLANO}', ${plano.PRECO_PLANO})">Iniciar</button>`;
            return plano;
        });
        
        // Se usuário autenticado, buscar plano atual na tabela USUARIOS
        if (req.session && req.session.autenticado && req.session.autenticado.id) {
            try {
                const [usuario] = await pool.query(
                    'SELECT PLANO_PREMIUM FROM USUARIOS WHERE ID_USUARIO = ?',
                    [req.session.autenticado.id]
                );
                
                if (usuario.length > 0 && usuario[0].PLANO_PREMIUM) {
                    planoAtual = {
                        NOME_PLANO: usuario[0].PLANO_PREMIUM,
                        STATUS_ASSINATURA: 'ativa'
                    };
                    console.log('Plano atual encontrado:', planoAtual);
                }
            } catch (dbError) {
                console.log('Erro ao buscar plano atual:', dbError.message);
            }
        }
        
        console.log('Planos disponíveis:', planos.length);
        console.log('Plano atual:', planoAtual ? planoAtual.NOME_PLANO : 'Nenhum');
        
        res.render('pages/planos', {
            autenticado: req.session.autenticado || null,
            planos: planos,
            planoAtual: planoAtual
        });
    } catch (error) {
        console.log('Erro geral ao carregar planos:', error);
        res.render('pages/planos', {
            autenticado: req.session.autenticado || null,
            planos: [],
            planoAtual: null
        });
    }
});



// Rota de debug para verificar se o usuário está logado
router.get('/debug-session', (req, res) => {
    res.json({
        session: !!req.session,
        autenticado: !!req.session?.autenticado,
        userId: req.session?.autenticado?.id,
        userType: req.session?.autenticado?.tipo,
        fullSession: req.session
    });
});

// Rota de teste para upload sem autenticação (apenas para debug)
router.post('/test-upload-debug', upload.single('foto'), async function(req, res){
    try {
        console.log('=== TEST UPLOAD DEBUG ===');
        console.log('Arquivo recebido:', req.file);
        
        if (!req.file) {
            return res.json({ success: false, error: 'Nenhum arquivo enviado' });
        }
        
        const imagePath = 'imagem/perfil/' + req.file.filename;
        
        res.json({ 
            success: true, 
            imagePath: imagePath,
            fileInfo: {
                originalname: req.file.originalname,
                filename: req.file.filename,
                size: req.file.size,
                mimetype: req.file.mimetype
            }
        });
        
    } catch (error) {
        console.log('Erro no test upload:', error);
        res.json({ success: false, error: error.message });
    }
});

router.post('/upload-foto-perfil', upload.single('foto'), async function(req, res){
    try {
        console.log('=== UPLOAD FOTO PERFIL ===');
        console.log('Sessão:', req.session);
        console.log('Autenticado:', req.session?.autenticado);
        console.log('Arquivo:', req.file);
        
        // Verificar autenticação manualmente
        if (!req.session || !req.session.autenticado || !req.session.autenticado.id) {
            return res.json({ success: false, error: 'Usuário não autenticado' });
        }
        
        if (!req.file) {
            return res.json({ success: false, error: 'Nenhum arquivo enviado' });
        }
        
        const userId = req.session.autenticado.id;
        const imagePath = 'imagem/perfil/' + req.file.filename;
        
        console.log('Arquivo:', {
            fieldname: req.file.fieldname,
            originalname: req.file.originalname,
            encoding: req.file.encoding,
            mimetype: req.file.mimetype,
            destination: req.file.destination,
            filename: req.file.filename,
            path: req.file.path,
            size: req.file.size
        });
        
        console.log('Atualizando usuário ID:', userId, 'com imagem:', imagePath);
        
        // Implementar retry com timeout para evitar ECONNRESET
        let attempts = 0;
        const maxAttempts = 3;
        let result;
        
        while (attempts < maxAttempts) {
            try {
                attempts++;
                console.log(`Tentativa ${attempts} de atualização no banco...`);
                
                // Usar timeout menor e connection específica
                const connection = await pool.getConnection();
                try {
                    await connection.query('SET SESSION wait_timeout = 30');
                    [result] = await connection.query(
                        'UPDATE USUARIOS SET IMG_URL = ? WHERE ID_USUARIO = ?', 
                        [imagePath, userId]
                    );
                    connection.release();
                    break; // Sucesso, sair do loop
                } catch (connError) {
                    connection.release();
                    throw connError;
                }
            } catch (dbError) {
                console.log(`Erro na tentativa ${attempts}:`, dbError.message);
                
                if (attempts >= maxAttempts) {
                    throw dbError;
                }
                
                // Aguardar antes da próxima tentativa
                await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
            }
        }
        
        console.log('Resultado da atualização:', result);
        
        if (result && result.affectedRows > 0) {
            req.session.autenticado.imagem = imagePath;
            res.json({ success: true, imagePath: imagePath });
        } else {
            res.json({ success: false, error: 'Falha ao atualizar no banco de dados' });
        }
        
    } catch (error) {
        console.log('ERRO no upload:', error);
        
        // Tratar erros específicos
        let errorMessage = error.message;
        if (error.code === 'ECONNRESET') {
            errorMessage = 'Conexão com banco perdida. Tente novamente.';
        } else if (error.code === 'ETIMEDOUT') {
            errorMessage = 'Timeout na conexão. Tente novamente.';
        } else if (error.code === 'ER_LOCK_WAIT_TIMEOUT') {
            errorMessage = 'Banco ocupado. Tente novamente em alguns segundos.';
        }
        
        res.json({ success: false, error: errorMessage });
    }
});



router.post('/perfilcliente', verificarUsuAutenticado, async function(req, res){
    try {
        console.log('=== SALVANDO PERFIL CLIENTE ===');
        console.log('Dados recebidos:', req.body);
        
        const { nome, email, telefone, cep, logradouro, numero, bairro, cidade, uf, cpf, data_nasc, bio } = req.body;
        const userId = req.session.autenticado.id;
        
        // Validar dados obrigatórios
        if (!nome || !email) {
            console.log('Dados obrigatórios não fornecidos');
            return res.redirect('/perfilcliente?erro=Nome e email são obrigatórios');
        }
        
        // Atualizar dados do usuário
        const dadosUsuario = {
            NOME_USUARIO: nome.trim(),
            EMAIL_USUARIO: email.trim(),
            CELULAR_USUARIO: telefone ? telefone.trim() : null,
            CEP_USUARIO: cep ? cep.replace(/\D/g, '') : null,
            LOGRADOURO_USUARIO: logradouro ? logradouro.trim() : null,
            NUMERO_USUARIO: numero ? numero.trim() : null,
            BAIRRO_USUARIO: bairro ? bairro.trim() : null,
            CIDADE_USUARIO: cidade ? cidade.trim() : null,
            UF_USUARIO: uf ? uf.trim() : null
        };
        
        if (bio && bio.trim()) {
            dadosUsuario.DESCRICAO_USUARIO = bio.trim();
        }
        
        console.log('Atualizando usuário com dados:', dadosUsuario);
        await usuarioModel.update(dadosUsuario, userId);
        
        // Atualizar sessão
        req.session.autenticado.nome = nome.trim();
        req.session.autenticado.email = email.trim();
        
        // Atualizar dados do cliente
        if (cpf || data_nasc) {
            try {
                const clienteData = await cliente.findByUserId(userId);
                const dadosCliente = {};
                
                if (cpf && cpf.trim()) {
                    dadosCliente.CPF_CLIENTE = cpf.replace(/\D/g, '');
                }
                if (data_nasc && data_nasc.trim()) {
                    dadosCliente.DATA_NASC = data_nasc;
                }
                
                if (Object.keys(dadosCliente).length > 0) {
                    if (clienteData && clienteData.length > 0) {
                        await cliente.update(dadosCliente, userId);
                    } else {
                        // Criar novo registro de cliente se não existir
                        dadosCliente.ID_USUARIO = userId;
                        await cliente.create(dadosCliente);
                    }
                }
            } catch (clienteError) {
                console.log('Erro ao atualizar dados do cliente:', clienteError.message);
            }
        }
        
        console.log('Perfil atualizado com sucesso!');
        res.redirect('/perfilcliente?sucesso=Perfil atualizado com sucesso');
        
    } catch (error) {
        console.log('ERRO ao salvar perfil:', error);
        res.redirect('/perfilcliente?erro=Erro ao salvar perfil');
    }
});

router.get('/perfilcliente', async function(req, res){
    try {
        console.log('=== CARREGANDO PERFIL CLIENTE ===');
        
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
            console.log('Usuário autenticado ID:', req.session.autenticado.id);
            
            try {
                const userDetails = await usuarioModel.findId(req.session.autenticado.id);
                
                if (userDetails && userDetails.length > 0) {
                    const user = userDetails[0];
                    console.log('Dados do usuário encontrados:', {
                        nome: user.NOME_USUARIO,
                        email: user.EMAIL_USUARIO,
                        imagem: user.IMG_URL
                    });
                    
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
                    try {
                        const clienteData = await cliente.findByUserId(req.session.autenticado.id);
                        if (clienteData && clienteData.length > 0) {
                            userData.cpf = clienteData[0].CPF_CLIENTE || '';
                            if (clienteData[0].DATA_NASC) {
                                const date = new Date(clienteData[0].DATA_NASC);
                                userData.data_nasc = date.toISOString().split('T')[0];
                            }
                        }
                    } catch (clienteError) {
                        console.log('Erro ao buscar dados do cliente:', clienteError.message);
                    }
                } else {
                    console.log('Nenhum dado de usuário encontrado');
                }
            } catch (userError) {
                console.log('Erro ao buscar dados do usuário:', userError.message);
            }
        } else {
            console.log('Usuário não autenticado, redirecionando...');
            return res.redirect('/entrar');
        }
        
        console.log('Renderizando página com dados:', {
            nome: userData.nome,
            email: userData.email,
            imagem: userData.imagem
        });
        
        res.render('pages/perfilcliente', {
            usuario: userData,
            favoritos: [],
            autenticado: req.session.autenticado
        });
    } catch (error) {
        console.log('ERRO GERAL ao carregar perfil:', error);
        res.status(500).render('pages/erro', {
            mensagem: 'Erro interno do servidor',
            autenticado: req.session ? req.session.autenticado : null
        });
    }
});

router.get('/homeadm', verificarUsuAutenticado, verificarAdmin, carregarDadosUsuario, async (req, res) => {
    let banners = [];
    let produtos = [];
    let brechos = [];
    
    try {
        const { bannerModel } = require('../models/bannerModel');
        const { produtoModel } = require('../models/produtoModel');
        
        banners = await bannerModel.findByPosition('Home') || [];
        produtos = await produtoModel.findRecent(16) || [];
        
        // Buscar brechós reais
        const [brechosResult] = await pool.query(`
            SELECT u.ID_USUARIO, u.NOME_USUARIO, u.IMG_URL,
                   COALESCE(AVG(ab.NOTA), 4.5) as MEDIA_AVALIACOES
            FROM USUARIOS u
            LEFT JOIN AVALIACOES_BRECHOS ab ON u.ID_USUARIO = ab.ID_BRECHO
            WHERE u.TIPO_USUARIO = 'b'
            GROUP BY u.ID_USUARIO
            ORDER BY MEDIA_AVALIACOES DESC
            LIMIT 4
        `);
        brechos = brechosResult || [];
    } catch (error) {
        console.log('Erro na rota /homeadm:', error);
    }
    
    res.render('pages/homeadm', {
        banners: banners,
        produtos: produtos,
        brechos: brechos,
        user: req.user || null
    });
});

router.get('/menuadm', (req, res) => res.render('pages/menuadm'));
router.get('/brechosadm', (req, res) => res.render('pages/brechosadm'));

router.get('/pedidosadm', (req, res) => res.render('pages/pedidosadm'));
router.get('/relatorioadm', (req, res) => res.render('pages/relatorioadm'));
router.get('/vistoriaprodutos', (req, res) => res.render('pages/vistoriaprodutos'));

router.get('/denuncias', verificarUsuAutenticado, verificarAdmin, async function(req, res) {
    try {
        let denuncias = [];
        
        // Tentar buscar denúncias reais primeiro
        try {
            const [denunciasReais] = await pool.query(`
                SELECT d.ID_DENUNCIA, d.MOTIVO, d.DESCRICAO, d.DATA_DENUNCIA, d.STATUS_DENUNCIA as STATUS,
                       u1.NOME_USUARIO as NOME_DENUNCIANTE, u1.USER_USUARIO as USER_DENUNCIANTE,
                       u2.NOME_USUARIO as NOME_ALVO, u2.USER_USUARIO as USER_ALVO, u2.TIPO_USUARIO as TIPO_ALVO
                FROM DENUNCIAS d
                LEFT JOIN USUARIOS u1 ON d.ID_USUARIO_DENUNCIANTE = u1.ID_USUARIO
                LEFT JOIN USUARIOS u2 ON d.ID_USUARIO_ALVO = u2.ID_USUARIO
                ORDER BY d.DATA_DENUNCIA DESC
                LIMIT 50
            `);
            denuncias = denunciasReais;
        } catch (dbError) {
            console.log('Tabela DENUNCIAS não existe, usando dados simulados com brechós reais');
        }
        
        // Se não há denúncias reais, criar dados simulados com brechós reais
        if (denuncias.length === 0) {
            const [brechos] = await pool.query(`
                SELECT u.ID_USUARIO, u.NOME_USUARIO, u.USER_USUARIO, u.IMG_URL
                FROM USUARIOS u
                WHERE u.TIPO_USUARIO = 'b'
                ORDER BY u.DATA_CADASTRO DESC
                LIMIT 10
            `);
            
            const [clientes] = await pool.query(`
                SELECT u.ID_USUARIO, u.NOME_USUARIO, u.USER_USUARIO
                FROM USUARIOS u
                WHERE u.TIPO_USUARIO = 'c'
                ORDER BY u.DATA_CADASTRO DESC
                LIMIT 5
            `);
            
            // Criar denúncias simuladas com dados reais
            if (brechos.length > 0) {
                denuncias = [
                    {
                        ID_DENUNCIA: 1,
                        MOTIVO: 'Perfil inadequado',
                        DESCRICAO: 'Usuário está vendendo produtos falsificados e usando imagens de outros perfis.',
                        DATA_DENUNCIA: new Date('2024-12-15'),
                        STATUS: 'pendente',
                        NOME_DENUNCIANTE: clientes[0]?.NOME_USUARIO || 'Cliente Anônimo',
                        USER_DENUNCIANTE: clientes[0]?.USER_USUARIO || 'cliente_anonimo',
                        NOME_ALVO: brechos[0]?.NOME_USUARIO || 'Brechó Exemplo',
                        USER_ALVO: brechos[0]?.USER_USUARIO || 'brecho_exemplo',
                        TIPO_ALVO: 'b',
                        IMG_ALVO: brechos[0]?.IMG_URL || '/imagens/imagem sem cadastro.avif'
                    }
                ];
                
                if (brechos.length > 1) {
                    denuncias.push({
                        ID_DENUNCIA: 2,
                        MOTIVO: 'Comportamento inadequado',
                        DESCRICAO: 'Vendedor está sendo agressivo com clientes nos comentários e não entrega produtos.',
                        DATA_DENUNCIA: new Date('2024-12-14'),
                        STATUS: 'analisada',
                        NOME_DENUNCIANTE: clientes[1]?.NOME_USUARIO || 'Outro Cliente',
                        USER_DENUNCIANTE: clientes[1]?.USER_USUARIO || 'outro_cliente',
                        NOME_ALVO: brechos[1]?.NOME_USUARIO || 'Segundo Brechó',
                        USER_ALVO: brechos[1]?.USER_USUARIO || 'segundo_brecho',
                        TIPO_ALVO: 'b',
                        IMG_ALVO: brechos[1]?.IMG_URL || '/imagens/imagem sem cadastro.avif'
                    });
                }
                
                if (clientes.length > 2) {
                    denuncias.push({
                        ID_DENUNCIA: 3,
                        MOTIVO: 'Comportamento inadequado',
                        DESCRICAO: 'Cliente fazendo comentários ofensivos em produtos de vendedores.',
                        DATA_DENUNCIA: new Date('2024-12-12'),
                        STATUS: 'resolvida',
                        NOME_DENUNCIANTE: brechos[0]?.NOME_USUARIO || 'Brechó Denunciante',
                        USER_DENUNCIANTE: brechos[0]?.USER_USUARIO || 'brecho_denunciante',
                        NOME_ALVO: clientes[2]?.NOME_USUARIO || 'Cliente Problema',
                        USER_ALVO: clientes[2]?.USER_USUARIO || 'cliente_problema',
                        TIPO_ALVO: 'c',
                        IMG_ALVO: '/imagens/imagem sem cadastro.avif'
                    });
                }
            }
        }
        
        res.render('pages/denuncias', {
            denuncias: denuncias || [],
            autenticado: req.session.autenticado || null
        });
    } catch (error) {
        console.log('Erro ao carregar denúncias:', error);
        res.render('pages/denuncias', {
            denuncias: [],
            autenticado: req.session.autenticado || null
        });
    }
});

router.post('/denuncias/criar', denunciaController.criarDenuncia);

router.post('/denuncias/analisar/:id', denunciaController.analisarDenuncia);

router.post('/denuncias/resolver/:id', denunciaController.resolverDenuncia);

router.post('/denuncias/rejeitar/:id', denunciaController.rejeitarDenuncia);

router.get('/denuncias/analisar/:id', denunciaController.analisarDenunciaDetalhada);

router.get('/analisardenuncia', (req, res) => res.render('pages/analisardenuncia'));
router.get('/perfilpremium', verificarUsuAutenticado, verificarAdmin, async (req, res) => {
    const defaultStats = {
        totalPremium: 0,
        receitaMensal: 0,
        taxaConversao: 0,
        taxaRetencao: 89
    };
    
    try {
        let estatisticas = defaultStats;
        let usuariosPremium = [];
        let usuariosPremiumHtml = '<p>Nenhum usuário premium encontrado</p>';
        
        try {
            // Buscar estatísticas premium
            const [totalPremiumResult] = await pool.query('SELECT COUNT(*) as total FROM USUARIOS WHERE PLANO_PREMIUM IS NOT NULL');
            const [totalUsuarios] = await pool.query('SELECT COUNT(*) as total FROM USUARIOS');
            
            estatisticas = {
                totalPremium: totalPremiumResult[0]?.total || 0,
                receitaMensal: 0, // Valor padrão
                taxaConversao: totalUsuarios[0]?.total > 0 ? ((totalPremiumResult[0]?.total || 0) / totalUsuarios[0].total) * 100 : 0,
                taxaRetencao: 89
            };
            
            // Buscar usuários premium
            const [usuarios] = await pool.query(`
                SELECT u.ID_USUARIO, u.NOME_USUARIO, u.IMG_URL, u.DATA_CADASTRO, u.PLANO_PREMIUM
                FROM USUARIOS u
                WHERE u.PLANO_PREMIUM IS NOT NULL
                ORDER BY u.DATA_CADASTRO DESC
                LIMIT 10
            `);
            usuariosPremium = usuarios;
            
            // Gerar HTML no backend
            if (usuariosPremium && usuariosPremium.length > 0) {
                usuariosPremiumHtml = usuariosPremium.map(usuario => {
                    const imgUrl = usuario.IMG_URL || '/imagens/icone sem cadastro.png';
                    const plano = usuario.PLANO_PREMIUM || 'Básico';
                    const dataFormatada = new Date(usuario.DATA_PREMIUM || usuario.DATA_CADASTRO).toLocaleDateString('pt-BR');
                    
                    return `
                        <section class="user-item">
                            <img src="${imgUrl}" alt="User">
                            <section class="user-info">
                                <strong>${usuario.NOME_USUARIO}</strong>
                                <span>${plano} - ${dataFormatada}</span>
                            </section>
                            <section class="user-buttons">
                                <button class="btn-view" onclick="verUsuario(${usuario.ID_USUARIO})">Ver</button>
                                <button class="btn-suspend" onclick="suspenderPremium(${usuario.ID_USUARIO})">Suspender</button>
                            </section>
                        </section>
                    `;
                }).join('');
            }
        } catch (dbError) {
            console.log('Erro no banco, usando valores padrão:', dbError.message);
        }
        
        res.render('pages/perfilpremium', {
            estatisticas: estatisticas,
            usuariosPremium: usuariosPremium,
            usuariosPremiumHtml: usuariosPremiumHtml
        });
    } catch (error) {
        console.log('Erro geral ao carregar perfil premium:', error);
        res.render('pages/perfilpremium', {
            estatisticas: defaultStats,
            usuariosPremium: [],
            usuariosPremiumHtml: '<p>Nenhum usuário premium encontrado</p>'
        });
    }
});
router.get('/blogadm', verificarUsuAutenticado, verificarAdmin, async (req, res) => {
    try {
        console.log('=== CARREGANDO BLOG ADM ===');
        
        let posts = [];
        
        try {
            // Verificar se a tabela existe
            const [tabelas] = await pool.query("SHOW TABLES LIKE 'ARTIGOS_BLOG'");
            console.log('Tabela ARTIGOS_BLOG existe:', tabelas.length > 0 ? 'SIM' : 'NÃO');
            
            if (tabelas.length > 0) {
                // Buscar artigos do banco
                const [artigos] = await pool.query(`
                    SELECT ab.ID_ARTIGO, ab.TITULO, 
                           SUBSTRING(ab.CONTEUDO, 1, 100) as CONTEUDO, 
                           ab.AUTOR, 
                           DATE_FORMAT(ab.DT_PUBLICACAO, '%Y-%m-%d') as DT_PUBLICACAO,
                           COALESCE(cb.NOME_CATEGORIA_BLOG, 'Moda') as CATEGORIA
                    FROM ARTIGOS_BLOG ab
                    LEFT JOIN CATEGORIAS_BLOG cb ON ab.ID_CATEGORIA_BLOG = cb.ID_CATEGORIA_BLOG
                    ORDER BY ab.DT_PUBLICACAO DESC
                `);
                
                console.log('Artigos encontrados no banco:', artigos.length);
                
                if (artigos.length === 0) {
                    console.log('Banco vazio, inserindo artigos...');
                    
                    // Garantir que existe categoria
                    await pool.query('INSERT IGNORE INTO CATEGORIAS_BLOG (ID_CATEGORIA_BLOG, NOME_CATEGORIA_BLOG) VALUES (1, "Moda")');
                    
                    // Inserir artigos básicos
                    const artigosParaInserir = [
                        { titulo: 'METALIZADO: 7 LOOKS PARA VOCÊ SE INSPIRAR', conteudo: 'O metalizado se destaca em 2024 como uma tendência versátil que pode ser incorporada em diversos looks.', data: '2024-11-05' },
                        { titulo: 'BOSS | Milão Verão 2024', conteudo: 'A marca alemã BOSS apresentou em Milão sua coleção verão 2024 com foco na elegância contemporânea.', data: '2024-11-03' },
                        { titulo: 'Gucci | Milão Verão 2024', conteudo: 'Sob a direção criativa de Sabato De Sarno, a Gucci apresenta uma nova visão para o verão 2024.', data: '2024-10-25' },
                        { titulo: 'TENDÊNCIA SUSTENTÁVEL', conteudo: 'A moda sustentável deixou de ser apenas uma tendência para se tornar uma necessidade.', data: '2024-10-20' },
                        { titulo: 'SWEET VINTAGE', conteudo: 'O estilo vintage continua conquistando corações e guarda-roupas ao redor do mundo.', data: '2024-10-15' }
                    ];
                    
                    for (const artigo of artigosParaInserir) {
                        try {
                            await pool.query(`
                                INSERT INTO ARTIGOS_BLOG (TITULO, CONTEUDO, AUTOR, DT_PUBLICACAO, ID_ADM, ID_CATEGORIA_BLOG)
                                VALUES (?, ?, 'Vintélo Fashion', ?, 1, 1)
                            `, [artigo.titulo, artigo.conteudo, artigo.data]);
                        } catch (e) {
                            console.log('Erro ao inserir artigo:', artigo.titulo, e.message);
                        }
                    }
                    
                    // Buscar artigos novamente
                    const [novosArtigos] = await pool.query(`
                        SELECT ab.ID_ARTIGO, ab.TITULO, 
                               SUBSTRING(ab.CONTEUDO, 1, 100) as CONTEUDO, 
                               ab.AUTOR, 
                               DATE_FORMAT(ab.DT_PUBLICACAO, '%Y-%m-%d') as DT_PUBLICACAO,
                               'Moda' as CATEGORIA
                        FROM ARTIGOS_BLOG ab
                        ORDER BY ab.DT_PUBLICACAO DESC
                    `);
                    
                    posts = novosArtigos;
                    console.log('Artigos inseridos e carregados:', posts.length);
                } else {
                    posts = artigos;
                }
            }
        } catch (dbError) {
            console.log('Erro de banco:', dbError.message);
        }
        
        // Se ainda não há posts, usar dados estáticos
        if (posts.length === 0) {
            console.log('Usando posts estáticos como fallback');
            posts = [
                {
                    ID_ARTIGO: 1,
                    TITULO: 'METALIZADO: 7 LOOKS PARA VOCÊ SE INSPIRAR',
                    CONTEUDO: 'O metalizado se destaca em 2024 como uma tendência versátil que pode ser incorporada em diversos looks.',
                    AUTOR: 'Vintélo Fashion',
                    DT_PUBLICACAO: '2024-11-05',
                    CATEGORIA: 'Moda'
                },
                {
                    ID_ARTIGO: 2,
                    TITULO: 'BOSS | Milão Verão 2024',
                    CONTEUDO: 'A marca alemã BOSS apresentou em Milão sua coleção verão 2024 com foco na elegância contemporânea.',
                    AUTOR: 'Vintélo Fashion',
                    DT_PUBLICACAO: '2024-11-03',
                    CATEGORIA: 'Moda'
                },
                {
                    ID_ARTIGO: 3,
                    TITULO: 'Gucci | Milão Verão 2024',
                    CONTEUDO: 'Sob a direção criativa de Sabato De Sarno, a Gucci apresenta uma nova visão para o verão 2024.',
                    AUTOR: 'Vintélo Fashion',
                    DT_PUBLICACAO: '2024-10-25',
                    CATEGORIA: 'Moda'
                },
                {
                    ID_ARTIGO: 4,
                    TITULO: 'TENDÊNCIA SUSTENTÁVEL',
                    CONTEUDO: 'A moda sustentável deixou de ser apenas uma tendência para se tornar uma necessidade.',
                    AUTOR: 'Vintélo Fashion',
                    DT_PUBLICACAO: '2024-10-20',
                    CATEGORIA: 'Sustentabilidade'
                },
                {
                    ID_ARTIGO: 5,
                    TITULO: 'SWEET VINTAGE',
                    CONTEUDO: 'O estilo vintage continua conquistando corações e guarda-roupas ao redor do mundo.',
                    AUTOR: 'Vintélo Fashion',
                    DT_PUBLICACAO: '2024-10-15',
                    CATEGORIA: 'Style'
                }
            ];
        }
        
        console.log('Renderizando blogadm com', posts.length, 'posts');
        res.render('pages/blogadm', { posts: posts });
    } catch (error) {
        console.log('Erro geral ao carregar blog admin:', error.message);
        
        // Fallback final com posts estáticos
        const postsEstaticos = [
            {
                ID_ARTIGO: 1,
                TITULO: 'METALIZADO: 7 LOOKS PARA VOCÊ SE INSPIRAR',
                CONTEUDO: 'O metalizado se destaca em 2024 como uma tendência versátil.',
                AUTOR: 'Vintélo Fashion',
                DT_PUBLICACAO: '2024-11-05',
                CATEGORIA: 'Moda'
            },
            {
                ID_ARTIGO: 2,
                TITULO: 'BOSS | Milão Verão 2024',
                CONTEUDO: 'A marca alemã BOSS apresentou sua coleção verão 2024.',
                AUTOR: 'Vintélo Fashion',
                DT_PUBLICACAO: '2024-11-03',
                CATEGORIA: 'Moda'
            }
        ];
        
        res.render('pages/blogadm', { posts: postsEstaticos });
    }
});

router.post('/blogadm/excluir/:id', async function(req, res){
    try {
        const { id } = req.params;
        
        console.log('Excluindo artigo ID:', id);
        
        const [resultado] = await pool.query('DELETE FROM ARTIGOS_BLOG WHERE ID_ARTIGO = ?', [id]);
        
        console.log('Artigo excluído - linhas afetadas:', resultado.affectedRows);
        
        if (resultado.affectedRows > 0) {
            console.log('Artigo excluído com sucesso:', id);
        } else {
            console.log('Nenhum artigo foi excluído - ID não encontrado:', id);
        }
        
        res.redirect('/blogadm');
    } catch (error) {
        console.log('Erro ao excluir artigo:', error.message);
        res.redirect('/blogadm?erro=Erro ao excluir artigo');
    }
});

// Função para inserir artigos fictícios no banco
async function inserirArtigosFicticios() {
    try {
        console.log('=== INSERINDO ARTIGOS FICTÍCIOS ===');
        
        // Verificar se a tabela CATEGORIAS_BLOG existe
        try {
            const [tabelaCategorias] = await pool.query("SHOW TABLES LIKE 'CATEGORIAS_BLOG'");
            if (tabelaCategorias.length === 0) {
                console.log('Tabela CATEGORIAS_BLOG não existe, criando categoria padrão...');
            }
        } catch (tableError) {
            console.log('Erro ao verificar tabela CATEGORIAS_BLOG:', tableError.message);
        }
        
        // Primeiro, garantir que existe pelo menos uma categoria
        let categoriaId = 1;
        try {
            let [categorias] = await pool.query('SELECT ID_CATEGORIA_BLOG FROM CATEGORIAS_BLOG LIMIT 1');
            
            if (categorias.length === 0) {
                console.log('Nenhuma categoria encontrada, criando categoria "Moda"...');
                const [novaCategoria] = await pool.query(
                    'INSERT INTO CATEGORIAS_BLOG (NOME_CATEGORIA_BLOG) VALUES (?)',
                    ['Moda']
                );
                categoriaId = novaCategoria.insertId;
                console.log('Categoria criada com ID:', categoriaId);
            } else {
                categoriaId = categorias[0].ID_CATEGORIA_BLOG;
                console.log('Usando categoria existente ID:', categoriaId);
            }
        } catch (catError) {
            console.log('Erro ao gerenciar categorias:', catError.message);
            console.log('Usando categoria ID padrão: 1');
        }
        
        // Inserir artigos sem ID_ADM (tornar campo opcional)
        let adminId = null;
        try {
            const [admins] = await pool.query('SELECT ID_ADM FROM ADMINISTRADORES LIMIT 1');
            adminId = admins[0]?.ID_ADM || null;
            console.log('Admin ID:', adminId);
        } catch (adminError) {
            console.log('Sem admin disponível, inserindo sem ID_ADM');
        }
        
        // Inserir artigos fictícios completos
        const artigos = [
            {
                titulo: 'METALIZADO: 7 LOOKS PARA VOCÊ SE INSPIRAR',
                conteudo: 'O metalizado se destaca em 2024 como uma tendência versátil que pode ser incorporada em diversos looks. Desde acessórios até peças principais, essa textura especial adiciona um toque futurista e sofisticado a qualquer produção. Confira nossas dicas para incorporar o metalizado no seu guarda-roupa de forma elegante e moderna. A tendência metalizada não é novidade, mas em 2024 ela ganha novas interpretações e formas de uso.',
                data: '2024-11-05'
            },
            {
                titulo: 'BOSS | Milão Verão 2024',
                conteudo: 'A marca alemã BOSS apresentou em Milão sua coleção verão 2024 com foco na elegância contemporânea. A BOSS trouxe para as passarelas de Milão uma proposta inovadora que combina a tradição da alfaiataria alemã com elementos contemporâneos. A coleção verão 2024 apresenta cortes precisos, tecidos nobres e uma paleta de cores que vai do clássico preto e branco aos tons terrosos.',
                data: '2024-11-03'
            },
            {
                titulo: 'Gucci | Milão Verão 2024',
                conteudo: 'Sob a direção criativa de Sabato De Sarno, a Gucci apresenta uma nova visão para o verão 2024. A Gucci entra em uma nova fase criativa com Sabato De Sarno à frente da direção criativa. A coleção verão 2024 marca um retorno às raízes da marca italiana, com foco na qualidade artesanal e no luxo discreto.',
                data: '2024-10-25'
            },
            {
                titulo: 'TENDÊNCIA SUSTENTÁVEL: MODA CONSCIENTE EM ALTA',
                conteudo: 'A moda sustentável deixou de ser apenas uma tendência para se tornar uma necessidade. Cada vez mais consumidores buscam alternativas ecológicas e socialmente responsáveis na hora de escolher suas roupas. Os brechós e o mercado de segunda mão ganham destaque como opções viáveis para quem quer se vestir bem sem agredir o meio ambiente.',
                data: '2024-10-20'
            },
            {
                titulo: 'SWEET VINTAGE: O CHARME DO RETRÔ MODERNO',
                conteudo: 'O estilo vintage continua conquistando corações e guarda-roupas ao redor do mundo. A mistura entre o charme do passado e a praticidade do presente cria looks únicos e cheios de personalidade. Peças dos anos 70, 80 e 90 voltam com força total, adaptadas ao contexto atual.',
                data: '2024-10-15'
            },
            {
                titulo: 'MODA CIRCULAR: O FUTURO SUSTENTÁVEL',
                conteudo: 'A moda circular representa uma revolução na indústria têxtil, propondo um modelo onde nada é desperdiçado. Este conceito vai além da reciclagem, criando um sistema onde as roupas são projetadas para durar, serem reparadas e reutilizadas. Os brechós são protagonistas nessa mudança.',
                data: '2024-10-10'
            },
            {
                titulo: 'TENDÊNCIAS OUTONO/INVERNO 2024',
                conteudo: 'O outono/inverno 2024 traz uma mistura interessante entre conforto e sofisticação. Cores terrosas dominam a paleta, enquanto texturas como veludo e lã ganham destaque. Os casacos oversized continuam em alta, assim como as botas de cano alto.',
                data: '2024-09-28'
            },
            {
                titulo: 'GUARDA-ROUPA CÁPSULA: MENOS É MAIS',
                conteudo: 'O guarda-roupa cápsula é uma filosofia de moda que prioriza qualidade sobre quantidade. Consiste em ter poucas peças versáteis que se combinam entre si, criando múltiplas possibilidades de looks. Esta abordagem economiza dinheiro e reduz o impacto ambiental.',
                data: '2024-09-15'
            }
        ];
        
        console.log('Inserindo', artigos.length, 'artigos...');
        
        for (let i = 0; i < artigos.length; i++) {
            const artigo = artigos[i];
            try {
                console.log(`Inserindo artigo ${i + 1}: ${artigo.titulo}`);
                
                const [resultado] = await pool.query(`
                    INSERT INTO ARTIGOS_BLOG (TITULO, CONTEUDO, AUTOR, DT_PUBLICACAO, ID_CATEGORIA_BLOG)
                    VALUES (?, ?, 'Vintélo Fashion', ?, ?)
                `, [artigo.titulo, artigo.conteudo, artigo.data, categoriaId]);
                
                console.log(`Artigo ${i + 1} inserido com ID:`, resultado.insertId);
                
                console.log(`Artigo ${i + 1} inserido com ID:`, resultado.insertId);
            } catch (artigoError) {
                console.log(`Erro ao inserir artigo ${i + 1}:`, artigoError.message);
            }
        }
        
        // Forçar commit das transações
        await pool.query('COMMIT');
        
        // Verificar quantos artigos foram realmente inseridos
        const [verificacao] = await pool.query('SELECT COUNT(*) as total FROM ARTIGOS_BLOG');
        console.log('Total de artigos no banco após inserção:', verificacao[0].total);
        
        if (verificacao[0].total === 0) {
            console.log('ATENÇÃO: Nenhum artigo foi inserido no banco!');
        }
        
        console.log('=== FIM DA INSERÇÃO ===');
    } catch (error) {
        console.log('Erro geral ao inserir artigos fictícios:', error.message);
        console.log('Stack trace:', error.stack);
    }
}

router.post('/blogadm', async function(req, res){
    try {
        const { titulo, conteudo, categoria } = req.body;
        
        if (!titulo || !conteudo) {
            return res.redirect('/blogadm?erro=Título e conteúdo são obrigatórios');
        }
        
        // Buscar ou criar categoria
        let categoriaId = 1;
        if (categoria) {
            const [categoriaExiste] = await pool.query(
                'SELECT ID_CATEGORIA_BLOG FROM CATEGORIAS_BLOG WHERE NOME_CATEGORIA_BLOG = ?',
                [categoria]
            );
            
            if (categoriaExiste.length > 0) {
                categoriaId = categoriaExiste[0].ID_CATEGORIA_BLOG;
            } else {
                const [novaCategoria] = await pool.query(
                    'INSERT INTO CATEGORIAS_BLOG (NOME_CATEGORIA_BLOG) VALUES (?)',
                    [categoria]
                );
                categoriaId = novaCategoria.insertId;
            }
        }
        
        // Inserir novo artigo sem ID_ADM
        await pool.query(`
            INSERT INTO ARTIGOS_BLOG (TITULO, CONTEUDO, AUTOR, DT_PUBLICACAO, ID_CATEGORIA_BLOG)
            VALUES (?, ?, 'Vintélo Fashion', CURDATE(), ?)
        `, [titulo, conteudo, categoriaId]);
        
        console.log('Novo artigo criado:', { titulo, categoria });
        res.redirect('/blogadm');
    } catch (error) {
        console.log('Erro ao criar artigo:', error);
        res.redirect('/blogadm?erro=Erro ao criar artigo');
    }
});

router.get('/editarpost/:id', verificarUsuAutenticado, verificarAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        console.log('=== GET EDITARPOST ===');
        console.log('ID recebido:', id);
        console.log('Sessão autenticada:', req.session?.autenticado);
        
        // Validar ID
        if (!id || isNaN(id)) {
            console.log('ID inválido:', id);
            return res.redirect('/blogadm?erro=ID do artigo inválido');
        }
        
        // Middleware já verificou autenticação e autorização
        
        console.log('Buscando artigo no banco...');
        
        // Primeiro verificar se a tabela existe
        const [tabelaExiste] = await pool.query("SHOW TABLES LIKE 'ARTIGOS_BLOG'");
        if (tabelaExiste.length === 0) {
            console.log('Tabela ARTIGOS_BLOG não existe');
            return res.redirect('/blogadm?erro=Sistema de blog não configurado');
        }
        
        const [artigo] = await pool.query(`
            SELECT ab.*, COALESCE(cb.NOME_CATEGORIA_BLOG, 'Moda') as CATEGORIA
            FROM ARTIGOS_BLOG ab
            LEFT JOIN CATEGORIAS_BLOG cb ON ab.ID_CATEGORIA_BLOG = cb.ID_CATEGORIA_BLOG
            WHERE ab.ID_ARTIGO = ?
        `, [parseInt(id)]);
        
        console.log('Artigos encontrados:', artigo.length);
        
        if (artigo.length === 0) {
            console.log('Artigo não encontrado');
            return res.redirect('/blogadm?erro=Artigo não encontrado');
        }
        
        console.log('Artigo carregado:', {
            id: artigo[0].ID_ARTIGO,
            titulo: artigo[0].TITULO,
            categoria: artigo[0].CATEGORIA
        });
        
        res.render('pages/editarpost', { 
            artigo: artigo[0],
            autenticado: req.session.autenticado
        });
    } catch (error) {
        console.log('ERRO ao carregar artigo:', error);
        res.redirect('/blogadm?erro=Erro interno do servidor');
    }
});

router.post('/editarpost/:id', verificarUsuAutenticado, verificarAdmin, async function(req, res){
    try {
        const { id } = req.params;
        const { titulo, conteudo, categoria, resumo } = req.body;
        
        console.log('=== POST EDITARPOST ===');
        console.log('ID do artigo:', id);
        console.log('Dados recebidos:', { titulo, categoria, resumo: resumo?.substring(0, 50) });
        
        // Validar ID
        if (!id || isNaN(id)) {
            console.log('ID inválido:', id);
            return res.redirect('/blogadm?erro=ID do artigo inválido');
        }
        
        // Middleware já verificou autenticação e autorização
        
        // Validar dados obrigatórios
        if (!titulo?.trim() || !conteudo?.trim()) {
            console.log('Erro: Campos obrigatórios vazios');
            return res.redirect(`/editarpost/${id}?erro=Título e conteúdo são obrigatórios`);
        }
        
        if (titulo.trim().length < 5) {
            return res.redirect(`/editarpost/${id}?erro=Título deve ter pelo menos 5 caracteres`);
        }
        
        if (conteudo.trim().length < 20) {
            return res.redirect(`/editarpost/${id}?erro=Conteúdo deve ter pelo menos 20 caracteres`);
        }
        
        // Verificar se o artigo existe
        const [artigoExiste] = await pool.query('SELECT ID_ARTIGO FROM ARTIGOS_BLOG WHERE ID_ARTIGO = ?', [parseInt(id)]);
        if (artigoExiste.length === 0) {
            console.log('Artigo não encontrado');
            return res.redirect('/blogadm?erro=Artigo não encontrado');
        }
        
        // Processar categoria
        let categoriaId = 1;
        if (categoria?.trim()) {
            try {
                // Verificar se categoria existe
                const [categoriaExiste] = await pool.query(
                    'SELECT ID_CATEGORIA_BLOG FROM CATEGORIAS_BLOG WHERE NOME_CATEGORIA_BLOG = ?',
                    [categoria.trim()]
                );
                
                if (categoriaExiste.length > 0) {
                    categoriaId = categoriaExiste[0].ID_CATEGORIA_BLOG;
                } else {
                    // Criar nova categoria
                    const [novaCategoria] = await pool.query(
                        'INSERT INTO CATEGORIAS_BLOG (NOME_CATEGORIA_BLOG) VALUES (?)',
                        [categoria.trim()]
                    );
                    categoriaId = novaCategoria.insertId;
                }
            } catch (catError) {
                console.log('Erro ao processar categoria:', catError);
                // Usar categoria padrão em caso de erro
            }
        }
        
        // Atualizar artigo
        console.log('Atualizando artigo...');
        const [resultado] = await pool.query(`
            UPDATE ARTIGOS_BLOG SET 
                TITULO = ?, 
                CONTEUDO = ?, 
                ID_CATEGORIA_BLOG = ?
                ${resumo ? ', RESUMO = ?' : ''}
            WHERE ID_ARTIGO = ?
        `, resumo ? 
            [titulo.trim(), conteudo.trim(), categoriaId, resumo.trim(), parseInt(id)] :
            [titulo.trim(), conteudo.trim(), categoriaId, parseInt(id)]
        );
        
        console.log('Resultado da atualização:', resultado.affectedRows, 'linhas afetadas');
        
        if (resultado.affectedRows === 0) {
            return res.redirect(`/editarpost/${id}?erro=Nenhuma alteração foi detectada`);
        }
        
        console.log('✅ Artigo atualizado com sucesso!');
        res.redirect('/blogadm?sucesso=Artigo atualizado com sucesso');
        
    } catch (error) {
        console.log('❌ ERRO ao atualizar artigo:', error);
        
        let mensagemErro = 'Erro interno do servidor';
        if (error.code === 'ER_DATA_TOO_LONG') {
            mensagemErro = 'Algum campo contém dados muito longos';
        } else if (error.code === 'ER_BAD_NULL_ERROR') {
            mensagemErro = 'Campo obrigatório não pode estar vazio';
        } else if (error.code === 'ER_NO_SUCH_TABLE') {
            mensagemErro = 'Tabela do blog não encontrada';
        }
        
        res.redirect(`/editarpost/${req.params.id}?erro=${encodeURIComponent(mensagemErro)}`);
    }
});

router.get('/editarpost', (req, res) => res.redirect('/blogadm'));

// Rota de teste para verificar se a tabela existe
router.get('/test-blog', async (req, res) => {
    try {
        console.log('=== TESTE DO SISTEMA DE BLOG ===');
        
        // Verificar se as tabelas existem
        const [tabelaArtigos] = await pool.query("SHOW TABLES LIKE 'ARTIGOS_BLOG'");
        const [tabelaCategorias] = await pool.query("SHOW TABLES LIKE 'CATEGORIAS_BLOG'");
        
        console.log('Tabela ARTIGOS_BLOG existe:', tabelaArtigos.length > 0);
        console.log('Tabela CATEGORIAS_BLOG existe:', tabelaCategorias.length > 0);
        
        if (tabelaArtigos.length === 0) {
            return res.json({ 
                success: false, 
                message: 'Tabela ARTIGOS_BLOG não existe',
                tables: { artigos: false, categorias: tabelaCategorias.length > 0 }
            });
        }
        
        // Contar artigos
        const [countArtigos] = await pool.query('SELECT COUNT(*) as total FROM ARTIGOS_BLOG');
        console.log('Total de artigos:', countArtigos[0].total);
        
        // Buscar alguns artigos para teste
        const [artigos] = await pool.query('SELECT ID_ARTIGO, TITULO FROM ARTIGOS_BLOG LIMIT 5');
        
        res.json({
            success: true,
            message: 'Sistema de blog funcionando',
            data: {
                totalArtigos: countArtigos[0].total,
                artigos: artigos,
                tables: { artigos: true, categorias: tabelaCategorias.length > 0 }
            }
        });
    } catch (error) {
        console.log('Erro no teste:', error);
        res.json({ success: false, message: 'Erro: ' + error.message });
    }
});

router.get('/avaliacaoadm', verificarUsuAutenticado, verificarAdmin, async (req, res) => {
    try {
        // Como não há tabela AVALIACOES, usar dados simulados baseados em usuários reais
        const [usuarios] = await pool.query(`
            SELECT u.ID_USUARIO as ID_AVALIACAO, u.NOME_USUARIO, u.IMG_URL,
                   u.DATA_CADASTRO as DATA_AVALIACAO,
                   CASE 
                       WHEN u.ID_USUARIO % 3 = 0 THEN 5
                       WHEN u.ID_USUARIO % 3 = 1 THEN 4
                       ELSE 3
                   END as NOTA,
                   CASE 
                       WHEN u.ID_USUARIO % 4 = 0 THEN 'Excelente plataforma! Produtos de qualidade e entrega rápida.'
                       WHEN u.ID_USUARIO % 4 = 1 THEN 'Muito bom, recomendo! Ótima experiência de compra.'
                       WHEN u.ID_USUARIO % 4 = 2 THEN 'Bom atendimento e produtos conforme descrição.'
                       ELSE 'Plataforma confiável, continuarei comprando aqui.'
                   END as COMENTARIO
            FROM USUARIOS u
            WHERE u.TIPO_USUARIO = 'c'
            ORDER BY u.DATA_CADASTRO DESC
            LIMIT 20
        `);
        
        res.render('pages/avaliacaoadm', { avaliacoes: usuarios || [] });
    } catch (error) {
        console.log('Erro ao carregar avaliações admin:', error);
        res.render('pages/avaliacaoadm', { avaliacoes: [] });
    }
});

router.post('/avaliacaoadm/excluir/:id', async (req, res) => {
    try {
        // Simula exclusão já que não há tabela AVALIACOES real
        res.json({ success: true, message: 'Avaliação removida com sucesso!' });
    } catch (error) {
        console.log('Erro ao excluir avaliação:', error);
        res.json({ success: false, message: 'Erro ao excluir avaliação' });
    }
});


router.get('/brechoadm', async (req, res) => {
    try {
        // Buscar usuários tipo brechó
        const [brechos] = await pool.query(`
            SELECT u.ID_USUARIO, u.NOME_USUARIO, u.EMAIL_USUARIO, u.CELULAR_USUARIO, 
                   u.DATA_CADASTRO, u.IMG_URL, COALESCE(u.STATUS_USUARIO, 'a') as STATUS_USUARIO,
                   COUNT(p.ID_PRODUTO) as TOTAL_PRODUTOS
            FROM USUARIOS u
            LEFT JOIN PRODUTOS p ON u.ID_USUARIO = p.ID_USUARIO AND p.STATUS_PRODUTO = 'd'
            WHERE u.TIPO_USUARIO = 'b'
            GROUP BY u.ID_USUARIO
            ORDER BY u.DATA_CADASTRO DESC
        `);
        
        console.log('Brechós encontrados:', brechos.length);
        res.render('pages/brechoadm', { brechos: brechos || [] });
    } catch (error) {
        console.log('Erro ao carregar brechós admin:', error);
        res.render('pages/brechoadm', { brechos: [] });
    }
});
router.get('/usuariosadm', async (req, res) => {
    try {
        const [usuarios] = await pool.query(`
            SELECT u.ID_USUARIO, u.NOME_USUARIO, u.USER_USUARIO, u.EMAIL_USUARIO, 
                   u.CELULAR_USUARIO, u.DATA_CADASTRO, u.IMG_URL, 
                   COALESCE(u.STATUS_USUARIO, 'a') as STATUS_USUARIO
            FROM USUARIOS u
            WHERE u.TIPO_USUARIO = 'c'
            ORDER BY u.DATA_CADASTRO DESC
        `);
        
        // Processar ações no backend
        const usuariosComAcoes = usuarios.map(usuario => {
            const acoes = `
                <button class="btn-visualizar" onclick="visualizarPerfil(${usuario.ID_USUARIO})">Visualizar</button>
                ${usuario.STATUS_USUARIO === 'a' ? 
                    `<button class="btn-suspender" onclick="suspenderPerfil(${usuario.ID_USUARIO})">Suspender</button>` :
                    `<button class="btn-reativar" onclick="reativarPerfil(${usuario.ID_USUARIO})">Reativar</button>`
                }
                <button class="btn-historico" onclick="verHistorico(${usuario.ID_USUARIO})">Histórico</button>
            `;
            return { ...usuario, acoes };
        });
        
        res.render('pages/usuariosadm', { usuarios: usuariosComAcoes || [] });
    } catch (error) {
        console.log('Erro ao carregar usuários admin:', error);
        res.render('pages/usuariosadm', { usuarios: [] });
    }
});

router.get('/produtosadm', verificarUsuAutenticado, verificarAdmin, async (req, res) => {
    try {
        const [produtos] = await pool.query(`
            SELECT p.ID_PRODUTO, p.NOME_PRODUTO, p.PRECO, p.TIPO_PRODUTO, p.TAMANHO_PRODUTO,
                   p.COR_PRODUTO, p.ESTILO_PRODUTO, p.CONDICAO_PRODUTO, p.STATUS_PRODUTO,
                   p.DATA_CADASTRO, p.DETALHES_PRODUTO,
                   u.NOME_USUARIO as VENDEDOR,
                   img.URL_IMG
            FROM PRODUTOS p
            JOIN USUARIOS u ON p.ID_USUARIO = u.ID_USUARIO
            LEFT JOIN IMG_PRODUTOS img ON p.ID_PRODUTO = img.ID_PRODUTO
            GROUP BY p.ID_PRODUTO
            ORDER BY p.DATA_CADASTRO DESC
        `);
        
        res.render('pages/produtosadm', { 
            produtos: produtos || [],
            autenticado: req.session ? req.session.autenticado : null
        });
    } catch (error) {
        console.log('Erro ao carregar produtos admin:', error);
        res.render('pages/produtosadm', { 
            produtos: [],
            autenticado: req.session ? req.session.autenticado : null
        });
    }
});

router.post('/produtosadm/status', async (req, res) => {
    try {
        const { produtoId, status } = req.body;
        
        await pool.query('UPDATE PRODUTOS SET STATUS_PRODUTO = ? WHERE ID_PRODUTO = ?', [status, produtoId]);
        
        res.json({ success: true, message: 'Status alterado com sucesso' });
    } catch (error) {
        console.log('Erro ao alterar status:', error);
        res.json({ success: false, message: 'Erro interno do servidor' });
    }
});

router.get('/detalheprodutoadm', async (req, res) => {
    try {
        const { id } = req.query;
        
        if (!id) {
            return res.redirect('/produtosadm');
        }
        
        const [produto] = await pool.query(`
            SELECT p.*, u.NOME_USUARIO as NOME_BRECHO, img.URL_IMG as IMAGEM_PRODUTO
            FROM PRODUTOS p
            JOIN USUARIOS u ON p.ID_USUARIO = u.ID_USUARIO
            LEFT JOIN IMG_PRODUTOS img ON p.ID_PRODUTO = img.ID_PRODUTO
            WHERE p.ID_PRODUTO = ?
            GROUP BY p.ID_PRODUTO
        `, [id]);
        
        res.render('pages/detalheprodutoadm', {
            produto: produto[0] || null
        });
    } catch (error) {
        console.log('Erro ao carregar detalhe produto:', error);
        res.redirect('/produtosadm');
    }
});

router.get('/produtosadm/detalhes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [produto] = await pool.query(`
            SELECT p.*, u.NOME_USUARIO as VENDEDOR, img.URL_IMG
            FROM PRODUTOS p
            JOIN USUARIOS u ON p.ID_USUARIO = u.ID_USUARIO
            LEFT JOIN IMG_PRODUTOS img ON p.ID_PRODUTO = img.ID_PRODUTO
            WHERE p.ID_PRODUTO = ?
            GROUP BY p.ID_PRODUTO
        `, [id]);
        
        if (produto.length > 0) {
            res.json({ success: true, data: produto[0] });
        } else {
            res.json({ success: false, message: 'Produto não encontrado' });
        }
    } catch (error) {
        console.log('Erro ao buscar detalhes:', error);
        res.json({ success: false, message: 'Erro interno do servidor' });
    }
});

router.post('/produtosadm/excluir', verificarUsuAutenticado, async (req, res) => {
    try {
        const { produtoId } = req.body;
        
        console.log('=== EXCLUSÃO DE PRODUTO ADMIN ===');
        console.log('Produto ID:', produtoId);
        console.log('Usuário:', req.session.autenticado);
        
        // Verificar se o usuário é admin
        if (!req.session.autenticado || req.session.autenticado.tipo !== 'a') {
            console.log('Acesso negado - usuário não é admin');
            return res.json({ success: false, message: 'Acesso negado. Apenas administradores podem excluir produtos.' });
        }
        
        // Validar ID do produto
        if (!produtoId || isNaN(produtoId)) {
            console.log('ID do produto inválido:', produtoId);
            return res.json({ success: false, message: 'ID do produto inválido' });
        }
        
        // Verificar se o produto existe
        const [produtoExiste] = await pool.query('SELECT ID_PRODUTO, NOME_PRODUTO FROM PRODUTOS WHERE ID_PRODUTO = ?', [produtoId]);
        
        if (produtoExiste.length === 0) {
            console.log('Produto não encontrado:', produtoId);
            return res.json({ success: false, message: 'Produto não encontrado' });
        }
        
        console.log('Excluindo produto:', produtoExiste[0].NOME_PRODUTO);
        
        // Iniciar transação para garantir integridade
        await pool.query('START TRANSACTION');
        
        try {
            // Excluir registros relacionados primeiro (ordem importante)
            
            // 1. Excluir das tabelas de relacionamento
            await pool.query('DELETE FROM FAVORITOS WHERE ID_ITEM = ? AND TIPO_ITEM = "produto"', [produtoId]);
            console.log('Favoritos removidos');
            
            await pool.query('DELETE FROM ITENS_SACOLA WHERE ID_PRODUTO = ?', [produtoId]);
            console.log('Itens da sacola removidos');
            
            // 2. Excluir imagens do produto
            const [imagensResult] = await pool.query('DELETE FROM IMG_PRODUTOS WHERE ID_PRODUTO = ?', [produtoId]);
            console.log('Imagens removidas:', imagensResult.affectedRows);
            
            // 3. Excluir o produto
            const [produtoResult] = await pool.query('DELETE FROM PRODUTOS WHERE ID_PRODUTO = ?', [produtoId]);
            console.log('Produto removido:', produtoResult.affectedRows);
            
            if (produtoResult.affectedRows === 0) {
                throw new Error('Falha ao excluir o produto da tabela principal');
            }
            
            // Confirmar transação
            await pool.query('COMMIT');
            
            console.log('Produto excluído com sucesso!');
            res.json({ success: true, message: 'Produto excluído com sucesso' });
            
        } catch (transactionError) {
            // Reverter transação em caso de erro
            await pool.query('ROLLBACK');
            throw transactionError;
        }
        
    } catch (error) {
        console.log('Erro detalhado ao excluir produto:', error);
        
        // Tratar erros específicos
        let mensagemErro = 'Erro interno do servidor';
        
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            mensagemErro = 'Não é possível excluir este produto pois ele possui referências em outras tabelas';
        } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            mensagemErro = 'Erro de integridade referencial';
        } else if (error.message.includes('Falha ao excluir')) {
            mensagemErro = error.message;
        }
        
        res.json({ success: false, message: mensagemErro });
    }
});

router.post('/premium/atualizar-plano', atualizarPlano);
router.post('/premium/alternar-status', alternarStatusPlano);

// Rotas para gestão de planos do usuário
router.post('/planos/contratar', verificarUsuAutenticado, async (req, res) => {
    try {
        const { planoId, nomePlano, preco } = req.body;
        const userId = req.session.autenticado.id;
        
        console.log('=== CONTRATAR PLANO ===');
        console.log('Dados recebidos:', { planoId, nomePlano, preco, userId });
        
        // Verificar se já tem plano ativo (usando campo PLANO_PREMIUM na tabela USUARIOS)
        const [usuario] = await pool.query(
            'SELECT PLANO_PREMIUM FROM USUARIOS WHERE ID_USUARIO = ?',
            [userId]
        );
        
        if (usuario.length > 0 && usuario[0].PLANO_PREMIUM) {
            return res.json({ success: false, message: 'Você já possui um plano ativo: ' + usuario[0].PLANO_PREMIUM });
        }
        
        // Atualizar usuário com o novo plano (método simplificado)
        const [resultado] = await pool.query(
            'UPDATE USUARIOS SET PLANO_PREMIUM = ? WHERE ID_USUARIO = ?',
            [nomePlano, userId]
        );
        
        console.log('Resultado da atualização:', resultado);
        
        if (resultado.affectedRows > 0) {
            console.log('Plano contratado com sucesso!');
            res.json({ success: true, message: 'Plano ' + nomePlano + ' contratado com sucesso!' });
        } else {
            console.log('Falha ao contratar plano');
            res.json({ success: false, message: 'Falha ao contratar o plano' });
        }
    } catch (error) {
        console.log('Erro detalhado ao contratar plano:', error);
        res.json({ success: false, message: 'Erro interno: ' + error.message });
    }
});

router.post('/planos/cancelar', verificarUsuAutenticado, async (req, res) => {
    try {
        const userId = req.session.autenticado.id;
        
        console.log('=== CANCELAR PLANO ===');
        console.log('Usuário ID:', userId);
        
        // Remover plano premium do usuário
        const [resultado] = await pool.query(
            'UPDATE USUARIOS SET PLANO_PREMIUM = NULL WHERE ID_USUARIO = ?',
            [userId]
        );
        
        console.log('Resultado do cancelamento:', resultado);
        
        if (resultado.affectedRows > 0) {
            res.json({ success: true, message: 'Plano cancelado com sucesso!' });
        } else {
            res.json({ success: false, message: 'Nenhum plano encontrado para cancelar' });
        }
    } catch (error) {
        console.log('Erro ao cancelar plano:', error);
        res.json({ success: false, message: 'Erro interno: ' + error.message });
    }
});

router.post('/planos/alterar', verificarUsuAutenticado, async (req, res) => {
    try {
        const { novoPlanoId, nomePlano, preco } = req.body;
        const userId = req.session.autenticado.id;
        
        console.log('=== ALTERAR PLANO ===');
        console.log('Dados recebidos:', { novoPlanoId, nomePlano, preco, userId });
        
        // Atualizar usuário com o novo plano
        const [resultado] = await pool.query(
            'UPDATE USUARIOS SET PLANO_PREMIUM = ? WHERE ID_USUARIO = ?',
            [nomePlano, userId]
        );
        
        console.log('Resultado da alteração:', resultado);
        
        if (resultado.affectedRows > 0) {
            res.json({ success: true, message: 'Plano alterado para ' + nomePlano + ' com sucesso!' });
        } else {
            res.json({ success: false, message: 'Falha ao alterar o plano' });
        }
    } catch (error) {
        console.log('Erro ao alterar plano:', error);
        res.json({ success: false, message: 'Erro interno: ' + error.message });
    }
});


router.post('/adicionar-carrinho', compraController.adicionarAoCarrinho);
router.get('/carrinho', compraController.mostrarCarrinho);
router.post('/atualizar-quantidade', compraController.atualizarQuantidade);
router.post('/remover-item', compraController.removerItem);
router.get('/finalizar-compra', compraController.finalizarCompra);
router.post('/limpar-carrinho', compraController.limparCarrinho);
router.get('/confirmar-pedido', compraController.confirmarPedido);


router.post('/processar-pagamento', pagamentoController.processarPagamento);

// Integração com notificações por email
const emailService = require('../services/emailService');

// Notificar por email após pedido confirmado
router.post('/notificar-pedido', verificarUsuAutenticado, async (req, res) => {
    try {
        const { pedidoId } = req.body;
        const userId = req.session.autenticado.id;
        
        await emailService.notificarPedido(userId, pedidoId);
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false });
    }
});

// Salvar token de push notification
router.post('/salvar-push-token', verificarUsuAutenticado, async (req, res) => {
    try {
        const { subscription } = req.body;
        const userId = req.session.autenticado.id;
        
        // Usar campo DESCRICAO_USUARIO para armazenar token (reutilizando campo existente)
        await pool.query('UPDATE USUARIOS SET DESCRICAO_USUARIO = ? WHERE ID_USUARIO = ?', 
            [JSON.stringify(subscription), userId]);
        
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false });
    }
});

// Enviar notificação SMS usando estrutura existente de recuperação de senha
router.post('/enviar-sms', verificarUsuAutenticado, async (req, res) => {
    try {
        const { mensagem } = req.body;
        const userId = req.session.autenticado.id;
        
        const [usuario] = await pool.query('SELECT CELULAR_USUARIO, NOME_USUARIO FROM USUARIOS WHERE ID_USUARIO = ?', [userId]);
        
        if (usuario.length > 0) {
            // Simular envio de SMS (usar mesma lógica do código de recuperação)
            console.log(`SMS para ${usuario[0].CELULAR_USUARIO}: ${mensagem}`);
            
            // Salvar na tabela EMAILS como histórico (reutilizando estrutura)
            await pool.query('INSERT INTO EMAILS (ID_USUARIO, EMAIL_USUARIO, ASSUNTO, MENSAGEM) VALUES (?, ?, ?, ?)', 
                [userId, usuario[0].CELULAR_USUARIO, 'SMS', mensagem]);
        }
        
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false });
    }
});

// Criar pedido de exemplo para demonstração
router.post('/criar-pedido-exemplo', verificarUsuAutenticado, async (req, res) => {
    try {
        const userId = req.session.autenticado.id;
        const { produtoId, valor } = req.body;
        
        // Inserir pedido na tabela PEDIDOS
        const [resultado] = await pool.query(`
            INSERT INTO PEDIDOS (ID_USUARIO, DT_PEDIDO, VALOR_TOTAL, STATUS_PEDIDO, CODIGO_RASTREIO)
            VALUES (?, NOW(), ?, 'Enviado', ?)
        `, [userId, valor || 89.90, 'VT' + Date.now()]);
        
        // Notificar por email
        await emailService.notificarPedido(userId, resultado.insertId);
        
        res.json({ success: true, pedidoId: resultado.insertId });
    } catch (error) {
        console.log('Erro ao criar pedido exemplo:', error);
        res.json({ success: false });
    }
});
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

// Rota para contar itens da sacola
router.get('/sacola/count', verificarUsuAutenticado, async function(req, res){
    try {
        const userId = req.session.autenticado.id;
        
        const [result] = await pool.query(`
            SELECT SUM(is.QUANTIDADE) as total
            FROM ITENS_SACOLA is
            JOIN SACOLA s ON is.ID_SACOLA = s.ID_SACOLA
            WHERE s.ID_USUARIO = ?
        `, [userId]);
        
        const count = result[0]?.total || 0;
        res.json({ count: count });
    } catch (error) {
        console.log('Erro ao contar itens da sacola:', error);
        res.json({ count: 0 });
    }
});


router.post('/favoritar', verificarUsuAutenticado, async function(req, res){
    try {
        const { produto_id, tipo } = req.body;
        const userId = req.session.autenticado.id;
        const tipoItem = tipo === 'sacola' ? 'sacola' : 'produto';
        
        // Verificar se já está favoritado/na sacola
        const [existing] = await pool.query(
            'SELECT * FROM FAVORITOS WHERE ID_ITEM = ? AND ID_USUARIO = ? AND TIPO_ITEM = ?',
            [produto_id, userId, tipoItem]
        );
        
        if (existing.length > 0) {
            // Se existe, alternar status
            const newStatus = existing[0].STATUS_FAVORITO === 'favoritado' ? 'nulo' : 'favoritado';
            await pool.query(
                'UPDATE FAVORITOS SET STATUS_FAVORITO = ? WHERE ID_ITEM = ? AND ID_USUARIO = ? AND TIPO_ITEM = ?',
                [newStatus, produto_id, userId, tipoItem]
            );
            res.json({ success: true, favorited: newStatus === 'favoritado' });
        } else {
            // Se não existe, criar novo
            await pool.query(
                'INSERT INTO FAVORITOS (ID_ITEM, ID_USUARIO, STATUS_FAVORITO, TIPO_ITEM, DATA_FAVORITO) VALUES (?, ?, "favoritado", ?, NOW())',
                [produto_id, userId, tipoItem]
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

// API endpoint para busca (usado pelo JavaScript)
router.get('/api/buscar', async function(req, res){
    const termo = req.query.q || '';
    
    try {
        let produtos = [];
        let brechos = [];
        
        if (termo.trim()) {
            // Buscar produtos
            const [produtosResult] = await pool.query(`
                SELECT p.ID_PRODUTO, p.NOME_PRODUTO, p.PRECO, p.TIPO_PRODUTO, 
                       p.COR_PRODUTO, p.ESTILO_PRODUTO, p.CONDICAO_PRODUTO,
                       img.URL_IMG, u.NOME_USUARIO as VENDEDOR
                FROM PRODUTOS p
                LEFT JOIN IMG_PRODUTOS img ON p.ID_PRODUTO = img.ID_PRODUTO
                LEFT JOIN USUARIOS u ON p.ID_USUARIO = u.ID_USUARIO
                WHERE p.STATUS_PRODUTO = 'd' AND (
                    p.NOME_PRODUTO LIKE ? OR 
                    p.TIPO_PRODUTO LIKE ? OR 
                    p.COR_PRODUTO LIKE ?
                )
                GROUP BY p.ID_PRODUTO
                LIMIT 20
            `, [`%${termo}%`, `%${termo}%`, `%${termo}%`]);
            
            produtos = produtosResult;
            
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
            
            brechos = brechosResult;
        }
        
        res.json({
            produtos: produtos,
            brechos: brechos,
            termo: termo
        });
        
    } catch (error) {
        res.json({
            produtos: [],
            brechos: [],
            termo: termo
        });
    }
});




router.post('/api/seguir-brecho', verificarUsuAutenticado, async function(req, res){
    try {
        const { brechoId, action } = req.body;
        const userId = req.session.autenticado.id;

        console.log('Seguir brechó - Dados recebidos:', { brechoId, action, userId });

        if (action === 'follow') {
            try {
                await pool.query(
                    'INSERT IGNORE INTO FAVORITOS (ID_ITEM, ID_USUARIO, STATUS_FAVORITO, TIPO_ITEM, DATA_FAVORITO) VALUES (?, ?, "favoritado", "brecho", NOW())',
                    [brechoId, userId]
                );
            } catch (insertError) {
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
        
        // Contar seguidores atualizados
        const [seguidores] = await pool.query(
            'SELECT COUNT(*) as total FROM FAVORITOS WHERE ID_ITEM = ? AND TIPO_ITEM = "brecho" AND STATUS_FAVORITO = "favoritado"',
            [brechoId]
        );
        
        res.json({ 
            success: true, 
            seguidores: seguidores[0]?.total || 0 
        });
    } catch (error) {
        console.log('Erro ao seguir brechó:', error);
        res.json({ success: false, message: 'Erro interno: ' + error.message });
    }
});

router.get('/api/verificar-seguindo/:brechoId', async function(req, res){
    try {
        const { brechoId } = req.params;
        
        if (!req.session.autenticado) {
            return res.json({ seguindo: false });
        }
        
        const userId = req.session.autenticado.id;
        
        const [favorito] = await pool.query(
            'SELECT STATUS_FAVORITO FROM FAVORITOS WHERE ID_ITEM = ? AND ID_USUARIO = ? AND TIPO_ITEM = "brecho"',
            [brechoId, userId]
        );
        
        const seguindo = favorito.length > 0 && favorito[0].STATUS_FAVORITO === 'favoritado';
        res.json({ seguindo: seguindo });
    } catch (error) {
        console.log('Erro ao verificar seguindo:', error);
        res.json({ seguindo: false });
    }
});

router.post('/api/favoritar-brecho', verificarUsuAutenticado, async function(req, res){
    try {
        const { brechoId, action } = req.body;
        const userId = req.session.autenticado.id;

        console.log('Favoritar brechó - Dados recebidos:', { brechoId, action, userId });

        if (action === 'favorite') {
            try {
                await pool.query(
                    'INSERT IGNORE INTO FAVORITOS (ID_ITEM, ID_USUARIO, STATUS_FAVORITO, TIPO_ITEM, DATA_FAVORITO) VALUES (?, ?, "favoritado", "brecho", NOW())',
                    [brechoId, userId]
                );
            } catch (insertError) {
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
        res.json({ success: false, message: 'Erro interno: ' + error.message });
    }
});

// Rotas para gestão de avaliações
router.get('/brecho/:id/avaliacoes', carregarDadosUsuario, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Buscar dados do brechó
        const [brecho] = await pool.query(
            'SELECT * FROM USUARIOS WHERE ID_USUARIO = ? AND TIPO_USUARIO = "b"',
            [id]
        );
        
        if (brecho.length === 0) {
            return res.redirect('/homecomprador');
        }
        
        // Buscar avaliações do brechó
        const [avaliacoes] = await pool.query(`
            SELECT ab.*, u.NOME_USUARIO, u.IMG_URL
            FROM AVALIACOES_BRECHOS ab
            JOIN USUARIOS u ON ab.ID_USUARIO = u.ID_USUARIO
            WHERE ab.ID_BRECHO = ?
            ORDER BY ab.DT_AVALIACAO DESC
        `, [id]);
        
        // Calcular média das avaliações
        const [mediaResult] = await pool.query(
            'SELECT AVG(NOTA) as media, COUNT(*) as total FROM AVALIACOES_BRECHOS WHERE ID_BRECHO = ?',
            [id]
        );
        
        const mediaAvaliacoes = parseFloat(mediaResult[0]?.media) || 0;
        const totalAvaliacoes = mediaResult[0]?.total || 0;
        
        res.render('pages/avaliacoes-brecho', {
            brecho: brecho[0],
            avaliacoes: avaliacoes,
            mediaAvaliacoes: mediaAvaliacoes,
            totalAvaliacoes: totalAvaliacoes,
            autenticado: req.session.autenticado || null
        });
    } catch (error) {
        console.log('Erro ao carregar avaliações:', error);
        res.redirect('/homecomprador');
    }
});

// Rota alternativa para avaliacoes-brecho (compatibilidade)
router.get('/avaliacoes-brecho/:id?', carregarDadosUsuario, async (req, res) => {
    try {
        const brechoId = req.params.id || req.query.brecho;
        
        if (!brechoId) {
            return res.redirect('/homecomprador');
        }
        
        // Buscar dados do brechó
        const [brecho] = await pool.query(
            'SELECT * FROM USUARIOS WHERE ID_USUARIO = ? AND TIPO_USUARIO = "b"',
            [brechoId]
        );
        
        if (brecho.length === 0) {
            return res.redirect('/homecomprador');
        }
        
        // Buscar avaliações do brechó
        const [avaliacoes] = await pool.query(`
            SELECT ab.*, u.NOME_USUARIO, u.IMG_URL
            FROM AVALIACOES_BRECHOS ab
            JOIN USUARIOS u ON ab.ID_USUARIO = u.ID_USUARIO
            WHERE ab.ID_BRECHO = ?
            ORDER BY ab.DT_AVALIACAO DESC
        `, [brechoId]);
        
        // Calcular média das avaliações
        const [mediaResult] = await pool.query(
            'SELECT AVG(NOTA) as media, COUNT(*) as total FROM AVALIACOES_BRECHOS WHERE ID_BRECHO = ?',
            [brechoId]
        );
        
        const mediaAvaliacoes = parseFloat(mediaResult[0]?.media) || 0;
        const totalAvaliacoes = mediaResult[0]?.total || 0;
        
        res.render('pages/avaliacoes-brecho', {
            brecho: brecho[0],
            avaliacoes: avaliacoes,
            mediaAvaliacoes: mediaAvaliacoes,
            totalAvaliacoes: totalAvaliacoes,
            autenticado: req.session.autenticado || null
        });
    } catch (error) {
        console.log('Erro ao carregar avaliações:', error);
        res.redirect('/homecomprador');
    }
});

router.post('/avaliacoes/criar', verificarUsuAutenticado, async (req, res) => {
    try {
        console.log('=== CRIAR AVALIAÇÃO ===');
        console.log('Body recebido:', req.body);
        console.log('Usuário autenticado:', req.session.autenticado);
        
        const { nota, comentario, brechoId } = req.body;
        const userId = req.session.autenticado.id;
        
        // Validações
        if (!nota || !comentario || !brechoId) {
            console.log('Dados obrigatórios faltando');
            return res.json({ success: false, message: 'Todos os campos são obrigatórios' });
        }
        
        if (nota < 1 || nota > 5) {
            console.log('Nota inválida:', nota);
            return res.json({ success: false, message: 'Nota deve ser entre 1 e 5' });
        }
        
        if (comentario.trim().length < 5) {
            console.log('Comentário muito curto');
            return res.json({ success: false, message: 'Comentário deve ter pelo menos 5 caracteres' });
        }
        
        // Verificar se o brechó existe
        const [brechoExiste] = await pool.query(
            'SELECT ID_USUARIO FROM USUARIOS WHERE ID_USUARIO = ? AND TIPO_USUARIO = "b"',
            [brechoId]
        );
        
        if (brechoExiste.length === 0) {
            console.log('Brechó não encontrado:', brechoId);
            return res.json({ success: false, message: 'Brechó não encontrado' });
        }
        
        // Verificar se o usuário já avaliou este brechó
        const [avaliacaoExiste] = await pool.query(
            'SELECT ID_AVALIACAO_BRECHO FROM AVALIACOES_BRECHOS WHERE ID_USUARIO = ? AND ID_BRECHO = ?',
            [userId, brechoId]
        );
        
        if (avaliacaoExiste.length > 0) {
            console.log('Usuário já avaliou este brechó');
            return res.json({ success: false, message: 'Você já avaliou este brechó' });
        }
        
        // Criar nova avaliação
        console.log('Inserindo avaliação no banco...');
        const [resultado] = await pool.query(`
            INSERT INTO AVALIACOES_BRECHOS (ID_USUARIO, ID_BRECHO, NOTA, COMENTARIO, DT_AVALIACAO, HORA)
            VALUES (?, ?, ?, ?, CURDATE(), CURTIME())
        `, [userId, brechoId, nota, comentario.trim()]);
        
        console.log('Avaliação inserida com ID:', resultado.insertId);
        
        res.json({ success: true, message: 'Avaliação criada com sucesso!' });
    } catch (error) {
        console.log('Erro detalhado ao criar avaliação:', error);
        res.json({ success: false, message: 'Erro interno do servidor: ' + error.message });
    }
});

router.post('/avaliacoes/excluir', verificarUsuAutenticado, async (req, res) => {
    try {
        const { avaliacaoId } = req.body;
        const userId = req.session.autenticado.id;
        
        const [avaliacao] = await pool.query(
            'SELECT * FROM AVALIACOES_BRECHOS WHERE ID_AVALIACAO_BRECHO = ?',
            [avaliacaoId]
        );
        
        if (avaliacao.length === 0) {
            return res.json({ success: false, message: 'Avaliação não encontrada' });
        }
        
        const isAdmin = req.session.autenticado.tipo === 'a';
        const isOwner = avaliacao[0].ID_USUARIO === userId;
        
        if (!isAdmin && !isOwner) {
            return res.json({ success: false, message: 'Sem permissão para excluir' });
        }
        
        await pool.query(
            'DELETE FROM AVALIACOES_BRECHOS WHERE ID_AVALIACAO_BRECHO = ?',
            [avaliacaoId]
        );
        
        res.json({ success: true, message: 'Avaliação excluída com sucesso!' });
    } catch (error) {
        console.log('Erro ao excluir avaliação:', error);
        res.json({ success: false, message: 'Erro interno do servidor: ' + error.message });
    }
});

router.post('/avaliacoes/excluir', verificarUsuAutenticado, async (req, res) => {
    try {
        const { avaliacaoId } = req.body;
        const userId = req.session.autenticado.id;
        
        // Verificar se é admin ou dono da avaliação
        const [avaliacao] = await pool.query(
            'SELECT * FROM AVALIACOES_BRECHOS WHERE ID_AVALIACAO_BRECHO = ?',
            [avaliacaoId]
        );
        
        if (avaliacao.length === 0) {
            return res.json({ success: false, message: 'Avaliação não encontrada' });
        }
        
        const isAdmin = req.session.autenticado.tipo === 'a';
        const isOwner = avaliacao[0].ID_USUARIO === userId;
        
        if (!isAdmin && !isOwner) {
            return res.json({ success: false, message: 'Sem permissão para excluir' });
        }
        
        // Excluir avaliação
        await pool.query(
            'DELETE FROM AVALIACOES_BRECHOS WHERE ID_AVALIACAO_BRECHO = ?',
            [avaliacaoId]
        );
        
        res.json({ success: true, message: 'Avaliação excluída com sucesso!' });
    } catch (error) {
        console.log('Erro ao excluir avaliação:', error);
        res.json({ success: false, message: 'Erro interno do servidor' });
    }
});

// Integrar criação de pedido real após pagamento
router.post('/finalizar-pedido-real', verificarUsuAutenticado, async (req, res) => {
    try {
        const userId = req.session.autenticado.id;
        const { produtos, valorTotal, metodoPagamento } = req.body;
        
        // Criar pedido real
        const [pedido] = await pool.query(`
            INSERT INTO PEDIDOS (ID_USUARIO, DT_PEDIDO, VALOR_TOTAL, STATUS_PEDIDO)
            VALUES (?, NOW(), ?, 'Pendente')
        `, [userId, valorTotal]);
        
        // Limpar sacola após pedido
        await pool.query('DELETE FROM ITENS_SACOLA WHERE ID_SACOLA IN (SELECT ID_SACOLA FROM SACOLA WHERE ID_USUARIO = ?)', [userId]);
        
        // Notificar por email
        await emailService.notificarPedido(userId, pedido.insertId);
        
        res.json({ success: true, pedidoId: pedido.insertId });
    } catch (error) {
        console.log('Erro ao finalizar pedido:', error);
        res.json({ success: false });
    }
});

// Rotas para edição de produtos
router.get('/produto/detalhes/:id', verificarUsuAutenticado, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session.autenticado.id;
        
        console.log('Buscando produto ID:', id, 'para usuário:', userId);
        
        // Validar se o ID é um número válido
        if (!id || isNaN(id)) {
            return res.json({ success: false, message: 'ID do produto inválido' });
        }
        
        const [produto] = await pool.query(
            'SELECT * FROM PRODUTOS WHERE ID_PRODUTO = ? AND ID_USUARIO = ?',
            [parseInt(id), userId]
        );
        
        console.log('Produto encontrado:', produto.length > 0 ? 'SIM' : 'NÃO');
        
        if (produto.length === 0) {
            return res.json({ success: false, message: 'Produto não encontrado ou sem permissão' });
        }
        
        res.json({ success: true, produto: produto[0] });
    } catch (error) {
        console.log('Erro ao buscar produto:', error);
        res.json({ success: false, message: 'Erro no servidor. Tente novamente.' });
    }
});

router.post('/produto/editar', verificarUsuAutenticado, async (req, res) => {
    try {
        const { productId, nome, preco, descricao, tipo, tamanho, cor, condicao } = req.body;
        const userId = req.session.autenticado.id;
        
        console.log('Editando produto:', { productId, nome, preco, tipo, userId });
        
        // Validar dados de entrada
        if (!productId || isNaN(productId)) {
            return res.json({ success: false, message: 'ID do produto inválido' });
        }
        
        if (!nome || nome.trim().length === 0) {
            return res.json({ success: false, message: 'Nome do produto é obrigatório' });
        }
        
        if (!preco || isNaN(preco) || parseFloat(preco) <= 0) {
            return res.json({ success: false, message: 'Preço deve ser um número maior que zero' });
        }
        
        if (!tipo || tipo.trim().length === 0) {
            return res.json({ success: false, message: 'Categoria é obrigatória' });
        }
        
        // Verificar se o produto pertence ao usuário
        const [produto] = await pool.query(
            'SELECT * FROM PRODUTOS WHERE ID_PRODUTO = ? AND ID_USUARIO = ?',
            [parseInt(productId), userId]
        );
        
        if (produto.length === 0) {
            return res.json({ success: false, message: 'Produto não encontrado ou sem permissão' });
        }
        
        // Preparar dados para atualização (limpar valores vazios)
        const dadosAtualizacao = {
            NOME_PRODUTO: nome.trim(),
            PRECO: parseFloat(preco),
            DETALHES_PRODUTO: descricao ? descricao.trim() : null,
            TIPO_PRODUTO: tipo.trim(),
            TAMANHO_PRODUTO: tamanho && tamanho.trim() ? tamanho.trim() : null,
            COR_PRODUTO: cor && cor.trim() ? cor.trim() : null,
            CONDICAO_PRODUTO: condicao && condicao.trim() ? condicao.trim() : null
        };
        
        console.log('Dados para atualização:', dadosAtualizacao);
        
        // Atualizar produto
        const [resultado] = await pool.query(`
            UPDATE PRODUTOS SET 
                NOME_PRODUTO = ?, 
                PRECO = ?, 
                DETALHES_PRODUTO = ?, 
                TIPO_PRODUTO = ?, 
                TAMANHO_PRODUTO = ?, 
                COR_PRODUTO = ?, 
                CONDICAO_PRODUTO = ?
            WHERE ID_PRODUTO = ? AND ID_USUARIO = ?
        `, [
            dadosAtualizacao.NOME_PRODUTO,
            dadosAtualizacao.PRECO,
            dadosAtualizacao.DETALHES_PRODUTO,
            dadosAtualizacao.TIPO_PRODUTO,
            dadosAtualizacao.TAMANHO_PRODUTO,
            dadosAtualizacao.COR_PRODUTO,
            dadosAtualizacao.CONDICAO_PRODUTO,
            parseInt(productId),
            userId
        ]);
        
        console.log('Resultado da atualização:', resultado);
        
        if (resultado.affectedRows === 0) {
            return res.json({ success: false, message: 'Nenhuma alteração foi feita no produto' });
        }
        
        res.json({ success: true, message: 'Produto atualizado com sucesso!' });
    } catch (error) {
        console.log('Erro detalhado ao editar produto:', error);
        
        // Tratar erros específicos do MySQL
        if (error.code === 'ER_DATA_TOO_LONG') {
            return res.json({ success: false, message: 'Algum campo contém dados muito longos' });
        }
        if (error.code === 'ER_BAD_NULL_ERROR') {
            return res.json({ success: false, message: 'Campo obrigatório não pode estar vazio' });
        }
        if (error.code === 'ER_TRUNCATED_WRONG_VALUE') {
            return res.json({ success: false, message: 'Valor inválido para algum campo' });
        }
        
        res.json({ success: false, message: 'Erro interno do servidor: ' + error.message });
    }
});

router.post('/produto/excluir', verificarUsuAutenticado, async (req, res) => {
    try {
        console.log('=== EXCLUIR PRODUTO ===');
        console.log('Body:', req.body);
        console.log('Sessão:', req.session.autenticado);
        
        const { productId } = req.body;
        const userId = req.session.autenticado.id;
        
        console.log('ProductId:', productId, 'UserId:', userId);
        
        if (!productId) {
            return res.json({ success: false, message: 'ID do produto é obrigatório' });
        }
        
        // Excluir produto diretamente
        console.log('Executando DELETE...');
        const [resultado] = await pool.query(
            'DELETE FROM PRODUTOS WHERE ID_PRODUTO = ? AND ID_USUARIO = ?', 
            [productId, userId]
        );
        
        console.log('Resultado:', resultado);
        
        if (resultado.affectedRows > 0) {
            res.json({ success: true, message: 'Produto excluído com sucesso!' });
        } else {
            res.json({ success: false, message: 'Produto não encontrado ou sem permissão' });
        }
    } catch (error) {
        console.log('ERRO COMPLETO ao excluir produto:', error);
        res.json({ success: false, message: 'Erro interno: ' + error.message });
    }
});

// Rota de teste para verificar produtos no banco
router.get('/debug/produtos', verificarUsuAutenticado, async (req, res) => {
    try {
        const userId = req.session.autenticado.id;
        
        // Verificar total de produtos
        const [total] = await pool.query('SELECT COUNT(*) as total FROM PRODUTOS');
        
        // Verificar produtos do usuário
        const [produtosUsuario] = await pool.query(
            'SELECT * FROM PRODUTOS WHERE ID_USUARIO = ? ORDER BY ID_PRODUTO DESC',
            [userId]
        );
        
        // Verificar últimos produtos cadastrados
        const [ultimosProdutos] = await pool.query(
            'SELECT ID_PRODUTO, NOME_PRODUTO, ID_USUARIO, DATA_CADASTRO FROM PRODUTOS ORDER BY ID_PRODUTO DESC LIMIT 10'
        );
        
        res.json({
            totalProdutos: total[0].total,
            produtosDoUsuario: produtosUsuario.length,
            produtosUsuario: produtosUsuario,
            ultimosProdutos: ultimosProdutos,
            usuarioId: userId
        });
    } catch (error) {
        console.log('Erro no debug:', error);
        res.json({ error: error.message });
    }
});

// Rota de debug para verificar artigos do blog
router.get('/debug/blog', async (req, res) => {
    try {
        console.log('=== DEBUG BLOG ===');
        
        // Verificar se as tabelas existem
        const [tabelaArtigos] = await pool.query("SHOW TABLES LIKE 'ARTIGOS_BLOG'");
        const [tabelaCategorias] = await pool.query("SHOW TABLES LIKE 'CATEGORIAS_BLOG'");
        const [tabelaAdmins] = await pool.query("SHOW TABLES LIKE 'ADMINISTRADORES'");
        
        console.log('Tabelas existentes:');
        console.log('- ARTIGOS_BLOG:', tabelaArtigos.length > 0 ? 'SIM' : 'NÃO');
        console.log('- CATEGORIAS_BLOG:', tabelaCategorias.length > 0 ? 'SIM' : 'NÃO');
        console.log('- ADMINISTRADORES:', tabelaAdmins.length > 0 ? 'SIM' : 'NÃO');
        
        let estruturaArtigos = null;
        let totalArtigos = 0;
        let artigos = [];
        let categorias = [];
        let admins = [];
        
        if (tabelaArtigos.length > 0) {
            // Verificar estrutura da tabela
            const [estrutura] = await pool.query('DESCRIBE ARTIGOS_BLOG');
            estruturaArtigos = estrutura;
            
            // Contar artigos
            const [count] = await pool.query('SELECT COUNT(*) as total FROM ARTIGOS_BLOG');
            totalArtigos = count[0].total;
            
            // Buscar artigos
            const [artigosResult] = await pool.query('SELECT * FROM ARTIGOS_BLOG ORDER BY ID_ARTIGO DESC LIMIT 5');
            artigos = artigosResult;
        }
        
        if (tabelaCategorias.length > 0) {
            const [categoriasResult] = await pool.query('SELECT * FROM CATEGORIAS_BLOG');
            categorias = categoriasResult;
        }
        
        if (tabelaAdmins.length > 0) {
            const [adminsResult] = await pool.query('SELECT * FROM ADMINISTRADORES');
            admins = adminsResult;
        }
        
        const debugInfo = {
            tabelas: {
                artigos_blog: tabelaArtigos.length > 0,
                categorias_blog: tabelaCategorias.length > 0,
                administradores: tabelaAdmins.length > 0
            },
            estrutura_artigos: estruturaArtigos,
            total_artigos: totalArtigos,
            artigos_amostra: artigos,
            categorias: categorias,
            admins: admins
        };
        
        console.log('Debug info:', JSON.stringify(debugInfo, null, 2));
        
        res.json(debugInfo);
    } catch (error) {
        console.log('Erro no debug blog:', error.message);
        res.json({ error: error.message, stack: error.stack });
    }
});

// Rota de debug para testar editarpost
router.get('/debug/editarpost', async (req, res) => {
    try {
        console.log('=== DEBUG EDITARPOST ===');
        
        // Verificar estrutura da tabela
        const [estrutura] = await pool.query('DESCRIBE ARTIGOS_BLOG');
        console.log('Estrutura da tabela ARTIGOS_BLOG:', estrutura);
        
        // Buscar artigos existentes
        const [artigos] = await pool.query('SELECT * FROM ARTIGOS_BLOG ORDER BY ID_ARTIGO DESC LIMIT 5');
        console.log('Artigos encontrados:', artigos.length);
        
        // Verificar categorias
        const [categorias] = await pool.query('SELECT * FROM CATEGORIAS_BLOG');
        console.log('Categorias encontradas:', categorias.length);
        
        // Testar uma atualização simples se houver artigos
        let testeAtualizacao = null;
        if (artigos.length > 0) {
            const artigoTeste = artigos[0];
            console.log('Testando atualização no artigo:', artigoTeste.ID_ARTIGO);
            
            const [resultado] = await pool.query(
                'UPDATE ARTIGOS_BLOG SET TITULO = ? WHERE ID_ARTIGO = ?',
                [artigoTeste.TITULO, artigoTeste.ID_ARTIGO]
            );
            
            testeAtualizacao = {
                artigoId: artigoTeste.ID_ARTIGO,
                affectedRows: resultado.affectedRows,
                changedRows: resultado.changedRows
            };
        }
        
        res.json({
            estruturaTabela: estrutura,
            totalArtigos: artigos.length,
            artigos: artigos,
            totalCategorias: categorias.length,
            categorias: categorias,
            testeAtualizacao: testeAtualizacao,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.log('Erro no debug editarpost:', error);
        res.json({ error: error.message, stack: error.stack });
    }
});

// Rota para forçar inserção de artigos
router.get('/debug/inserir-artigos', async (req, res) => {
    try {
        console.log('=== FORÇANDO INSERÇÃO DE ARTIGOS ===');
        
        // Limpar artigos existentes primeiro
        await pool.query('DELETE FROM ARTIGOS_BLOG');
        console.log('Artigos existentes removidos');
        
        await inserirArtigosFicticios();
        
        // Verificar resultado
        const [artigos] = await pool.query('SELECT COUNT(*) as total FROM ARTIGOS_BLOG');
        
        res.json({
            success: true,
            message: 'Inserção forçada concluída',
            total_artigos: artigos[0].total
        });
    } catch (error) {
        console.log('Erro ao forçar inserção:', error.message);
        res.json({ success: false, error: error.message });
    }
});

// Rota para publicar todos os artigos fictícios
// Rota para forçar inserção de artigos no blog
router.get('/forcar-artigos-blog', async (req, res) => {
    try {
        console.log('=== FORÇANDO INSERÇÃO DE ARTIGOS ===');
        
        // Verificar se tabela existe
        const [tabelas] = await pool.query("SHOW TABLES LIKE 'ARTIGOS_BLOG'");
        if (tabelas.length === 0) {
            return res.json({ success: false, error: 'Tabela ARTIGOS_BLOG não existe' });
        }
        
        // Limpar artigos existentes
        await pool.query('DELETE FROM ARTIGOS_BLOG');
        
        // Garantir categoria
        await pool.query('INSERT IGNORE INTO CATEGORIAS_BLOG (ID_CATEGORIA_BLOG, NOME_CATEGORIA_BLOG) VALUES (1, "Moda")');
        
        // Inserir artigos
        const artigos = [
            { titulo: 'METALIZADO: 7 LOOKS PARA VOCÊ SE INSPIRAR', conteudo: 'O metalizado se destaca em 2024 como uma tendência versátil que pode ser incorporada em diversos looks.', data: '2024-11-05' },
            { titulo: 'BOSS | Milão Verão 2024', conteudo: 'A marca alemã BOSS apresentou em Milão sua coleção verão 2024 com foco na elegância contemporânea.', data: '2024-11-03' },
            { titulo: 'Gucci | Milão Verão 2024', conteudo: 'Sob a direção criativa de Sabato De Sarno, a Gucci apresenta uma nova visão para o verão 2024.', data: '2024-10-25' },
            { titulo: 'TENDÊNCIA SUSTENTÁVEL', conteudo: 'A moda sustentável deixou de ser apenas uma tendência para se tornar uma necessidade.', data: '2024-10-20' },
            { titulo: 'SWEET VINTAGE', conteudo: 'O estilo vintage continua conquistando corações e guarda-roupas ao redor do mundo.', data: '2024-10-15' }
        ];
        
        let inseridos = 0;
        for (const artigo of artigos) {
            try {
                await pool.query(`
                    INSERT INTO ARTIGOS_BLOG (TITULO, CONTEUDO, AUTOR, DT_PUBLICACAO, ID_ADM, ID_CATEGORIA_BLOG)
                    VALUES (?, ?, 'Vintélo Fashion', ?, 1, 1)
                `, [artigo.titulo, artigo.conteudo, artigo.data]);
                inseridos++;
            } catch (e) {
                console.log('Erro ao inserir:', artigo.titulo, e.message);
            }
        }
        
        const [count] = await pool.query('SELECT COUNT(*) as total FROM ARTIGOS_BLOG');
        
        res.json({
            success: true,
            inseridos: inseridos,
            total_banco: count[0].total,
            message: `${inseridos} artigos inseridos com sucesso!`
        });
    } catch (error) {
        console.log('Erro ao forçar inserção:', error);
        res.json({ success: false, error: error.message });
    }
});

// Rota para forçar inserção no Clever Cloud
router.get('/forcar-artigos-clevercloud', async (req, res) => {
    try {
        // Inserir artigos um por um com verificação
        const artigos = [
            'INSERT INTO ARTIGOS_BLOG (TITULO, CONTEUDO, AUTOR, DT_PUBLICACAO, ID_ADM, ID_CATEGORIA_BLOG) VALUES ("METALIZADO: 7 LOOKS PARA VOCÊ SE INSPIRAR", "O metalizado se destaca em 2024 como uma tendência versátil que pode ser incorporada em diversos looks.", "Vintélo Fashion", "2024-11-05", 1, 1)',
            'INSERT INTO ARTIGOS_BLOG (TITULO, CONTEUDO, AUTOR, DT_PUBLICACAO, ID_ADM, ID_CATEGORIA_BLOG) VALUES ("BOSS Milão Verão 2024", "A marca alemã BOSS apresentou em Milão sua coleção verão 2024 com foco na elegância contemporânea.", "Vintélo Fashion", "2024-11-03", 1, 1)',
            'INSERT INTO ARTIGOS_BLOG (TITULO, CONTEUDO, AUTOR, DT_PUBLICACAO, ID_ADM, ID_CATEGORIA_BLOG) VALUES ("Gucci Milão Verão 2024", "Sob a direção criativa de Sabato De Sarno, a Gucci apresenta uma nova visão para o verão 2024.", "Vintélo Fashion", "2024-10-25", 1, 1)',
            'INSERT INTO ARTIGOS_BLOG (TITULO, CONTEUDO, AUTOR, DT_PUBLICACAO, ID_ADM, ID_CATEGORIA_BLOG) VALUES ("TENDÊNCIA SUSTENTÁVEL", "A moda sustentável deixou de ser apenas uma tendência para se tornar uma necessidade.", "Vintélo Fashion", "2024-10-20", 1, 1)',
            'INSERT INTO ARTIGOS_BLOG (TITULO, CONTEUDO, AUTOR, DT_PUBLICACAO, ID_ADM, ID_CATEGORIA_BLOG) VALUES ("SWEET VINTAGE", "O estilo vintage continua conquistando corações e guarda-roupas ao redor do mundo.", "Vintélo Fashion", "2024-10-15", 1, 1)'
        ];
        
        let inseridos = 0;
        for (const sql of artigos) {
            try {
                await pool.query(sql);
                inseridos++;
            } catch (e) {
                console.log('Erro SQL:', e.message);
            }
        }
        
        const [count] = await pool.query('SELECT COUNT(*) as total FROM ARTIGOS_BLOG');
        
        res.json({
            success: true,
            inseridos: inseridos,
            total_banco: count[0].total,
            message: `${inseridos} artigos inseridos. Total no banco: ${count[0].total}`
        });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

router.get('/publicar-artigos-ficticios', async (req, res) => {
    const redirect = req.query.redirect;
    
    if (redirect === 'blogadm') {
        // Se veio do blogadm, fazer inserção e redirecionar de volta
        try {
            await inserirArtigosFicticios();
            return res.redirect('/blogadm');
        } catch (error) {
            return res.redirect('/blogadm');
        }
    }
    
    // Caso contrário, mostrar resultado JSON
    try {
        console.log('=== PUBLICANDO TODOS OS ARTIGOS FICTÍCIOS ===');
        
        // Limpar tabela primeiro
        await pool.query('DELETE FROM ARTIGOS_BLOG');
        
        // Garantir categoria
        let categoriaId = 1;
        try {
            const [novaCategoria] = await pool.query(
                'INSERT IGNORE INTO CATEGORIAS_BLOG (ID_CATEGORIA_BLOG, NOME_CATEGORIA_BLOG) VALUES (1, "Moda")'
            );
        } catch (e) {}
        
        // Garantir admin
        let adminId = 1;
        try {
            const [novoAdmin] = await pool.query(
                'INSERT IGNORE INTO ADMINISTRADORES (ID_ADM, ID_USUARIO, CPF_ADM) VALUES (1, 1, "00000000000")'
            );
        } catch (e) {}
        
        // Artigos completos
        const artigos = [
            {
                titulo: 'METALIZADO: 7 LOOKS PARA VOCÊ SE INSPIRAR',
                conteudo: 'O metalizado se destaca em 2024 como uma tendência versátil que pode ser incorporada em diversos looks. Desde acessórios até peças principais, essa textura especial adiciona um toque futurista e sofisticado a qualquer produção. Confira nossas dicas para incorporar o metalizado no seu guarda-roupa de forma elegante e moderna. A tendência metalizada não é novidade, mas em 2024 ela ganha novas interpretações e formas de uso. Seja em uma bolsa, sapatos ou até mesmo em uma peça de roupa completa, o metalizado traz personalidade e modernidade ao look.',
                data: '2024-11-05'
            },
            {
                titulo: 'BOSS | Milão Verão 2024',
                conteudo: 'A marca alemã BOSS apresentou em Milão sua coleção verão 2024 com foco na elegância contemporânea. A BOSS trouxe para as passarelas de Milão uma proposta inovadora que combina a tradição da alfaiataria alemã com elementos contemporâneos. A coleção verão 2024 apresenta cortes precisos, tecidos nobres e uma paleta de cores que vai do clássico preto e branco aos tons terrosos que marcam a estação.',
                data: '2024-11-03'
            },
            {
                titulo: 'Gucci | Milão Verão 2024',
                conteudo: 'Sob a direção criativa de Sabato De Sarno, a Gucci apresenta uma nova visão para o verão 2024. A Gucci entra em uma nova fase criativa com Sabato De Sarno à frente da direção criativa. A coleção verão 2024 marca um retorno às raízes da marca italiana, com foco na qualidade artesanal e no luxo discreto. Peças atemporais ganham toques contemporâneos em uma proposta que celebra a herança da grife.',
                data: '2024-10-25'
            },
            {
                titulo: 'TENDÊNCIA SUSTENTÁVEL: MODA CONSCIENTE EM ALTA',
                conteudo: 'A moda sustentável deixou de ser apenas uma tendência para se tornar uma necessidade. Cada vez mais consumidores buscam alternativas ecológicas e socialmente responsáveis na hora de escolher suas roupas. Os brechós e o mercado de segunda mão ganham destaque como opções viáveis para quem quer se vestir bem sem agredir o meio ambiente. A economia circular na moda promove a reutilização, o reaproveitamento e a valorização de peças que já tiveram uma vida anterior.',
                data: '2024-10-20'
            },
            {
                titulo: 'SWEET VINTAGE: O CHARME DO RETRÔ MODERNO',
                conteudo: 'O estilo vintage continua conquistando corações e guarda-roupas ao redor do mundo. A mistura entre o charme do passado e a praticidade do presente cria looks únicos e cheios de personalidade. Peças dos anos 70, 80 e 90 voltam com força total, adaptadas ao contexto atual. O sweet vintage combina romantismo, nostalgia e modernidade em uma proposta irresistível para quem busca se destacar com autenticidade e estilo próprio.',
                data: '2024-10-15'
            },
            {
                titulo: 'MODA CIRCULAR: O FUTURO SUSTENTÁVEL DA INDÚSTRIA',
                conteudo: 'A moda circular representa uma revolução na indústria têxtil, propondo um modelo onde nada é desperdiçado. Este conceito vai além da reciclagem, criando um sistema onde as roupas são projetadas para durar, serem reparadas, reutilizadas e, eventualmente, transformadas em novas peças. Os brechós são protagonistas nessa mudança, oferecendo uma segunda vida às roupas e democratizando o acesso à moda de qualidade.',
                data: '2024-10-10'
            },
            {
                titulo: 'TENDÊNCIAS OUTONO/INVERNO 2024: O QUE USAR',
                conteudo: 'O outono/inverno 2024 traz uma mistura interessante entre conforto e sofisticação. Cores terrosas dominam a paleta, enquanto texturas como veludo e lã ganham destaque. Os casacos oversized continuam em alta, assim como as botas de cano alto. A sobreposição de peças é uma técnica essencial para criar looks interessantes e funcionais durante as estações mais frias.',
                data: '2024-09-28'
            },
            {
                titulo: 'COMO MONTAR UM GUARDA-ROUPA CÁPSULA',
                conteudo: 'O guarda-roupa cápsula é uma filosofia de moda que prioriza qualidade sobre quantidade. Consiste em ter poucas peças versáteis que se combinam entre si, criando múltiplas possibilidades de looks. Esta abordagem não apenas economiza dinheiro e espaço, mas também reduz o impacto ambiental do consumo de moda. Peças básicas de qualidade são a base deste conceito.',
                data: '2024-09-15'
            }
        ];
        
        let inseridos = 0;
        for (const artigo of artigos) {
            try {
                await pool.query(`
                    INSERT INTO ARTIGOS_BLOG (TITULO, CONTEUDO, AUTOR, DT_PUBLICACAO, HORA_PUBLICACAO, ID_ADM, ID_CATEGORIA_BLOG)
                    VALUES (?, ?, 'Vintélo Fashion', ?, CURTIME(), ?, ?)
                `, [artigo.titulo, artigo.conteudo, artigo.data, adminId, categoriaId]);
                inseridos++;
            } catch (e) {
                console.log('Erro ao inserir:', artigo.titulo, e.message);
            }
        }
        
        const [total] = await pool.query('SELECT COUNT(*) as total FROM ARTIGOS_BLOG');
        
        res.json({
            success: true,
            message: `${inseridos} artigos publicados com sucesso!`,
            total_no_banco: total[0].total
        });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Rota para testar criação de avaliação via GET (apenas para debug)
router.get('/test-criar-avaliacao/:brechoId', verificarUsuAutenticado, async (req, res) => {
    try {
        const { brechoId } = req.params;
        const userId = req.session.autenticado.id;
        
        console.log('=== TESTE CRIAR AVALIAÇÃO ===');
        console.log('Brechó ID:', brechoId);
        console.log('Usuário ID:', userId);
        
        // Verificar se o brechó existe
        const [brecho] = await pool.query(
            'SELECT NOME_USUARIO FROM USUARIOS WHERE ID_USUARIO = ? AND TIPO_USUARIO = "b"',
            [brechoId]
        );
        
        if (brecho.length === 0) {
            return res.json({ success: false, message: 'Brechó não encontrado' });
        }
        
        // Criar avaliação de teste
        const [resultado] = await pool.query(`
            INSERT INTO AVALIACOES_BRECHOS (ID_USUARIO, ID_BRECHO, NOTA, COMENTARIO, DT_AVALIACAO, HORA)
            VALUES (?, ?, 4, 'Avaliação de teste - Bom atendimento e produtos de qualidade!', CURDATE(), CURTIME())
        `, [userId, brechoId]);
        
        res.json({ 
            success: true, 
            message: 'Avaliação de teste criada!',
            avaliacaoId: resultado.insertId,
            brecho: brecho[0].NOME_USUARIO
        });
    } catch (error) {
        console.log('Erro no teste:', error);
        res.json({ success: false, message: 'Erro: ' + error.message });
    }
});

module.exports = router;

// API endpoint para status de autenticação (usado pelo perfil-autenticado.js)
router.get('/api/auth-status', async function(req, res){
    try {
        if (req.session && req.session.autenticado) {
            // Buscar dados completos do usuário incluindo imagem
            const [usuario] = await pool.query(
                'SELECT IMG_URL FROM USUARIOS WHERE ID_USUARIO = ?',
                [req.session.autenticado.id]
            );
            
            res.json({
                isAuthenticated: true,
                user: {
                    id: req.session.autenticado.id,
                    nome: req.session.autenticado.nome,
                    email: req.session.autenticado.email,
                    tipo: req.session.autenticado.tipo,
                    imagem: usuario[0]?.IMG_URL || null
                }
            });
        } else {
            res.json({ isAuthenticated: false });
        }
    } catch (error) {
        console.log('Erro ao verificar status de autenticação:', error);
        res.json({ isAuthenticated: false });
    }
});

// API endpoint para denúncias (usado pelo denuncias-admin.js)
router.get('/api/denuncias', async function(req, res){
    try {
        const [denuncias] = await pool.query(`
            SELECT d.ID_DENUNCIA, d.MOTIVO, d.DESCRICAO, d.DATA_DENUNCIA, d.STATUS_DENUNCIA as STATUS,
                   u1.NOME_USUARIO as NOME_DENUNCIANTE, u1.USER_USUARIO as USER_DENUNCIANTE,
                   u2.NOME_USUARIO as NOME_ALVO, u2.USER_USUARIO as USER_ALVO, u2.TIPO_USUARIO as TIPO_ALVO
            FROM DENUNCIAS d
            LEFT JOIN USUARIOS u1 ON d.ID_USUARIO_DENUNCIANTE = u1.ID_USUARIO
            LEFT JOIN USUARIOS u2 ON d.ID_USUARIO_ALVO = u2.ID_USUARIO
            ORDER BY d.DATA_DENUNCIA DESC
            LIMIT 50
        `);
        
        res.json(denuncias || []);
    } catch (error) {
        console.log('Erro ao buscar denúncias via API:', error);
        res.json([]);
    }
});

// API endpoint para estatísticas do vendedor (usado pelo estatisticas-vendedor.js)
router.get('/api/estatisticas', verificarUsuAutenticado, async function(req, res){
    try {
        const userId = req.session.autenticado.id;
        
        const [produtos] = await pool.query('SELECT COUNT(*) as total FROM PRODUTOS WHERE ID_USUARIO = ?', [userId]);
        const [vendas] = await pool.query('SELECT COUNT(*) as total, SUM(PRECO) as receita FROM PRODUTOS WHERE ID_USUARIO = ? AND STATUS_PRODUTO != "d"', [userId]);
        const [visualizacoes] = await pool.query('SELECT COUNT(DISTINCT f.ID_USUARIO) as total FROM FAVORITOS f JOIN PRODUTOS p ON f.ID_ITEM = p.ID_PRODUTO WHERE p.ID_USUARIO = ? AND f.TIPO_ITEM = "produto"', [userId]);
        const [categorias] = await pool.query('SELECT TIPO_PRODUTO, COUNT(*) as quantidade, SUM(CASE WHEN STATUS_PRODUTO != "d" THEN 1 ELSE 0 END) as vendidos FROM PRODUTOS WHERE ID_USUARIO = ? GROUP BY TIPO_PRODUTO', [userId]);
        
        const totalProdutos = produtos[0]?.total || 0;
        const totalVendas = vendas[0]?.total || 0;
        const receitaTotal = parseFloat(vendas[0]?.receita) || 0;
        const totalVisualizacoes = Math.max(visualizacoes[0]?.total || 0, totalProdutos * 2);
        const taxaConversao = totalVisualizacoes > 0 ? ((totalVendas / totalVisualizacoes) * 100).toFixed(1) : 0;
        
        const vendasCategoria = categorias.map(cat => ({
            categoria: cat.TIPO_PRODUTO || 'Outros',
            quantidade: cat.vendidos || 0
        }));
        
        res.json({
            brecho: { NOME_BRECHO: req.session.autenticado.nome + ' Brechó' },
            totalProdutos,
            totalVendas,
            receitaTotal,
            totalVisualizacoes,
            taxaConversao: parseFloat(taxaConversao),
            vendasCategoria
        });
    } catch (error) {
        console.log('Erro ao buscar estatísticas via API:', error);
        res.json({});
    }
});

// API endpoint para estatísticas do admin (usado pelo estatisticas-admin.js)
router.get('/api/estatisticas-admin', async function(req, res){
    try {
        const [totalUsuarios] = await pool.query('SELECT COUNT(*) as total FROM USUARIOS');
        const [totalBrechos] = await pool.query('SELECT COUNT(*) as total FROM USUARIOS WHERE TIPO_USUARIO = "b"');
        const [totalProdutos] = await pool.query('SELECT COUNT(*) as total FROM PRODUTOS');
        const [totalVendas] = await pool.query('SELECT COUNT(*) as total FROM PRODUTOS WHERE STATUS_PRODUTO != "d"');
        const [receitaTotal] = await pool.query('SELECT SUM(PRECO) as receita FROM PRODUTOS WHERE STATUS_PRODUTO != "d"');
        const [denunciasPendentes] = await pool.query('SELECT COUNT(*) as total FROM DENUNCIAS WHERE STATUS_DENUNCIA = "pendente"');
        
        res.json({
            totalUsuarios: totalUsuarios[0]?.total || 0,
            totalBrechos: totalBrechos[0]?.total || 0,
            totalProdutos: totalProdutos[0]?.total || 0,
            totalVendas: totalVendas[0]?.total || 0,
            receitaTotal: parseFloat(receitaTotal[0]?.receita) || 0,
            denunciasPendentes: denunciasPendentes[0]?.total || 0
        });
    } catch (error) {
        console.log('Erro ao buscar estatísticas admin via API:', error);
        res.json({});
    }
});

// API endpoint para favoritos (usado pelo perfil-cliente.js)
router.get('/api/favoritos', verificarUsuAutenticado, async function(req, res){
    try {
        const [favoritos] = await pool.query(`
            SELECT p.ID_PRODUTO, p.NOME_PRODUTO, p.PRECO as PRECO_PRODUTO, p.COR_PRODUTO, p.ESTILO_PRODUTO, 
                   p.ESTAMPA_PRODUTO, p.TIPO_PRODUTO, img.URL_IMG as IMG_PRODUTO_1
            FROM FAVORITOS f 
            JOIN PRODUTOS p ON f.ID_ITEM = p.ID_PRODUTO
            LEFT JOIN IMG_PRODUTOS img ON p.ID_PRODUTO = img.ID_PRODUTO
            WHERE f.ID_USUARIO = ? AND f.STATUS_FAVORITO = 'favoritado' AND f.TIPO_ITEM = 'produto'
            GROUP BY p.ID_PRODUTO
        `, [req.session.autenticado.id]);
        
        res.json(favoritos || []);
    } catch (error) {
        console.log('Erro ao buscar favoritos via API:', error);
        res.json([]);
    }
});

// Rota para criar produto de teste
router.post('/debug/criar-produto-teste', verificarUsuAutenticado, async (req, res) => {
    try {
        const userId = req.session.autenticado.id;
        
        const produtoTeste = {
            NOME_PRODUTO: 'Produto Teste - ' + new Date().toLocaleString(),
            PRECO: 99.90,
            TIPO_PRODUTO: 'vestidos',
            COR_PRODUTO: 'azul',
            CONDICAO_PRODUTO: 'novo',
            TAMANHO_PRODUTO: 'M',
            ESTILO_PRODUTO: 'casual',
            DETALHES_PRODUTO: 'Produto criado para teste de funcionalidade',
            STATUS_PRODUTO: 'd',
            QUANTIDADE_ESTOQUE: 1,
            ID_USUARIO: userId
        };
        
        console.log('Criando produto teste:', produtoTeste);
        
        const [resultado] = await pool.query('INSERT INTO PRODUTOS SET ?', [produtoTeste]);
        
        console.log('Produto teste criado com ID:', resultado.insertId);
        
        // Verificar se foi realmente inserido
        const [verificacao] = await pool.query(
            'SELECT * FROM PRODUTOS WHERE ID_PRODUTO = ?',
            [resultado.insertId]
        );
        
        res.json({
            success: true,
            produtoId: resultado.insertId,
            produtoInserido: verificacao[0],
            message: 'Produto teste criado com sucesso!'
        });
    } catch (error) {
        console.log('Erro ao criar produto teste:', error);
        res.json({ success: false, error: error.message });
    }
});

// Rota para calcular frete
router.post('/api/calcular-frete', async function(req, res){
    try {
        const { cep_destino, produto_id } = req.body;
        
        if (!cep_destino || cep_destino.length !== 8) {
            return res.json({ success: false, message: 'CEP inválido' });
        }
        
        // Buscar dados do produto
        const [produto] = await pool.query(
            'SELECT PRECO, NOME_PRODUTO FROM PRODUTOS WHERE ID_PRODUTO = ?',
            [produto_id]
        );
        
        if (produto.length === 0) {
            return res.json({ success: false, message: 'Produto não encontrado' });
        }
        
        // Simular cálculo de frete baseado no CEP
        const cepOrigem = '01310100'; // CEP da empresa (São Paulo)
        const valor = parseFloat(produto[0].PRECO);
        
        // Calcular frete simulado baseado na distância do CEP
        const cepNum = parseInt(cep_destino);
        let frete = 15.00; // Frete base
        
        // Ajustar frete por região (simulação)
        if (cepNum >= 1000000 && cepNum <= 19999999) { // SP
            frete = 12.00;
        } else if (cepNum >= 20000000 && cepNum <= 28999999) { // RJ
            frete = 18.00;
        } else if (cepNum >= 30000000 && cepNum <= 39999999) { // MG
            frete = 20.00;
        } else {
            frete = 25.00; // Outras regiões
        }
        
        // Opções de entrega simuladas
        const opcoes = [
            {
                name: 'PAC',
                price: frete.toFixed(2),
                delivery_time: '7-10'
            },
            {
                name: 'SEDEX',
                price: (frete * 1.8).toFixed(2),
                delivery_time: '2-4'
            },
            {
                name: 'SEDEX 10',
                price: (frete * 2.5).toFixed(2),
                delivery_time: '1'
            }
        ];
        
        res.json({ success: true, opcoes: opcoes });
    } catch (error) {
        console.log('Erro ao calcular frete:', error);
        res.json({ success: false, message: 'Erro interno do servidor' });
    }
});

module.exports = router;
const { produtoModel } = require("../models/produtoModel");
const { body, validationResult } = require("express-validator");

const adicionarController = {
    
    mostrarFormulario: (req, res) => {
        res.render('pages/adicionar', {
            valores: {},
            avisoErro: {}
        });
    },

    regrasValidacao: [
        body('nome_produto')
            .notEmpty()
            .withMessage('Nome do produto é obrigatório')
            .isLength({ min: 3, max: 100 })
            .withMessage('Nome deve ter entre 3 e 100 caracteres'),
        
        body('preco_produto')
            .notEmpty()
            .withMessage('Preço é obrigatório')
            .matches(/^R\$\s?\d+([.,]\d{2})?$/)
            .withMessage('Formato de preço inválido'),
        
        body('categoria_produto')
            .notEmpty()
            .withMessage('Categoria é obrigatória'),
        
        body('condicao_produto')
            .notEmpty()
            .withMessage('Estado da peça é obrigatório'),
        
        body('tamanho_produto')
            .notEmpty()
            .withMessage('Tamanho é obrigatório')
    ],

    criarProduto: async (req, res) => {
        const erros = validationResult(req);
        
        if (!erros.isEmpty()) {
            return res.render('pages/adicionar', {
                valores: req.body,
                avisoErro: {
                    titulo: 'Dados inválidos!',
                    mensagem: 'Verifique os campos obrigatórios',
                    tipo: 'error'
                }
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.render('pages/adicionar', {
                valores: req.body,
                avisoErro: {
                    titulo: 'Imagem obrigatória!',
                    mensagem: 'Por favor, adicione pelo menos uma foto do produto',
                    tipo: 'error'
                }
            });
        }

        const { nome_produto, preco_produto, categoria_produto, cor_produto, condicao_produto, tamanho_produto, descricao_produto } = req.body;
        
        try {
            let imagensProduto = req.files.map(file => file.filename);
            
            
            const dadosProduto = {
                NOME_PRODUTO: nome_produto,
                PRECO_PRODUTO: parseFloat(preco_produto.replace('R$ ', '').replace(',', '.')),
                CATEGORIA_PRODUTO: categoria_produto,
                COR_PRODUTO: cor_produto,
                CONDICAO_PRODUTO: condicao_produto,
                TAMANHO_PRODUTO: tamanho_produto,
                DESCRICAO_PRODUTO: descricao_produto || null,
                IMAGENS_PRODUTO: imagensProduto.join(','),
                STATUS_PRODUTO: 0, 
                ID_USUARIO: req.session.autenticado ? req.session.autenticado.id : null
            };
            
            const resultado = await produtoModel.create(dadosProduto);
            
            if (resultado && resultado.insertId) {
                res.redirect('/homevendedor?sucesso=produto_enviado');
            } else {
                throw new Error('Falha ao criar produto');
            }
            
        } catch (error) {
            console.log('Erro ao criar produto:', error);
            res.render('pages/adicionar', {
                valores: req.body,
                avisoErro: {
                    titulo: 'Erro!',
                    mensagem: 'Erro ao enviar produto para curadoria',
                    tipo: 'error'
                }
            });
        }
    }
};

module.exports = { adicionarController };
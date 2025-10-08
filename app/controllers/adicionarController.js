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
            .withMessage('Preço é obrigatório'),
        
        body('categoria_produto')
            .notEmpty()
            .withMessage('Categoria é obrigatória'),
        
        body('condicao_produto')
            .notEmpty()
            .withMessage('Estado da peça é obrigatório'),
        
        body('tamanho_produto')
            .notEmpty()
            .withMessage('Tamanho é obrigatório'),
        body('estilo_produto')
            .notEmpty()
            .withMessage('Estilo é obrigatório'),
        
        body('cor_produto')
            .notEmpty()
            .withMessage('Cor é obrigatória'),
        
        body('descricao_produto')
            .notEmpty()
            .withMessage('Descrição é obrigatória')
            .isLength({ min: 10 })
            .withMessage('Descrição deve ter pelo menos 10 caracteres'),
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
                    titulo: 'Foto obrigatória!',
                    mensagem: 'Por favor, adicione pelo menos uma foto do produto',
                    tipo: 'error'
                }
            });
        }

        const { nome_produto, preco_produto, categoria_produto, cor_produto, condicao_produto, tamanho_produto, descricao_produto, estilo_produto} = req.body;
        
        try {
            // Converter preço
            let preco = preco_produto.replace(/[R$\s]/g, '').replace(',', '.');
            preco = parseFloat(preco);
            
            const dadosProduto = {
                NOME_PRODUTO: nome_produto,
                PRECO: preco,
                TIPO_PRODUTO: categoria_produto,
                COR_PRODUTO: cor_produto,
                CONDICAO_PRODUTO: condicao_produto,
                TAMANHO_PRODUTO: tamanho_produto,
                ESTILO_PRODUTO: estilo_produto,
                OUTROS: descricao_produto || null,
                STATUS_PRODUTO: 'd',
                ID_USUARIO: req.session.autenticado ? req.session.autenticado.id : null
            };
            
            const resultado = await produtoModel.create(dadosProduto);
            
            if (resultado && resultado.insertId) {
                const imagensInseridas = [];
                
                try {
                    // Salvar imagens na tabela IMG_PRODUTOS (se houver)
                    if (req.files && req.files.length > 0) {
                        for (let file of req.files) {
                            const imagemResult = await produtoModel.createImage({
                                ID_PRODUTO: resultado.insertId,
                                URL_IMG: 'imagem/produtos/' + file.filename
                            });
                            imagensInseridas.push(imagemResult.insertId);
                        }
                    }
                    
                    res.redirect('/homevendedor?sucesso=produto_enviado');
                } catch (imageError) {
                    // Rollback: deletar produto e imagens já inseridas
                    await produtoModel.delete(resultado.insertId);
                    for (let imgId of imagensInseridas) {
                        await produtoModel.deleteImage(imgId);
                    }
                    throw new Error('Falha ao salvar imagens');
                }
            } else {
                throw new Error('Falha ao criar produto');
            }
            
        } catch (error) {
            console.log('Erro ao criar produto:', error);
            
            // Limpar arquivos de upload em caso de erro
            if (req.files && req.files.length > 0) {
                const fs = require('fs');
                req.files.forEach(file => {
                    try {
                        fs.unlinkSync(file.path);
                    } catch (unlinkError) {
                        console.log('Erro ao deletar arquivo:', unlinkError);
                    }
                });
            }
            
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
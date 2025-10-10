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
        

        body('quantidade_estoque')
            .isInt({ min: 1 })
            .withMessage('Quantidade deve ser um número inteiro maior que 0'),
    ],

    criarProduto: async (req, res) => {
        console.log('=== DEBUG ADICIONAR PRODUTO ===');
        console.log('req.files:', req.files);
        console.log('req.file:', req.file);
        console.log('req.body:', req.body);
        
        // Debug do diretório
        const path = require('path');
        const fs = require('fs');
        const uploadDir = path.join(__dirname, '../public/imagem/produtos/');
        console.log('Diretório de upload:', uploadDir);
        console.log('Diretório existe?', fs.existsSync(uploadDir));
        
        if (req.files && req.files.length > 0) {
            req.files.forEach((file, index) => {
                console.log(`Arquivo ${index}:`, {
                    filename: file.filename,
                    path: file.path,
                    size: file.size,
                    mimetype: file.mimetype,
                    destination: file.destination
                });
                console.log('Arquivo existe no disco?', fs.existsSync(file.path));
                
                // Verificar se o diretório do arquivo existe
                const fileDir = path.dirname(file.path);
                console.log('Diretório do arquivo:', fileDir);
                console.log('Diretório do arquivo existe?', fs.existsSync(fileDir));
            });
        } else {
            console.log('Nenhum arquivo foi enviado!');
        }
        
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



        // Verificar se há arquivos (opcional)
        const arquivos = req.files || (req.file ? [req.file] : []);

        const { nome_produto, preco_produto, categoria_produto, cor_produto, condicao_produto, tamanho_produto, descricao_produto, estilo_produto, estampa_produto, quantidade_estoque, outros, status_produto} = req.body;
        
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
                ESTAMPA_PRODUTO: estampa_produto || null,
                DETALHES_PRODUTO: (descricao_produto && descricao_produto.trim()) ? descricao_produto.trim() : 'Produto sem detalhes específicos',
                STATUS_PRODUTO: status_produto || 'd',
                QUANTIDADE_ESTOQUE: parseInt(quantidade_estoque) || 1,
                OUTROS: outros || null,
                ID_USUARIO: req.session.autenticado ? req.session.autenticado.id : null
            };
            
            console.log('dadosProduto:', dadosProduto);
            
            const resultado = await produtoModel.create(dadosProduto);
            
            if (resultado && resultado.insertId) {
                const imagensInseridas = [];
                
                try {
                    // Salvar imagens na tabela IMG_PRODUTOS (se houver)
                    if (arquivos && arquivos.length > 0) {
                        for (let file of arquivos) {
                            const imagemResult = await produtoModel.createImage({
                                ID_PRODUTO: resultado.insertId,
                                URL_IMG: 'imagem/produtos/' + file.filename
                            });
                            imagensInseridas.push(imagemResult.insertId);
                        }
                    }
                    
                    res.redirect('/perfilvender?sucesso=produto_cadastrado');
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
            if (arquivos && arquivos.length > 0) {
                const fs = require('fs');
                const path = require('path');
                arquivos.forEach(file => {
                    try {
                        // Usar o caminho completo do arquivo
                        const filePath = file.path || path.join(__dirname, '../public/imagem/produtos/', file.filename);
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                            console.log('Arquivo deletado:', filePath);
                        }
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
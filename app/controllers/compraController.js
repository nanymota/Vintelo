const { validationResult } = require('express-validator');

const compraController = {
    adicionarAoCarrinho: (req, res) => {
        try {
            const { produto_id, nome, preco, imagem, tamanho } = req.body;
            
            if (!req.session.carrinho) {
                req.session.carrinho = [];
            }
            
            const produtoExistente = req.session.carrinho.find(item => 
                item.produto_id === produto_id && item.tamanho === tamanho
            );
            
            if (produtoExistente) {
                produtoExistente.quantidade += 1;
            } else {
                req.session.carrinho.push({
                    produto_id,
                    nome,
                    preco: parseFloat(preco),
                    imagem,
                    tamanho,
                    quantidade: 1
                });
            }
            
            res.json({ success: true, carrinho: req.session.carrinho });
        } catch (error) {
            console.error('Erro ao adicionar ao carrinho:', error);
            res.json({ success: false, error: 'Erro interno' });
        }
    },
    
    mostrarCarrinho: (req, res) => {
        const carrinho = req.session.carrinho || [];
        const subtotal = carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
        const frete = 10.00;
        const total = subtotal + frete;
        
        res.render('pages/finalizandocompra2', {
            carrinho,
            subtotal: subtotal.toFixed(2),
            frete: frete.toFixed(2),
            total: total.toFixed(2),
            autenticado: req.session.autenticado || null
        });
    },
    
    atualizarQuantidade: (req, res) => {
        try {
            const { produto_id, quantidade } = req.body;
            
            if (!req.session.carrinho) {
                return res.json({ success: false, error: 'Carrinho vazio' });
            }
            
            const item = req.session.carrinho.find(item => item.produto_id === produto_id);
            if (item) {
                item.quantidade = parseInt(quantidade);
                if (item.quantidade <= 0) {
                    req.session.carrinho = req.session.carrinho.filter(i => i.produto_id !== produto_id);
                }
            }
            
            res.json({ success: true, carrinho: req.session.carrinho });
        } catch (error) {
            console.error('Erro ao atualizar quantidade:', error);
            res.json({ success: false, error: 'Erro interno' });
        }
    },

    removerItem: (req, res) => {
        try {
            const { produto_id } = req.body;
            
            if (!req.session.carrinho) {
                return res.json({ success: false, error: 'Carrinho vazio' });
            }
            
            req.session.carrinho = req.session.carrinho.filter(item => item.produto_id !== produto_id);
            
            res.json({ success: true, carrinho: req.session.carrinho });
        } catch (error) {
            console.error('Erro ao remover item:', error);
            res.json({ success: false, error: 'Erro interno' });
        }
    },
    
    finalizarCompra: (req, res) => {
        const carrinho = req.session.carrinho || [];
        
        if (carrinho.length === 0) {
            return res.redirect('/produto2');
        }
        
        const subtotal = carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
        const frete = 10.00;
        const total = subtotal + frete;
        
        res.render('pages/finalizandopagamento', {
            carrinho,
            subtotal: subtotal.toFixed(2),
            frete: frete.toFixed(2),
            total: total.toFixed(2),
            autenticado: req.session.autenticado || null
        });
    },
    
    confirmarPedido: (req, res) => {
        const carrinho = req.session.carrinho || [];
        const subtotal = carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
        const frete = 10.00;
        const total = subtotal + frete;
        
        req.session.carrinho = [];
        
        res.render('pages/pedidoconf', {
            pedido_id: Math.floor(Math.random() * 1000000),
            total: total.toFixed(2),
            metodo_pagamento: req.query.payment_method || 'PIX',
            autenticado: req.session.autenticado || null
        });
    },

    limparCarrinho: (req, res) => {
        try {
            req.session.carrinho = [];
            res.json({ success: true });
        } catch (error) {
            console.error('Erro ao limpar carrinho:', error);
            res.json({ success: false, error: 'Erro interno' });
        }
    }
};

module.exports = compraController;
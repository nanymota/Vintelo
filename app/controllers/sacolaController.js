const sacolaModel = require("../models/sacolaModel");

const sacolaController = {
    buscarSacola: async (req, res) => {
        try {
            const { idUsuario } = req.params;
            const sacola = await sacolaModel.findByUserId(idUsuario);
            res.json(sacola);
        } catch (error) {
            res.status(500).json({ erro: "Erro ao buscar sacola" });
        }
    },

    criarSacola: async (req, res) => {
        try {
            const { idUsuario } = req.body;
            const resultado = await sacolaModel.createSacola(idUsuario);
            res.status(201).json({ 
                sucesso: "Sacola criada com sucesso",
                id: resultado.insertId 
            });
        } catch (error) {
            res.status(500).json({ erro: "Erro ao criar sacola" });
        }
    },

    adicionarItem: async (req, res) => {
        try {
            const { idSacola, idProduto, quantidade } = req.body;
            await sacolaModel.addItem(idSacola, idProduto, quantidade);
            res.json({ sucesso: "Item adicionado à sacola" });
        } catch (error) {
            res.status(500).json({ erro: "Erro ao adicionar item" });
        }
    },

    atualizarQuantidade: async (req, res) => {
        try {
            const { idItem } = req.params;
            const { quantidade } = req.body;
            await sacolaModel.updateQuantidade(idItem, quantidade);
            res.json({ sucesso: "Quantidade atualizada" });
        } catch (error) {
            res.status(500).json({ erro: "Erro ao atualizar quantidade" });
        }
    },

    removerItem: async (req, res) => {
        try {
            const { idItem } = req.params;
            await sacolaModel.removeItem(idItem);
            res.json({ sucesso: "Item removido da sacola" });
        } catch (error) {
            res.status(500).json({ erro: "Erro ao remover item" });
        }
    },

    limparSacola: async (req, res) => {
        try {
            const { idUsuario } = req.params;
            await sacolaModel.limparSacola(idUsuario);
            res.json({ sucesso: "Sacola limpa com sucesso" });
        } catch (error) {
            res.status(500).json({ erro: "Erro ao limpar sacola" });
        }
    },

    obterTotalItens: async (req, res) => {
        try {
            const { idUsuario } = req.params;
            const total = await sacolaModel.getTotalItens(idUsuario);
            res.json({ total });
        } catch (error) {
            res.status(500).json({ erro: "Erro ao obter total de itens" });
        }
    },

    obterValorTotal: async (req, res) => {
        try {
            const { idUsuario } = req.params;
            const valorTotal = await sacolaModel.getValorTotal(idUsuario);
            res.json({ valorTotal });
        } catch (error) {
            res.status(500).json({ erro: "Erro ao obter valor total" });
        }
    }
};

module.exports = sacolaController;
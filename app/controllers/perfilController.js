const perfilModel = require("../models/perfilModel");

const perfilController = {
    listarPerfis: async (req, res) => {
        try {
            const perfis = await perfilModel.findAll();
            res.json(perfis);
        } catch (error) {
            res.status(500).json({ erro: "Erro ao buscar perfis" });
        }
    },

    buscarPerfilPorUsuario: async (req, res) => {
        try {
            const { idUsuario } = req.params;
            const perfil = await perfilModel.findByUserId(idUsuario);
            
            if (perfil.length === 0) {
                return res.status(404).json({ erro: "Perfil não encontrado" });
            }
            
            res.json(perfil[0]);
        } catch (error) {
            res.status(500).json({ erro: "Erro ao buscar perfil" });
        }
    },

    buscarPerfil: async (req, res) => {
        try {
            const { id } = req.params;
            const perfil = await perfilModel.findById(id);
            
            if (perfil.length === 0) {
                return res.status(404).json({ erro: "Perfil não encontrado" });
            }
            
            res.json(perfil[0]);
        } catch (error) {
            res.status(500).json({ erro: "Erro ao buscar perfil" });
        }
    },

    criarPerfil: async (req, res) => {
        try {
            const resultado = await perfilModel.create(req.body);
            res.status(201).json({ 
                sucesso: "Perfil criado com sucesso",
                id: resultado.insertId 
            });
        } catch (error) {
            res.status(500).json({ erro: "Erro ao criar perfil" });
        }
    },

    atualizarPerfil: async (req, res) => {
        try {
            const { id } = req.params;
            await perfilModel.update(req.body, id);
            res.json({ sucesso: "Perfil atualizado com sucesso" });
        } catch (error) {
            res.status(500).json({ erro: "Erro ao atualizar perfil" });
        }
    },

    atualizarPerfilPorUsuario: async (req, res) => {
        try {
            const { idUsuario } = req.params;
            await perfilModel.updateByUserId(req.body, idUsuario);
            res.json({ sucesso: "Perfil atualizado com sucesso" });
        } catch (error) {
            res.status(500).json({ erro: "Erro ao atualizar perfil" });
        }
    },

    deletarPerfil: async (req, res) => {
        try {
            const { id } = req.params;
            await perfilModel.delete(id);
            res.json({ sucesso: "Perfil deletado com sucesso" });
        } catch (error) {
            res.status(500).json({ erro: "Erro ao deletar perfil" });
        }
    },

    seguirPerfil: async (req, res) => {
        try {
            const { idUsuario } = req.params;
            await perfilModel.incrementarSeguidores(idUsuario);
            res.json({ sucesso: "Seguidor adicionado com sucesso" });
        } catch (error) {
            res.status(500).json({ erro: "Erro ao seguir perfil" });
        }
    },


    registrarVenda: async (req, res) => {
        try {
            const { idUsuario } = req.params;
            await perfilModel.incrementarVendidas(idUsuario);
            res.json({ sucesso: "Venda registrada com sucesso" });
        } catch (error) {
            res.status(500).json({ erro: "Erro ao registrar venda" });
        }
    }
};

module.exports = perfilController;
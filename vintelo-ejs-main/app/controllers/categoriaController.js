const categoriaModel = require("../models/categoriaModel");

const categoriaController = {
    mostrarCategorias: async (req, res) => {
        try {
            const categorias = await categoriaModel.findAll() || [];
            const filtros = await categoriaModel.getFilters() || { tamanhos: [], cores: [], condicoes: [] };
            
            const categoryId = req.query.categoria;
            let produtos = [];
            let categoriaAtual = null;
            
            if (categoryId) {
                const categoria = await categoriaModel.findById(categoryId);
                if (categoria && categoria.length > 0) {
                    categoriaAtual = categoria[0];
                    produtos = await categoriaModel.findProductsByCategory(categoryId, req.query) || [];
                }
            }
            
            res.render("pages/categorias", {
                categorias: categorias || [],
                produtos: produtos || [],
                categoriaAtual: categoriaAtual || null,
                filtros: filtros || { tamanhos: [], cores: [], condicoes: [] },
                filtrosAplicados: req.query || {},
                autenticado: req.session.autenticado || null
            });
        } catch (error) {
            console.log('Erro no controller de categorias:', error);
            res.render("pages/categorias", {
                categorias: [],
                produtos: [],
                categoriaAtual: null,
                filtros: { tamanhos: [], cores: [], condicoes: [] },
                filtrosAplicados: {},
                autenticado: req.session.autenticado || null
            });
        }
    },

    filtrarProdutos: async (req, res) => {
        try {
            const categoryId = req.params.categoryId;
            const produtos = await categoriaModel.findProductsByCategory(categoryId, req.query);
            res.json({ success: true, produtos });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
};

module.exports = categoriaController;
const blogModel = require("../models/blogModel");
const { validationResult } = require("express-validator");

const blogController = {
    // Exibir página de administração do blog
    mostrarBlogAdm: async (req, res) => {
        try {
            const posts = await blogModel.findAll();
            res.render("pages/blogadm", { 
                posts: posts,
                autenticado: req.session.autenticado
            });
        } catch (error) {
            console.log(error);
            res.render("pages/blogadm", { 
                posts: [],
                autenticado: req.session.autenticado
            });
        }
    },

    // Criar novo post
    criarPost: async (req, res) => {
        const erros = validationResult(req);
        if (!erros.isEmpty()) {
            return res.json({ erro: "Dados inválidos", detalhes: erros.array() });
        }

        try {
            const dadosBlog = {
                titulo: req.body.titulo,
                categoria: req.body.categoria,
                resumo: req.body.resumo,
                conteudo: req.body.conteudo,
                imagem_principal: req.file ? req.file.filename : null,
                imagens_conteudo: req.files ? req.files.map(file => file.filename) : [],
                subtitulo: req.body.subtitulo,
                autor: req.body.autor || 'Vintélo Fashion',
                tags: req.body.tags,
                status: req.body.status || 'publicado'
            };

            await blogModel.create(dadosBlog);
            res.redirect("/blogadm");
        } catch (error) {
            console.log(error);
            res.json({ erro: "Erro ao criar post" });
        }
    },

    // Exibir página de edição específica
    mostrarEdicao: async (req, res) => {
        try {
            const id = req.params.id || req.query.id;
            const post = await blogModel.findById(id);
            
            if (!post) {
                return res.redirect("/blogadm");
            }

            // Determinar qual página de edição renderizar baseado no ID
            let paginaEdicao = "pages/editarpost";
            if (id == 2) {
                paginaEdicao = "pages/editarboss";
            } else if (id == 3) {
                paginaEdicao = "pages/editargucci";
            }

            res.render(paginaEdicao, { 
                post: post,
                autenticado: req.session.autenticado
            });
        } catch (error) {
            console.log(error);
            res.redirect("/blogadm");
        }
    },

    // Atualizar post
    atualizarPost: async (req, res) => {
        try {
            const id = req.params.id || req.body.id;
            const dadosBlog = {
                titulo: req.body.titulo,
                categoria: req.body.categoria,
                resumo: req.body.resumo,
                conteudo: req.body.conteudo,
                imagem_principal: req.file ? req.file.filename : req.body.imagem_atual,
                imagens_conteudo: req.files ? req.files.map(file => file.filename) : [],
                subtitulo: req.body.subtitulo,
                autor: req.body.autor || 'Vintélo Fashion',
                tags: req.body.tags,
                status: req.body.status || 'publicado'
            };

            await blogModel.update(id, dadosBlog);
            res.redirect("/blogadm");
        } catch (error) {
            console.log(error);
            res.json({ erro: "Erro ao atualizar post" });
        }
    },

    // Deletar post
    deletarPost: async (req, res) => {
        try {
            const id = req.params.id || req.body.id;
            await blogModel.delete(id);
            res.json({ sucesso: "Post deletado com sucesso" });
        } catch (error) {
            console.log(error);
            res.json({ erro: "Erro ao deletar post" });
        }
    }
};

module.exports = blogController;
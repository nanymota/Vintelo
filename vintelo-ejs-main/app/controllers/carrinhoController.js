const { carrinho } = require("../util/carrinho");

const carrinhoController = {

    addItem: (req, res) => {
        try {
            const { id, preco } = req.query;
            carrinho.addItem(id, 1, preco);
            carrinho.atualizarCarrinho(req);
 referer = req.get('Referer') || "/";
            const caminho = referer.split("/")[3] ? "/" + referer.split("/")[3] : "/";
            res.re
            constdirect(caminho);
        } catch (e) {
            console.error(e);
            res.render("pages/index", {
                listaErros: [e.message],
                dadosNotificacao: {
                    titulo: "Erro ao adicionar o item!",
                    mensagem: "Tente novamente mais tarde!",
                    tipo: "error"
                }
            });
        }
    },

    removeItem: (req, res) => {
        try {
            const { id, qtde } = req.query;
            carrinho.removeItem(id, qtde);
            carrinho.atualizarCarrinho(req);

            const referer = req.get('Referer') || "/";
            const caminho = referer.split("/")[3] ? "/" + referer.split("/")[3] : "/";
            res.redirect(caminho);
        } catch (e) {
            console.error(e);
            res.render("pages/index", {
                listaErros: [e.message],
                dadosNotificacao: {
                    titulo: "Erro ao remover o item!",
                    mensagem: "Tente novamente mais tarde!",
                    tipo: "error"
                }
            });
        }
    },

    excluirItem: (req, res) => {
        try {
            const { id } = req.query;
            carrinho.excluirItem(id);
            carrinho.atualizarCarrinho(req);

            const referer = req.get('Referer') || "/";
            const caminho = referer.split("/")[3] ? "/" + referer.split("/")[3] : "/";
            res.redirect(caminho);
        } catch (e) {
            console.error(e);
            res.render("pages/index", {
                listaErros: [e.message],
                dadosNotificacao: {
                    titulo: "Erro ao excluir o item!",
                    mensagem: "Tente novamente mais tarde!",
                    tipo: "error"
                }
            });
        }
    },

    listarcarrinho: (req, res) => {
        try {
            carrinho.atualizarCarrinho(req);
            res.render("pages/carrinho", {
                autenticado: req.session.autenticado,
                carrinho: req.session.carrinho,
                listaErros: null,
            });
        } catch (e) {
            console.error(e);
            res.render("pages/index", {
                autenticado: req.session.autenticado,
                carrinho: null,
                listaErros: [e.message],
                dadosNotificacao: {
                    titulo: "Falha ao Listar Itens!",
                    mensagem: "Tente novamente mais tarde!",
                    tipo: "error"
                }
            });
        }
    },
};

module.exports = { carrinhoController };
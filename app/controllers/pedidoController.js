
const { pedidoModel } = require("../models/pedidoModel");
const moment = require("moment");

const pedidoController = {

    gravarPedido: async (req, res) => {
        try {
            const carrinho = req.session.carrinho;
            const camposJsonPedido = {
                data: moment().format("YYYY-MM-DD HH:mm:ss"),
                ID_USUARIO: req.session.autenticado.id,
                STATUS_PEDIDO: 1
            }
            var create = await pedidoModel.createPedido(camposJsonPedido);
            carrinho.forEach(async element => {
                camposJsonItemPedido = {
                    ID_PEDIDO: create.insertId,
                    ID_PRODUTO: element.codproduto,
                    QUANTIDADE: element.qtde
                }
                await pedidoModel.createItemPedido(camposJsonItemPedido);
            });
            req.session.carrinho = [];
            res.redirect("/");
        } catch (e) {
            console.log(e);
        }
    }
    
}

module.exports = pedidoController
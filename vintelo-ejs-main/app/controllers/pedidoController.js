
const {pedidoModel } = require("../models/pedidoModel");
const moment = require("moment");

const pedidoController = {

    gravarPedido: async (req, res) => {
        try {
            const carrinho = req.session.carrinho;
            const camposJsonPedido = {
                data: moment().format("YYYY-MM-DD HH:mm:ss"),
                USUARIO_ID_USUARIO: req.session.autenticado.id,
                STATUS_PEDIDO: 1,
                STATUS_PAGAMENTO: req.query.status,
                ID_PAGAMENTO: req.query.payment_id
            }
            var create = await pedidoModel.createPedido(camposJsonPedido);
            carrinho.forEach(async element => {
                camposJsonItemPedido = {
                    PEDIDO_ID_PEDIDO: create.insertId,
                    PRODUTO_ID_PRODUTO: element.codproduto,
                    quantidade: element.qtde
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

module.exports = {pedidoController}
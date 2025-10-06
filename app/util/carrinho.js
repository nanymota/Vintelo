const { hqModel } = require("../models/produtoModel");

const carrinho = {
    itensCarrinho: [],

    atualizarCarrinho: (req) => {
        
        try {
            if (!req.session) req.session = {};
            req.session.carrinho = carrinho.itensCarrinho;
        } catch (error) {
            console.error("atualizarCarrinho:", error);
        }
    },

    removeItem: (codItem, qtde) => {
        try {
            const idStr = String(codItem);
            const quantidade = Number(qtde) || 0;
            let indice = carrinho.itensCarrinho.findIndex(
                (element) => String(element.codproduto) === idStr
            );
            if (indice !== -1) {
                carrinho.itensCarrinho[indice].qtde = Number(carrinho.itensCarrinho[indice].qtde) - quantidade;
                if (carrinho.itensCarrinho[indice].qtde <= 0) {
                    carrinho.itensCarrinho.splice(indice, 1);
                }
            }
        } catch (error) {
            console.error("removeItem:", error);
        }
    },

    excluirItem: (codItem) => {
        try {
            const idStr = String(codItem);
            let indice = carrinho.itensCarrinho.findIndex(
                (element) => String(element.codproduto) === idStr
            );
            if (indice !== -1) {
                carrinho.itensCarrinho.splice(indice, 1);
            }
        } catch (error) {
            console.error("excluirItem:", error);
        }
    },

    getQtdeItens: () => {
        try {
           
            return carrinho.itensCarrinho.length;
        } catch (error) {
            console.error("getQtdeItens:", error);
            return 0;
        }
    },

    addItem: async (codItem, qtde, preco) => {
        try {
            const idStr = String(codItem);
            const quantidade = Number(qtde) || 1;

           
            let indice = carrinho.itensCarrinho.findIndex(
                (element) => String(element.codproduto) === idStr
            );

            if (indice === -1) {
                const hq = await hqModel.findID(codItem);
                if (hq && produto.length > 0) {
                    const valor = (preco !== undefined && preco !== null && preco !== "")
                        ? parseFloat(preco)
                        : parseFloat(hq[0].preco_hq);
                    carrinho.itensCarrinho.push({
                        codproduto: codItem,
                        qtde: quantidade,
                        preco: isNaN(valor) ? 0 : valor,
                        produto: produto[0].NOME_PRODUTO,
                        imagem: produto[0].IMAGEM_PRODUTO,
                    });
                }
            } else {
                
                carrinho.itensCarrinho[indice].qtde = Number(carrinho.itensCarrinho[indice].qtde) + quantidade;
            }
        } catch (error) {
            console.error("addItem:", error);
        }
    }
}
module.exports = { carrinho };
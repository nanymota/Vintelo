var pool = require("../config/pool_conexoes");

    const PedidoModel = {
        findAll: async () => {
            try {
                const [resultados] = await pool.query(
                    'SELECT * FROM PEDIDOS'
                )
                return resultados;
            } catch (error) {
                return error;
            }
        },
        
        findId: async (id) => {
            try {
                const [resultados] = await pool.query(
                    "select * from PEDIDOS where ID_PEDIDO = ?",
                    [id]
                )
                return resultados;
            } catch (error) {
                return error;
            }
        },

        createPedido: async (camposJson) => {
            try {
                const [resultados] = await pool.query(
                    "insert into PEDIDOS set ?",
                    [camposJson]
                )
                return resultados;
            } catch (error) {
                return error;
            }
        },
        
        createItemPedido: async (camposJson) => {
            try {
                const [resultados] = await pool.query(
                    "INSERT INTO ITEM_PEDIDO SET ?",
                    [camposJson]
                )
                return resultados;
            } catch (error) {
                return error;
            }
        },

        findItensPedido: async (idPedido) => {
            try {
                const [resultados] = await pool.query(
                    "SELECT * FROM ITEM_PEDIDO WHERE ID_PEDIDO = ?",
                    [idPedido]
                )
                return resultados;
            } catch (error) {
                return error;
            }
        },

        findPedidoCompleto: async (idPedido) => {
            try {
                const [resultados] = await pool.query(
                    "SELECT p.*, ip.*, pr.NOME_PRODUTO FROM PEDIDOS p " +
                    "LEFT JOIN ITEM_PEDIDO ip ON p.ID_PEDIDO = ip.ID_PEDIDO " +
                    "LEFT JOIN PRODUTOS pr ON ip.ID_PRODUTO = pr.ID_PRODUTO " +
                    "WHERE p.ID_PEDIDO = ?",
                    [idPedido]
                )
                return resultados;
            } catch (error) {
                return error;
            }
        },

        updateItemPedido: async (camposJson, idItem) => {
            try {
                const [resultados] = await pool.query(
                    "UPDATE ITEM_PEDIDO SET ? WHERE ID_ITEM_PEDIDO = ?",
                    [camposJson, idItem]
                )
                return resultados;
            } catch (error) {
                return error;
            }
        },

        deleteItemPedido: async (idItem) => {
            try {
                const [resultados] = await pool.query(
                    "DELETE FROM ITEM_PEDIDO WHERE ID_ITEM_PEDIDO = ?",
                    [idItem]
                )
                return resultados;
            } catch (error) {
                return error;
            }
        },

        update: async (camposJson, id) => {
            try {
                const [resultados] = await pool.query(
                    "UPDATE PEDIDOS SET  ? WHERE ID_PEDIDO = ?",
                    [camposJson, id],
                )
                return resultados;
            } catch (error) {
                return error;
            }
        },
        
        delete: async (id) => {
            try {
                const [resultados] = await pool.query(
                    "UPDATE PEDIDOS SET STATUS = 0 WHERE ID_PEDIDO = ?", [id]
                )
                return resultados;
            } catch (error) {
                return error;
            }
        }
    };

module.exports = { pedidoModel: PedidoModel }
const { MercadoPagoConfig, Preference } = require('mercadopago');

// Configurar Mercado Pago
const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || 'TEST-YOUR-ACCESS-TOKEN'
});

const processarPagamento = async (req, res) => {
    try {
        const { valor, descricao, metodo_pagamento } = req.body;
        
        const preference = {
            items: [
                {
                    title: descricao,
                    unit_price: parseFloat(valor),
                    quantity: 1,
                }
            ],
            back_urls: {
                success: `${req.protocol}://${req.get('host')}/pagamento-sucesso`,
                failure: `${req.protocol}://${req.get('host')}/pagamento-falha`,
                pending: `${req.protocol}://${req.get('host')}/pagamento-pendente`
            },
            auto_return: 'approved',
            external_reference: `vintelo-${Date.now()}`,
            notification_url: `${req.protocol}://${req.get('host')}/webhook-mercadopago`
        };

        const preference_client = new Preference(client);
        const response = await preference_client.create({ body: preference });
        
        res.json({
            success: true,
            payment_url: response.init_point,
            preference_id: response.id
        });
        
    } catch (error) {
        console.error('Erro ao processar pagamento:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
};

const pagamentoSucesso = (req, res) => {
    res.redirect('/confirmar-pedido?payment_method=Mercado Pago');
};

const pagamentoFalha = (req, res) => {
    res.redirect('/finalizandopagamento?error=payment_failed');
};

const pagamentoPendente = (req, res) => {
    res.redirect('/pedidoconf?status=pending');
};

const webhookMercadoPago = async (req, res) => {
    try {
        const { type, data } = req.body;
        
        if (type === 'payment') {
            console.log('Payment notification received:', data.id);
        }
        
        res.status(200).send('OK');
    } catch (error) {
        console.error('Erro no webhook:', error);
        res.status(500).send('Error');
    }
};

module.exports = {
    processarPagamento,
    pagamentoSucesso,
    pagamentoFalha,
    pagamentoPendente,
    webhookMercadoPago
};
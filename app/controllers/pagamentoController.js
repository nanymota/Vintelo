const { MercadoPagoConfig, Preference } = require('mercadopago');

// Configurar Mercado Pago
const client = new MercadoPagoConfig({
    accessToken: process.env.accessToken
});

const processarPagamento = async (req, res) => {
    try {
        const { valor, descricao, metodo_pagamento } = req.body;
        
        console.log('Dados recebidos:', { valor, descricao, metodo_pagamento });
        console.log('Valor parseado:', parseFloat(valor));
        
        const preference = {
            items: [
                {
                    title: descricao || 'Compra Vintélo',
                    unit_price: Number(parseFloat(valor).toFixed(2)),
                    quantity: 1,
                }
            ],
            back_urls: {
                success: `${process.env.URL_BASE || req.protocol + '://' + req.get('host')}/pagamento-sucesso`,
                failure: `${process.env.URL_BASE || req.protocol + '://' + req.get('host')}/pagamento-falha`,
                pending: `${process.env.URL_BASE || req.protocol + '://' + req.get('host')}/pagamento-falha`
            },
            external_reference: `vintelo-${Date.now()}`
        };

        const preference_client = new Preference(client);
        const response = await preference_client.create({ body: preference });
        
        console.log('Preference ID criado:', response.id);
        
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
    const { payment_id, status, external_reference, merchant_order_id } = req.query;
    
    console.log('Pagamento aprovado:', {
        payment_id,
        status,
        external_reference,
        merchant_order_id
    });
    
    res.render('pages/pagamentoSucesso', {
        autenticado: req.session.autenticado || null,
        payment_id,
        external_reference
    });
};

const pagamentoFalha = (req, res) => {
    const { payment_id, status, external_reference, merchant_order_id } = req.query;
    
    console.log('Pagamento recusado:', {
        payment_id,
        status,
        external_reference,
        merchant_order_id
    });
    
    res.render('pages/pagamentoFalha', {
        autenticado: req.session.autenticado || null,
        payment_id,
        external_reference
    });
};

const pagamentoPendente = (req, res) => {
    const { payment_id, status, external_reference, merchant_order_id } = req.query;
    
    console.log('Pagamento pendente:', {
        payment_id,
        status,
        external_reference,
        merchant_order_id
    });
    
    res.render('pages/pagamentoPendente', {
        autenticado: req.session.autenticado || null,
        payment_id,
        external_reference
    });
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
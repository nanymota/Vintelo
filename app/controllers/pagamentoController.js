const { MercadoPagoConfig, Preference } = require('mercadopago');

const client = new MercadoPagoConfig({
    accessToken: process.env.accessToken
});

const processarPagamento = async (req, res) => {
    try {
        const { valor, descricao, metodo_pagamento } = req.body;
        
        console.log('Dados recebidos:', { valor, descricao, metodo_pagamento });
        console.log('Access Token configurado:', !!process.env.accessToken);
        
        if (!process.env.accessToken) {
            throw new Error('Access Token do Mercado Pago não configurado');
        }
        
        const valorNumerico = Number(parseFloat(valor).toFixed(2));
        if (isNaN(valorNumerico) || valorNumerico <= 0) {
            throw new Error('Valor inválido para pagamento');
        }
        
        console.log('Valor parseado:', valorNumerico);
        
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        console.log('Base URL:', baseUrl);
        
        const preference = {
            items: [
                {
                    title: descricao || 'Compra Vintélo',
                    unit_price: valorNumerico,
                    quantity: 1
                }
            ],
            back_urls: {
                success: `${baseUrl}/pagamento-sucesso`,
                failure: `${baseUrl}/pagamento-falha`,
                pending: `${baseUrl}/pagamento-pendente`
            },
            auto_return: 'approved',
            external_reference: `vintelo-${Date.now()}`
        };
        
        console.log('Preference criada:', JSON.stringify(preference, null, 2));

        const preference_client = new Preference(client);
        const response = await preference_client.create({ body: preference });
        
        console.log('Preference ID criado:', response.id);
        console.log('Init point:', response.init_point);
        
        res.json({
            success: true,
            payment_url: response.init_point,
            preference_id: response.id
        });
        
    } catch (error) {
        console.error('Erro ao processar pagamento:', error);
        console.error('Detalhes do erro:', error.message);
        console.error('Stack trace:', error.stack);
        
        let errorMessage = 'Erro ao conectar com Mercado Pago';
        if (error.message.includes('auto_return')) {
            errorMessage = 'Erro de configuração nas URLs de retorno';
        } else if (error.message.includes('back_url')) {
            errorMessage = 'URLs de retorno inválidas';
        } else if (error.message.includes('Access Token')) {
            errorMessage = 'Token de acesso não configurado';
        }
        
        res.status(500).json({
            success: false,
            error: errorMessage + ': ' + error.message
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
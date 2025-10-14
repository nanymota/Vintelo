const axios = require('axios');

class FreteService {
    constructor() {
        this.baseURL = 'https://www.melhorenvio.com.br/api/v2/me';
        this.token = process.env.MELHOR_ENVIO_TOKEN; // Adicionar no .env
    }

    async calcularFrete(cepOrigem, cepDestino, peso, altura, largura, comprimento, valor) {
        try {
            const response = await axios.post(`${this.baseURL}/shipment/calculate`, {
                from: {
                    postal_code: cepOrigem
                },
                to: {
                    postal_code: cepDestino
                },
                products: [{
                    id: "1",
                    width: largura,
                    height: altura,
                    length: comprimento,
                    weight: peso,
                    insurance_value: valor,
                    quantity: 1
                }]
            }, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data;
        } catch (error) {
            console.error('Erro ao calcular frete:', error);
            return null;
        }
    }
}

module.exports = FreteService;
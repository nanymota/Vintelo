// Controller para Perfil Premium

// Atualizar valor do plano
const atualizarPlano = async (req, res) => {
    try {
        const { planType, price } = req.body;
        
        // Validar dados
        if (!planType || !price) {
            return res.status(400).json({ 
                success: false, 
                message: 'Tipo de plano e preço são obrigatórios' 
            });
        }
        
        // Validar preço
        const priceValue = parseFloat(price);
        if (isNaN(priceValue) || priceValue <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Preço deve ser um valor válido maior que zero' 
            });
        }
        
        // Aqui você salvaria no banco de dados
        // Exemplo: await planModel.updatePrice(planType, priceValue);
        
        console.log(`Plano ${planType} atualizado para R$ ${priceValue}`);
        
        res.json({ 
            success: true, 
            message: `Plano ${planType} atualizado com sucesso!`,
            planType,
            newPrice: priceValue
        });
        
    } catch (error) {
        console.error('Erro ao atualizar plano:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro interno do servidor' 
        });
    }
};

// Alternar status do plano
const alternarStatusPlano = async (req, res) => {
    try {
        const { planType, status } = req.body;
        
        if (!planType || status === undefined) {
            return res.status(400).json({ 
                success: false, 
                message: 'Tipo de plano e status são obrigatórios' 
            });
        }
        
        // Aqui você salvaria no banco de dados
        // Exemplo: await planModel.updateStatus(planType, status);
        
        console.log(`Plano ${planType} ${status ? 'ativado' : 'desativado'}`);
        
        res.json({ 
            success: true, 
            message: `Plano ${planType} ${status ? 'ativado' : 'desativado'} com sucesso!`,
            planType,
            newStatus: status
        });
        
    } catch (error) {
        console.error('Erro ao alterar status do plano:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro interno do servidor' 
        });
    }
};

module.exports = {
    atualizarPlano,
    alternarStatusPlano
};
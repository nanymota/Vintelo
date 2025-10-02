// JavaScript Reformulado - Perfil Premium

document.addEventListener('DOMContentLoaded', function() {
    // Navegação entre abas
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Remover classe active
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Adicionar classe active
            this.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });
    
    // Botões de salvar planos
    document.querySelectorAll('.btn-save').forEach(btn => {
        btn.addEventListener('click', async function() {
            const planCard = this.closest('.plan-card');
            const planName = planCard.querySelector('h3').textContent;
            const priceInput = planCard.querySelector('input');
            const newPrice = priceInput.value;
            
            // Determinar tipo do plano
            let planType = 'basic';
            if (planName.includes('Premium')) planType = 'premium';
            if (planName.includes('Enterprise')) planType = 'enterprise';
            
            try {
                const response = await fetch('/premium/atualizar-plano', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        planType: planType,
                        price: newPrice
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showNotification(result.message, 'success');
                } else {
                    showNotification(result.message, 'error');
                }
            } catch (error) {
                console.error('Erro ao salvar plano:', error);
                showNotification('Erro ao salvar plano. Tente novamente.', 'error');
            }
        });
    });
    
    // Botões de ativar/desativar planos
    document.querySelectorAll('.btn-toggle').forEach(btn => {
        btn.addEventListener('click', async function() {
            const planCard = this.closest('.plan-card');
            const planName = planCard.querySelector('h3').textContent;
            const isActive = this.textContent === 'Desativar';
            
            // Determinar tipo do plano
            let planType = 'basic';
            if (planName.includes('Premium')) planType = 'premium';
            if (planName.includes('Enterprise')) planType = 'enterprise';
            
            try {
                const response = await fetch('/premium/alternar-status', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        planType: planType,
                        status: !isActive
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    if (isActive) {
                        this.textContent = 'Ativar';
                        planCard.style.opacity = '0.6';
                    } else {
                        this.textContent = 'Desativar';
                        planCard.style.opacity = '1';
                    }
                    showNotification(result.message, isActive ? 'warning' : 'success');
                } else {
                    showNotification(result.message, 'error');
                }
            } catch (error) {
                console.error('Erro ao alterar status do plano:', error);
                showNotification('Erro ao alterar status. Tente novamente.', 'error');
            }
        });
    });
    
    // Botões de visualizar usuários
    document.querySelectorAll('.btn-view').forEach(btn => {
        btn.addEventListener('click', function() {
            const userName = this.closest('.user-item').querySelector('strong').textContent;
            showNotification(`Visualizando perfil de ${userName}`, 'info');
        });
    });
    
    // Botões de suspender usuários
    document.querySelectorAll('.btn-suspend').forEach(btn => {
        btn.addEventListener('click', function() {
            const userItem = this.closest('.user-item');
            const userName = userItem.querySelector('strong').textContent;
            
            if (this.textContent === 'Suspender') {
                this.textContent = 'Reativar';
                userItem.style.opacity = '0.6';
                showNotification(`Usuário ${userName} suspenso`, 'warning');
            } else {
                this.textContent = 'Suspender';
                userItem.style.opacity = '1';
                showNotification(`Usuário ${userName} reativado`, 'success');
            }
        });
    });
    
    // Animar barras dos gráficos
    setTimeout(() => {
        document.querySelectorAll('.fill').forEach(fill => {
            const width = fill.style.width;
            fill.style.width = '0%';
            setTimeout(() => {
                fill.style.width = width;
            }, 200);
        });
    }, 500);
});

// Função para mostrar notificações
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    // Cores baseadas no tipo
    switch(type) {
        case 'success':
            notification.style.background = '#2d7d32';
            break;
        case 'warning':
            notification.style.background = '#ff9800';
            break;
        case 'info':
            notification.style.background = '#1976d2';
            break;
        default:
            notification.style.background = '#7D2838';
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}
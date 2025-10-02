document.addEventListener('DOMContentLoaded', function() {
    const buttons = document.querySelectorAll('.plano button');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();

            const planoCard = this.closest('.plano');
            const planoNome = planoCard.querySelector('h2').textContent;
            const planoPreco = planoCard.querySelector('.preco strong').textContent;
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);

            showPlanModal(planoNome, planoPreco);
        });
    });
});

function showPlanModal(planName, price) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;

    const modal = document.createElement('div');
    modal.className = 'plan-modal';
    modal.style.cssText = `
        background: white;
        padding: 2rem;
        border-radius: 1rem;
        text-align: center;
        max-width: 400px;
        width: 90%;
        transform: scale(0.8);
        transition: transform 0.3s ease;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    `;
    
    modal.innerHTML = `
        <div style="margin-bottom: 1.5rem;">
            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #6d1a35, #501127); border-radius: 50%; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 1.5rem;">✓</span>
            </div>
            <h3 style="color: #6d1a35; margin-bottom: 0.5rem; font-size: 1.5rem;">Plano ${planName} Selecionado!</h3>
            <p style="color: #666; margin-bottom: 1.5rem;">Valor: R$${price}/mês</p>
        </div>
        
        <div style="margin-bottom: 2rem;">
            <p style="color: #333; margin-bottom: 1rem;">Você será redirecionado para finalizar sua assinatura.</p>
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
                <p style="font-size: 0.9rem; color: #666;">
                    <strong>Próximos passos:</strong><br>
                    • Criar conta ou fazer login<br>
                    • Escolher forma de pagamento<br>
                    • Confirmar assinatura
                </p>
            </div>
        </div>
        
        <div style="display: flex; gap: 1rem; justify-content: center;">
            <button id="confirmPlan" style="
                background: linear-gradient(135deg, #6d1a35, #501127);
                color: white;
                border: none;
                padding: 0.8rem 1.5rem;
                border-radius: 2rem;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.3s ease;
            ">Continuar</button>
            <button id="cancelPlan" style="
                background: #f8f9fa;
                color: #666;
                border: 1px solid #ddd;
                padding: 0.8rem 1.5rem;
                border-radius: 2rem;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.3s ease;
            ">Cancelar</button>
        </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    setTimeout(() => {
        overlay.style.opacity = '1';
        modal.style.transform = 'scale(1)';
    }, 10);

    const confirmBtn = modal.querySelector('#confirmPlan');
    const cancelBtn = modal.querySelector('#cancelPlan');
    
    confirmBtn.addEventListener('click', () => {
        confirmBtn.innerHTML = '<span style="display: inline-block; animation: spin 1s linear infinite;">⟳</span> Processando...';
        confirmBtn.style.pointerEvents = 'none';
        
        setTimeout(() => {
            closeModal(overlay);
            showSuccessMessage(planName);
        }, 2000);
    });
    
    cancelBtn.addEventListener('click', () => {
        closeModal(overlay);
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeModal(overlay);
        }
    });

    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}

function closeModal(overlay) {
    const modal = overlay.querySelector('.plan-modal');
    overlay.style.opacity = '0';
    modal.style.transform = 'scale(0.8)';
    
    setTimeout(() => {
        document.body.removeChild(overlay);
    }, 300);
}

function showSuccessMessage(planName) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #4CAF50, #2E7D32);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
        z-index: 1001;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
    `;
    
    notification.innerHTML = `
        <section style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 1.2rem;">✓</span>
            <section>
                <strong>Sucesso!</strong><br>
                <small>Plano ${planName} será ativado em breve.</small>
            </section>
        </section>
    `;
    
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);

    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 4000);
}
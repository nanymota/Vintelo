// Função global para favoritar produtos
function toggleFavorite(button, produtoId) {
    if (!window.isAuthenticated) {
        showNotification('Faça login para favoritar produtos', 'error');
        return;
    }

    fetch('/favoritar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ produto_id: produtoId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            button.classList.toggle('favorited');
            if (data.favorited) {
                showNotification('Produto adicionado aos favoritos!', 'success');
            } else {
                showNotification('Produto removido dos favoritos', 'info');
            }
        } else {
            showNotification('Erro ao favoritar produto', 'error');
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        showNotification('Erro ao favoritar produto', 'error');
    });
}

// Função para mostrar notificações
function showNotification(message, type = 'info') {
    // Remove notificação existente
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }

    // Cria nova notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;

    // Adiciona ao body
    document.body.appendChild(notification);

    // Remove automaticamente após 3 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}

// CSS para notificações
const notificationCSS = `
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    animation: slideIn 0.3s ease;
}

.notification-success {
    background: #28a745;
}

.notification-error {
    background: #dc3545;
}

.notification-info {
    background: #17a2b8;
}

.notification button {
    background: none;
    border: none;
    color: white;
    font-size: 18px;
    cursor: pointer;
    padding: 0;
    margin-left: 10px;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}
`;

// Adiciona CSS ao head
if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = notificationCSS;
    document.head.appendChild(style);
}
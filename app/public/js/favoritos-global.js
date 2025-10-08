// Sistema Global de Favoritos
function toggleFavorite(button, produto_id, nome = '', preco = '', imagem = '') {
    // Verificar se está autenticado
    if (!window.isAuthenticated) {
        window.location.href = '/cadastro';
        return;
    }
    
    // Dados do produto
    const produtoData = {
        produto_id: produto_id,
        nome: nome || button.closest('.product-card').querySelector('h2')?.textContent || 'Produto',
        preco: preco || button.closest('.product-card').querySelector('.price')?.textContent || '0',
        imagem: imagem || button.closest('.product-card').querySelector('img')?.src || ''
    };
    
    // Fazer requisição para favoritar/desfavoritar
    fetch('/favoritar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(produtoData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Atualizar visual do botão
            if (data.favorited) {
                button.classList.add('favorited');
                showNotification('Item adicionado aos favoritos!');
            } else {
                button.classList.remove('favorited');
                showNotification('Item removido dos favoritos!');
            }
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        showNotification('Erro ao processar favorito');
    });
}

// Verificar favoritos ao carregar página
function verificarFavoritos() {
    if (!window.isAuthenticated) return;
    
    const buttons = document.querySelectorAll('.favorite');
    buttons.forEach(button => {
        const productCard = button.closest('.product-card');
        if (productCard) {
            const produto_id = button.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
            if (produto_id) {
                fetch(`/verificar-favorito/${produto_id}`)
                .then(response => response.json())
                .then(data => {
                    if (data.favorited) {
                        button.classList.add('favorited');
                    }
                });
            }
        }
    });
}

// Notificação simples
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #7D2838;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 9999;
        font-size: 14px;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Inicializar ao carregar página
document.addEventListener('DOMContentLoaded', verificarFavoritos);
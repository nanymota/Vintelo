// Função global para adicionar produtos à sacola
function addToCart(produtoId) {
    if (!window.isAuthenticated) {
        showNotification('Faça login para adicionar produtos à sacola', 'error');
        return;
    }

    fetch('/favoritar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ produto_id: produtoId, tipo: 'sacola' })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Produto adicionado à sacola!', 'success');
        } else {
            showNotification('Erro ao adicionar produto à sacola', 'error');
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        showNotification('Erro ao adicionar produto à sacola', 'error');
    });
}

// Função para atualizar contador da sacola
function updateCartCount() {
    fetch('/sacola/count')
    .then(response => response.json())
    .then(data => {
        const cartIcons = document.querySelectorAll('.cart-count');
        cartIcons.forEach(icon => {
            icon.textContent = data.count || 0;
        });
    })
    .catch(error => console.error('Erro ao atualizar contador:', error));
}

// Aliases para compatibilidade
window.adicionarAoCarrinho = addToCart;
window.adicionarSacola = addToCart;
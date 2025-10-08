function toggleFavorite(button, productId) {
    if (typeof window.isAuthenticated !== 'undefined' && window.isAuthenticated) {
        fetch('/favoritar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ produto_id: productId })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                button.classList.toggle('favorited');
            }
        })
        .catch(error => console.error('Erro:', error));
    } else {
        window.location.href = '/cadastro';
    }
}

function addToCart(productId) {
    if (typeof window.isAuthenticated !== 'undefined' && window.isAuthenticated) {
        fetch('/addItem?id=' + productId, {
            method: 'GET'
        })
        .then(response => {
            if (response.ok) {
                console.log('Produto adicionado ao carrinho');
            }
        })
        .catch(error => console.error('Erro:', error));
    } else {
        window.location.href = '/cadastro';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const favoriteButtons = document.querySelectorAll('.favorite:not([onclick])');
    favoriteButtons.forEach((button, index) => {
        button.addEventListener('click', function() {
            toggleFavorite(this, index + 1);
        });
    });
    
    const cartButtons = document.querySelectorAll('.cart:not([onclick])');
    cartButtons.forEach((button, index) => {
        button.addEventListener('click', function() {
            addToCart(index + 1);
        });
    });
});
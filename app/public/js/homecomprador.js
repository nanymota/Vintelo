// Função para favoritar produtos
function toggleFavorite(button, productId) {
    if (window.isAuthenticated) {
        const isFavorited = button.classList.contains('favorited');
        
        fetch('/favoritar?id=' + productId, {
            method: 'GET'
        })
        .then(response => {
            if (response.ok) {
                button.classList.toggle('favorited');
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
            addToCartButton(this, index + 1);
        });
    });
});

// Função para adicionar ao carrinho
function addToCart(productId) {
    if (window.isAuthenticated) {
        fetch('/addItem?id=' + productId, {
            method: 'GET'
        })
        .then(response => {
            if (response.ok) {
                const button = event.target.closest('.cart');
                if (button) {
                    button.style.transform = 'scale(1.3)';
                    setTimeout(() => {
                        button.style.transform = 'scale(1)';
                    }, 200);
                }
            }
        })
        .catch(error => console.error('Erro:', error));
    } else {
        window.location.href = '/cadastro';
    }
}

function addToCartButton(button, productId) {
    if (window.isAuthenticated) {
        fetch('/addItem?id=' + productId, {
            method: 'GET'
        })
        .then(response => {
            if (response.ok) {
                button.style.transform = 'scale(1.3)';
                setTimeout(() => {
                    button.style.transform = 'scale(1)';
                }, 200);
            }
        })
        .catch(error => console.error('Erro:', error));
    } else {
        window.location.href = '/cadastro';
    }
}
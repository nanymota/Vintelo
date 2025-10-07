function toggleFavorite(button, productId) {
    if (window.isAuthenticated) {
        const isFavorited = button.classList.contains('favorited');
        
        if (isFavorited) {
            button.classList.remove('favorited');
            removeFavorite(productId);
        } else {
            button.classList.add('favorited');
            addFavorite(productId);
        }
    } else {
        window.location.href = '/cadastro';
    }
}

function addFavorite(productId) {
    fetch('/favoritar?id=' + productId, {
        method: 'GET'
    }).catch(error => console.log('Erro ao favoritar:', error));
}

function removeFavorite(productId) {
    fetch('/favoritar?id=' + productId, {
        method: 'GET'
    }).catch(error => console.log('Erro ao desfavoritar:', error));
}

// Função para adicionar ao carrinho
function addToCart(button, productId) {
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
        .catch(error => console.log('Erro ao adicionar ao carrinho:', error));
    } else {
        window.location.href = '/cadastro';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const favoriteButtons = document.querySelectorAll('.favorite');
    favoriteButtons.forEach((button, index) => {
        button.addEventListener('click', function() {
            toggleFavorite(this, index + 1);
        });
    });
    
    const cartButtons = document.querySelectorAll('.cart');
    cartButtons.forEach((button, index) => {
        button.addEventListener('click', function() {
            addToCart(this, index + 1);
        });
    });
});
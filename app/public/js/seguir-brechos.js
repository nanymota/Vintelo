// Funcionalidade para seguir/favoritar brechós
function toggleFollowBrecho(button, brechoId) {
    if (!window.isAuthenticated) {
        alert('Você precisa estar logado para seguir brechós!');
        window.location.href = '/cadastro';
        return;
    }

    const isFollowing = button.classList.contains('following');
    
    fetch('/api/seguir-brecho', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            brechoId: brechoId,
            action: isFollowing ? 'unfollow' : 'follow'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (isFollowing) {
                button.textContent = 'Seguir';
                button.classList.remove('following');
            } else {
                button.textContent = 'Seguindo';
                button.classList.add('following');
            }
        } else {
            alert('Erro ao seguir brechó. Tente novamente.');
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao seguir brechó. Tente novamente.');
    });
}

// Funcionalidade para favoritar brechós (alternativa ao seguir)
function toggleFavoriteBrecho(button, brechoId) {
    if (!window.isAuthenticated) {
        alert('Você precisa estar logado para favoritar brechós!');
        window.location.href = '/cadastro';
        return;
    }

    const isFavorited = button.classList.contains('favorited');
    
    fetch('/api/favoritar-brecho', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            brechoId: brechoId,
            action: isFavorited ? 'unfavorite' : 'favorite'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (isFavorited) {
                button.textContent = 'Favoritar';
                button.classList.remove('favorited');
            } else {
                button.textContent = 'Favoritado';
                button.classList.add('favorited');
            }
        } else {
            alert('Erro ao favoritar brechó. Tente novamente.');
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao favoritar brechó. Tente novamente.');
    });
}
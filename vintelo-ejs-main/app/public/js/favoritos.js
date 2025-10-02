function favoritar(produtoId) {
    fetch(`/favoritar?idProduto=${produtoId}&situacao=favoritar`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const btn = document.querySelector(`[data-produto-id="${produtoId}"]`);
                btn.style.opacity = '0.5';
                alert('Produto adicionado aos favoritos!');
            } else {
                alert('Erro ao favoritar produto');
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro ao favoritar produto');
        });
}

// Adicionar IDs aos botões de favorito quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    const favoriteButtons = document.querySelectorAll('.favorite');
    favoriteButtons.forEach((btn, index) => {
        if (!btn.hasAttribute('data-produto-id')) {
            btn.setAttribute('data-produto-id', index + 1);
            btn.setAttribute('onclick', `favoritar(${index + 1})`);
        }
    });
});
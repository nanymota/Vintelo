// Funcionalidades da página de perfil do brechó

// Função para voltar na navegação
function goBack() {
    window.history.back();
}

// Inicialização quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    // Event listener para botão de seguir brechó
    const followBtn = document.querySelector('.follow-btn');
    if (followBtn) {
        followBtn.addEventListener('click', function() {
            const brechoId = this.dataset.brechoId;
            if (typeof toggleFollowBrecho === 'function') {
                toggleFollowBrecho(this, brechoId);
            }
        });
    }

    // Event listeners para botões de favorito
    document.querySelectorAll('.favorite').forEach(button => {
        button.addEventListener('click', function() {
            const produtoId = this.dataset.produtoId;
            if (typeof toggleFavorite === 'function') {
                toggleFavorite(this, produtoId);
            }
        });
    });

    // Event listeners para botões de carrinho
    document.querySelectorAll('.cart').forEach(button => {
        button.addEventListener('click', function() {
            const produtoId = this.dataset.produtoId;
            if (typeof adicionarAoCarrinho === 'function') {
                adicionarAoCarrinho(produtoId);
            }
        });
    });

    // Event listener para botão "Ver mais"
    const loadMoreBtn = document.querySelector('.load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            if (typeof loadMoreProducts === 'function') {
                loadMoreProducts();
            }
        });
    }

    // Event listener para seta de voltar no mobile
    const setaVoltar = document.querySelector('.seta-voltar');
    if (setaVoltar) {
        setaVoltar.addEventListener('click', function(e) {
            e.preventDefault();
            goBack();
        });
    }
});
function comprarAgora(produtoId) {
    if (!produtoId) {
        alert('Produto não encontrado!');
        return;
    }
    
    if (!window.isAuthenticated || window.isAuthenticated === 'false') {
        alert('Você precisa estar logado!');
        window.location.href = '/login';
        return;
    }
    
    window.location.href = '/finalizandocompra?produto=' + produtoId;
}

function addToCart(produtoId) {
    if (!produtoId) {
        alert('Produto não encontrado!');
        return;
    }
    
    if (!window.isAuthenticated || window.isAuthenticated === 'false') {
        alert('Você precisa estar logado!');
        window.location.href = '/login';
        return;
    }
    
    fetch('/adicionar-sacola', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produto_id: produtoId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Produto adicionado à sacola!');
        } else {
            alert('Erro: ' + data.message);
        }
    })
    .catch(() => alert('Erro de conexão!'));
}
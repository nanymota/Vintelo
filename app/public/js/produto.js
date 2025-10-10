function addToCart() {
    // Verificar se o usuário está autenticado
    if (!window.isAuthenticated || window.isAuthenticated === 'false') {
        alert('Você precisa estar logado!');
        window.location.href = '/login';
        return;
    }
    
    // Verificar se existe produto
    if (!window.produtoId) {
        alert('Produto não encontrado!');
        return;
    }
    
    fetch('/adicionar-sacola', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produto_id: window.produtoId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Aguardar um pouco para garantir que a inserção foi concluída
            setTimeout(() => {
                window.location.href = '/finalizandocompra';
            }, 500);
        } else {
            alert('Erro: ' + data.message);
        }
    })
    .catch(() => alert('Erro de conexão!'));
}
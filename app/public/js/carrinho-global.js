// Sistema global de carrinho
function adicionarAoCarrinho(produtoId, nome, preco, imagem) {
    if (!window.isAuthenticated) {
        alert('Você precisa estar logado para adicionar produtos ao carrinho!');
        window.location.href = '/cadastro';
        return;
    }

    fetch('/adicionar-carrinho', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            produto_id: produtoId,
            nome: nome,
            preco: parseFloat(preco.replace('R$', '').replace(',', '.')),
            imagem: imagem,
            quantidade: 1
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Feedback visual
            const notification = document.createElement('div');
            notification.className = 'cart-notification';
            notification.textContent = 'Produto adicionado ao carrinho!';
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #28a745;
                color: white;
                padding: 15px 20px;
                border-radius: 5px;
                z-index: 1000;
                font-weight: bold;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 3000);
        } else {
            alert('Erro ao adicionar produto ao carrinho');
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao adicionar produto ao carrinho');
    });
}
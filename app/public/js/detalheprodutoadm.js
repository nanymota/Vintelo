document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const produtoId = urlParams.get('id');
    
    if (produtoId) {
        carregarDetalhes(produtoId);
    }
});

function carregarDetalhes(id) {
    fetch(`/produtosadm/detalhes/${id}`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data) {
                preencherDetalhes(data.data);
            }
        })
        .catch(error => {
            console.error('Erro ao carregar detalhes:', error);
        });
}

function preencherDetalhes(produto) {
    document.getElementById('produtoImagem').src = produto.URL_IMG ? '/' + produto.URL_IMG : '/images/produto-placeholder.jpg';
    document.getElementById('produtoNome').textContent = produto.NOME_PRODUTO;
    document.getElementById('produtoPreco').textContent = `R$ ${parseFloat(produto.PRECO).toFixed(2)}`;
    document.getElementById('produtoCategoria').textContent = produto.TIPO_PRODUTO || 'N/A';
    document.getElementById('produtoTamanho').textContent = produto.TAMANHO_PRODUTO || 'N/A';
    document.getElementById('produtoCor').textContent = produto.COR_PRODUTO || 'N/A';
    document.getElementById('produtoVendedor').textContent = produto.VENDEDOR || 'N/A';
    document.getElementById('produtoData').textContent = new Date(produto.DATA_CADASTRO).toLocaleDateString('pt-BR');
    document.getElementById('produtoStatus').textContent = produto.STATUS_PRODUTO === 'd' ? 'Ativo' : 'Inativo';
    
    const statusBadge = document.getElementById('statusBadge');
    statusBadge.textContent = produto.STATUS_PRODUTO;
    statusBadge.className = `status-badge ${produto.STATUS_PRODUTO.toLowerCase()}`;
    
    const btnStatus = document.getElementById('btnStatus');
    if (produto.STATUS_PRODUTO === 'ativo') {
        btnStatus.textContent = 'Inativar';
        btnStatus.onclick = () => alterarStatus(produto.ID_PRODUTO, 'inativo');
    } else {
        btnStatus.textContent = 'Ativar';
        btnStatus.onclick = () => alterarStatus(produto.ID_PRODUTO, 'ativo');
    }
    
    document.getElementById('btnExcluir').onclick = () => excluirProduto(produto.ID_PRODUTO);
}

function alterarStatus(id, novoStatus) {
    fetch('/produtosadm/status', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, status: novoStatus })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            location.reload();
        }
    });
}

function excluirProduto(id) {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
        fetch('/produtosadm/excluir', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                history.back();
            }
        });
    }
}
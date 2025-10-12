// Filtrar produtos (busca rápida)
function filtrarProdutos() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const produtos = document.querySelectorAll('.produto-card');
    let visibleCount = 0;

    produtos.forEach(produto => {
        const nome = produto.querySelector('h4').textContent.toLowerCase();
        const vendedor = produto.querySelector('.produto-vendedor').textContent.toLowerCase();
        const categoria = produto.querySelector('.produto-categoria').textContent.toLowerCase();

        if (!searchInput || nome.includes(searchInput) || vendedor.includes(searchInput) || categoria.includes(searchInput)) {
            produto.style.display = 'block';
            visibleCount++;
        } else {
            produto.style.display = 'none';
        }
    });

    document.getElementById('totalProdutos').textContent = visibleCount;
}

// Aplicar filtros avançados
function aplicarFiltros() {
    const statusRadio = document.querySelector('input[name="status"]:checked').value;
    const categoriaRadio = document.querySelector('input[name="categoria"]:checked')?.value || '';
    const categoria = document.getElementById('categoriaFilter')?.value || categoriaRadio;
    const precoMin = parseFloat(document.getElementById('precoMin').value) || 0;
    const precoMax = parseFloat(document.getElementById('precoMax').value) || Infinity;
    const dataFilter = document.getElementById('dataFilter').value;
    const vendedorFilter = document.getElementById('vendedorFilter').value.toLowerCase();
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    
    const produtos = document.querySelectorAll('.produto-card');
    let visibleCount = 0;
    const hoje = new Date();

    produtos.forEach(produto => {
        const status = produto.dataset.status;
        const produtoCategoria = produto.dataset.categoria;
        const nome = produto.querySelector('h4').textContent.toLowerCase();
        const vendedor = produto.querySelector('.produto-vendedor').textContent.toLowerCase();
        const precoText = produto.querySelector('.produto-preco').textContent.replace('R$ ', '').replace(',', '.');
        const preco = parseFloat(precoText);
        const dataText = produto.querySelector('.produto-data').textContent.replace('Cadastrado: ', '');
        const dataCadastro = new Date(dataText.split('/').reverse().join('-'));
        
        let showProduct = true;

        // Filtro por status
        if (statusRadio && status !== statusRadio) {
            showProduct = false;
        }

        // Filtro por categoria
        if (categoria && produtoCategoria !== categoria) {
            showProduct = false;
        }

        // Filtro por preço
        if (preco < precoMin || preco > precoMax) {
            showProduct = false;
        }

        // Filtro por data
        if (dataFilter) {
            const diffTime = hoje - dataCadastro;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (dataFilter === 'hoje' && diffDays > 1) showProduct = false;
            if (dataFilter === 'semana' && diffDays > 7) showProduct = false;
            if (dataFilter === 'mes' && diffDays > 30) showProduct = false;
        }

        // Filtro por vendedor
        if (vendedorFilter && !vendedor.includes(vendedorFilter)) {
            showProduct = false;
        }

        // Filtro por busca
        if (searchInput && !nome.includes(searchInput) && !vendedor.includes(searchInput)) {
            showProduct = false;
        }

        if (showProduct) {
            produto.style.display = 'block';
            visibleCount++;
        } else {
            produto.style.display = 'none';
        }
    });

    document.getElementById('totalProdutos').textContent = visibleCount;
}

// Limpar filtros
function limparFiltros() {
    document.querySelector('input[name="status"][value=""]').checked = true;
    document.querySelector('input[name="categoria"][value=""]').checked = true;
    if (document.getElementById('categoriaFilter')) {
        document.getElementById('categoriaFilter').value = '';
    }
    document.getElementById('precoMin').value = '';
    document.getElementById('precoMax').value = '';
    document.getElementById('dataFilter').value = '';
    document.getElementById('vendedorFilter').value = '';
    document.getElementById('searchInput').value = '';
    
    const produtos = document.querySelectorAll('.produto-card');
    produtos.forEach(produto => {
        produto.style.display = 'block';
    });
    
    document.getElementById('totalProdutos').textContent = produtos.length;
}

// Alterar status do produto
async function alterarStatus(produtoId, novoStatus) {
    if (!confirm(`Tem certeza que deseja ${novoStatus === 'd' ? 'ativar' : 'inativar'} este produto?`)) {
        return;
    }

    try {
        const response = await fetch('/produtosadm/status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                produtoId: produtoId,
                status: novoStatus
            })
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Status alterado com sucesso!', 'success');
            setTimeout(() => {
                location.reload();
            }, 1000);
        } else {
            showNotification('Erro ao alterar status: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        showNotification('Erro interno do servidor', 'error');
    }
}

// Ver detalhes do produto
async function verDetalhes(produtoId) {
    // Verificar se é mobile
    if (window.innerWidth <= 768) {
        window.location.href = `/detalheprodutoadm?id=${produtoId}`;
        return;
    }
    
    try {
        const response = await fetch(`/produtosadm/detalhes/${produtoId}`);
        const produto = await response.json();

        if (produto.success) {
            const detalhesContent = document.getElementById('detalhesContent');
            detalhesContent.innerHTML = `
                <div class="produto-detalhes">
                    <div class="detalhes-imagem">
                        <img src="${produto.data.URL_IMG ? '/' + produto.data.URL_IMG : '/imagens/produto-default.png'}" alt="${produto.data.NOME_PRODUTO}">
                    </div>
                    <div class="detalhes-info">
                        <h3>${produto.data.NOME_PRODUTO}</h3>
                        <p><strong>Preço:</strong> R$ ${parseFloat(produto.data.PRECO).toFixed(2).replace('.', ',')}</p>
                        <p><strong>Categoria:</strong> ${produto.data.TIPO_PRODUTO}</p>
                        <p><strong>Tamanho:</strong> ${produto.data.TAMANHO_PRODUTO || 'N/A'}</p>
                        <p><strong>Cor:</strong> ${produto.data.COR_PRODUTO}</p>
                        <p><strong>Estilo:</strong> ${produto.data.ESTILO_PRODUTO}</p>
                        <p><strong>Condição:</strong> ${produto.data.CONDICAO_PRODUTO}</p>
                        <p><strong>Vendedor:</strong> ${produto.data.VENDEDOR}</p>
                        <p><strong>Status:</strong> ${produto.data.STATUS_PRODUTO === 'd' ? 'Ativo' : 'Inativo'}</p>
                        <p><strong>Cadastrado em:</strong> ${new Date(produto.data.DATA_CADASTRO).toLocaleDateString('pt-BR')}</p>
                        <p><strong>Detalhes:</strong> ${produto.data.DETALHES_PRODUTO || 'N/A'}</p>
                    </div>
                </div>
            `;
            document.getElementById('detalhesModal').style.display = 'block';
        } else {
            showNotification('Erro ao carregar detalhes', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        showNotification('Erro interno do servidor', 'error');
    }
}

// Excluir produto
async function excluirProduto(produtoId) {
    if (!confirm('Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.')) {
        return;
    }

    try {
        const response = await fetch('/produtosadm/excluir', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                produtoId: produtoId
            })
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Produto excluído com sucesso!', 'success');
            setTimeout(() => {
                location.reload();
            }, 1000);
        } else {
            showNotification('Erro ao excluir produto: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        showNotification('Erro interno do servidor', 'error');
    }
}

// Mostrar notificação
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 1001;
        ${type === 'success' ? 'background: #28a745;' : 'background: #dc3545;'}
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Fechar modal
    document.querySelector('.close').onclick = function() {
        document.getElementById('detalhesModal').style.display = 'none';
    }

    // Fechar modal clicando fora
    window.onclick = function(event) {
        const modal = document.getElementById('detalhesModal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    }

    // Filtro em tempo real
    document.getElementById('searchInput').addEventListener('input', filtrarProdutos);
    
    // Filtros do sidebar
    const statusRadios = document.querySelectorAll('input[name="status"]');
    statusRadios.forEach(radio => {
        radio.addEventListener('change', aplicarFiltros);
    });
    
    document.getElementById('categoriaFilter').addEventListener('change', aplicarFiltros);
    
    // Filtros de categoria do sidebar
    const categoriaRadios = document.querySelectorAll('input[name="categoria"]');
    categoriaRadios.forEach(radio => {
        radio.addEventListener('change', aplicarFiltros);
    });
    document.getElementById('precoMin').addEventListener('input', aplicarFiltros);
    document.getElementById('precoMax').addEventListener('input', aplicarFiltros);
    document.getElementById('dataFilter').addEventListener('change', aplicarFiltros);
    document.getElementById('vendedorFilter').addEventListener('input', aplicarFiltros);
});
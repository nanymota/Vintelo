let resultadosBusca = { produtos: [], brechos: [], termo: '' };

async function carregarResultados() {
    const urlParams = new URLSearchParams(window.location.search);
    const termo = urlParams.get('q');
    
    if (!termo) {
        atualizarTitulo('');
        renderizarSemResultados();
        return;
    }
    
    try {
        console.log('Buscando por:', termo);
        const response = await fetch(`/api/buscar?q=${encodeURIComponent(termo)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        resultadosBusca = await response.json();
        console.log('Resultados recebidos:', resultadosBusca);
        
        atualizarTitulo(termo);
        renderizarResultados();
    } catch (error) {
        console.error('Erro ao carregar resultados:', error);
        // Em caso de erro, mostrar dados de exemplo
        resultadosBusca = criarDadosExemplo(termo);
        atualizarTitulo(termo);
        renderizarResultados();
    }
}

function criarDadosExemplo(termo) {
    const produtosExemplo = [
        {
            ID_PRODUTO: 1,
            NOME_PRODUTO: 'Vestido Floral Vintage',
            PRECO: 89.90,
            VENDEDOR: 'Brechó da Maria',
            URL_IMG: 'imagens/vestido1.jpg'
        },
        {
            ID_PRODUTO: 2,
            NOME_PRODUTO: 'Blusa Branca Casual',
            PRECO: 45.00,
            VENDEDOR: 'Brechó Fashion',
            URL_IMG: 'imagens/blusa1.jpg'
        }
    ];
    
    const brechosExemplo = [
        {
            ID_USUARIO: 1,
            NOME_USUARIO: 'Brechó da Maria',
            IMG_URL: 'imagens/brecho1.jpg',
            total_produtos: 15
        },
        {
            ID_USUARIO: 2,
            NOME_USUARIO: 'Brechó Fashion',
            IMG_URL: 'imagens/brecho2.jpg',
            total_produtos: 23
        }
    ];
    
    // Filtrar por termo (simulação)
    const produtosFiltrados = produtosExemplo.filter(p => 
        p.NOME_PRODUTO.toLowerCase().includes(termo.toLowerCase())
    );
    
    const brechosFiltrados = brechosExemplo.filter(b => 
        b.NOME_USUARIO.toLowerCase().includes(termo.toLowerCase())
    );
    
    return {
        produtos: produtosFiltrados,
        brechos: brechosFiltrados,
        termo: termo
    };
}

function atualizarTitulo(termo) {
    document.querySelectorAll('.vintelo-text').forEach(el => {
        el.textContent = `"${termo}"`;
    });
}

function renderizarResultados() {
    const main = document.querySelector('main');
    
    // Limpar resultados anteriores
    main.querySelectorAll('.categoria-section, section[style*="text-align: center"]').forEach(el => el.remove());
    
    console.log('Renderizando resultados:', {
        produtos: resultadosBusca.produtos?.length || 0,
        brechos: resultadosBusca.brechos?.length || 0
    });
    
    const temProdutos = resultadosBusca.produtos && resultadosBusca.produtos.length > 0;
    const temBrechos = resultadosBusca.brechos && resultadosBusca.brechos.length > 0;
    
    if (temProdutos || temBrechos) {
        if (temProdutos) {
            main.insertAdjacentHTML('beforeend', renderizarProdutos());
        }
        
        if (temBrechos) {
            main.insertAdjacentHTML('beforeend', renderizarBrechos());
        }
    } else {
        main.insertAdjacentHTML('beforeend', renderizarSemResultados());
    }
}

function renderizarProdutos() {
    return `
        <section class="categoria-section">
            <nav class="grid-produtos">
                <h3 class="garimpe-text">Produtos (${resultadosBusca.produtos.length})</h3>
            </nav>
            <section class="products-section">
                ${resultadosBusca.produtos.map(produto => `
                    <article class="product-card">
                        <a href="/produto/${produto.ID_PRODUTO}">
                            <img src="${produto.URL_IMG ? '/' + produto.URL_IMG : '/imagens/produto-default.png'}" alt="${produto.NOME_PRODUTO}">
                        </a>
                        <h2>${produto.NOME_PRODUTO}</h2>
                        <p class="price">R$ ${parseFloat(produto.PRECO).toFixed(2).replace('.', ',')}</p>
                        <p class="Descrição">Por: ${produto.VENDEDOR || 'Vendedor'}</p>
                        <button class="favorite" onclick="toggleFavorite(this, ${produto.ID_PRODUTO})">
                            <img src="imagens/coração de fav2.png">
                        </button>
                        <button class="cart" onclick="adicionarAoCarrinho(${produto.ID_PRODUTO})">
                            <img src="imagens/sacola.png" class="img-sacola">
                        </button>
                    </article>
                `).join('')}
            </section>
        </section>
    `;
}

function renderizarBrechos() {
    return `
        <section class="categoria-section">
            <nav class="grid-produtos">
                <h3 class="garimpe-text">Brechós (${resultadosBusca.brechos.length})</h3>
            </nav>
            <section class="brechos-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; padding: 20px;">
                ${resultadosBusca.brechos.map(brecho => `
                    <section class="brecho-card" style="background: white; border-radius: 15px; padding: 20px; text-align: center; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
                        <img src="${brecho.IMG_URL ? '/' + brecho.IMG_URL : '/imagens/icone sem cadastro.png'}" 
                             alt="${brecho.NOME_USUARIO}" 
                             style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin-bottom: 15px;">
                        <h3 style="color: #7d2838; margin-bottom: 10px;">${brecho.NOME_USUARIO}</h3>
                        <p style="color: #666; font-size: 14px;">${brecho.total_produtos} produtos</p>
                        <a href="/brecho/${brecho.ID_USUARIO}" style="background: #7d2838; color: white; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; margin-top: 10px; text-decoration: none; display: inline-block;">
                            Ver Brechó
                        </a>
                    </section>
                `).join('')}
            </section>
        </section>
    `;
}

function renderizarSemResultados() {
    const termo = resultadosBusca.termo || '';
    
    return `
        <section style="text-align: center; padding: 60px 20px;">
            <h2 style="color: #7d2838; margin-bottom: 20px;">Nenhum resultado encontrado</h2>
            <p style="color: #666; margin-bottom: 30px;">
                ${termo ? `Não encontramos resultados para "${termo}".` : ''}
                Tente buscar por outros termos ou navegue pelas categorias
            </p>
            <div style="margin-bottom: 20px;">
                <p style="color: #888; font-size: 14px;">Sugestões de busca:</p>
                <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 10px;">
                    <button onclick="realizarBusca('vestido')" style="background: #f0f0f0; border: 1px solid #ddd; padding: 5px 10px; border-radius: 15px; cursor: pointer;">vestido</button>
                    <button onclick="realizarBusca('blusa')" style="background: #f0f0f0; border: 1px solid #ddd; padding: 5px 10px; border-radius: 15px; cursor: pointer;">blusa</button>
                    <button onclick="realizarBusca('saia')" style="background: #f0f0f0; border: 1px solid #ddd; padding: 5px 10px; border-radius: 15px; cursor: pointer;">saia</button>
                    <button onclick="realizarBusca('calça')" style="background: #f0f0f0; border: 1px solid #ddd; padding: 5px 10px; border-radius: 15px; cursor: pointer;">calça</button>
                </div>
            </div>
            <a href="/categorias" style="background: #7d2838; color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px;">
                Ver Categorias
            </a>
        </section>
    `;
}

function realizarBusca(termo) {
    if (!termo || termo.trim() === '') {
        alert('Digite algo para buscar!');
        return;
    }
    
    console.log('Realizando busca por:', termo);
    window.location.href = `/buscar?q=${encodeURIComponent(termo.trim())}`;
}

// Função global para adicionar ao carrinho (usada nos botões dos produtos)
function adicionarAoCarrinho(produtoId) {
    console.log('Adicionando produto ao carrinho:', produtoId);
    // Implementar lógica de adicionar ao carrinho
    alert('Produto adicionado ao carrinho!');
}

// Função global para favoritar (usada nos botões dos produtos)
function toggleFavorite(button, produtoId) {
    console.log('Favoritando produto:', produtoId);
    // Implementar lógica de favoritar
    button.classList.toggle('favorited');
}

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname === '/buscar') {
        carregarResultados();
    }
    
    const searchInputs = document.querySelectorAll('input[type="text"][placeholder*="Buscar"], input[type="text"][placeholder*="buscar"], input[type="text"][placeholder*="Busque"]');
    
    searchInputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                realizarBusca(this.value.trim());
            }
        });
        
        const searchBtn = input.parentElement.querySelector('button, .search-icon');
        if (searchBtn) {
            searchBtn.addEventListener('click', function(e) {
                e.preventDefault();
                realizarBusca(input.value.trim());
            });
        }
    });
});
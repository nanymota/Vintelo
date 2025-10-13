let produtosCategorias = [];
let produtosFiltrados = [];

async function carregarProdutos() {
    // Verificar se já existem produtos renderizados pelo servidor
    const existingProducts = document.querySelectorAll('.products-section .product-card');
    if (existingProducts.length > 0) {
        // Usar produtos já renderizados pelo servidor
        produtosCategorias = Array.from(existingProducts).map(card => {
            const priceText = card.querySelector('.price').textContent.replace('R$', '').replace(',', '.');
            return {
                ID_PRODUTO: card.querySelector('.cart').getAttribute('onclick').match(/\d+/)[0],
                NOME_PRODUTO: card.querySelector('h2').textContent,
                PRECO: parseFloat(priceText),
                TIPO_PRODUTO: card.dataset.category,
                URL_IMG: card.querySelector('img').src.replace(window.location.origin, '')
            };
        });
        produtosFiltrados = [...produtosCategorias];
        return;
    }
    
    // Fallback: carregar via API se não houver produtos do servidor
    try {
        const response = await fetch('/api/produtos');
        produtosCategorias = await response.json();
        produtosFiltrados = [...produtosCategorias];
        renderizarProdutos(produtosFiltrados);
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
    }
}

function renderizarProdutos(produtos) {
    const container = document.querySelector('.products-section');
    
    if (!produtos || produtos.length === 0) {
        container.innerHTML = '<p>Nenhum produto encontrado</p>';
        return;
    }
    
    container.innerHTML = produtos.map(produto => `
        <article class="product-card" data-category="${produto.TIPO_PRODUTO ? produto.TIPO_PRODUTO.toLowerCase() : 'outros'}">
            <a href="/produto/${produto.ID_PRODUTO}">
                <img src="${produto.URL_IMG ? '/' + produto.URL_IMG : '/imagens/produto-default.png'}" alt="${produto.NOME_PRODUTO}">
            </a>
            <h2>${produto.NOME_PRODUTO}</h2>
            <p class="price">R$${parseFloat(produto.PRECO).toFixed(2).replace('.', ',')}</p>
            <p class="Descrição">ou em 2x de R$${(produto.PRECO / 2).toFixed(2).replace('.', ',')}</p>
            <button class="favorite" onclick="toggleFavorite(this, ${produto.ID_PRODUTO})">
                <img src="imagens/coração de fav2.png">
            </button>
            <button class="cart" onclick="adicionarAoCarrinho(${produto.ID_PRODUTO})">
                <img src="imagens/sacola.png" class="img-sacola">
            </button>
        </article>
    `).join('');
}

function filterProducts() {
    const activeCategory = document.querySelector('.category-btn.active')?.dataset.category || 'todos';
    const minRange = document.getElementById('min');
    const maxRange = document.getElementById('max');
    const minPrice = parseInt(minRange?.value || 0);
    const maxPrice = parseInt(maxRange?.value || 999999);
    
    produtosFiltrados = produtosCategorias.filter(produto => {
        let show = true;
        
        if (activeCategory !== 'todos') {
            const categoria = produto.TIPO_PRODUTO ? produto.TIPO_PRODUTO.toLowerCase() : 'outros';
            if (categoria !== activeCategory) {
                show = false;
            }
        }
        
        const price = parseFloat(produto.PRECO);
        if (price < minPrice || price > maxPrice) {
            show = false;
        }
        
        return show;
    });
    
    renderizarProdutos(produtosFiltrados);
}

function updatePriceRange() {
    const minRange = document.getElementById('min');
    const maxRange = document.getElementById('max');
    const minValue = document.getElementById('min-value');
    const maxValue = document.getElementById('max-value');
    
    const min = parseInt(minRange.value);
    const max = parseInt(maxRange.value);
    
    if (min > max) {
        minRange.value = max;
    }
    
    minValue.value = minRange.value;
    maxValue.value = maxRange.value;
    
    filterProducts();
}

function sortProducts(type) {
    produtosFiltrados.sort((a, b) => {
        const priceA = parseFloat(a.PRECO);
        const priceB = parseFloat(b.PRECO);
        
        switch(type) {
            case 'price-low':
                return priceA - priceB;
            case 'price-high':
                return priceB - priceA;
            case 'recent':
            default:
                return 0;
        }
    });
    
    renderizarProdutos(produtosFiltrados);
}

function clearFilters() {
    const categoryButtons = document.querySelectorAll('.category-btn');
    const sizeButtons = document.querySelectorAll('.size-btn');
    const minRange = document.getElementById('min');
    const maxRange = document.getElementById('max');
    const minValue = document.getElementById('min-value');
    const maxValue = document.getElementById('max-value');
    
    categoryButtons.forEach(btn => btn.classList.remove('active'));
    categoryButtons[0]?.classList.add('active');
    
    sizeButtons.forEach(btn => btn.classList.remove('active'));
    
    if (minRange) minRange.value = 0;
    if (maxRange) maxRange.value = 500;
    if (minValue) minValue.value = '0';
    if (maxValue) maxValue.value = '500';
    
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    
    filterProducts();
}

function applyFilters() {
    filterProducts();
}

function goBack() {
    window.history.back();
}

document.addEventListener('DOMContentLoaded', function() {
    carregarProdutos();
    
    const categoryButtons = document.querySelectorAll('.category-btn');
    const sizeButtons = document.querySelectorAll('.size-btn');
    const minRange = document.getElementById('min');
    const maxRange = document.getElementById('max');
    
    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            filterProducts();
        });
    });
    
    sizeButtons.forEach(button => {
        button.addEventListener('click', function() {
            this.classList.toggle('active');
            filterProducts();
        });
    });
    
    if (minRange && maxRange) {
        minRange.addEventListener('input', updatePriceRange);
        maxRange.addEventListener('input', updatePriceRange);
    }
});
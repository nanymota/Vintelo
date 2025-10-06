// Funcionalidades dos filtros laterais - Geral

document.addEventListener('DOMContentLoaded', function() {
    initializeFilters();
});

function initializeFilters() {
    // Filtros de categoria
    const categoryBtns = document.querySelectorAll('.category-btn');
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            categoryBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filterByCategory(this.dataset.category);
        });
    });

    // Filtros de tamanho
    const sizeBtns = document.querySelectorAll('.size-btn');
    sizeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            this.classList.toggle('active');
            applyAllFilters();
        });
    });

    // Filtros de condição
    const conditionCheckboxes = document.querySelectorAll('input[type="checkbox"]');
    conditionCheckboxes.forEach(cb => {
        cb.addEventListener('change', applyAllFilters);
    });

    // Range de preço
    const priceRanges = document.querySelectorAll('input[type="range"]');
    priceRanges.forEach(range => {
        range.addEventListener('input', updatePriceRange);
    });

    // Inputs de preço
    const priceInputs = document.querySelectorAll('#min-value, #max-value');
    priceInputs.forEach(input => {
        input.addEventListener('change', filterByPrice);
    });
}

// Filtrar por categoria
function filterByCategory(category) {
    const products = document.querySelectorAll('.product-card, .favorite-item, .order-card');
    
    products.forEach(product => {
        if (category === 'todos' || !product.dataset.category || product.dataset.category === category) {
            product.style.display = 'block';
        } else {
            product.style.display = 'none';
        }
    });
}

// Ordenar produtos
function sortProducts(type) {
    const container = document.querySelector('.products-section, .favorites-grid, .orders-list');
    if (!container) return;
    
    const items = Array.from(container.children);
    
    items.sort((a, b) => {
        const priceA = getPriceFromElement(a);
        const priceB = getPriceFromElement(b);
        
        switch(type) {
            case 'price-low':
                return priceA - priceB;
            case 'price-high':
                return priceB - priceA;
            case 'recent':
                return 0; // Manter ordem atual
            case 'popular':
                return 0; // Manter ordem atual
            default:
                return 0;
        }
    });
    
    items.forEach(item => container.appendChild(item));
}

// Extrair preço do elemento
function getPriceFromElement(element) {
    const priceElement = element.querySelector('.price, .product-price, .favorite-price, .order-total');
    if (!priceElement) return 0;
    
    const priceText = priceElement.textContent.replace(/[^\d,]/g, '').replace(',', '.');
    return parseFloat(priceText) || 0;
}

// Atualizar range de preço
function updatePriceRange() {
    const minRange = document.getElementById('min');
    const maxRange = document.getElementById('max');
    const minValue = document.getElementById('min-value');
    const maxValue = document.getElementById('max-value');
    
    if (minRange && minValue) minValue.value = minRange.value;
    if (maxRange && maxValue) maxValue.value = maxRange.value;
}

// Filtrar por preço
function filterByPrice() {
    const minPrice = parseFloat(document.getElementById('min-value')?.value) || 0;
    const maxPrice = parseFloat(document.getElementById('max-value')?.value) || 999;
    const products = document.querySelectorAll('.product-card, .favorite-item');
    
    products.forEach(product => {
        const price = getPriceFromElement(product);
        
        if (price >= minPrice && price <= maxPrice) {
            product.style.display = 'block';
        } else {
            product.style.display = 'none';
        }
    });
}

// Aplicar todos os filtros
function applyAllFilters() {
    const activeCategory = document.querySelector('.category-btn.active')?.dataset.category || 'todos';
    const activeSizes = Array.from(document.querySelectorAll('.size-btn.active')).map(btn => btn.dataset.size);
    const activeConditions = Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.id);
    const minPrice = parseFloat(document.getElementById('min-value')?.value) || 0;
    const maxPrice = parseFloat(document.getElementById('max-value')?.value) || 999;
    
    const products = document.querySelectorAll('.product-card, .favorite-item');
    
    products.forEach(product => {
        let showProduct = true;
        
        // Filtro por categoria
        if (activeCategory !== 'todos' && product.dataset.category && product.dataset.category !== activeCategory) {
            showProduct = false;
        }
        
        // Filtro por preço
        const price = getPriceFromElement(product);
        if (price < minPrice || price > maxPrice) {
            showProduct = false;
        }
        
        // Filtro por tamanho (se aplicável)
        if (activeSizes.length > 0 && product.dataset.size && !activeSizes.includes(product.dataset.size)) {
            showProduct = false;
        }
        
        product.style.display = showProduct ? 'block' : 'none';
    });
}

// Aplicar filtros (botão)
function applyFilters() {
    applyAllFilters();
}

// Limpar filtros
function clearFilters() {
    // Limpar categorias
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    const todosBtn = document.querySelector('.category-btn[data-category="todos"]');
    if (todosBtn) todosBtn.classList.add('active');
    
    // Limpar tamanhos
    document.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('active'));
    
    // Limpar preços
    const minRange = document.getElementById('min');
    const maxRange = document.getElementById('max');
    const minValue = document.getElementById('min-value');
    const maxValue = document.getElementById('max-value');
    
    if (minRange) minRange.value = 0;
    if (maxRange) maxRange.value = 500;
    if (minValue) minValue.value = 0;
    if (maxValue) maxValue.value = 500;
    
    // Limpar condições
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    
    // Mostrar todos os produtos
    document.querySelectorAll('.product-card, .favorite-item, .order-card').forEach(item => {
        item.style.display = 'block';
    });
}

// Carregar mais produtos
function loadMoreProducts() {
    console.log('Carregando mais produtos...');
    // Simular carregamento
    setTimeout(() => {
        alert('Mais produtos carregados!');
    }, 500);
}
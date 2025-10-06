// Funcionalidades do filtro lateral - versão estática

// Inicialização quando o DOM carrega
document.addEventListener('DOMContentLoaded', function() {
    initializeFilters();
    initializeCarousel();
});

// Inicializar filtros
function initializeFilters() {
    // Filtro por categoria
    const categoryBtns = document.querySelectorAll('.category-btn');
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            categoryBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const category = this.dataset.category;
            filterByCategory(category);
        });
    });
    
    // Filtro por tamanho
    const sizeBtns = document.querySelectorAll('.size-btn');
    sizeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            this.classList.toggle('active');
            applyFilters();
        });
    });
    
    // Filtro por condição (checkboxes)
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            applyFilters();
        });
    });
    
    // Sincronizar ranges com inputs de texto
    const minRange = document.getElementById('min');
    const maxRange = document.getElementById('max');
    const minValue = document.getElementById('min-value');
    const maxValue = document.getElementById('max-value');
    
    if (minRange && minValue) {
        minRange.addEventListener('input', function() {
            minValue.value = this.value;
            applyFilters();
        });
        
        minValue.addEventListener('input', function() {
            minRange.value = this.value;
            applyFilters();
        });
    }
    
    if (maxRange && maxValue) {
        maxRange.addEventListener('input', function() {
            maxValue.value = this.value;
            applyFilters();
        });
        
        maxValue.addEventListener('input', function() {
            maxRange.value = this.value;
            applyFilters();
        });
    }
}

// Inicializar carrossel
function initializeCarousel() {
    const carousels = document.querySelectorAll('.product-carousel');
    carousels.forEach(carousel => {
        // Adicionar funcionalidade de scroll suave
        carousel.addEventListener('wheel', function(e) {
            if (e.deltaY !== 0) {
                e.preventDefault();
                this.scrollLeft += e.deltaY;
            }
        });
    });
}

// Filtrar por categoria
function filterByCategory(category) {
    const sections = document.querySelectorAll('.categoria-section');
    
    if (category === 'todos') {
        // Mostrar todas as seções
        sections.forEach(section => {
            section.style.display = 'block';
            // Mostrar todos os produtos dentro de cada seção
            const products = section.querySelectorAll('.product-card');
            products.forEach(product => product.style.display = 'block');
        });
    } else {
        // Mostrar apenas a seção da categoria selecionada
        sections.forEach(section => {
            if (section.dataset.category === category) {
                section.style.display = 'block';
                // Mostrar todos os produtos da categoria
                const products = section.querySelectorAll('.product-card');
                products.forEach(product => product.style.display = 'block');
            } else {
                section.style.display = 'none';
            }
        });
    }
}

// Função para ordenar produtos
function sortProducts(type) {
    const products = Array.from(document.querySelectorAll('.product-card'));
    
    products.sort((a, b) => {
        switch(type) {
            case 'price-low':
                return getPrice(a) - getPrice(b);
            case 'price-high':
                return getPrice(b) - getPrice(a);
            case 'recent':
                return Math.random() - 0.5;
            case 'popular':
                return Math.random() - 0.5;
            default:
                return 0;
        }
    });
    
    // Reordena os produtos no DOM
    const carousels = document.querySelectorAll('.product-carousel');
    carousels.forEach(carousel => {
        const carouselProducts = products.filter(product => 
            carousel.contains(product)
        );
        carouselProducts.forEach(product => carousel.appendChild(product));
    });
}

// Função auxiliar para extrair preço
function getPrice(product) {
    const priceText = product.querySelector('.price').textContent;
    return parseFloat(priceText.replace('R$', '').replace(',', '.'));
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
    
    document.querySelectorAll('.product-card').forEach(product => {
        const price = getPrice(product);
        if (price >= minPrice && price <= maxPrice) {
            product.style.display = 'block';
        } else {
            product.style.display = 'none';
        }
    });
}

// Aplicar todos os filtros
function applyFilters() {
    const activeCategory = document.querySelector('.category-btn.active')?.dataset.category || 'todos';
    const activeSizes = Array.from(document.querySelectorAll('.size-btn.active')).map(btn => btn.dataset.size);
    const conditions = Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.id);
    const minPrice = parseFloat(document.getElementById('min-value')?.value) || 0;
    const maxPrice = parseFloat(document.getElementById('max-value')?.value) || 999999;
    
    // Primeiro aplicar filtro de categoria nas seções
    const sections = document.querySelectorAll('.categoria-section');
    sections.forEach(section => {
        if (activeCategory === 'todos') {
            section.style.display = 'block';
        } else {
            section.style.display = section.dataset.category === activeCategory ? 'block' : 'none';
        }
    });
    
    // Depois aplicar outros filtros nos produtos visíveis
    document.querySelectorAll('.product-card').forEach(product => {
        const productSection = product.closest('.categoria-section');
        
        // Se a seção está oculta, não processar o produto
        if (productSection.style.display === 'none') {
            return;
        }
        
        let show = true;
        
        // Filtro por tamanho
        if (activeSizes.length > 0) {
            const productSize = product.dataset.size;
            if (!activeSizes.includes(productSize)) {
                show = false;
            }
        }
        
        // Filtro por condição
        if (conditions.length > 0) {
            const productCondition = product.dataset.condition;
            if (!conditions.includes(productCondition)) {
                show = false;
            }
        }
        
        // Filtro por preço
        const productPrice = parseFloat(product.dataset.price) || 0;
        if (productPrice < minPrice || productPrice > maxPrice) {
            show = false;
        }
        
        product.style.display = show ? 'block' : 'none';
    });
}

// Limpar todos os filtros
function clearFilters() {
    // Reset categoria para "Todos"
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    const todosBtn = document.querySelector('.category-btn[data-category="todos"]');
    if (todosBtn) todosBtn.classList.add('active');
    
    // Reset tamanhos
    document.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('active'));
    
    // Reset checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    
    // Reset ranges de preço
    const minRange = document.getElementById('min');
    const maxRange = document.getElementById('max');
    const minValue = document.getElementById('min-value');
    const maxValue = document.getElementById('max-value');
    
    if (minRange) minRange.value = 0;
    if (maxRange) maxRange.value = 500;
    if (minValue) minValue.value = 0;
    if (maxValue) maxValue.value = 500;
    
    // Mostrar todas as seções e produtos
    filterByCategory('todos');
}
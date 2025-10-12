// Filtros da página categorias
document.addEventListener('DOMContentLoaded', function() {
    const categoryButtons = document.querySelectorAll('.category-btn');
    const sizeButtons = document.querySelectorAll('.size-btn');
    const productCards = document.querySelectorAll('.product-card');
    const minRange = document.getElementById('min');
    const maxRange = document.getElementById('max');
    const minValue = document.getElementById('min-value');
    const maxValue = document.getElementById('max-value');

    // Filtro por categoria
    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            const category = this.dataset.category;
            filterProducts();
        });
    });

    // Filtro por tamanho
    sizeButtons.forEach(button => {
        button.addEventListener('click', function() {
            this.classList.toggle('active');
            filterProducts();
        });
    });

    // Filtro por preço
    if (minRange && maxRange) {
        minRange.addEventListener('input', updatePriceRange);
        maxRange.addEventListener('input', updatePriceRange);
    }

    function updatePriceRange() {
        const min = parseInt(minRange.value);
        const max = parseInt(maxRange.value);
        
        if (min > max) {
            minRange.value = max;
        }
        
        minValue.value = minRange.value;
        maxValue.value = maxRange.value;
        
        filterProducts();
    }

    function filterProducts() {
        const activeCategory = document.querySelector('.category-btn.active').dataset.category;
        const activeSizes = Array.from(document.querySelectorAll('.size-btn.active')).map(btn => btn.dataset.size);
        const minPrice = parseInt(minRange?.value || 0);
        const maxPrice = parseInt(maxRange?.value || 999999);

        productCards.forEach(card => {
            let show = true;

            // Filtro por categoria
            if (activeCategory !== 'todos') {
                const cardCategory = card.dataset.category;
                if (cardCategory !== activeCategory) {
                    show = false;
                }
            }

            // Filtro por preço
            const priceElement = card.querySelector('.price');
            if (priceElement) {
                const price = parseFloat(priceElement.textContent.replace('R$', '').replace(',', '.'));
                if (price < minPrice || price > maxPrice) {
                    show = false;
                }
            }

            // Mostrar/ocultar produto
            card.style.display = show ? 'block' : 'none';
        });
    }

    // Limpar filtros
    window.clearFilters = function() {
        categoryButtons.forEach(btn => btn.classList.remove('active'));
        categoryButtons[0].classList.add('active'); // Ativar "Todos"
        
        sizeButtons.forEach(btn => btn.classList.remove('active'));
        
        if (minRange) minRange.value = 0;
        if (maxRange) maxRange.value = 500;
        if (minValue) minValue.value = '0';
        if (maxValue) maxValue.value = '500';
        
        document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        
        filterProducts();
    };

    // Aplicar filtros
    window.applyFilters = function() {
        filterProducts();
    };

    // Ordenação
    window.sortProducts = function(type) {
        const container = document.querySelector('.products-section');
        const products = Array.from(container.querySelectorAll('.product-card'));
        
        products.sort((a, b) => {
            const priceA = parseFloat(a.querySelector('.price').textContent.replace('R$', '').replace(',', '.'));
            const priceB = parseFloat(b.querySelector('.price').textContent.replace('R$', '').replace(',', '.'));
            
            switch(type) {
                case 'price-low':
                    return priceA - priceB;
                case 'price-high':
                    return priceB - priceA;
                case 'recent':
                default:
                    return 0; // Manter ordem original
            }
        });
        
        products.forEach(product => container.appendChild(product));
    };
});
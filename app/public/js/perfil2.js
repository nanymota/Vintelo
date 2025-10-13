// Filtros e funcionalidades da página perfil2

// Filtro por categoria
document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        filterByCategory(this.dataset.category);
    });
});

// Filtro por tamanho
document.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        this.classList.toggle('active');
        filterBySizes();
    });
});

function filterByCategory(category) {
    const products = document.querySelectorAll('.product-card');
    products.forEach(product => {
        if (category === 'todos') {
            product.style.display = 'block';
        } else {
            const productCategory = product.dataset.category;
            product.style.display = productCategory === category ? 'block' : 'none';
        }
    });
}

function sortProducts(type) {
    console.log('Ordenando por:', type);
}

function updatePriceRange() {
    const minRange = document.getElementById('min');
    const maxRange = document.getElementById('max');
    document.getElementById('min-value').value = minRange.value;
    document.getElementById('max-value').value = maxRange.value;
}

function filterByPrice() {
    console.log('Filtrando por preço');
}

function filterBySizes() {
    const activeSizes = document.querySelectorAll('.size-btn.active');
    console.log('Tamanhos selecionados:', activeSizes.length);
}

function applyFilters() {
    console.log('Aplicando todos os filtros');
}

function clearFilters() {
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.category-btn[data-category="todos"]').classList.add('active');
    document.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.getElementById('min').value = 10;
    document.getElementById('max').value = 300;
    updatePriceRange();
    filterByCategory('todos');
}

function loadMoreProducts() {
    console.log('Carregando mais produtos');
}

function goBack() {
    window.history.back();
}
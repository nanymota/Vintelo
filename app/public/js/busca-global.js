// Busca global para produtos e brechós
document.addEventListener('DOMContentLoaded', function() {
    // Seleciona todas as barras de busca
    const searchInputs = document.querySelectorAll('input[type="text"][placeholder*="Buscar"], input[type="text"][placeholder*="buscar"], input[type="text"][placeholder*="Busque"]');
    
    searchInputs.forEach(input => {
        // Adiciona evento de Enter
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                realizarBusca(this.value.trim());
            }
        });
        
        // Adiciona evento para botão de busca se existir
        const searchBtn = input.parentElement.querySelector('button, .search-icon');
        if (searchBtn) {
            searchBtn.addEventListener('click', function(e) {
                e.preventDefault();
                realizarBusca(input.value.trim());
            });
        }
    });
});

function realizarBusca(termo) {
    if (!termo) {
        alert('Digite algo para buscar!');
        return;
    }
    
    // Redireciona para página de resultados com o termo de busca
    window.location.href = `/buscar?q=${encodeURIComponent(termo)}`;
}
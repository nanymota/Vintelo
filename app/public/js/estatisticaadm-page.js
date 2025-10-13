// Funções para a página de estatísticas administrativas

// Função vazia - animação removida
function animateCounters() {
    // Animação de contadores removida
}

// Mostrar seção específica
function showSection(sectionId) {
    document.getElementById(sectionId).style.display = 'block';
}

// Esconder todas as seções
function hideAllSections() {
    const sections = document.querySelectorAll('.detail-section');
    sections.forEach(section => {
        section.style.display = 'none';
    });
}

// Função para voltar na navegação
function goBack() {
    window.history.back();
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(animateCounters, 500);
});
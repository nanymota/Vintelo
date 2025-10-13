let estatisticas = {};

async function carregarEstatisticas() {
    try {
        const response = await fetch('/api/estatisticas-admin');
        if (response.ok) {
            estatisticas = await response.json();
            renderizarEstatisticas(estatisticas);
        } else {
            usarDadosExemplo();
        }
    } catch (error) {
        console.error('Erro ao carregar estatísticas admin:', error);
        usarDadosExemplo();
    }
}

function usarDadosExemplo() {
    estatisticas = {
        totalUsuarios: 1250,
        totalBrechos: 85,
        totalProdutos: 3420,
        totalVendas: 892,
        receitaTotal: 45680.50,
        denunciasPendentes: 12
    };
    renderizarEstatisticas(estatisticas);
}

function renderizarEstatisticas(dados) {
    document.querySelector('.usuarios-card .value').textContent = dados.totalUsuarios || 0;
    document.querySelector('.brechos-card .value').textContent = dados.totalBrechos || 0;
    document.querySelector('.produtos-card .value').textContent = dados.totalProdutos || 0;
    document.querySelector('.vendas-card .value').textContent = dados.totalVendas || 0;
    document.querySelector('.receita-card .value').textContent = `R$ ${(dados.receitaTotal || 0).toFixed(2).replace('.', ',')}`;
    document.querySelector('.denuncias-card .value').textContent = dados.denunciasPendentes || 0;
}

function showSection(sectionId) {
    hideAllSections();
    const section = document.getElementById(sectionId);
    if (section) {
        section.style.display = 'block';
        document.getElementById('charts-section').style.display = 'none';
    }
}

function hideAllSections() {
    document.querySelectorAll('.detail-section').forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById('charts-section').style.display = 'grid';
}

function goBack() {
    window.history.back();
}

document.addEventListener('DOMContentLoaded', function() {
    carregarEstatisticas();
});
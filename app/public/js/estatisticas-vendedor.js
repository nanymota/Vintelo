let estatisticas = {};

async function carregarEstatisticas() {
    try {
        const response = await fetch('/api/estatisticas');
        if (response.ok) {
            estatisticas = await response.json();
            console.log('Estatísticas carregadas:', estatisticas);
            renderizarEstatisticas(estatisticas);
        } else {
            console.log('API não disponível, usando dados exemplo');
            usarDadosExemplo();
        }
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        usarDadosExemplo();
    }
}

function usarDadosExemplo() {
    estatisticas = {
        brecho: { NOME_BRECHO: 'Meu Brechó' },
        totalProdutos: 15,
        totalVendas: 8,
        receitaTotal: 450.00,
        totalVisualizacoes: 120,
        taxaConversao: 6.7,
        vendasCategoria: [
            { categoria: 'Vestidos', quantidade: 5 },
            { categoria: 'Blusas', quantidade: 4 },
            { categoria: 'Saias', quantidade: 3 },
            { categoria: 'Calças', quantidade: 2 }
        ]
    };
    renderizarEstatisticas(estatisticas);
}

function renderizarEstatisticas(dados) {
    // Atualizar título
    document.querySelector('h1').textContent = `Dashboard - ${dados.brecho?.NOME_BRECHO || 'Meu Brechó'}`;
    
    // Atualizar cards principais
    document.querySelector('.stat-card:nth-child(1) .value').textContent = dados.totalVendas || 0;
    document.querySelector('.stat-card:nth-child(2) .value').textContent = dados.totalVisualizacoes || 0;
    document.querySelector('.stat-card:nth-child(3) .value').textContent = `${dados.taxaConversao || 0}%`;
    
    // Atualizar gráfico de barras
    renderizarGraficoBarras(dados.vendasCategoria || []);
    
    // Atualizar seções detalhadas
    atualizarSecoesDetalhadas(dados);
}

function renderizarGraficoBarras(categorias) {
    const container = document.querySelector('.bar-chart');
    
    // Se não há dados reais, usar dados exemplo
    if (!categorias || categorias.length === 0) {
        categorias = [
            { categoria: 'Vestidos', quantidade: 5 },
            { categoria: 'Blusas', quantidade: 4 },
            { categoria: 'Saias', quantidade: 3 },
            { categoria: 'Calças', quantidade: 2 }
        ];
    }
    
    // Filtrar categorias com quantidade > 0
    const categoriasComDados = categorias.filter(c => c.quantidade > 0);
    
    if (categoriasComDados.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">Nenhuma venda registrada ainda</p>';
        return;
    }
    
    const maxQuantidade = Math.max(...categoriasComDados.map(c => c.quantidade));
    
    container.innerHTML = categoriasComDados.map((categoria, index) => {
        const altura = maxQuantidade > 0 ? (categoria.quantidade / maxQuantidade) * 80 : 20;
        return `
            <div class="bar" style="height: ${altura}%;">
                <span class="bar-value">${categoria.quantidade}</span>
                <span class="bar-label">${categoria.categoria}</span>
            </div>
        `;
    }).join('');
}

function atualizarSecoesDetalhadas(dados) {
    // Seção vendas
    const vendasCards = document.querySelectorAll('#vendas .detail-value');
    if (vendasCards.length >= 3) {
        vendasCards[0].textContent = dados.totalProdutos || 0;
        vendasCards[1].textContent = dados.totalVendas || 0;
        vendasCards[2].textContent = dados.totalProdutos || 0;
    }
    
    // Atualizar barra de progresso
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-section p');
    const meta = 10;
    const progresso = Math.min((dados.totalProdutos || 0) / meta * 100, 100);
    
    if (progressFill) progressFill.style.width = `${progresso}%`;
    if (progressText) progressText.textContent = `${progresso.toFixed(0)}% da meta atingida`;
    
    // Seção visualizações
    const visualizacoesCards = document.querySelectorAll('#visualizacoes .detail-value');
    if (visualizacoesCards.length >= 3) {
        visualizacoesCards[0].textContent = dados.totalProdutos || 0;
        visualizacoesCards[1].textContent = dados.totalVisualizacoes || 0;
        visualizacoesCards[2].textContent = Math.floor((dados.totalVisualizacoes || 0) / 10);
    }
    
    // Seção conversão
    const conversaoCards = document.querySelectorAll('#conversao .detail-value');
    if (conversaoCards.length >= 3) {
        conversaoCards[0].textContent = `${dados.taxaConversao || 0}%`;
        conversaoCards[1].textContent = dados.totalVendas || 0;
        conversaoCards[2].textContent = dados.totalVisualizacoes || 0;
    }
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
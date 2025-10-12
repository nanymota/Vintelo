// Funções para relatórios administrativos

function gerarRelatorio() {
    const periodo = document.getElementById('periodoFilter').value;
    const tipo = document.getElementById('tipoFilter').value;
    
    console.log(`Gerando relatório: ${tipo} - ${periodo} dias`);
    
    // Simular carregamento
    showLoading();
    
    setTimeout(() => {
        hideLoading();
        alert(`Relatório ${tipo} dos últimos ${periodo} dias gerado com sucesso!`);
    }, 2000);
}

function exportarTabela(tipo) {
    console.log(`Exportando tabela: ${tipo}`);
    alert(`Exportando dados de ${tipo}...`);
}

function exportarRelatorioCompleto() {
    console.log('Exportando relatório completo');
    alert('Gerando relatório completo em PDF...');
}

function agendarRelatorio() {
    console.log('Agendando relatório');
    alert('Funcionalidade de agendamento em desenvolvimento');
}

function compartilharRelatorio() {
    console.log('Compartilhando relatório');
    alert('Funcionalidade de compartilhamento em desenvolvimento');
}

function showLoading() {
    const loadingElements = document.querySelectorAll('.loading');
    loadingElements.forEach(el => {
        el.textContent = 'Carregando dados...';
    });
}

function hideLoading() {
    const loadingElements = document.querySelectorAll('.loading');
    loadingElements.forEach(el => {
        el.textContent = 'Dados carregados';
    });
}

// Carregar dados das tabelas
function carregarDadosTabelas() {
    // Simular dados para top brechós
    const topBrechos = [
        { pos: 1, nome: 'Brechó da Maria', produtos: 45, vendas: 23, receita: 1250.00 },
        { pos: 2, nome: 'Vintage Store', produtos: 38, vendas: 19, receita: 980.50 },
        { pos: 3, nome: 'Eco Fashion', produtos: 52, vendas: 18, receita: 890.00 }
    ];
    
    const brechosTable = document.getElementById('topBrechos');
    if (brechosTable) {
        brechosTable.innerHTML = topBrechos.map(brecho => `
            <tr>
                <td>${brecho.pos}º</td>
                <td>${brecho.nome}</td>
                <td>${brecho.produtos}</td>
                <td>${brecho.vendas}</td>
                <td>R$ ${brecho.receita.toFixed(2).replace('.', ',')}</td>
            </tr>
        `).join('');
    }
    
    // Simular dados para top produtos
    const topProdutos = [
        { pos: 1, nome: 'Vestido Floral', categoria: 'Vestidos', preco: 89.90, vendas: 12 },
        { pos: 2, nome: 'Blusa Vintage', categoria: 'Blusas', preco: 45.00, vendas: 10 },
        { pos: 3, nome: 'Saia Plissada', categoria: 'Saias', preco: 65.50, vendas: 8 }
    ];
    
    const produtosTable = document.getElementById('topProdutos');
    if (produtosTable) {
        produtosTable.innerHTML = topProdutos.map(produto => `
            <tr>
                <td>${produto.pos}º</td>
                <td>${produto.nome}</td>
                <td>${produto.categoria}</td>
                <td>R$ ${produto.preco.toFixed(2).replace('.', ',')}</td>
                <td>${produto.vendas}</td>
            </tr>
        `).join('');
    }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    carregarDadosTabelas();
});
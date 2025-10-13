let brechosData = [];

async function carregarBrechos() {
    try {
        const response = await fetch('/api/brechos');
        brechosData = await response.json();
        renderizarBrechos(brechosData);
    } catch (error) {
        console.error('Erro ao carregar brechós:', error);
    }
}

function renderizarBrechos(brechos) {
    const grid = document.querySelector('.perfis-grid');
    
    if (!brechos || brechos.length === 0) {
        grid.innerHTML = '<section class="no-brechos"><p>Nenhum brechó encontrado.</p></section>';
        return;
    }
    
    grid.innerHTML = brechos.map(brecho => `
        <article class="perfil-card" data-status="${brecho.STATUS_USUARIO === 'a' ? 'ativo' : 'suspenso'}">
            <section class="perfil-header">
                <img src="${brecho.IMG_URL || 'imagens/icone sem cadastro.png'}" alt="Perfil" class="perfil-img">
                <section class="perfil-info">
                    <h3>@${brecho.NOME_USUARIO.toLowerCase().replace(/\s+/g, '_')}</h3>
                    <p>${brecho.NOME_USUARIO}</p>
                    <span class="status-badge ${brecho.STATUS_USUARIO === 'a' ? 'ativo' : 'suspenso'}">
                        ${brecho.STATUS_USUARIO === 'a' ? 'Ativo' : 'Suspenso'}
                    </span>
                </section>
                <section class="perfil-stats">
                    <section class="stat">
                        <span class="stat-number">4.5</span>
                        <span class="stat-label">Avaliação</span>
                    </section>
                    <section class="stat">
                        <span class="stat-number">${brecho.TOTAL_PRODUTOS}</span>
                        <span class="stat-label">Produtos</span>
                    </section>
                </section>
            </section>
            <section class="perfil-detalhes">
                <section class="detalhe-item">
                    <label>Email:</label>
                    <span>${brecho.EMAIL_USUARIO}</span>
                </section>
                <section class="detalhe-item">
                    <label>Telefone:</label>
                    <span>${brecho.CELULAR_USUARIO || 'Não informado'}</span>
                </section>
                <section class="detalhe-item">
                    <label>CNPJ:</label>
                    <span>${brecho.CNPJ_BRECHO || 'Não informado'}</span>
                </section>
                <section class="detalhe-item">
                    <label>Cadastro:</label>
                    <span>${new Date(brecho.DATA_CADASTRO).toLocaleDateString('pt-BR')}</span>
                </section>
                <section class="detalhe-item">
                    <label>Razão Social:</label>
                    <span>${brecho.RAZAO_SOCIAL || 'Não informado'}</span>
                </section>
            </section>
            <section class="perfil-actions">
                <button class="btn-visualizar" onclick="visualizarPerfil(${brecho.ID_USUARIO})">Visualizar</button>
                ${brecho.STATUS_USUARIO === 'a' ? 
                    `<button class="btn-suspender" onclick="suspenderPerfil(${brecho.ID_USUARIO})">Suspender</button>` :
                    `<button class="btn-reativar" onclick="reativarPerfil(${brecho.ID_USUARIO})">Reativar</button>`
                }
                <button class="btn-denuncias" onclick="verDenuncias(${brecho.ID_USUARIO})">Denúncias</button>
            </section>
        </article>
    `).join('');
}

function visualizarPerfil(id) {
    window.location.href = `/perfil/brecho/${id}`;
}

function suspenderPerfil(id) {
    if (confirm(`Tem certeza que deseja suspender o brechó ${id}?`)) {
        alert(`Brechó ${id} suspenso com sucesso!`);
        location.reload();
    }
}

function reativarPerfil(id) {
    if (confirm(`Tem certeza que deseja reativar o brechó ${id}?`)) {
        alert(`Brechó ${id} reativado com sucesso!`);
        location.reload();
    }
}

function verDenuncias(id) {
    window.location.href = `/denuncias?brecho=${id}`;
}

function filtrarPerfis() {
    const statusFiltro = document.querySelectorAll('.filter-select')[0].value;
    const searchTerm = document.querySelector('.search-input').value.toLowerCase();
    
    const brechosFiltrados = brechosData.filter(brecho => {
        const status = brecho.STATUS_USUARIO === 'a' ? 'ativo' : 'suspenso';
        const nome = brecho.NOME_USUARIO.toLowerCase();
        const email = brecho.EMAIL_USUARIO.toLowerCase();
        
        const matchStatus = statusFiltro === 'todos' || status === statusFiltro;
        const matchSearch = !searchTerm || nome.includes(searchTerm) || email.includes(searchTerm);
        
        return matchStatus && matchSearch;
    });
    
    renderizarBrechos(brechosFiltrados);
}

function goBack() {
    window.history.back();
}

document.addEventListener('DOMContentLoaded', function() {
    carregarBrechos();
    
    const filtros = document.querySelectorAll('.filter-select');
    const searchInput = document.querySelector('.search-input');
    
    filtros.forEach(filtro => {
        filtro.addEventListener('change', filtrarPerfis);
    });
    
    searchInput.addEventListener('input', filtrarPerfis);
});
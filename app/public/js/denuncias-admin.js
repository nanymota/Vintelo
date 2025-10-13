let denuncias = [];

async function carregarDenuncias() {
    try {
        const response = await fetch('/api/denuncias');
        denuncias = await response.json();
        renderizarDenuncias(denuncias);
    } catch (error) {
        console.error('Erro ao carregar denúncias:', error);
        // Usar dados exemplo se API falhar
        usarDadosExemplo();
    }
}

function usarDadosExemplo() {
    denuncias = [
        {
            ID_DENUNCIA: 1,
            STATUS: 'pendente',
            DATA_DENUNCIA: '2024-12-15',
            USER_ALVO: 'mayte_brechó',
            NOME_ALVO: 'Mayte Silva',
            TIPO_ALVO: 'b',
            MOTIVO: 'Perfil inadequado',
            DESCRICAO: 'Usuário está vendendo produtos falsificados e usando imagens de outros perfis.',
            USER_DENUNCIANTE: 'maria_cliente'
        },
        {
            ID_DENUNCIA: 2,
            STATUS: 'analisando',
            DATA_DENUNCIA: '2024-12-14',
            USER_ALVO: 'karine_vintage',
            NOME_ALVO: 'Karine Santos',
            TIPO_ALVO: 'b',
            MOTIVO: 'Comportamento inadequado',
            DESCRICAO: 'Vendedor está sendo agressivo com clientes nos comentários e não entrega produtos.',
            USER_DENUNCIANTE: 'ana_compras'
        },
        {
            ID_DENUNCIA: 3,
            STATUS: 'resolvida',
            DATA_DENUNCIA: '2024-12-12',
            USER_ALVO: 'joao_vendas',
            NOME_ALVO: 'João Oliveira',
            TIPO_ALVO: 'b',
            MOTIVO: 'Produto irregular',
            DESCRICAO: 'Produtos não condizem com as fotos anunciadas.',
            USER_DENUNCIANTE: 'cliente_insatisfeito',
            RESOLUCAO: 'Usuário advertido e produtos removidos'
        }
    ];
    renderizarDenuncias(denuncias);
}

function renderizarDenuncias(lista) {
    const container = document.querySelector('.denuncias-list');
    
    if (!lista || lista.length === 0) {
        container.innerHTML = '<p>Nenhuma denúncia encontrada</p>';
        return;
    }
    
    container.innerHTML = lista.map(denuncia => `
        <article class="denuncia-card" data-id="${denuncia.ID_DENUNCIA}" data-status="${denuncia.STATUS || 'pendente'}">
            <section class="denuncia-header">
                <span class="status-badge ${denuncia.STATUS || 'pendente'}">${getStatusText(denuncia.STATUS)}</span>
                <span class="data">${formatarData(denuncia.DATA_DENUNCIA)}</span>
            </section>
            
            <section class="denuncia-content">
                <section class="perfil-denunciado">
                    <img src="/imagens/icone sem cadastro.png" alt="Perfil" class="perfil-img">
                    <section class="perfil-info">
                        <h3>@${denuncia.USER_ALVO || 'usuário'}</h3>
                        <p>${denuncia.NOME_ALVO || 'Nome não disponível'}</p>
                        <span class="tipo-usuario">${denuncia.TIPO_ALVO === 'b' ? 'Vendedor' : 'Cliente'}</span>
                    </section>
                </section>
                
                <section class="denuncia-detalhes">
                    <h4>Tipo: ${denuncia.MOTIVO}</h4>
                    <p class="motivo">${denuncia.DESCRICAO || 'Sem descrição adicional'}</p>
                    <p class="denunciante">Denunciado por: @${denuncia.USER_DENUNCIANTE}</p>
                    ${denuncia.RESOLUCAO ? `<p class="resolucao"><strong>Resolução:</strong> ${denuncia.RESOLUCAO}</p>` : ''}
                </section>
            </section>
            
            <section class="denuncia-actions">
                ${denuncia.STATUS === 'resolvida' ? 
                    '<span class="status-text">Caso resolvido</span>' : 
                    `<button class="btn-analisar" onclick="analisarDenuncia(${denuncia.ID_DENUNCIA})">Analisar</button>
                     <button class="btn-resolver" onclick="resolverDenuncia(${denuncia.ID_DENUNCIA})">Resolver</button>
                     <button class="btn-rejeitar" onclick="rejeitarDenuncia(${denuncia.ID_DENUNCIA})">Rejeitar</button>`
                }
            </section>
        </article>
    `).join('');
}

function getStatusText(status) {
    switch(status) {
        case 'analisando': return 'Em análise';
        case 'resolvida': return 'Resolvida';
        default: return 'Pendente';
    }
}

function formatarData(data) {
    return new Date(data).toLocaleDateString('pt-BR');
}

async function analisarDenuncia(id) {
    try {
        const response = await fetch(`/denuncias/analisar/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            // Atualizar status localmente
            const denuncia = denuncias.find(d => d.ID_DENUNCIA == id);
            if (denuncia) {
                denuncia.STATUS = 'analisando';
                renderizarDenuncias(denuncias);
            }
        }
    } catch (error) {
        console.error('Erro ao analisar denúncia:', error);
    }
}

async function resolverDenuncia(id) {
    const resolucao = prompt('Descreva a resolução da denúncia:');
    if (!resolucao) return;
    
    try {
        const response = await fetch(`/denuncias/resolver/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resolucao })
        });
        
        if (response.ok) {
            const denuncia = denuncias.find(d => d.ID_DENUNCIA == id);
            if (denuncia) {
                denuncia.STATUS = 'resolvida';
                denuncia.RESOLUCAO = resolucao;
                renderizarDenuncias(denuncias);
            }
        }
    } catch (error) {
        console.error('Erro ao resolver denúncia:', error);
    }
}

async function rejeitarDenuncia(id) {
    if (!confirm('Tem certeza que deseja rejeitar esta denúncia?')) return;
    
    try {
        const response = await fetch(`/denuncias/rejeitar/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            denuncias = denuncias.filter(d => d.ID_DENUNCIA != id);
            renderizarDenuncias(denuncias);
        }
    } catch (error) {
        console.error('Erro ao rejeitar denúncia:', error);
    }
}

function filtrarDenuncias() {
    const statusFilter = document.querySelector('.filter-select').value;
    const tipoFilter = document.querySelectorAll('.filter-select')[1].value;
    
    let filtradas = [...denuncias];
    
    if (statusFilter !== 'todas') {
        filtradas = filtradas.filter(d => d.STATUS === statusFilter);
    }
    
    if (tipoFilter !== 'todos') {
        filtradas = filtradas.filter(d => d.MOTIVO.toLowerCase().includes(tipoFilter));
    }
    
    renderizarDenuncias(filtradas);
}

document.addEventListener('DOMContentLoaded', function() {
    carregarDenuncias();
    
    // Adicionar event listeners para filtros
    document.querySelectorAll('.filter-select').forEach(select => {
        select.addEventListener('change', filtrarDenuncias);
    });
});
// Funcionalidades da página de denúncias
document.addEventListener('DOMContentLoaded', function() {
    initializeFilters();
    initializeSearch();
    updateStatusCounts();
});

// Inicializar filtros
function initializeFilters() {
    const statusFilter = document.querySelector('.filter-select:first-child');
    const typeFilter = document.querySelector('.filter-select:last-child');
    
    if (statusFilter) {
        statusFilter.addEventListener('change', filterDenuncias);
    }
    
    if (typeFilter) {
        typeFilter.addEventListener('change', filterDenuncias);
    }
}

// Inicializar busca
function initializeSearch() {
    const searchInput = document.querySelector('.search-profile input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(searchDenuncias, 300));
    }
}

// Filtrar denúncias
function filterDenuncias() {
    const statusFilter = document.querySelector('.filter-select:first-child').value;
    const typeFilter = document.querySelector('.filter-select:last-child').value;
    const cards = document.querySelectorAll('.denuncia-card');
    
    cards.forEach(card => {
        const cardStatus = card.dataset.status || 'pendente';
        const cardType = card.querySelector('.denuncia-detalhes h4')?.textContent.toLowerCase() || '';
        
        const matchStatus = statusFilter === 'todas' || cardStatus === statusFilter;
        const matchType = typeFilter === 'todos' || cardType.includes(typeFilter);
        
        if (matchStatus && matchType) {
            card.style.display = 'block';
            card.style.animation = 'fadeIn 0.3s ease';
        } else {
            card.style.display = 'none';
        }
    });
    
    updateStatusCounts();
}

// Buscar denúncias
function searchDenuncias(event) {
    const searchTerm = event.target.value.toLowerCase();
    const cards = document.querySelectorAll('.denuncia-card');
    
    cards.forEach(card => {
        const userName = card.querySelector('.perfil-info h3')?.textContent.toLowerCase() || '';
        const userFullName = card.querySelector('.perfil-info p')?.textContent.toLowerCase() || '';
        const description = card.querySelector('.motivo')?.textContent.toLowerCase() || '';
        
        const matches = userName.includes(searchTerm) || 
                       userFullName.includes(searchTerm) || 
                       description.includes(searchTerm);
        
        if (matches || searchTerm === '') {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Analisar denúncia
function analisarDenuncia(id) {
    const card = document.querySelector(`[data-id="${id}"]`);
    if (!card) return;
    
    // Criar modal de análise
    const modal = createAnalysisModal(id);
    document.body.appendChild(modal);
    modal.style.display = 'flex';
}

// Resolver denúncia
function resolverDenuncia(id) {
    const modal = createResolutionModal(id);
    document.body.appendChild(modal);
    modal.style.display = 'flex';
}

// Criar modal de resolução
function createResolutionModal(id) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content resolution-modal">
            <div class="modal-header">
                <h3>Resolver Denúncia #${id}</h3>
                <button class="modal-close" onclick="closeModal(this)">&times;</button>
            </div>
            <div class="modal-body">
                <div class="resolution-options">
                    <h4>Ação tomada:</h4>
                    <label class="radio-option">
                        <input type="radio" name="resolution" value="advertencia">
                        <span class="radio-custom"></span>
                        Advertência enviada ao usuário
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="resolution" value="suspensao">
                        <span class="radio-custom"></span>
                        Conta suspensa temporariamente
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="resolution" value="banimento">
                        <span class="radio-custom"></span>
                        Usuário banido da plataforma
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="resolution" value="sem_acao">
                        <span class="radio-custom"></span>
                        Denúncia improcedente - sem ação
                    </label>
                </div>
                <div class="form-group">
                    <label for="resolution-details">Detalhes da resolução:</label>
                    <textarea id="resolution-details" placeholder="Descreva as medidas tomadas e justificativa..." rows="4"></textarea>
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn-secondary" onclick="closeModal(this)">Cancelar</button>
                <button class="btn-primary" onclick="processResolution(${id}, this)">Resolver Denúncia</button>
            </div>
        </div>
    `;
    return modal;
}

// Processar resolução
function processResolution(id, button) {
    const modal = button.closest('.modal-overlay');
    const resolution = modal.querySelector('input[name="resolution"]:checked')?.value;
    const details = modal.querySelector('#resolution-details').value;
    
    if (!resolution) {
        showNotification('Selecione uma ação', 'warning');
        return;
    }
    
    if (!details.trim()) {
        showNotification('Adicione detalhes da resolução', 'warning');
        return;
    }
    
    const resolutionText = getResolutionText(resolution, details);
    
    fetch(`/denuncias/resolver/${id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resolucao: resolutionText, action: resolution })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            updateCardStatus(id, 'resolvida', resolutionText);
            closeModal(button);
            showNotification('Denúncia resolvida com sucesso!', 'success');
        } else {
            showNotification('Erro ao resolver denúncia', 'error');
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        showNotification('Erro ao resolver denúncia', 'error');
    });
}

// Obter texto da resolução
function getResolutionText(resolution, details) {
    const actions = {
        'advertencia': 'Advertência aplicada',
        'suspensao': 'Conta suspensa',
        'banimento': 'Usuário banido',
        'sem_acao': 'Denúncia improcedente'
    };
    return `${actions[resolution]}: ${details}`;
}

// Rejeitar denúncia
function rejeitarDenuncia(id) {
    if (!confirm('Tem certeza que deseja rejeitar esta denúncia?')) return;
    
    fetch(`/denuncias/rejeitar/${id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const card = document.querySelector(`[data-id="${id}"]`);
            if (card) {
                card.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => card.remove(), 300);
            }
            showNotification('Denúncia rejeitada', 'info');
        } else {
            showNotification('Erro ao rejeitar denúncia', 'error');
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        showNotification('Erro ao rejeitar denúncia', 'error');
    });
}

// Criar modal de análise
function createAnalysisModal(id) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Analisar Denúncia #${id}</h3>
                <button class="modal-close" onclick="closeModal(this)">&times;</button>
            </div>
            <div class="modal-body">
                <div class="analysis-options">
                    <label>
                        <input type="radio" name="action" value="advertir"> Advertir usuário
                    </label>
                    <label>
                        <input type="radio" name="action" value="suspender"> Suspender conta
                    </label>
                    <label>
                        <input type="radio" name="action" value="banir"> Banir usuário
                    </label>
                    <label>
                        <input type="radio" name="action" value="ignorar"> Ignorar denúncia
                    </label>
                </div>
                <textarea placeholder="Observações da análise..." rows="4"></textarea>
            </div>
            <div class="modal-actions">
                <button class="btn-secondary" onclick="closeModal(this)">Cancelar</button>
                <button class="btn-primary" onclick="processAnalysis(${id}, this)">Processar</button>
            </div>
        </div>
    `;
    return modal;
}

// Processar análise
function processAnalysis(id, button) {
    const modal = button.closest('.modal-overlay');
    const action = modal.querySelector('input[name="action"]:checked')?.value;
    const observations = modal.querySelector('textarea').value;
    
    if (!action) {
        showNotification('Selecione uma ação', 'warning');
        return;
    }
    
    fetch(`/denuncias/analisar/${id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, observations })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            updateCardStatus(id, 'analisada');
            closeModal(button);
            showNotification('Análise processada com sucesso!', 'success');
        } else {
            showNotification('Erro ao processar análise', 'error');
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        showNotification('Erro ao processar análise', 'error');
    });
}

// Atualizar status do card
function updateCardStatus(id, status, resolucao = null) {
    const card = document.querySelector(`[data-id="${id}"]`);
    if (!card) return;
    
    card.dataset.status = status;
    const badge = card.querySelector('.status-badge');
    const actions = card.querySelector('.denuncia-actions');
    
    if (badge) {
        badge.className = `status-badge ${status}`;
        badge.textContent = status === 'resolvida' ? 'Resolvida' : 
                           status === 'analisada' ? 'Em análise' : 'Pendente';
    }
    
    if (status === 'resolvida') {
        actions.innerHTML = '<span class="status-text">Caso resolvido</span>';
        if (resolucao) {
            const detalhes = card.querySelector('.denuncia-detalhes');
            const resolucaoEl = document.createElement('p');
            resolucaoEl.className = 'resolucao';
            resolucaoEl.innerHTML = `<strong>Resolução:</strong> ${resolucao}`;
            detalhes.appendChild(resolucaoEl);
        }
    }
}

// Fechar modal
function closeModal(element) {
    const modal = element.closest('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// Mostrar notificação
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Atualizar contadores de status
function updateStatusCounts() {
    const cards = document.querySelectorAll('.denuncia-card:not([style*="display: none"])');
    const pendentes = Array.from(cards).filter(card => card.dataset.status === 'pendente').length;
    const analisadas = Array.from(cards).filter(card => card.dataset.status === 'analisada').length;
    const resolvidas = Array.from(cards).filter(card => card.dataset.status === 'resolvida').length;
    
    // Atualizar header se existir elemento para contadores
    const header = document.querySelector('.admin-header p');
    if (header) {
        header.textContent = `${pendentes} pendentes • ${analisadas} em análise • ${resolvidas} resolvidas`;
    }
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// CSS para animações e modal
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-10px); }
    }
    
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }
    
    .modal-content {
        background: white;
        border-radius: 12px;
        padding: 25px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
    }
    
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 1px solid #eee;
    }
    
    .modal-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #999;
    }
    
    .analysis-options {
        margin-bottom: 20px;
    }
    
    .analysis-options label {
        display: block;
        margin-bottom: 10px;
        cursor: pointer;
    }
    
    .modal-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        margin-top: 20px;
    }
    
    .btn-primary, .btn-secondary {
        padding: 10px 20px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
    }
    
    .btn-primary {
        background: #7D2838;
        color: white;
    }
    
    .btn-secondary {
        background: #f8f9fa;
        color: #333;
        border: 1px solid #ddd;
    }
    
    .resolution-modal {
        max-width: 600px;
    }
    
    .resolution-options {
        margin-bottom: 25px;
    }
    
    .resolution-options h4 {
        color: #7D2838;
        margin-bottom: 15px;
        font-size: 16px;
        font-weight: 500;
    }
    
    .radio-option {
        display: flex;
        align-items: center;
        margin-bottom: 12px;
        cursor: pointer;
        padding: 10px;
        border-radius: 8px;
        transition: background 0.2s ease;
    }
    
    .radio-option:hover {
        background: rgba(125, 40, 56, 0.05);
    }
    
    .radio-option input[type="radio"] {
        display: none;
    }
    
    .radio-custom {
        width: 18px;
        height: 18px;
        border: 2px solid #ddd;
        border-radius: 50%;
        margin-right: 12px;
        position: relative;
        transition: all 0.2s ease;
    }
    
    .radio-option input[type="radio"]:checked + .radio-custom {
        border-color: #7D2838;
        background: #7D2838;
    }
    
    .radio-option input[type="radio"]:checked + .radio-custom::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 6px;
        height: 6px;
        background: white;
        border-radius: 50%;
    }
    
    .form-group {
        margin-bottom: 20px;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 8px;
        color: #7D2838;
        font-weight: 500;
    }
    
    .form-group textarea {
        width: 100%;
        padding: 12px;
        border: 2px solid #eee;
        border-radius: 8px;
        font-family: inherit;
        font-size: 14px;
        resize: vertical;
        transition: border-color 0.2s ease;
    }
    
    .form-group textarea:focus {
        outline: none;
        border-color: #7D2838;
    }
    
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        z-index: 1001;
    }
    
    .notification.show {
        transform: translateX(0);
    }
    
    .notification.success { background: #28a745; }
    .notification.error { background: #dc3545; }
    .notification.warning { background: #ffc107; color: #333; }
    .notification.info { background: #17a2b8; }
`;
document.head.appendChild(style);
// Funções para edição de produtos
function editProduct(productId) {
    fetch(`/produto/detalhes/${productId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const produto = data.produto;
                
                document.getElementById('editProductId').value = produto.ID_PRODUTO;
                document.getElementById('editNome').value = produto.NOME_PRODUTO || '';
                document.getElementById('editPreco').value = produto.PRECO || '';
                document.getElementById('editDescricao').value = produto.DETALHES_PRODUTO || produto.DESCRICAO_PRODUTO || '';
                document.getElementById('editTipo').value = produto.TIPO_PRODUTO || '';
                document.getElementById('editTamanho').value = produto.TAMANHO_PRODUTO || '';
                document.getElementById('editCor').value = produto.COR_PRODUTO || '';
                document.getElementById('editCondicao').value = produto.CONDICAO_PRODUTO || '';
                
                const modal = document.getElementById('editProductModal');
                modal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            } else {
                showNotification('Erro ao carregar dados do produto', 'error');
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            showNotification('Erro ao carregar produto', 'error');
        });
}

function closeEditModal() {
    const modal = document.getElementById('editProductModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function deleteProduct(productId) {
    showConfirmModal('Tem certeza que deseja excluir este produto?', 'Esta ação não pode ser desfeita.', () => {
        fetch('/produto/excluir', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ productId: productId })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Produto excluído com sucesso!', 'success');
                setTimeout(() => location.reload(), 1500);
            } else {
                showNotification(data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            showNotification('Erro no servidor. Tente novamente.', 'error');
        });
    });
}

// Sistema de notificações customizado
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${type === 'success' ? '✅' : '❌'}</span>
            <span class="notification-message">${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function showConfirmModal(title, message, onConfirm) {
    const modal = document.createElement('div');
    modal.className = 'confirm-modal';
    modal.innerHTML = `
        <div class="confirm-modal-content">
            <div class="confirm-header">
                <span class="confirm-icon">⚠️</span>
                <h3>${title}</h3>
            </div>
            <p class="confirm-message">${message}</p>
            <div class="confirm-actions">
                <button class="confirm-btn cancel" onclick="closeConfirmModal()">Cancelar</button>
                <button class="confirm-btn confirm" onclick="confirmAction()">Excluir</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    window.closeConfirmModal = () => {
        document.body.removeChild(modal);
    };
    
    window.confirmAction = () => {
        onConfirm();
        closeConfirmModal();
    };
}

// Funções de filtro
function sortProducts(type) {
    console.log('Ordenando por:', type);
}

function updatePriceRange() {
    const min = document.getElementById('min').value;
    const max = document.getElementById('max').value;
    document.getElementById('min-value').value = min;
    document.getElementById('max-value').value = max;
}

function filterByPrice() {
    console.log('Filtrando por preço');
}

function applyFilters() {
    console.log('Aplicando filtros');
}

function clearFilters() {
    console.log('Limpando filtros');
}

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    // Event listeners para botões de produto
    document.querySelectorAll('.edit-product-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            editProduct(this.dataset.productId);
        });
    });
    
    document.querySelectorAll('.delete-product-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            deleteProduct(this.dataset.productId);
        });
    });
    
    // Event listeners para filtros
    document.querySelectorAll('[data-sort]').forEach(item => {
        item.addEventListener('click', function() {
            sortProducts(this.dataset.sort);
        });
    });
    
    const minRange = document.getElementById('min');
    const maxRange = document.getElementById('max');
    if (minRange) minRange.addEventListener('input', updatePriceRange);
    if (maxRange) maxRange.addEventListener('input', updatePriceRange);
    
    const minValue = document.getElementById('min-value');
    const maxValue = document.getElementById('max-value');
    if (minValue) minValue.addEventListener('change', filterByPrice);
    if (maxValue) maxValue.addEventListener('change', filterByPrice);
    
    const applyBtn = document.getElementById('applyFiltersBtn');
    const clearBtn = document.getElementById('clearFiltersBtn');
    if (applyBtn) applyBtn.addEventListener('click', applyFilters);
    if (clearBtn) clearBtn.addEventListener('click', clearFilters);
    
    // Event listeners para modal
    const closeBtn = document.getElementById('closeModalBtn');
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (closeBtn) closeBtn.addEventListener('click', closeEditModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeEditModal);
    
    // Botão voltar
    const goBackBtn = document.getElementById('goBackBtn');
    if (goBackBtn) {
        goBackBtn.addEventListener('click', function() {
            window.history.back();
        });
    }
    
    // Submissão do formulário de edição
    const editForm = document.getElementById('editProductForm');
    if (editForm) {
        editForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = {
                productId: document.getElementById('editProductId').value,
                nome: document.getElementById('editNome').value,
                preco: document.getElementById('editPreco').value,
                descricao: document.getElementById('editDescricao').value,
                tipo: document.getElementById('editTipo').value,
                tamanho: document.getElementById('editTamanho').value,
                cor: document.getElementById('editCor').value,
                condicao: document.getElementById('editCondicao').value
            };
            
            fetch('/produto/editar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showNotification('Produto atualizado com sucesso!', 'success');
                    closeEditModal();
                    setTimeout(() => location.reload(), 1500);
                } else {
                    showNotification(data.message, 'error');
                }
            })
            .catch(error => {
                console.error('Erro:', error);
                showNotification('Erro no servidor. Tente novamente.', 'error');
            });
        });
    }
    
    // Fechar modal clicando fora dele
    window.onclick = function(event) {
        const modal = document.getElementById('editProductModal');
        if (event.target == modal) {
            closeEditModal();
        }
    }
});
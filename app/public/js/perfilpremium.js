// Funcionalidades do perfil premium

// Navegação por abas
document.addEventListener('DOMContentLoaded', function() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetTab = this.dataset.tab;
            
            // Remove active class from all tabs and contents
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            this.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });
});

// Salvar alterações de plano
function salvarPlano(planType, price) {
    fetch('/premium/atualizar-plano', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            tipo: planType,
            preco: price
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Plano atualizado com sucesso!');
        } else {
            alert('Erro ao atualizar plano: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro interno do servidor');
    });
}

// Alternar status do plano
function alternarStatusPlano(planType, status) {
    fetch('/premium/alternar-status', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            tipo: planType,
            status: status
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Status do plano alterado com sucesso!');
            location.reload();
        } else {
            alert('Erro ao alterar status: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro interno do servidor');
    });
}

// Ver detalhes do usuário
function verUsuario(userId) {
    window.location.href = `/usuariosadm?id=${userId}`;
}

// Suspender premium do usuário
function suspenderPremium(userId) {
    if (confirm('Tem certeza que deseja suspender o plano premium deste usuário?')) {
        fetch('/premium/suspender-usuario', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: userId
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Plano premium suspenso com sucesso!');
                location.reload();
            } else {
                alert('Erro ao suspender plano: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro interno do servidor');
        });
    }
}

// Event listeners para botões de salvar
document.addEventListener('DOMContentLoaded', function() {
    const saveButtons = document.querySelectorAll('.btn-save');
    const toggleButtons = document.querySelectorAll('.btn-toggle');
    
    saveButtons.forEach((btn, index) => {
        btn.addEventListener('click', function() {
            const planCard = this.closest('.plan-card');
            const planTitle = planCard.querySelector('h3').textContent;
            const priceInput = planCard.querySelector('input[type="number"]');
            const price = parseFloat(priceInput.value);
            
            salvarPlano(planTitle.toLowerCase(), price);
        });
    });
    
    toggleButtons.forEach((btn, index) => {
        btn.addEventListener('click', function() {
            const planCard = this.closest('.plan-card');
            const planTitle = planCard.querySelector('h3').textContent;
            const currentStatus = this.textContent === 'Ativar' ? 'inativo' : 'ativo';
            const newStatus = currentStatus === 'ativo' ? 'inativo' : 'ativo';
            
            alternarStatusPlano(planTitle.toLowerCase(), newStatus);
        });
    });
});
// Funcionalidades da página de planos

function contratarPlano(planoId, nomePlano, preco) {
    // Verificar se usuário está logado
    if (!window.isAuthenticated) {
        if (confirm('Você precisa ter uma conta para contratar um plano. Deseja criar uma conta agora?')) {
            window.location.href = '/cadastro';
        }
        return;
    }
    
    if (confirm(`Deseja contratar o plano ${nomePlano} por R$ ${preco.toFixed(2).replace('.', ',')} por mês?`)) {
        // Enviar requisição para contratar plano
        fetch('/planos/contratar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                planoId: planoId,
                nomePlano: nomePlano,
                preco: preco
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Plano contratado com sucesso!');
                // Redirecionar para página de pagamento ou confirmação
                if (data.redirectUrl) {
                    window.location.href = data.redirectUrl;
                } else {
                    location.reload();
                }
            } else {
                alert('Erro ao contratar plano: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro interno do servidor');
        });
    }
}

function cancelarPlano() {
    if (confirm('Tem certeza que deseja cancelar seu plano atual?')) {
        fetch('/planos/cancelar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Plano cancelado com sucesso!');
                location.reload();
            } else {
                alert('Erro ao cancelar plano: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro interno do servidor');
        });
    }
}

function alterarPlano(novoPlanoId, nomePlano, preco) {
    if (confirm(`Deseja alterar para o plano ${nomePlano} por R$ ${preco.toFixed(2).replace('.', ',')} por mês?`)) {
        fetch('/planos/alterar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                novoPlanoId: novoPlanoId,
                nomePlano: nomePlano,
                preco: preco
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Plano alterado com sucesso!');
                location.reload();
            } else {
                alert('Erro ao alterar plano: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro interno do servidor');
        });
    }
}

// Verificar status de autenticação
document.addEventListener('DOMContentLoaded', function() {
    // Definir variável global de autenticação se não existir
    if (typeof window.isAuthenticated === 'undefined') {
        window.isAuthenticated = false;
    }
    
    // Adicionar botão de cancelar se usuário tem plano ativo
    const planoAtual = document.querySelector('.plano-atual');
    if (planoAtual) {
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancelar Plano';
        cancelBtn.className = 'btn-cancelar';
        cancelBtn.onclick = cancelarPlano;
        planoAtual.appendChild(cancelBtn);
    }
});
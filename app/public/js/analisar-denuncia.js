function resolverComAcao(acao) {
    const resolucao = document.getElementById('resolucaoText').value;
    if (!resolucao.trim()) {
        alert('Por favor, digite uma resolução para a denúncia.');
        return;
    }

    const resolucaoCompleta = `${acao.toUpperCase()}: ${resolucao}`;
    const denunciaId = document.querySelector('[data-denuncia-id]').dataset.denunciaId;
    
    if (confirm(`Confirma a ação: ${acao} usuário?\nResolução: ${resolucao}`)) {
        fetch(`/denuncias/resolver/${denunciaId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                resolucao: resolucaoCompleta,
                acao: acao 
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.sucesso) {
                alert('Denúncia resolvida com sucesso!');
                window.location.href = '/denuncias';
            } else {
                alert('Erro ao resolver denúncia: ' + data.mensagem);
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro ao processar solicitação');
        });
    }
}

function investigarMais() {
    const denunciaId = document.querySelector('[data-denuncia-id]').dataset.denunciaId;
    
    if (confirm('Marcar denúncia como "Em investigação"?')) {
        fetch(`/denuncias/analisar/${denunciaId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.sucesso) {
                alert('Denúncia marcada para investigação!');
                location.reload();
            } else {
                alert('Erro ao atualizar status');
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro ao processar solicitação');
        });
    }
}

function rejeitarDenuncia() {
    const denunciaId = document.querySelector('[data-denuncia-id]').dataset.denunciaId;
    
    if (confirm('Tem certeza que deseja rejeitar esta denúncia? Esta ação não pode ser desfeita.')) {
        fetch(`/denuncias/rejeitar/${denunciaId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.sucesso) {
                alert('Denúncia rejeitada!');
                window.location.href = '/denuncias';
            } else {
                alert('Erro ao rejeitar denúncia');
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro ao processar solicitação');
        });
    }
}

function goBack() {
    window.history.back();
}
// Funcionalidades do blog admin

function toggleForm() {
    const modal = document.getElementById('postModal');
    modal.style.display = modal.style.display === 'none' ? 'flex' : 'none';
}

function handleSubmit(event) {
    const status = document.getElementById('status').value;
    const titulo = document.getElementById('titulo').value;
    
    if (status === 'publicado') {
        if (confirm(`Deseja publicar o artigo "${titulo}" imediatamente?`)) {
            alert('Artigo publicado com sucesso!');
            setTimeout(() => {
                window.location.href = '/blogadm';
            }, 1000);
            return true;
        }
        return false;
    } else if (status === 'rascunho') {
        alert('Artigo salvo como rascunho!');
        return true;
    } else if (status === 'agendado') {
        alert('Artigo agendado para publicação!');
        return true;
    }
}

function editarPost(id) {
    const editPages = {
        1: '/editarpost?id=1',
        2: '/editarboss?id=2',
        3: '/editargucci?id=3',
        4: '/editarsweet?id=4',
        5: '/editarsustentavel?id=5',
        6: '/editarecologico?id=6'
    };
    
    if (editPages[id]) {
        window.location.href = editPages[id];
    } else {
        alert('Página de edição não encontrada para este post.');
    }
}

function excluirPost(id) {
    if (confirm('Tem certeza que deseja excluir este post? Esta ação não pode ser desfeita.')) {
        fetch('/blog/deletar/' + id, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.sucesso) {
                alert('Post excluído com sucesso!');
                location.reload();
            } else {
                alert('Erro ao excluir post: ' + data.erro);
            }
        })
        .catch(error => {
            alert('Erro ao excluir post');
            console.error(error);
        });
    }
}

function goBack() {
    window.history.back();
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    const filterStatus = document.getElementById('filterStatus');
    const filterCategory = document.getElementById('filterCategory');
    
    if (filterStatus) {
        filterStatus.addEventListener('change', function() {
            // Implementar filtro por status
        });
    }
    
    if (filterCategory) {
        filterCategory.addEventListener('change', function() {
            // Implementar filtro por categoria
        });
    }
});
document.addEventListener('DOMContentLoaded', function() {
    const reviewForm = document.getElementById('reviewForm');
    
    if (reviewForm) {
        reviewForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!window.isAuthenticated) {
                alert('Faça login para avaliar');
                return;
            }
            
            const formData = new FormData(this);
            const nota = formData.get('nota');
            const comentario = formData.get('comentario');
            
            if (!nota) {
                alert('Por favor, selecione uma nota');
                return;
            }
            
            fetch('/avaliacoes/criar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nota: parseInt(nota),
                    comentario: comentario,
                    brechoId: window.brechoId
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Avaliação enviada com sucesso!');
                    location.reload();
                } else {
                    alert(data.message || 'Erro ao enviar avaliação');
                }
            })
            .catch(error => {
                console.error('Erro:', error);
                alert('Erro ao enviar avaliação');
            });
        });
    }
    
    // Sistema de estrelas interativo
    const starsInputs = document.querySelectorAll('.stars-input input');
    const starsLabels = document.querySelectorAll('.stars-input label');
    
    starsLabels.forEach((label, index) => {
        label.addEventListener('mouseover', function() {
            highlightStars(index + 1);
        });
        
        label.addEventListener('click', function() {
            selectStars(index + 1);
        });
    });
    
    document.querySelector('.stars-input').addEventListener('mouseleave', function() {
        const selected = document.querySelector('.stars-input input:checked');
        if (selected) {
            highlightStars(parseInt(selected.value));
        } else {
            highlightStars(0);
        }
    });
    
    function highlightStars(count) {
        starsLabels.forEach((label, index) => {
            if (index < count) {
                label.style.color = '#ffc107';
            } else {
                label.style.color = '#ddd';
            }
        });
    }
    
    function selectStars(count) {
        starsInputs[count - 1].checked = true;
        highlightStars(count);
    }
});
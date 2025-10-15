document.addEventListener('DOMContentLoaded', function() {
    const reviewForm = document.getElementById('reviewForm');
    
    if (reviewForm) {
        reviewForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const nota = document.querySelector('input[name="nota"]:checked')?.value;
            const comentario = document.getElementById('comentario').value;
            const brechoId = document.getElementById('brechoId').value;
            
            if (!nota) {
                alert('Por favor, selecione uma nota');
                return;
            }
            
            if (!comentario.trim()) {
                alert('Por favor, escreva um comentário');
                return;
            }
            
            try {
                const response = await fetch('/avaliacoes/criar', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        nota: parseInt(nota),
                        comentario: comentario.trim(),
                        brechoId: parseInt(brechoId)
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    alert('Avaliação enviada com sucesso!');
                    location.reload();
                } else {
                    alert('Erro: ' + data.message);
                }
            } catch (error) {
                console.error('Erro:', error);
                alert('Erro ao enviar avaliação. Tente novamente.');
            }
        });
    }
    
    // Botão voltar
    const goBackBtn = document.getElementById('goBackBtn');
    if (goBackBtn) {
        goBackBtn.addEventListener('click', function() {
            window.history.back();
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
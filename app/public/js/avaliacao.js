// Funcionalidades da página de avaliações

let selectedRating = 0;
let currentBrechoId = null;

// Navegação por abas
document.addEventListener('DOMContentLoaded', function() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetTab = this.dataset.tab;
            
            // Remove active class from all buttons and contents
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            this.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });
    
    // Event listeners para botões de excluir
    const deleteButtons = document.querySelectorAll('.btn-delete');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const avaliacaoId = this.dataset.avaliacaoId;
            if (avaliacaoId) {
                excluirComentario(avaliacaoId);
            }
        });
    });
    
    initStarRating();
});

// Avaliar brechó
async function avaliarBrecho(brechoId) {
    const isAuth = await window.PerfilAutenticado.isAuthenticated();
    if (!isAuth) {
        alert('Faça login para avaliar brechós');
        window.location.href = '/entrar';
        return;
    }
    
    currentBrechoId = brechoId;
    document.getElementById('brechoId').value = brechoId;
    document.getElementById('formTitle').textContent = 'Avaliar Brechó';
    toggleReviewForm();
}

// Alternar formulário de avaliação
function toggleReviewForm() {
    const form = document.getElementById('reviewForm');
    if (form) {
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
        if (form.style.display === 'block') {
            selectedRating = 0;
            updateStars();
            document.getElementById('reviewText').value = '';
            
            // Se não há brechó selecionado, é avaliação da plataforma
            if (!currentBrechoId) {
                document.getElementById('brechoId').value = '';
                document.getElementById('formTitle').textContent = 'Avaliar Plataforma';
            }
        }
    }
}

// Sistema de estrelas
function initStarRating() {
    const stars = document.querySelectorAll('.star');
    
    stars.forEach(star => {
        star.addEventListener('click', function() {
            selectedRating = parseInt(this.dataset.rating);
            updateStars();
        });
        
        star.addEventListener('mouseover', function() {
            const rating = parseInt(this.dataset.rating);
            highlightStars(rating);
        });
    });
    
    const starRating = document.querySelector('.star-rating');
    if (starRating) {
        starRating.addEventListener('mouseleave', function() {
            updateStars();
        });
    }
}

function highlightStars(rating) {
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('selected');
            star.style.color = '#ffc107';
        } else {
            star.classList.remove('selected');
            star.style.color = '#ddd';
        }
    });
}

function updateStars() {
    highlightStars(selectedRating);
}

// Enviar avaliação
async function submitReview(event) {
    event.preventDefault();
    
    const isAuth = await window.PerfilAutenticado.isAuthenticated();
    if (!isAuth) {
        alert('Faça login para avaliar');
        window.location.href = '/entrar';
        return;
    }
    
    if (selectedRating === 0) {
        alert('Por favor, selecione uma nota de 1 a 5 estrelas');
        return;
    }
    
    const reviewText = document.getElementById('reviewText').value;
    
    if (!reviewText.trim()) {
        alert('Por favor, escreva um comentário');
        return;
    }
    
    const brechoId = document.getElementById('brechoId').value;
    
    // Enviar para o backend
    fetch('/avaliacoes/criar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            nota: selectedRating,
            comentario: reviewText,
            brechoId: brechoId || null
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Avaliação enviada com sucesso!');
            location.reload();
        } else {
            alert('Erro ao enviar avaliação: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro interno do servidor');
    });
}

// Excluir avaliação
async function excluirAvaliacao(avaliacaoId) {
    const isAuth = await window.PerfilAutenticado.isAuthenticated();
    if (!isAuth) {
        alert('Faça login para excluir avaliações');
        return;
    }
    
    if (confirm('Tem certeza que deseja excluir esta avaliação?')) {
        fetch('/avaliacoes/excluir', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                avaliacaoId: avaliacaoId
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Avaliação excluída com sucesso!');
                location.reload();
            } else {
                alert('Erro ao excluir avaliação: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro interno do servidor');
        });
    }
}

// Função para admin excluir comentários
function excluirComentario(id) {
    if (confirm('Tem certeza que deseja excluir esta avaliação?')) {
        const reviewElement = document.getElementById(`review-${id}`);
        if (reviewElement) {
            reviewElement.style.opacity = '0.5';
            reviewElement.style.transition = 'opacity 0.3s';
            
            fetch(`/avaliacaoadm/excluir/${id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    setTimeout(() => {
                        reviewElement.remove();
                        alert('Avaliação excluída com sucesso!');
                    }, 300);
                } else {
                    reviewElement.style.opacity = '1';
                    alert('Erro ao excluir avaliação: ' + data.message);
                }
            })
            .catch(error => {
                reviewElement.style.opacity = '1';
                alert('Erro ao excluir avaliação');
            });
        }
    }
}
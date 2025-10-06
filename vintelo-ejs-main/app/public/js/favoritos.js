// Funcionalidade dos botões de favoritar
document.addEventListener('DOMContentLoaded', function() {
    const favoriteButtons = document.querySelectorAll('.favorite');
    
    favoriteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Toggle do estado de favorito
            this.classList.toggle('favorited');
            
            // Feedback visual
            if (this.classList.contains('favorited')) {
                this.style.backgroundColor = '#ff6b6b';
                this.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    this.style.transform = 'scale(1)';
                }, 200);
            } else {
                this.style.backgroundColor = 'transparent';
            }
        });
    });
});
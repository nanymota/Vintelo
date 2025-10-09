document.addEventListener('DOMContentLoaded', function() {
    const cadastroForm = document.querySelector('form[action="/cadastro"]');
    
    if (cadastroForm) {
        cadastroForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            
            try {
                const response = await fetch('/cadastro', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: formData
                });
                
                if (response.ok) {
                    const result = await response.json();
                    
                    if (result.success) {
                        // Salvar dados do usuárioe
                        localStorage.setItem('userData', JSON.stringify(result.userData));
                        
                        window.location.href = '/homecomprador';
                    }
                } else {
                    this.submit();
                }
            } catch (error) {
                console.error('Erro no cadastro:', error);
                this.submit();
            }
        });
    }
});

// Cadastro de brechó - usando envio normal do formulário
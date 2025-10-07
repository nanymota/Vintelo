// Script para cadastro via AJAX e atualização do menu
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
                        // Salvar dados do usuário no localStorage
                        localStorage.setItem('userData', JSON.stringify(result.userData));
                        
                        // Redirecionar para home
                        window.location.href = '/homecomprador';
                    }
                } else {
                    // Se não for JSON, recarregar a página para mostrar erros
                    this.submit();
                }
            } catch (error) {
                console.error('Erro no cadastro:', error);
                // Fallback para submit normal
                this.submit();
            }
        });
    }
});

// pro cadastro do brechó
document.addEventListener('DOMContentLoaded', function() {
    const brechoForm = document.querySelector('form[action="/criarbrecho"]');
    
    if (brechoForm) {
        brechoForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            
            try {
                const response = await fetch('/criarbrecho', {
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
                        // Salvar dados do usuário no localStorage
                        localStorage.setItem('userData', JSON.stringify(result.userData));
                        
                        // Redirecionar para home vendedor
                        window.location.href = '/homevendedor';
                    }
                } else {
                    // Se não for JSON, recarregar a página para mostrar erros
                    this.submit();
                }
            } catch (error) {
                console.error('Erro ao criar brechó:', error);
                // Fallback para submit normal
                this.submit();
            }
        });
    }
});
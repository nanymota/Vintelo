function validatePhoto(form) {
    const fileInputs = form.querySelectorAll('input[name="fotos"]');
    let hasPhoto = false;
    
    fileInputs.forEach(input => {
        if (input.files && input.files.length > 0) {
            hasPhoto = true;
        }
    });
    
    if (!hasPhoto) {
        alert('Por favor, adicione pelo menos uma foto do produto.');
        return false;
    }
    
    return true;
}

function formatarPreco(input) {
    let valor = input.value.replace(/\D/g, '');
    valor = (valor / 100).toFixed(2) + '';
    valor = valor.replace('.', ',');
    valor = valor.replace(/(\d)(\d{3})(\d{3}),/g, '$1.$2.$3,');
    valor = valor.replace(/(\d)(\d{3}),/g, '$1.$2,');
    input.value = 'R$ ' + valor;
}

document.addEventListener('DOMContentLoaded', function() {
    // Formatar preço
    const precoInputs = document.querySelectorAll('input[name="preco_produto"]');
    precoInputs.forEach(input => {
        input.addEventListener('input', function() {
            formatarPreco(this);
        });
    });
    
    // Escutar apenas inputs EXTERNOS para preview e sincronização
    const externalInputs = document.querySelectorAll('.photo-section input[type="file"]');
    
    externalInputs.forEach(input => {
        input.addEventListener('change', function() {
            const file = this.files[0];
            if (!file) return;
            
            // 1. FAZER PREVIEW
            const reader = new FileReader();
            reader.onload = function(e) {
                let img;
                if (input.id === 'main-photo-external') {
                    img = document.getElementById('main-photo');
                } else {
                    const index = input.id.replace('thumb-external-', '');
                    img = document.getElementById('thumb-' + index);
                    if (!img) {
                        img = document.createElement('img');
                        img.id = 'thumb-' + index;
                        img.style.width = '100%';
                        img.style.height = '100%';
                        img.style.objectFit = 'cover';
                        input.parentNode.appendChild(img);
                        const btn = input.parentNode.querySelector('.add-photo-btn');
                        if (btn) btn.style.display = 'none';
                    }
                }
                if (img) {
                    img.src = e.target.result;
                }
            };
            reader.readAsDataURL(file);
            
            // 2. SINCRONIZAR COM INPUT INTERNO
            let internalInputId;
            if (input.id === 'main-photo-external') {
                internalInputId = 'main-photo-input';
            } else {
                const index = input.id.replace('thumb-external-', '');
                internalInputId = 'thumb-input-' + index;
            }
            
            const internalInput = document.getElementById(internalInputId);
            if (internalInput) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                internalInput.files = dataTransfer.files;
            }
        });
    });
});

// Variáveis de autenticação para página adicionar
window.isAuthenticated = false;
window.userType = 'b';
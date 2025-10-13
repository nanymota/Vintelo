// ========== VALIDAÇÕES DO CÓDIGO DE VERIFICAÇÃO ==========

document.addEventListener('DOMContentLoaded', function() {
    const codigoInput = document.getElementById('codigo');
    
    if (codigoInput) {
        // Permitir apenas números
        codigoInput.addEventListener('input', function(e) {
            this.value = this.value.replace(/\D/g, '');
        });
        
        // Auto-submit quando 6 dígitos forem digitados
        codigoInput.addEventListener('input', function(e) {
            if (this.value.length === 6) {
                document.getElementById('verificarForm').submit();
            }
        });
    }
});
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('registerForm');
    const inputs = form.querySelectorAll('input[required]');
    
    // Validação em tempo real
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        input.addEventListener('input', function() {
            clearFieldError(this);
        });
    });
    
    // Validação do CPF
    const cpfInput = document.getElementById('cpf_cliente');
    if (cpfInput) {
        cpfInput.addEventListener('input', function() {
            this.value = formatCPF(this.value);
        });
    }
    
    // Validação do CEP
    const cepInput = document.getElementById('cep_usuario');
    if (cepInput) {
        cepInput.addEventListener('input', function() {
            this.value = formatCEP(this.value);
        });
        
        cepInput.addEventListener('blur', function() {
            if (this.value.length === 9) {
                buscarCEP(this.value);
            }
        });
    }
    
    // Validação do telefone - apenas números
    const telefoneInput = document.getElementById('celular_usuario');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', function() {
            // Remove tudo que não é número e limita a 11 dígitos
            this.value = this.value.replace(/\D/g, '').substring(0, 11);
        });
    }
    
    // Validação do formulário antes do envio
    form.addEventListener('submit', function(e) {
        let isValid = true;
        
        inputs.forEach(input => {
            if (!validateField(input)) {
                isValid = false;
            }
        });
        
        if (!isValid) {
            e.preventDefault();
            showError('Por favor, corrija os erros antes de continuar.');
        }
    });
    
    function validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let message = '';
        
        // Validação básica de campo obrigatório
        if (field.hasAttribute('required') && !value) {
            message = 'Este campo é obrigatório';
            isValid = false;
        }
        
        // Validações específicas por tipo de campo
        switch (field.name) {
            case 'nome_usu':
                if (value && (value.length < 3 || value.length > 45)) {
                    message = 'Nome deve ter entre 3 e 45 caracteres';
                    isValid = false;
                }
                break;
                
            case 'nomeusu_usu':
                if (value && (value.length < 8 || value.length > 45)) {
                    message = 'Nome de usuário deve ter entre 8 e 45 caracteres';
                    isValid = false;
                }
                break;
                
            case 'email_usu':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (value && !emailRegex.test(value)) {
                    message = 'Digite um e-mail válido';
                    isValid = false;
                }
                break;
                
            case 'senha_usu':
                if (value && value.length < 8) {
                    message = 'Senha deve ter no mínimo 8 caracteres';
                    isValid = false;
                }
                break;
                
            case 'cpf_cliente':
                if (value && !validarCPF(value)) {
                    message = 'CPF inválido';
                    isValid = false;
                }
                break;
                
            case 'celular_usuario':
                if (value && (value.length !== 11 || !/^\d{11}$/.test(value))) {
                    message = 'Telefone deve ter exatamente 11 dígitos numéricos';
                    isValid = false;
                }
                break;
                
            case 'cep_usuario':
                if (value && !/^\d{5}-?\d{3}$/.test(value)) {
                    message = 'CEP inválido';
                    isValid = false;
                }
                break;
        }
        
        if (!isValid) {
            showFieldError(field, message);
        } else {
            clearFieldError(field);
        }
        
        return isValid;
    }
    
    function showFieldError(field, message) {
        clearFieldError(field);
        field.style.borderColor = '#dc3545';
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.style.color = '#dc3545';
        errorDiv.style.fontSize = '14px';
        errorDiv.style.marginTop = '5px';
        errorDiv.textContent = message;
        
        field.parentNode.appendChild(errorDiv);
    }
    
    function clearFieldError(field) {
        field.style.borderColor = '#ddd';
        const errorDiv = field.parentNode.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    }
    
    function showError(message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-error';
        alertDiv.textContent = message;
        
        form.insertBefore(alertDiv, form.firstChild);
        
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
    
    function formatCPF(value) {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    }
    
    function formatCEP(value) {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{3})\d+?$/, '$1');
    }
    

    
    function validarCPF(cpf) {
        cpf = cpf.replace(/\D/g, '');
        
        if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
            return false;
        }
        
        let soma = 0;
        for (let i = 0; i < 9; i++) {
            soma += parseInt(cpf.charAt(i)) * (10 - i);
        }
        let resto = 11 - (soma % 11);
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpf.charAt(9))) return false;
        
        soma = 0;
        for (let i = 0; i < 10; i++) {
            soma += parseInt(cpf.charAt(i)) * (11 - i);
        }
        resto = 11 - (soma % 11);
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpf.charAt(10))) return false;
        
        return true;
    }
    
    function buscarCEP(cep) {
        cep = cep.replace(/\D/g, '');
        
        if (cep.length === 8) {
            fetch(`https://viacep.com.br/ws/${cep}/json/`)
                .then(response => response.json())
                .then(data => {
                    if (!data.erro) {
                        document.getElementById('logradouro_usuario').value = data.logradouro || '';
                        document.getElementById('bairro_usuario').value = data.bairro || '';
                        document.getElementById('cidade_usuario').value = data.localidade || '';
                        document.getElementById('uf_usuario').value = data.uf || '';
                    }
                })
                .catch(error => {
                    console.log('Erro ao buscar CEP:', error);
                });
        }
    }
});
// Validação e funcionalidades da página Esqueceu Senha
document.addEventListener('DOMContentLoaded', function() {
    
    // Validação de e-mail
    const emailInput = document.getElementById('email_usu');
    if (emailInput) {
        emailInput.addEventListener('blur', validarEmail);
    }

    // Validação de código
    const codigoInput = document.getElementById('codigo');
    if (codigoInput) {
        codigoInput.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g, '').substring(0, 6);
        });
    }

    // Validação de senhas
    const novaSenhaInput = document.getElementById('nova_senha');
    const confirmarSenhaInput = document.getElementById('confirmar_senha');
    
    if (novaSenhaInput) {
        novaSenhaInput.addEventListener('blur', validarSenha);
    }
    
    if (confirmarSenhaInput) {
        confirmarSenhaInput.addEventListener('blur', validarConfirmacaoSenha);
    }

    // Validação do formulário antes do envio
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', validarFormulario);
    });
});

function validarEmail() {
    const email = this.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
        mostrarErro(this, 'E-mail inválido');
        return false;
    }
    
    removerErro(this);
    return true;
}

function validarSenha() {
    const senha = this.value;
    const senhaRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    
    if (!senhaRegex.test(senha)) {
        mostrarErro(this, 'Senha deve ter 8+ caracteres, maiúscula, minúscula, número e símbolo');
        return false;
    }
    
    removerErro(this);
    return true;
}

function validarConfirmacaoSenha() {
    const novaSenha = document.getElementById('nova_senha').value;
    const confirmacao = this.value;
    
    if (novaSenha !== confirmacao) {
        mostrarErro(this, 'Senhas não coincidem');
        return false;
    }
    
    removerErro(this);
    return true;
}

function validarFormulario(e) {
    const form = e.target;
    let valido = true;
    
    // Validar campos específicos baseado no formulário
    const emailInput = form.querySelector('#email_usu');
    const codigoInput = form.querySelector('#codigo');
    const novaSenhaInput = form.querySelector('#nova_senha');
    const confirmarSenhaInput = form.querySelector('#confirmar_senha');
    
    if (emailInput && !validarEmail.call(emailInput)) {
        valido = false;
    }
    
    if (codigoInput && codigoInput.value.length !== 6) {
        mostrarErro(codigoInput, 'Código deve ter 6 dígitos');
        valido = false;
    }
    
    if (novaSenhaInput && !validarSenha.call(novaSenhaInput)) {
        valido = false;
    }
    
    if (confirmarSenhaInput && !validarConfirmacaoSenha.call(confirmarSenhaInput)) {
        valido = false;
    }
    
    if (!valido) {
        e.preventDefault();
    }
}

function mostrarErro(input, mensagem) {
    input.classList.add('erro');
    
    let erroExistente = input.parentNode.querySelector('.erro-msg');
    if (!erroExistente) {
        const erroSpan = document.createElement('span');
        erroSpan.className = 'erro-msg';
        erroSpan.textContent = mensagem;
        input.parentNode.appendChild(erroSpan);
    } else {
        erroExistente.textContent = mensagem;
    }
}

function removerErro(input) {
    input.classList.remove('erro');
    const erroMsg = input.parentNode.querySelector('.erro-msg');
    if (erroMsg) {
        erroMsg.remove();
    }
}
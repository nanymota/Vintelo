// ========== VALIDAÇÃO DO FORMULÁRIO DE CADASTRO ==========
document.addEventListener('DOMContentLoaded', function() {
    setupFormValidation();
});

function setupFormValidation() {
    // CEP
    const cepInput = document.getElementById('cep_usuario');
    if (cepInput) {
        cepInput.addEventListener('input', e => e.target.value = formatCEP(e.target.value));
        cepInput.addEventListener('blur', e => {
            const cep = e.target.value.replace(/\D/g, '');
            if (cep.length === 8) buscarCEP(cep);
        });
    }
    
    // CPF
    const cpfInput = document.getElementById('cpf_cliente');
    if (cpfInput) {
        cpfInput.addEventListener('input', e => e.target.value = formatCPF(e.target.value));
        cpfInput.addEventListener('blur', e => {
            if (e.target.value.trim()) validarCPFCampo(e.target);
        });
    }
    
    // Nome Completo
    const nomeInput = document.getElementById('nome_completo');
    if (nomeInput) {
        nomeInput.addEventListener('blur', e => validarNomeCompleto(e.target));
        nomeInput.addEventListener('input', e => {
            let valor = e.target.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
            e.target.value = formatarNomeInteligente(valor);
        });
    }
    
    // Nome de Usuário
    const nomeUsuInput = document.getElementById('nome_usuario');
    if (nomeUsuInput) {
        nomeUsuInput.addEventListener('blur', e => validarNomeUsuario(e.target));
    }
    
    // Email
    const emailInput = document.getElementById('email_usu');
    if (emailInput) {
        emailInput.addEventListener('blur', e => validarEmail(e.target));
    }
    
    // Senha
    const senhaInput = document.getElementById('senha_usu');
    if (senhaInput) {
        senhaInput.addEventListener('blur', e => validarSenha(e.target));
        senhaInput.addEventListener('input', e => mostrarForcaSenha(e.target));
    }
    
    // Data de Nascimento
    const dataInput = document.getElementById('data_nasc');
    if (dataInput) {
        dataInput.addEventListener('blur', e => validarDataNascimento(e.target));
    }
    
    // Telefone
    const telefoneInput = document.getElementById('celular_usuario');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', e => {
            e.target.value = e.target.value.replace(/\D/g, '').substring(0, 11);
        });
        telefoneInput.addEventListener('blur', e => validarTelefone(e.target));
    }
}

function goBack() {
    window.history.back();
}
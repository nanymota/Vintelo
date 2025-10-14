function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(tabName + '-form').classList.add('active');
    event.target.classList.add('active');
}

function formatCEP(value) {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{3})\d+?$/, '$1');
}

function buscarCEP(cep) {
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

function goBack() {
    window.history.back();
}

document.addEventListener('DOMContentLoaded', function() {
    const cepInput = document.getElementById('cep_usuario');
    if (cepInput) {
        cepInput.addEventListener('input', function() {
            this.value = formatCEP(this.value);
        });
        
        cepInput.addEventListener('blur', function() {
            const cep = this.value.replace(/\D/g, '');
            if (cep.length === 8) {
                buscarCEP(cep);
            }
        });
    }
    
    const telefoneInput = document.getElementById('celular_usuario');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g, '').substring(0, 11);
        });
    }
    
    // Validação em tempo real do nome de usuário
    const userInput = document.getElementById('user_usuario');
    if (userInput) {
        userInput.addEventListener('input', function() {
            const value = this.value;
            const isValid = /^[a-zA-Z0-9_]*$/.test(value) && value.length <= 20;
            
            if (!isValid && value.length > 0) {
                this.setCustomValidity('Nome de usuário deve conter apenas letras, números e _');
            } else if (value.length < 3 && value.length > 0) {
                this.setCustomValidity('Nome de usuário deve ter pelo menos 3 caracteres');
            } else {
                this.setCustomValidity('');
            }
        });
    }
    
    // Validação do formulário de login
    const loginForm = document.querySelector('form[action="/login-admin"]');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            const email = document.getElementById('email_login').value;
            const senha = document.getElementById('senha_login').value;
            
            if (!email || !senha) {
                e.preventDefault();
                alert('Email e senha são obrigatórios!');
                return;
            }
            
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                e.preventDefault();
                alert('Digite um email válido!');
                return;
            }
        });
    }
    
    const cadastroForm = document.querySelector('form[action="/cadastroadm"]');
    if (cadastroForm) {
        cadastroForm.addEventListener('submit', async function(e) {
            const userUsuario = document.getElementById('user_usuario').value;
            const senha = document.getElementById('senha_usuario').value;
            const confirmarSenha = document.getElementById('confirmar_senha').value;
            
            // Validar nome de usuário
            if (userUsuario.length < 3 || userUsuario.length > 20) {
                e.preventDefault();
                alert('Nome de usuário deve ter entre 3 e 20 caracteres!');
                return;
            }
            
            if (!/^[a-zA-Z0-9_]+$/.test(userUsuario)) {
                e.preventDefault();
                alert('Nome de usuário deve conter apenas letras, números e _');
                return;
            }
            
            if (senha !== confirmarSenha) {
                e.preventDefault();
                alert('As senhas não coincidem!');
                return;
            }
            
            e.preventDefault();
            
            const formData = new FormData(this);
            
            try {
                const response = await fetch('/cadastroadm', {
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
                        alert('Administrador criado com sucesso!');
                        window.location.href = '/homeadm';
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
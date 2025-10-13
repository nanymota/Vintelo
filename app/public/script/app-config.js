// ========== CONFIGURAÇÃO GLOBAL DA APLICAÇÃO ==========
// Este arquivo processa dados do servidor disponibilizados via window object

// Configuração de autenticação
window.AppConfig = {
    isAuthenticated: window.isAuthenticated || false,
    userType: window.userType || null,
    
    // Processa notificações do servidor
    processServerData: function() {
        // Notificações
        if (window.dadosNotificacao) {
            this.showServerNotification(window.dadosNotificacao);
        }
        
        // Erros de validação
        if (window.listaErros && window.listaErros.length > 0) {
            this.showValidationErrors(window.listaErros);
        }
    },
    
    showServerNotification: function(dados) {
        if (typeof Notify !== 'undefined') {
            new Notify({
                status: dados.tipo === "success" ? "success" : 
                       dados.tipo === "error" ? "error" : "warning",
                title: dados.titulo || "",
                text: dados.mensagem,
                effect: 'slide',
                speed: 300,
                showIcon: true,
                showCloseButton: true,
                autoclose: true,
                autotimeout: 5000,
                position: 'right top'
            });
        }
    },
    
    showValidationErrors: function(erros) {
        if (typeof Notify !== 'undefined') {
            erros.forEach(function(erro) {
                new Notify({
                    status: 'error',
                    title: 'Erro de Validação',
                    text: erro.msg,
                    effect: 'slide',
                    speed: 300,
                    showIcon: true,
                    showCloseButton: true,
                    autoclose: true,
                    autotimeout: 5000,
                    position: 'right top'
                });
            });
        }
    }
};

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    window.AppConfig.processServerData();
});
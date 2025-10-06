 if (typeof dadosNotificacao !== 'undefined' && dadosNotificacao) { 
        new Notify({
            status: '<%= dadosNotificacao.tipo %>',
            title: '<%= dadosNotificacao.titulo %>',
            text: '<%= dadosNotificacao.mensagem %>',
            effect: 'fade',
            speed: 300,
            autoclose: true,
            autotimeout: 3000,
            position: 'right top'
        })
    } 
    
    if (typeof listaErros !== 'undefined' && listaErros && listaErros.errors) { 
        listaErros.errors.forEach(function(erro) { 
        new Notify({
            status: 'error',
            title: 'Erro',
            text: '<%= erro.msg %>',
            effect: 'fade',
            speed: 300,
            autoclose: true,
            autotimeout: 4000,
            position: 'right top'
        })
         }); 
    } 
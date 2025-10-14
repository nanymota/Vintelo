function processarPagamento() {
    const totalElement = document.querySelector('.total-line span:last-child') || 
                        document.querySelector('.summary-item.total-line span:last-child') ||
                        document.querySelector('.cart-item-info span');
    let valorTexto = totalElement ? totalElement.textContent : 'R$ 59,99';
    
    valorTexto = valorTexto.replace('R$', '').replace(',', '.').trim();
    const valorTotal = parseFloat(valorTexto) || 59.99;
    
    console.log('Valor capturado:', valorTexto, 'Valor final:', valorTotal);
    
    fetch('/processar-pagamento', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            valor: valorTotal,
            descricao: 'Compra Vintélo',
            metodo_pagamento: 'PIX'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.payment_url) {
            window.location.href = data.payment_url;
        } else {
            alert('Erro ao processar pagamento: ' + (data.error || 'Erro desconhecido'));
        }
    })
    .catch(error => {
        console.error('Erro na requisição:', error);
        alert('Erro ao processar pagamento. Verifique o console.');
    });
}

function selectPayment(element) {
    document.querySelectorAll('.payment-option .check-icon').forEach(icon => {
        icon.style.display = 'none';
    });
    document.querySelectorAll('.payment-option .error-icon').forEach(icon => {
        icon.style.display = 'block';
    });
    
    const checkIcon = element.querySelector('.check-icon');
    const errorIcon = element.querySelector('.error-icon');
    if (checkIcon) checkIcon.style.display = 'block';
    if (errorIcon) errorIcon.style.display = 'none';
}
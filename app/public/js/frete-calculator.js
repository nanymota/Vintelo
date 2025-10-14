async function calcularFrete() {
    const cepDestino = document.getElementById('cep_frete').value.replace(/\D/g, '');
    
    if (cepDestino.length !== 8) {
        alert('Digite um CEP válido');
        return;
    }

    const loadingDiv = document.getElementById('frete-loading');
    const resultDiv = document.getElementById('frete-result');
    
    loadingDiv.style.display = 'block';
    resultDiv.innerHTML = '';

    try {
        const response = await fetch('/api/calcular-frete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                cep_destino: cepDestino,
                produto_id: window.produtoId // ID do produto atual
            })
        });

        const data = await response.json();
        
        if (data.success) {
            mostrarOpcoesEntrega(data.opcoes);
        } else {
            resultDiv.innerHTML = '<p>Erro ao calcular frete</p>';
        }
    } catch (error) {
        resultDiv.innerHTML = '<p>Erro ao calcular frete</p>';
    } finally {
        loadingDiv.style.display = 'none';
    }
}

function mostrarOpcoesEntrega(opcoes) {
    const resultDiv = document.getElementById('frete-result');
    let html = '<h4>Opções de entrega:</h4>';
    
    opcoes.forEach((opcao, index) => {
        html += `
            <div class="opcao-frete" onclick="selecionarFrete('${opcao.name}', '${opcao.price}', '${opcao.delivery_time}')" data-selected="false">
                <span>${opcao.name}</span>
                <span>R$ ${opcao.price}</span>
                <span>${opcao.delivery_time} dias úteis</span>
                <span class="selecionar-btn">Selecionar</span>
            </div>
        `;
    });
    
    resultDiv.innerHTML = html;
}

let freteEscolhido = null;

function selecionarFrete(nome, preco, prazo) {
    document.querySelectorAll('.opcao-frete').forEach(opcao => {
        opcao.classList.remove('selecionado');
        opcao.setAttribute('data-selected', 'false');
        opcao.querySelector('.selecionar-btn').textContent = 'Selecionar';
    });
    
    event.target.closest('.opcao-frete').classList.add('selecionado');
    event.target.closest('.opcao-frete').setAttribute('data-selected', 'true');
    event.target.closest('.opcao-frete').querySelector('.selecionar-btn').textContent = 'Selecionado';
    
    window.freteEscolhido = {
        nome: nome,
        preco: parseFloat(preco),
        prazo: prazo
    };
    
    // Atualizar valores mobile
    const freteSpanMobile = document.getElementById('shipping-cost');
    const totalSpanMobile = document.getElementById('total');
    const subtotalMobile = document.getElementById('subtotal');
    
    if (freteSpanMobile) freteSpanMobile.textContent = `R$${preco}`;
    
    // Calcular novo total mobile
    if (subtotalMobile && totalSpanMobile) {
        const subtotal = parseFloat(subtotalMobile.textContent.replace('R$', '').replace(',', '.'));
        const novoTotal = subtotal + parseFloat(preco);
        totalSpanMobile.textContent = `R$${novoTotal.toFixed(2).replace('.', ',')}`;
        
        // Atualizar botão mobile
        const btnFinalizar = document.querySelector('.finalizar-compra');
        if (btnFinalizar && btnFinalizar.tagName === 'A') {
            const href = btnFinalizar.getAttribute('href');
            const baseUrl = href.split('?')[0];
            btnFinalizar.setAttribute('href', `${baseUrl}?total=${novoTotal.toFixed(2)}&frete=${preco}&frete_nome=${nome}`);
        }
    }
}

function formatCEPFrete(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length > 5) {
        value = value.replace(/^(\d{5})(\d)/, '$1-$2');
    }
    input.value = value;
}
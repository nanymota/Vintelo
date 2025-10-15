// Funções para gerenciar quantidade de produtos
function increaseQuantity(produtoId) {
  const quantityElement = document.getElementById('qty-' + produtoId);
  const currentQuantity = parseInt(quantityElement.textContent);
  const newQuantity = currentQuantity + 1;
  
  fetch('/atualizar-quantidade-sacola', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ produto_id: produtoId, quantidade: newQuantity })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      quantityElement.textContent = newQuantity;
      setTimeout(() => location.reload(), 500);
    }
  });
}

function decreaseQuantity(produtoId) {
  const quantityElement = document.getElementById('qty-' + produtoId);
  const currentQuantity = parseInt(quantityElement.textContent);
  
  if (currentQuantity > 1) {
    const newQuantity = currentQuantity - 1;
    
    fetch('/atualizar-quantidade-sacola', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ produto_id: produtoId, quantidade: newQuantity })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        quantityElement.textContent = newQuantity;
        setTimeout(() => location.reload(), 500);
      }
    });
  }
}

function removeItem(produtoId) {
  if (confirm('Deseja remover este item da sacola?')) {
    fetch('/remover-item-sacola', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ produto_id: produtoId })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        location.reload();
      }
    });
  }
}

// Funções de cálculo de frete
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cep_destino: cepDestino, produto_id: 1 })
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

function updateShipping(cost) {
  document.getElementById('shipping-cost').textContent = 'R$' + cost.toFixed(2).replace('.', ',');
  updateTotal();
}

function updateShippingDesktop(cost) {
  updateShipping(cost);
}

function updateTotal() {
  setTimeout(() => location.reload(), 1000);
}

// Funções para produtos sugeridos
function toggleFavorite(button) {
  const produtoId = button.dataset.produtoId;
  
  fetch('/favoritar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ produto_id: produtoId })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      const img = button.querySelector('img');
      img.src = data.favorited ? '/imagens/coraçao de fav.png' : '/imagens/coraçao de fav2.png';
    }
  });
}

function addToCartSuggestion(button) {
  const produtoId = button.dataset.produtoId;
  const originalText = button.textContent;
  
  button.textContent = 'Adicionando...';
  button.disabled = true;
  
  fetch('/adicionar-sacola', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ produto_id: produtoId })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      button.textContent = 'Adicionado!';
      button.style.backgroundColor = '#28a745';
      setTimeout(() => {
        button.textContent = originalText;
        button.style.backgroundColor = '';
        button.disabled = false;
      }, 2000);
    } else {
      button.textContent = 'Erro';
      button.style.backgroundColor = '#dc3545';
      setTimeout(() => {
        button.textContent = originalText;
        button.style.backgroundColor = '';
        button.disabled = false;
      }, 2000);
    }
  })
  .catch(error => {
    button.textContent = 'Erro';
    button.style.backgroundColor = '#dc3545';
    setTimeout(() => {
      button.textContent = originalText;
      button.style.backgroundColor = '';
      button.disabled = false;
    }, 2000);
  });
}

function goBack() {
  window.history.back();
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
  // Formatar CEP
  const cepInputs = document.querySelectorAll('#cep_frete, #cep_frete_desktop');
  cepInputs.forEach(input => {
    input.addEventListener('input', function(e) {
      formatCEPFrete(e.target);
    });
  });
  
  // Event listeners para botões de favorito
  document.querySelectorAll('.favorite').forEach(button => {
    button.addEventListener('click', function() {
      toggleFavorite(this);
    });
  });
  
  // Event listeners para botões de adicionar ao carrinho
  document.querySelectorAll('.cart, .adicionar-compra').forEach(button => {
    button.addEventListener('click', function() {
      if (this.dataset.produtoId) {
        addToCartSuggestion(this);
      }
    });
  });
});
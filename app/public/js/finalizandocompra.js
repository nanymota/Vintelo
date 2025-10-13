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
function calculateShipping() {
  const cep = document.getElementById('cep-mobile').value.replace(/\D/g, '');
  if (cep.length === 8) {
    document.getElementById('shipping-options-mobile').style.display = 'block';
  } else {
    alert('Digite um CEP válido com 8 dígitos!');
  }
}

function calculateShippingDesktop() {
  const cep = document.getElementById('cep-desktop').value.replace(/\D/g, '');
  if (cep.length === 8) {
    document.getElementById('shipping-options-desktop').style.display = 'block';
  } else {
    alert('Digite um CEP válido com 8 dígitos!');
  }
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
  const cepInputs = document.querySelectorAll('#cep-mobile, #cep-desktop');
  cepInputs.forEach(input => {
    input.addEventListener('input', function(e) {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length > 5) {
        value = value.substring(0, 5) + '-' + value.substring(5, 8);
      }
      e.target.value = value;
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
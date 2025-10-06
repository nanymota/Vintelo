function showSection(section) {
    const productGrid = document.querySelector('.product-grid');
    const gridTitle = document.querySelector('.grid-produtos h3');
    
    if (!productGrid || !gridTitle) return;
    
    productGrid.className = 'product-grid';

    if (section === 'brechos') {
        productGrid.className = 'brechos-grid';
    }
    
    const titles = {
        novidades: 'Novidades',
        descontos: 'Descontos',
        brechos: 'Brechós para Seguir',
        plussize: 'Plus Size',
        reformadas: 'Peças Reformadas'
    };
    
    gridTitle.textContent = titles[section] || section.charAt(0).toUpperCase() + section.slice(1);
    
    const content = {
        novidades: `
            <article class="product-card">
                <a href="/produto2"><img src="imagens/vestido branco.png" alt="Vestido branco com decote"></a>
                <h2>Vestido branco com decote</h2>
                <p class="price">R$49,99</p>
                <p class="Descrição">ou em 2x de R$25,00</p>
                <button class="favorite"><img src="imagens/coraçao de fav2.png"></button>
                <button class="cart"><img src="imagens/sacola.png" class="img-sacola"></button>
            </article>
            <article class="product-card">
                <a href="/produto3"><img src="imagens/vestido roxo.png" alt="Vestido roxo de manga com decote"></a>
                <h2>Vestido roxo de manga com decote</h2>
                <p class="price">R$39,99</p>
                <p class="Descrição">ou em 2x de R$20,00</p>
                <button class="favorite"><img src="imagens/coraçao de fav2.png"></button>
                <button class="cart"><img src="imagens/sacola.png" class="img-sacola"></button>
            </article>
            <article class="product-card">
                <a href="/produto4"><img src="imagens/conjunto de blusa rosa.png" alt="Conjunto rosa de lã"></a>
                <h2>Conjunto rosa de lã</h2>
                <p class="price">R$29,99</p>
                <p class="Descrição">ou em 2x de R$15,00</p>
                <button class="favorite"><img src="imagens/coraçao de fav2.png"></button>
                <button class="cart"><img src="imagens/sacola.png" class="img-sacola"></button>
            </article>
            <article class="product-card">
                <a href="/produto1"><img src="imagens/regata branca.png" alt="Regata branca"></a>
                <h2>Regata branca</h2>
                <p class="price">R$19,99</p>
                <p class="Descrição">ou em 2x de R$10,00</p>
                <button class="favorite"><img src="imagens/coraçao de fav2.png"></button>
                <button class="cart"><img src="imagens/sacola.png" class="img-sacola"></button>
            </article>
            <article class="product-card">
                <img src="imagens/cropped flor.png" alt="cropped flor">
                <h2>Cropped Floral</h2>
                <p class="price">R$49,99</p>
                <p class="Descrição">ou em 2x de R$25,00</p>
                <button class="favorite"><img src="imagens/coraçao de fav2.png"></button>
                <button class="cart"><img src="imagens/sacola.png" class="img-sacola"></button>
            </article>
            <article class="product-card">
                <img src="imagens/vestido branco2.png" alt="vestido branco2">
                <h2>Vestido Branco com decote</h2>
                <p class="price">R$39,99</p>
                <p class="Descrição">ou em 2x de R$20,00</p>
                <button class="favorite"><img src="imagens/coraçao de fav2.png"></button>
                <button class="cart"><img src="imagens/sacola.png" class="img-sacola"></button>
            </article>
            <article class="product-card">
                <img src="imagens/cropped cinza.png" alt="Cropped Cinza">
                <h2>Cropped Cinza</h2>
                <p class="price">R$35,00</p>
                <p class="Descrição">ou em 2x de R$17,50</p>
                <button class="favorite"><img src="imagens/coraçao de fav2.png"></button>
                <button class="cart"><img src="imagens/sacola.png" class="img-sacola"></button>
            </article>
            <article class="product-card">
                <img src="imagens/saia rosa brilhante.png" alt="Saia Rosa">
                <h2>Saia Rosa Brilhante</h2>
                <p class="price">R$32,00</p>
                <p class="Descrição">ou em 2x de R$16,00</p>
                <button class="favorite"><img src="imagens/coraçao de fav2.png"></button>
                <button class="cart"><img src="imagens/sacola.png" class="img-sacola"></button>
            </article>
            <article class="product-card">
                <img src="imagens/saia preta brilhante.png" alt="Saia Preta">
                <h2>Saia Preta Brilhante</h2>
                <p class="price">R$38,00</p>
                <p class="Descrição">ou em 2x de R$19,00</p>
                <button class="favorite"><img src="imagens/coraçao de fav2.png"></button>
                <button class="cart"><img src="imagens/sacola.png" class="img-sacola"></button>
            </article>
            <article class="product-card">
                <img src="imagens/regatinha branca.png" alt="Regatinha">
                <h2>Regatinha Branca</h2>
                <p class="price">R$25,00</p>
                <p class="Descrição">ou em 2x de R$12,50</p>
                <button class="favorite"><img src="imagens/coraçao de fav2.png"></button>
                <button class="cart"><img src="imagens/sacola.png" class="img-sacola"></button>
            </article>
            <article class="product-card">
                <img src="imagens/cropped verde.png" alt="Cropped Verde">
                <h2>Cropped Verde</h2>
                <p class="price">R$28,00</p>
                <p class="Descrição">ou em 2x de R$14,00</p>
                <button class="favorite"><img src="imagens/coraçao de fav2.png"></button>
                <button class="cart"><img src="imagens/sacola.png" class="img-sacola"></button>
            </article>
            <article class="product-card">
                <a href="/produto1"><img src="imagens/vestido roxo2.png" alt="vestido roxo2"></a>
                <h2>Vestido Roxo Com Torção</h2>
                <p class="price">R$45,00</p>
                <p class="Descrição">ou em 2x de R$22,50</p>
                <button class="favorite"><img src="imagens/coraçao de fav2.png"></button>
                <button class="cart"><img src="imagens/sacola.png" class="img-sacola"></button>
            </article>
        `,
        descontos: `
            <article class="product-card">
                <span class="discount-tag">14% OFF</span>
                <a href="/produto2"><img src="imagens/vestido marrom.png" alt="Vestido marrom com decote"></a>
                <h2>Vestido Marrom Com Decote</h2>
                <p class="price">R$49,99</p>
                <button class="favorite"><img src="imagens/coraçao de fav2.png"></button>
                <button class="cart"><img src="imagens/sacola.png" class="img-sacola"></button>
            </article>
            <article class="product-card">
                <span class="discount-tag">14% OFF</span>
                <a href="/produto3"><img src="imagens/vestido com botoes.png" alt="Vestido com botao"></a>
                <h2>Vestido Longo Com Botoes</h2>
                <p class="price">R$39,99</p>
                <button class="favorite"><img src="imagens/coraçao de fav2.png"></button>
                <button class="cart"><img src="imagens/sacola.png" class="img-sacola"></button>
            </article>
            <article class="product-card">
                <span class="discount-tag">14% OFF</span>
                <a href="/produto4"><img src="imagens/saia cargo.png" alt="Saia cargo"></a>
                <h2>Saia Cargo Jeans</h2>
                <p class="price">R$29,99</p>
                <button class="favorite"><img src="imagens/coraçao de fav2.png"></button>
                <button class="cart"><img src="imagens/sacola.png" class="img-sacola"></button>
            </article>
            <article class="product-card">
                <span class="discount-tag">14% OFF</span>
                <a href="/produto1"><img src="imagens/saia longa.png" alt="saia longa"></a>
                <h2>Saia Longa Jeans</h2>
                <p class="price">R$19,99</p>
                <button class="favorite"><img src="imagens/coraçao de fav2.png"></button>
                <button class="cart"><img src="imagens/sacola.png" class="img-sacola"></button>
            </article>
            <article class="product-card">
                <span class="discount-tag">14% OFF</span>
                <a href="/produto2"><img src="imagens/vestido branco.png" alt="Vestido branco com decote"></a>
                <h2>Vestido branco com decote</h2>
                <p class="price">R$49,99</p>
                <button class="favorite"><img src="imagens/coraçao de fav2.png"></button>
                <button class="cart"><img src="imagens/sacola.png" class="img-sacola"></button>
            </article>
            <article class="product-card">
                <span class="discount-tag">14% OFF</span>
                <a href="/produto3"><img src="imagens/vestido roxo.png" alt="Vestido roxo de manga com decote"></a>
                <h2>Vestido roxo de manga com decote</h2>
                <p class="price">R$39,99</p>
                <button class="favorite"><img src="imagens/coraçao de fav2.png"></button>
                <button class="cart"><img src="imagens/sacola.png" class="img-sacola"></button>
            </article>
            <article class="product-card">
                <span class="discount-tag">14% OFF</span>
                <a href="/produto4"><img src="imagens/conjunto de blusa rosa.png" alt="Conjunto rosa de lã"></a>
                <h2>Conjunto rosa de lã</h2>
                <p class="price">R$29,99</p>
                <button class="favorite"><img src="imagens/coraçao de fav2.png"></button>
                <button class="cart"><img src="imagens/sacola.png" class="img-sacola"></button>
            </article>
            <article class="product-card">
                <span class="discount-tag">14% OFF</span>
                <a href="/produto1"><img src="imagens/regata branca.png" alt="Regata branca"></a>
                <h2>Regata branca</h2>
                <p class="price">R$19,99</p>
                <button class="favorite"><img src="imagens/coraçao de fav2.png"></button>
                <button class="cart"><img src="imagens/sacola.png" class="img-sacola"></button>
            </article>
        `,
        brechos: `
            <li class="profile-item">
                <img src="imagens/brecho1.png" alt="Mayte" class="profile-image">
                <section class="profile-info">
                    <strong>Mayte</strong>
                    <span class="rating">4.8 <small>avaliação</small></span>
                    <section class="stars">★★★★★</section>
                </section>
                <a href="/perfil1"><button class="follow-button">Seguir</button></a>
            </li>
            <li class="profile-item">
                <img src="imagens/brecho2.png" alt="Karine" class="profile-image">
                <section class="profile-info">
                    <strong>Karine</strong>
                    <span class="rating">4.3 <small>avaliação</small></span>
                    <section class="stars">★★★★☆</section>
                </section>
                <a href="/perfil2"><button class="follow-button">Seguir</button></a>
            </li>
            <li class="profile-item">
                <img src="imagens/brecho1.png" alt="Vintage Style" class="profile-image">
                <section class="profile-info">
                    <strong>Vintage Style</strong>
                    <span class="rating">4.6 <small>avaliação</small></span>
                    <section class="stars">★★★★★</section>
                </section>
                <a href="/perfil1"><button class="follow-button">Seguir</button></a>
            </li>
            <li class="profile-item">
                <img src="imagens/brecho2.png" alt="Eco Fashion" class="profile-image">
                <section class="profile-info">
                    <strong>Eco Fashion</strong>
                    <span class="rating">4.4 <small>avaliação</small></span>
                    <section class="stars">★★★★☆</section>
                </section>
                <a href="/perfil2"><button class="follow-button">Seguir</button></a>
            </li>
        `,
        plussize: `
            <article class="product-card">
                <a href="/produto2"><img src="imagens/conjunto bege.png" alt="conjunto bege"></a>
                <h2>Conjunto Bege</h2>
                <p class="price">R$49,99</p>
                <button class="favorite"><img src="imagens/coraçao de fav2.png"></button>
                <button class="cart"><img src="imagens/sacola.png" class="img-sacola"></button>
            </article>
            <article class="product-card">
                <a href="/produto3"><img src="imagens/conjunto marrom.png" alt="conjunto marrom"></a>
                <h2>Conjunto Marrom</h2>
                <p class="price">R$39,99</p>
                <button class="favorite"><img src="imagens/coraçao de fav2.png"></button>
                <button class="cart"><img src="imagens/sacola.png" class="img-sacola"></button>
            </article>
            <article class="product-card">
                <a href="/produto4"><img src="imagens/calça preta.png" alt="calça preta"></a>
                <h2>Calça Alfaiataria Preta</h2>
                <p class="price">R$29,99</p>
                <button class="favorite"><img src="imagens/coraçao de fav2.png"></button>
                <button class="cart"><img src="imagens/sacola.png" class="img-sacola"></button>
            </article>
            <article class="product-card">
                <a href="/produto1"><img src="imagens/saia longa bege.png" alt="saia longa bege"></a>
                <h2>Saia Longa Bege</h2>
                <p class="price">R$19,99</p>
                <button class="favorite"><img src="imagens/coraçao de fav2.png"></button>
                <button class="cart"><img src="imagens/sacola.png" class="img-sacola"></button>
            </article>
            <article class="product-card">
                <img src="imagens/saia longa preta.png" alt="saia longa preta">
                <h2>Saia Longa Preta</h2>
                <p class="price">R$49,99</p>
                <button class="favorite"><img src="imagens/coraçao de fav2.png"></button>
                <button class="cart"><img src="imagens/sacola.png" class="img-sacola"></button>
            </article>
            <article class="product-card">
                <img src="imagens/vestido longo bege.png" alt="vestido longo bege">
                <h2>Vestido Longo Bege</h2>
                <p class="price">R$39,99</p>
                <button class="favorite"><img src="imagens/coraçao de fav2.png"></button>
                <button class="cart"><img src="imagens/sacola.png" class="img-sacola"></button>
            </article>
            <article class="product-card">
                <img src="imagens/vestido longo roxo.png" alt="vestido longo roxo">
                <h2>Vestido Longo Roxo</h2>
                <p class="price">R$29,99</p>
                <button class="favorite"><img src="imagens/coraçao de fav2.png"></button>
                <button class="cart"><img src="imagens/sacola.png" class="img-sacola"></button>
            </article>
            <article class="product-card">
                <a href="/produto1"><img src="imagens/vestido longo.png" alt="vestido longo"></a>
                <h2>Vestido Com Torção</h2>
                <p class="price">R$19,99</p>
                <button class="favorite"><img src="imagens/coraçao de fav2.png"></button>
                <button class="cart"><img src="imagens/sacola.png" class="img-sacola"></button>
            </article>
        `,
        reformadas: `
            <article class="product-card">
                <img src="imagens/vestido branco.png" alt="Vestido Reformado">
                <h2>Vestido Reformado</h2>
                <p class="price">R$45,00</p>
                <p class="Descrição">Peça única reformada</p>
                <button class="favorite"><img src="imagens/coraçao de fav2.png"></button>
                <button class="cart"><img src="imagens/sacola.png" class="img-sacola"></button>
            </article>
            <article class="product-card">
                <img src="imagens/cropped flor.png" alt="Cropped Reformado">
                <h2>Cropped Reformado</h2>
                <p class="price">R$38,00</p>
                <p class="Descrição">Peça única reformada</p>
                <button class="favorite"><img src="imagens/coraçao de fav2.png"></button>
                <button class="cart"><img src="imagens/sacola.png" class="img-sacola"></button>
            </article>
            <article class="product-card">
                <img src="imagens/saia rosa brilhante.png" alt="Saia Reformada">
                <h2>Saia Reformada</h2>
                <p class="price">R$42,00</p>
                <p class="Descrição">Peça única reformada</p>
                <button class="favorite"><img src="imagens/coraçao de fav2.png"></button>
                <button class="cart"><img src="imagens/sacola.png" class="img-sacola"></button>
            </article>
            <article class="product-card">
                <img src="imagens/vestido roxo2.png" alt="Vestido Reformado">
                <h2>Vestido Reformado</h2>
                <p class="price">R$50,00</p>
                <p class="Descrição">Peça única reformada</p>
                <button class="favorite"><img src="imagens/coraçao de fav2.png"></button>
                <button class="cart"><img src="imagens/sacola.png" class="img-sacola"></button>
            </article>
        `
    };
    
    productGrid.style.opacity = '0.5';
    
    setTimeout(() => {
        productGrid.innerHTML = content[section] || content.novidades;
        productGrid.style.opacity = '1';
        
        productGrid.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }, 200);
    
    const categoryLinks = document.querySelectorAll('.category-nav ul li a');
    categoryLinks.forEach(link => {
        link.classList.remove('active');
        if (link.textContent.toLowerCase().includes(section.toLowerCase())) {
            link.classList.add('active');
        }
    });
}
function notify(titulo, texto, tipo, posicao,duracao=3000) {
    new Notify({
        status: tipo,
        title: titulo,
        text:texto.replace(/&lt;/g,"<").replace(/&gt;/g,">") ,
        effect: 'fade',
        speed: 500,
        showIcon: true,
        showCloseButton: true,
        autoclose: true,
        autotimeout: duracao,
        gap: 20,
        distance: 20,
        type: 1,
        position:posicao
    })
}
 
// barra de pesquisa //
document.addEventListener("DOMContentLoaded", () => {
  const searchIcon = document.querySelector(".search-icon");
  const searchInput = document.querySelector(".search-form input");
 
  if (searchIcon && searchInput) {
    searchIcon.addEventListener("click", () => {
      searchInput.classList.toggle("ativo");
      searchInput.focus();
    });
  }
});
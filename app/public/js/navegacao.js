// Navegação Global - Sistema de Volta para Mobile
function goBack() {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = '/';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const backButtons = document.querySelectorAll('.back-arrow, .btn-back, [data-back]');
    backButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            goBack();
        });
    });
});
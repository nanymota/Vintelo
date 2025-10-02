function toggleTracking(button) {
    const orderCard = button.closest('.order-card');
    const trackingDetails = orderCard.querySelector('.tracking-details');
    
    if (trackingDetails.style.display === 'none' || trackingDetails.style.display === '') {
        trackingDetails.style.display = 'block';
        button.textContent = 'Ocultar Rastreamento';
        
        trackingDetails.style.opacity = '0';
        trackingDetails.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            trackingDetails.style.transition = 'all 0.3s ease';
            trackingDetails.style.opacity = '1';
            trackingDetails.style.transform = 'translateY(0)';
        }, 10);
        
    } else {
        trackingDetails.style.display = 'none';
        button.textContent = button.textContent.includes('Rastrear') ? 'Rastrear Pedido' : 'Ver Rastreamento';
    }
}

function toggleOrderDetails(button) {
    const orderCard = button.closest('.order-card');
    const orderDetails = orderCard.querySelector('.order-details');
    
    if (orderDetails.style.display === 'none' || orderDetails.style.display === '') {
        orderDetails.style.display = 'block';
        button.textContent = 'Ocultar Detalhes';
        
        orderDetails.style.opacity = '0';
        orderDetails.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            orderDetails.style.transition = 'all 0.3s ease';
            orderDetails.style.opacity = '1';
            orderDetails.style.transform = 'translateY(0)';
        }, 10);
        
    } else {
        orderDetails.style.display = 'none';
        button.textContent = 'Ver Detalhes';
    }
}

function addHoverEffects() {
    if (window.innerWidth >= 992) {
        const cards = document.querySelectorAll('.order-card');
        
        cards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-3px)';
                this.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    addHoverEffects();

    window.addEventListener('resize', addHoverEffects);

    simulateRealTimeTracking();

    const buttons = document.querySelectorAll('.track-btn, .details-btn');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            this.style.opacity = '0.7';
            setTimeout(() => {
                this.style.opacity = '1';
            }, 300);
        });
    });
});

function simulateRealTimeTracking() {
    const trackingSteps = document.querySelectorAll('.tracking-step');
    
    trackingSteps.forEach((step, index) => {
        if (step.classList.contains('active')) {
            setTimeout(() => {
                step.classList.remove('active');
                step.classList.add('completed');
                
                const nextStep = step.nextElementSibling;
                if (nextStep && nextStep.classList.contains('tracking-step')) {
                    nextStep.classList.add('active');
                }
            }, 5000);
        }
    });
}

function fetchOrderDetails(orderNumber) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                orderNumber: orderNumber,
                status: 'Em trânsito',
                estimatedDelivery: 'Hoje às 21h',
                carrier: 'Correios',
                trackingCode: 'BR123456789BR'
            });
        }, 1000);
    });
}
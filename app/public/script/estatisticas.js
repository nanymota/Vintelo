const chartData = {
    vendas: [
        { categoria: 'Vestidos', valor: 32, receita: 'R$ 4.980' },
        { categoria: 'Blusas', valor: 24, receita: 'R$ 3.735' },
        { categoria: 'Saias', valor: 18, receita: 'R$ 2.490' },
        { categoria: 'Calças', valor: 14, receita: 'R$ 1.245' },
        { categoria: 'Outros', valor: 8, receita: 'R$ 498' }
    ]
};

document.addEventListener('DOMContentLoaded', function() {
    const bars = document.querySelectorAll('.bar');
    const pieChart = document.querySelector('.pie-chart');
    const legendItems = document.querySelectorAll('.legend-item');
    const statsCards = document.querySelectorAll('.stats-card');

    bars.forEach((bar, index) => {
        const data = chartData.vendas[index];
        
        bar.addEventListener('mouseenter', function() {
            showTooltip(this, `${data.categoria}: ${data.valor} vendas<br>${data.receita}`);
        });
        
        bar.addEventListener('mouseleave', function() {
            hideTooltip();
        });

        bar.addEventListener('click', function() {
            bars.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    legendItems.forEach((item, index) => {
        item.addEventListener('click', function() {
            legendItems.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            animatePieChart();
        });
    });

    statsCards.forEach((card) => {
        card.addEventListener('click', function() {
            const valueElement = this.querySelector('.stats-value');
            animateValue(valueElement);
        });
    });

    function showTooltip(element, content) {
        hideTooltip();
        const tooltip = document.createElement('div');
        tooltip.className = 'chart-tooltip';
        tooltip.innerHTML = content;
        tooltip.style.cssText = `
            position: absolute;
            background: #333;
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            z-index: 1000;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(tooltip);

        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';
        tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
        
        setTimeout(() => tooltip.style.opacity = '1', 10);
    }

    function hideTooltip() {
        const tooltip = document.querySelector('.chart-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    function animatePieChart() {
        if (pieChart) {
            pieChart.style.transform = 'scale(1.1) rotate(5deg)';
            setTimeout(() => {
                pieChart.style.transform = 'scale(1) rotate(0deg)';
            }, 300);
        }
    }

    function animateValue(element) {
        const originalText = element.textContent;
        const isPercentage = originalText.includes('%');
        const isCurrency = originalText.includes('R$');
        
        let startValue = 0;
        const endValue = parseFloat(originalText.replace(/[^\d.,]/g, '').replace(',', '.'));
        const duration = 1000;
        const increment = endValue / (duration / 16);

        const timer = setInterval(() => {
            startValue += increment;
            if (startValue >= endValue) {
                startValue = endValue;
                clearInterval(timer);
            }

            let displayValue = Math.floor(startValue);
            if (isCurrency) {
                displayValue = `R$ ${displayValue.toLocaleString('pt-BR')}`;
            } else if (isPercentage) {
                displayValue = `${(startValue / 1000).toFixed(1)}%`;
            }
            
            element.textContent = displayValue;
        }, 16);

        setTimeout(() => {
            element.textContent = originalText;
        }, duration + 500);
    }
});
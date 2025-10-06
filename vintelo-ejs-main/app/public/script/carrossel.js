 const container = document.querySelector('.carousel-container');
    const list = document.querySelector('.carousel-list');
    const itemWidth = list.scrollWidth / 2; 
    
    container.addEventListener('scroll', () => {
      if (container.scrollLeft >= itemWidth) {
        container.scrollLeft -= itemWidth; 
      } else if (container.scrollLeft <= 0) {
        container.scrollLeft += itemWidth; 
      }
    });


    

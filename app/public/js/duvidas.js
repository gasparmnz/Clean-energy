document.addEventListener('DOMContentLoaded', () => {

    const tabButtons = document.querySelectorAll('[role="tab"]');
    const tabPanels = document.querySelectorAll('[role="tabpanel"]');
  

    function switchTab(targetButton) {

      tabButtons.forEach(button => {
        button.setAttribute('aria-selected', 'false');
      });
  
 
      tabPanels.forEach(panel => {
        panel.classList.remove('active');
      });

      targetButton.setAttribute('aria-selected', 'true');

      const targetPanelId = targetButton.getAttribute('aria-controls');
      const targetPanel = document.getElementById(targetPanelId);
      
      if (targetPanel) {
        targetPanel.classList.add('active');
      }

      const category = targetButton.getAttribute('data-category');
      localStorage.setItem('activeTab', category);
    }

    tabButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab(button);
      });

      button.addEventListener('keydown', (e) => {
        let newIndex;
        const currentIndex = Array.from(tabButtons).indexOf(button);

        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          newIndex = currentIndex + 1;
          if (newIndex >= tabButtons.length) {
            newIndex = 0;
          }
          tabButtons[newIndex].focus();
          switchTab(tabButtons[newIndex]);
        }

        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          newIndex = currentIndex - 1;
          if (newIndex < 0) {
            newIndex = tabButtons.length - 1;
          }
          tabButtons[newIndex].focus();
          switchTab(tabButtons[newIndex]);
        }

        if (e.key === 'Home') {
          e.preventDefault();
          tabButtons[0].focus();
          switchTab(tabButtons[0]);
        }

        if (e.key === 'End') {
          e.preventDefault();
          const lastIndex = tabButtons.length - 1;
          tabButtons[lastIndex].focus();
          switchTab(tabButtons[lastIndex]);
        }
      });
    });

    const savedTab = localStorage.getItem('activeTab');
    if (savedTab) {
      const savedButton = document.querySelector(`[data-category="${savedTab}"]`);
      if (savedButton) {
        switchTab(savedButton);
      }
    }

    const searchForm = document.querySelector('.search-form');
    const searchInput = searchForm.querySelector('input[type="search"]');
  
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const searchTerm = searchInput.value.trim().toLowerCase();
      
      if (searchTerm) {

        console.log('Buscando por:', searchTerm);
        
        highlightSearchResults(searchTerm);
      }
    });
  

    function highlightSearchResults(searchTerm) {
      const allCards = document.querySelectorAll('.help-card');
      let foundResults = false;
  
      allCards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const description = card.querySelector('p').textContent.toLowerCase();
        
        if (title.includes(searchTerm) || description.includes(searchTerm)) {
          card.style.outline = '3px solid var(--primary-color)';
          card.style.outlineOffset = '2px';
          foundResults = true;
          

          setTimeout(() => {
            card.style.outline = '';
            card.style.outlineOffset = '';
          }, 3000);
        }
      });
  

      if (!foundResults) {
        alert(`Nenhum resultado encontrado para "${searchTerm}"`);
      }
    }
  

    searchInput.addEventListener('input', () => {
      const allCards = document.querySelectorAll('.help-card');
      allCards.forEach(card => {
        card.style.outline = '';
        card.style.outlineOffset = '';
      });
    });

    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };
  
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, observerOptions);

    const cards = document.querySelectorAll('.help-card');
    cards.forEach(card => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      observer.observe(card);
    });
  });

  function mostrarCaixa(tipo) {
    const button = document.querySelector(`[data-category="${tipo}"]`);
    if (button) {
      button.click();
    }
  }
  
  
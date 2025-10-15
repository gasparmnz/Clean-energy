// Sistema de tabs para navegação entre categorias
document.addEventListener('DOMContentLoaded', () => {
    // Seleciona todos os botões de tab
    const tabButtons = document.querySelectorAll('[role="tab"]');
    const tabPanels = document.querySelectorAll('[role="tabpanel"]');
  
    // Função para mudar de tab
    function switchTab(targetButton) {
      // Remove o estado ativo de todos os botões
      tabButtons.forEach(button => {
        button.setAttribute('aria-selected', 'false');
      });
  
      // Remove o estado ativo de todos os painéis
      tabPanels.forEach(panel => {
        panel.classList.remove('active');
      });
  
      // Ativa o botão clicado
      targetButton.setAttribute('aria-selected', 'true');
  
      // Ativa o painel correspondente
      const targetPanelId = targetButton.getAttribute('aria-controls');
      const targetPanel = document.getElementById(targetPanelId);
      
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
  
      // Armazena a tab ativa no localStorage para persistência
      const category = targetButton.getAttribute('data-category');
      localStorage.setItem('activeTab', category);
    }
  
    // Adiciona evento de clique em cada botão
    tabButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab(button);
      });
  
      // Adiciona suporte a navegação por teclado (acessibilidade)
      button.addEventListener('keydown', (e) => {
        let newIndex;
        const currentIndex = Array.from(tabButtons).indexOf(button);
  
        // Seta para direita ou para baixo
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          newIndex = currentIndex + 1;
          if (newIndex >= tabButtons.length) {
            newIndex = 0;
          }
          tabButtons[newIndex].focus();
          switchTab(tabButtons[newIndex]);
        }
  
        // Seta para esquerda ou para cima
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          newIndex = currentIndex - 1;
          if (newIndex < 0) {
            newIndex = tabButtons.length - 1;
          }
          tabButtons[newIndex].focus();
          switchTab(tabButtons[newIndex]);
        }
  
        // Home - vai para a primeira tab
        if (e.key === 'Home') {
          e.preventDefault();
          tabButtons[0].focus();
          switchTab(tabButtons[0]);
        }
  
        // End - vai para a última tab
        if (e.key === 'End') {
          e.preventDefault();
          const lastIndex = tabButtons.length - 1;
          tabButtons[lastIndex].focus();
          switchTab(tabButtons[lastIndex]);
        }
      });
    });
  
    // Restaura a tab ativa do localStorage (se existir)
    const savedTab = localStorage.getItem('activeTab');
    if (savedTab) {
      const savedButton = document.querySelector(`[data-category="${savedTab}"]`);
      if (savedButton) {
        switchTab(savedButton);
      }
    }
  
    // Funcionalidade de busca (opcional - pode ser expandida)
    const searchForm = document.querySelector('.search-form');
    const searchInput = searchForm.querySelector('input[type="search"]');
  
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const searchTerm = searchInput.value.trim().toLowerCase();
      
      if (searchTerm) {
        // Aqui você pode implementar a lógica de busca
        // Por exemplo, filtrar os cards ou redirecionar para uma página de resultados
        console.log('Buscando por:', searchTerm);
        
        // Exemplo: destacar cards que contêm o termo de busca
        highlightSearchResults(searchTerm);
      }
    });
  
    // Função para destacar resultados de busca
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
          
          // Remove o destaque após 3 segundos
          setTimeout(() => {
            card.style.outline = '';
            card.style.outlineOffset = '';
          }, 3000);
        }
      });
  
      // Feedback visual se não encontrar resultados
      if (!foundResults) {
        alert(`Nenhum resultado encontrado para "${searchTerm}"`);
      }
    }
  
    // Limpa o destaque quando o usuário começa a digitar novamente
    searchInput.addEventListener('input', () => {
      const allCards = document.querySelectorAll('.help-card');
      allCards.forEach(card => {
        card.style.outline = '';
        card.style.outlineOffset = '';
      });
    });
  
    // Adiciona animação suave ao rolar a página
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
  
    // Observa os cards para animação de entrada
    const cards = document.querySelectorAll('.help-card');
    cards.forEach(card => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      observer.observe(card);
    });
  });
  
  // Função legada para compatibilidade (caso seja chamada de outro lugar)
  function mostrarCaixa(tipo) {
    const button = document.querySelector(`[data-category="${tipo}"]`);
    if (button) {
      button.click();
    }
  }
  
  
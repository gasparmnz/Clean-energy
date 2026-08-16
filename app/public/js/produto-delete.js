document.addEventListener('DOMContentLoaded', function() {

  const botoesExcluir = document.querySelectorAll('.btn-excluir');
  
  botoesExcluir.forEach(botao => {
    botao.addEventListener('click', function(e) {
      e.preventDefault();
      

      const produtoCard = this.closest('.produto-card');
      if (!produtoCard) return;
      
      let produtoId = produtoCard.getAttribute('data-id');
      
      if (!produtoId) {
        const linkDetalhes = produtoCard.querySelector('a[href*="/item/"]');
        if (linkDetalhes) {
          const href = linkDetalhes.getAttribute('href');
          produtoId = href.split('/').pop();
        }
      }
      
      if (!produtoId) {
        alert('Erro: não foi possível identificar o produto');
        return;
      }
      
      // Confirmar exclusão
      if (confirm('Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.')) {
        excluirProduto(produtoCard, produtoId);
      }
    });
  });
});

function excluirProduto(cardElement, produtoId) {
  // Mostrar loading
  const botao = cardElement.querySelector('.btn-excluir');
  const textoBotao = botao.innerHTML;
  botao.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Deletando...';
  botao.disabled = true;
  
  // Fazer requisição DELETE
  fetch(`/produtos/${produtoId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      cardElement.style.transition = 'all 0.3s ease-out';
      cardElement.style.opacity = '0';
      cardElement.style.transform = 'scale(0.95)';
      

      setTimeout(() => {
        cardElement.remove();
        

        const container = cardElement.closest('.produtos-grid') || cardElement.closest('.produtos-scroll');
        if (container && container.querySelectorAll('.produto-card').length === 0) {

          const pai = container.closest('section');
          if (pai) {
            const h2 = pai.querySelector('h2');
            if (h2) {
              const mensagem = document.createElement('p');
              mensagem.textContent = 'Nenhum produto disponível';
              mensagem.style.gridColumn = '1/-1';
              mensagem.style.textAlign = 'center';
              mensagem.style.padding = '2rem';
              container.appendChild(mensagem);
            }
          }
        }
        

        mostrarNotificacao('✓ Produto deletado com sucesso!', 'success');
      }, 300);
    } else {
      botao.innerHTML = textoBotao;
      botao.disabled = false;
      mostrarNotificacao('Erro ao deletar produto: ' + data.message, 'error');
    }
  })
  .catch(error => {
    console.error('Erro ao deletar produto:', error);
    botao.innerHTML = textoBotao;
    botao.disabled = false;
    mostrarNotificacao('Erro ao conectar com o servidor', 'error');
  });
}

function mostrarNotificacao(mensagem, tipo) {

  const notificacao = document.createElement('div');
  notificacao.className = `notificacao notificacao-${tipo}`;
  notificacao.textContent = mensagem;
  notificacao.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    background-color: ${tipo === 'success' ? '#4CAF50' : '#f44336'};
    color: white;
    border-radius: 4px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    z-index: 1000;
    font-weight: 500;
    animation: slideInRight 0.3s ease-out;
  `;
  
  document.body.appendChild(notificacao);
  

  setTimeout(() => {
    notificacao.style.animation = 'slideOutRight 0.3s ease-out';
    setTimeout(() => notificacao.remove(), 300);
  }, 3000);
}

if (!document.getElementById('produto-delete-styles')) {
  const style = document.createElement('style');
  style.id = 'produto-delete-styles';
  style.innerHTML = `
    @keyframes slideInRight {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOutRight {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

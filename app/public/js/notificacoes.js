(function () {
  const fab = document.getElementById('notifFab');
  const overlay = document.getElementById('notifOverlay');
  const panel = document.getElementById('notifPanel');
  const closeBtn = document.getElementById('notifClose');
  const badge = document.getElementById('notifBadge');
  const list = document.getElementById('notifList');
  const marcarTodasBtn = document.getElementById('notifMarcarTodas');

  if (!fab || !panel) return;

  function tempoRelativo(dataStr) {
    const diffMs = Date.now() - new Date(dataStr).getTime();
    const min = Math.floor(diffMs / 60000);
    if (min < 1) return 'agora mesmo';
    if (min < 60) return `há ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `há ${h}h`;
    const d = Math.floor(h / 24);
    return `há ${d}d`;
  }

  function abrirPainel() {
    panel.classList.add('is-open');
    overlay.classList.add('is-open');
    fab.setAttribute('aria-expanded', 'true');
    carregarLista();
  }

  function fecharPainel() {
    panel.classList.remove('is-open');
    overlay.classList.remove('is-open');
    fab.setAttribute('aria-expanded', 'false');
  }

  fab.addEventListener('click', () => {
    if (panel.classList.contains('is-open')) {
      fecharPainel();
    } else {
      abrirPainel();
    }
  });
  closeBtn.addEventListener('click', fecharPainel);
  overlay.addEventListener('click', fecharPainel);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('is-open')) fecharPainel();
  });

  function atualizarContador() {
    fetch('/notificacoes/nao-lidas')
      .then((r) => r.json())
      .then((data) => {
        const total = data.total || 0;
        if (total > 0) {
          badge.textContent = total > 9 ? '9+' : String(total);
          badge.style.display = 'flex';
        } else {
          badge.style.display = 'none';
        }
      })
      .catch(() => {});
  }

  function carregarLista() {
    list.innerHTML = '<p class="notif-empty">Carregando...</p>';
    fetch('/notificacoes')
      .then((r) => r.json())
      .then((data) => {
        const itens = data.notificacoes || [];
        if (itens.length === 0) {
          list.innerHTML = '<p class="notif-empty">Nenhuma notificação por aqui.</p>';
          return;
        }
        list.innerHTML = itens.map((n) => `
          <a href="${n.link || '#'}" data-id="${n.id}" class="notif-item ${n.lida ? '' : 'is-unread'}">
            <span class="notif-item__msg">${n.mensagem}</span>
            <small class="notif-item__time">${tempoRelativo(n.criado_em)}</small>
          </a>
        `).join('');

        list.querySelectorAll('.notif-item').forEach((el) => {
          el.addEventListener('click', () => {
            fetch('/notificacoes/' + el.dataset.id + '/ler', { method: 'POST' }).then(atualizarContador);
          });
        });
      })
      .catch(() => {
        list.innerHTML = '<p class="notif-empty">Não foi possível carregar as notificações.</p>';
      });
  }

  if (marcarTodasBtn) {
    marcarTodasBtn.addEventListener('click', () => {
      fetch('/notificacoes/marcar-todas-lidas', { method: 'POST' })
        .then(() => {
          atualizarContador();
          carregarLista();
        });
    });
  }

  atualizarContador();
  setInterval(atualizarContador, 30000); // checa a cada 30s
})();

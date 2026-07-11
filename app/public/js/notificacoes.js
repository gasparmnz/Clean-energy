(function () {
  const notifBtn = document.getElementById('notifBtn');
  const notifMenu = document.getElementById('notifMenu');
  const notifBadge = document.getElementById('notifBadge');
  const notifList = document.getElementById('notifList');

  if (!notifBtn || !notifMenu) return;

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

  function atualizarContador() {
    fetch('/notificacoes/nao-lidas')
      .then((r) => r.json())
      .then((data) => {
        const total = data.total || 0;
        if (total > 0) {
          notifBadge.textContent = total > 9 ? '9+' : String(total);
          notifBadge.style.display = 'block';
        } else {
          notifBadge.style.display = 'none';
        }
      })
      .catch(() => {});
  }

  function carregarLista() {
    notifList.innerHTML = '<p style="padding:12px 8px; color:#9ca3af; font-size:.85rem;">Carregando...</p>';
    fetch('/notificacoes')
      .then((r) => r.json())
      .then((data) => {
        const itens = data.notificacoes || [];
        if (itens.length === 0) {
          notifList.innerHTML = '<p style="padding:12px 8px; color:#9ca3af; font-size:.85rem;">Nenhuma notificação por aqui.</p>';
          return;
        }
        notifList.innerHTML = itens.map((n) => `
          <a href="${n.link || '#'}" data-id="${n.id}" class="notif-item"
             style="display:block; padding:10px 8px; border-radius:8px; text-decoration:none; color:#333; ${n.lida ? '' : 'background:#f0fdf4;'} margin-bottom:2px;">
            <span style="display:block; font-size:.85rem; font-weight:${n.lida ? '500' : '700'};">${n.mensagem}</span>
            <small style="color:#9ca3af;">${tempoRelativo(n.criado_em)}</small>
          </a>
        `).join('');

        notifList.querySelectorAll('.notif-item').forEach((el) => {
          el.addEventListener('click', () => {
            fetch('/notificacoes/' + el.dataset.id + '/ler', { method: 'POST' }).then(atualizarContador);
          });
        });
      })
      .catch(() => {
        notifList.innerHTML = '<p style="padding:12px 8px; color:#9ca3af; font-size:.85rem;">Não foi possível carregar as notificações.</p>';
      });
  }

  notifBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const abrindo = notifMenu.classList.toggle('show');
    notifBtn.setAttribute('aria-expanded', String(abrindo));
    if (abrindo) carregarLista();

    // Fecha os outros dropdowns do header
    ['dropdownMenu', 'dropdownGuestMenu'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('show');
    });
  });

  document.addEventListener('click', () => {
    notifMenu.classList.remove('show');
    notifBtn.setAttribute('aria-expanded', 'false');
  });

  atualizarContador();
  setInterval(atualizarContador, 30000); // checa a cada 30s
})();

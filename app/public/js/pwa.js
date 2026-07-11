/**
 * pwa.js — registro do Service Worker e controle do prompt de instalação (A2HS).
 * Incluído em todas as páginas do site.
 */
(function () {
  'use strict';

  // ── Registro do Service Worker ──────────────────────────────────
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js')
        .then(function (registration) {
          // Verifica periodicamente se há uma nova versão do SW.
          registration.addEventListener('updatefound', function () {
            var novoWorker = registration.installing;
            if (!novoWorker) return;
            novoWorker.addEventListener('statechange', function () {
              if (novoWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Uma nova versão foi instalada e está pronta para assumir.
                console.log('[PWA] Nova versão disponível. Ela será usada no próximo carregamento.');
              }
            });
          });
        })
        .catch(function (err) {
          console.warn('[PWA] Falha ao registrar o Service Worker:', err);
        });
    });
  }

  // ── Aviso de status de conexão ───────────────────────────────────
  function atualizarStatusConexao() {
    document.body.classList.toggle('app-offline', !navigator.onLine);
  }
  window.addEventListener('online', atualizarStatusConexao);
  window.addEventListener('offline', atualizarStatusConexao);
  document.addEventListener('DOMContentLoaded', atualizarStatusConexao);

  // ── Prompt de instalação (Adicionar à tela inicial) ─────────────
  var deferredPrompt = null;
  var BOTAO_ID = 'pwa-install-btn';

  function criarBotaoInstalar() {
    if (document.getElementById(BOTAO_ID)) return document.getElementById(BOTAO_ID);

    var btn = document.createElement('button');
    btn.id = BOTAO_ID;
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Instalar aplicativo Clean Energy');
    btn.innerHTML = '<i class="bx bx-download" aria-hidden="true"></i> Instalar app';
    btn.style.cssText = [
      'position:fixed',
      'right:16px',
      'bottom:16px',
      'z-index:9999',
      'display:none',
      'align-items:center',
      'gap:8px',
      'padding:12px 18px',
      'background:#1b814e',
      'color:#fff',
      'border:none',
      'border-radius:999px',
      'font-size:0.9rem',
      'font-weight:600',
      'box-shadow:0 4px 14px rgba(0,0,0,0.25)',
      'cursor:pointer'
    ].join(';');

    btn.addEventListener('click', function () {
      btn.style.display = 'none';
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(function () {
        deferredPrompt = null;
      });
    });

    document.body.appendChild(btn);
    return btn;
  }

  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    deferredPrompt = event;
    document.addEventListener('DOMContentLoaded', function () {
      var btn = criarBotaoInstalar();
      btn.style.display = 'flex';
    });
    // Caso o DOM já esteja pronto quando o evento disparar.
    if (document.readyState !== 'loading') {
      var btn = criarBotaoInstalar();
      btn.style.display = 'flex';
    }
  });

  window.addEventListener('appinstalled', function () {
    deferredPrompt = null;
    var btn = document.getElementById(BOTAO_ID);
    if (btn) btn.style.display = 'none';
    console.log('[PWA] Aplicativo instalado com sucesso.');
  });
})();

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

  function removerBotaoInstalacao() {
    var btn = document.getElementById('pwa-install-btn');
    if (btn) {
      btn.remove();
    }
  }

  function aplicarMetaTagsMobile() {
    var metas = [
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
      { name: 'apple-mobile-web-app-title', content: 'Clean Energy' },
      { name: 'mobile-web-app-capable', content: 'yes' }
    ];

    metas.forEach(function (meta) {
      if (!document.querySelector('meta[name="' + meta.name + '"]')) {
        var tag = document.createElement('meta');
        tag.name = meta.name;
        tag.content = meta.content;
        document.head.appendChild(tag);
      }
    });

    if (!document.querySelector('link[rel="apple-touch-icon"]')) {
      var appleIcon = document.createElement('link');
      appleIcon.rel = 'apple-touch-icon';
      appleIcon.href = '/imagem/apple-touch-icon.png';
      document.head.appendChild(appleIcon);
    }
  }

  window.addEventListener('online', atualizarStatusConexao);
  window.addEventListener('offline', atualizarStatusConexao);
  document.addEventListener('DOMContentLoaded', function () {
    atualizarStatusConexao();
    aplicarMetaTagsMobile();
    removerBotaoInstalacao();
  });

  // ── Prompt de instalação (Adicionar à tela inicial) ─────────────
  var isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.matchMedia('(max-width: 768px)').matches;

  if (isMobile) {
    window.addEventListener('beforeinstallprompt', function (event) {
      event.preventDefault();
      removerBotaoInstalacao();
      console.log('[PWA] Prompt nativo de instalação disponível no mobile.');
    });
  }

  window.addEventListener('appinstalled', function () {
    console.log('[PWA] Aplicativo instalado com sucesso.');
  });
})();

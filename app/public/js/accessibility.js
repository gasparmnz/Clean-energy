(function () {
  var STORAGE_KEY = 'a11y-settings';
  var html = document.documentElement;

  var DEFAULTS = {
    fontScale: 100,
    readableFont: false,
    spacedText: false,
    highlightLinks: false,
    readingGuide: false,
    largeCursor: false,
    reducedMotion: false,
    grayscale: false,
    highContrast: false,
    invert: false
  };

  function loadSettings() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return Object.assign({}, DEFAULTS);
      return Object.assign({}, DEFAULTS, JSON.parse(raw));
    } catch (e) {
      return Object.assign({}, DEFAULTS);
    }
  }

  function saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) { /* ignore */ }
  }

  var settings = loadSettings();

  var CLASS_MAP = {
    readableFont: 'a11y-readable-font',
    spacedText: 'a11y-spaced-text',
    highlightLinks: 'a11y-highlight-links',
    largeCursor: 'a11y-large-cursor',
    reducedMotion: 'a11y-reduced-motion',
    grayscale: 'a11y-grayscale',
    highContrast: 'a11y-high-contrast',
    invert: 'a11y-invert'
  };

  function applyAll() {
    html.style.fontSize = settings.fontScale + '%';

    Object.keys(CLASS_MAP).forEach(function (key) {
      html.classList.toggle(CLASS_MAP[key], !!settings[key]);
    });

    var guide = document.getElementById('a11yReadingGuide');
    if (guide) guide.classList.toggle('is-active', !!settings.readingGuide);

    document.querySelectorAll('[data-a11y-card]').forEach(function (card) {
      var key = card.getAttribute('data-a11y-card');
      card.classList.toggle('is-active', !!settings[key]);
    });

    var fontLabel = document.getElementById('a11yFontScaleLabel');
    if (fontLabel) fontLabel.textContent = settings.fontScale + '% do tamanho padrão';
  }

  applyAll();

  document.addEventListener('DOMContentLoaded', function () {
    applyAll();

    var fab = document.getElementById('a11yFab');
    var panel = document.getElementById('a11yPanel');
    var overlay = document.getElementById('a11yOverlay');
    var closeBtn = document.getElementById('a11yClose');

    function openPanel() {
      panel.classList.add('is-open');
      overlay.classList.add('is-open');
    }
    function closePanel() {
      panel.classList.remove('is-open');
      overlay.classList.remove('is-open');
    }

    if (fab) fab.addEventListener('click', openPanel);
    if (closeBtn) closeBtn.addEventListener('click', closePanel);
    if (overlay) overlay.addEventListener('click', closePanel);

    // Tamanho do texto
    var decBtn = document.getElementById('a11yFontDec');
    var incBtn = document.getElementById('a11yFontInc');
    if (decBtn) decBtn.addEventListener('click', function () {
      settings.fontScale = Math.max(80, settings.fontScale - 10);
      saveSettings(settings);
      applyAll();
    });
    if (incBtn) incBtn.addEventListener('click', function () {
      settings.fontScale = Math.min(160, settings.fontScale + 10);
      saveSettings(settings);
      applyAll();
    });

    // Cards de toggle (leitura/navegação + ajuste de cor)
    document.querySelectorAll('[data-a11y-card]').forEach(function (card) {
      card.addEventListener('click', function () {
        var key = card.getAttribute('data-a11y-card');
        settings[key] = !settings[key];
        saveSettings(settings);
        applyAll();
      });
    });

    // Seções colapsáveis
    document.querySelectorAll('[data-a11y-collapse]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var section = btn.closest('.a11y-section');
        if (!section) return;
        var collapsed = section.classList.toggle('is-collapsed');
        btn.innerHTML = collapsed
          ? '<i class="bx bx-plus"></i>'
          : '<i class="bx bx-minus"></i>';
      });
    });

    // Reset
    var resetBtn = document.getElementById('a11yReset');
    if (resetBtn) resetBtn.addEventListener('click', function () {
      settings = Object.assign({}, DEFAULTS);
      saveSettings(settings);
      applyAll();
    });

    // Guia de leitura: segue o cursor
    var guideEl = document.getElementById('a11yReadingGuide');
    if (guideEl) {
      document.addEventListener('mousemove', function (e) {
        if (!settings.readingGuide) return;
        guideEl.style.top = (e.clientY - 20) + 'px';
      });
    }

    // Modo escuro (reaproveita o mecanismo já existente no site:
    // classe body.dark-mode + localStorage('darkmode'))
    var darkCard = document.getElementById('a11yDarkModeCard');
    if (darkCard) {
      var syncDarkCard = function () {
        darkCard.classList.toggle('is-active', document.body.classList.contains('dark-mode'));
      };
      syncDarkCard();
      darkCard.addEventListener('click', function () {
        var isDark = document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkmode', isDark ? 'ativo' : 'desativado');
        document.querySelectorAll('.dark-mode-toggle-input').forEach(function (el) {
          if ('checked' in el) el.checked = isDark;
        });
        syncDarkCard();
      });
    }
  });
})();

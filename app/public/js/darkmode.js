/* ══ DARK MODE GLOBAL - Clean Energy ══ */
(function () {
  // Aplica imediatamente ao carregar (sem flash)
  if (localStorage.getItem('darkmode') === 'ativo') {
    document.body.classList.add('dark-mode');
  }

  function ativar() {
    document.body.classList.add('dark-mode');
    localStorage.setItem('darkmode', 'ativo');
    // Atualiza todos os toggles da página
    document.querySelectorAll('.dark-mode-toggle-input').forEach(el => el.checked = true);
    // Atualiza ícone do botão antigo (header)
    const icon = document.getElementById('darkModeIcon');
    if (icon) icon.src = '/imagem/sol.png';
  }

  function desativar() {
    document.body.classList.remove('dark-mode');
    localStorage.setItem('darkmode', 'desativado');
    document.querySelectorAll('.dark-mode-toggle-input').forEach(el => el.checked = false);
    const icon = document.getElementById('darkModeIcon');
    if (icon) icon.src = '/imagem/darkmode.png';
  }

  document.addEventListener('DOMContentLoaded', function () {
    const isDark = localStorage.getItem('darkmode') === 'ativo';

    // ── Toggle switch (perfil) ──
    const switchInput = document.getElementById('darkModeToggleSwitch');
    if (switchInput) {
      switchInput.checked = isDark;
      switchInput.addEventListener('change', function () {
        this.checked ? ativar() : desativar();
      });
    }

    // ── Botão antigo com img (header) ──
    const botaoAntigo = document.getElementById('darkModeToggle');
    if (botaoAntigo) {
      const icon = document.getElementById('darkModeIcon');
      if (icon) icon.src = isDark ? '/imagem/sol.png' : '/imagem/darkmode.png';
      botaoAntigo.addEventListener('click', function (e) {
        e.preventDefault();
        document.body.classList.contains('dark-mode') ? desativar() : ativar();
      });
    }
  });
})();

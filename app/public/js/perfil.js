document.addEventListener('DOMContentLoaded', function () {

  const btnEditar   = document.getElementById('btnEditarPerfil');
  const btnCancelar = document.getElementById('btnCancelar');
  const formWrap    = document.getElementById('formEdicaoWrap');

  if (btnEditar) {
    btnEditar.addEventListener('click', function (e) {
      e.preventDefault();
      formWrap.classList.toggle('hidden');
      if (!formWrap.classList.contains('hidden')) {
        formWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  if (btnCancelar) {
    btnCancelar.addEventListener('click', function () {
      formWrap.classList.add('hidden');
    });
  }

  /* ─────────────────────────────────────────
     Salvar dados do perfil (nome + telefone)
  ───────────────────────────────────────── */
  const form = document.getElementById('formEdicao');
  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const nome     = document.getElementById('nomeInput').value.trim();
      const telefone = document.getElementById('telefoneInput').value.trim();
      if (!nome) { showToast('Nome não pode estar vazio.', 'erro'); return; }

      try {
        const resp = await fetch('/perfil/atualizar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome, biografia: telefone })
        });

        const json = await resp.json();
        if (json.sucesso) {
          const nomeEl = document.getElementById('nomeDisplay');
          if (nomeEl) nomeEl.textContent = nome;
          formWrap.classList.add('hidden');
          showToast('Dados atualizados com sucesso!', 'sucesso');

          const asideName = document.querySelector('.perfil-aside__name');
          if (asideName) asideName.textContent = nome;
        } else {
          showToast(json.erro || 'Erro ao salvar.', 'erro');
        }

      } catch {
        showToast('Erro de conexão.', 'erro');
      }
    });
  }

  /* ─────────────────────────────────────────
     Redefinir senha
  ───────────────────────────────────────── */
  const formSenha = document.getElementById('formRedefinirSenha');
  if (formSenha) {
    formSenha.addEventListener('submit', async function (e) {
      e.preventDefault();
      const senhaAtual     = document.getElementById('senhaAtualInput').value;
      const novaSenha      = document.getElementById('novaSenhaInput').value;
      const confirmarSenha = document.getElementById('confirmarNovaSenhaInput').value;

      if (novaSenha !== confirmarSenha) {
        showToast('As novas senhas não conferem.', 'erro'); return;
      }
      if (novaSenha.length < 8) {
        showToast('A nova senha deve ter pelo menos 8 caracteres.', 'erro'); return;
      }

      try {
        const resp = await fetch('/perfil/redefinir-senha', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ senhaAtual, novaSenha, confirmarSenha })
        });
        const json = await resp.json();
        if (json.sucesso) {
          showToast('Senha redefinida com sucesso!', 'sucesso');
          formSenha.reset();
          document.getElementById('formSenhaWrap').classList.add('hidden');
        } else {
          showToast(json.erro || 'Erro ao redefinir senha.', 'erro');
        }
      } catch {
        showToast('Erro de conexão.', 'erro');
      }
    });
  }

  /* ─────────────────────────────────────────
     Redefinir email
  ───────────────────────────────────────── */
  const formEmail = document.getElementById('formRedefinirEmail');
  if (formEmail) {
    formEmail.addEventListener('submit', async function (e) {
      e.preventDefault();
      const novoEmail        = document.getElementById('novoEmailInput').value.trim();
      const senhaConfirmacao = document.getElementById('senhaEmailInput').value;

      try {
        const resp = await fetch('/perfil/redefinir-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ novoEmail, senhaConfirmacao })
        });
        const json = await resp.json();
        if (json.sucesso) {
          showToast('E-mail atualizado com sucesso!', 'sucesso');
          const emailEl = document.querySelector('.perfil-hero__email');
          if (emailEl) emailEl.innerHTML = `<i class='bx bx-envelope'></i> ${novoEmail}`;
          formEmail.reset();
          document.getElementById('formEmailWrap').classList.add('hidden');
        } else {
          showToast(json.erro || 'Erro ao atualizar e-mail.', 'erro');
        }
      } catch {
        showToast('Erro de conexão.', 'erro');
      }
    });
  }

  /* ─────────────────────────────────────────
     Toggle de sub-formulários de edição
  ───────────────────────────────────────── */
  document.querySelectorAll('[data-toggle-form]').forEach(btn => {
    btn.addEventListener('click', function () {
      const targetId = this.getAttribute('data-toggle-form');
      const target = document.getElementById(targetId);
      if (target) {
        target.classList.toggle('hidden');
        if (!target.classList.contains('hidden')) {
          target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    });
  });

  /* ─────────────────────────────────────────
     Upload de foto de perfil + atualiza header
  ───────────────────────────────────────── */
  const inputFoto = document.getElementById('inputFoto');
  const imgPerfil = document.getElementById('fotoPerfil');

  if (inputFoto) {
    inputFoto.addEventListener('change', async function () {
      const file = this.files[0];
      if (!file) return;


      const reader = new FileReader();
      reader.onload = e => {
        if (imgPerfil) imgPerfil.src = e.target.result;

        const asideAvatar = document.querySelector('.perfil-aside__avatar');
        if (asideAvatar) asideAvatar.src = e.target.result;
      };
      reader.readAsDataURL(file);

      const formData = new FormData();
      formData.append('foto', file);

      try {
        const resp = await fetch('/perfil/foto', { method: 'POST', body: formData });
        const json = await resp.json();
        if (json.sucesso) {
          const src = json.foto + '?t=' + Date.now();
          if (imgPerfil) imgPerfil.src = src;
          // Atualiza avatar no HEADER (dropdown)
          const headerAvatar = document.querySelector('header .avatar');
          if (headerAvatar) headerAvatar.src = src;
          // Atualiza avatar no aside
          const asideAvatar = document.querySelector('.perfil-aside__avatar');
          if (asideAvatar) asideAvatar.src = src;
          showToast('Foto atualizada com sucesso!', 'sucesso');
        } else {
          showToast(json.erro || 'Erro ao enviar foto.', 'erro');
        }

      } catch {
        showToast('Erro de conexão ao enviar foto.', 'erro');
      }
    });
  }


  const dmSwitch = document.getElementById('darkModeToggleSwitch');
  if (dmSwitch) {
    dmSwitch.checked = document.body.classList.contains('dark-mode');
    dmSwitch.addEventListener('change', function () {
      document.body.classList.toggle('dark-mode', this.checked);
      localStorage.setItem('darkMode', this.checked ? 'true' : 'false');
    });
  }

  function showToast(msg, tipo = 'sucesso') {
    let toast = document.getElementById('profileToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'profileToast';
      toast.style.cssText = `
        position: fixed; bottom: 24px; right: 24px; z-index: 9999;
        padding: 12px 20px; border-radius: 10px; font-size: 0.9rem; font-weight: 600;
        box-shadow: 0 4px 16px rgba(0,0,0,.15); transition: opacity .3s;
        display: flex; align-items: center; gap: 8px; max-width: 320px;
      `;
      document.body.appendChild(toast);
    }
    toast.style.background = tipo === 'sucesso' ? '#16a34a' : '#dc2626';
    toast.style.color = '#fff';
    toast.innerHTML = (tipo === 'sucesso' ? '<i class="bx bx-check-circle"></i>' : '<i class="bx bx-error-circle"></i>') + msg;
    toast.style.opacity = '1';
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => { toast.style.opacity = '0'; }, 3500);
  }

});

document.addEventListener('DOMContentLoaded', function () {

  /* ── Edição de dados ── */
  const btnEditar   = document.getElementById('btnEditarPerfil');
  const btnCancelar = document.getElementById('btnCancelar');
  const formWrap    = document.getElementById('formEdicaoWrap');
  const form        = document.getElementById('formEdicao');

  if (btnEditar) {
    btnEditar.addEventListener('click', function (e) {
      e.preventDefault();
      formWrap.classList.remove('hidden');
      formWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  if (btnCancelar) {
    btnCancelar.addEventListener('click', function () {
      formWrap.classList.add('hidden');
    });
  }

  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const nome     = document.getElementById('nomeInput').value.trim();
      const telefone = document.getElementById('telefoneInput').value.trim();
      if (!nome) { alert('Nome não pode estar vazio.'); return; }

      try {
        const resp = await fetch('/perfil/atualizar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome, biografia: telefone })
        });
        const json = await resp.json();
        if (json.sucesso) {
          // Atualiza nome na saudação sem reload
          const nomeEl = document.getElementById('nomeDisplay');
          if (nomeEl) nomeEl.textContent = nome.split(' ')[0];
          formWrap.classList.add('hidden');
        } else {
          alert(json.erro || 'Erro ao salvar. Tente novamente.');
        }
      } catch {
        alert('Erro de conexão. Tente novamente.');
      }
    });
  }

  /* ── Upload de foto de perfil ── */
  const inputFoto = document.getElementById('inputFoto');
  const imgPerfil = document.getElementById('fotoPerfil');

  if (inputFoto) {
    inputFoto.addEventListener('change', async function () {
      const file = this.files[0];
      if (!file) return;

      // Preview imediato
      const reader = new FileReader();
      reader.onload = e => { if (imgPerfil) imgPerfil.src = e.target.result; };
      reader.readAsDataURL(file);

      // Envia para o servidor
      const formData = new FormData();
      formData.append('foto', file);

      try {
        const resp = await fetch('/perfil/foto', { method: 'POST', body: formData });
        const json = await resp.json();
        if (json.sucesso) {
          // Atualiza src com URL real do servidor
          if (imgPerfil) imgPerfil.src = json.foto + '?t=' + Date.now();
        } else {
          alert(json.erro || 'Erro ao enviar foto.');
        }
      } catch {
        alert('Erro de conexão ao enviar foto.');
      }
    });
  }

});

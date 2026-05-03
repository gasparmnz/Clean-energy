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

      if (!nome) {
        alert('Nome não pode estar vazio.');
        return;
      }

      try {
        const resp = await fetch('/perfil/atualizar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome, biografia: telefone })
        });

        const json = await resp.json();

        if (json.success) {
          const nomeEl = document.getElementById('nomeDisplay');
          if (nomeEl) nomeEl.textContent = nome.split(' ')[0];
          formWrap.classList.add('hidden');
        } else {
          alert(json.error || 'Erro ao salvar.');
        }

      } catch {
        alert('Erro de conexão.');
      }
    });
  }

  /* ── Upload de foto ── */
  const inputFoto = document.getElementById('inputFoto');
  const imgPerfil = document.getElementById('fotoPerfil');
  const btnConfirmar = document.getElementById('btnConfirmarFoto');
  let arquivoSelecionado = null;

  if (inputFoto) {
    inputFoto.addEventListener('change', function () {
      const file = this.files[0];
      if (!file) return;
      arquivoSelecionado = file;

      // Apenas preview local — não envia ainda
      const reader = new FileReader();
      reader.onload = e => {
        if (imgPerfil) imgPerfil.src = e.target.result;
        if (btnConfirmar) btnConfirmar.style.display = 'inline-flex';
      };
      reader.readAsDataURL(file);
    });
  }

  if (btnConfirmar) {
    btnConfirmar.addEventListener('click', async function () {
      if (!arquivoSelecionado) return;

      btnConfirmar.disabled = true;
      btnConfirmar.textContent = 'Enviando...';

      const formData = new FormData();
      formData.append('foto', arquivoSelecionado);

      try {
        const resp = await fetch('/perfil/foto', { method: 'POST', body: formData });
        if (!resp.ok) throw new Error('Erro no servidor');
        const json = await resp.json();

        if (json.success) {
          if (imgPerfil) imgPerfil.src = json.foto + '?t=' + Date.now();
          btnConfirmar.textContent = '✓ Salvo!';
          setTimeout(() => {
            btnConfirmar.style.display = 'none';
            btnConfirmar.disabled = false;
            btnConfirmar.textContent = 'Confirmar foto';
            arquivoSelecionado = null;
          }, 1500);
        } else {
          alert(json.error || 'Erro ao enviar foto.');
          btnConfirmar.disabled = false;
          btnConfirmar.textContent = 'Confirmar foto';
        }
      } catch {
        alert('Erro de conexão ao enviar foto.');
        btnConfirmar.disabled = false;
        btnConfirmar.textContent = 'Confirmar foto';
      }
    });
  }

});
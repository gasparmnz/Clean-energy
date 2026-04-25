document.addEventListener('DOMContentLoaded', function () {
  const btnEditar   = document.getElementById('btnEditarPerfil');
  const btnCancelar = document.getElementById('btnCancelar');
  const formWrap    = document.getElementById('formEdicaoWrap');
  const form        = document.getElementById('formEdicao');

  if (!btnEditar) return;

  btnEditar.addEventListener('click', function (e) {
    e.preventDefault();
    formWrap.classList.remove('hidden');
    formWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  btnCancelar.addEventListener('click', function () {
    formWrap.classList.add('hidden');
  });

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const nome      = document.getElementById('nomeInput').value.trim();
    const telefone  = document.getElementById('telefoneInput').value.trim();
    if (!nome) { alert('Nome não pode estar vazio.'); return; }

    try {
      const resp = await fetch('/perfil/atualizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, biografia: telefone })
      });
      const json = await resp.json();
      if (json.sucesso) {
        // Atualiza o nome exibido na saudação sem reload
        const greet = document.querySelector('.perfil-greeting h2 strong');
        if (greet) greet.textContent = nome.split(' ')[0];
        const sidebar = document.querySelector('.sidebar .username');
        if (sidebar) sidebar.textContent = nome.split(' ')[0];
        formWrap.classList.add('hidden');
      } else {
        alert(json.erro || 'Erro ao salvar. Tente novamente.');
      }
    } catch (err) {
      alert('Erro de conexão. Tente novamente.');
    }
  });
});

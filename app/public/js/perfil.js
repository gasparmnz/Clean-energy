document.addEventListener("DOMContentLoaded", () => {

  const btnEditar = document.getElementById("btnEditar");
  const btnCancelar = document.getElementById("btnCancelar");
  const form = document.getElementById("formEdicao");
  const view = document.getElementById("perfilVisualizacao");

  const nomeInput = document.getElementById("nomeInput");
  const emailInput = document.getElementById("emailInput");
  const cpfInput = document.getElementById("cpfInput");

  const nomeDisplay = document.getElementById("nomeDisplay");
  const emailDisplay = document.getElementById("emailDisplay");
  const cpfDisplay = document.getElementById("cpfDisplay");

  function abrirEdicao() {
    nomeInput.value = nomeDisplay.textContent;
    emailInput.value = emailDisplay.textContent;
    cpfInput.value = cpfDisplay.textContent;

    view.classList.add("hidden");
    form.classList.remove("hidden");
  }

  function cancelarEdicao() {
    form.classList.add("hidden");
    view.classList.remove("hidden");
  }

  btnEditar.addEventListener("click", abrirEdicao);
  btnCancelar.addEventListener("click", cancelarEdicao);

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    nomeDisplay.textContent = nomeInput.value;
    emailDisplay.textContent = emailInput.value;
    cpfDisplay.textContent = cpfInput.value;

    cancelarEdicao();
  });

});
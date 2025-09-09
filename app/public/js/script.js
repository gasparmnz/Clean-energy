document.addEventListener("DOMContentLoaded", () => {
  const btnFisica = document.getElementById("btnFisica");
  const btnEmpresa = document.getElementById("btnEmpresa");
  const labelDocumento = document.getElementById("labelDocumento");
  const inputDocumento = document.getElementById("documento");

  btnFisica.addEventListener("click", () => {
    btnFisica.classList.add("active");
    btnEmpresa.classList.remove("active");
    labelDocumento.textContent = "CPF";
    inputDocumento.placeholder = "Digite seu CPF";
  });

  btnEmpresa.addEventListener("click", () => {
    btnEmpresa.classList.add("active");
    btnFisica.classList.remove("active");
    labelDocumento.textContent = "CNPJ";
    inputDocumento.placeholder = "Digite seu CNPJ";
  });
});

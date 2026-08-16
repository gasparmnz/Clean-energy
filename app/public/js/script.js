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


const filters = document.querySelectorAll('.filter');
const orders = document.querySelectorAll('.order');

filters.forEach(filter => {
  filter.addEventListener('click', e => {
    e.preventDefault();


    filters.forEach(f => f.classList.remove('active'));
 
    filter.classList.add('active');

    const filterValue = filter.dataset.filter;

    orders.forEach(order => {
      if (filterValue === 'all') {
        order.style.display = 'block';
      } else {
        order.style.display = order.dataset.status === filterValue ? 'block' : 'none';
      }
    });
  });
});


// ── Dropdown logado ───────────────────────────────────────────────────────
const dropdownBtn  = document.getElementById("dropdownBtn");
const dropdownMenu = document.getElementById("dropdownMenu");

if (dropdownBtn && dropdownMenu) {
  dropdownBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdownMenu.classList.toggle("show");
    // Fecha o guest se estiver aberto
    const gm = document.getElementById("dropdownGuestMenu");
    if (gm) gm.classList.remove("show");
  });
}

// ── Dropdown guest (deslogado, mobile/tablet) ──────────────────────────────
const dropdownGuestBtn  = document.getElementById("dropdownGuestBtn");
const dropdownGuestMenu = document.getElementById("dropdownGuestMenu");

if (dropdownGuestBtn && dropdownGuestMenu) {
  dropdownGuestBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdownGuestMenu.classList.toggle("show");
    // Fecha o logado se estiver aberto
    if (dropdownMenu) dropdownMenu.classList.remove("show");
  });
}

// ── Fecha todos ao clicar fora ─────────────────────────────────────────────
document.addEventListener("click", () => {
  if (dropdownMenu)      dropdownMenu.classList.remove("show");
  if (dropdownGuestMenu) dropdownGuestMenu.classList.remove("show");
});

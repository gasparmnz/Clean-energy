document.addEventListener("DOMContentLoaded", () => {
  const btnFisica = document.getElementById("btnFisica");
  const btnEmpresa = document.getElementById("btnEmpresa");
  const labelDocumento = document.getElementById("labelDocumento");
  const inputDocumento = document.getElementById("documento");

  if (btnFisica && btnEmpresa && labelDocumento && inputDocumento) {
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
  }
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
    const abrindo = dropdownMenu.classList.toggle("show");
    dropdownBtn.setAttribute("aria-expanded", String(abrindo));
    // Fecha o guest se estiver aberto
    const gm = document.getElementById("dropdownGuestMenu");
    const gbtn = document.getElementById("dropdownGuestBtn");
    if (gm) gm.classList.remove("show");
    if (gbtn) gbtn.setAttribute("aria-expanded", "false");
  });
}

// ── Dropdown guest (deslogado, mobile/tablet) ──────────────────────────────
const dropdownGuestBtn  = document.getElementById("dropdownGuestBtn");
const dropdownGuestMenu = document.getElementById("dropdownGuestMenu");

if (dropdownGuestBtn && dropdownGuestMenu) {
  dropdownGuestBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const abrindo = dropdownGuestMenu.classList.toggle("show");
    dropdownGuestBtn.setAttribute("aria-expanded", String(abrindo));
    // Fecha o logado se estiver aberto
    if (dropdownMenu) dropdownMenu.classList.remove("show");
    if (dropdownBtn) dropdownBtn.setAttribute("aria-expanded", "false");
  });
}

// ── Fecha todos ao clicar fora ─────────────────────────────────────────────
document.addEventListener("click", () => {
  if (dropdownMenu)      dropdownMenu.classList.remove("show");
  if (dropdownGuestMenu) dropdownGuestMenu.classList.remove("show");
  if (dropdownBtn)       dropdownBtn.setAttribute("aria-expanded", "false");
  if (dropdownGuestBtn)  dropdownGuestBtn.setAttribute("aria-expanded", "false");
});

// ── Menu hambúrguer mobile (aside inferior) — sincroniza aria-expanded/estado ──
const menuCheck = document.getElementById("check");
const menuIcons = document.querySelector(".icons");
if (menuCheck && menuIcons) {
  menuCheck.addEventListener("change", () => {
    menuIcons.setAttribute("aria-expanded", String(menuCheck.checked));
  });
  // Fecha o menu ao clicar em um link (evita ficar preso na aside inferior)
  document.querySelectorAll(".navbar a").forEach((link) => {
    link.addEventListener("click", () => {
      menuCheck.checked = false;
      menuIcons.setAttribute("aria-expanded", "false");
    });
  });
  // Tecla Escape fecha o menu mobile
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menuCheck.checked) {
      menuCheck.checked = false;
      menuIcons.setAttribute("aria-expanded", "false");
    }
  });
}

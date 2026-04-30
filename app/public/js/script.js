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


const dropdownBtn = document.getElementById("dropdownBtn");
const dropdownMenu = document.getElementById("dropdownMenu");


dropdownBtn.addEventListener("click", (e) => {
  e.stopPropagation(); 
  dropdownMenu.classList.toggle("show");
});


document.addEventListener("click", () => {
  dropdownMenu.classList.remove("show");
});

// Dropdown menu functionality
document.addEventListener('DOMContentLoaded', function() {
  const dropdownBtn = document.getElementById('dropdownBtn');
  const dropdownMenu = document.getElementById('dropdownMenu');

  if (dropdownBtn && dropdownMenu) {
    dropdownBtn.addEventListener('click', function(e) {
      e.preventDefault();
      dropdownMenu.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
      if (!dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
        dropdownMenu.classList.remove('show');
      }
    });
  }
});
// default mock data (usado só se o servidor não passar produtos)
const MOCK_PRODUCTS = [
  { id: 'PROD-001', name: 'Serragem', description: 'Serragem compacta de alta densidade energética.', price: 150.00, stock: 200, status: 'active', image: '/imagem/serragem.png' },
  { id: 'PROD-002', name: 'Casca de Arroz', description: 'Subproduto do arroz com alto poder calorífico.', price: 80.00, stock: 500, status: 'active', image: '/imagem/cascadearroz.png' },
  { id: 'PROD-003', name: 'Bagaço de Cana', description: 'Resíduo da cana-de-açúcar com alta eficiência energética.', price: 120.00, stock: 350, status: 'active', image: '/imagem/cana.png' }
];

let productsData = (window.__ADMIN_PRODUCTS__ && Array.isArray(window.__ADMIN_PRODUCTS__) && window.__ADMIN_PRODUCTS__.length > 0)
  ? window.__ADMIN_PRODUCTS__
  : MOCK_PRODUCTS;

let currentFilter = 'all';
let currentEditingProduct = null;

document.addEventListener('DOMContentLoaded', () => {
  displayProducts();
  updateSummary();
  setupEventListeners();
});

function updateSummary() {
  const total = productsData.length;
  const active = productsData.filter(p => p.status === 'active').length;
  const suspended = productsData.filter(p => p.status === 'suspended').length;

  document.getElementById('totalProducts').textContent = total;
  document.getElementById('activeProducts').textContent = active;
  document.getElementById('suspendedProductsSummary').textContent = suspended;
}

function displayProducts() {
  const searchInput = document.getElementById('searchInput').value.toLowerCase();
  const availableContainer = document.getElementById('availableProducts');
  const suspendedContainer = document.getElementById('suspendedProducts');
  const availableSection = document.getElementById('availableSection');
  const suspendedSection = document.getElementById('suspendedSection');

  let filteredData = productsData;
  if (searchInput) {
    filteredData = productsData.filter(p =>
      p.name.toLowerCase().includes(searchInput) ||
      p.id.toLowerCase().includes(searchInput) ||
      p.description.toLowerCase().includes(searchInput)
    );
  }

  const available = filteredData.filter(p => p.status === 'active');
  const suspended = filteredData.filter(p => p.status === 'suspended');

  availableContainer.innerHTML = available.length > 0
    ? available.map(createProductCard).join('')
    : '<article class="empty-state"><i class="bx bx-inbox"></i><p>Nenhum produto disponível</p></article>';

  document.getElementById('availableBadge').textContent = available.length;

  suspendedContainer.innerHTML = suspended.length > 0
    ? suspended.map(createProductCard).join('')
    : '<article class="empty-state"><i class="bx bx-inbox"></i><p>Nenhum produto suspenso</p></article>';

  document.getElementById('suspendedBadge').textContent = suspended.length;

  availableSection.style.display = (currentFilter === 'all' || currentFilter === 'active') ? 'block' : 'none';
  suspendedSection.style.display = (currentFilter === 'all' || currentFilter === 'suspended') ? 'block' : 'none';
}

function createProductCard(product) {
  const statusText = product.status === 'active' ? 'Disponível' : 'Suspenso';
  const statusClass = product.status === 'active' ? 'active' : 'suspended';
  const cardClass = product.status === 'suspended' ? 'suspended' : '';

  return `
    <article class="product-card ${cardClass}">
      <figure class="product-image">
        <img src="${product.image}" alt="${product.name}"
             onerror="this.onerror=null; this.src='/imagem/placeholder.png'; this.style.backgroundColor='#f5f5f5';">
        <span class="product-status-badge ${statusClass}">${statusText}</span>
      </figure>
      <article class="product-info">
        <span class="product-id">${product.id}</span>
        <h3 class="product-name">${product.name}</h3>
        <p class="product-description">${product.description}</p>
        <article class="product-meta">
          <span class="product-price">R$ ${Number(product.price).toFixed(2)}</span>
          <article class="product-stock"><strong>${product.stock}</strong> em estoque</article>
        </article>
        <nav class="product-actions">
          <button class="action-btn btn-edit" onclick="openEditModal('${product.id}')">
            <i class='bx bx-edit'></i>Editar
          </button>
          ${product.status === 'active'
            ? `<button class="action-btn btn-suspend" onclick="toggleProductStatus('${product.id}', 'suspended')"><i class='bx bx-block'></i>Suspender</button>`
            : `<button class="action-btn btn-activate" onclick="toggleProductStatus('${product.id}', 'active')"><i class='bx bx-check'></i>Ativar</button>`
          }
        </nav>
      </article>
    </article>
  `;
}



function openEditModal(productId) {
  currentEditingProduct = productsData.find(p => p.id === productId);
  if (currentEditingProduct) {
    document.getElementById('editName').value = currentEditingProduct.name;
    document.getElementById('editDescription').value = currentEditingProduct.description;
    document.getElementById('editPrice').value = currentEditingProduct.price;
    document.getElementById('editStock').value = currentEditingProduct.stock;
    document.getElementById('editModal').classList.add('show');
  }
}

function closeModal() {
  document.getElementById('editModal').classList.remove('show');
  currentEditingProduct = null;
}

// Salva edição no banco via POST
async function saveProduct() {
  if (!currentEditingProduct) return;

  const updatedData = {
    id: currentEditingProduct.id,
    name: document.getElementById('editName').value,
    description: document.getElementById('editDescription').value,
    price: parseFloat(document.getElementById('editPrice').value),
    stock: parseInt(document.getElementById('editStock').value)
  };

  try {
    const res = await fetch('/adm/produtos_adm/edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData)
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      alert('Erro ao salvar: ' + (data.error || 'tente novamente'));
      return;
    }

    // Atualiza localmente após confirmar
    currentEditingProduct.name = updatedData.name;
    currentEditingProduct.description = updatedData.description;
    currentEditingProduct.price = updatedData.price;
    currentEditingProduct.stock = updatedData.stock;

    displayProducts();
    updateSummary();
    closeModal();
  } catch (err) {
    console.error('Erro ao salvar produto:', err);
    alert('Erro de conexão ao salvar produto.');
  }
}

function filterProducts(event, filter) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  event.currentTarget.classList.add('active');
  document.getElementById('searchInput').value = '';
  displayProducts();
}

function setupEventListeners() {
  document.getElementById('searchInput').addEventListener('input', displayProducts);
  document.getElementById('editModal').addEventListener('click', (e) => {
    if (e.target.id === 'editModal') closeModal();
  });
}

async function toggleProductStatus(productId, newStatus) {
  const product = productsData.find(p => p.id === productId);
  if (!product) return;

  const isSuspending = newStatus === 'suspended';

  const title = isSuspending ? "Suspender Produto" : "Reativar Produto";
  const message = isSuspending
    ? `Deseja suspender o produto "${product.name}"?`
    : `Deseja reativar o produto "${product.name}"?`;

  openCustomModal(title, message, async () => {
    try {
      const res = await fetch('/adm/produtos_adm/toggle_status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId, status: newStatus })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao alterar status');
      }

      product.status = newStatus;
      displayProducts();
      updateSummary();

    } catch (err) {
      console.error(err);
      alert('Erro: ' + err.message);
    }
  });
}

function openCustomModal(title, message, onConfirm) {
  const modal = document.getElementById("customModal");

  if (!modal) {
    console.error("Modal não encontrado no HTML");
    return;
  }

  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalMessage").textContent = message;

  const confirmBtn = document.getElementById("confirmBtn");

  confirmBtn.onclick = null;

  confirmBtn.onclick = () => {
    onConfirm();
    closeCustomModal();
  };

  modal.classList.add("show");
}

function closeCustomModal() {
  const modal = document.getElementById("customModal");
  if (modal) modal.classList.remove("show");
}
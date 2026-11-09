const products = [
  { id: 1, name: "Refrigerante lata 350ml", category: "Bebidas", price: 5.50, stock: 4, emoji: "🥤", desc: "Bem geladinho para acompanhar." },
  { id: 2, name: "Água mineral 500ml", category: "Bebidas", price: 3.00, stock: 18, emoji: "💧", desc: "Com ou sem gás (consulte)." },
  { id: 3, name: "Cerveja lata 350ml", category: "Bebidas", price: 5.99, stock: 3, emoji: "🍺", desc: "Consumo proibido para menores de 18 anos." },
  { id: 4, name: "Salgadinho pacote", category: "Petiscos", price: 7.00, stock: 6, emoji: "🍿", desc: "Opção crocante para a fome." },
  { id: 5, name: "Amendoim torrado", category: "Petiscos", price: 4.50, stock: 2, emoji: "🥜", desc: "Petisco clássico." },
  { id: 6, name: "Chocolate", category: "Doces", price: 4.00, stock: 12, emoji: "🍫", desc: "Um docinho para qualquer hora." },
  { id: 7, name: "Biscoito recheado", category: "Doces", price: 3.50, stock: 15, emoji: "🍪", desc: "Lanchinho rápido." },
  { id: 8, name: "Macarrão instantâneo", category: "Mercearia", price: 3.99, stock: 5, emoji: "🍜", desc: "Prático e rápido de preparar." }
];

const money = value => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const productGrid = document.getElementById("product-grid");
const cartPanel = document.getElementById("cart-panel");
let cart = {};
try { cart = JSON.parse(localStorage.getItem("vaquinhas-cart") || "{}"); } catch { cart = {}; }
if (!cart || typeof cart !== "object" || Array.isArray(cart)) cart = {};

function saveCart() {
  try { localStorage.setItem("vaquinhas-cart", JSON.stringify(cart)); } catch { /* armazenamento indisponível */ }
}

function renderLowStock() {
  const list = document.getElementById("low-stock");
  if (!list) return;
  list.innerHTML = products.filter(product => product.stock <= 5)
    .map(product => `<li class="low-text">${product.name} — ${product.stock} un.</li>`).join("");
}

function renderProducts() {
  if (!productGrid) return;
  const query = (document.getElementById("search")?.value || "").trim().toLowerCase();
  const category = document.getElementById("category")?.value || "todos";
  const filtered = products.filter(product =>
    (product.name.toLowerCase().includes(query) || product.category.toLowerCase().includes(query)) &&
    (category === "todos" || product.category === category)
  );

  productGrid.innerHTML = filtered.length
    ? filtered.map(product => {
        const quantityInCart = Number(cart[product.id]) || 0;
        const unavailable = product.stock <= 0;
        return `
          <article class="product-card">
            <div class="product-emoji">${product.emoji}</div>
            <h3>${product.name}</h3>
            <p>${product.desc}</p>
            <div class="product-bottom">
              <strong>${money(product.price)}</strong>
              <span class="stock-badge ${product.stock <= 4 ? "low" : ""}">${unavailable ? "Esgotado" : product.stock <= 4 ? "Últimas unidades" : "Em estoque"}</span>
            </div>
            <button class="btn btn-add" type="button" data-add-product="${product.id}" ${unavailable || quantityInCart >= product.stock ? "disabled" : ""}>
              ${unavailable ? "Indisponível" : quantityInCart ? `Adicionar mais (${quantityInCart})` : "Adicionar à sacola"}
            </button>
          </article>`;
      }).join("")
    : '<p class="empty-products">Nenhum produto encontrado. Tente outra busca ou categoria.</p>';
}

function getCartItems() { return products.filter(product => (Number(cart[product.id]) || 0) > 0); }

function renderCart() {
  if (!cartPanel) return;
  // Corrige quantidades antigas ou inválidas e respeita o estoque demonstrativo.
  for (const id of Object.keys(cart)) {
    const product = products.find(item => item.id === Number(id));
    const quantity = Number(cart[id]);
    if (!product || !Number.isInteger(quantity) || quantity <= 0) delete cart[id];
    else cart[id] = Math.min(quantity, product.stock);
  }
  const items = getCartItems();
  const totalQuantity = items.reduce((sum, product) => sum + Number(cart[product.id]), 0);
  const totalPrice = items.reduce((sum, product) => sum + product.price * Number(cart[product.id]), 0);
  document.getElementById("cart-count").textContent = `${totalQuantity} ${totalQuantity === 1 ? "item" : "itens"} na sacola`;
  document.getElementById("cart-total").textContent = money(totalPrice);

  if (!items.length) {
    cartPanel.innerHTML = '<p class="cart-empty">Sua sacola está vazia. Escolha algum produto para começar!</p>';
  } else {
    cartPanel.innerHTML = `
      <div class="cart-panel-head"><h3>Sua sacola</h3><button class="cart-clear" type="button" data-cart-action="clear">Limpar sacola</button></div>
      ${items.map(product => `
        <div class="cart-item">
          <div class="cart-item-name"><span>${product.emoji}</span><div><strong>${product.name}</strong><small>${money(product.price)} cada</small></div></div>
          <div class="cart-controls"><button type="button" aria-label="Diminuir ${product.name}" data-cart-action="minus" data-product-id="${product.id}">−</button><span>${cart[product.id]}</span><button type="button" aria-label="Aumentar ${product.name}" data-cart-action="plus" data-product-id="${product.id}" ${cart[product.id] >= product.stock ? "disabled" : ""}>+</button></div>
          <strong class="cart-subtotal">${money(product.price * cart[product.id])}</strong>
        </div>`).join("")}
      <div class="cart-final"><span>Total demonstrativo</span><strong>${money(totalPrice)}</strong></div>
      <p class="cart-disclaimer">Esta é uma sacola demonstrativa. Ela não reserva produtos nem envia pedidos ou pagamentos.</p>`;
  }
  saveCart();
  renderProducts();
}

if (productGrid) {
  productGrid.addEventListener("click", event => {
    const button = event.target.closest("[data-add-product]");
    if (!button) return;
    const productId = Number(button.dataset.addProduct);
    const product = products.find(item => item.id === productId);
    if (!product || (Number(cart[productId]) || 0) >= product.stock) return;
    cart[productId] = (Number(cart[productId]) || 0) + 1;
    renderCart();
  });
  document.getElementById("search")?.addEventListener("input", renderProducts);
  document.getElementById("category")?.addEventListener("change", renderProducts);
}

if (cartPanel) {
  cartPanel.addEventListener("click", event => {
    const button = event.target.closest("[data-cart-action]");
    if (!button) return;
    const action = button.dataset.cartAction;
    if (action === "clear") {
      cart = {};
    } else {
      const productId = Number(button.dataset.productId);
      const product = products.find(item => item.id === productId);
      if (!product) return;
      if (action === "plus" && (Number(cart[productId]) || 0) < product.stock) cart[productId] += 1;
      if (action === "minus") {
        cart[productId] -= 1;
        if (cart[productId] <= 0) delete cart[productId];
      }
    }
    renderCart();
  });
  document.getElementById("cart-toggle")?.addEventListener("click", () => {
    cartPanel.hidden = !cartPanel.hidden;
    document.getElementById("cart-toggle").textContent = cartPanel.hidden ? "Ver sacola" : "Fechar sacola";
  });
  renderCart();
}

renderLowStock();

// Formulários demonstrativos: mostram confirmação local, sem enviar dados à internet.
document.querySelectorAll("form[data-demo-form]").forEach(form => {
  form.addEventListener("submit", event => {
    event.preventDefault();
    const note = form.querySelector(".form-note");
    if (note) note.textContent = "Dados registrados apenas nesta demonstração. Para receber envios reais, conecte o formulário a um servidor.";
    const button = form.querySelector("button[type='submit'], button:not([type])");
    if (button) button.disabled = true;
    form.reset();
  });
});

const adminForm = document.getElementById("admin-form");
if (adminForm) {
  adminForm.addEventListener("submit", event => {
    event.preventDefault();
    adminForm.hidden = true;
    const dashboard = document.getElementById("admin-dashboard");
    if (dashboard) dashboard.hidden = false;
  });
}

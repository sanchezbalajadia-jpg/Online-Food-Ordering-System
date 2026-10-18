const foods = [
  { id: 1, name: "Smash Burger", category: "Burgers", price: 189, emoji: "🍔", tag: "BESTSELLER", description: "Double smash patty, cheddar, house sauce." },
  { id: 2, name: "Classic Cheeseburger", category: "Burgers", price: 159, emoji: "🍔", tag: "CLASSIC", description: "Juicy beef, melted cheese, fresh lettuce." },
  { id: 3, name: "Pepperoni Pizza", category: "Pizza", price: 299, emoji: "🍕", tag: "POPULAR", description: "Pepperoni, mozzarella, rich tomato sauce." },
  { id: 4, name: "Four Cheese Pizza", category: "Pizza", price: 329, emoji: "🍕", tag: "", description: "A cheesy blend on a golden crust." },
  { id: 5, name: "Crispy Chicken", category: "Chicken", price: 179, emoji: "🍗", tag: "CRUNCHY", description: "Golden fried chicken with signature seasoning." },
  { id: 6, name: "Chicken Wings", category: "Chicken", price: 199, emoji: "🍗", tag: "", description: "Six wings tossed in a sweet-spicy glaze." },
  { id: 7, name: "Loaded Fries", category: "Sides", price: 119, emoji: "🍟", tag: "FAN FAVORITE", description: "Crispy fries topped with cheese sauce." },
  { id: 8, name: "Onion Rings", category: "Sides", price: 99, emoji: "🧅", tag: "", description: "Crunchy golden rings with dip." },
  { id: 9, name: "Iced Milk Tea", category: "Drinks", price: 89, emoji: "🧋", tag: "CHILLED", description: "Creamy milk tea with chewy pearls." },
  { id: 10, name: "Orange Soda", category: "Drinks", price: 59, emoji: "🥤", tag: "", description: "A fizzy, refreshing orange drink." },
  { id: 11, name: "Chocolate Cake", category: "Desserts", price: 129, emoji: "🍰", tag: "SWEET PICK", description: "Moist chocolate cake with rich frosting." },
  { id: 12, name: "Vanilla Ice Cream", category: "Desserts", price: 79, emoji: "🍨", tag: "", description: "Smooth vanilla ice cream, served chilled." }
];

const DELIVERY_FEE = 49;
const money = amount => new Intl.NumberFormat("en-PH", {
  style: "currency", currency: "PHP", minimumFractionDigits: 2
}).format(amount);

let cart = new Map();
let selectedCategory = "All";
let toastTimeout;

const foodGrid = document.getElementById("foodGrid");
const categoryList = document.getElementById("categoryList");
const searchInput = document.getElementById("searchInput");
const cartDrawer = document.getElementById("cartDrawer");
const drawerBackdrop = document.getElementById("drawerBackdrop");
const cartItems = document.getElementById("cartItems");
const cartEmpty = document.getElementById("cartEmpty");
const cartSummary = document.getElementById("cartSummary");
const checkoutBackdrop = document.getElementById("checkoutBackdrop");
const confirmationBackdrop = document.getElementById("confirmationBackdrop");
const checkoutForm = document.getElementById("checkoutForm");
const toast = document.getElementById("toast");

document.getElementById("year").textContent = new Date().getFullYear();

function renderMenu() {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = foods.filter(food => {
    const matchesCategory = selectedCategory === "All" || food.category === selectedCategory;
    const matchesSearch = `${food.name} ${food.category} ${food.description}`.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  foodGrid.innerHTML = filtered.map(food => `
    <article class="food-card">
      <div class="food-art">
        ${food.tag ? `<span class="food-tag">${food.tag}</span>` : ""}
        <span class="food-emoji" aria-hidden="true">${food.emoji}</span>
      </div>
      <div class="food-info">
        <p class="food-category">${food.category}</p>
        <h3 class="food-name">${food.name}</h3>
        <p class="food-description">${food.description}</p>
        <div class="food-bottom">
          <span class="food-price">${money(food.price)}</span>
          <button class="add-button" type="button" data-add="${food.id}" aria-label="Add ${food.name} to cart">+</button>
        </div>
      </div>
    </article>
  `).join("");

  document.getElementById("emptyMenu").classList.toggle("hidden", filtered.length > 0);
}

function cartQuantity() {
  return [...cart.values()].reduce((sum, item) => sum + item.quantity, 0);
}

function subtotal() {
  return [...cart.values()].reduce((sum, item) => sum + item.food.price * item.quantity, 0);
}

function deliveryFee() {
  return cart.size > 0 ? DELIVERY_FEE : 0;
}

function total() {
  return subtotal() + deliveryFee();
}

function addToCart(id) {
  const food = foods.find(item => item.id === id);
  if (!food) return;
  const existing = cart.get(id);
  if (existing) existing.quantity += 1;
  else cart.set(id, { food, quantity: 1 });
  renderCart();
  showToast(`${food.name} added to cart`);
}

function changeQuantity(id, change) {
  const item = cart.get(id);
  if (!item) return;
  item.quantity += change;
  if (item.quantity <= 0) cart.delete(id);
  renderCart();
}

function removeFromCart(id) {
  const item = cart.get(id);
  if (!item) return;
  cart.delete(id);
  renderCart();
  showToast(`${item.food.name} removed`);
}

function renderCart() {
  const count = cartQuantity();
  document.getElementById("cartCount").textContent = count;
  document.getElementById("cartTitleCount").textContent = `(${count})`;
  document.getElementById("subtotalAmount").textContent = money(subtotal());
  document.getElementById("deliveryAmount").textContent = money(deliveryFee());
  document.getElementById("totalAmount").textContent = money(total());
  document.getElementById("checkoutTotal").textContent = money(total());

  cartItems.innerHTML = [...cart.values()].map(({ food, quantity }) => `
    <div class="cart-row">
      <div class="cart-item-art" aria-hidden="true">${food.emoji}</div>
      <div>
        <p class="cart-item-name">${food.name}</p>
        <p class="cart-item-price">${money(food.price * quantity)}</p>
        <div class="quantity-control" aria-label="Quantity controls for ${food.name}">
          <button type="button" data-decrease="${food.id}" aria-label="Decrease ${food.name} quantity">−</button>
          <span>${quantity}</span>
          <button type="button" data-increase="${food.id}" aria-label="Increase ${food.name} quantity">+</button>
        </div>
      </div>
      <button class="remove-button" type="button" data-remove="${food.id}" aria-label="Remove ${food.name}" title="Remove item">✕</button>
    </div>
  `).join("");

  const isEmpty = cart.size === 0;
  cartEmpty.classList.toggle("visible", isEmpty);
  cartSummary.classList.toggle("empty", isEmpty);
}

function openCart() {
  cartDrawer.classList.add("open");
  drawerBackdrop.classList.add("open");
  cartDrawer.setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
  document.getElementById("closeCart").focus();
}

function closeCart() {
  cartDrawer.classList.remove("open");
  drawerBackdrop.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden", "true");
  if (!checkoutBackdrop.classList.contains("open") && !confirmationBackdrop.classList.contains("open")) {
    document.body.classList.remove("no-scroll");
  }
}

function openCheckout() {
  if (cart.size === 0) {
    showToast("Add an item before checking out");
    return;
  }
  closeCart();
  checkoutBackdrop.classList.add("open");
  document.body.classList.add("no-scroll");
  document.querySelector('#checkoutForm [name="customerName"]').focus();
}

function closeCheckout() {
  checkoutBackdrop.classList.remove("open");
  if (!cartDrawer.classList.contains("open") && !confirmationBackdrop.classList.contains("open")) {
    document.body.classList.remove("no-scroll");
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 2300);
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function placeOrder(event) {
  event.preventDefault();
  if (cart.size === 0) {
    closeCheckout();
    showToast("Your cart is empty");
    return;
  }
  if (!checkoutForm.reportValidity()) return;

  const formData = new FormData(checkoutForm);
  const orderId = `EE-${Date.now().toString().slice(-7)}`;
  const itemsSnapshot = [...cart.values()].map(({ food, quantity }) => ({
    name: food.name, quantity, lineTotal: food.price * quantity
  }));
  const orderTotal = total();
  const customerName = String(formData.get("customerName")).trim();
  const phone = String(formData.get("phone")).trim();
  const address = String(formData.get("address")).trim();
  const paymentMethod = String(formData.get("paymentMethod"));
  const notes = String(formData.get("notes") || "").trim();

  document.getElementById("confirmationMessage").textContent =
    `Thanks, ${customerName}! Your order summary is ready.`;
  document.getElementById("receiptBox").innerHTML = `
    <div class="receipt-line"><span>Order number</span><strong>${escapeHTML(orderId)}</strong></div>
    <div class="receipt-line"><span>Customer</span><strong>${escapeHTML(customerName)}</strong></div>
    <div class="receipt-line"><span>Contact</span><strong>${escapeHTML(phone)}</strong></div>
    <div class="receipt-line"><span>Address</span><strong>${escapeHTML(address)}</strong></div>
    <div class="receipt-line"><span>Payment</span><strong>${escapeHTML(paymentMethod)}</strong></div>
    ${itemsSnapshot.map(item => `<div class="receipt-line"><span>${item.quantity} × ${escapeHTML(item.name)}</span><strong>${money(item.lineTotal)}</strong></div>`).join("")}
    <div class="receipt-line"><span>Subtotal</span><strong>${money(subtotal())}</strong></div>
    <div class="receipt-line"><span>Delivery fee</span><strong>${money(deliveryFee())}</strong></div>
    ${notes ? `<div class="receipt-line"><span>Notes</span><strong>${escapeHTML(notes)}</strong></div>` : ""}
    <div class="receipt-line receipt-total"><span>Total paid / due</span><strong>${money(orderTotal)}</strong></div>
  `;

  // This demo intentionally does not save customer details or send data to a server.
  cart.clear();
  renderCart();
  checkoutForm.reset();
  closeCheckout();
  confirmationBackdrop.classList.add("open");
  document.body.classList.add("no-scroll");
  document.getElementById("finishOrder").focus();
}

categoryList.addEventListener("click", event => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  selectedCategory = button.dataset.category;
  categoryList.querySelectorAll(".category-button").forEach(item => {
    const active = item === button;
    item.classList.toggle("active", active);
    item.setAttribute("aria-pressed", String(active));
  });
  renderMenu();
});

foodGrid.addEventListener("click", event => {
  const button = event.target.closest("[data-add]");
  if (button) addToCart(Number(button.dataset.add));
});

cartItems.addEventListener("click", event => {
  const decrease = event.target.closest("[data-decrease]");
  const increase = event.target.closest("[data-increase]");
  const remove = event.target.closest("[data-remove]");
  if (decrease) changeQuantity(Number(decrease.dataset.decrease), -1);
  if (increase) changeQuantity(Number(increase.dataset.increase), 1);
  if (remove) removeFromCart(Number(remove.dataset.remove));
});

searchInput.addEventListener("input", renderMenu);
document.getElementById("cartToggle").addEventListener("click", openCart);
document.getElementById("closeCart").addEventListener("click", closeCart);
drawerBackdrop.addEventListener("click", closeCart);
document.getElementById("browseMenu").addEventListener("click", () => {
  closeCart();
  document.getElementById("menu").scrollIntoView({ behavior: "smooth" });
});
document.getElementById("checkoutButton").addEventListener("click", openCheckout);
document.getElementById("closeCheckout").addEventListener("click", closeCheckout);
checkoutBackdrop.addEventListener("click", event => {
  if (event.target === checkoutBackdrop) closeCheckout();
});
checkoutForm.addEventListener("submit", placeOrder);
document.getElementById("finishOrder").addEventListener("click", () => {
  confirmationBackdrop.classList.remove("open");
  document.body.classList.remove("no-scroll");
  document.getElementById("menu").scrollIntoView({ behavior: "smooth" });
});
confirmationBackdrop.addEventListener("click", event => {
  if (event.target === confirmationBackdrop) {
    confirmationBackdrop.classList.remove("open");
    document.body.classList.remove("no-scroll");
  }
});
document.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  if (confirmationBackdrop.classList.contains("open")) {
    confirmationBackdrop.classList.remove("open");
    document.body.classList.remove("no-scroll");
  } else if (checkoutBackdrop.classList.contains("open")) {
    closeCheckout();
  } else if (cartDrawer.classList.contains("open")) {
    closeCart();
  }
});

renderMenu();
renderCart();

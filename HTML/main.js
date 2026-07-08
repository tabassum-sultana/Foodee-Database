const menuItems = [
  {
    id: 1,
    name: "Smoky Chicken Pizza",
    category: "pizza",
    price: 12.99,
    rating: 4.9,
    tag: "Best Seller",
    description: "Smoked chicken, mozzarella, olives, onion, and house sauce.",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: 2,
    name: "Margherita Pizza",
    category: "pizza",
    price: 10.49,
    rating: 4.7,
    tag: "Classic",
    description: "Tomato, basil, mozzarella, and extra virgin olive oil.",
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: 3,
    name: "Classic Beef Burger",
    category: "burger",
    price: 9.49,
    rating: 4.8,
    tag: "Popular",
    description: "Beef patty, cheddar, lettuce, tomato, onion, and Foodee mayo.",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: 4,
    name: "Spicy Chicken Burger",
    category: "burger",
    price: 8.99,
    rating: 4.6,
    tag: "Spicy",
    description: "Crispy chicken, spicy sauce, pickles, and fresh slaw.",
    image: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: 5,
    name: "Chicken Biryani Bowl",
    category: "rice",
    price: 10.99,
    rating: 4.9,
    tag: "Chef Pick",
    description: "Aromatic rice, tender chicken, egg, salad, and raita.",
    image: "https://images.unsplash.com/photo-1563379091339-03246963d51a?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: 6,
    name: "Grilled Rice Platter",
    category: "rice",
    price: 11.49,
    rating: 4.7,
    tag: "Fresh",
    description: "Grilled chicken, butter rice, vegetables, and garlic sauce.",
    image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: 7,
    name: "Fresh Lemonade",
    category: "drinks",
    price: 3.49,
    rating: 4.8,
    tag: "Cold",
    description: "Mint lemonade with lemon slices and crushed ice.",
    image: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: 8,
    name: "Chocolate Lava Cake",
    category: "dessert",
    price: 5.99,
    rating: 4.9,
    tag: "Sweet",
    description: "Warm chocolate cake with a soft molten center.",
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=700&q=80"
  }
];

const deliveryCharge = 2.99;
const promoCode = "FOODEE10";
let activeCategory = "all";
let activePromo = "";
let cart = JSON.parse(localStorage.getItem("foodeeCart")) || [];

const menuGrid = document.querySelector("#menuGrid");
const searchInput = document.querySelector("#searchInput");
const cartItems = document.querySelector("#cartItems");
const cartCount = document.querySelector("#cartCount");
const subtotalEl = document.querySelector("#subtotal");
const discountEl = document.querySelector("#discount");
const deliveryEl = document.querySelector("#delivery");
const totalEl = document.querySelector("#total");
const clearCartButton = document.querySelector("#clearCart");
const checkoutForm = document.querySelector("#checkoutForm");
const orderType = document.querySelector("#orderType");
const orderMessage = document.querySelector("#orderMessage");
const promoInput = document.querySelector("#promoInput");
const applyPromo = document.querySelector("#applyPromo");
const promoMessage = document.querySelector("#promoMessage");
const tabs = document.querySelectorAll(".tab");

function formatPrice(value) {
  return `$${value.toFixed(2)}`;
}

function saveCart() {
  localStorage.setItem("foodeeCart", JSON.stringify(cart));
}

function getSubtotal() {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function getDiscount(subtotal) {
  if (activePromo !== promoCode || subtotal < 20) return 0;
  return subtotal * 0.1;
}

function getVisibleItems() {
  const searchText = searchInput.value.trim().toLowerCase();

  return menuItems.filter((item) => {
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchText)
      || item.description.toLowerCase().includes(searchText)
      || item.category.toLowerCase().includes(searchText);

    return matchesCategory && matchesSearch;
  });
}

function renderMenu() {
  const visibleItems = getVisibleItems();

  if (visibleItems.length === 0) {
    menuGrid.innerHTML = '<div class="empty-menu">No menu items found. Try another search.</div>';
    return;
  }

  menuGrid.innerHTML = visibleItems.map((item) => `
    <article class="menu-card">
      <div class="image-wrap">
        <img src="${item.image}" alt="${item.name}">
        <span>${item.tag}</span>
      </div>
      <div class="menu-card-body">
        <div class="card-title">
          <h3>${item.name}</h3>
          <small>${item.rating} rating</small>
        </div>
        <p>${item.description}</p>
        <div class="menu-meta">
          <span class="price">${formatPrice(item.price)}</span>
          <button class="add-btn" type="button" data-id="${item.id}">Add to cart</button>
        </div>
      </div>
    </article>
  `).join("");
}

function addToCart(id) {
  const item = menuItems.find((menuItem) => menuItem.id === id);
  const existingItem = cart.find((cartItem) => cartItem.id === id);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ ...item, quantity: 1 });
  }

  orderMessage.textContent = "";
  saveCart();
  renderCart();
}

function updateQuantity(id, change) {
  const item = cart.find((cartItem) => cartItem.id === id);

  if (!item) return;

  item.quantity += change;

  if (item.quantity <= 0) {
    cart = cart.filter((cartItem) => cartItem.id !== id);
  }

  saveCart();
  renderCart();
}

function renderCart() {
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = getSubtotal();
  const discount = getDiscount(subtotal);
  const delivery = orderType.value === "Pickup" || subtotal === 0 || subtotal >= 35 ? 0 : deliveryCharge;
  const total = Math.max(subtotal - discount + delivery, 0);

  cartCount.textContent = itemCount;
  subtotalEl.textContent = formatPrice(subtotal);
  discountEl.textContent = `-${formatPrice(discount)}`;
  deliveryEl.textContent = delivery === 0 ? "Free" : formatPrice(delivery);
  totalEl.textContent = formatPrice(total);

  if (cart.length === 0) {
    cartItems.innerHTML = '<div class="empty-cart">Your cart is empty. Add something delicious from the menu.</div>';
    return;
  }

  cartItems.innerHTML = cart.map((item) => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}">
      <div>
        <h3>${item.name}</h3>
        <p>${formatPrice(item.price)} each</p>
      </div>
      <div class="qty-controls" aria-label="Quantity controls for ${item.name}">
        <button type="button" data-action="decrease" data-id="${item.id}">-</button>
        <span>${item.quantity}</span>
        <button type="button" data-action="increase" data-id="${item.id}">+</button>
      </div>
    </div>
  `).join("");
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");
    activeCategory = tab.dataset.category;
    renderMenu();
  });
});

searchInput.addEventListener("input", renderMenu);

menuGrid.addEventListener("click", (event) => {
  const button = event.target.closest(".add-btn");
  if (!button) return;
  addToCart(Number(button.dataset.id));
});

cartItems.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const id = Number(button.dataset.id);
  const change = button.dataset.action === "increase" ? 1 : -1;
  updateQuantity(id, change);
});

clearCartButton.addEventListener("click", () => {
  cart = [];
  activePromo = "";
  promoInput.value = "";
  promoMessage.textContent = "";
  orderMessage.textContent = "";
  saveCart();
  renderCart();
});

applyPromo.addEventListener("click", () => {
  const subtotal = getSubtotal();
  const code = promoInput.value.trim().toUpperCase();

  if (code !== promoCode) {
    activePromo = "";
    promoMessage.textContent = "Invalid promo code.";
  } else if (subtotal < 20) {
    activePromo = "";
    promoMessage.textContent = "Add at least $20 to use FOODEE10.";
  } else {
    activePromo = promoCode;
    promoMessage.textContent = "Promo applied. You saved 10%.";
  }

  renderCart();
});

orderType.addEventListener("change", renderCart);

checkoutForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (cart.length === 0) {
    orderMessage.textContent = "Please add at least one item before placing your order.";
    return;
  }

  const formData = new FormData(checkoutForm);
  const name = formData.get("name");
  const type = formData.get("orderType");
  const payment = formData.get("paymentMethod");

  orderMessage.textContent = `Thank you, ${name}! Your ${type.toLowerCase()} order is confirmed. Payment: ${payment}.`;
  cart = [];
  activePromo = "";
  promoInput.value = "";
  promoMessage.textContent = "";
  checkoutForm.reset();
  saveCart();
  renderCart();
});

renderMenu();
renderCart();

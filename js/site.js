function asset(path) { return path; }
function page(path) { return `html/${path}`; }
function home() { return "index.html"; }

function showToast(message) {
  const toast = document.querySelector("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 1600);
}

const wishlistKey = "foodee-wishlist";
const customerKey = "foodee-customer";

function readCustomer() {
  try { return JSON.parse(localStorage.getItem(customerKey)); }
  catch { return null; }
}

function saveCustomer(customer) {
  const clean = {
    id: customer.id || customer.customerId || null,
    name: customer.name.trim(),
    phone: customer.phone.trim(),
    email: customer.email?.trim() || ""
  };
  localStorage.setItem(customerKey, JSON.stringify(clean));
  refreshCustomerUI();
  return clean;
}

function clearCustomer() {
  localStorage.removeItem(customerKey);
  refreshCustomerUI();
}

function requireCustomerLogin() {
  const customer = readCustomer();
  if (customer?.name && customer?.phone) return customer;
  openAuth(false);
  showToast("Name and phone required before order");
  return null;
}

function readWishlist() {
  try { return JSON.parse(localStorage.getItem(wishlistKey)) || []; }
  catch { return []; }
}

function writeWishlist(items) {
  localStorage.setItem(wishlistKey, JSON.stringify([...new Set(items)]));
  refreshWishlistButtons();
}

function isWishlisted(id) {
  return readWishlist().includes(id);
}

function toggleWishlist(id) {
  if (!id) return null;
  const customer = requireCustomerLogin();
  if (!customer) return null;
  const items = readWishlist();
  const exists = items.includes(id);
  const saved = !exists;
  writeWishlist(exists ? items.filter((item) => item !== id) : [...items, id]);
  window.FoodeeCart?.logActivity?.(saved ? "Added to wishlist" : "Removed from wishlist", id, 1);
  return !exists;
}

function refreshWishlistButtons() {
  const items = readWishlist();
  document.querySelectorAll("[data-wishlist]").forEach((button) => {
    const active = items.includes(button.dataset.wishlist);
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  document.querySelectorAll("[data-wishlist-count]").forEach((node) => {
    node.textContent = items.length;
  });
}

window.FoodeeWishlistRefresh = refreshWishlistButtons;

function heroArt(extraClass = "") {
  return `
    <div class="hero-art ${extraClass}" aria-label="Burger, fries and lime cooler">
      <img class="art-fries" src="${asset("assets/food/hero/hero-fries.png")}" alt="" />
      <img class="art-board" src="${asset("assets/food/hero/wood-board.png")}" alt="" />
      <img class="art-burger" src="${asset("assets/food/hero/hero-burger.png")}" alt="Cheese burger" />
      <img class="art-drink" src="${asset("assets/food/hero/hero-drink.png")}" alt="Lime mint cooler" />
      <img class="art-lime" src="${asset("assets/food/hero/lime-slice.png")}" alt="" />
      <img class="art-mint" src="${asset("assets/food/hero/mint.png")}" alt="" />
    </div>`;
}

function mountFooter() {
  const footer = document.querySelector(".site-footer");
  if (!footer) return;
  footer.innerHTML = `
    <div class="footer-inner">
      <div class="footer-brand">
        <a class="footer-logo" href="${home()}"><img src="${asset("assets/brand/logo.png")}" alt="Foodee" /></a>
        <p>Foodee brings fresh meals from trusted restaurants to your doorstep, fast and delicious every time.</p>
        <div class="social-links">
          <img src="${asset("assets/social/facebook.png")}" alt="Facebook" />
          <img src="${asset("assets/social/instagram.png")}" alt="Instagram" />
          <img src="${asset("assets/social/twitter.png")}" alt="Twitter" />
          <img src="${asset("assets/social/whatsapp.png")}" alt="WhatsApp" />
        </div>
      </div>
      <nav class="footer-links" aria-label="Quick links">
        <h3>Quick Links</h3>
        <a href="${home()}">Home</a>
        <a href="${page("menu.html")}">Menu</a>
        <a href="${page("about.html")}">About Us</a>
        <a href="${page("contact.html")}">Contact Us</a>
        <a href="${page("contact.html")}">FAQs</a>
        <a href="${home()}?admin=1">Admin Login</a>
      </nav>
      <div class="footer-contact">
        <h3>Contact Us</h3>
        <p><img src="${asset("assets/icons/phone-circle.png")}" alt="" />+880 1712 345 678</p>
        <p><img src="${asset("assets/contact/email.png")}" alt="" />hello@foodee.com.bd</p>
        <p><img src="${asset("assets/icons/location-pin.png")}" alt="" />Dhanmondi 27,<br />Dhaka 1209, Bangladesh</p>
      </div>
      <div class="footer-payments">
        <h3>We Accept</h3>
        <div class="payment-links">
          <span>VISA</span>
          <img src="${asset("assets/payments/mastercard.png")}" alt="Mastercard" />
          <img src="${asset("assets/payments/bkash.png")}" alt="bKash" />
          <img src="${asset("assets/payments/nagad.png")}" alt="Nagad" />
        </div>
      </div>
    </div>
    <div class="footer-bottom"><div class="footer-bottom-inner"><p>&copy; 2026 Foodee. All rights reserved.</p></div></div>`;
}

function mountAuth() {
  const mount = document.querySelector("#authMount");
  if (!mount) return;
  mount.innerHTML = `
    <div class="modal-backdrop" id="authModal" aria-hidden="true">
      <section class="auth-dialog" role="dialog" aria-modal="true" aria-label="Account access">
        <button class="close-modal" type="button" data-close-auth aria-label="Close">x</button>
        <div class="auth-mode-tabs" role="tablist" aria-label="Choose login type">
          <button class="active" type="button" data-auth-mode="login">Customer Login</button>
          <button type="button" data-auth-mode="register">Registration</button>
          <button type="button" data-auth-mode="admin">Admin Login</button>
        </div>
        <div class="auth-panel" id="signInPanel">
          <img class="auth-logo" src="${asset("assets/brand/logo.png")}" alt="Foodee" />
          <h2>Customer Login</h2>
          <p>Enter your name and phone number before placing an order.</p>
          <form id="signInForm">
            <label class="input-icon"><img src="${asset("assets/icons/user.png")}" alt="" /><input id="loginName" type="text" placeholder="Full name" required /></label>
            <label class="input-icon"><img src="${asset("assets/icons/phone-circle.png")}" alt="" /><input id="loginPhone" type="tel" placeholder="Phone number" required /></label>
            <button class="btn btn-primary" type="submit"><img src="${asset("assets/icons/user.png")}" alt="" />Continue</button>
          </form>
        </div>
        <div class="auth-panel hidden" id="signUpPanel">
          <img class="auth-logo" src="${asset("assets/brand/logo.png")}" alt="Foodee" />
          <h2>Create Account</h2>
          <p>Register once so your contact details stay with your orders.</p>
          <form id="signUpForm">
            <label class="input-icon"><img src="${asset("assets/icons/user.png")}" alt="" /><input id="signupName" type="text" placeholder="Full name" required /></label>
            <label class="input-icon"><img src="${asset("assets/icons/phone-circle.png")}" alt="" /><input id="signupPhone" type="tel" placeholder="Phone number" required /></label>
            <label class="input-icon"><img src="${asset("assets/icons/mail.png")}" alt="" /><input id="signupEmail" type="email" placeholder="Email address" required /></label>
            <button class="btn btn-primary" type="submit">Register</button>
          </form>
        </div>
        <div class="auth-panel hidden" id="adminLoginPanel">
          <img class="auth-logo" src="${asset("assets/brand/logo.png")}" alt="Foodee" />
          <h2>Admin Login</h2>
          <p>Restaurant management access for authorized admin only.</p>
          <form id="adminLoginForm">
            <label class="input-icon"><img src="${asset("assets/icons/user.png")}" alt="" /><input id="adminUsername" type="text" placeholder="Admin username" autocomplete="username" required /></label>
            <label class="input-icon"><img src="${asset("assets/icons/lock.png")}" alt="" /><input id="adminPassword" type="password" placeholder="Password" autocomplete="current-password" required /></label>
            <button class="btn btn-primary" type="submit">Open Admin Panel</button>
          </form>
        </div>
        <div class="auth-panel hidden" id="customerAccountPanel">
          <img class="auth-logo" src="${asset("assets/brand/logo.png")}" alt="Foodee" />
          <h2>My Account</h2>
          <p>Your saved account and contact information.</p>
          <div class="account-overview">
            <div class="account-avatar" data-account-avatar>C</div>
            <div><strong data-customer-name></strong><span data-customer-phone></span><span data-customer-email></span></div>
          </div>
          <div class="account-actions">
            <a class="btn btn-secondary" href="${page("menu.html")}">Browse Menu</a>
            <button class="btn btn-primary" type="button" data-customer-logout>Log Out</button>
          </div>
        </div>
      </section>
    </div>`;
}

function refreshCustomerUI() {
  const customer = readCustomer();
  document.querySelectorAll("[data-open-auth]").forEach((button) => {
    button.innerHTML = customer?.name
      ? `<img src="${asset("assets/icons/user.png")}" alt="" />${customer.name.split(" ")[0]}`
      : `<img src="${asset("assets/icons/user.png")}" alt="" />Login`;
  });
  document.querySelectorAll("[data-customer-name]").forEach((node) => {
    node.textContent = customer?.name || "";
  });
  document.querySelectorAll("[data-customer-phone]").forEach((node) => {
    node.textContent = customer?.phone || "";
  });
  document.querySelectorAll("[data-customer-email]").forEach((node) => {
    node.textContent = customer?.email || "Email not provided";
  });
  document.querySelectorAll("[data-account-avatar]").forEach((node) => {
    node.textContent = customer?.name?.trim()?.[0]?.toUpperCase() || "C";
  });
}

function productCard(product) {
  const saved = isWishlisted(product.id);
  return `
    <article class="product-card" data-id="${product.id}">
      <button class="wish-btn${saved ? " active" : ""}" type="button" data-wishlist="${product.id}" aria-pressed="${saved}" aria-label="Save ${product.name}"><img src="${asset("assets/icons/heart.png")}" alt="" /></button>
      <a class="product-image-link" href="${page(`product.html?id=${product.id}`)}" aria-label="View ${product.name}">
        <img class="product-image" src="${asset(product.image)}" alt="${product.name}" />
      </a>
      <div class="product-body">
        <h3>${product.name}</h3>
        <p>${product.desc}</p>
        <div class="product-bottom">
          <span class="rating"><img src="${asset("assets/icons/star-filled.png")}" alt="" />${product.rating}</span>
          <strong class="price">${FoodeeCart.money(product.price)}</strong>
          <button class="add-cart" type="button" data-add-cart="${product.id}" aria-label="Add ${product.name}"><img src="${asset("assets/icons/plus.png")}" alt="" /></button>
        </div>
      </div>
    </article>`;
}

function categoryCard(category) {
  return `<a class="category-card" href="${page(`menu.html?category=${encodeURIComponent(category.name)}`)}"><img src="${asset(category.icon)}" alt="" /><span>${category.name}</span></a>`;
}

function categoryTab(label, icon, active = false) {
  return `<button class="menu-tab${active ? " active" : ""}" type="button" data-category="${label}">${icon ? `<img src="${asset(icon)}" alt="" />` : ""}<span>${label}</span></button>`;
}

function headerSearch() {
  const input = document.querySelector("#globalSearch");
  if (!input) return;
  input.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const q = input.value.trim();
    location.href = `${page("menu.html")}${q ? `?q=${encodeURIComponent(q)}` : ""}`;
  });
}

function mountWishlistNav() {
  const cartButton = document.querySelector(".cart-button");
  if (!cartButton || document.querySelector(".wishlist-nav-button")) return;
  cartButton.insertAdjacentHTML("afterend", `
    <a class="wishlist-nav-button" href="${page("menu.html?wishlist=1")}" aria-label="Open wishlist">
      <img src="${asset("assets/icons/heart.png")}" alt="" />
      <span data-wishlist-count>0</span>
    </a>`);
}

function openAuth(mode = "login") {
  const modal = document.querySelector("#authModal");
  if (!modal) return;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  let selectedMode = mode === true ? "register" : (mode === false ? "login" : mode);
  if (selectedMode === "account" && !readCustomer()) selectedMode = "login";
  document.querySelector(".auth-mode-tabs")?.classList.toggle("hidden", selectedMode === "account");
  document.querySelector("#signInPanel")?.classList.toggle("hidden", selectedMode !== "login");
  document.querySelector("#signUpPanel")?.classList.toggle("hidden", selectedMode !== "register");
  document.querySelector("#adminLoginPanel")?.classList.toggle("hidden", selectedMode !== "admin");
  document.querySelector("#customerAccountPanel")?.classList.toggle("hidden", selectedMode !== "account");
  document.querySelectorAll("[data-auth-mode]").forEach((button) => {
    button.classList.toggle("active", button.dataset.authMode === selectedMode);
  });
}
function closeAuth() {
  const modal = document.querySelector("#authModal");
  if (!modal) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}

function initSite() {
  FoodeeCart.ensureDemoCart();
  mountFooter();
  mountAuth();
  mountWishlistNav();
  FoodeeCart.updateCount();
  refreshWishlistButtons();
  refreshCustomerUI();
  headerSearch();

  document.querySelectorAll("[data-open-auth]").forEach((button) => button.addEventListener("click", () => openAuth(readCustomer() ? "account" : "login")));
  document.addEventListener("click", (event) => {
    const wish = event.target.closest("[data-wishlist]");
    if (wish) {
      const saved = toggleWishlist(wish.dataset.wishlist);
      if (saved !== null) showToast(saved ? "Added to wishlist" : "Removed from wishlist");
      return;
    }
    const add = event.target.closest("[data-add-cart]");
    if (add) {
      const customer = requireCustomerLogin();
      if (!customer) return;
      const qty = Math.max(1, Number(add.dataset.addQty) || 1);
      FoodeeCart.add(add.dataset.addCart, qty);
      showToast("Added to cart");
    }
    if (event.target.closest("[data-customer-logout]")) {
      clearCustomer();
      closeAuth();
      showToast("Logged out successfully");
      return;
    }
    if (event.target.matches("[data-close-auth]") || event.target.id === "authModal") closeAuth();
  });
  document.querySelectorAll("[data-auth-mode]").forEach((button) => {
    button.addEventListener("click", () => openAuth(button.dataset.authMode));
  });
  async function handleCustomerLogin(event, nameSelector, phoneSelector) {
    event.preventDefault();
    const localCustomer = {
      name: document.querySelector(nameSelector).value,
      phone: document.querySelector(phoneSelector).value
    };
    let customer = localCustomer;
    try {
      if (window.FoodeeAPI?.loginCustomer) {
        customer = await window.FoodeeAPI.loginCustomer(localCustomer);
      }
    } catch {
      showToast("Saved locally. Backend login unavailable");
    }
    saveCustomer(customer);
    closeAuth();
    showToast("Customer logged in");
    window.dispatchEvent(new CustomEvent("foodee:customer-login"));
  }

  document.querySelector("#signInForm")?.addEventListener("submit", (event) => handleCustomerLogin(event, "#loginName", "#loginPhone"));
  document.querySelector("#signUpForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {
      name: document.querySelector("#signupName").value,
      phone: document.querySelector("#signupPhone").value,
      email: document.querySelector("#signupEmail").value
    };
    try {
      const customer = await FoodeeAPI.registerCustomer(payload);
      saveCustomer(customer);
      closeAuth();
      showToast("Registration completed");
      window.dispatchEvent(new CustomEvent("foodee:customer-login"));
    } catch (error) {
      if (/server not connected|backend not found/i.test(error.message)) {
        saveCustomer(payload);
        closeAuth();
        showToast("Account saved on this device. Start the server to save it in MySQL.");
        window.dispatchEvent(new CustomEvent("foodee:customer-login"));
      } else {
        showToast(error.message);
      }
    }
  });
  document.querySelector("#adminLoginForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const session = await FoodeeAPI.loginAdmin({
        username: document.querySelector("#adminUsername").value,
        password: document.querySelector("#adminPassword").value
      });
      localStorage.setItem("foodee-admin-session", JSON.stringify(session));
      location.href = page("admin.html");
    } catch (error) {
      showToast(error.message);
    }
  });

  const requestedMode = new URLSearchParams(location.search).get("admin") === "1" ? "admin" : null;
  if (requestedMode) openAuth(requestedMode);
}

document.addEventListener("DOMContentLoaded", initSite);

(() => {
  function setActiveNav() {
    const pageName = document.body?.dataset?.page || "home";
    const nav = document.querySelector(".nav-links");
    if (!nav) return;

    const activeByPage = {
      home: "index.html",
      menu: "menu.html",
      about: "about.html",
      contact: "contact.html",
      admin: "admin.html",
      product: "menu.html",
      cart: "cart.html",
      checkout: "cart.html",
      success: "cart.html"
    };

    const target = activeByPage[pageName] || "index.html";
    nav.querySelectorAll("a").forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href")?.includes(target));
    });
  }

  function setMobileMenu(header, button, open) {
    header.classList.toggle("mobile-open", open);
    button.classList.toggle("is-open", open);
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  function initMobileMenu() {
    const header = document.querySelector(".site-header");
    const shell = document.querySelector(".header-shell");
    const nav = document.querySelector(".nav-links");
    if (!header || !shell || !nav) return;

    let button = shell.querySelector(".mobile-menu-toggle");
    if (!button) {
      button = document.createElement("button");
      button.type = "button";
      button.className = "mobile-menu-toggle";
      nav.insertAdjacentElement("beforebegin", button);
    }

    button.innerHTML = "<span></span><span></span><span></span>";
    button.setAttribute("aria-label", "Open menu");
    button.setAttribute("aria-expanded", "false");

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      setMobileMenu(header, button, !header.classList.contains("mobile-open"));
    });

    document.addEventListener("click", (event) => {
      if (!header.classList.contains("mobile-open")) return;
      if (header.contains(event.target)) return;
      setMobileMenu(header, button, false);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setMobileMenu(header, button, false);
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setMobileMenu(header, button, false));
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 920) setMobileMenu(header, button, false);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    setActiveNav();
    initMobileMenu();
  });
})();


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
  if (!id) return false;
  const items = readWishlist();
  const exists = items.includes(id);
  writeWishlist(exists ? items.filter((item) => item !== id) : [...items, id]);
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
    <div class="footer-bottom"><div class="footer-bottom-inner"><p>&copy; 2025 Foodee. All rights reserved.</p></div></div>`;
}

function mountAuth() {
  const mount = document.querySelector("#authMount");
  if (!mount) return;
  mount.innerHTML = `
    <div class="modal-backdrop" id="authModal" aria-hidden="true">
      <section class="auth-dialog" role="dialog" aria-modal="true" aria-label="Account">
        <button class="close-modal" type="button" data-close-auth aria-label="Close">x</button>
        <div class="auth-panel" id="signInPanel">
          <img class="auth-logo" src="${asset("assets/brand/logo.png")}" alt="Foodee" />
          <h2>Welcome Back</h2>
          <p>Sign in to continue ordering your favorite meals.</p>
          <form id="signInForm">
            <label class="input-icon"><img src="${asset("assets/icons/mail.png")}" alt="" /><input type="text" placeholder="Email or phone number" required /></label>
            <label class="input-icon"><img src="${asset("assets/icons/lock.png")}" alt="" /><input type="password" placeholder="Password" required /><img src="${asset("assets/icons/eye.png")}" alt="" /></label>
            <a class="forgot-link" href="${page("contact.html")}">Forgot Password?</a>
            <button class="btn btn-primary" type="submit"><img src="${asset("assets/icons/user.png")}" alt="" />Sign In</button>
          </form>
          <div class="divider"><span>or continue with</span></div>
          <div class="social-auth"><button type="button">G Google</button><button type="button"><img src="${asset("assets/social/facebook.png")}" alt="" />Facebook</button><button type="button"><img src="${asset("assets/payments/apple.png")}" alt="" />Apple</button></div>
          <p>Don't have an account? <button type="button" id="switchToSignUp">Create Account</button></p>
        </div>
        <div class="auth-panel hidden" id="signUpPanel">
          <img class="auth-logo" src="${asset("assets/brand/logo.png")}" alt="Foodee" />
          <h2>Create Account</h2>
          <p>Create an account and enjoy fast delivery from Foodee.</p>
          <form id="signUpForm">
            <label class="input-icon"><img src="${asset("assets/icons/user.png")}" alt="" /><input type="text" placeholder="Full Name" required /></label>
            <label class="input-icon"><img src="${asset("assets/icons/mail.png")}" alt="" /><input type="text" placeholder="Email or phone number" required /></label>
            <label class="input-icon"><img src="${asset("assets/icons/lock.png")}" alt="" /><input type="password" placeholder="Password" required /><img src="${asset("assets/icons/eye-off.png")}" alt="" /></label>
            <label class="input-icon"><img src="${asset("assets/icons/lock.png")}" alt="" /><input type="password" placeholder="Confirm Password" required /><img src="${asset("assets/icons/eye.png")}" alt="" /></label>
            <label class="check-label"><input type="checkbox" required /> I agree to the <span>Terms & Conditions</span> and <span>Privacy Policy</span></label>
            <button class="btn btn-primary" type="submit">Create Account</button>
          </form>
          <div class="divider"><span>or continue with</span></div>
          <div class="social-auth"><button type="button">G Google</button><button type="button"><img src="${asset("assets/social/facebook.png")}" alt="" />Facebook</button><button type="button"><img src="${asset("assets/payments/apple.png")}" alt="" />Apple</button></div>
          <p>Already have an account? <button type="button" id="switchToSignIn">Sign In</button></p>
        </div>
      </section>
    </div>`;
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

function openAuth(showSignUp = false) {
  const modal = document.querySelector("#authModal");
  if (!modal) return;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.querySelector("#signInPanel")?.classList.toggle("hidden", showSignUp);
  document.querySelector("#signUpPanel")?.classList.toggle("hidden", !showSignUp);
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
  headerSearch();

  document.querySelectorAll("[data-open-auth]").forEach((button) => button.addEventListener("click", () => openAuth(false)));
  document.addEventListener("click", (event) => {
    const wish = event.target.closest("[data-wishlist]");
    if (wish) {
      const saved = toggleWishlist(wish.dataset.wishlist);
      showToast(saved ? "Added to wishlist" : "Removed from wishlist");
      return;
    }
    const add = event.target.closest("[data-add-cart]");
    if (add) {
      const qty = Math.max(1, Number(add.dataset.addQty) || 1);
      FoodeeCart.add(add.dataset.addCart, qty);
      showToast("Added to cart");
    }
    if (event.target.matches("[data-close-auth]") || event.target.id === "authModal") closeAuth();
  });
  document.querySelector("#switchToSignUp")?.addEventListener("click", () => openAuth(true));
  document.querySelector("#switchToSignIn")?.addEventListener("click", () => openAuth(false));
  document.querySelector("#signInForm")?.addEventListener("submit", (event) => { event.preventDefault(); closeAuth(); showToast("Signed in successfully"); });
  document.querySelector("#signUpForm")?.addEventListener("submit", (event) => { event.preventDefault(); closeAuth(); showToast("Account created"); });
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


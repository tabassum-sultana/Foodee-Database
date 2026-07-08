document.addEventListener("DOMContentLoaded", async () => {
  try {
    await FoodeeAPI.loadProducts();
  } catch {
    // Static data remains available when the backend is not running.
  }

  const tabs = document.querySelector("#categoryList");
  const grid = document.querySelector("#menuProducts");
  const search = document.querySelector("#menuSearch");
  const params = new URLSearchParams(location.search);
  let currentCategory = params.get("category") || "All";
  let query = params.get("q") || "";
  let wishlistOnly = params.get("wishlist") === "1";
  if (search) search.value = query;

  function savedWishlist() {
    try { return JSON.parse(localStorage.getItem("foodee-wishlist")) || []; }
    catch { return []; }
  }

  function renderTabs() {
    if (!tabs) return;
    const allTab = categoryTab("All", "assets/icons/menu-list.png", currentCategory === "All");
    const catTabs = FoodeeData.categories.map((cat) => categoryTab(cat.name, cat.icon, currentCategory === cat.name)).join("");
    tabs.innerHTML = allTab + catTabs;
  }

  function renderProducts() {
    if (!grid) return;
    const q = query.toLowerCase();
    const saved = savedWishlist();
    const products = FoodeeData.products.filter((product) => {
      const byCat = currentCategory === "All" || product.category === currentCategory;
      const byQuery = !q || `${product.name} ${product.category} ${product.desc}`.toLowerCase().includes(q);
      const byWishlist = !wishlistOnly || saved.includes(product.id);
      return byCat && byQuery && byWishlist;
    });
    grid.innerHTML = products.length ? products.map(productCard).join("") : `<div class="empty-state">${wishlistOnly ? "No wishlist items yet." : "No dishes found."}</div>`;
    window.FoodeeWishlistRefresh?.();
  }

  renderTabs();
  renderProducts();
  tabs?.addEventListener("click", (event) => {
    const button = event.target.closest(".menu-tab");
    if (!button) return;
    wishlistOnly = false;
    currentCategory = button.dataset.category;
    renderTabs();
    renderProducts();
  });
  search?.addEventListener("input", () => {
    query = search.value.trim();
    renderProducts();
  });
});

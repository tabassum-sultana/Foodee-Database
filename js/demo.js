document.addEventListener("DOMContentLoaded", () => {
  const status = document.querySelector("#dbStatus");
  const cards = document.querySelector("#demoTableCards");
  const refresh = document.querySelector("#refreshDemo");

  const labels = {
    categories: "Food categories",
    products: "Menu products",
    admin_users: "Admin table",
    customers: "Customer login",
    orders: "Order bills",
    order_items: "Ordered foods",
    contacts: "Contact messages",
    cart_events: "Cart / wishlist activity"
  };

  async function load() {
    try {
      const data = await FoodeeAPI.getDatabaseTables();
      status.textContent = "DB Connected";
      status.classList.remove("offline");
      cards.innerHTML = Object.entries(labels).map(([table, label]) => `
        <article class="demo-table-card">
          <span>${table}</span>
          <strong>${data.tables?.[table] ?? 0}</strong>
          <span>${label}</span>
        </article>
      `).join("");
    } catch (error) {
      status.textContent = "DB Offline";
      status.classList.add("offline");
      cards.innerHTML = `<article class="demo-table-card"><span>Database</span><strong>Offline</strong><span>${error.message}</span></article>`;
    }
  }

  refresh?.addEventListener("click", load);
  load();
});

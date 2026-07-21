document.addEventListener("DOMContentLoaded", () => {
  const tableCards = document.querySelector("#tableCards");
  const ordersTableBody = document.querySelector("#ordersTableBody");
  const cartTableBody = document.querySelector("#cartTableBody");
  const wishlistTableBody = document.querySelector("#wishlistTableBody");
  const customersTableBody = document.querySelector("#customersTableBody");
  const dbConnectedPill = document.querySelector("#dbConnectedPill");
  const refresh = document.querySelector("#refreshTables");

  function money(value) {
    return FoodeeCart.money(Number(value || 0));
  }

  function date(value) {
    if (!value) return "Just now";
    return new Intl.DateTimeFormat("en-BD", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(value));
  }

  function emptyRow(message, columns) {
    return `<tr><td class="muted-cell" colspan="${columns}">${message}</td></tr>`;
  }

  function renderTableCards(data) {
    const tables = data?.tables || {};
    const rows = [
      ["categories", "Food category table"],
      ["products", "Menu product table"],
      ["admin_users", "Admin panel table"],
      ["customers", "Customer login table"],
      ["orders", "Order bill table"],
      ["order_items", "Ordered food details"],
      ["contacts", "Contact message table"],
      ["cart_events", "Add-to-cart activity"]
    ];

    tableCards.innerHTML = rows.map(([name, label]) => `
      <article class="db-card">
        <span>${name}</span>
        <strong>${tables[name] ?? 0}</strong>
        <span>${label}</span>
      </article>
    `).join("");
  }

  function renderOrders(orders) {
    ordersTableBody.innerHTML = orders.length ? orders.map((order) => `
      <tr>
        <td><strong>${order.orderCode || order.id}</strong></td>
        <td>${order.customerName || order.customer?.name || "Guest customer"}</td>
        <td>${order.phone || order.customer?.phone || "Not given"}</td>
        <td>${(order.items || []).map((item) => `${item.productName || item.name} x${item.quantity || item.qty}`).join("<br>") || "No items"}</td>
        <td>${order.paymentMethod || order.method || "Not selected"}<br><span class="muted-cell">${order.orderStatus || order.status || "Placed"}</span></td>
        <td><strong>${money(order.total)}</strong><br><span class="muted-cell">Subtotal ${money(order.subtotal)}</span></td>
        <td>${date(order.createdAt)}</td>
      </tr>
    `).join("") : emptyRow("No orders yet. Place an order from checkout to create rows.", 7);
  }

  function renderCartEvents(events) {
    events = events || [];
    const cartEvents = events.filter((entry) => !/wishlist/i.test(entry.action || ""));
    cartTableBody.innerHTML = cartEvents.length ? cartEvents.slice(0, 80).map((entry) => `
      <tr>
        <td>${entry.customerName || "Guest"}<br><span class="muted-cell">${entry.phone || entry.sessionId || "No phone/session"}</span></td>
        <td>${entry.action || "Added to cart"}</td>
        <td>${entry.productName || "Unknown food"}${entry.optionSummary ? `<br><span class="muted-cell">${entry.optionSummary}</span>` : ""}</td>
        <td>${entry.qty || 1}</td>
        <td>${money(entry.unitPrice)}</td>
        <td>${money(entry.cartTotal)}</td>
        <td>${date(entry.createdAt)}</td>
      </tr>
    `).join("") : emptyRow("No cart activity yet. Login and add food from menu to create rows.", 7);
  }

  function renderWishlistEvents(events) {
    events = events || [];
    const wishlistEvents = events.filter((entry) => /wishlist/i.test(entry.action || ""));
    wishlistTableBody.innerHTML = wishlistEvents.length ? wishlistEvents.slice(0, 80).map((entry) => `
      <tr>
        <td><strong>${entry.customerName || "Guest"}</strong></td>
        <td>${entry.phone || "No phone"}</td>
        <td>${entry.action || "Wishlist"}</td>
        <td>${entry.productName || "Unknown food"}</td>
        <td>${entry.category || "No category"}</td>
        <td>${date(entry.createdAt)}</td>
      </tr>
    `).join("") : emptyRow("No wishlist activity yet. Login and click heart icon to create rows.", 6);
  }

  function renderCustomers(customers) {
    customersTableBody.innerHTML = customers.length ? customers.map((customer) => `
      <tr>
        <td><strong>${customer.name || "Customer"}</strong></td>
        <td>${customer.phone || "Not given"}</td>
        <td>${customer.totalOrders || 0}</td>
        <td>${money(customer.totalSpent)}</td>
        <td>${customer.cartItems || 0}</td>
        <td>${customer.wishlistItems || 0}</td>
      </tr>
    `).join("") : emptyRow("No customers yet. Login/order will create rows.", 6);
  }

  async function load() {
    try {
      const [tables, orders, events, customers] = await Promise.all([
        FoodeeAPI.getDatabaseTables(),
        FoodeeAPI.getOrders(),
        FoodeeAPI.getCartEvents(),
        FoodeeAPI.getCustomers()
      ]);
      renderTableCards(tables);
      if (dbConnectedPill) {
        dbConnectedPill.textContent = "DB Connected";
        dbConnectedPill.classList.remove("offline");
      }
      renderOrders(Array.isArray(orders) ? orders : []);
      renderCartEvents(Array.isArray(events) ? events : []);
      renderWishlistEvents(Array.isArray(events) ? events : []);
      renderCustomers(Array.isArray(customers) ? customers : []);
    } catch (error) {
      if (dbConnectedPill) {
        dbConnectedPill.textContent = "DB Offline";
        dbConnectedPill.classList.add("offline");
      }
      tableCards.innerHTML = `<article class="db-card"><span>Database</span><strong>Offline</strong><span>${error.message}</span></article>`;
      renderOrders([]);
      renderCartEvents([]);
      renderWishlistEvents([]);
      renderCustomers([]);
    }
  }

  refresh?.addEventListener("click", load);
  load();
});

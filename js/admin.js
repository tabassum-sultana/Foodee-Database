document.addEventListener("DOMContentLoaded", () => {
  const orderList = document.querySelector("#orderList");
  const searchDetailList = document.querySelector("#searchDetailList");
  const currentCartList = document.querySelector("#currentCartList");
  const activityList = document.querySelector("#activityList");
  const wishlistList = document.querySelector("#wishlistList");
  const contactList = document.querySelector("#contactList");
  const customerList = document.querySelector("#customerList");
  const productList = document.querySelector("#productList");
  const ordersTableBody = document.querySelector("#ordersTableBody");
  const cartTableBody = document.querySelector("#cartTableBody");
  const customersTableBody = document.querySelector("#customersTableBody");
  const search = document.querySelector("#adminSearch");
  const refresh = document.querySelector("#refreshAdmin");
  const clearAdmin = document.querySelector("#clearAdmin");
  let orders = [];
  let contacts = [];
  let customers = [];
  let events = [];
  let query = "";

  function date(value) {
    if (!value) return "Just now";
    return new Intl.DateTimeFormat("en-BD", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(value));
  }

  function imageFor(id, fallback = "") {
    return FoodeeCart.product(id)?.image || fallback || "assets/brand/logo-mark.png";
  }

  function normalizeOrder(order) {
    const totals = order.totals || {};
    const customer = order.customer || {
      name: order.customerName,
      phone: order.phone,
      address: order.address,
      note: order.note
    };
    const items = (order.items || []).map((item) => ({
      id: item.id || item.productId,
      name: item.name || item.productName,
      qty: Number(item.qty || item.quantity || 0),
      price: Number(item.price || item.unitPrice || 0),
      lineTotal: Number(item.lineTotal || (item.price || item.unitPrice || 0) * (item.qty || item.quantity || 0))
    }));

    return {
      id: order.id,
      orderCode: order.orderCode,
      customer,
      items,
      subtotal: Number(totals.subtotal ?? order.subtotal ?? items.reduce((sum, item) => sum + item.lineTotal, 0)),
      delivery: Number(totals.delivery ?? order.deliveryFee ?? 0),
      discount: Number(totals.discount ?? order.discount ?? 0),
      total: Number(totals.total ?? order.total ?? 0),
      method: order.method || order.paymentMethod || "Not selected",
      status: order.status || order.paymentStatus || order.orderStatus || "Placed",
      sessionId: order.sessionId,
      createdAt: order.createdAt
    };
  }

  function mergeOrders(apiOrders = []) {
    const map = new Map();
    [...FoodeeCart.localOrders(), ...apiOrders].forEach((order) => {
      if (!order?.orderCode) return;
      map.set(order.orderCode, { ...map.get(order.orderCode), ...order });
    });
    return [...map.values()].map(normalizeOrder).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  function renderStats(filteredOrders) {
    const cartCount = FoodeeCart.read().reduce((sum, item) => sum + item.qty, 0);
    const wishlistCount = readWishlist().length;
    const pending = filteredOrders.filter((order) => /pending|placed/i.test(order.status)).length;
    const revenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    document.querySelector("#statOrders").textContent = filteredOrders.length;
    document.querySelector("#statRevenue").textContent = FoodeeCart.money(revenue);
    document.querySelector("#statCart").textContent = cartCount;
    document.querySelector("#statPending").textContent = pending;
    document.querySelector("#statWishlist").textContent = wishlistCount;
    document.querySelector("#statContacts").textContent = contacts.length;
  }

  function renderDatabaseStatus(status) {
    const card = document.querySelector("#dbStatusCard");
    const value = document.querySelector("#statDatabase");
    if (!card || !value) return;
    card.classList.toggle("connected", Boolean(status?.ok));
    card.classList.toggle("disconnected", !status?.ok);
    value.textContent = status?.ok ? "Connected" : "Offline";
    card.title = status?.ok ? `Connected to ${status.dbName || "database"}` : (status?.message || "Database connection unavailable");
  }

  function readWishlist() {
    try { return JSON.parse(localStorage.getItem("foodee-wishlist")) || []; }
    catch { return []; }
  }

  function readLocalContacts() {
    try { return JSON.parse(localStorage.getItem("foodee-local-contacts")) || []; }
    catch { return []; }
  }

  function orderMatches(order) {
    if (!query) return true;
    const blob = [
      order.orderCode,
      order.customer?.name,
      order.customer?.phone,
      order.customer?.address,
      order.sessionId,
      order.method,
      order.status,
      ...order.items.map((item) => item.name)
    ].join(" ").toLowerCase();
    return blob.includes(query);
  }

  function renderOrders() {
    const filteredOrders = orders.filter(orderMatches);
    renderStats(filteredOrders);
    if (!orderList) return;
    orderList.innerHTML = filteredOrders.length ? filteredOrders.map((order) => `
      <article class="order-card">
        <div class="order-top">
          <div>
            <div class="order-code">
              <strong>${order.orderCode}</strong>
              <span class="status-pill ${/pending/i.test(order.status) ? "pending" : ""}">${order.status}</span>
            </div>
            <div class="customer-lines">
              <span><strong>Customer:</strong> ${order.customer?.name || "Guest customer"}</span>
              <span><strong>Phone:</strong> ${order.customer?.phone || "Not given"}</span>
              <span><strong>Address:</strong> ${order.customer?.address || "Not given"}</span>
              ${order.customer?.note ? `<span><strong>Note:</strong> ${order.customer.note}</span>` : ""}
              <span><strong>Payment:</strong> ${order.method}</span>
              <span><strong>Subtotal:</strong> ${FoodeeCart.money(order.subtotal)} | <strong>Delivery:</strong> ${FoodeeCart.money(order.delivery)} | <strong>Discount:</strong> ${FoodeeCart.money(order.discount)}</span>
              <span class="order-meta">${date(order.createdAt)}</span>
            </div>
          </div>
          <div class="order-total">
            <span>Grand total</span>
            <strong>${FoodeeCart.money(order.total)}</strong>
            <span>Delivery ${FoodeeCart.money(order.delivery)} | Discount ${FoodeeCart.money(order.discount)}</span>
          </div>
        </div>
        <div class="order-items">
          ${order.items.map((item) => `
            <div class="order-item">
              <img src="${asset(imageFor(item.id))}" alt="${item.name}" />
              <div><h3>${item.name}</h3><p>${item.qty} x ${FoodeeCart.money(item.price)}</p></div>
              <strong class="line-price">${FoodeeCart.money(item.lineTotal)}</strong>
            </div>
          `).join("")}
        </div>
      </article>
    `).join("") : `<div class="empty-admin">${query ? "No matching orders. Cart activity, menu matches, messages, and bill details will appear below when available." : "No orders found yet. Place an order from the menu to see it here."}</div>`;
    renderSearchDetails(filteredOrders);
  }

  function includesQuery(parts) {
    if (!query) return false;
    return parts.filter(Boolean).join(" ").toLowerCase().includes(query);
  }

  function customerForSession(sessionId) {
    return orders.find((order) => order.sessionId && order.sessionId === sessionId)?.customer;
  }

  function renderSearchDetails(filteredOrders) {
    if (!searchDetailList) return;
    if (!query) {
      searchDetailList.innerHTML = "";
      return;
    }

    const matchedSessions = new Set(filteredOrders.map((order) => order.sessionId).filter(Boolean));
    const matchedEvents = mergeEvents(events).filter((entry) => {
      const matchedByText = includesQuery([
        entry.sessionId,
        entry.action,
        entry.productName,
        entry.category,
        FoodeeCart.money(entry.unitPrice || 0)
      ]);
      return matchedByText || matchedSessions.has(entry.sessionId);
    });
    const matchedContacts = contacts.filter((contact) => includesQuery([
      contact.name,
      contact.email,
      contact.subject,
      contact.message
    ]));
    const matchedProducts = FoodeeData.products.filter((product) => includesQuery([
      product.name,
      product.category,
      product.desc,
      FoodeeCart.money(product.price)
    ])).slice(0, 8);
    const itemCount = filteredOrders.reduce((sum, order) => sum + order.items.reduce((total, item) => total + item.qty, 0), 0);
    const subtotal = filteredOrders.reduce((sum, order) => sum + order.subtotal, 0);
    const delivery = filteredOrders.reduce((sum, order) => sum + order.delivery, 0);
    const discount = filteredOrders.reduce((sum, order) => sum + order.discount, 0);
    const total = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    const hasResult = filteredOrders.length || matchedEvents.length || matchedContacts.length || matchedProducts.length;

    searchDetailList.innerHTML = `
      <section class="search-details">
        <div class="panel-head compact">
          <div>
            <h2>Search Details</h2>
            <p>Showing everything matched with "${query}".</p>
          </div>
        </div>
        ${hasResult ? `
          <div class="bill-summary">
            <article><span>Matched orders</span><strong>${filteredOrders.length}</strong></article>
            <article><span>Food items</span><strong>${itemCount}</strong></article>
            <article><span>Subtotal</span><strong>${FoodeeCart.money(subtotal)}</strong></article>
            <article><span>Delivery</span><strong>${FoodeeCart.money(delivery)}</strong></article>
            <article><span>Discount</span><strong>${FoodeeCart.money(discount)}</strong></article>
            <article><span>Total bill</span><strong>${FoodeeCart.money(total)}</strong></article>
          </div>
          ${filteredOrders.length ? `<div class="detail-block"><h3>Customer Orders</h3>${filteredOrders.map((order) => `
            <div class="detail-row">
              <div>
                <strong>${order.customer?.name || "Guest customer"} | ${order.orderCode}</strong>
                <p>${order.customer?.phone || "No phone"} | ${order.customer?.address || "No address"} | Session ${order.sessionId || "N/A"}</p>
                <p>${order.items.map((item) => `${item.name} x${item.qty}`).join(", ")}</p>
              </div>
              <strong class="line-price">${FoodeeCart.money(order.total)}</strong>
            </div>
          `).join("")}</div>` : ""}
          ${matchedEvents.length ? `<div class="detail-block"><h3>Cart / Wishlist Activity</h3>${matchedEvents.slice(0, 12).map((entry) => {
            const customer = customerForSession(entry.sessionId);
            return `
              <div class="detail-row">
                <div>
                  <strong>${customer?.name || "Guest/session customer"} | ${entry.action}</strong>
                  <p>${entry.productName}${entry.qty ? ` x${entry.qty}` : ""} | Session ${entry.sessionId}</p>
                  <p>${date(entry.createdAt)}</p>
                </div>
                <strong class="line-price">${FoodeeCart.money((entry.unitPrice || 0) * (entry.qty || 1))}</strong>
              </div>`;
          }).join("")}</div>` : ""}
          ${matchedContacts.length ? `<div class="detail-block"><h3>Messages</h3>${matchedContacts.map((contact) => `
            <div class="detail-row">
              <div>
                <strong>${contact.name || "Guest"} | ${contact.subject || "Message"}</strong>
                <p>${contact.email || "No email"}</p>
                <p>${contact.message || ""}</p>
              </div>
            </div>
          `).join("")}</div>` : ""}
          ${matchedProducts.length && !filteredOrders.length ? `<div class="detail-block"><h3>Menu Matches</h3>${matchedProducts.map((product) => `
            <div class="detail-row">
              <div>
                <strong>${product.name}</strong>
                <p>${product.category} | ${product.desc}</p>
              </div>
              <strong class="line-price">${FoodeeCart.money(product.price)}</strong>
            </div>
          `).join("")}</div>` : ""}
        ` : `<div class="empty-admin">No customer, order, cart, bill, or food details matched this search.</div>`}
      </section>`;
  }

  function renderCart() {
    const items = FoodeeCart.items();
    if (!currentCartList) return;
    currentCartList.innerHTML = items.length ? items.map(({ product, qty }) => `
      <div class="cart-row">
        <img src="${asset(product.image)}" alt="${product.name}" />
        <div><h3>${product.name}</h3><p>${qty} in cart</p></div>
        <strong class="line-price">${FoodeeCart.money(product.price * qty)}</strong>
      </div>
    `).join("") : `<div class="empty-admin">No active cart items.</div>`;
  }

  function renderActivity() {
    const activity = mergeEvents(events);
    if (!activityList) return;
    activityList.innerHTML = activity.length ? activity.slice(0, 20).map((entry) => `
      <div class="activity-entry">
        <strong>${entry.action}</strong>
        <p>${entry.productName}${entry.qty ? `, qty ${entry.qty}` : ""} | ${FoodeeCart.money(entry.unitPrice || 0)}</p>
        <time>${date(entry.createdAt)} | Session ${entry.sessionId}</time>
      </div>
    `).join("") : `<div class="empty-admin">No cart activity yet.</div>`;
  }

  function renderWishlist() {
    const items = readWishlist().map((id) => FoodeeCart.product(id)).filter(Boolean);
    if (!wishlistList) return;
    wishlistList.innerHTML = items.length ? items.map((product) => `
      <div class="cart-row">
        <img src="${asset(product.image)}" alt="${product.name}" />
        <div><h3>${product.name}</h3><p>${product.category}</p></div>
        <strong class="line-price">${FoodeeCart.money(product.price)}</strong>
      </div>
    `).join("") : `<div class="empty-admin">No wishlist items.</div>`;
  }

  function renderContacts() {
    if (!contactList) return;
    contactList.innerHTML = contacts.length ? contacts.map((contact) => `
      <article class="contact-entry">
        <strong>${contact.subject || "Customer message"}</strong>
        <p><b>${contact.name || "Guest"}</b> | ${contact.email || "No email"}</p>
        <p>${contact.message || ""}</p>
        <time>${date(contact.createdAt)}</time>
      </article>
    `).join("") : `<div class="empty-admin">No contact messages yet.</div>`;
  }

  function renderCustomers() {
    if (!customerList) return;
    customerList.innerHTML = customers.length ? customers.map((customer) => `
      <article class="customer-entry">
        <strong>${customer.name}</strong>
        <p>${customer.phone} | Orders ${customer.totalOrders || 0} | Spent ${FoodeeCart.money(customer.totalSpent || 0)}</p>
      </article>
    `).join("") : `<div class="empty-admin">No database customers yet.</div>`;
  }

  function renderProducts() {
    if (!productList) return;
    productList.innerHTML = FoodeeData.products.length ? FoodeeData.products.map((product) => `
      <article class="product-admin-row">
        <img src="${asset(product.image)}" alt="${product.name}" />
        <div>
          <h3>${product.name}</h3>
          <p>${product.category} | Rating ${product.rating} | ${product.reviews} reviews</p>
        </div>
        <strong class="line-price">${FoodeeCart.money(product.price)}</strong>
      </article>
    `).join("") : `<div class="empty-admin">No products found.</div>`;
  }

  function emptyTableRow(message, columns) {
    return `<tr><td class="muted-cell" colspan="${columns}">${message}</td></tr>`;
  }

  function renderDataTables() {
    if (ordersTableBody) {
      ordersTableBody.innerHTML = orders.length ? orders.map((order) => `
        <tr>
          <td><strong>${order.orderCode || order.id || "N/A"}</strong></td>
          <td>${order.customer?.name || "Guest customer"}</td>
          <td>${order.customer?.phone || "Not given"}</td>
          <td>${order.items.length ? order.items.map((item) => `${item.name} x${item.qty}`).join("<br>") : "No items"}</td>
          <td>${order.method}<br><span class="muted-cell">${order.status}</span></td>
          <td><strong>${FoodeeCart.money(order.total)}</strong><br><span class="muted-cell">Subtotal ${FoodeeCart.money(order.subtotal)}</span></td>
          <td>${date(order.createdAt)}</td>
        </tr>
      `).join("") : emptyTableRow("No orders saved yet. Place an order from checkout to see it here.", 7);
    }

    if (cartTableBody) {
      const activity = mergeEvents(events);
      cartTableBody.innerHTML = activity.length ? activity.slice(0, 50).map((entry) => {
        const customer = customerForSession(entry.sessionId);
        return `
          <tr>
            <td>${customer?.name || "Session customer"}<br><span class="muted-cell">${entry.sessionId || "No session"}</span></td>
            <td>${entry.action || "Added to cart"}</td>
            <td>${entry.productName || "Unknown food"}${entry.optionSummary ? `<br><span class="muted-cell">${entry.optionSummary}</span>` : ""}</td>
            <td>${entry.qty || 1}</td>
            <td>${FoodeeCart.money(entry.unitPrice || 0)}</td>
            <td>${FoodeeCart.money(entry.cartTotal || 0)}</td>
            <td>${date(entry.createdAt)}</td>
          </tr>
        `;
      }).join("") : emptyTableRow("No add-to-cart activity yet. Add food from menu to see it here.", 7);
    }

    if (customersTableBody) {
      customersTableBody.innerHTML = customers.length ? customers.map((customer) => `
        <tr>
          <td><strong>${customer.name || "Customer"}</strong></td>
          <td>${customer.phone || "Not given"}</td>
          <td>${customer.totalOrders || 0}</td>
          <td>${FoodeeCart.money(customer.totalSpent || 0)}</td>
        </tr>
      `).join("") : emptyTableRow("No database customers yet. Customer login/order will create records.", 4);
    }
  }

  function mergeContacts(apiContacts = []) {
    const map = new Map();
    [...readLocalContacts(), ...apiContacts].forEach((contact) => {
      const id = contact.id || `${contact.email}-${contact.createdAt}`;
      map.set(id, contact);
    });
    return [...map.values()].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  function mergeEvents(apiEvents = []) {
    const map = new Map();
    [...FoodeeCart.activity(), ...apiEvents].forEach((entry) => {
      const id = entry.id || `${entry.sessionId}-${entry.action}-${entry.productId}-${entry.createdAt}`;
      map.set(id, entry);
    });
    return [...map.values()].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  async function load() {
    let apiOrders = [];
    let apiContacts = [];
    let apiCustomers = [];
    let apiEvents = [];
    try {
      renderDatabaseStatus(await FoodeeAPI.getHealth());
    } catch (error) {
      renderDatabaseStatus({ ok: false, message: error.message });
    }
    try {
      await FoodeeAPI.loadProducts();
    } catch {
      // Static products stay available when the backend is not running.
    }
    try {
      apiOrders = await FoodeeAPI.getOrders();
    } catch {
      apiOrders = [];
    }
    try {
      apiContacts = await FoodeeAPI.getContacts();
    } catch {
      apiContacts = [];
    }
    try {
      apiCustomers = await FoodeeAPI.getCustomers();
    } catch {
      apiCustomers = [];
    }
    try {
      apiEvents = await FoodeeAPI.getCartEvents();
    } catch {
      apiEvents = [];
    }
    orders = mergeOrders(apiOrders);
    contacts = mergeContacts(apiContacts);
    customers = apiCustomers;
    events = apiEvents;
    renderOrders();
    renderCart();
    renderActivity();
    renderWishlist();
    renderContacts();
    renderCustomers();
    renderProducts();
    renderDataTables();
  }

  search?.addEventListener("input", () => {
    query = search.value.trim().toLowerCase();
    renderOrders();
  });
  refresh?.addEventListener("click", load);
  clearAdmin?.addEventListener("click", () => {
    FoodeeCart.clearAdminData();
    showToast("Local admin data cleared");
    load();
  });

  load();
});

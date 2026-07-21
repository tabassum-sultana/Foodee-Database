document.addEventListener("DOMContentLoaded", () => {
  const state = {
    orders: [],
    customers: [],
    products: [],
    categories: [],
    contacts: [],
    events: [],
    orderFilter: "all"
  };

  const viewDetails = {
    dashboard: ["Dashboard", "A clear overview of your restaurant activity."],
    orders: ["Customer Orders", "Bills, delivery information and order progress."],
    customers: ["Customers", "Contact details and spending history."],
    menu: ["Menu Management", "Add, update or remove food from the live menu."],
    analytics: ["Analytics", "Simple insights from the saved database records."],
    messages: ["Contact Messages", "Customer questions submitted from the website."]
  };

  const money = (value) => `BDT ${Number(value || 0).toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;
  const safe = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  const date = (value, short = false) => {
    if (!value) return "Not available";
    const options = short ? { month: "short", day: "numeric" } : { dateStyle: "medium", timeStyle: "short" };
    return new Intl.DateTimeFormat("en-BD", options).format(new Date(value));
  };
  const initials = (name) => String(name || "Customer").split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  function toast(message) {
    const node = document.querySelector("#adminToast");
    node.textContent = message;
    node.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => node.classList.remove("show"), 2200);
  }

  function getSavedSession() {
    try { return JSON.parse(localStorage.getItem("foodee-admin-session")); }
    catch { return null; }
  }

  function openView(name) {
    const selected = viewDetails[name] ? name : "dashboard";
    document.querySelectorAll("[data-admin-panel]").forEach((panel) => panel.classList.toggle("active", panel.dataset.adminPanel === selected));
    document.querySelectorAll("[data-admin-view]").forEach((button) => button.classList.toggle("active", button.dataset.adminView === selected));
    document.querySelector("#adminPageTitle").textContent = viewDetails[selected][0];
    document.querySelector("#adminPageSubtitle").textContent = viewDetails[selected][1];
    document.querySelector("#adminSidebar").classList.remove("open");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function normalizeOrder(order) {
    const items = (order.items || []).map((item) => ({
      name: item.productName || item.name || "Food item",
      qty: Number(item.quantity || item.qty || 0),
      price: Number(item.unitPrice || item.price || 0),
      lineTotal: Number(item.lineTotal || 0)
    }));
    return {
      ...order,
      customer: order.customer || { name: order.customerName, phone: order.phone, address: order.address, email: order.email },
      items,
      total: Number(order.total || order.totals?.total || 0),
      subtotal: Number(order.subtotal || order.totals?.subtotal || 0),
      deliveryFee: Number(order.deliveryFee || order.totals?.delivery || 0),
      paymentMethod: order.paymentMethod || order.method || "Not selected",
      paymentStatus: order.paymentStatus || order.status || "Pending",
      orderStatus: order.orderStatus || "Placed"
    };
  }

  function statusClass(status) {
    if (status === "Delivered") return "delivered";
    if (status === "Cancelled") return "cancelled";
    return "";
  }

  function orderStatusControl(order) {
    const options = ["Placed", "Preparing", "On the Way", "Delivered", "Cancelled"];
    return `<select class="status-select" data-order-status="${safe(order.id)}" aria-label="Update ${safe(order.orderCode)} status">${options.map((status) => `<option value="${status}"${status === order.orderStatus ? " selected" : ""}>${status}</option>`).join("")}</select>`;
  }

  function renderStats() {
    const revenue = state.orders.reduce((sum, order) => sum + order.total, 0);
    const active = state.orders.filter((order) => ["Placed", "Preparing", "On the Way"].includes(order.orderStatus)).length;
    document.querySelector("#statOrders").textContent = state.orders.length;
    document.querySelector("#statRevenue").textContent = money(revenue);
    document.querySelector("#statPending").textContent = active;
    document.querySelector("#statCustomers").textContent = state.customers.length;
    document.querySelector("#statProducts").textContent = state.products.length;
    document.querySelector("#sideOrderCount").textContent = active;
    document.querySelector("#sideMessageCount").textContent = state.contacts.length;
  }

  function renderRecentOrders() {
    const body = document.querySelector("#recentOrdersBody");
    body.innerHTML = state.orders.length ? state.orders.slice(0, 6).map((order) => `
      <tr>
        <td><strong>${safe(order.orderCode)}</strong><small>${date(order.createdAt, true)}</small></td>
        <td><div class="table-customer"><span class="table-avatar">${safe(initials(order.customer?.name))}</span><div><strong>${safe(order.customer?.name || "Guest")}</strong><small>${safe(order.customer?.phone || "No phone")}</small></div></div></td>
        <td class="food-cell">${safe(order.items.map((item) => `${item.name} x${item.qty}`).join(", ") || "No items")}</td>
        <td class="money-cell">${money(order.total)}</td>
        <td><span class="status-badge ${statusClass(order.orderStatus)}">${safe(order.orderStatus)}</span></td>
      </tr>`).join("") : `<tr><td class="empty-table" colspan="5">No orders yet. Customer orders will appear here.</td></tr>`;
  }

  function renderActivity() {
    const list = document.querySelector("#dashboardActivity");
    list.innerHTML = state.events.length ? state.events.slice(0, 10).map((event) => `
      <article class="activity-item">
        <img src="${/wishlist/i.test(event.action) ? "assets/icons/heart.png" : "assets/icons/cart.png"}" alt="" />
        <div><strong>${safe(event.customerName || "Customer")} ${safe(String(event.action || "activity").toLowerCase())}</strong><p>${safe(event.productName)}${event.qty ? `, quantity ${safe(event.qty)}` : ""} | ${safe(event.phone || "No phone")}</p><time>${date(event.createdAt)}</time></div>
      </article>`).join("") : `<div class="empty-table">No cart or wishlist activity yet.</div>`;
  }

  function orderMatches(order, query) {
    const text = [order.orderCode, order.customer?.name, order.customer?.phone, order.customer?.address, order.paymentMethod, order.orderStatus, ...order.items.map((item) => item.name)].join(" ").toLowerCase();
    return text.includes(query);
  }

  function renderOrders() {
    const query = document.querySelector("#orderSearch").value.trim().toLowerCase();
    const filtered = state.orders.filter((order) => (state.orderFilter === "all" || order.orderStatus === state.orderFilter) && orderMatches(order, query));
    const body = document.querySelector("#ordersTableBody");
    body.innerHTML = filtered.length ? filtered.map((order) => `
      <tr>
        <td><strong>${safe(order.orderCode)}</strong><small>ID: ${safe(order.id)}</small></td>
        <td><div class="table-customer"><span class="table-avatar">${safe(initials(order.customer?.name))}</span><div><strong>${safe(order.customer?.name || "Guest")}</strong><small>${safe(order.customer?.phone || "No phone")}</small><small>${safe(order.customer?.email || "No email")}</small><small>${safe(order.customer?.address || "No address")}</small></div></div></td>
        <td class="food-cell">${order.items.map((item) => `${safe(item.name)} x${safe(item.qty)}`).join("<br>") || "No items"}</td>
        <td><strong>${safe(order.paymentMethod)}</strong><small>${safe(order.paymentStatus)}</small></td>
        <td class="money-cell">${money(order.total)}<small>Delivery ${money(order.deliveryFee)}</small></td>
        <td>${orderStatusControl(order)}</td>
        <td>${date(order.createdAt)}</td>
      </tr>`).join("") : `<tr><td class="empty-table" colspan="7">No matching orders found.</td></tr>`;
  }

  function renderCustomers() {
    const query = document.querySelector("#customerSearch").value.trim().toLowerCase();
    const customers = state.customers.filter((customer) => [customer.name, customer.phone, customer.email].join(" ").toLowerCase().includes(query));
    document.querySelector("#customersTableBody").innerHTML = customers.length ? customers.map((customer) => `
      <tr>
        <td><div class="table-customer"><span class="table-avatar">${safe(initials(customer.name))}</span><div><strong>${safe(customer.name)}</strong><small>Customer #${safe(customer.id)}</small></div></div></td>
        <td>${safe(customer.phone || "Not given")}</td>
        <td>${safe(customer.email || "Not provided")}</td>
        <td><strong>${safe(customer.totalOrders || 0)}</strong></td>
        <td>${safe(customer.cartItems || 0)}</td>
        <td>${safe(customer.wishlistItems || 0)}</td>
        <td class="money-cell">${money(customer.totalSpent)}</td>
        <td>${date(customer.updatedAt)}</td>
      </tr>`).join("") : `<tr><td class="empty-table" colspan="8">No matching customers found.</td></tr>`;
  }

  function renderMenu() {
    const query = document.querySelector("#productSearch").value.trim().toLowerCase();
    const category = document.querySelector("#productCategoryFilter").value;
    const products = state.products.filter((product) => (category === "all" || product.category === category) && [product.name, product.category, product.desc].join(" ").toLowerCase().includes(query));
    document.querySelector("#menuManagementList").innerHTML = products.length ? products.map((product) => `
      <article class="managed-food">
        <img src="${safe(product.image)}" alt="${safe(product.name)}" />
        <div><h3>${safe(product.name)}</h3><p>${safe(product.category)}</p><strong>${money(product.price)}</strong></div>
        <div class="managed-food-actions"><button type="button" data-edit-food="${safe(product.id)}">Edit Food</button><button class="remove-food" type="button" data-remove-food="${safe(product.id)}">Remove</button></div>
      </article>`).join("") : `<div class="empty-table">No matching menu items found.</div>`;
  }

  function renderMessages() {
    document.querySelector("#contactList").innerHTML = state.contacts.length ? state.contacts.map((contact) => `
      <article class="message-card">
        <div class="message-card-head"><div><h3>${safe(contact.subject || "Customer message")}</h3><a href="mailto:${safe(contact.email)}">${safe(contact.name || "Customer")} | ${safe(contact.email)}</a></div><span class="status-badge">New</span></div>
        <p>${safe(contact.message)}</p><time>${date(contact.createdAt)}</time>
      </article>`).join("") : `<div class="admin-card empty-table">No contact messages yet.</div>`;
  }

  function metricRows(entries) {
    const max = Math.max(1, ...entries.map((entry) => entry.value));
    return entries.map((entry) => `<div class="metric-row"><span>${safe(entry.label)}</span><div class="metric-track"><div class="metric-fill" style="width:${Math.max(3, (entry.value / max) * 100)}%"></div></div><b>${safe(entry.value)}</b></div>`).join("");
  }

  function renderAnalytics() {
    const revenue = state.orders.reduce((sum, order) => sum + order.total, 0);
    document.querySelector("#averageOrderValue").textContent = money(state.orders.length ? revenue / state.orders.length : 0);
    document.querySelector("#deliveredOrderCount").textContent = state.orders.filter((order) => order.orderStatus === "Delivered").length;
    document.querySelector("#cartActivityCount").textContent = state.events.filter((event) => /cart|quantity/i.test(event.action)).length;
    document.querySelector("#wishlistActivityCount").textContent = state.events.filter((event) => /added to wishlist/i.test(event.action)).length;

    const days = Array.from({ length: 7 }, (_, index) => {
      const current = new Date();
      current.setHours(0, 0, 0, 0);
      current.setDate(current.getDate() - (6 - index));
      const next = new Date(current); next.setDate(next.getDate() + 1);
      const value = state.orders.filter((order) => new Date(order.createdAt) >= current && new Date(order.createdAt) < next).reduce((sum, order) => sum + order.total, 0);
      return { label: current.toLocaleDateString("en-US", { weekday: "short" }), value };
    });
    const maxSale = Math.max(1, ...days.map((day) => day.value));
    document.querySelector("#salesChart").innerHTML = days.map((day) => `<div class="bar-column"><strong>${day.value ? Math.round(day.value / 1000) + "k" : "0"}</strong><div class="bar-track"><div class="bar-fill" style="height:${Math.max(2, (day.value / maxSale) * 100)}%"></div></div><span>${day.label}</span></div>`).join("");

    const statuses = ["Placed", "Preparing", "On the Way", "Delivered", "Cancelled"].map((label) => ({ label, value: state.orders.filter((order) => order.orderStatus === label).length }));
    document.querySelector("#statusAnalytics").innerHTML = metricRows(statuses);

    const foodMap = new Map();
    state.orders.forEach((order) => order.items.forEach((item) => foodMap.set(item.name, (foodMap.get(item.name) || 0) + item.qty)));
    const foods = [...foodMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    document.querySelector("#topFoods").innerHTML = foods.length ? foods.map(([name, qty], index) => `<div class="rank-row"><b>${index + 1}</b><strong>${safe(name)}</strong><span>${qty} sold</span></div>`).join("") : `<div class="empty-table">Order data will create this ranking.</div>`;

    const categoryMap = new Map();
    state.products.forEach((product) => categoryMap.set(product.category, (categoryMap.get(product.category) || 0) + 1));
    document.querySelector("#categoryAnalytics").innerHTML = metricRows([...categoryMap.entries()].map(([label, value]) => ({ label, value })));
  }

  function fillCategoryControls() {
    const filter = document.querySelector("#productCategoryFilter");
    filter.innerHTML = `<option value="all">All Categories</option>${state.categories.map((category) => `<option value="${safe(category.name)}">${safe(category.name)}</option>`).join("")}`;
    document.querySelector("#foodCategoryOptions").innerHTML = state.categories.map((category) => `<option value="${safe(category.name)}"></option>`).join("");
  }

  function openFoodModal(product = null) {
    document.querySelector("#foodDialogTitle").textContent = product ? "Edit Food" : "Add New Food";
    document.querySelector("#foodOriginalId").value = product?.id || "";
    document.querySelector("#foodName").value = product?.name || "";
    document.querySelector("#foodId").value = product?.id || "";
    document.querySelector("#foodId").disabled = Boolean(product);
    document.querySelector("#foodCategory").value = product?.category || "";
    document.querySelector("#foodPrice").value = product?.price || "";
    document.querySelector("#foodImage").value = product?.image || "assets/food/menu-items/";
    document.querySelector("#foodDescription").value = product?.desc || "";
    document.querySelector("#foodModal").classList.add("open");
    document.querySelector("#foodModal").setAttribute("aria-hidden", "false");
  }

  function closeFoodModal() {
    document.querySelector("#foodModal").classList.remove("open");
    document.querySelector("#foodModal").setAttribute("aria-hidden", "true");
    document.querySelector("#foodForm").reset();
  }

  function slug(value) {
    return String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  async function loadData(showMessage = false) {
    const results = await Promise.allSettled([
      FoodeeAPI.getHealth(),
      FoodeeAPI.getOrders(),
      FoodeeAPI.getCustomers(),
      FoodeeAPI.getContacts(),
      FoodeeAPI.getCartEvents(),
      FoodeeAPI.getCategories(),
      FoodeeAPI.loadProducts()
    ]);
    const [health, orders, customers, contacts, events, categories] = results;
    const pill = document.querySelector("#databasePill");
    const connected = health.status === "fulfilled" && health.value.ok;
    pill.className = `database-pill ${connected ? "connected" : "offline"}`;
    pill.querySelector("span").textContent = connected ? "MySQL Connected" : "Database Offline";
    state.orders = orders.status === "fulfilled" ? orders.value.map(normalizeOrder) : [];
    state.customers = customers.status === "fulfilled" ? customers.value : [];
    state.contacts = contacts.status === "fulfilled" ? contacts.value : [];
    state.events = events.status === "fulfilled" ? events.value : [];
    state.categories = categories.status === "fulfilled" ? categories.value : [];
    state.products = [...FoodeeData.products];
    fillCategoryControls();
    renderStats();
    renderRecentOrders();
    renderActivity();
    renderOrders();
    renderCustomers();
    renderMenu();
    renderMessages();
    renderAnalytics();
    if (showMessage) toast("Dashboard data refreshed");
  }

  document.querySelectorAll("[data-admin-view]").forEach((button) => button.addEventListener("click", () => openView(button.dataset.adminView)));
  document.querySelectorAll("[data-go-view]").forEach((button) => button.addEventListener("click", () => openView(button.dataset.goView)));
  document.querySelector("#adminMenuToggle").addEventListener("click", () => document.querySelector("#adminSidebar").classList.toggle("open"));
  document.querySelector("#refreshAdmin").addEventListener("click", () => loadData(true));
  document.querySelector("#orderSearch").addEventListener("input", renderOrders);
  document.querySelector("#customerSearch").addEventListener("input", renderCustomers);
  document.querySelector("#productSearch").addEventListener("input", renderMenu);
  document.querySelector("#productCategoryFilter").addEventListener("change", renderMenu);
  document.querySelector("#adminGlobalSearch").addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    document.querySelector("#orderSearch").value = event.currentTarget.value;
    openView("orders");
    renderOrders();
  });
  document.querySelector("#orderFilters").addEventListener("click", (event) => {
    const button = event.target.closest("[data-order-filter]");
    if (!button) return;
    state.orderFilter = button.dataset.orderFilter;
    document.querySelectorAll("[data-order-filter]").forEach((item) => item.classList.toggle("active", item === button));
    renderOrders();
  });
  document.querySelector("#ordersTableBody").addEventListener("change", async (event) => {
    const select = event.target.closest("[data-order-status]");
    if (!select) return;
    try {
      await FoodeeAPI.updateOrderStatus(select.dataset.orderStatus, { orderStatus: select.value });
      toast("Order status updated");
      await loadData();
    } catch (error) {
      toast(error.message);
      await loadData();
    }
  });

  document.querySelector("#addFoodButton").addEventListener("click", () => openFoodModal());
  document.querySelector("#closeFoodModal").addEventListener("click", closeFoodModal);
  document.querySelector("#cancelFoodModal").addEventListener("click", closeFoodModal);
  document.querySelector("#foodModal").addEventListener("click", (event) => { if (event.target.id === "foodModal") closeFoodModal(); });
  document.querySelector("#foodName").addEventListener("input", (event) => {
    const idInput = document.querySelector("#foodId");
    if (!document.querySelector("#foodOriginalId").value) idInput.value = slug(event.target.value);
  });
  document.querySelector("#foodForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const originalId = document.querySelector("#foodOriginalId").value;
    const payload = {
      id: document.querySelector("#foodId").value || slug(document.querySelector("#foodName").value),
      name: document.querySelector("#foodName").value.trim(),
      category: document.querySelector("#foodCategory").value.trim(),
      price: Number(document.querySelector("#foodPrice").value),
      image: document.querySelector("#foodImage").value.trim(),
      desc: document.querySelector("#foodDescription").value.trim()
    };
    try {
      if (originalId) await FoodeeAPI.updateProduct(originalId, payload);
      else await FoodeeAPI.saveProduct(payload);
      closeFoodModal();
      toast(originalId ? "Food updated successfully" : "New food added successfully");
      await loadData();
    } catch (error) {
      toast(error.message);
    }
  });
  document.querySelector("#menuManagementList").addEventListener("click", async (event) => {
    const edit = event.target.closest("[data-edit-food]");
    if (edit) {
      openFoodModal(state.products.find((product) => product.id === edit.dataset.editFood));
      return;
    }
    const remove = event.target.closest("[data-remove-food]");
    if (!remove) return;
    const product = state.products.find((item) => item.id === remove.dataset.removeFood);
    if (!confirm(`Remove ${product?.name || "this food"} from the menu?`)) return;
    try {
      await FoodeeAPI.removeProduct(remove.dataset.removeFood);
      toast("Food removed from the live menu");
      await loadData();
    } catch (error) {
      toast(error.message);
    }
  });

  document.querySelector("#adminLogout").addEventListener("click", async () => {
    try { await FoodeeAPI.logoutAdmin(); } catch { /* Local logout still completes. */ }
    localStorage.removeItem("foodee-admin-session");
    location.href = "index.html";
  });

  async function start() {
    const saved = getSavedSession();
    if (!saved?.token) {
      location.replace("index.html?admin=1");
      return;
    }
    try {
      const session = await FoodeeAPI.getAdminSession();
      document.querySelectorAll("[data-admin-name]").forEach((node) => { node.textContent = session.admin.name || "Admin"; });
      document.querySelectorAll("[data-admin-role]").forEach((node) => { node.textContent = session.admin.role || "Restaurant Admin"; });
      document.querySelector(".admin-avatar").textContent = initials(session.admin.name || "Admin");
      await loadData();
    } catch {
      localStorage.removeItem("foodee-admin-session");
      location.replace("index.html?admin=1");
    }
  }

  start();
});

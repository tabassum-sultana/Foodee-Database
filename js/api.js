const FoodeeAPI = (() => {
  const API_BASE = (() => {
    const isLocalPage = ["localhost", "127.0.0.1"].includes(location.hostname);
    if (location.protocol === "file:" || (isLocalPage && location.port && location.port !== "5600")) {
      return "http://127.0.0.1:5600";
    }
    return "";
  })();

  async function request(path, options = {}) {
    let adminToken = "";
    try {
      adminToken = JSON.parse(localStorage.getItem("foodee-admin-session"))?.token || "";
    } catch {
      adminToken = "";
    }
    let response;
    try {
      response = await fetch(`${API_BASE}${path}`, {
        headers: {
          "Content-Type": "application/json",
          ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
          ...(options.headers || {})
        },
        ...options
      });
    } catch {
      throw new Error("Server not connected. Run start-foodee-server.bat first.");
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 404 && API_BASE === "") {
        throw new Error("Backend not found. Open the site from http://127.0.0.1:5600.");
      }
      throw new Error(data.message || `Request failed (${response.status})`);
    }
    return data;
  }

  function saveContact(payload) {
    return request("/api/contact", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  function loginCustomer(payload) {
    return request("/api/customers/login", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  function registerCustomer(payload) {
    return request("/api/customers/register", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  function loginAdmin(payload) {
    return request("/api/admin/login", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  function getAdminSession() {
    return request("/api/admin/session");
  }

  function logoutAdmin() {
    return request("/api/admin/logout", { method: "POST" });
  }

  function getContacts() {
    return request("/api/contacts");
  }

  function createOrder(payload) {
    return request("/api/orders", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  function getOrders() {
    return request("/api/orders");
  }

  function saveCartEvent(payload) {
    return request("/api/cart-events", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  function getCartEvents() {
    return request("/api/cart-events");
  }

  function getAdminSummary() {
    return request("/api/admin/summary");
  }

  function getHealth() {
    return request("/api/health");
  }

  function getDatabaseTables() {
    return request("/api/database/tables");
  }

  function getCustomers() {
    return request("/api/customers");
  }

  function updateCustomer(id, payload) {
    return request(`/api/customers/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
  }

  function removeCustomer(id) {
    return request(`/api/customers/${encodeURIComponent(id)}`, {
      method: "DELETE"
    });
  }

  function getCategories() {
    return request("/api/categories");
  }

  function saveProduct(payload) {
    return request("/api/products", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  function updateProduct(id, payload) {
    return request(`/api/products/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
  }

  function removeProduct(id) {
    return request(`/api/products/${encodeURIComponent(id)}`, {
      method: "DELETE"
    });
  }

  function updateOrderStatus(id, payload) {
    return request(`/api/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
  }

  async function loadProducts() {
    const products = await request("/api/products");
    if (!Array.isArray(products) || !products.length) return;
    window.FoodeeData.products = products.map((product) => ({
      ...product,
      price: Number(product.price),
      rating: Number(product.rating),
      reviews: Number(product.reviews)
    }));
  }

  return { createOrder, getAdminSession, getAdminSummary, getCartEvents, getCategories, getContacts, getCustomers, getDatabaseTables, getHealth, getOrders, loadProducts, loginAdmin, loginCustomer, logoutAdmin, registerCustomer, removeCustomer, removeProduct, saveCartEvent, saveContact, saveProduct, updateCustomer, updateOrderStatus, updateProduct };
})();

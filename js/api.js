const FoodeeAPI = (() => {
  async function request(path, options = {}) {
    const response = await fetch(path, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Request failed");
    return data;
  }

  function saveContact(payload) {
    return request("/api/contact", {
      method: "POST",
      body: JSON.stringify(payload)
    });
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

  return { createOrder, getAdminSummary, getCartEvents, getCategories, getContacts, getOrders, loadProducts, removeProduct, saveCartEvent, saveContact, saveProduct, updateOrderStatus, updateProduct };
})();

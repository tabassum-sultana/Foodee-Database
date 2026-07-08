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

  function createOrder(payload) {
    return request("/api/orders", {
      method: "POST",
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

  return { createOrder, loadProducts, saveContact };
})();

const FoodeeCart = (() => {
  const key = "foodee-cart";
  const initKey = "foodee-cart-demo-ready";
  const orderKey = "foodee-last-order";

  function read() {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch { return []; }
  }

  function write(cart) {
    localStorage.setItem(key, JSON.stringify(cart));
    updateCount();
  }

  function ensureDemoCart() {
    if (localStorage.getItem(initKey)) return;
    write(window.FoodeeData.initialCart.map((item) => ({ ...item })));
    localStorage.setItem(initKey, "1");
  }

  function product(id) {
    return window.FoodeeData.products.find((item) => item.id === id);
  }

  function items() {
    return read().map((item) => ({ ...item, product: product(item.id) })).filter((item) => item.product);
  }

  function add(id, qty = 1) {
    const cart = read();
    const found = cart.find((item) => item.id === id);
    if (found) found.qty += qty;
    else cart.push({ id, qty });
    write(cart);
  }

  function update(id, delta) {
    const next = read().map((item) => item.id === id ? { ...item, qty: item.qty + delta } : item).filter((item) => item.qty > 0);
    write(next);
  }

  function remove(id) {
    write(read().filter((item) => item.id !== id));
  }

  function clear() { write([]); }

  function totals() {
    const subtotal = items().reduce((sum, item) => sum + item.product.price * item.qty, 0);
    const delivery = subtotal ? 29 : 0;
    const discount = subtotal >= 300 ? 20 : 0;
    return { subtotal, delivery, discount, total: Math.max(0, subtotal + delivery - discount) };
  }

  function money(value) {
    return `BDT ${Math.round(value)}`;
  }

  function updateCount() {
    const count = read().reduce((sum, item) => sum + item.qty, 0);
    document.querySelectorAll("[data-cart-count]").forEach((node) => { node.textContent = count; });
  }

  function saveOrder(order) { localStorage.setItem(orderKey, JSON.stringify(order)); }
  function lastOrder() {
    try { return JSON.parse(localStorage.getItem(orderKey)); }
    catch { return null; }
  }

  return { add, clear, ensureDemoCart, items, lastOrder, money, product, read, remove, saveOrder, totals, update, updateCount };
})();

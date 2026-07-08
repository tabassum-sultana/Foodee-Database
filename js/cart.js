const FoodeeCart = (() => {
  const key = "foodee-cart";
  const initKey = "foodee-cart-demo-ready";
  const orderKey = "foodee-last-order";
  const ordersKey = "foodee-local-orders";
  const activityKey = "foodee-cart-activity";
  const contactsKey = "foodee-local-contacts";
  const sessionKey = "foodee-session-id";

  function read() {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch { return []; }
  }

  function write(cart) {
    localStorage.setItem(key, JSON.stringify(cart));
    updateCount();
  }

  function sessionId() {
    let id = localStorage.getItem(sessionKey);
    if (!id) {
      id = `GUEST-${Date.now().toString().slice(-6)}-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
      localStorage.setItem(sessionKey, id);
    }
    return id;
  }

  function ensureDemoCart() {
    const hasRealActivity = localStorage.getItem(activityKey) || localStorage.getItem(ordersKey);
    const legacyDemo = JSON.stringify(read()) === JSON.stringify(window.FoodeeData.initialCart);
    if (hasRealActivity && localStorage.getItem(initKey)) return;
    if (legacyDemo) write([]);
    if (localStorage.getItem(initKey)) return;
    write([]);
    localStorage.setItem(initKey, "1");
  }

  function product(id) {
    return window.FoodeeData.products.find((item) => item.id === id);
  }

  function items() {
    return read().map((item) => {
      const found = product(item.id);
      if (!found) return null;
      const unitPrice = Number(item.unitPrice ?? found.price);
      const optionSummary = item.optionSummary || "";
      const displayName = item.displayName || `${found.name}${optionSummary ? ` (${optionSummary})` : ""}`;
      return { ...item, key: item.key || item.id, unitPrice, optionSummary, displayName, product: found };
    }).filter(Boolean);
  }

  function add(id, qty = 1, options = {}) {
    const cart = read();
    const foundProduct = product(id);
    const addOns = options.addOns || [];
    const optionSummaryParts = [
      options.sizeName,
      ...addOns.map((item) => item.name)
    ].filter(Boolean);
    const optionSummary = optionSummaryParts.join(", ");
    const unitPrice = Number(options.unitPrice ?? foundProduct?.price ?? 0);
    const key = options.key || [id, options.sizeName || "", ...addOns.map((item) => item.name)].join("|");
    const displayName = `${foundProduct?.name || id}${optionSummary ? ` (${optionSummary})` : ""}`;
    const found = cart.find((item) => (item.key || item.id) === key);
    if (found) found.qty += qty;
    else cart.push({ id, key, qty, unitPrice, optionSummary, displayName, sizeName: options.sizeName || "", addOns });
    write(cart);
    logActivity("Added to cart", id, qty, { productName: displayName, unitPrice, optionSummary });
  }

  function update(key, delta) {
    const next = read().map((item) => (item.key || item.id) === key ? { ...item, qty: item.qty + delta } : item).filter((item) => item.qty > 0);
    write(next);
    const changed = next.find((item) => (item.key || item.id) === key);
    logActivity(delta > 0 ? "Increased quantity" : "Decreased quantity", changed?.id || key, Math.abs(delta), {
      productName: changed?.displayName,
      unitPrice: changed?.unitPrice,
      optionSummary: changed?.optionSummary
    });
  }

  function remove(key) {
    const removed = read().find((item) => (item.key || item.id) === key);
    write(read().filter((item) => (item.key || item.id) !== key));
    logActivity("Removed from cart", removed?.id || key, 0, {
      productName: removed?.displayName,
      unitPrice: removed?.unitPrice,
      optionSummary: removed?.optionSummary
    });
  }

  function clear() { write([]); }

  function totals() {
    const subtotal = items().reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
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

  function logActivity(action, id, qty, details = {}) {
    const found = product(id);
    const entry = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      sessionId: sessionId(),
      action,
      productId: id,
      productName: details.productName || found?.name || id,
      productImage: found?.image || "",
      category: found?.category || "",
      unitPrice: Number(details.unitPrice ?? found?.price ?? 0),
      optionSummary: details.optionSummary || "",
      qty,
      cartTotal: totals().total,
      createdAt: new Date().toISOString()
    };
    let activity = [];
    try { activity = JSON.parse(localStorage.getItem(activityKey)) || []; }
    catch { activity = []; }
    activity.unshift(entry);
    localStorage.setItem(activityKey, JSON.stringify(activity.slice(0, 80)));
    if (window.FoodeeAPI?.saveCartEvent) {
      window.FoodeeAPI.saveCartEvent(entry).catch(() => {});
    }
  }

  function saveLocalOrder(order) {
    const snapshot = { ...order, sessionId: sessionId() };
    let orders = [];
    try { orders = JSON.parse(localStorage.getItem(ordersKey)) || []; }
    catch { orders = []; }
    localStorage.setItem(ordersKey, JSON.stringify([snapshot, ...orders].slice(0, 40)));
    saveOrder(snapshot);
    return snapshot;
  }

  function localOrders() {
    try { return JSON.parse(localStorage.getItem(ordersKey)) || []; }
    catch { return []; }
  }

  function activity() {
    try { return JSON.parse(localStorage.getItem(activityKey)) || []; }
    catch { return []; }
  }

  function clearAdminData() {
    localStorage.removeItem(orderKey);
    localStorage.removeItem(ordersKey);
    localStorage.removeItem(activityKey);
    localStorage.removeItem(contactsKey);
    clear();
  }

  return { activity, add, clear, clearAdminData, ensureDemoCart, items, lastOrder, localOrders, logActivity, money, product, read, remove, saveLocalOrder, saveOrder, sessionId, totals, update, updateCount };
})();

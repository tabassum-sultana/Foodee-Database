document.addEventListener("DOMContentLoaded", () => {
  const products = document.querySelector("#checkoutProducts");
  const subtotal = document.querySelector("#checkoutSubtotal");
  const delivery = document.querySelector("#checkoutDelivery");
  const discount = document.querySelector("#checkoutDiscount");
  const total = document.querySelector("#checkoutTotal");
  const form = document.querySelector("#checkoutForm");

  function render() {
    const items = FoodeeCart.items();
    if (products) {
      products.innerHTML = items.map(({ product, qty, key, unitPrice, optionSummary, displayName }) => `
        <article>
          <img src="${asset(product.image)}" alt="${product.name}" />
          <div><h3>${displayName}</h3>${optionSummary ? `<p>${optionSummary}</p>` : ""}<div class="qty-control"><button type="button" data-update-cart="${key}" data-delta="-1">-</button><span>${qty}</span><button type="button" data-update-cart="${key}" data-delta="1">+</button></div></div>
          <strong class="price">${FoodeeCart.money(unitPrice * qty)}</strong>
        </article>`).join("");
    }
    const totals = FoodeeCart.totals();
    subtotal.textContent = FoodeeCart.money(totals.subtotal);
    delivery.textContent = FoodeeCart.money(totals.delivery);
    discount.textContent = `- ${FoodeeCart.money(totals.discount)}`;
    total.textContent = FoodeeCart.money(totals.total);
    FoodeeCart.updateCount();
  }

  products?.addEventListener("click", (event) => {
    const update = event.target.closest("[data-update-cart]");
    if (!update) return;
    FoodeeCart.update(update.dataset.updateCart, Number(update.dataset.delta));
    render();
  });

  document.querySelectorAll(".payment-option").forEach((option) => {
    option.addEventListener("click", () => {
      document.querySelectorAll(".payment-option").forEach((item) => item.classList.remove("active"));
      option.classList.add("active");
    });
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const activePayment = document.querySelector(".payment-option.active h3")?.textContent || "bKash";
    const totals = FoodeeCart.totals();
    const cartItems = FoodeeCart.items().map(({ product, qty, unitPrice, optionSummary, displayName, sizeName, addOns }) => ({
      id: product.id,
      name: displayName,
      baseName: product.name,
      price: unitPrice,
      optionSummary,
      sizeName,
      addOns,
      qty
    }));

    if (!cartItems.length) {
      showToast("Your cart is empty");
      return;
    }

    const payload = {
      sessionId: FoodeeCart.sessionId(),
      customer: {
        name: form.querySelector("#fullName").value.trim(),
        phone: form.querySelector("#phone").value.trim(),
        address: form.querySelector("#address").value.trim(),
        note: form.querySelector("#note").value.trim()
      },
      paymentMethod: activePayment,
      totals,
      items: cartItems
    };

    const localOrderDetails = {
      orderCode: `FD${Date.now().toString().slice(-8)}`,
      sessionId: payload.sessionId,
      customer: payload.customer,
      items: cartItems,
      totals,
      total: totals.total,
      method: activePayment,
      status: activePayment === "Cash on Delivery" ? "Pending" : "Paid",
      createdAt: new Date().toISOString()
    };
    let order = localOrderDetails;

    try {
      order = { ...localOrderDetails, ...(await FoodeeAPI.createOrder(payload)) };
    } catch {
      showToast("Order saved locally");
    }

    FoodeeCart.saveLocalOrder(order);
    FoodeeCart.clear();
    location.href = page("success.html");
  });

  render();
});

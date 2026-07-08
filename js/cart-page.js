document.addEventListener("DOMContentLoaded", () => {
  const list = document.querySelector("#cartItems");
  const subtotal = document.querySelector("#cartSubtotal");
  const delivery = document.querySelector("#cartDelivery");
  const discount = document.querySelector("#cartDiscount");
  const total = document.querySelector("#cartTotal");

  function render() {
    const items = FoodeeCart.items();
    if (!list) return;
    if (!items.length) {
      list.innerHTML = `<div class="empty-state">Your cart is empty.</div>`;
    } else {
      list.innerHTML = items.map(({ product, qty }) => `
        <article class="cart-item">
          <img class="cart-item-img" src="${asset(product.image)}" alt="${product.name}" />
          <div>
            <h3>${product.name}</h3>
            <p>${product.desc}</p>
            <strong class="price">${FoodeeCart.money(product.price)}</strong>
          </div>
          <div class="qty-control"><button type="button" data-update-cart="${product.id}" data-delta="-1">−</button><span>${qty}</span><button type="button" data-update-cart="${product.id}" data-delta="1">+</button></div>
          <button class="remove-item" type="button" data-remove-cart="${product.id}" aria-label="Remove ${product.name}"><img src="${asset("assets/icons/trash.png")}" alt="" /></button>
        </article>`).join("");
    }
    const totals = FoodeeCart.totals();
    subtotal.textContent = FoodeeCart.money(totals.subtotal);
    delivery.textContent = FoodeeCart.money(totals.delivery);
    discount.textContent = `- ${FoodeeCart.money(totals.discount)}`;
    total.textContent = FoodeeCart.money(totals.total);
    FoodeeCart.updateCount();
  }

  list?.addEventListener("click", (event) => {
    const update = event.target.closest("[data-update-cart]");
    const remove = event.target.closest("[data-remove-cart]");
    if (update) FoodeeCart.update(update.dataset.updateCart, Number(update.dataset.delta));
    if (remove) FoodeeCart.remove(remove.dataset.removeCart);
    render();
  });
  render();
});

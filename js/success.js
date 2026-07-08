document.addEventListener("DOMContentLoaded", () => {
  const order = FoodeeCart.lastOrder() || { total: 548, method: "bKash", status: "Paid", createdAt: new Date().toISOString() };
  const date = new Date(order.createdAt);
  document.querySelector("#successOrderCode").textContent = order.orderCode || "FD12345678";
  document.querySelector("#successTotal").textContent = FoodeeCart.money(order.total || 548);
  document.querySelector("#successMethod").textContent = order.method || "bKash";
  document.querySelector("#successStatus").textContent = order.status || "Paid";
  document.querySelector("#successDate").textContent = date.toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short" });

  const customer = order.customer || {};
  const totals = order.totals || { subtotal: order.total || 0, delivery: 0, discount: 0, total: order.total || 0 };
  const items = order.items || [];
  document.querySelector("#successCustomer").textContent = `${customer.name || "Guest customer"} | ${customer.phone || "No phone"} | ${customer.address || "No address"}`;
  document.querySelector("#successBill").textContent = FoodeeCart.money(totals.total || order.total || 0);
  document.querySelector("#successSubtotal").textContent = FoodeeCart.money(totals.subtotal || 0);
  document.querySelector("#successDelivery").textContent = FoodeeCart.money(totals.delivery || 0);
  document.querySelector("#successDiscount").textContent = `- ${FoodeeCart.money(totals.discount || 0)}`;
  document.querySelector("#successItems").innerHTML = items.length ? items.map((item) => `
    <article>
      <div>
        <h3>${item.name}</h3>
        <p>${item.optionSummary || item.baseName || ""}</p>
      </div>
      <span>${item.qty} x ${FoodeeCart.money(item.price)}</span>
      <strong>${FoodeeCart.money(item.price * item.qty)}</strong>
    </article>
  `).join("") : `<div class="empty-state">No item details found.</div>`;
});

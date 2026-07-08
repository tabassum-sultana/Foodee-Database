document.addEventListener("DOMContentLoaded", () => {
  const order = FoodeeCart.lastOrder() || { total: 548, method: "bKash", status: "Paid", createdAt: new Date().toISOString() };
  const date = new Date(order.createdAt);
  document.querySelector("#successOrderCode").textContent = order.orderCode || "FD12345678";
  document.querySelector("#successTotal").textContent = FoodeeCart.money(order.total || 548);
  document.querySelector("#successMethod").textContent = order.method || "bKash";
  document.querySelector("#successStatus").textContent = order.status || "Paid";
  document.querySelector("#successDate").textContent = date.toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short" });
});

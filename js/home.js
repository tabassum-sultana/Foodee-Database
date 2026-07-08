document.addEventListener("DOMContentLoaded", async () => {
  try {
    await FoodeeAPI.loadProducts();
  } catch {
    // Static data remains available when the backend is not running.
  }

  const cats = document.querySelector("#homeCategories");
  const picks = document.querySelector("#homePicks");
  if (cats) cats.innerHTML = FoodeeData.categories.slice(0, 7).map(categoryCard).join("");
  if (picks) {
    const pickIds = ["burger", "supreme-pizza", "fried-chicken", "chocolate-cake"];
    const selected = pickIds.map((id) => FoodeeCart.product(id)).filter(Boolean);
    picks.innerHTML = selected.map(productCard).join("");
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await FoodeeAPI.loadProducts();
  } catch {
    // Static data remains available when the backend is not running.
  }

  const params = new URLSearchParams(location.search);
  const id = params.get("id") || "burger";
  const product = FoodeeCart.product(id) || FoodeeCart.product("burger");
  const related = document.querySelector("#relatedProducts");
  const addButton = document.querySelector("#detailAddCart");
  const wishlistButton = document.querySelector("#detailWishlist");
  const qtyControl = document.querySelector(".product-actions .qty-control");
  const qtyButtons = qtyControl ? qtyControl.querySelectorAll("button") : [];
  const qtyValue = qtyControl ? qtyControl.querySelector("span") : null;
  let detailQty = 1;

  function setDetailQty(nextQty) {
    detailQty = Math.max(1, Number(nextQty) || 1);
    if (qtyValue) qtyValue.textContent = detailQty;
    if (addButton) addButton.dataset.addQty = String(detailQty);
  }

  document.querySelectorAll("[data-product-name]").forEach((el) => el.textContent = product.name);
  document.querySelectorAll("[data-product-price]").forEach((el) => el.textContent = FoodeeCart.money(product.price));
  document.querySelectorAll("[data-product-rating]").forEach((el) => el.textContent = product.rating);
  document.querySelectorAll("[data-product-reviews]").forEach((el) => el.textContent = `(${product.reviews} reviews)`);
  document.querySelectorAll("[data-product-desc]").forEach((el) => el.textContent = product.desc);
  const mainImage = document.querySelector("[data-product-image]");
  const productThumb = document.querySelector("[data-product-thumb]");
  if (mainImage) {
    mainImage.src = asset(product.image);
    mainImage.alt = product.name;
  }
  if (productThumb) {
    productThumb.src = asset(product.image);
    productThumb.alt = product.name;
  }
  addButton?.setAttribute("data-add-cart", product.id);
  wishlistButton?.setAttribute("data-wishlist", product.id);
  setDetailQty(1);
  if (related) related.innerHTML = FoodeeData.products.filter((item) => item.id !== product.id).slice(0, 4).map(productCard).join("");
  window.FoodeeWishlistRefresh?.();

  qtyButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      setDetailQty(detailQty + (index === 0 ? -1 : 1));
    });
  });

  document.querySelectorAll(".thumb").forEach((thumb) => {
    thumb.addEventListener("click", () => {
      const image = thumb.querySelector("img");
      const main = document.querySelector("[data-product-image]");
      if (image && main) {
        main.src = image.src;
        main.alt = image.alt || product.name;
      }
      thumb.parentElement.querySelectorAll(".thumb").forEach((item) => item.classList.remove("active"));
      thumb.classList.add("active");
    });
  });

  document.querySelectorAll(".choice-card").forEach((card) => {
    card.addEventListener("click", () => {
      card.parentElement.querySelectorAll(".choice-card").forEach((item) => item.classList.remove("active"));
      card.classList.add("active");
    });
  });
});

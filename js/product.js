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
  let selectedAddOns = [];

  const addOnOptions = [
    { name: "Extra Cheese", price: 30 },
    { name: "Chicken Slice", price: 40 },
    { name: "Jalapenos", price: 20 }
  ];

  function sizeOptions() {
    return [
      { name: "Regular", price: product.price },
      { name: "Large", price: product.price + 50 },
      { name: "XL", price: product.price + 100 }
    ];
  }

  function selectedSize() {
    const active = document.querySelector(".choice-card.active");
    const index = Math.max(0, [...document.querySelectorAll(".choice-card")].indexOf(active));
    return sizeOptions()[index] || sizeOptions()[0];
  }

  function unitPrice() {
    return selectedSize().price + selectedAddOns.reduce((sum, item) => sum + item.price, 0);
  }

  function updatePrice() {
    document.querySelectorAll("[data-product-price]").forEach((el) => el.textContent = FoodeeCart.money(unitPrice()));
  }

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
  document.querySelectorAll(".choice-card").forEach((card, index) => {
    const option = sizeOptions()[index];
    if (!option) return;
    card.childNodes[0].textContent = option.name;
    card.querySelector("small").textContent = FoodeeCart.money(option.price);
  });
  document.querySelectorAll(".addon-card").forEach((card, index) => {
    const option = addOnOptions[index];
    if (!option) return;
    card.dataset.addonName = option.name;
    card.dataset.addonPrice = String(option.price);
  });
  updatePrice();
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
      updatePrice();
    });
  });

  document.querySelectorAll(".addon-card").forEach((card) => {
    const button = card.querySelector("button");
    button?.addEventListener("click", (event) => {
      event.stopPropagation();
      const addon = { name: card.dataset.addonName, price: Number(card.dataset.addonPrice || 0) };
      const exists = selectedAddOns.some((item) => item.name === addon.name);
      selectedAddOns = exists ? selectedAddOns.filter((item) => item.name !== addon.name) : [...selectedAddOns, addon];
      card.classList.toggle("active", !exists);
      button.textContent = exists ? "+" : "x";
      updatePrice();
    });
  });

  addButton?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const size = selectedSize();
    FoodeeCart.add(product.id, detailQty, {
      sizeName: size.name,
      unitPrice: unitPrice(),
      addOns: selectedAddOns
    });
    showToast("Added to cart");
  });
});

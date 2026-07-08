document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#contactForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = {
      name: form.querySelector("#name").value.trim(),
      email: form.querySelector("#email").value.trim(),
      subject: form.querySelector("#subject").value.trim(),
      message: form.querySelector("#message").value.trim()
    };

    try {
      await FoodeeAPI.saveContact(payload);
      showToast("Message sent");
    } catch {
      showToast("Message saved locally");
    }

    form.reset();
  });
});

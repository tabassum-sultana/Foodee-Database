document.addEventListener("DOMContentLoaded", () => {
  const localContactsKey = "foodee-local-contacts";

  function saveLocalContact(payload) {
    let contacts = [];
    try { contacts = JSON.parse(localStorage.getItem(localContactsKey)) || []; }
    catch { contacts = []; }
    contacts.unshift({ ...payload, id: `LC-${Date.now()}`, createdAt: new Date().toISOString() });
    localStorage.setItem(localContactsKey, JSON.stringify(contacts.slice(0, 50)));
  }

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
      saveLocalContact(payload);
      showToast("Message saved locally");
    }

    form.reset();
  });
});

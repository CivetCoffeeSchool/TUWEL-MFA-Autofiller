// popup.js
window.addEventListener("DOMContentLoaded", () => {
  browser.storage.local.get("totpSecret").then(({ totpSecret }) => {
    if (totpSecret) document.getElementById("secret").value = totpSecret;
  });

  document.getElementById("save").onclick = async () => {
    const secret = document.getElementById("secret").value.trim();
    if (!secret) {
      document.getElementById("msg").textContent = "Please enter a secret!";
      return;
    }
    await browser.storage.local.set({ totpSecret: secret });
    document.getElementById("msg").textContent = "Saved!";
    // Verify it actually saved
    const check = await browser.storage.local.get("totpSecret");
    console.log("Saved secret:", check);
  };
});
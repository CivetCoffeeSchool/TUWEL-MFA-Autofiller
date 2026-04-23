// content.js

// --- TOTP ---
async function generateTOTP(base32Secret) {
  const key = base32ToBytes(base32Secret);
  const counter = Math.floor(Date.now() / 30000);
  const msg = new ArrayBuffer(8);
  new DataView(msg).setUint32(4, counter);
  const cryptoKey = await crypto.subtle.importKey(
    "raw", key, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, msg);
  const arr = new Uint8Array(sig);
  const offset = arr[19] & 0xf;
  const code = ((arr[offset] & 0x7f) << 24 | arr[offset+1] << 16 |
                 arr[offset+2] << 8 | arr[offset+3]) % 1000000;
  return code.toString().padStart(6, "0");
}

function base32ToBytes(b32) {
  const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  b32 = b32.toUpperCase().replace(/=+$/, "");
  let bits = 0, val = 0;
  const out = [];
  for (const c of b32) {
    val = (val << 5) | CHARS.indexOf(c);
    bits += 5;
    if (bits >= 8) { out.push((val >>> (bits - 8)) & 255); bits -= 8; }
  }
  return new Uint8Array(out);
}

// --- Autofill ---
async function fillCode() {
  console.log("[2FA] fillCode called");
  const { totpSecret } = await browser.storage.local.get("totpSecret");
  console.log("[2FA] secret found:", !!totpSecret);
  if (!totpSecret) return;

  const code = await generateTOTP(totpSecret);
  console.log("[2FA] generated code:", code);

  const input = document.querySelector('#totp');
  console.log("[2FA] input found:", !!input);
  if (!input) return;

  const nativeInputSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
  nativeInputSetter.call(input, code);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));

  const form = input.closest("form");
  console.log("[2FA] form found:", !!form);
  if (form) form.submit();
}

const observer = new MutationObserver(() => {
  if (document.querySelector('#totp')) {
    observer.disconnect();
    fillCode();
  }
});
observer.observe(document.body, { childList: true, subtree: true });
console.log("[2FA] content script loaded, trying fillCode immediately");
fillCode();
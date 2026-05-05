export function showToast(message, type = "success") {
  window.dispatchEvent(new CustomEvent("mercadinho-toast", { detail: { message, type } }));
}

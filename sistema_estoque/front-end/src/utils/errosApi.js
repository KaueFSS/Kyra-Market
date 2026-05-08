/**
 * Formata o erro do axios/fetch em uma mensagem legível.
 * Trata todos os formatos comuns que o DRF retorna:
 *   - "string"
 *   - { erro: "..." }
 *   - { detail: "..." }
 *   - { nome: ["..."], telefone: ["..."] }   (validação de campo)
 */
export function formatarErroAPI(error, fallback = "Erro inesperado.") {
  // Loga sempre pra debugar via DevTools (Console)
  console.error("[API ERROR]", error?.response?.data || error?.message || error);

  const detail = error?.response?.data;
  if (!detail) return error?.message || fallback;

  if (typeof detail === "string") return detail;
  if (detail.erro)   return detail.erro;
  if (detail.detail) return detail.detail;

  if (typeof detail === "object") {
    const partes = Object.entries(detail).map(([campo, msgs]) => {
      const m = Array.isArray(msgs) ? msgs.join(", ") : String(msgs);
      return `${campo}: ${m}`;
    });
    if (partes.length) return partes.join(" • ");
  }

  return fallback;
}

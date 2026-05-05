export function formatarFormaPagamento(forma) {
  const mapa = {
    dinheiro:       { label: "Dinheiro",  cls: "badge-green",  icon: "💵" },
    pix:            { label: "PIX",       cls: "badge-green",  icon: "🔗" },
    cartao_debito:  { label: "Débito",    cls: "badge-blue",   icon: "💳" },
    cartao_credito: { label: "Crédito",   cls: "badge-blue",   icon: "💳" },
    fiado:          { label: "Fiado",     cls: "badge-purple", icon: "👤" },
  };
  return mapa[forma] || { label: forma || "—", cls: "badge-gray", icon: "" };
}

export function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatarData(dataStr) {
  if (!dataStr) return "—";
  const [ano, mes, dia] = dataStr.split("-");
  return `${dia}/${mes}/${ano}`;
}

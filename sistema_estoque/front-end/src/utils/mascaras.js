export function mascaraCNPJ(v) {
  v = v.replace(/\D/g, "").slice(0, 14);
  if (v.length <= 2)  return v;
  if (v.length <= 5)  return `${v.slice(0,2)}.${v.slice(2)}`;
  if (v.length <= 8)  return `${v.slice(0,2)}.${v.slice(2,5)}.${v.slice(5)}`;
  if (v.length <= 12) return `${v.slice(0,2)}.${v.slice(2,5)}.${v.slice(5,8)}/${v.slice(8)}`;
  return `${v.slice(0,2)}.${v.slice(2,5)}.${v.slice(5,8)}/${v.slice(8,12)}-${v.slice(12)}`;
}

export function mascaraTelefone(v) {
  v = v.replace(/\D/g, "").slice(0, 11);
  if (v.length <= 2)  return v;
  if (v.length <= 6)  return `(${v.slice(0,2)}) ${v.slice(2)}`;
  if (v.length <= 10) return `(${v.slice(0,2)}) ${v.slice(2,6)}-${v.slice(6)}`;
  return `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
}

export function mascaraCEP(v) {
  v = v.replace(/\D/g, "").slice(0, 8);
  if (v.length <= 5) return v;
  return `${v.slice(0,5)}-${v.slice(5)}`;
}

/* Retorna apenas dígitos — use antes de enviar ao backend */
export function limparMascara(v) {
  return String(v).replace(/\D/g, "");
}

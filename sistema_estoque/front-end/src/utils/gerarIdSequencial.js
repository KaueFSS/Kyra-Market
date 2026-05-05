export function gerarIdSequencial(registros, campoId, prefixo) {
  const maiorNumero = registros.reduce((maior, registro) => {
    const id = String(registro?.[campoId] || "");
    const sufixo = id.startsWith(prefixo) ? id.slice(prefixo.length) : "";

    if (!/^\d+$/.test(sufixo)) {
      return maior;
    }

    return Math.max(maior, Number.parseInt(sufixo, 10));
  }, 0);

  const tamanhoSufixo = Math.max(1, 10 - prefixo.length);
  return `${prefixo}${String(maiorNumero + 1).padStart(tamanhoSufixo, "0")}`;
}

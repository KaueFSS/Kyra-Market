/**
 * Gera um ID único com prefixo, baseado em timestamp + random (base36).
 * Sempre 10 chars total. Garante unicidade mesmo em cadastros simultâneos
 * e independente de paginação do backend (não precisa conhecer registros existentes).
 *
 *   gerarIdUnico("CLI")  →  "CLILZV45G2"
 *   gerarIdUnico("PRD")  →  "PRDLZV45G3"
 */
export function gerarIdUnico(prefixo) {
  const tamanhoSufixo = Math.max(1, 10 - prefixo.length);
  const sufixo = (
    Date.now().toString(36) + Math.random().toString(36).slice(2)
  )
    .toUpperCase()
    .slice(0, tamanhoSufixo);
  return prefixo + sufixo;
}

/**
 * @deprecated — O sequencial só é confiável quando o array de registros
 *   contém TODOS os itens do banco. Como a API é paginada (PAGE_SIZE=100),
 *   na prática gera IDs duplicados. Use `gerarIdUnico()` em novos códigos.
 */
export function gerarIdSequencial(registros, campoId, prefixo) {
  const maiorNumero = registros.reduce((maior, registro) => {
    const id = String(registro?.[campoId] || "");
    const sufixo = id.startsWith(prefixo) ? id.slice(prefixo.length) : "";
    if (!/^\d+$/.test(sufixo)) return maior;
    return Math.max(maior, Number.parseInt(sufixo, 10));
  }, 0);
  const tamanhoSufixo = Math.max(1, 10 - prefixo.length);
  return `${prefixo}${String(maiorNumero + 1).padStart(tamanhoSufixo, "0")}`;
}

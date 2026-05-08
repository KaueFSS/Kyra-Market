import { formatarErroAPI } from "./errosApi";

export async function excluirEmLote(api, endpoint, ids) {
  const resultados = await Promise.allSettled(
    ids.map((id) => api.delete(`${endpoint}/${id}/`))
  );

  return resultados.reduce(
    (acc, resultado, index) => {
      const id = ids[index];
      if (resultado.status === "fulfilled") {
        acc.excluidos.push(id);
      } else {
        acc.falhas.push({
          id,
          erro: formatarErroAPI(resultado.reason, "Erro ao excluir."),
        });
      }
      return acc;
    },
    { excluidos: [], falhas: [] }
  );
}

export function mensagemFalhasExclusao(falhas) {
  if (!falhas.length) return "";

  const primeira = falhas[0];
  const prefixo = falhas.length === 1
    ? `${primeira.id} nao foi excluido`
    : `${falhas.length} registros nao foram excluidos`;

  return `${prefixo}: ${primeira.erro}`;
}

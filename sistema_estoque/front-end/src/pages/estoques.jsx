import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import FormSelectSearch from "../components/FormSelectSearch";

function Estoques() {
  const [estoques, setEstoques] = useState([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [temProxima, setTemProxima] = useState(false);
  const [temAnterior, setTemAnterior] = useState(false);
  const [estoqueSelecionado, setEstoqueSelecionado] = useState("");

  useEffect(() => {
    setCarregando(true);
    setEstoqueSelecionado("");
    api.get(`/estoques/?page=${pagina}`)
      .then((response) => {
        if (Array.isArray(response.data)) {
          setEstoques(response.data);
          setTemProxima(false);
          setTemAnterior(false);
        } else if (response.data.results) {
          setEstoques(response.data.results);
          setTemProxima(response.data.next !== null);
          setTemAnterior(response.data.previous !== null);
        } else {
          setEstoques([]);
        }
        setErro("");
      })
      .catch(() => setErro("Não foi possível carregar os estoques."))
      .finally(() => setCarregando(false));
  }, [pagina]);

  function alterarEstoqueSelecionado(event) {
    setEstoqueSelecionado(event.target.value);
  }

  const opcoesEstoques = estoques.map((estoque) => ({
    value: estoque.id_estoque,
    label: `${estoque.id_estoque} - ${estoque.produto_nome || estoque.produto}`,
  }));

  const estoquesFiltrados = estoqueSelecionado
    ? estoques.filter((estoque) => estoque.id_estoque === estoqueSelecionado)
    : estoques;

  return (
    <div style={{ color: "white", padding: "30px" }}>
      <h1>Estoques</h1>

      {carregando && <p>Carregando...</p>}
      {erro && <p style={{ color: "red" }}>{erro}</p>}
      {!carregando && !erro && estoques.length === 0 && <p>Nenhum estoque encontrado.</p>}

      {estoques.length > 0 && (
        <>
          <FormSelectSearch
            label="Pesquisar estoque"
            name="estoqueSelecionado"
            value={estoqueSelecionado}
            onChange={alterarEstoqueSelecionado}
            options={opcoesEstoques}
            placeholder="Selecione um estoque..."
            isClearable={true}
          />

          <table border="1" cellPadding="10" style={{ borderCollapse: "collapse", marginTop: "20px", width: "100%" }}>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Qtd. Atual</th>
                <th>Qtd. Mínima</th>
                <th>Última Entrada</th>
                <th>Última Saída</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {estoquesFiltrados.map((e) => {
                const abaixoMinimo = e.quantidade_atual < e.quantidade_minima;
                return (
                  <tr key={e.id_estoque}>
                    <td>{e.produto_nome || e.produto}</td>
                    <td>{e.quantidade_atual}</td>
                    <td>{e.quantidade_minima}</td>
                    <td>{e.dt_ultima_entrada || "—"}</td>
                    <td>{e.dt_ultima_saida || "—"}</td>
                    <td style={{ color: abaixoMinimo ? "#f87171" : "#4ade80", fontWeight: "bold" }}>
                      {abaixoMinimo ? "⚠ Baixo" : "✓ OK"}
                    </td>
                    <td><Link to={`/estoques/${e.id_estoque}/editar`} style={{ color: "#60a5fa" }}>Editar</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
            <button onClick={() => setPagina(pagina - 1)} disabled={!temAnterior}>Página anterior</button>
            <span>Página {pagina}</span>
            <button onClick={() => setPagina(pagina + 1)} disabled={!temProxima}>Próxima página</button>
          </div>
        </>
      )}
    </div>
  );
}

export default Estoques;

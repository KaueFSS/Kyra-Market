import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function Estoques() {
  const [estoques, setEstoques] = useState([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [temProxima, setTemProxima] = useState(false);
  const [temAnterior, setTemAnterior] = useState(false);

  useEffect(() => {
    setCarregando(true);
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

  return (
    <div style={{ color: "white", padding: "30px" }}>
      <h1>Estoques</h1>

      {carregando && <p>Carregando...</p>}
      {erro && <p style={{ color: "red" }}>{erro}</p>}
      {!carregando && !erro && estoques.length === 0 && <p>Nenhum estoque encontrado.</p>}

      {estoques.length > 0 && (
        <>
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
              {estoques.map((e) => {
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

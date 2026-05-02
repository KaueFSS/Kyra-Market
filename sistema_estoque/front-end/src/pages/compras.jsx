import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function Compras() {
  const [compras, setCompras] = useState([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [temProxima, setTemProxima] = useState(false);
  const [temAnterior, setTemAnterior] = useState(false);

  useEffect(() => {
    setCarregando(true);
    api.get(`/compras/?page=${pagina}`)
      .then((response) => {
        if (Array.isArray(response.data)) {
          setCompras(response.data);
          setTemProxima(false);
          setTemAnterior(false);
        } else if (response.data.results) {
          setCompras(response.data.results);
          setTemProxima(response.data.next !== null);
          setTemAnterior(response.data.previous !== null);
        } else {
          setCompras([]);
        }
        setErro("");
      })
      .catch(() => setErro("Não foi possível carregar as compras."))
      .finally(() => setCarregando(false));
  }, [pagina]);

  return (
    <div style={{ color: "white", padding: "30px" }}>
      <h1>Compras</h1>

      {carregando && <p>Carregando...</p>}
      {erro && <p style={{ color: "red" }}>{erro}</p>}
      {!carregando && !erro && compras.length === 0 && <p>Nenhuma compra encontrada.</p>}

      {compras.length > 0 && (
        <>
          <table border="1" cellPadding="10" style={{ borderCollapse: "collapse", marginTop: "20px", width: "100%" }}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Fornecedor</th>
                <th>Funcionário</th>
                <th>Data</th>
                <th>Status</th>
                <th>Entregue</th>
                <th>Valor Total</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {compras.map((c) => (
                <tr key={c.id_compra}>
                  <td>{c.nome || "—"}</td>
                  <td>{c.fornecedor_nome || c.fornecedor}</td>
                  <td>{c.funcionario_nome || c.funcionario}</td>
                  <td>{c.data_compra}</td>
                  <td>{c.status}</td>
                  <td>{c.entregue ? "✓ Sim" : "✗ Não"}</td>
                  <td>R$ {parseFloat(c.valor_total).toFixed(2)}</td>
                  <td><Link to={`/compras/${c.id_compra}/editar`} style={{ color: "#60a5fa" }}>Editar</Link></td>
                </tr>
              ))}
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

export default Compras;

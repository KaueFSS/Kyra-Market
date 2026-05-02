import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function Despesas() {
  const [despesas, setDespesas] = useState([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [temProxima, setTemProxima] = useState(false);
  const [temAnterior, setTemAnterior] = useState(false);

  useEffect(() => {
    setCarregando(true);
    api.get(`/despesas/?page=${pagina}`)
      .then((response) => {
        if (Array.isArray(response.data)) {
          setDespesas(response.data);
          setTemProxima(false);
          setTemAnterior(false);
        } else if (response.data.results) {
          setDespesas(response.data.results);
          setTemProxima(response.data.next !== null);
          setTemAnterior(response.data.previous !== null);
        } else {
          setDespesas([]);
        }
        setErro("");
      })
      .catch(() => setErro("Não foi possível carregar as despesas."))
      .finally(() => setCarregando(false));
  }, [pagina]);

  return (
    <div style={{ color: "white", padding: "30px" }}>
      <h1>Despesas</h1>

      {carregando && <p>Carregando...</p>}
      {erro && <p style={{ color: "red" }}>{erro}</p>}
      {!carregando && !erro && despesas.length === 0 && <p>Nenhuma despesa encontrada.</p>}

      {despesas.length > 0 && (
        <>
          <table border="1" cellPadding="10" style={{ borderCollapse: "collapse", marginTop: "20px", width: "100%" }}>
            <thead>
              <tr>
                <th>Data</th>
                <th>Categoria</th>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Funcionário</th>
                <th>Recorrente</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {despesas.map((d) => (
                <tr key={d.id_despesa}>
                  <td>{d.data}</td>
                  <td>{d.categoria}</td>
                  <td>{d.descricao || "—"}</td>
                  <td>R$ {parseFloat(d.valor).toFixed(2)}</td>
                  <td>{d.funcionario_nome || d.funcionario}</td>
                  <td>{d.recorrente ? "Sim" : "Não"}</td>
                  <td><Link to={`/despesas/${d.id_despesa}/editar`} style={{ color: "#60a5fa" }}>Editar</Link></td>
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

export default Despesas;

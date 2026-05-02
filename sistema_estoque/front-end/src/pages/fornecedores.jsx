import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function Fornecedores() {
  const [fornecedores, setFornecedores] = useState([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [temProxima, setTemProxima] = useState(false);
  const [temAnterior, setTemAnterior] = useState(false);

  useEffect(() => {
    setCarregando(true);
    api.get(`/fornecedores/?page=${pagina}`)
      .then((response) => {
        if (Array.isArray(response.data)) {
          setFornecedores(response.data);
          setTemProxima(false);
          setTemAnterior(false);
        } else if (response.data.results) {
          setFornecedores(response.data.results);
          setTemProxima(response.data.next !== null);
          setTemAnterior(response.data.previous !== null);
        } else {
          setFornecedores([]);
        }
        setErro("");
      })
      .catch(() => setErro("Não foi possível carregar os fornecedores."))
      .finally(() => setCarregando(false));
  }, [pagina]);

  return (
    <div style={{ color: "white", padding: "30px" }}>
      <h1>Fornecedores</h1>

      {carregando && <p>Carregando...</p>}
      {erro && <p style={{ color: "red" }}>{erro}</p>}
      {!carregando && !erro && fornecedores.length === 0 && <p>Nenhum fornecedor encontrado.</p>}

      {fornecedores.length > 0 && (
        <>
          <table border="1" cellPadding="10" style={{ borderCollapse: "collapse", marginTop: "20px", width: "100%" }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Razão Social</th>
                <th>Nome Fantasia</th>
                <th>CNPJ</th>
                <th>Cidade</th>
                <th>UF</th>
                <th>Telefone</th>
                <th>Avaliação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {fornecedores.map((f) => (
                <tr key={f.id_fornecedor}>
                  <td>{f.id_fornecedor}</td>
                  <td>{f.razao_social}</td>
                  <td>{f.nome_fantasia}</td>
                  <td>{f.cnpj}</td>
                  <td>{f.cidade}</td>
                  <td>{f.uf}</td>
                  <td>{f.telefone}</td>
                  <td>{f.avaliacao}</td>
                  <td><Link to={`/fornecedores/${f.id_fornecedor}/editar`} style={{ color: "#60a5fa" }}>Editar</Link></td>
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

export default Fornecedores;

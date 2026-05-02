import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function Produtos() {
  const [produtos, setProdutos] = useState([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [temProxima, setTemProxima] = useState(false);
  const [temAnterior, setTemAnterior] = useState(false);

  useEffect(() => {
    setCarregando(true);
    api.get(`/produtos/?page=${pagina}`)
      .then((response) => {
        if (Array.isArray(response.data)) {
          setProdutos(response.data);
          setTemProxima(false);
          setTemAnterior(false);
        } else if (response.data.results) {
          setProdutos(response.data.results);
          setTemProxima(response.data.next !== null);
          setTemAnterior(response.data.previous !== null);
        } else {
          setProdutos([]);
        }
        setErro("");
      })
      .catch(() => setErro("Não foi possível carregar os produtos."))
      .finally(() => setCarregando(false));
  }, [pagina]);

  return (
    <div style={{ color: "white", padding: "30px" }}>
      <h1>Produtos</h1>

      {carregando && <p>Carregando...</p>}
      {erro && <p style={{ color: "red" }}>{erro}</p>}
      {!carregando && !erro && produtos.length === 0 && <p>Nenhum produto encontrado.</p>}

      {produtos.length > 0 && (
        <>
          <table border="1" cellPadding="10" style={{ borderCollapse: "collapse", marginTop: "20px", width: "100%" }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Categoria</th>
                <th>Marca</th>
                <th>Unidade</th>
                <th>Preço Custo</th>
                <th>Preço Venda</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((p) => (
                <tr key={p.id_produto}>
                  <td>{p.id_produto}</td>
                  <td>{p.nome}</td>
                  <td>{p.categoria}</td>
                  <td>{p.marca}</td>
                  <td>{p.unidade}</td>
                  <td>R$ {parseFloat(p.preco_custo).toFixed(2)}</td>
                  <td>R$ {parseFloat(p.preco).toFixed(2)}</td>
                  <td><Link to={`/produtos/${p.id_produto}/editar`} style={{ color: "#60a5fa" }}>Editar</Link></td>
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

export default Produtos;

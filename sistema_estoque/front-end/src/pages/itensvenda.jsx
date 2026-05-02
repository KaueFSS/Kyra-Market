import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function ItensVenda() {
  const [itensVenda, setItensVenda] = useState([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [temProxima, setTemProxima] = useState(false);
  const [temAnterior, setTemAnterior] = useState(false);

  useEffect(() => {
    setCarregando(true);
    api.get(`/itens-venda/?page=${pagina}`)
      .then((response) => {
        if (Array.isArray(response.data)) {
          setItensVenda(response.data);
          setTemProxima(false);
          setTemAnterior(false);
        } else if (response.data.results) {
          setItensVenda(response.data.results);
          setTemProxima(response.data.next !== null);
          setTemAnterior(response.data.previous !== null);
        } else {
          setItensVenda([]);
        }
        setErro("");
      })
      .catch(() => setErro("Não foi possível carregar os itens de venda."))
      .finally(() => setCarregando(false));
  }, [pagina]);

  return (
    <div style={{ color: "white", padding: "30px" }}>
      <h1>Itens de Venda</h1>
      <p>Produtos associados às vendas realizadas.</p>

      {carregando && <p>Carregando itens de venda...</p>}
      {erro && <p style={{ color: "red" }}>{erro}</p>}
      {!carregando && !erro && itensVenda.length === 0 && <p>Nenhum item de venda encontrado.</p>}

      {itensVenda.length > 0 && (
        <>
          <table border="1" cellPadding="10" style={{ borderCollapse: "collapse", marginTop: "20px", width: "100%" }}>
            <thead>
              <tr>
                <th>Venda</th>
                <th>Produto</th>
                <th>Quantidade</th>
                <th>Preço Unitário</th>
                <th>Desconto</th>
                <th>Subtotal</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {itensVenda.map((item, index) => (
                <tr key={item.id_item_venda || index}>
                  <td>{item.venda}</td>
                  <td>{item.produto_nome || item.produto}</td>
                  <td>{item.quantidade_vendida}</td>
                  <td>R$ {parseFloat(item.preco_unitario).toFixed(2)}</td>
                  <td>R$ {parseFloat(item.desconto_aplicado).toFixed(2)}</td>
                  <td>R$ {parseFloat(item.subtotal).toFixed(2)}</td>
                  <td><Link to={`/itens-venda/${item.id_item_venda}/editar`} style={{ color: "#60a5fa" }}>Editar</Link></td>
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

export default ItensVenda;

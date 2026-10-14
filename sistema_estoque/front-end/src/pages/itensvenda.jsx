import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { formatarMoeda } from "../utils/formatadores";

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
    <div className="page-container">
      <h1 className="page-title">Itens de venda</h1>
      <p className="page-subtitle">Produtos associados às vendas realizadas.</p>

      {carregando && <p className="loading-text">Carregando itens de venda...</p>}
      {erro && <div className="alert-msg">{erro}</div>}
      {!carregando && !erro && itensVenda.length === 0 && (
        <p className="empty-state">Nenhum item de venda encontrado.</p>
      )}

      {itensVenda.length > 0 && (
        <>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Venda</th>
                  <th>Produto</th>
                  <th className="cell-right">Quantidade</th>
                  <th className="cell-right">Preço unitário</th>
                  <th className="cell-right">Desconto</th>
                  <th className="cell-right">Subtotal</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {itensVenda.map((item, index) => (
                  <tr key={item.id_item_venda || index}>
                    <td>{item.venda}</td>
                    <td>{item.produto_nome || item.produto}</td>
                    <td className="cell-num">{item.quantidade_vendida}</td>
                    <td className="cell-num">{formatarMoeda(item.preco_unitario)}</td>
                    <td className="cell-num">{formatarMoeda(item.desconto_aplicado)}</td>
                    <td className="cell-num cell-strong">{formatarMoeda(item.subtotal)}</td>
                    <td>
                      <div className="table-actions">
                        <Link to={`/itens-venda/${item.id_item_venda}/editar`}>Editar</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button className="pagination-btn" onClick={() => setPagina(pagina - 1)} disabled={!temAnterior}>← Anterior</button>
            <span className="pagination-info">Página {pagina}</span>
            <button className="pagination-btn" onClick={() => setPagina(pagina + 1)} disabled={!temProxima}>Próxima →</button>
          </div>
        </>
      )}
    </div>
  );
}

export default ItensVenda;

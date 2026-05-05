import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { formatarMoeda } from "../utils/formatadores";

function ItensCompra() {
  const [itens, setItens] = useState([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [temProxima, setTemProxima] = useState(false);
  const [temAnterior, setTemAnterior] = useState(false);

  useEffect(() => {
    setCarregando(true);
    api.get(`/itens-compra/?page=${pagina}`)
      .then((response) => {
        if (Array.isArray(response.data)) {
          setItens(response.data);
          setTemProxima(false);
          setTemAnterior(false);
        } else if (response.data.results) {
          setItens(response.data.results);
          setTemProxima(response.data.next !== null);
          setTemAnterior(response.data.previous !== null);
        } else {
          setItens([]);
        }
        setErro("");
      })
      .catch(() => setErro("Não foi possível carregar os itens de compra."))
      .finally(() => setCarregando(false));
  }, [pagina]);

  return (
    <div className="page-container">
      <h1 className="page-title">Itens de Compra</h1>

      {carregando && <p className="loading-text">Carregando...</p>}
      {erro && <div className="alert-msg">⚠️ {erro}</div>}
      {!carregando && !erro && itens.length === 0 && (
        <p className="empty-state">Nenhum item encontrado.</p>
      )}

      {itens.length > 0 && (
        <>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Compra</th>
                  <th>Produto</th>
                  <th>Quantidade</th>
                  <th>Valor Unitário</th>
                  <th>Total</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((item) => (
                  <tr key={item.id_item_compra}>
                    <td>{item.compra}</td>
                    <td>{item.produto_nome || item.produto}</td>
                    <td>{item.quantidade}</td>
                    <td>{formatarMoeda(item.valor_unitario)}</td>
                    <td style={{ fontWeight: 600, color: "var(--accent-green)" }}>
                      {formatarMoeda(item.quantidade * parseFloat(item.valor_unitario))}
                    </td>
                    <td>
                      <div className="table-actions">
                        <Link to={`/itens-compra/${item.id_item_compra}/editar`}>Editar</Link>
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

export default ItensCompra;

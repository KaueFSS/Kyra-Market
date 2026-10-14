import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";
import { formatarMoeda, formatarData } from "../utils/formatadores";

function DetalhesCompra() {
  const { id } = useParams();
  const [compra, setCompra] = useState(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    setCarregando(true);
    api
      .get(`/compras/${id}/`)
      .then((response) => {
        setCompra(response.data);
        setErro("");
      })
      .catch(() => {
        setErro("Não foi possível carregar os detalhes da compra.");
        setCompra(null);
      })
      .finally(() => setCarregando(false));
  }, [id]);

  if (carregando) {
    return <div className="page-container"><p className="loading-text">Carregando compra...</p></div>;
  }

  if (erro) {
    return (
      <div className="page-container">
        <p className="alert-msg">{erro}</p>
        <Link to="/compras" className="btn btn-back">← Voltar para compras</Link>
      </div>
    );
  }

  if (!compra) return null;

  const itens = compra.itens || [];
  const statusCls = compra.status === "Entregue" ? "badge-green" : "badge-orange";

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Detalhes da compra</h1>
          <p className="page-subtitle">Compra {compra.id_compra}{compra.nome ? ` — ${compra.nome}` : ""}</p>
        </div>
        <Link to="/compras" className="btn btn-back">← Voltar</Link>
      </div>

      <div className="card detail-grid">
        <div>
          <p className="detail-label">Fornecedor</p>
          <p className="detail-value">{compra.fornecedor_nome || compra.fornecedor || "—"}</p>
        </div>
        <div>
          <p className="detail-label">Funcionário</p>
          <p className="detail-value">{compra.funcionario_nome || compra.funcionario || "—"}</p>
        </div>
        <div>
          <p className="detail-label">Data da compra</p>
          <p className="detail-value">{formatarData(compra.data_compra)}</p>
        </div>
        <div>
          <p className="detail-label">Status</p>
          <span className={`badge ${statusCls}`}>{compra.status || "Sem status"}</span>
        </div>
        <div>
          <p className="detail-label">Entregue</p>
          <span className={`badge ${compra.entregue ? "badge-green" : "badge-gray"}`}>
            {compra.entregue ? "Sim" : "Não"}
          </span>
        </div>
        <div>
          <p className="detail-label">Nota fiscal</p>
          <p className="detail-value">{compra.nota_fiscal || "Não informada"}</p>
        </div>
        <div>
          <p className="detail-label">Valor total</p>
          <p className="detail-value detail-value-lg">{formatarMoeda(compra.valor_total)}</p>
        </div>
      </div>

      <h2 className="section-heading">
        Produtos da compra
      </h2>

      {itens.length === 0 ? (
        <p className="empty-state">Nenhum item vinculado a esta compra.</p>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th className="cell-right">Quantidade</th>
                <th className="cell-right">Valor unitário</th>
                <th className="cell-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((item) => {
                const total = Number(item.quantidade || 0) * Number.parseFloat(item.valor_unitario || 0);
                return (
                  <tr key={item.id_item_compra}>
                    <td>{item.produto_nome || item.produto}</td>
                    <td className="cell-num">{item.quantidade}</td>
                    <td className="cell-num">{formatarMoeda(item.valor_unitario)}</td>
                    <td className="cell-num cell-strong">{formatarMoeda(total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default DetalhesCompra;

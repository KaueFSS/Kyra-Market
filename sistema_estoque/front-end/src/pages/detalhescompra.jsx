import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";
import { formatarMoeda } from "../utils/formatadores";

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>Detalhes da Compra</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Compra {compra.id_compra}{compra.nome ? ` — ${compra.nome}` : ""}</p>
        </div>
        <Link to="/compras" className="btn btn-back">← Voltar</Link>
      </div>

      <div className="card" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 20, marginBottom: 24 }}>
        <div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: 4 }}>Fornecedor</p>
          <p style={{ fontWeight: 600 }}>{compra.fornecedor_nome || compra.fornecedor || "—"}</p>
        </div>
        <div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: 4 }}>Funcionário</p>
          <p style={{ fontWeight: 600 }}>{compra.funcionario_nome || compra.funcionario || "—"}</p>
        </div>
        <div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: 4 }}>Data da Compra</p>
          <p style={{ fontWeight: 600 }}>{compra.data_compra || "—"}</p>
        </div>
        <div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: 4 }}>Status</p>
          <span className={`badge ${statusCls}`}>{compra.status || "Sem status"}</span>
        </div>
        <div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: 4 }}>Entregue</p>
          <span className={`badge ${compra.entregue ? "badge-green" : "badge-gray"}`}>
            {compra.entregue ? "Sim" : "Não"}
          </span>
        </div>
        <div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: 4 }}>Nota Fiscal</p>
          <p style={{ fontWeight: 600 }}>{compra.nota_fiscal || "Não informada"}</p>
        </div>
        <div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: 4 }}>Valor Total</p>
          <p style={{ fontWeight: 700, fontSize: "1.2rem", color: "var(--accent-green)" }}>{formatarMoeda(compra.valor_total)}</p>
        </div>
      </div>

      <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
        Produtos da Compra
      </h2>

      {itens.length === 0 ? (
        <p style={{ color: "var(--text-secondary)" }}>Nenhum item vinculado a esta compra.</p>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Quantidade</th>
                <th>Valor Unitário</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((item) => {
                const total = Number(item.quantidade || 0) * Number.parseFloat(item.valor_unitario || 0);
                return (
                  <tr key={item.id_item_compra}>
                    <td>{item.produto_nome || item.produto}</td>
                    <td>{item.quantidade}</td>
                    <td>{formatarMoeda(item.valor_unitario)}</td>
                    <td style={{ color: "var(--accent-green)", fontWeight: 600 }}>{formatarMoeda(total)}</td>
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

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";
import { formatarMoeda, formatarFormaPagamento } from "../utils/formatadores";

function DetalhesVenda() {
  const { id } = useParams();
  const [venda, setVenda] = useState(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    setCarregando(true);
    api
      .get(`/vendas/${id}/`)
      .then((response) => {
        setVenda(response.data);
        setErro("");
      })
      .catch(() => {
        setErro("Não foi possível carregar os detalhes da venda.");
        setVenda(null);
      })
      .finally(() => setCarregando(false));
  }, [id]);

  if (carregando) {
    return <div className="page-container"><p className="loading-text">Carregando venda...</p></div>;
  }

  if (erro) {
    return (
      <div className="page-container">
        <p className="alert-msg">{erro}</p>
        <Link to="/vendas" className="btn btn-back">← Voltar para vendas</Link>
      </div>
    );
  }

  if (!venda) return null;

  const itens = venda.itens || [];
  const pagto = formatarFormaPagamento(venda.forma_pagamento);

  return (
    <div className="page-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>Detalhes da Venda</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Venda {venda.id_venda}{venda.nome ? ` — ${venda.nome}` : ""}</p>
        </div>
        <Link to="/vendas" className="btn btn-back">← Voltar</Link>
      </div>

      <div className="card" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 20, marginBottom: 24 }}>
        <div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: 4 }}>Data</p>
          <p style={{ fontWeight: 600 }}>{venda.data_venda}</p>
        </div>
        <div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: 4 }}>Hora</p>
          <p style={{ fontWeight: 600 }}>{venda.hora || "—"}</p>
        </div>
        <div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: 4 }}>Forma de Pagamento</p>
          <span className={`badge ${pagto.cls}`}>{pagto.icon} {pagto.label}</span>
        </div>
        <div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: 4 }}>Funcionário</p>
          <p style={{ fontWeight: 600 }}>{venda.funcionario_nome || venda.funcionario || "—"}</p>
        </div>
        <div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: 4 }}>Cliente</p>
          <p style={{ fontWeight: 600 }}>{venda.cliente_nome || venda.cliente || "Não informado"}</p>
        </div>
        <div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: 4 }}>Total</p>
          <p style={{ fontWeight: 700, fontSize: "1.2rem", color: "var(--accent-green)" }}>{formatarMoeda(venda.total)}</p>
        </div>
      </div>

      <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
        Produtos da Venda
      </h2>

      {itens.length === 0 ? (
        <p style={{ color: "var(--text-secondary)" }}>Nenhum item vinculado a esta venda.</p>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Quantidade</th>
                <th>Preço Unit.</th>
                <th>Desconto</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((item) => (
                <tr key={item.id_item_venda}>
                  <td>{item.produto_nome || item.produto}</td>
                  <td>{item.quantidade_vendida}</td>
                  <td>{formatarMoeda(item.preco_unitario)}</td>
                  <td>{formatarMoeda(item.desconto_aplicado)}</td>
                  <td style={{ color: "var(--accent-green)", fontWeight: 600 }}>{formatarMoeda(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default DetalhesVenda;

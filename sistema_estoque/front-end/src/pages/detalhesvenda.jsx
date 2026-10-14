import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";
import { formatarMoeda, formatarFormaPagamento, formatarData } from "../utils/formatadores";

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
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Detalhes da venda</h1>
          <p className="page-subtitle">Venda {venda.id_venda}{venda.nome ? ` — ${venda.nome}` : ""}</p>
        </div>
        <Link to="/vendas" className="btn btn-back">← Voltar</Link>
      </div>

      <div className="card detail-grid">
        <div>
          <p className="detail-label">Data</p>
          <p className="detail-value">{formatarData(venda.data_venda)}</p>
        </div>
        <div>
          <p className="detail-label">Hora</p>
          <p className="detail-value">{venda.hora ? venda.hora.slice(0, 5) : "—"}</p>
        </div>
        <div>
          <p className="detail-label">Forma de pagamento</p>
          <span className={`badge ${pagto.cls}`}>{pagto.label}</span>
        </div>
        <div>
          <p className="detail-label">Funcionário</p>
          <p className="detail-value">{venda.funcionario_nome || venda.funcionario || "—"}</p>
        </div>
        <div>
          <p className="detail-label">Cliente</p>
          <p className="detail-value">{venda.cliente_nome || venda.cliente || "Não informado"}</p>
        </div>
        <div>
          <p className="detail-label">Total</p>
          <p className="detail-value detail-value-lg">{formatarMoeda(venda.total)}</p>
        </div>
      </div>

      <h2 className="section-heading">
        Produtos da venda
      </h2>

      {itens.length === 0 ? (
        <p className="empty-state">Nenhum item vinculado a esta venda.</p>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th className="cell-right">Quantidade</th>
                <th className="cell-right">Preço unit.</th>
                <th className="cell-right">Desconto</th>
                <th className="cell-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((item) => (
                <tr key={item.id_item_venda}>
                  <td>{item.produto_nome || item.produto}</td>
                  <td className="cell-num">{item.quantidade_vendida}</td>
                  <td className="cell-num">{formatarMoeda(item.preco_unitario)}</td>
                  <td className="cell-num">{formatarMoeda(item.desconto_aplicado)}</td>
                  <td className="cell-num cell-strong">{formatarMoeda(item.subtotal)}</td>
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

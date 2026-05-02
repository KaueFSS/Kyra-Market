import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";

function formatarMoeda(valor) {
  return `R$ ${Number.parseFloat(valor || 0).toFixed(2)}`;
}

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
        setErro("Nao foi possivel carregar os detalhes da venda.");
        setVenda(null);
      })
      .finally(() => setCarregando(false));
  }, [id]);

  if (carregando) {
    return <div style={{ color: "white", padding: "30px" }}>Carregando venda...</div>;
  }

  if (erro) {
    return (
      <div style={{ color: "white", padding: "30px" }}>
        <p style={{ color: "red" }}>{erro}</p>
        <Link to="/vendas" style={{ color: "#60a5fa" }}>
          Voltar para vendas
        </Link>
      </div>
    );
  }

  if (!venda) {
    return null;
  }

  const itens = venda.itens || [];

  return (
    <div style={{ color: "white", padding: "30px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "20px", alignItems: "center" }}>
        <div>
          <h1>Detalhes da Venda</h1>
          <p style={{ color: "#aaa" }}>Venda {venda.id_venda}</p>
        </div>

        <Link to="/vendas" style={{ color: "#60a5fa" }}>
          Voltar
        </Link>
      </div>

      <div
        style={{
          marginTop: "20px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px",
        }}
      >
        <div>
          <strong>Data</strong>
          <p>{venda.data_venda}</p>
        </div>
        <div>
          <strong>Hora</strong>
          <p>{venda.hora}</p>
        </div>
        <div>
          <strong>Forma de Pagamento</strong>
          <p>{venda.forma_pagamento}</p>
        </div>
        <div>
          <strong>Funcionario</strong>
          <p>{venda.funcionario_nome || venda.funcionario}</p>
        </div>
        <div>
          <strong>Cliente</strong>
          <p>{venda.cliente_nome || venda.cliente || "Cliente nao informado"}</p>
        </div>
        <div>
          <strong>Total</strong>
          <p style={{ color: "#4ade80", fontWeight: "bold" }}>{formatarMoeda(venda.total)}</p>
        </div>
      </div>

      <h2 style={{ marginTop: "30px" }}>Produtos da Venda</h2>

      {itens.length === 0 ? (
        <p>Nenhum item vinculado a esta venda.</p>
      ) : (
        <table
          border="1"
          cellPadding="10"
          style={{ borderCollapse: "collapse", marginTop: "20px", width: "100%" }}
        >
          <thead>
            <tr>
              <th>Produto</th>
              <th>Quantidade</th>
              <th>Desconto</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item) => (
              <tr key={item.id_item_venda}>
                <td>{item.produto_nome || item.produto}</td>
                <td>{item.quantidade_vendida}</td>
                <td>{formatarMoeda(item.desconto_aplicado)}</td>
                <td>{formatarMoeda(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default DetalhesVenda;

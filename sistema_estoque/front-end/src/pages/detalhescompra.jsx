import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";

function formatarMoeda(valor) {
  return `R$ ${Number.parseFloat(valor || 0).toFixed(2)}`;
}

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
        setErro("Nao foi possivel carregar os detalhes da compra.");
        setCompra(null);
      })
      .finally(() => setCarregando(false));
  }, [id]);

  if (carregando) {
    return <div style={{ color: "white", padding: "30px" }}>Carregando compra...</div>;
  }

  if (erro) {
    return (
      <div style={{ color: "white", padding: "30px" }}>
        <p style={{ color: "red" }}>{erro}</p>
        <Link to="/compras" style={{ color: "#60a5fa" }}>
          Voltar para compras
        </Link>
      </div>
    );
  }

  if (!compra) {
    return null;
  }

  const itens = compra.itens || [];

  return (
    <div style={{ color: "white", padding: "30px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "20px", alignItems: "center" }}>
        <div>
          <h1>Detalhes da Compra</h1>
          <p style={{ color: "#aaa" }}>Compra {compra.id_compra}</p>
        </div>

        <Link to="/compras" style={{ color: "#60a5fa" }}>
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
          <strong>Fornecedor</strong>
          <p>{compra.fornecedor_nome || compra.fornecedor}</p>
        </div>
        <div>
          <strong>Funcionario</strong>
          <p>{compra.funcionario_nome || compra.funcionario}</p>
        </div>
        <div>
          <strong>Data da Compra</strong>
          <p>{compra.data_compra}</p>
        </div>
        <div>
          <strong>Status</strong>
          <p>{compra.status || "Sem status"}</p>
        </div>
        <div>
          <strong>Entregue</strong>
          <p>{compra.entregue ? "Sim" : "Nao"}</p>
        </div>
        <div>
          <strong>Nota Fiscal</strong>
          <p>{compra.nota_fiscal || "Nao informada"}</p>
        </div>
        <div>
          <strong>Valor Total</strong>
          <p style={{ color: "#4ade80", fontWeight: "bold" }}>{formatarMoeda(compra.valor_total)}</p>
        </div>
      </div>

      <h2 style={{ marginTop: "30px" }}>Produtos da Compra</h2>

      {itens.length === 0 ? (
        <p>Nenhum item vinculado a esta compra.</p>
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
              <th>Valor Unitario</th>
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
                  <td>{formatarMoeda(total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default DetalhesCompra;

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";

function DetalhesCompra() {
  const { id } = useParams();

  const [compra, setCompra] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    api.get(`/compras/${id}/`)
      .then((res) => {
        setCompra(res.data);
        setErro("");
      })
      .catch(() => {
        setErro("Erro ao carregar compra.");
      });
  }, [id]);

  if (erro) return <p style={{ color: "red" }}>{erro}</p>;
  if (!compra) return <p>Carregando...</p>;

  return (
    <div style={{ color: "white", padding: "30px" }}>
      <h1>Detalhes da Compra</h1>
      <p>Compra {compra.id_compra}</p>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
        <div>
          <strong>Fornecedor</strong>
          <p>{compra.fornecedor_nome}</p>
        </div>

        <div>
          <strong>Funcionário</strong>
          <p>{compra.funcionario_nome}</p>
        </div>

        <div>
          <strong>Data</strong>
          <p>{compra.data_compra}</p>
        </div>

        <div>
          <strong>Status</strong>
          <p>{compra.status}</p>
        </div>

        <div>
          <strong>Entrega</strong>
          <p>{compra.data_entrega ? "✓ Sim" : "✗ Não"}</p>
        </div>

        <div>
          <strong>Total</strong>
          <p style={{ color: "#4ade80" }}>
            R$ {parseFloat(compra.valor_total).toFixed(2)}
          </p>
        </div>
      </div>

      <h2 style={{ marginTop: "30px" }}>Itens da Compra</h2>

      <table
        border="1"
        cellPadding="10"
        style={{ width: "100%", marginTop: "10px", borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th>Produto</th>
            <th>Quantidade</th>
            <th>Preço Unitário</th>
            <th>Subtotal</th>
          </tr>
        </thead>

        <tbody>
          {compra.itens.map((item) => (
            <tr key={item.id_item_compra}>
              <td>{item.produto_nome}</td>
              <td>{item.quantidade_comprada}</td>
              <td>R$ {parseFloat(item.preco_unitario).toFixed(2)}</td>
              <td>
                R$ {(item.quantidade_comprada * item.preco_unitario).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Link to="/compras" style={{ display: "block", marginTop: "20px", color: "#60a5fa" }}>
        Voltar
      </Link>
    </div>
  );
}

export default DetalhesCompra;
import { useEffect, useState } from "react";
import api from "../services/api";

function ItensVenda() {
  const [itensVenda, setItensVenda] = useState([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    api.get("/itens-venda/")
      .then((response) => {
        console.log("Itens de venda:", response.data);

        if (Array.isArray(response.data)) {
          setItensVenda(response.data);
        } else if (response.data.results) {
          setItensVenda(response.data.results);
        } else {
          setItensVenda([]);
        }

        setErro("");
      })
      .catch((error) => {
        console.error("Erro ao buscar itens de venda:", error);
        setErro("Não foi possível carregar os itens de venda.");
      })
      .finally(() => {
        setCarregando(false);
      });
  }, []);

  return (
    <div style={{ color: "white", padding: "30px" }}>
      <h1>Itens de Venda</h1>
      <p>Produtos associados às vendas realizadas.</p>

      {carregando && <p>Carregando itens de venda...</p>}
      {erro && <p style={{ color: "red" }}>{erro}</p>}

      {!carregando && !erro && itensVenda.length === 0 && (
        <p>Nenhum item de venda encontrado.</p>
      )}

      {itensVenda.length > 0 && (
        <table
          border="1"
          cellPadding="10"
          style={{
            borderCollapse: "collapse",
            marginTop: "20px",
            width: "100%",
          }}
        >
          <thead>
            <tr>
              <th>ID</th>
              <th>Venda</th>
              <th>Produto</th>
              <th>Quantidade</th>
              <th>Preço Unitário</th>
              <th>Desconto</th>
              <th>Subtotal</th>
            </tr>
          </thead>

          <tbody>
            {itensVenda.map((item, index) => (
              <tr key={item.id_item_venda || index}>
                <td>{item.id_item_venda || index + 1}</td>
                <td>{item.venda}</td>
                <td>{item.produto}</td>
                <td>{item.quantidade_vendida}</td>
                <td>R$ {item.preco_unitario}</td>
                <td>{item.desconto_aplicado}%</td>
                <td>R$ {item.subtotal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ItensVenda;
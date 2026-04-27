import { useEffect, useState } from "react";
import api from "../services/api";

function Produtos() {
  const [produtos, setProdutos] = useState([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    api.get("/produtos/")
      .then((response) => {
        setErro("");

        if (Array.isArray(response.data)) {
          setProdutos(response.data);
        } else if (response.data.results) {
          setProdutos(response.data.results);
        } else {
          setProdutos([]);
        }
      })
      .catch((error) => {
        console.error("Erro ao buscar produtos:", error);
        setErro("Não foi possível carregar os produtos.");
      });
  }, []);

  return (
    <div style={{ color: "white", padding: "20px" }}>
      <h1>Produtos</h1>

      {erro && <p>{erro}</p>}

      {produtos.length === 0 && !erro ? (
        <p>Nenhum produto encontrado.</p>
      ) : (
        <ul>
          {produtos.map((produto) => (
            <li key={produto.id_produto}>
              {produto.nome} - R$ {produto.preco}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Produtos;
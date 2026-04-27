import { useEffect, useState } from "react";
import api from "../services/api";

function ItensCompra() {
  const [itens, setItens] = useState([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    api.get("/itens-compra/")
      .then((response) => {
        setErro("");

        if (Array.isArray(response.data)) {
          setItens(response.data);
        } else if (response.data.results) {
          setItens(response.data.results);
        } else {
          setItens([]);
        }
      })
      .catch((error) => {
        console.error("Erro ao buscar itens de compra:", error);
        setErro("Não foi possível carregar os itens de compra.");
      });
  }, []);

  return (
    <div style={{ color: "white", padding: "20px" }}>
      <h1>Itens de Compra</h1>

      {erro && <p>{erro}</p>}

      {itens.length === 0 && !erro ? (
        <p>Nenhum item encontrado.</p>
      ) : (
        <ul>
          {itens.map((item) => (
            <li key={item.id_item_compra}>
              Compra: {item.compra} | Produto: {item.produto} | Quantidade: {item.quantidade}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ItensCompra;
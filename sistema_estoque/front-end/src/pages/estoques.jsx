import { useEffect, useState } from "react";
import api from "../services/api";
import Paginacao from "../components/Paginacao";

function Estoques() {
  const [estoques, setEstoques] = useState([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    api.get("/estoques/")
      .then((response) => {
        setErro("");

        if (Array.isArray(response.data)) {
          setEstoques(response.data);
        } else if (response.data.results) {
          setEstoques(response.data.results);
        } else {
          setEstoques([]);
        }
      })
      .catch((error) => {
        console.error("Erro ao buscar estoques:", error);
        setErro("Não foi possível carregar os estoques.");
      });
  }, []);

  return (
    <div style={{ color: "white", padding: "20px" }}>
      <h1>Estoques</h1>

      {erro && <p>{erro}</p>}

      {estoques.length === 0 && !erro ? (
        <p>Nenhum estoque encontrado.</p>
      ) : (
        <ul>
          {estoques.map((estoque) => (
            <li key={estoque.id_estoque}>
              Produto: {estoque.produto} | Atual: {estoque.quantidade_atual} | Mínimo: {estoque.quantidade_minima}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Estoques;